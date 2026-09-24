export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { conSyncStockWeb } from '@/lib/woo-stock-cola'
import { medioPagoDesdeCondicion, descontarStockItems, devolverStockItems, crearVenta } from '@/lib/ventas'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })
  const clienteId = req.nextUrl.searchParams.get('cliente_id')

  const PAGE = 1000
  let all: unknown[] = []
  let from = 0
  while (true) {
    let query = supabase
      .from('ventas')
      .select('*')
      .eq('empresa', empresa)
      .neq('estado', 'cancelado')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1)
    if (clienteId) query = query.eq('cliente_id', clienteId)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return NextResponse.json(all)
}

async function postHandler(req: NextRequest) {
  const r = await crearVenta(await req.json())
  if (r.error) return NextResponse.json({ error: r.error }, { status: 500 })
  return NextResponse.json(r.data)
}

async function putHandler(req: NextRequest) {
  const body = await req.json()
  const { id, descontarStock: _ds, devolverStock: _dvs, convertirARemito, ...rest } = body

  const { data: anterior, error: errAnterior } = await supabase
    .from('ventas')
    .select('estado_pago, total, cliente_id, empresa, numero, tipo')
    .eq('id', id)
    .single()
  if (errAnterior || !anterior) return NextResponse.json({ error: errAnterior?.message || 'Venta no encontrada' }, { status: 404 })

  const { data, error } = await supabase
    .from('ventas')
    .update(rest)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // "Convertir a remito": un presupuesto que en verdad ya se entregó. Recién
  // acá se descuenta el stock (los presupuestos nunca lo tocan) — se guarda
  // contra anterior.tipo, no contra rest.tipo, para no volver a descontar si
  // por lo que sea se llama de nuevo sobre una venta que ya es remito.
  if (convertirARemito && anterior.tipo === 'presupuesto' && Array.isArray(data?.items)) {
    await descontarStockItems(data.items)
  }

  // Reconciliar cuenta corriente: si el estado de pago o el total cambiaron
  // al editar, hay que ajustar clientes.saldo y dejar registro en
  // movimientos_cta_cte — antes esto solo pasaba al crear o al cobrar desde
  // /api/ventas/cobrar, así que editar el estado a mano dejaba el saldo del
  // cliente desactualizado (comprobantes ya pagados seguían sumando deuda).
  const clienteId = rest.cliente_id ?? anterior.cliente_id
  const totalNuevo = rest.total ?? anterior.total
  const estadoAnterior = anterior.estado_pago
  const estadoNuevo = rest.estado_pago ?? estadoAnterior
  const eraCC = estadoAnterior === 'cuenta_corriente'
  const esCC = estadoNuevo === 'cuenta_corriente'

  if (clienteId && (eraCC !== esCC || (eraCC && esCC && totalNuevo !== anterior.total))) {
    let delta = 0
    let tipoMov: 'cargo' | 'cobro' | null = null
    const label = anterior.tipo === 'presupuesto' ? 'Presupuesto' : anterior.tipo === 'remito' ? 'Remito' : anterior.tipo

    if (eraCC && !esCC) {
      delta = -anterior.total
      tipoMov = 'cobro'
    } else if (!eraCC && esCC) {
      delta = totalNuevo
      tipoMov = 'cargo'
    } else if (eraCC && esCC && totalNuevo !== anterior.total) {
      delta = totalNuevo - anterior.total
      tipoMov = delta > 0 ? 'cargo' : 'cobro'
    }

    if (tipoMov && delta !== 0) {
      const { data: cliente } = await supabase.from('clientes').select('saldo').eq('id', clienteId).single()
      const saldoAnterior = cliente?.saldo || 0
      const saldoNuevo = Math.max(0, saldoAnterior + delta)
      await supabase.from('clientes').update({ saldo: saldoNuevo }).eq('id', clienteId)
      await supabase.from('movimientos_cta_cte').insert([{
        cliente_id: clienteId,
        empresa: rest.empresa ?? anterior.empresa,
        tipo: tipoMov,
        concepto: `${label} ${anterior.numero} (ajuste al editar)`,
        monto: Math.abs(delta),
        saldo_anterior: saldoAnterior,
        saldo_nuevo: saldoNuevo,
        referencia_id: id,
      }])
    }
  }

  return NextResponse.json(data)
}

async function deleteHandler(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { data: venta, error: errVenta } = await supabase
    .from('ventas')
    .select('estado, estado_pago, total, cliente_id, empresa, numero, tipo, items')
    .eq('id', id)
    .single()
  if (errVenta || !venta) return NextResponse.json({ error: errVenta?.message || 'Venta no encontrada' }, { status: 404 })

  const { error } = await supabase
    .from('ventas')
    .update({ estado: 'cancelado' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si es un remito, descontó stock al crearse (o al convertirse desde
  // presupuesto) — devolverlo al cancelar, si no ya no quedaba stock era
  // real; guardado como "cancelado" pero fantasma para siempre.
  if (venta.estado !== 'cancelado' && venta.tipo === 'remito' && Array.isArray(venta.items) && venta.items.length > 0) {
    await devolverStockItems(venta.items)
  }

  // Si estaba cargada en cuenta corriente, revertir el cargo — si no, el
  // saldo del cliente queda con una deuda fantasma de un comprobante que
  // ya no existe (mismo ajuste que ya se hacía al editar el estado en PUT,
  // pero acá nunca se aplicaba al eliminar/cancelar).
  if (venta.estado !== 'cancelado' && venta.estado_pago === 'cuenta_corriente' && venta.cliente_id && venta.total > 0) {
    const { data: cliente } = await supabase.from('clientes').select('saldo').eq('id', venta.cliente_id).single()
    const saldoAnterior = cliente?.saldo || 0
    const saldoNuevo = Math.max(0, saldoAnterior - venta.total)
    await supabase.from('clientes').update({ saldo: saldoNuevo }).eq('id', venta.cliente_id)
    const label = venta.tipo === 'presupuesto' ? 'Presupuesto' : venta.tipo === 'remito' ? 'Remito' : venta.tipo
    await supabase.from('movimientos_cta_cte').insert([{
      cliente_id: venta.cliente_id,
      empresa: venta.empresa,
      tipo: 'cobro',
      concepto: `${label} ${venta.numero} (anulado)`,
      monto: venta.total,
      saldo_anterior: saldoAnterior,
      saldo_nuevo: saldoNuevo,
      referencia_id: id,
    }])
  }

  return NextResponse.json({ ok: true })
}

// Después de responder, manda a la web el stock de los productos que
// cambiaron (solo esos) — ver src/lib/woo-stock-cola.ts
export const POST = conSyncStockWeb(postHandler)
export const PUT = conSyncStockWeb(putHandler)
export const DELETE = conSyncStockWeb(deleteHandler)
