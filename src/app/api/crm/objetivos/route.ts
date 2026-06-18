export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  const mes     = req.nextUrl.searchParams.get('mes')
  const anio    = req.nextUrl.searchParams.get('anio')

  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })
  if (!mes)     return NextResponse.json({ error: 'mes requerido' }, { status: 400 })
  if (!anio)    return NextResponse.json({ error: 'anio requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('objetivos_venta')
    .select('*')
    .eq('empresa', empresa)
    .eq('mes', Number(mes))
    .eq('anio', Number(anio))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { empresa, vendedor_nombre, mes, anio, objetivo_monto } = body

  if (!empresa || !vendedor_nombre || !mes || !anio) {
    return NextResponse.json({ error: 'empresa, vendedor_nombre, mes y anio son requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('objetivos_venta')
    .upsert(
      [{ empresa, vendedor_nombre, mes, anio, objetivo_monto }],
      { onConflict: 'empresa,vendedor_nombre,mes,anio' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabase
    .from('objetivos_venta')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
