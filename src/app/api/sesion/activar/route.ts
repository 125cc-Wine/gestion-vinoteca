export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashClave, hashToken } from '@/lib/clave'
import { COOKIE_SESION, DURACION_SESION_S, firmarSesion } from '@/lib/sesion'

// Activación desde el link de invitación: la persona elige su contraseña.
// GET ?token= → a quién corresponde (para mostrar el email)
// POST { token, clave } → guarda la contraseña, invalida el link y deja la sesión iniciada.

async function buscar(token: unknown) {
  if (typeof token !== 'string' || token.length < 20) return null
  const { data } = await supabase.from('usuarios_gestion')
    .select('id, email, nombre, activo, invitacion_expira')
    .eq('invitacion_hash', hashToken(token)).maybeSingle()
  if (!data || !data.activo || !data.invitacion_expira || new Date(data.invitacion_expira) < new Date()) return null
  return data
}

export async function GET(req: NextRequest) {
  const u = await buscar(req.nextUrl.searchParams.get('token'))
  if (!u) return NextResponse.json({ error: 'El link venció o ya se usó. Pedí uno nuevo.' }, { status: 404 })
  return NextResponse.json({ email: u.email, nombre: u.nombre })
}

export async function POST(req: NextRequest) {
  const { token, clave } = await req.json().catch(() => ({}))
  const u = await buscar(token)
  if (!u) return NextResponse.json({ error: 'El link venció o ya se usó. Pedí uno nuevo.' }, { status: 404 })
  if (typeof clave !== 'string' || clave.length < 10) return NextResponse.json({ error: 'La contraseña tiene que tener al menos 10 caracteres' }, { status: 400 })

  const { error } = await supabase.from('usuarios_gestion').update({
    pass_hash: hashClave(clave), invitacion_hash: null, invitacion_expira: null,
    intentos: 0, bloqueado_hasta: null, ultimo_acceso: new Date().toISOString(),
  }).eq('id', u.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_SESION, await firmarSesion({ u: u.id, email: u.email }), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: DURACION_SESION_S,
  })
  return res
}
