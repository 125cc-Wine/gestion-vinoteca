export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  const { data, error } = await supabase
    .from('cheques')
    .select('*')
    .eq('empresa', empresa)
    .neq('estado', 'anulado')
    .order('fecha_pago', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// tipo='emitido' (default, sin cambios): la empresa le paga a un proveedor —
//   requiere beneficiario, arranca en estado 'emitido'.
// tipo='recibido': un cliente paga una venta con un cheque de su propia
//   cuenta — la empresa lo tiene en cartera hasta depositarlo. Requiere
//   librador (quién lo firmó) en vez de beneficiario, arranca en
//   'en_cartera' en vez de 'emitido'.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    empresa, cuenta_id, banco, nro_cheque, monto, fecha_emision, fecha_pago,
    beneficiario, concepto, proveedor_id, compra_id, notas,
    tipo, librador, cliente_id,
  } = body

  const esRecibido = tipo === 'recibido'

  if (!empresa || !monto || !fecha_pago) {
    return NextResponse.json({ error: 'empresa, monto y fecha_pago son requeridos' }, { status: 400 })
  }
  if (esRecibido && !librador) {
    return NextResponse.json({ error: 'librador es requerido para un cheque recibido' }, { status: 400 })
  }
  if (!esRecibido && !beneficiario) {
    return NextResponse.json({ error: 'beneficiario es requerido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('cheques')
    .insert([{
      empresa,
      tipo: esRecibido ? 'recibido' : 'emitido',
      cuenta_id: cuenta_id || null,
      banco: banco || null,
      nro_cheque: nro_cheque || null,
      monto: Number(monto),
      fecha_emision: fecha_emision || new Date().toISOString().slice(0, 10),
      fecha_pago,
      beneficiario: esRecibido ? null : beneficiario,
      librador: esRecibido ? librador : null,
      cliente_id: esRecibido ? (cliente_id || null) : null,
      concepto: concepto || null,
      estado: esRecibido ? 'en_cartera' : 'emitido',
      proveedor_id: esRecibido ? null : (proveedor_id || null),
      compra_id: esRecibido ? null : (compra_id || null),
      notas: notas || null,
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...fields } = body

  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('cheques')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  // Soft delete: marcar como anulado
  const { error } = await supabase
    .from('cheques')
    .update({ estado: 'anulado' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
