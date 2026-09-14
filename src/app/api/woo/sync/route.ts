export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { wooGetAllProducts, mapWooToProducto, wooUpdateProductsBatch, type WooBatchItem } from '@/lib/woocommerce'

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
// body: { mode: 'stock' | 'precio' | 'ambos', offset?: number, limit?: number }
const WOO_BATCH_MAX = 100 // tope de WooCommerce para /products/batch

export async function POST(req: NextRequest) {
  if (!process.env.WOOCOMMERCE_CONSUMER_KEY) {
    return NextResponse.json({ error: 'WooCommerce no configurado' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const mode: 'stock' | 'precio' | 'ambos' = body.mode ?? 'ambos'
  const offset: number = Number.isFinite(body.offset) ? Math.max(0, body.offset) : 0
  const limit: number = Math.min(WOO_BATCH_MAX, Number.isFinite(body.limit) ? Math.max(1, body.limit) : WOO_BATCH_MAX)

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
  const results = { ok: 0, errors: 0 }
  const failedProducts: { id: string; nombre: string; error: string }[] = []

  if (productos && productos.length > 0) {
    const porWooId = new Map(productos.map(p => [p.woo_product_id as number, p]))
    const items: WooBatchItem[] = productos.map(prod => {
      const item: WooBatchItem = { id: prod.woo_product_id as number }
      if (mode === 'precio' || mode === 'ambos') item.regular_price = String(prod.precio_venta ?? 0)
      if (mode === 'stock' || mode === 'ambos') { item.stock_quantity = prod.stock ?? 0; item.manage_stock = true }
      return item
    })

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

  const processed = productos?.length ?? 0
  const nextOffset = offset + processed
  return NextResponse.json({
    processed,
    ok: results.ok,
    errors: results.errors,
    failedProducts,
    offset,
    nextOffset,
    total,
    done: processed === 0 || nextOffset >= total,
  })
}
