export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST { venta_id, empresa, concepto?, fecha? }
// Marca la venta como pagada y registra los movimientos contables correspondientes.
export async function POST(req: NextRequest) {
  const { venta_id, empresa, concepto, fecha } = await req.json()
  if (!venta_id || !empresa) return NextResponse.json({ error: 'venta_id y empresa requeridos' }, { status: 400 })

  // Traer venta actual
  const { data: venta, error: ve } = await supabase
    .from('ventas')
    .select('*')
    .eq('id', venta_id)
    .single()
  if (ve || !venta) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
  if (venta.estado_pago === 'pagado') return NextResponse.json({ error: 'La venta ya está pagada' }, { status: 400 })

  const estadoAnterior = venta.estado_pago
  const fechaCobro = fecha || new Date().toISOString().split('T')[0]
  const conceptoCobro = concepto || `Cobro ${venta.tipo === 'presupuesto' ? 'Presupuesto' : 'Remito'} ${venta.numero}`

  // 1. Marcar venta como pagada
  const { data: ventaActualizada, error: ue } = await supabase
    .from('ventas')
    .update({ estado_pago: 'pagado' })
    .eq('id', venta_id)
    .select()
    .single()
  if (ue) return NextResponse.json({ error: ue.message }, { status: 500 })

  // 2. Si era cuenta corriente, reducir saldo del cliente
  if (estadoAnterior === 'cuenta_corriente' && venta.cliente_id && venta.total > 0) {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('saldo')
      .eq('id', venta.cliente_id)
      .single()

    const saldoAnterior = cliente?.saldo || 0
    const saldoNuevo = Math.max(0, saldoAnterior - venta.total)

    await supabase.from('clientes').update({ saldo: saldoNuevo }).eq('id', venta.cliente_id)

    await supabase.from('movimientos_cta_cte').insert([{
      cliente_id: venta.cliente_id,
      empresa,
      tipo: 'cobro',
      concepto: conceptoCobro,
      monto: venta.total,
      saldo_anterior: saldoAnterior,
      saldo_nuevo: saldoNuevo,
      referencia_id: venta_id,
    }])
  }

  // 3. Si no estaba ya registrado en caja (era pendiente o cuenta_corriente), registrar ingreso
  if (estadoAnterior !== 'pagado' && venta.total > 0) {
    await supabase.from('movimientos_caja').insert([{
      empresa,
      tipo: 'ingreso',
      concepto: conceptoCobro,
      monto: venta.total,
      fecha: fechaCobro,
      categoria: 'Ventas - Cobro',
      referencia_id: venta_id,
    }])
  }

  return NextResponse.json(ventaActualizada)
}
