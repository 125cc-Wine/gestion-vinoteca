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
  // /api/ventas/cobrar) se reparte FIFO contra las ventas abiertas más
  // viejas del cliente, para que Ventas/Aging dejen de mostrarlas como
  // pendientes — antes el saldo bajaba pero las ventas puntuales quedaban
  // "cuenta_corriente" para siempre. Lo que sobra tras cubrir todo lo
  // abierto queda como saldo a favor (no rompe nada, el saldo ya lo soporta).
  // Si el cobro viene partido en varios medios de pago, se recorren ambas
  // colas (ventas abiertas y splits de pago) a la vez, así cada movimiento
  // de caja generado queda con el medio de pago que realmente le tocó.
  if (tipo === 'cobro' && monto > 0) {
    const { data: abiertas } = await supabase
      .from('ventas')
      .select('id, total, monto_pagado')
      .eq('cliente_id', cliente_id)
      .eq('empresa', empresa)
      .in('tipo', ['remito', 'presupuesto'])
      .neq('estado_pago', 'pagado')
      .order('created_at', { ascending: true })

    const fechaCobro = fecha || new Date().toISOString().split('T')[0]
    const ventas = [...(abiertas || [])]
    let vIdx = 0
    let faltaVentaActual = ventas[0] ? parseFloat((ventas[0].total - (ventas[0].monto_pagado || 0)).toFixed(2)) : 0
    let montoPagadoVentaActual = ventas[0]?.monto_pagado || 0

    for (const s of splits) {
      let restanteSplit = parseFloat(String(s.monto)) || 0
      const medioSplit = s.medio_pago || 'Efectivo'

      while (restanteSplit > 0 && vIdx < ventas.length) {
        if (faltaVentaActual <= 0) {
          vIdx++
          if (vIdx >= ventas.length) break
          faltaVentaActual = parseFloat((ventas[vIdx].total - (ventas[vIdx].monto_pagado || 0)).toFixed(2))
          montoPagadoVentaActual = ventas[vIdx].monto_pagado || 0
          continue
        }
        const v = ventas[vIdx]
        const aplicar = Math.min(restanteSplit, faltaVentaActual)
        montoPagadoVentaActual = parseFloat((montoPagadoVentaActual + aplicar).toFixed(2))
        faltaVentaActual = parseFloat((faltaVentaActual - aplicar).toFixed(2))
        const cubreTotal = faltaVentaActual <= 0.01

        await supabase.from('ventas').update({
          monto_pagado: montoPagadoVentaActual,
          ...(cubreTotal ? { estado_pago: 'pagado' } : {}),
        }).eq('id', v.id)

        await supabase.from('movimientos_caja').insert([{
          empresa,
          tipo: 'ingreso',
          concepto: `${concepto || 'Cobro cuenta corriente'} (aplicado a venta)`,
          monto: aplicar,
          fecha: fechaCobro,
          categoria: 'Ventas - Cobro',
          medio_pago: medioSplit,
          referencia_id: v.id,
        }])

        restanteSplit = parseFloat((restanteSplit - aplicar).toFixed(2))
      }
    }
  }

  return NextResponse.json({ ...data, saldo_nuevo: saldoNuevo })
}
