import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { wooUpdateStockAndPrice } from '@/lib/woocommerce'

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
