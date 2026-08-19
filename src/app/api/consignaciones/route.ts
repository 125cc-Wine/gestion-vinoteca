export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ConsItem {
  producto_id: string
  cantidad: number
  cantidad_vendida?: number
  precio_unitario?: number
}

// Ajusta el stock de un producto (delta positivo o negativo) y sincroniza la
// contraparte en la otra empresa — mismo patrón que usan ventas y compras
// para el depósito compartido. Clampeado en 0 para no ir a negativo.
async function ajustarStock(productoId: string, delta: number) {
  const { data: prod } = await supabase.from('productos').select('id, stock, nombre, empresa').eq('id', productoId).single()
  if (!prod) return
  const nuevoStock = Math.max(0, (prod.stock || 0) + delta)
  await supabase.from('productos').update({ stock: nuevoStock }).eq('id', prod.id)
  const otra = prod.empresa === 'aroma' ? 'lavid' : 'aroma'
  const { data: contra } = await supabase.from('productos').select('id').eq('nombre', prod.nombre).eq('empresa', otra).single()
  if (contra) await supabase.from('productos').update({ stock: nuevoStock }).eq('id', contra.id)
}

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
  const items: ConsItem[] = body.items || []
  const total = items.reduce(
    (acc, item) => acc + (item.cantidad || 0) * (item.precio_unitario || 0),
    0
  )

  const payload = { ...body, numero, total }

  const { data, error } = await supabase
    .from('consignaciones')
    .insert([payload])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // La mercadería consignada sale físicamente del depósito — antes esto
  // nunca descontaba stock, así que al liquidar/devolver (que sí sumaban de
  // vuelta lo no vendido) el stock quedaba inflado con unidades que jamás
  // se habían restado.
  for (const item of items) {
    if (!item.producto_id) continue
    await ajustarStock(item.producto_id, -(item.cantidad || 0))
  }

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
    const items: ConsItem[] = rest.items || current?.items || []

    if (nuevoEstado === 'devuelta') {
      // Se devuelve todo lo que no se vendió (lo vendido ya salió de verdad,
      // no corresponde reingresarlo).
      for (const item of items) {
        if (!item.producto_id) continue
        const qty = (item.cantidad || 0) - (item.cantidad_vendida || 0)
        if (qty <= 0) continue
        await ajustarStock(item.producto_id, qty)
      }
    } else if (nuevoEstado === 'liquidada') {
      // Return only what wasn't sold: cantidad - cantidad_vendida
      for (const item of items) {
        if (!item.producto_id) continue
        const qty = (item.cantidad || 0) - (item.cantidad_vendida || 0)
        if (qty <= 0) continue
        await ajustarStock(item.producto_id, qty)
      }
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  // Si se borra una consignación todavía "activa" (o "parcial"), la
  // mercadería consignada sigue afuera — hay que devolverla al stock antes
  // de borrar el registro, si no desaparece del sistema para siempre.
  const { data: cons } = await supabase.from('consignaciones').select('estado, items').eq('id', id).single()
  if (cons && (cons.estado === 'activa' || cons.estado === 'parcial') && Array.isArray(cons.items)) {
    for (const item of cons.items as ConsItem[]) {
      if (!item.producto_id) continue
      const pendiente = (item.cantidad || 0) - (item.cantidad_vendida || 0)
      if (pendiente > 0) await ajustarStock(item.producto_id, pendiente)
    }
  }

  const { error } = await supabase.from('consignaciones').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
