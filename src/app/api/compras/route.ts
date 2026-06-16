export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  const { data, error } = await supabase
    .from('compras')
    .select('*')
    .eq('empresa', empresa)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { empresa, proveedor_id, proveedor_nombre, items, notas, fecha_esperada } = body

  if (!empresa || !proveedor_nombre || !items?.length) {
    return NextResponse.json({ error: 'faltan campos' }, { status: 400 })
  }

  const { count } = await supabase
    .from('compras').select('*', { count: 'exact', head: true }).eq('empresa', empresa)

  const numero = `OC-${String((count || 0) + 1).padStart(5, '0')}`
  const total = items.reduce((a: number, i: { subtotal: number }) => a + (i.subtotal || 0), 0)

  const { data, error } = await supabase.from('compras').insert([{
    empresa, numero, proveedor_id: proveedor_id || null, proveedor_nombre,
    items, total, notas: notas || '', fecha_esperada: fecha_esperada || null,
    estado: 'pendiente',
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, estado, items: itemsRecibidos, ...rest } = body

  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('compras').update({ estado, items: itemsRecibidos, ...rest }).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Al marcar como recibido: incrementar stock de productos
  if (estado === 'recibido' && itemsRecibidos?.length) {
    for (const item of itemsRecibidos as { producto_id?: string; nombre: string; cantidad: number }[]) {
      if (!item.producto_id) continue
      const { data: prod } = await supabase
        .from('productos').select('id, stock, nombre, empresa').eq('id', item.producto_id).single()
      if (!prod) continue

      const nuevoStock = (prod.stock || 0) + item.cantidad
      await supabase.from('productos').update({ stock: nuevoStock }).eq('id', prod.id)

      // Sync contraparte
      const otra = prod.empresa === 'aroma' ? 'lavid' : 'aroma'
      const { data: contra } = await supabase
        .from('productos').select('id, stock').eq('nombre', prod.nombre).eq('empresa', otra).single()
      if (contra) {
        await supabase.from('productos').update({ stock: nuevoStock }).eq('id', contra.id)
      }
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  const { error } = await supabase.from('compras').update({ estado: 'cancelado' }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
