export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { wooUpdateProduct, wooGetAllProducts, mapWooToProducto } from '@/lib/woocommerce'

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

// POST /api/woo/sync - sincroniza productos de Aroma con WooCommerce
// body: { mode: 'stock' | 'precio' | 'ambos' }
export async function POST(req: NextRequest) {
  if (!process.env.WOOCOMMERCE_CONSUMER_KEY) {
    return NextResponse.json({ error: 'WooCommerce no configurado' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const mode: 'stock' | 'precio' | 'ambos' = body.mode ?? 'ambos'

  const { data: productos, error } = await supabase
    .from('productos')
    .select('*')
    .eq('empresa', 'aroma')
    .eq('activo', true)
    .not('woo_product_id', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results = { ok: 0, errors: 0 }

  for (const prod of productos ?? []) {
    try {
      const payload: { regular_price?: string; stock_quantity?: number; manage_stock?: boolean } = {}
      if (mode === 'precio' || mode === 'ambos') payload.regular_price = String(prod.precio_venta ?? 0)
      if (mode === 'stock'  || mode === 'ambos') { payload.stock_quantity = prod.stock ?? 0; payload.manage_stock = true }
      await wooUpdateProduct(prod.woo_product_id, payload)
      results.ok++
    } catch (e) {
      console.error(`Error sync producto ${prod.id}:`, e)
      results.errors++
    }
  }

  return NextResponse.json({ message: 'Sincronización completa', ...results, total: productos?.length ?? 0 })
}
