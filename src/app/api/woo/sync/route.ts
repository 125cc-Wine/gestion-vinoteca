export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { wooUpdateStockAndPrice, wooGetAllProducts, mapWooToProducto } from '@/lib/woocommerce'

// GET /api/woo/sync — previsualiza productos de WooCommerce vs Supabase
export async function GET() {
  if (!process.env.WOOCOMMERCE_CONSUMER_KEY) {
    return NextResponse.json({ error: 'WooCommerce no configurado' }, { status: 400 })
  }

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
}

// POST /api/woo/sync - sincroniza todos los productos de Aroma con WooCommerce
export async function POST(req: NextRequest) {
  if (!process.env.WOOCOMMERCE_CONSUMER_KEY) {
    return NextResponse.json({ error: 'WooCommerce no configurado' }, { status: 400 })
  }

  const { data: productos, error } = await supabase
    .from('productos')
    .select('*')
    .eq('empresa', 'aroma')
    .eq('activo', true)
    .not('woo_product_id', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results = { ok: 0, errors: 0, skipped: 0 }

  for (const prod of productos ?? []) {
    try {
      await wooUpdateStockAndPrice(prod.woo_product_id, prod.precio_venta, prod.stock)
      results.ok++
    } catch (e) {
      console.error(`Error sync producto ${prod.id}:`, e)
      results.errors++
    }
  }

  return NextResponse.json({
    message: `Sincronización completa`,
    ...results,
    total: productos?.length ?? 0,
  })
}
