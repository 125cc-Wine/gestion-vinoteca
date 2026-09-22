export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { wooGetEstadoPorId } from '@/lib/woocommerce'

// GET /api/woo/sync/diff?mode=stock|precio|ambos&protegerStockWeb=true|false
// Calcula, SIN escribir nada, qué productos vinculados a WooCommerce van a
// cambiar realmente si se corre el sync (compara el valor actual en la web
// contra el valor en Supabase). Se usa para mostrarle al usuario la lista
// antes de confirmar.
//
// protegerStockWeb (default true, igual que en POST /api/woo/sync):
// mientras el stock se cargue a mano en los dos lados, un producto que en
// la web YA tiene stock > 0 se marca como "protegido" en vez de "va a
// cambiar" — el sync real no lo va a tocar.
export async function GET(req: NextRequest) {
  if (!process.env.WOOCOMMERCE_CONSUMER_KEY || !process.env.WOOCOMMERCE_URL) {
    return NextResponse.json({ error: 'WooCommerce no configurado' }, { status: 400 })
  }

  const mode = (req.nextUrl.searchParams.get('mode') ?? 'ambos') as 'stock' | 'precio' | 'ambos'
  const protegerStockWeb = req.nextUrl.searchParams.get('protegerStockWeb') !== 'false'
  const tocaStock = mode === 'stock' || mode === 'ambos'

  try {
    // Supabase corta cada consulta en 1000 filas y hay ~1000 vinculados:
    // se pagina para no dejar productos afuera de la vista previa.
    const productos: { id: string; nombre: string; precio_venta: number | null; stock: number | null; woo_product_id: number }[] = []
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio_venta, stock, woo_product_id')
        .eq('empresa', 'aroma')
        .eq('activo', true)
        .not('woo_product_id', 'is', null)
        .order('id')
        .range(desde, desde + 999)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      productos.push(...(data ?? []))
      if (!data || data.length < 1000) break
    }

    const wooPorId = await wooGetEstadoPorId(productos.map(p => p.woo_product_id))

    const cambios: {
      nombre: string
      stockActual?: number; stockNuevo?: number
      precioActual?: number; precioNuevo?: number
      protegido?: boolean
    }[] = []
    let sinCambios = 0
    let sinEncontrarEnWeb = 0
    let protegidosPorStockWeb = 0

    for (const p of productos) {
      const w = wooPorId.get(p.woo_product_id)
      if (!w) { sinEncontrarEnWeb++; continue }

      const stockActual = w.stock
      const stockNuevo = p.stock ?? 0
      const precioActual = w.precio
      const precioNuevo = p.precio_venta ?? 0

      const protegido = tocaStock && protegerStockWeb && stockActual > 0
      const cambiaStock = tocaStock && !protegido && stockActual !== stockNuevo
      const cambiaPrecio = (mode === 'precio' || mode === 'ambos') && precioActual !== precioNuevo

      if (protegido && !cambiaPrecio) { protegidosPorStockWeb++; continue }
      if (!cambiaStock && !cambiaPrecio) { sinCambios++; continue }

      cambios.push({
        nombre: p.nombre,
        ...(tocaStock && !protegido ? { stockActual, stockNuevo } : {}),
        ...(mode === 'precio' || mode === 'ambos' ? { precioActual, precioNuevo } : {}),
        ...(protegido ? { protegido: true } : {}),
      })
    }

    return NextResponse.json({
      resumen: {
        total_vinculados: productos.length,
        cambios: cambios.length,
        sin_cambios: sinCambios,
        sin_encontrar_en_web: sinEncontrarEnWeb,
        protegidos_por_stock_web: protegidosPorStockWeb,
      },
      cambios,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al conectar con WooCommerce: ${msg}` }, { status: 500 })
  }
}
