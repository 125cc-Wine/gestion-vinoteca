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

// POST { venta_id, empresa, concepto?, fecha?, monto?, medio_pago? }
// Registra un cobro contra UNA venta puntual. Si "monto" no se manda, se
// asume que se paga todo lo que le falta a esa venta (comportamiento
// original). Si "monto" es menor a lo que falta, la venta queda con
// estado_pago='cuenta_corriente' pero con monto_pagado actualizado (parcial)
// — recién pasa a 'pagado' cuando monto_pagado cubre el total.
// Un pago dividido entre dos medios (ej. mitad efectivo, mitad transferencia)
// se registra como DOS llamados separados, cada uno con su monto y su
// medio_pago — así en Caja quedan dos movimientos prolijos en vez de uno
// mezclado.
export async function POST(req: NextRequest) {
  const { venta_id, empresa, concepto, fecha, monto, medio_pago } = await req.json()
  if (!venta_id || !empresa) return NextResponse.json({ error: 'venta_id y empresa requeridos' }, { status: 400 })

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
  const montoCobro = monto != null ? parseFloat(monto) : restante
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

  // 2. Si era cuenta corriente, reducir saldo del cliente
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

  // 3. Registrar ingreso en caja por lo efectivamente cobrado ahora
  if (montoCobro > 0) {
    await supabase.from('movimientos_caja').insert([{
      empresa,
      tipo: 'ingreso',
      concepto: conceptoCobro,
      monto: montoCobro,
      fecha: fechaCobro,
      categoria: 'Ventas - Cobro',
      medio_pago: medio_pago || medioPagoDesdeCondicion(venta.condicion_venta),
      referencia_id: venta_id,
    }])
  }

  return NextResponse.json(ventaActualizada)
}
