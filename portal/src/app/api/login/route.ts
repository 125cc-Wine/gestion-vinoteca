import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verificarPin } from '@/lib/pin'
import { COOKIE, crearSesion } from '@/lib/session'

export const dynamic = 'force-dynamic'

const MAX_INTENTOS = 5
const BLOQUEO_MIN = 15

interface FilaCliente {
  id: string; portal_token: string | null; portal_pin_hash: string | null; portal_activo: boolean
  portal_intentos: number | null; portal_bloqueado_hasta: string | null; activo: boolean | null
  cuit?: string | null; email?: string | null; telefono?: string | null
}
const CAMPOS = 'id, portal_token, portal_pin_hash, portal_activo, portal_intentos, portal_bloqueado_hasta, activo'

const digitos = (s: string | null | undefined) => (s || '').replace(/\D/g, '')

// Clientes con portal que coinciden con lo que escribió: CUIT (sin guiones),
// email, o teléfono (últimos 8 dígitos, así da igual el 0/15/+54).
async function buscarPorUsuario(usuario: string): Promise<FilaCliente[]> {
  const u = usuario.trim().toLowerCase()
  const { data } = await db.from('clientes').select(`${CAMPOS}, cuit, email, telefono`).eq('portal_activo', true)
  const filas = (data ?? []) as FilaCliente[]
  if (u.includes('@')) return filas.filter(c => (c.email || '').trim().toLowerCase() === u)
  const d = digitos(u)
  if (d.length === 11) {
    const porCuit = filas.filter(c => digitos(c.cuit) === d)
    if (porCuit.length) return porCuit
  }
  if (d.length >= 8) return filas.filter(c => digitos(c.telefono).length >= 8 && digitos(c.telefono).slice(-8) === d.slice(-8))
  return []
}

async function fallo(c: FilaCliente) {
  const intentos = (c.portal_intentos ?? 0) + 1
  const bloquear = intentos >= MAX_INTENTOS
  await db.from('clientes').update(bloquear
    ? { portal_intentos: 0, portal_bloqueado_hasta: new Date(Date.now() + BLOQUEO_MIN * 60000).toISOString() }
    : { portal_intentos: intentos }).eq('id', c.id)
  return bloquear
}

const bloqueado = (c: FilaCliente) => !!c.portal_bloqueado_hasta && new Date(c.portal_bloqueado_hasta) > new Date()
function msjBloqueo(c: FilaCliente) {
  const min = Math.ceil((new Date(c.portal_bloqueado_hasta!).getTime() - Date.now()) / 60000)
  return `Demasiados intentos. Probá de nuevo en ${min} minuto${min === 1 ? '' : 's'}.`
}

// POST { token, pin, recordar }   → entrada por el link personal
// POST { usuario, pin, recordar } → entrada sin link: CUIT, email o teléfono + PIN
export async function POST(req: NextRequest) {
  const { token, usuario, pin, recordar } = await req.json().catch(() => ({}))
  if (typeof pin !== 'string' || !/^\d{4,8}$/.test(pin)) return NextResponse.json({ error: 'Ingresá tu PIN de 6 números.' }, { status: 400 })

  let elegido: FilaCliente | null = null

  if (typeof token === 'string' && token.length >= 20) {
    const { data } = await db.from('clientes').select(CAMPOS).eq('portal_token', token).maybeSingle()
    const c = data as FilaCliente | null
    if (!c || !c.portal_activo || c.activo === false) {
      return NextResponse.json({ error: 'Este link no está activo. Pedí uno nuevo a tu vendedor.' }, { status: 404 })
    }
    if (bloqueado(c)) return NextResponse.json({ error: msjBloqueo(c) }, { status: 429 })
    if (!verificarPin(pin, c.portal_pin_hash)) {
      const b = await fallo(c)
      return NextResponse.json({ error: b ? `PIN incorrecto. Por seguridad, el acceso queda bloqueado ${BLOQUEO_MIN} minutos.` : 'PIN incorrecto.' }, { status: 401 })
    }
    elegido = c
  } else if (typeof usuario === 'string' && usuario.trim()) {
    // Mismo mensaje exista o no el usuario, para no revelar quién es cliente.
    const candidatos = (await buscarPorUsuario(usuario)).filter(c => c.activo !== false && c.portal_token)
    const libres = candidatos.filter(c => !bloqueado(c))
    if (candidatos.length && !libres.length) return NextResponse.json({ error: msjBloqueo(candidatos[0]) }, { status: 429 })
    elegido = libres.find(c => verificarPin(pin, c.portal_pin_hash)) ?? null
    if (!elegido) {
      let b = false
      for (const c of libres) b = (await fallo(c)) || b
      return NextResponse.json({ error: b ? `Datos incorrectos. Por seguridad, el acceso queda bloqueado ${BLOQUEO_MIN} minutos.` : 'El usuario o el PIN no coinciden. Revisá el mensaje de WhatsApp donde te mandamos el PIN.' }, { status: 401 })
    }
  } else {
    return NextResponse.json({ error: 'Ingresá tu CUIT, email o teléfono.' }, { status: 400 })
  }

  await db.from('clientes').update({
    portal_intentos: 0, portal_bloqueado_hasta: null, portal_ultimo_acceso: new Date().toISOString(),
  }).eq('id', elegido.id)

  const s = crearSesion(elegido.id, elegido.portal_token!, recordar !== false)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, s.valor, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', ...(s.maxAge ? { maxAge: s.maxAge } : {}) })
  return res
}
