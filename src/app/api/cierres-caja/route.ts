export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  const fecha   = req.nextUrl.searchParams.get('fecha')
  const limit   = parseInt(req.nextUrl.searchParams.get('limit') || '30', 10)

  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  let query = supabase
    .from('cierres_caja')
    .select('*')
    .eq('empresa', empresa)
    .order('fecha', { ascending: false })
    .limit(limit)

  if (fecha) query = query.eq('fecha', fecha)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { empresa, fecha, efectivo_sistema, efectivo_real, notas, cerrado_por } = body

  if (!empresa || !fecha) {
    return NextResponse.json({ error: 'empresa y fecha son requeridos' }, { status: 400 })
  }

  const diferencia = (efectivo_real ?? 0) - (efectivo_sistema ?? 0)

  const payload = {
    empresa,
    fecha,
    efectivo_sistema: efectivo_sistema ?? 0,
    efectivo_real: efectivo_real ?? 0,
    diferencia,
    notas: notas ?? null,
    cerrado_por: cerrado_por ?? null,
  }

  // Upsert by (empresa, fecha)
  const { data: existing } = await supabase
    .from('cierres_caja')
    .select('id')
    .eq('empresa', empresa)
    .eq('fecha', fecha)
    .single()

  let result
  if (existing?.id) {
    const { data, error } = await supabase
      .from('cierres_caja')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  } else {
    const { data, error } = await supabase
      .from('cierres_caja')
      .insert([payload])
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  }

  return NextResponse.json(result)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabase
    .from('cierres_caja')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
