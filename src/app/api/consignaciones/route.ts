export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  const estado = req.nextUrl.searchParams.get('estado')

  let query = supabase
    .from('consignaciones')
    .select('*')
    .eq('empresa', empresa)
    .order('created_at', { ascending: false })

  if (estado) query = query.eq('estado', estado)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Auto-number CONS-00001
  const { count } = await supabase
    .from('consignaciones')
    .select('*', { count: 'exact', head: true })
    .eq('empresa', body.empresa)

  const numero = `CONS-${String((count || 0) + 1).padStart(5, '0')}`

  // Total = sum of items (cantidad * precio_unitario)
  const items = body.items || []
  const total = items.reduce(
    (acc: number, item: { cantidad: number; precio_unitario: number }) =>
      acc + (item.cantidad || 0) * (item.precio_unitario || 0),
    0
  )

  const payload = { ...body, numero, total }

  const { data, error } = await supabase
    .from('consignaciones')
    .insert([payload])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body

  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  // Read current consignacion to detect estado change
  const { data: current } = await supabase
    .from('consignaciones')
    .select('estado, items')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('consignaciones')
    .update(rest)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const nuevoEstado = rest.estado
  const estadoAnterior = current?.estado

  // Stock adjustments on estado change
  if (nuevoEstado && nuevoEstado !== estadoAnterior) {
    const items: Array<{
      producto_id: string
      cantidad: number
      cantidad_vendida: number
      precio_unitario: number
    }> = rest.items || current?.items || []

    if (nuevoEstado === 'devuelta') {
      // Return all items to stock
      for (const item of items) {
        if (!item.producto_id) continue
        const { data: prod } = await supabase
          .from('productos')
          .select('id,stock')
          .eq('id', item.producto_id)
          .single()
        if (prod) {
          await supabase
            .from('productos')
            .update({ stock: (prod.stock || 0) + item.cantidad })
            .eq('id', prod.id)
        }
      }
    } else if (nuevoEstado === 'liquidada') {
      // Return only what wasn't sold: cantidad - cantidad_vendida
      for (const item of items) {
        if (!item.producto_id) continue
        const qty = (item.cantidad || 0) - (item.cantidad_vendida || 0)
        if (qty <= 0) continue
        const { data: prod } = await supabase
          .from('productos')
          .select('id,stock')
          .eq('id', item.producto_id)
          .single()
        if (prod) {
          await supabase
            .from('productos')
            .update({ stock: (prod.stock || 0) + qty })
            .eq('id', prod.id)
        }
      }
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabase.from('consignaciones').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
