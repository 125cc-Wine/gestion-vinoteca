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

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { empresa, cuenta_id, banco, nro_cheque, monto, fecha_emision, fecha_pago, beneficiario, concepto, proveedor_id, notas } = body

  if (!empresa || !beneficiario || !monto || !fecha_pago) {
    return NextResponse.json({ error: 'empresa, beneficiario, monto y fecha_pago son requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('cheques')
    .insert([{
      empresa,
      cuenta_id: cuenta_id || null,
      banco: banco || null,
      nro_cheque: nro_cheque || null,
      monto: Number(monto),
      fecha_emision: fecha_emision || new Date().toISOString().slice(0, 10),
      fecha_pago,
      beneficiario,
      concepto: concepto || null,
      estado: 'emitido',
      proveedor_id: proveedor_id || null,
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
