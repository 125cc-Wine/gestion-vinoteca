export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const clienteId = req.nextUrl.searchParams.get('cliente_id')
  if (!clienteId) return NextResponse.json({ error: 'cliente_id requerido' }, { status: 400 })

  const desde = req.nextUrl.searchParams.get('desde')
  const hasta = req.nextUrl.searchParams.get('hasta')

  let query = supabase
    .from('movimientos_cta_cte')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })

  if (desde) query = query.gte('created_at', desde + 'T00:00:00')
  if (hasta) query = query.lte('created_at', hasta + 'T23:59:59')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

interface Split { monto: number; medio_pago?: string }

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { cliente_id, tipo, concepto, empresa, referencia_id, fecha, medio_pago } = body

  // "pagos" permite cobrar con varios medios de pago en un solo paso (ej.
  // mitad efectivo, mitad transferencia). Si no viene, se usa el "monto" +
  // "medio_pago" sueltos (comportamiento original).
  const splits: Split[] = Array.isArray(body.pagos) && body.pagos.length > 0
    ? body.pagos
    : [{ monto: body.monto, medio_pago }]
  const monto = parseFloat(splits.reduce((a, s) => a + (parseFloat(String(s.monto)) || 0), 0).toFixed(2))

  // Obtener saldo actual del cliente
  const { data: cliente } = await supabase
    .from('clientes')
    .select('saldo')
    .eq('id', cliente_id)
    .single()

  const saldoAnterior = cliente?.saldo || 0
  const saldoNuevo = tipo === 'cargo'
    ? saldoAnterior + monto
    : saldoAnterior - monto

  // Registrar movimiento
  const { data, error } = await supabase
    .from('movimientos_cta_cte')
    .insert([{
      cliente_id, tipo, monto, concepto, empresa,
      saldo_anterior: saldoAnterior,
      saldo_nuevo: saldoNuevo,
      referencia_id: referencia_id || null,
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Actualizar saldo del cliente
  await supabase
    .from('clientes')
    .update({ saldo: saldoNuevo })
    .eq('id', cliente_id)

  // Un "cobro" genérico (no atado a una venta puntual, a diferencia de
  // /api/ventas/cobrar) se reparte FIFO contra TODO lo abierto del cliente,
  // en un único orden cronológico: remitos/presupuestos Y deudas cargadas a
  // mano ("Cargar deuda"), mezclados por fecha real — no primero todos los
  // remitos y recién después lo que sobra contra las deudas manuales, que es
  // lo que pasaba antes y podía saltearse una deuda manual más vieja que un
  // remito más nuevo. Lo que sobra tras cubrir todo lo abierto queda como
  // saldo a favor (no rompe nada, el saldo ya lo soporta).
  // Si el cobro viene partido en varios medios de pago, se recorren ambas
  // colas (pendientes y splits de pago) a la vez, así cada movimiento de
  // caja generado queda con el medio de pago que realmente le tocó.
  if (tipo === 'cobro' && monto > 0) {
    const { data: ventasAbiertas } = await supabase
      .from('ventas')
      .select('id, total, monto_pagado, created_at')
      .eq('cliente_id', cliente_id)
      .eq('empresa', empresa)
      .in('tipo', ['remito', 'presupuesto'])
      .neq('estado_pago', 'pagado')
      .order('created_at', { ascending: true })

    const { data: cargosAbiertos } = await supabase
      .from('movimientos_cta_cte')
      .select('id, monto, monto_pagado, created_at')
      .eq('cliente_id', cliente_id)
      .eq('empresa', empresa)
      .eq('tipo', 'cargo')
      .order('created_at', { ascending: true })

    type Pendiente = { kind: 'venta' | 'cargo'; id: string; total: number; monto_pagado: number; created_at: string }
    const pendientes: Pendiente[] = [
      ...(ventasAbiertas || []).map(v => ({ kind: 'venta' as const, id: v.id, total: v.total, monto_pagado: v.monto_pagado || 0, created_at: v.created_at })),
      ...(cargosAbiertos || [])
        .filter(c => parseFloat((c.monto - (c.monto_pagado || 0)).toFixed(2)) > 0.01)
        .map(c => ({ kind: 'cargo' as const, id: c.id, total: c.monto, monto_pagado: c.monto_pagado || 0, created_at: c.created_at })),
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const fechaCobro = fecha || new Date().toISOString().split('T')[0]
    let pIdx = 0
    let faltaActual = pendientes[0] ? parseFloat((pendientes[0].total - pendientes[0].monto_pagado).toFixed(2)) : 0
    let montoPagadoActual = pendientes[0]?.monto_pagado || 0

    for (const s of splits) {
      let restanteSplit = parseFloat(String(s.monto)) || 0
      const medioSplit = s.medio_pago || 'Efectivo'

      while (restanteSplit > 0 && pIdx < pendientes.length) {
        if (faltaActual <= 0) {
          pIdx++
          if (pIdx >= pendientes.length) break
          faltaActual = parseFloat((pendientes[pIdx].total - pendientes[pIdx].monto_pagado).toFixed(2))
          montoPagadoActual = pendientes[pIdx].monto_pagado
          continue
        }
        const item = pendientes[pIdx]
        const aplicar = Math.min(restanteSplit, faltaActual)
        montoPagadoActual = parseFloat((montoPagadoActual + aplicar).toFixed(2))
        faltaActual = parseFloat((faltaActual - aplicar).toFixed(2))
        const cubreTotal = faltaActual <= 0.01

        if (item.kind === 'venta') {
          await supabase.from('ventas').update({
            monto_pagado: montoPagadoActual,
            ...(cubreTotal ? { estado_pago: 'pagado' } : {}),
          }).eq('id', item.id)
        } else {
          await supabase.from('movimientos_cta_cte').update({ monto_pagado: montoPagadoActual }).eq('id', item.id)
        }

        await supabase.from('movimientos_caja').insert([{
          empresa,
          tipo: 'ingreso',
          concepto: `${concepto || 'Cobro cuenta corriente'} (aplicado a ${item.kind === 'venta' ? 'venta' : 'deuda cargada'})`,
          monto: aplicar,
          fecha: fechaCobro,
          categoria: 'Ventas - Cobro',
          medio_pago: medioSplit,
          referencia_id: item.id,
        }])

        restanteSplit = parseFloat((restanteSplit - aplicar).toFixed(2))
      }
    }
  }

  return NextResponse.json({ ...data, saldo_nuevo: saldoNuevo })
}
