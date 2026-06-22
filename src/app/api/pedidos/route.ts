export const dynamic = 'force-dynamic'
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
  const { verificarStock, _dryRun, ...pedido } = body

  // Verificar stock primero (antes de insertar nada)
  const stockStatus: Record<string, { disponible: number; pedido: number; ok: boolean }> = {}
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

  // Dry run: solo devolver el stockStatus sin crear el pedido
  if (_dryRun) return NextResponse.json({ stockStatus })

  // Generar número e insertar
  const { count } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact', head: true })
    .eq('empresa', pedido.empresa)

  pedido.numero = `PED-${String((count || 0) + 1).padStart(6, '0')}`

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

  // Si se está marcando como entregado, descontar stock (solo una vez)
  if (rest.estado === 'entregado') {
    const { data: current } = await supabase
      .from('pedidos')
      .select('estado, items, empresa')
      .eq('id', id)
      .single()

    if (current && current.estado !== 'entregado') {
      const items = current.items as { producto_id: string; nombre: string; cantidad: number }[]
      await Promise.all(
        items.filter(i => i.producto_id).map(async (item) => {
          const { data: prod } = await supabase
            .from('productos')
            .select('stock')
            .eq('id', item.producto_id)
            .single()
          if (prod) {
            const nuevoStock = Math.max(0, (prod.stock ?? 0) - item.cantidad)
            await supabase.from('productos').update({ stock: nuevoStock }).eq('id', item.producto_id)
            await supabase.from('movimientos_stock').insert([{
              producto_id: item.producto_id,
              empresa: current.empresa,
              tipo: 'salida',
              cantidad: item.cantidad,
              motivo: `Pedido entregado — ${id}`,
            }])
          }
        })
      )
    }
  }

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
