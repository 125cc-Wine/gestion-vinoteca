/*
  SQL a ejecutar en Supabase antes de usar este módulo:

  ALTER TABLE ventas ADD COLUMN IF NOT EXISTS entregado_at TIMESTAMPTZ;
  ALTER TABLE ventas ADD COLUMN IF NOT EXISTS picking_notas TEXT;
*/

export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  const fechaParam = req.nextUrl.searchParams.get('fecha')
  const estado = req.nextUrl.searchParams.get('estado') ?? 'pendiente'

  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  // Fecha default: hoy
  const fecha = fechaParam ?? new Date().toISOString().slice(0, 10)
  const desde = `${fecha}T00:00:00.000Z`
  const hasta = `${fecha}T23:59:59.999Z`

  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .eq('empresa', empresa)
    .eq('tipo', 'remito')
    .neq('estado', 'cancelado')
    .gte('created_at', desde)
    .lte('created_at', hasta)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filtro por estado de entrega en código — tolera que entregado_at no exista aún
  const rows = (data ?? []) as Record<string, unknown>[]
  const filtrado = estado === 'pendiente'
    ? rows.filter(r => !r.entregado_at)
    : estado === 'entregado'
    ? rows.filter(r => !!r.entregado_at)
    : rows

  return NextResponse.json(filtrado)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, entregado_at, picking_notas } = body

  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (entregado_at !== undefined) updates.entregado_at = entregado_at
  if (picking_notas !== undefined) updates.picking_notas = picking_notas

  const { data, error } = await supabase
    .from('ventas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
