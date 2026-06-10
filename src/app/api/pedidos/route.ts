import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('empresa', empresa)
    .neq('estado', 'cancelado')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { verificarStock, ...pedido } = body

  // Generar número
  const { count } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact', head: true })
    .eq('empresa', pedido.empresa)

  pedido.numero = `PED-${String((count || 0) + 1).padStart(6, '0')}`

  // Verificar stock si se pidió
  let stockStatus: Record<string, { disponible: number; pedido: number; ok: boolean }> = {}
  if (verificarStock && pedido.items) {
    for (const item of pedido.items) {
      if (item.producto_id) {
        const { data: prod } = await supabase
          .from('productos')
          .select('stock, nombre')
          .eq('id', item.producto_id)
          .single()

        if (prod) {
          stockStatus[item.producto_id] = {
            disponible: prod.stock,
            pedido: item.cantidad,
            ok: prod.stock >= item.cantidad,
          }
        }
      }
    }
  }

  const { data, error } = await supabase
    .from('pedidos')
    .insert([pedido])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, stockStatus })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body

  const { data, error } = await supabase
    .from('pedidos')
    .update(rest)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabase
    .from('pedidos')
    .update({ estado: 'cancelado' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
