import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { wooUpdateStockAndPrice } from '@/lib/woocommerce'

// GET /api/productos?empresa=aroma
export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('empresa', empresa)
    .eq('activo', true)
    .order('nombre')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/productos
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('productos')
    .insert([body])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PUT /api/productos
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body

  const { data, error } = await supabase
    .from('productos')
    .update(rest)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si tiene woo_product_id y hay credenciales WooCommerce, sincronizar
  if (
    data.woo_product_id &&
    process.env.WOOCOMMERCE_CONSUMER_KEY &&
    data.empresa === 'aroma'
  ) {
    try {
      await wooUpdateStockAndPrice(data.woo_product_id, data.precio_venta, data.stock)
    } catch (wooErr) {
      console.error('WooCommerce sync error:', wooErr)
      // No fallar si WooCommerce falla — el dato ya se guardó en Supabase
      return NextResponse.json({ ...data, woo_sync: 'error' })
    }
  }

  return NextResponse.json({ ...data, woo_sync: data.woo_product_id ? 'ok' : 'no_woo' })
}

// DELETE /api/productos
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabase
    .from('productos')
    .update({ activo: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
