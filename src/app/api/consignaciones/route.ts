export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { conSyncStockWeb } from '@/lib/woo-stock-cola'
import { ajustarStock, crearConsignacion, type ConsItem } from '@/lib/consignaciones'


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

async function postHandler(req: NextRequest) {
  const body = await req.json()
  const r = await crearConsignacion(body)
  if (r.error) return NextResponse.json({ error: r.error }, { status: 500 })
  return NextResponse.json(r.data)
}

async function putHandler(req: NextRequest) {
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
      if (delta !== 0) await ajustarStock(pid, delta, `Consignación ${data.numero} — edición de ítems`)
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
        await ajustarStock(item.producto_id, qty, `Consignación ${data.numero} devuelta`)
      }
    } else if (nuevoEstado === 'liquidada') {
      // Return only what wasn't sold: cantidad - cantidad_vendida
      for (const item of items) {
        if (!item.producto_id) continue
        const qty = (item.cantidad || 0) - (item.cantidad_vendida || 0)
        if (qty <= 0) continue
        await ajustarStock(item.producto_id, qty, `Consignación ${data.numero} liquidada`)
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

async function deleteHandler(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  // Si se borra una consignación todavía "activa" (o "parcial"), la
  // mercadería consignada sigue afuera — hay que devolverla al stock antes
  // de borrar el registro, si no desaparece del sistema para siempre.
  const { data: cons } = await supabase.from('consignaciones').select('numero, estado, items').eq('id', id).single()
  if (cons && (cons.estado === 'activa' || cons.estado === 'parcial') && Array.isArray(cons.items)) {
    for (const item of cons.items as ConsItem[]) {
      if (!item.producto_id) continue
      const pendiente = (item.cantidad || 0) - (item.cantidad_vendida || 0)
      if (pendiente > 0) await ajustarStock(item.producto_id, pendiente, `Consignación ${cons.numero} borrada`)
    }
  }

  const { error } = await supabase.from('consignaciones').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Después de responder, manda a la web el stock de los productos que
// cambiaron (solo esos) — ver src/lib/woo-stock-cola.ts
export const POST = conSyncStockWeb(postHandler)
export const PUT = conSyncStockWeb(putHandler)
export const DELETE = conSyncStockWeb(deleteHandler)
