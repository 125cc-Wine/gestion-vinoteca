export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest) {
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .eq('activo', true)
    .order('nombre')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  let { data, error } = await supabase
    .from('proveedores')
    .insert([body])
    .select()
    .single()

  // Si todavía no se corrió sql/2026-09-proveedores-factura-iva.sql, la
  // columna no existe — reintentar sin ella para no bloquear el alta de
  // proveedores por eso.
  if (error?.message?.includes('factura_iva')) {
    const { factura_iva: _fi, ...bodySinIva } = body
    void _fi
    ;({ data, error } = await supabase.from('proveedores').insert([bodySinIva]).select().single())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body

  let { data, error } = await supabase
    .from('proveedores')
    .update(rest)
    .eq('id', id)
    .select()
    .single()

  if (error?.message?.includes('factura_iva')) {
    const { factura_iva: _fi, ...restSinIva } = rest
    void _fi
    ;({ data, error } = await supabase.from('proveedores').update(restSinIva).eq('id', id).select().single())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabase
    .from('proveedores')
    .update({ activo: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
