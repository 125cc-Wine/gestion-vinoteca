export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { wooUpdateStockAndPrice } from '@/lib/woocommerce'

function otraEmpresa(empresa: string) {
  return empresa === 'aroma' ? 'lavid' : 'aroma'
}

// GET /api/productos?empresa=aroma
// GET /api/productos?empresa=aroma&barcode=7790123456789
export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  const barcode = req.nextUrl.searchParams.get('barcode')
  if (barcode) {
    const clean = barcode.trim()
    const { data } = await supabase
      .from('productos')
      .select('*')
      .eq('empresa', empresa)
      .eq('activo', true)
      .or(`codigo_barras.eq.${clean},sku.eq.${clean}`)
      .limit(1)
      .maybeSingle()
    return NextResponse.json(data ?? null)
  }

  // Supabase tiene max_rows=1000; paginamos hasta traer todos
  const PAGE = 1000
  let all: unknown[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('empresa', empresa)
      .eq('activo', true)
      .order('nombre')
      .range(from, from + PAGE - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return NextResponse.json(all)
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

  // Sincronizar con la otra empresa
  const otra = otraEmpresa(data.empresa)
  const camposSync = {
    nombre: data.nombre,
    precio_venta: data.precio_venta,
    precio_costo: data.precio_costo,
    stock: data.stock,
    varietal: data.varietal,
    bodega: data.bodega,
    proveedor_nombre: data.proveedor_nombre,
    codigo_barras: data.codigo_barras,
    sku: data.sku,
  }

  const { data: contraparte } = await supabase
    .from('productos')
    .select('id')
    .eq('nombre', data.nombre)
    .eq('empresa', otra)
    .single()

  if (contraparte) {
    await supabase.from('productos').update(camposSync).eq('id', contraparte.id)
  } else {
    await supabase.from('productos').insert([{ ...camposSync, empresa: otra, activo: true }])
  }

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

  // Sincronizar con la otra empresa
  const otra = otraEmpresa(data.empresa)
  const camposSync: Record<string, unknown> = {}
  for (const k of ['precio_venta', 'precio_costo', 'stock', 'varietal', 'bodega', 'proveedor_nombre', 'codigo_barras', 'sku'] as const) {
    if (k in rest) camposSync[k] = (rest as Record<string, unknown>)[k]
  }

  if (Object.keys(camposSync).length > 0) {
    const { data: contraparte } = await supabase
      .from('productos')
      .select('id')
      .eq('nombre', data.nombre)
      .eq('empresa', otra)
      .single()

    if (contraparte) {
      await supabase.from('productos').update(camposSync).eq('id', contraparte.id)
    } else {
      await supabase.from('productos').insert([{
        nombre: data.nombre,
        empresa: otra,
        activo: true,
        precio_venta: data.precio_venta,
        precio_costo: data.precio_costo,
        stock: data.stock,
        varietal: data.varietal,
        bodega: data.bodega,
        proveedor_nombre: data.proveedor_nombre,
        ...camposSync,
      }])
    }
  }

  // Solo sincronizar a WooCommerce si cambió precio_venta o stock
  if (
    ('precio_venta' in rest || 'stock' in rest) &&
    data.woo_product_id &&
    process.env.WOOCOMMERCE_CONSUMER_KEY &&
    process.env.WOOCOMMERCE_CONSUMER_KEY !== 'ck_tu_clave_aqui' &&
    data.empresa === 'aroma'
  ) {
    try {
      await wooUpdateStockAndPrice(data.woo_product_id, data.precio_venta, data.stock)
    } catch (wooErr) {
      console.error('WooCommerce sync error:', wooErr)
      return NextResponse.json({ ...data, woo_sync: 'error' })
    }
  }

  return NextResponse.json({ ...data, woo_sync: data.woo_product_id ? 'ok' : 'no_woo' })
}

// DELETE /api/productos
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  // Leer el producto para encontrar la contraparte
  const { data: prod } = await supabase
    .from('productos')
    .select('nombre, empresa')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('productos')
    .update({ activo: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Borrar contraparte en la otra empresa
  if (prod) {
    const otra = otraEmpresa(prod.empresa)
    await supabase
      .from('productos')
      .update({ activo: false })
      .eq('nombre', prod.nombre)
      .eq('empresa', otra)
  }

  return NextResponse.json({ ok: true })
}
