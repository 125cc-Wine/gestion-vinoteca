export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { COOKIE_SESION, leerSesion } from '@/lib/sesion'

// Ejecuta en el servidor las consultas que arman las pantallas con
// @/lib/supabaseBrowser. Solo con sesión de gestión (además del middleware),
// y solo con los métodos del constructor de consultas de supabase-js.

const INICIO = new Set(['from', 'rpc'])
const METODOS = new Set([
  'select', 'insert', 'update', 'upsert', 'delete',
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'containedBy',
  'not', 'or', 'filter', 'match', 'textSearch',
  'order', 'limit', 'range', 'single', 'maybeSingle',
])
const RPCS = new Set(['fijar_stock'])

export async function POST(req: NextRequest) {
  // (Sin clave secreta todavía no hay login: ver middleware.)
  if (process.env.SUPABASE_SECRET_KEY && !(await leerSesion(cookies().get(COOKIE_SESION)?.value))) {
    return NextResponse.json({ data: null, error: { message: 'No autorizado' }, count: null }, { status: 401 })
  }
  const { pasos } = await req.json().catch(() => ({}))
  if (!Array.isArray(pasos) || !pasos.length || pasos.length > 40) return NextResponse.json({ data: null, error: { message: 'Consulta inválida' } }, { status: 400 })

  const [primero, ...resto] = pasos as { m: string; a: unknown[] }[]
  if (!INICIO.has(primero?.m) || !Array.isArray(primero.a) || typeof primero.a[0] !== 'string') return NextResponse.json({ data: null, error: { message: 'Consulta inválida' } }, { status: 400 })
  if (primero.m === 'rpc' && !RPCS.has(primero.a[0] as string)) return NextResponse.json({ data: null, error: { message: 'Función no permitida' } }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = primero.m === 'from' ? supabase.from(primero.a[0] as string) : supabase.rpc(primero.a[0] as string, primero.a[1] as Record<string, unknown>)
  for (const p of resto) {
    if (!p || !METODOS.has(p.m) || !Array.isArray(p.a)) return NextResponse.json({ data: null, error: { message: `Método no permitido: ${p?.m}` } }, { status: 400 })
    q = q[p.m](...p.a)
  }
  const { data, error, count } = await q
  return NextResponse.json({ data: data ?? null, error: error ? { message: error.message, code: error.code } : null, count: count ?? null })
}
