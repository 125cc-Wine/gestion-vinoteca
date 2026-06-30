export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST: registra un vino en una añada, creando la añada si no existe
export async function POST(req: NextRequest) {
  const { anio, producto_id, producto_nombre, bodega, varietal, stock, precio } = await req.json()
  if (!anio || !producto_nombre) return NextResponse.json({ error: 'anio y producto_nombre requeridos' }, { status: 400 })

  let { data: anada, error: findErr } = await supabase
    .from('anadas').select('id').eq('anio', anio).eq('activo', true).maybeSingle()
  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 })

  if (!anada) {
    const { data: nueva, error: createErr } = await supabase
      .from('anadas').insert({ anio, activo: true }).select('id').single()
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })
    anada = nueva
  }

  const { data, error } = await supabase.from('anada_items').insert({
    anada_id: anada!.id, producto_id: producto_id || null,
    producto_nombre, bodega: bodega || null, varietal: varietal || null,
    stock: stock || 0, precio: precio || 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const { id, ...rest } = await req.json()
  const { data, error } = await supabase.from('anada_items').update(rest).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  const { error } = await supabase.from('anada_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
