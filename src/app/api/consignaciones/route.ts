export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ConsItem {
  producto_id: string
  nombre?: string
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

  // Si la ficha del cliente tiene cargada otra empresa, corregirla acá —
  // mismo fix que /api/ventas, para que no quede invisible/sin explicación
  // en el listado de Clientes de la empresa donde realmente opera.
  if (body.cliente_id) {
    const { data: cli } = await supabase.from('clientes').select('empresa').eq('id', body.cliente_id).single()
    if (cli && cli.empresa !== body.empresa) {
      await supabase.from('clientes').update({ empresa: body.empresa }).eq('id', body.cliente_id)
    }
  }

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
  if (!current) return NextResponse.json({ error: 'Consignación no encontrada' }, { status: 404 })

  const nuevoEstado = rest.estado
  const estadoAnterior = current.estado
  // Edición de ítems mientras sigue "activa" (agregar/sacar productos,
  // cambiar cantidades) — distinto de liquidar/devolver, que también mandan
  // "items" pero junto con un cambio de estado.
  const esEdicionDeItems = Array.isArray(rest.items) && (nuevoEstado === undefined || nuevoEstado === estadoAnterior) && estadoAnterior === 'activa'

  if (esEdicionDeItems) {
    // Edición libre: se permite bajar/sacar un ítem aunque tenga ventas
    // registradas — el que edita es responsable de que los números cierren.
    const newItems: ConsItem[] = rest.items
    rest.total = newItems.reduce((s, it) => s + (it.cantidad || 0) * (it.precio_unitario || 0), 0)
  }

  const { data, error } = await supabase
    .from('consignaciones')
    .update(rest)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (esEdicionDeItems) {
    // Reconciliar stock por la diferencia: si un producto sale con más
    // cantidad que antes, se descuenta más del depósito; si sale con menos
    // (o se saca del todo), se devuelve la diferencia.
    const oldMap = new Map((current.items as ConsItem[] || []).map(i => [i.producto_id, i.cantidad || 0]))
    const newMap = new Map((rest.items as ConsItem[]).map(i => [i.producto_id, i.cantidad || 0]))
    const todosLosIds = new Set(Array.from(oldMap.keys()).concat(Array.from(newMap.keys())))
    for (const pid of Array.from(todosLosIds)) {
      if (!pid) continue
      const delta = (oldMap.get(pid) || 0) - (newMap.get(pid) || 0)
      if (delta !== 0) await ajustarStock(pid, delta)
    }
    return NextResponse.json(data)
  }

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

      // Lo vendido en consignación se carga a la cuenta corriente del
      // cliente — antes esto no generaba ningún movimiento, así que si el
      // cliente no pagaba ahí mismo en el momento de liquidar, esa plata
      // desaparecía del sistema sin dejar rastro de deuda.
      const totalVendido = items.reduce((s, it) => s + (it.cantidad_vendida || 0) * (it.precio_unitario || 0), 0)
      if (totalVendido > 0.01 && data.cliente_id) {
        const { data: cliente } = await supabase.from('clientes').select('saldo').eq('id', data.cliente_id).single()
        const saldoAnterior = cliente?.saldo || 0
        const saldoNuevo = saldoAnterior + totalVendido
        await supabase.from('clientes').update({ saldo: saldoNuevo }).eq('id', data.cliente_id)
        await supabase.from('movimientos_cta_cte').insert([{
          cliente_id: data.cliente_id,
          empresa: data.empresa,
          tipo: 'cargo',
          concepto: `Consignación ${data.numero} liquidada`,
          monto: totalVendido,
          saldo_anterior: saldoAnterior,
          saldo_nuevo: saldoNuevo,
          referencia_id: id,
        }])
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
