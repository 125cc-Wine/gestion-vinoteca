export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ProductoImport {
  woo_product_id: number
  nombre: string
  sku: string
  bodega: string
  varietal: string
  region: string
  categoria: 'Tinto' | 'Blanco' | 'Rosado' | 'Espumante' | 'Otro'
  precio_venta: number
  stock: number
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const productos: ProductoImport[] = body.productos

  if (!Array.isArray(productos) || productos.length === 0) {
    return NextResponse.json({ error: 'No hay productos para importar' }, { status: 400 })
  }

  const ids = productos.map(p => p.woo_product_id)
  const { data: existing } = await supabase
    .from('productos')
    .select('woo_product_id, activo')
    .eq('empresa', 'aroma')
    .in('woo_product_id', ids)

  const existingMap = new Map((existing ?? []).map(p => [p.woo_product_id, p]))
  const nuevos = productos.filter(p => !existingMap.has(p.woo_product_id))
  const reactivar = productos.filter(p => existingMap.get(p.woo_product_id)?.activo === false)

  if (nuevos.length === 0 && reactivar.length === 0) {
    return NextResponse.json({ imported: 0, message: 'Todos ya estaban importados' })
  }

  let imported = 0

  if (nuevos.length > 0) {
    const rows = nuevos.map(p => ({
      empresa: 'aroma',
      nombre: p.nombre,
      bodega: p.bodega || '',
      varietal: p.varietal || '',
      region: p.region || '',
      sku: p.sku || '',
      categoria: p.categoria || 'Otro',
      precio_venta: p.precio_venta || 0,
      precio_mayorista: 0,
      precio_costo: 0,
      stock: p.stock || 0,
      stock_minimo: 3,
      woo_product_id: p.woo_product_id,
      activo: true,
    }))
    const { data, error } = await supabase.from('productos').insert(rows).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    imported += data?.length ?? 0
  }

  if (reactivar.length > 0) {
    await supabase
      .from('productos')
      .update({ activo: true })
      .eq('empresa', 'aroma')
      .in('woo_product_id', reactivar.map(p => p.woo_product_id))
    imported += reactivar.length
  }

  return NextResponse.json({ imported })
}
