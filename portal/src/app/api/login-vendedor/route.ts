import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verificarPin } from '@/lib/pin'
import { COOKIE, COOKIE_VC, crearSesionVendedor } from '@/lib/session'

export const dynamic = 'force-dynamic'

const MAX_INTENTOS = 5
const BLOQUEO_MIN = 15

// Ingreso del vendedor de calle: su link personal + PIN (se los da gestión
// desde Vendedores). 5 intentos fallidos = 15 minutos bloqueado.
export async function POST(req: NextRequest) {
  const { token, pin, recordar } = await req.json().catch(() => ({}))
  if (typeof token !== 'string' || token.length < 20 || typeof pin !== 'string' || !/^\d{4,8}$/.test(pin)) {
    return NextResponse.json({ error: 'Ingresá tu PIN de 6 números.' }, { status: 400 })
  }
  const { data: v } = await db.from('vendedores')
    .select('id, activo, portal_pin_hash, portal_intentos, portal_bloqueado_hasta')
    .eq('portal_token', token).maybeSingle()
  if (!v || !v.activo) return NextResponse.json({ error: 'Este link no está activo. Pedí uno nuevo.' }, { status: 404 })
  if (v.portal_bloqueado_hasta && new Date(v.portal_bloqueado_hasta) > new Date()) {
    return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos y probá de nuevo.' }, { status: 429 })
  }
  if (!verificarPin(pin, v.portal_pin_hash)) {
    const intentos = (v.portal_intentos ?? 0) + 1
    const bloquear = intentos >= MAX_INTENTOS
    await db.from('vendedores').update(bloquear
      ? { portal_intentos: 0, portal_bloqueado_hasta: new Date(Date.now() + BLOQUEO_MIN * 60000).toISOString() }
      : { portal_intentos: intentos }).eq('id', v.id)
    return NextResponse.json({ error: bloquear ? `PIN incorrecto. El acceso queda bloqueado ${BLOQUEO_MIN} minutos.` : 'PIN incorrecto.' }, { status: 401 })
  }

  await db.from('vendedores').update({ portal_intentos: 0, portal_bloqueado_hasta: null, portal_ultimo_acceso: new Date().toISOString() }).eq('id', v.id)
  const s = crearSesionVendedor(v.id, token, recordar !== false)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, s.valor, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', ...(s.maxAge ? { maxAge: s.maxAge } : {}) })
  res.cookies.delete(COOKIE_VC)
  return res
}
