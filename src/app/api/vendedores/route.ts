export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PORTAL_URL } from '@/lib/portalPin'

// Campos de la ficha que se pueden editar desde gestión. Los portal_* se
// manejan solo desde /api/vendedores/portal (y el hash del PIN nunca sale).
const EDITABLES = ['nombre', 'tipo', 'activo', 'porcentaje_comision', 'telefono', 'email', 'zona', 'notas'] as const
const COLS = 'id, nombre, tipo, activo, created_at, porcentaje_comision, telefono, email, zona, notas'

function soloEditables(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const k of EDITABLES) if (k in body) out[k] = typeof body[k] === 'string' ? (body[k] as string).trim() || null : body[k]
  if ('nombre' in out && !out.nombre) delete out.nombre
  return out
}

// GET /api/vendedores → activos (para los selects de ventas, clientes, etc.)
// GET /api/vendedores?todos=1 → también inactivos, con cantidad de clientes
//   y el estado del acceso al portal (pantalla Vendedores).
export async function GET(req: NextRequest) {
  const todos = req.nextUrl.searchParams.get('todos') === '1'

  if (!todos) {
    const { data, error } = await supabase.from('vendedores').select(COLS).neq('activo', false).order('nombre')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const [{ data, error }, { data: clientes }] = await Promise.all([
    supabase.from('vendedores').select(`${COLS}, portal_token, portal_ultimo_acceso`).order('nombre'),
    supabase.from('clientes').select('vendedor_id').not('vendedor_id', 'is', null),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const porVendedor = new Map<string, number>()
  for (const c of clientes ?? []) porVendedor.set(c.vendedor_id, (porVendedor.get(c.vendedor_id) ?? 0) + 1)

  return NextResponse.json((data ?? []).map(({ portal_token, ...v }) => ({
    ...v,
    clientes: porVendedor.get(v.id) ?? 0,
    portal_url: portal_token ? `${PORTAL_URL}/v/${portal_token}` : null,
  })))
}

export async function POST(req: NextRequest) {
  const body = soloEditables(await req.json())
  if (!body.nombre) return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 })
  const { data, error } = await supabase
    .from('vendedores')
    .insert([{ activo: true, ...body }])
    .select(COLS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const { id, ...rest } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  const { data, error } = await supabase
    .from('vendedores')
    .update(soloEditables(rest))
    .eq('id', id)
    .select(COLS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  const { error } = await supabase.from('vendedores').update({ activo: false }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
