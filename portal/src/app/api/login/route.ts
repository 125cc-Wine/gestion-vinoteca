import { randomBytes } from 'crypto'
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
  cuit?: string | null
}
const CAMPOS = 'id, portal_token, portal_pin_hash, portal_activo, portal_intentos, portal_bloqueado_hasta, activo'

const digitos = (s: string | null | undefined) => (s || '').replace(/\D/g, '')

// DNI de 8 dígitos a partir de un CUIT (11) o de un DNI cargado (7-8).
function dni8(d: string) {
  if (d.length === 11) return d.slice(2, 10)
  if (d.length === 7 || d.length === 8) return d.padStart(8, '0')
  return null
}

// Clientes que coinciden con el CUIT o DNI escrito (sea cual sea el formato
// con que esté cargado en gestión). Los repetidos de una misma empresa se
// resuelven por el que ya entró al portal o el más nuevo.
async function buscarPorCuit(texto: string): Promise<(FilaCliente & { empresa: string; created_at: string; portal_bloqueado: boolean; portal_ultimo_acceso: string | null })[]> {
  const buscado = dni8(digitos(texto))
  if (!buscado) return []
  const { data } = await db.from('clientes')
    .select(`${CAMPOS}, cuit, empresa, created_at, portal_bloqueado, portal_ultimo_acceso`)
    .not('cuit', 'is', null).ilike('cuit', `%${buscado.replace(/^0/, '').slice(-6)}%`)
  type Fila = FilaCliente & { cuit: string | null; empresa: string; created_at: string; portal_bloqueado: boolean; portal_ultimo_acceso: string | null }
  const filas = ((data ?? []) as unknown as Fila[]).filter(c => c.activo !== false && dni8(digitos(c.cuit)) === buscado)
  const porEmpresa = new Map<string, typeof filas[number]>()
  for (const c of filas.sort((a, b) => Number(!!b.portal_ultimo_acceso) - Number(!!a.portal_ultimo_acceso) || b.created_at.localeCompare(a.created_at))) {
    const e = c.empresa === 'lavid' ? 'lavid' : 'aroma'
    if (!porEmpresa.has(e)) porEmpresa.set(e, c)
  }
  return Array.from(porEmpresa.values())
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
// POST { cuit, empresa?, recordar } → entrada sin link, solo con CUIT o DNI
export async function POST(req: NextRequest) {
  const { token, cuit, empresa, pin, recordar } = await req.json().catch(() => ({}))

  let elegido: FilaCliente | null = null
  let verificado = false

  if (typeof token === 'string' && token.length >= 20) {
    if (typeof pin !== 'string' || !/^\d{4,8}$/.test(pin)) return NextResponse.json({ error: 'Ingresá tu PIN de 6 números.' }, { status: 400 })
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
    verificado = true
  } else if (typeof cuit === 'string' && cuit.trim()) {
    // Ingreso solo con CUIT/DNI: cualquier cliente cargado en gestión (decisión
    // del negocio: la lista no es secreta). Si se le suspendió el acceso desde
    // gestión, no entra. Si está en las dos empresas, elige con cuál.
    const candidatos = await buscarPorCuit(cuit)
    if (!candidatos.length) return NextResponse.json({ error: 'No encontramos ese CUIT entre nuestros clientes. Si sos cliente, escribile a tu vendedor.' }, { status: 404 })
    const libres = candidatos.filter(c => !c.portal_bloqueado)
    if (!libres.length) return NextResponse.json({ error: 'Tu acceso al portal está suspendido. Comunicate con tu vendedor.' }, { status: 403 })
    const pedida = empresa === 'lavid' || empresa === 'aroma' ? libres.find(c => (c.empresa === 'lavid' ? 'lavid' : 'aroma') === empresa) : null
    if (!pedida && libres.length > 1) return NextResponse.json({ elegir: libres.map(c => c.empresa === 'lavid' ? 'lavid' : 'aroma') })
    const c = pedida || libres[0]
    // Primer ingreso: se le habilita el portal (link propio incluido).
    if (!c.portal_activo || !c.portal_token) {
      const token = randomBytes(24).toString('base64url')
      const { error } = await db.from('clientes').update({ portal_activo: true, portal_token: token }).eq('id', c.id)
      if (error) return NextResponse.json({ error: 'No se pudo entrar. Probá de nuevo.' }, { status: 500 })
      c.portal_activo = true; c.portal_token = token
    }
    elegido = c
  } else {
    return NextResponse.json({ error: 'Ingresá tu CUIT.' }, { status: 400 })
  }

  await db.from('clientes').update({
    portal_intentos: 0, portal_bloqueado_hasta: null, portal_ultimo_acceso: new Date().toISOString(),
  }).eq('id', elegido.id)

  const s = crearSesion(elegido.id, elegido.portal_token!, recordar !== false, verificado)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, s.valor, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', ...(s.maxAge ? { maxAge: s.maxAge } : {}) })
  return res
}
