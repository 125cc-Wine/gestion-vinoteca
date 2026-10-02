export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verificarClave } from '@/lib/clave'
import { COOKIE_SESION, DURACION_SESION_S, firmarSesion } from '@/lib/sesion'

// Login de gestión. POST { email, clave } → cookie de sesión (30 días).
// DELETE → cerrar sesión. 5 intentos fallidos = 15 minutos bloqueado.
const MAX_INTENTOS = 5
const BLOQUEO_MIN = 15

const cookieOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' }

export async function POST(req: NextRequest) {
  const { email, clave } = await req.json().catch(() => ({}))
  if (typeof email !== 'string' || typeof clave !== 'string' || !email.trim() || !clave) {
    return NextResponse.json({ error: 'Completá email y contraseña' }, { status: 400 })
  }
  const { data: u } = await supabase.from('usuarios_gestion')
    .select('id, email, pass_hash, activo, intentos, bloqueado_hasta')
    .eq('email', email.trim().toLowerCase()).maybeSingle()

  if (u?.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date()) {
    return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos y probá de nuevo.' }, { status: 429 })
  }
  if (!u || !u.activo || !verificarClave(clave, u.pass_hash)) {
    if (u) {
      const intentos = (u.intentos ?? 0) + 1
      await supabase.from('usuarios_gestion').update(intentos >= MAX_INTENTOS
        ? { intentos: 0, bloqueado_hasta: new Date(Date.now() + BLOQUEO_MIN * 60000).toISOString() }
        : { intentos }).eq('id', u.id)
    }
    return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 })
  }

  await supabase.from('usuarios_gestion').update({ intentos: 0, bloqueado_hasta: null, ultimo_acceso: new Date().toISOString() }).eq('id', u.id)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_SESION, await firmarSesion({ u: u.id, email: u.email }), { ...cookieOpts, maxAge: DURACION_SESION_S })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_SESION, '', { ...cookieOpts, maxAge: 0 })
  return res
}
