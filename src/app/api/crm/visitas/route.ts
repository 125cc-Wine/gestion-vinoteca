export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa  = req.nextUrl.searchParams.get('empresa')
  const vendedor = req.nextUrl.searchParams.get('vendedor')
  const estado   = req.nextUrl.searchParams.get('estado')
  const tipo     = req.nextUrl.searchParams.get('tipo')

  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  let q = supabase
    .from('visitas')
    .select('*')
    .eq('empresa', empresa)
    .order('fecha', { ascending: false })

  if (vendedor) q = q.eq('vendedor_nombre', vendedor)
  if (estado)   q = q.eq('estado', estado)
  if (tipo)     q = q.eq('tipo', tipo)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('visitas')
    .insert([body])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, estado, notas, resultado } = body
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (estado    !== undefined) updates.estado    = estado
  if (notas     !== undefined) updates.notas     = notas
  if (resultado !== undefined) updates.resultado = resultado

  const { data, error } = await supabase
    .from('visitas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabase
    .from('visitas')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
