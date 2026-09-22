export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { wooGetAllProducts, mapWooToProducto, wooUpdateProductsBatch, wooGetEstadoPorId, type WooBatchItem, type WooEstado } from '@/lib/woocommerce'

// GET /api/woo/sync — previsualiza productos de WooCommerce vs Supabase
export async function GET() {
  if (!process.env.WOOCOMMERCE_CONSUMER_KEY || !process.env.WOOCOMMERCE_URL) {
    return NextResponse.json(
      { error: 'WooCommerce no configurado. Faltan WOOCOMMERCE_URL y/o WOOCOMMERCE_CONSUMER_KEY en las variables de entorno.' },
      { status: 400 }
    )
  }

  try {
    const [wooProducts, { data: existing }] = await Promise.all([
      wooGetAllProducts(),
      supabase.from('productos').select('woo_product_id').eq('empresa', 'aroma').not('woo_product_id', 'is', null),
    ])

    const existingIds = new Set((existing ?? []).map(p => p.woo_product_id))

    const preview = wooProducts.map(woo => ({
      ...mapWooToProducto(woo),
      ya_importado: existingIds.has(woo.id),
    }))

    return NextResponse.json({ total: preview.length, productos: preview })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al conectar con WooCommerce: ${msg}` }, { status: 500 })
  }
}

// POST /api/woo/sync - sincroniza UNA TANDA de productos de Aroma con
// WooCommerce y devuelve enseguida (pensado para que el cliente lo llame
// repetidas veces con offset creciente, mostrando progreso real, en vez de
// una sola llamada que actualice los ~1000+ productos de punta a punta:
// eso tardaba varios minutos sin devolver nada, así que cualquier timeout
// del hosting/CDN de por medio cortaba la conexión a mitad de camino sin
// que quedara ningún rastro de cuánto se había llegado a sincronizar.
//
// Usa el endpoint /products/batch de WooCommerce (hasta 100 productos por
// llamada, límite propio de WooCommerce) en vez de un PUT por producto:
// con 1136 productos eso son ~12 llamadas a WooCommerce en vez de 1136.
//
// body: { mode: 'stock' | 'precio' | 'ambos', offset?: number, limit?: number,
//         protegerStockWeb?: boolean }
//
// protegerStockWeb (default true): mientras el stock se siga cargando a
// mano en los dos lados (gestión-vinoteca2 Y directo en WooCommerce), un
// sync de stock normal pisaría cualquier número puesto a mano en la web con
// el de Supabase. Con esto activo, un producto que YA tiene stock > 0 en la
// web se salta (no se toca su stock) — solo se completa el stock de los
// que en la web están en 0. Es una medida transitoria hasta que se decida
// cargar el stock desde un solo lado; se puede desactivar mandando
// protegerStockWeb:false para forzar el pisado normal.
const WOO_BATCH_MAX = 100 // tope de WooCommerce para /products/batch

export async function POST(req: NextRequest) {
  if (!process.env.WOOCOMMERCE_CONSUMER_KEY) {
    return NextResponse.json({ error: 'WooCommerce no configurado' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const mode: 'stock' | 'precio' | 'ambos' = body.mode ?? 'ambos'
  const offset: number = Number.isFinite(body.offset) ? Math.max(0, body.offset) : 0
  const limit: number = Math.min(WOO_BATCH_MAX, Number.isFinite(body.limit) ? Math.max(1, body.limit) : WOO_BATCH_MAX)
  const protegerStockWeb: boolean = body.protegerStockWeb !== false
  const tocaStock = mode === 'stock' || mode === 'ambos'

  const base = () => supabase
    .from('productos')
    .select('id, nombre, precio_venta, stock, woo_product_id', { count: 'exact' })
    .eq('empresa', 'aroma')
    .eq('activo', true)
    .not('woo_product_id', 'is', null)
    .order('id')

  const { data: productos, error, count } = await base().range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total = count ?? 0
  const results = { ok: 0, errors: 0, protegidos: 0 }
  const failedProducts: { id: string; nombre: string; error: string }[] = []
  const protegidosDetalle: { id: string; nombre: string; stockWeb: number }[] = []

  if (productos && productos.length > 0) {
    const porWooId = new Map(productos.map(p => [p.woo_product_id as number, p]))

    // Estado ACTUAL en la web de la tanda (precio y stock, un pedido de
    // ~100 ids con solo esos campos). Sirve para dos cosas: no pisar stock
    // cargado a mano (protegerStockWeb) y mandar a WooCommerce solo los
    // productos que realmente cambian — antes se reescribian los ~1000
    // aunque cambiaran 7, y cada escritura en WordPress es lenta.
    let webPorId = new Map<number, WooEstado>()
    try {
      webPorId = await wooGetEstadoPorId(productos.map(p => p.woo_product_id as number))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      return NextResponse.json({ error: `No se pudo leer el estado actual de la web: ${msg}`, offset, total }, { status: 502 })
    }

    const items: WooBatchItem[] = []
    for (const prod of productos) {
      const wooId = prod.woo_product_id as number
      const web = webPorId.get(wooId)
      const item: WooBatchItem = { id: wooId }
      let algoParaActualizar = false

      if (mode === 'precio' || mode === 'ambos') {
        const precioNuevo = prod.precio_venta ?? 0
        if (!web || web.precio !== precioNuevo) {
          item.regular_price = String(precioNuevo)
          algoParaActualizar = true
        }
      }

      if (tocaStock) {
        const stockActualWeb = web?.stock ?? 0
        const protegido = protegerStockWeb && stockActualWeb > 0
        if (protegido) {
          results.protegidos++
          protegidosDetalle.push({ id: prod.id, nombre: prod.nombre, stockWeb: stockActualWeb })
        } else if (!web || stockActualWeb !== (prod.stock ?? 0)) {
          item.stock_quantity = prod.stock ?? 0
          item.manage_stock = true
          algoParaActualizar = true
        }
      }

      if (algoParaActualizar) items.push(item)
    }

    if (items.length > 0) {
      try {
        const resultado = await wooUpdateProductsBatch(items)
        for (const r of resultado) {
          if (r.error) {
            results.errors++
            const prod = porWooId.get(r.id)
            failedProducts.push({ id: prod?.id ?? String(r.id), nombre: prod?.nombre ?? `Woo #${r.id}`, error: r.error.message })
          } else {
            results.ok++
          }
        }
        // Por si WooCommerce devolviera menos items de los pedidos (no debería,
        // pero mejor no perder silenciosamente productos sin contabilizar).
        const sinRespuesta = items.length - resultado.length
        if (sinRespuesta > 0) results.errors += sinRespuesta
      } catch (e) {
        // Todo el lote falló (ej. WooCommerce caído momentáneamente): se
        // reporta como error de la tanda completa, sin cortar el conteo total
        // — el cliente puede reintentar desde este mismo offset.
        const msg = e instanceof Error ? e.message : 'Error desconocido'
        return NextResponse.json({ error: msg, offset, total }, { status: 502 })
      }
    }
  }

  const processed = productos?.length ?? 0
  const nextOffset = offset + processed
  return NextResponse.json({
    processed,
    ok: results.ok,
    errors: results.errors,
    protegidos: results.protegidos,
    protegidosDetalle,
    failedProducts,
    offset,
    nextOffset,
    total,
    done: processed === 0 || nextOffset >= total,
  })
}
