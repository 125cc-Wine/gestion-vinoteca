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

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { cliente_id, tipo, monto, concepto, empresa, referencia_id, fecha, medio_pago } = body

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
  if (tipo === 'cobro' && monto > 0) {
    const { data: abiertas } = await supabase
      .from('ventas')
      .select('id, total, monto_pagado')
      .eq('cliente_id', cliente_id)
      .eq('empresa', empresa)
      .in('tipo', ['remito', 'presupuesto'])
      .neq('estado_pago', 'pagado')
      .order('created_at', { ascending: true })

    let restante = monto
    const fechaCobro = fecha || new Date().toISOString().split('T')[0]
    for (const v of abiertas || []) {
      if (restante <= 0) break
      const faltaVenta = parseFloat((v.total - (v.monto_pagado || 0)).toFixed(2))
      if (faltaVenta <= 0) continue
      const aplicar = Math.min(restante, faltaVenta)
      const nuevoMontoPagado = parseFloat(((v.monto_pagado || 0) + aplicar).toFixed(2))
      const cubreTotal = aplicar >= faltaVenta - 0.01

      await supabase.from('ventas').update({
        monto_pagado: nuevoMontoPagado,
        ...(cubreTotal ? { estado_pago: 'pagado' } : {}),
      }).eq('id', v.id)

      await supabase.from('movimientos_caja').insert([{
        empresa,
        tipo: 'ingreso',
        concepto: `${concepto || 'Cobro cuenta corriente'} (aplicado a venta)`,
        monto: aplicar,
        fecha: fechaCobro,
        categoria: 'Ventas - Cobro',
        medio_pago: medio_pago || 'Efectivo',
        referencia_id: v.id,
      }])

      restante = parseFloat((restante - aplicar).toFixed(2))
    }
  }

  return NextResponse.json({ ...data, saldo_nuevo: saldoNuevo })
}
