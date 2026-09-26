import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verificarPin } from '@/lib/pin'
import { COOKIE, crearSesion } from '@/lib/session'

export const dynamic = 'force-dynamic'

const MAX_INTENTOS = 5
const BLOQUEO_MIN = 15

export async function POST(req: NextRequest) {
  const { token, pin } = await req.json().catch(() => ({}))
  if (typeof token !== 'string' || typeof pin !== 'string' || !/^\d{4,8}$/.test(pin) || token.length < 20) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }
  const { data: c } = await db.from('clientes')
    .select('id, portal_pin_hash, portal_activo, portal_intentos, portal_bloqueado_hasta, activo')
    .eq('portal_token', token).maybeSingle()
  if (!c || !c.portal_activo || c.activo === false) {
    return NextResponse.json({ error: 'Este link no está activo. Pedí uno nuevo a tu vendedor.' }, { status: 404 })
  }
  if (c.portal_bloqueado_hasta && new Date(c.portal_bloqueado_hasta) > new Date()) {
    const min = Math.ceil((new Date(c.portal_bloqueado_hasta).getTime() - Date.now()) / 60000)
    return NextResponse.json({ error: `Demasiados intentos. Probá de nuevo en ${min} minuto${min === 1 ? '' : 's'}.` }, { status: 429 })
  }

  if (!verificarPin(pin, c.portal_pin_hash)) {
    const intentos = (c.portal_intentos ?? 0) + 1
    const bloquear = intentos >= MAX_INTENTOS
    await db.from('clientes').update(bloquear
      ? { portal_intentos: 0, portal_bloqueado_hasta: new Date(Date.now() + BLOQUEO_MIN * 60000).toISOString() }
      : { portal_intentos: intentos }).eq('id', c.id)
    return NextResponse.json({
      error: bloquear
        ? `PIN incorrecto. Por seguridad, el acceso queda bloqueado ${BLOQUEO_MIN} minutos.`
        : `PIN incorrecto. Te quedan ${MAX_INTENTOS - intentos} intento${MAX_INTENTOS - intentos === 1 ? '' : 's'}.`,
    }, { status: 401 })
  }

  await db.from('clientes').update({
    portal_intentos: 0, portal_bloqueado_hasta: null, portal_ultimo_acceso: new Date().toISOString(),
  }).eq('id', c.id)

  const s = crearSesion(c.id, token)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, s.valor, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: s.maxAge })
  return res
}
