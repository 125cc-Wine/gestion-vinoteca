import 'server-only'
import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { db } from './db'

export const COOKIE = 'portal_s'
const DURACION_MS = 30 * 24 * 60 * 60 * 1000

function secreto() {
  const s = process.env.PORTAL_SESSION_SECRET
  if (!s || s.length < 32) throw new Error('Falta PORTAL_SESSION_SECRET')
  return s
}

// Huella del link: si desde gestión se regenera o revoca el acceso, el token
// cambia y todas las sesiones abiertas con el link viejo dejan de valer.
export function huellaToken(token: string) {
  return createHash('sha256').update(token).digest('base64url').slice(0, 16)
}

function firmar(datos: string) {
  return createHmac('sha256', secreto()).update(datos).digest('base64url')
}

export function crearSesion(clienteId: string, token: string) {
  const datos = Buffer.from(JSON.stringify({ c: clienteId, t: huellaToken(token), e: Date.now() + DURACION_MS })).toString('base64url')
  return { valor: `${datos}.${firmar(datos)}`, maxAge: DURACION_MS / 1000 }
}

function leerSesion(): { c: string; t: string } | null {
  const v = cookies().get(COOKIE)?.value
  if (!v) return null
  const [datos, firma] = v.split('.')
  if (!datos || !firma) return null
  const a = Buffer.from(firma), b = Buffer.from(firmar(datos))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const s = JSON.parse(Buffer.from(datos, 'base64url').toString())
    if (typeof s.c !== 'string' || typeof s.t !== 'string' || !(s.e > Date.now())) return null
    return s
  } catch { return null }
}

export interface ClientePortal {
  id: string
  empresa: 'aroma' | 'lavid'
  nombre: string
  lista_precio_id: string | null
  portal_token: string
}

// Cliente logueado, o null si no hay sesión válida / el acceso fue revocado.
export async function clienteActual(): Promise<ClientePortal | null> {
  const s = leerSesion()
  if (!s) return null
  const { data } = await db.from('clientes')
    .select('id, empresa, nombre, apellido, razon_social, lista_precio_id, portal_token, portal_activo, activo')
    .eq('id', s.c).maybeSingle()
  if (!data || !data.portal_activo || data.activo === false || !data.portal_token) return null
  if (huellaToken(data.portal_token) !== s.t) return null
  return {
    id: data.id,
    empresa: data.empresa === 'lavid' ? 'lavid' : 'aroma',
    nombre: data.razon_social || `${data.nombre} ${data.apellido || ''}`.trim(),
    lista_precio_id: data.lista_precio_id,
    portal_token: data.portal_token,
  }
}
