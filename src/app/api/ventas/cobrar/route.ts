export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// condicion_venta (ventas) -> medio_pago (caja), igual que en /api/ventas —
// si no hay match (ej: cobro de una cta. cte. sin condición definida) se
// asume Efectivo, que es el caso más común al cobrar una deuda en el local.
function medioPagoDesdeCondicion(condicion?: string | null): string {
  const map: Record<string, string> = {
    'Contado': 'Efectivo',
    'Cta. Cte.': 'Cta.Cte.',
    'Transferencia': 'Transferencia',
    'Tarjeta Débito': 'Tarjeta Débito',
    'Tarjeta Crédito': 'Tarjeta Crédito',
    'QR': 'QR',
    'Billetera Virtual MercadoPago': 'MercadoPago',
  }
  return (condicion && map[condicion]) || 'Efectivo'
}

interface Split { monto: number; medio_pago?: string }

// POST { venta_id, empresa, concepto?, fecha?, monto?, medio_pago? }
//    o  { venta_id, empresa, concepto?, fecha?, pagos: [{monto, medio_pago}, ...] }
// Registra un cobro contra UNA venta puntual. Si "monto"/"pagos" no cubre el
// total pendiente, la venta queda con estado_pago='cuenta_corriente' pero con
// monto_pagado actualizado (parcial) — recién pasa a 'pagado' cuando
// monto_pagado cubre el total.
// "pagos" permite cobrar con varios medios de pago EN UN SOLO PASO (ej. mitad
// efectivo, mitad transferencia): se valida contra lo que falta pagar, se
// actualiza la venta una sola vez por el total, y se genera un movimiento de
// caja POR CADA medio de pago (para que el arqueo de caja separe bien cuánto
// entró en efectivo vs. transferencia, etc.).
export async function POST(req: NextRequest) {
  const { venta_id, empresa, concepto, fecha, monto, medio_pago, pagos } = await req.json()
  if (!venta_id || !empresa) return NextResponse.json({ error: 'venta_id y empresa requeridos' }, { status: 400 })

  const splits: Split[] = Array.isArray(pagos) && pagos.length > 0
    ? pagos
    : [{ monto, medio_pago }]

  // Traer venta actual
  const { data: venta, error: ve } = await supabase
    .from('ventas')
    .select('*')
    .eq('id', venta_id)
    .single()
  if (ve || !venta) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
  if (venta.estado_pago === 'pagado') return NextResponse.json({ error: 'La venta ya está pagada' }, { status: 400 })

  const montoPagadoActual = venta.monto_pagado || 0
  const restante = parseFloat((venta.total - montoPagadoActual).toFixed(2))

  for (const s of splits) {
    const m = s.monto != null ? parseFloat(String(s.monto)) : NaN
    if (!m || m <= 0) return NextResponse.json({ error: 'Hay un monto inválido en el cobro' }, { status: 400 })
  }
  const montoCobro = parseFloat(splits.reduce((a, s) => a + parseFloat(String(s.monto)), 0).toFixed(2))
  if (!montoCobro || montoCobro <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
  if (montoCobro > restante + 0.01) {
    return NextResponse.json({ error: `El monto ($${montoCobro}) supera lo que falta pagar de esta venta ($${restante}). Para cobros que superen una factura puntual, usá el cobro general del cliente.` }, { status: 400 })
  }

  const estadoAnterior = venta.estado_pago
  const fechaCobro = fecha || new Date().toISOString().split('T')[0]
  const esParcial = montoCobro < restante - 0.01
  const nuevoMontoPagado = parseFloat((montoPagadoActual + montoCobro).toFixed(2))
  const conceptoCobro = concepto || `Cobro${esParcial ? ' parcial' : ''} ${venta.tipo === 'presupuesto' ? 'Presupuesto' : 'Remito'} ${venta.numero}`

  // 1. Actualizar monto_pagado y, si ya cubre el total, marcar pagada
  const { data: ventaActualizada, error: ue } = await supabase
    .from('ventas')
    .update({
      monto_pagado: nuevoMontoPagado,
      ...(esParcial ? {} : { estado_pago: 'pagado' }),
    })
    .eq('id', venta_id)
    .select()
    .single()
  if (ue) return NextResponse.json({ error: ue.message }, { status: 500 })

  // 2. Si era cuenta corriente, reducir saldo del cliente (un solo movimiento
  //    por el total, aunque se haya cobrado en varios medios de pago)
  if (estadoAnterior === 'cuenta_corriente' && venta.cliente_id && montoCobro > 0) {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('saldo')
      .eq('id', venta.cliente_id)
      .single()

    const saldoAnterior = cliente?.saldo || 0
    const saldoNuevo = Math.max(0, saldoAnterior - montoCobro)

    await supabase.from('clientes').update({ saldo: saldoNuevo }).eq('id', venta.cliente_id)

    await supabase.from('movimientos_cta_cte').insert([{
      cliente_id: venta.cliente_id,
      empresa,
      tipo: 'cobro',
      concepto: conceptoCobro,
      monto: montoCobro,
      saldo_anterior: saldoAnterior,
      saldo_nuevo: saldoNuevo,
      referencia_id: venta_id,
    }])
  }

  // 3. Registrar ingreso en caja: uno por cada medio de pago usado
  for (const s of splits) {
    const m = parseFloat(String(s.monto))
    if (m <= 0) continue
    await supabase.from('movimientos_caja').insert([{
      empresa,
      tipo: 'ingreso',
      concepto: conceptoCobro,
      monto: m,
      fecha: fechaCobro,
      categoria: 'Ventas - Cobro',
      medio_pago: s.medio_pago || medioPagoDesdeCondicion(venta.condicion_venta),
      referencia_id: venta_id,
    }])
  }

  return NextResponse.json(ventaActualizada)
}
