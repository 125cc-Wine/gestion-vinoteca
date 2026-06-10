import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const clienteId = req.nextUrl.searchParams.get('cliente_id')
  if (!clienteId) return NextResponse.json({ error: 'cliente_id requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('movimientos_cta_cte')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { cliente_id, tipo, monto, concepto, empresa, referencia_id } = body

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

  return NextResponse.json({ ...data, saldo_nuevo: saldoNuevo })
}
