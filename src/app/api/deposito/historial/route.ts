export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/deposito/historial?empresa=aroma
export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  const { data, error } = await supabase
    .from('movimientos_stock')
    .select('*')
    .eq('empresa', empresa)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/deposito/historial
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { empresa, nombre, delta, nuevo_stock, modo, producto_id } = body

  const { data, error } = await supabase
    .from('movimientos_stock')
    .insert([{ empresa, nombre, delta, nuevo_stock, modo, producto_id: producto_id ?? null }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/deposito/historial?empresa=aroma — limpiar historial
export async function DELETE(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  const { error } = await supabase
    .from('movimientos_stock')
    .delete()
    .eq('empresa', empresa)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
