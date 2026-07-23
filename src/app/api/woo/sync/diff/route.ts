export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { wooGetAllProducts } from '@/lib/woocommerce'

// GET /api/woo/sync/diff?mode=stock|precio|ambos
// Calcula, SIN escribir nada, qué productos vinculados a WooCommerce van a
// cambiar realmente si se corre el sync (compara el valor actual en la web
// contra el valor en Supabase). Se usa para mostrarle al usuario la lista
// antes de confirmar.
export async function GET(req: NextRequest) {
  if (!process.env.WOOCOMMERCE_CONSUMER_KEY || !process.env.WOOCOMMERCE_URL) {
    return NextResponse.json({ error: 'WooCommerce no configurado' }, { status: 400 })
  }

  const mode = (req.nextUrl.searchParams.get('mode') ?? 'ambos') as 'stock' | 'precio' | 'ambos'

  try {
    const [woo, { data: productos, error }] = await Promise.all([
      wooGetAllProducts(),
      supabase
        .from('productos')
        .select('id, nombre, precio_venta, stock, woo_product_id')
        .eq('empresa', 'aroma')
        .eq('activo', true)
        .not('woo_product_id', 'is', null),
    ])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const wooPorId = new Map(woo.map(w => [w.id, w]))

    const cambios: {
      nombre: string
      stockActual?: number; stockNuevo?: number
      precioActual?: number; precioNuevo?: number
    }[] = []
    let sinCambios = 0
    let sinEncontrarEnWeb = 0

    for (const p of productos ?? []) {
      const w = wooPorId.get(p.woo_product_id)
      if (!w) { sinEncontrarEnWeb++; continue }

      const stockActual = w.stock_quantity ?? 0
      const stockNuevo = p.stock ?? 0
      const precioActual = parseFloat(w.regular_price || w.price || '0') || 0
      const precioNuevo = p.precio_venta ?? 0

      const cambiaStock = (mode === 'stock' || mode === 'ambos') && stockActual !== stockNuevo
      const cambiaPrecio = (mode === 'precio' || mode === 'ambos') && precioActual !== precioNuevo

      if (!cambiaStock && !cambiaPrecio) { sinCambios++; continue }

      cambios.push({
        nombre: p.nombre,
        ...(mode === 'stock' || mode === 'ambos' ? { stockActual, stockNuevo } : {}),
        ...(mode === 'precio' || mode === 'ambos' ? { precioActual, precioNuevo } : {}),
      })
    }

    return NextResponse.json({
      resumen: {
        total_vinculados: productos?.length ?? 0,
        cambios: cambios.length,
        sin_cambios: sinCambios,
        sin_encontrar_en_web: sinEncontrarEnWeb,
      },
      cambios,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al conectar con WooCommerce: ${msg}` }, { status: 500 })
  }
}
