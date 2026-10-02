export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { nuevoTokenInvitacion } from '@/lib/clave'
import { COOKIE_SESION, leerSesion } from '@/lib/sesion'

// Usuarios de gestión (Configuración > Usuarios).
// GET → lista. POST { accion: 'invitar', email, nombre } → link para crear la
// contraseña (vale 7 días; si ya existe, sirve para resetearla).
// POST { accion: 'activo', id, activo } → habilitar / deshabilitar.

const err = (m: string, status = 400) => NextResponse.json({ error: m }, { status })

export async function GET() {
  const { data, error } = await supabase.from('usuarios_gestion')
    .select('id, email, nombre, activo, ultimo_acceso, invitacion_expira, pass_hash').order('email')
  if (error) return err(error.message, 500)
  const yo = await leerSesion(cookies().get(COOKIE_SESION)?.value)
  return NextResponse.json({
    yo: yo?.u ?? null,
    usuarios: (data || []).map(({ pass_hash, ...u }) => ({ ...u, con_clave: !!pass_hash })),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const yo = await leerSesion(cookies().get(COOKIE_SESION)?.value)

  if (body.accion === 'invitar') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err('Email inválido')
    const { token, hash } = nuevoTokenInvitacion()
    const { error } = await supabase.from('usuarios_gestion').upsert({
      email, nombre: typeof body.nombre === 'string' && body.nombre.trim() ? body.nombre.trim() : null,
      activo: true, invitacion_hash: hash, invitacion_expira: new Date(Date.now() + 7 * 86400000).toISOString(),
    }, { onConflict: 'email' })
    if (error) return err(error.message, 500)
    return NextResponse.json({ ok: true, link: `${req.nextUrl.origin}/acceso/${token}` })
  }

  if (body.accion === 'activo') {
    if (!body.id) return err('Falta el usuario')
    if (yo && body.id === yo.u && !body.activo) return err('No podés deshabilitar tu propio usuario')
    const { error } = await supabase.from('usuarios_gestion').update({ activo: !!body.activo }).eq('id', body.id)
    if (error) return err(error.message, 500)
    return NextResponse.json({ ok: true })
  }

  return err('accion inválida')
}
