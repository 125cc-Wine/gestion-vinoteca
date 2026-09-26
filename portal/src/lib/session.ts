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

// Sesión de administración: se entra desde gestión con un pase de un solo
// uso. Puede ser "como un cliente" (c) o "vista previa de una lista" (l, sin
// cliente: se ve el catálogo pero no se pueden enviar pedidos). No depende
// del link ni del PIN del cliente y dura poco.
const DURACION_ADMIN_MS = 8 * 60 * 60 * 1000
export function crearSesionAdmin(destino: { cliente_id?: string | null; lista_id?: string | null }) {
  const datos = Buffer.from(JSON.stringify({ c: destino.cliente_id || undefined, l: destino.lista_id || undefined, a: 1, e: Date.now() + DURACION_ADMIN_MS })).toString('base64url')
  return { valor: `${datos}.${firmar(datos)}`, maxAge: DURACION_ADMIN_MS / 1000 }
}

interface Sesion { c?: string; l?: string; t?: string; a?: number }

function leerSesion(): Sesion | null {
  const v = cookies().get(COOKIE)?.value
  if (!v) return null
  const [datos, firma] = v.split('.')
  if (!datos || !firma) return null
  const a = Buffer.from(firma), b = Buffer.from(firmar(datos))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const s = JSON.parse(Buffer.from(datos, 'base64url').toString())
    if (!(s.e > Date.now())) return null
    if (s.a === 1) return (typeof s.c === 'string' || typeof s.l === 'string') ? s : null
    return typeof s.c === 'string' && typeof s.t === 'string' ? s : null
  } catch { return null }
}

export interface ClientePortal {
  id: string | null          // null = vista previa de una lista, sin cliente
  empresa: 'aroma' | 'lavid'
  nombre: string
  lista_precio_id: string | null
  portal_token: string | null
  admin: boolean
  preview: boolean
}

// Cliente logueado (o vista previa de admin), o null si no hay sesión
// válida / el acceso fue revocado.
export async function clienteActual(): Promise<ClientePortal | null> {
  const s = leerSesion()
  if (!s) return null
  const admin = s.a === 1

  if (admin && !s.c && s.l) {
    const { data: lista } = await db.from('listas_precio').select('id, nombre, empresa').eq('id', s.l).maybeSingle()
    if (!lista) return null
    return {
      id: null, empresa: lista.empresa === 'lavid' ? 'lavid' : 'aroma', nombre: lista.nombre,
      lista_precio_id: lista.id, portal_token: null, admin: true, preview: true,
    }
  }

  const { data } = await db.from('clientes')
    .select('id, empresa, nombre, apellido, razon_social, lista_precio_id, portal_token, portal_activo, activo')
    .eq('id', s.c!).maybeSingle()
  if (!data) return null
  if (!admin) {
    if (!data.portal_activo || data.activo === false || !data.portal_token) return null
    if (huellaToken(data.portal_token) !== s.t) return null
  }
  return {
    id: data.id,
    empresa: data.empresa === 'lavid' ? 'lavid' : 'aroma',
    nombre: data.razon_social || `${data.nombre} ${data.apellido || ''}`.trim(),
    lista_precio_id: data.lista_precio_id,
    portal_token: data.portal_token,
    admin,
    preview: false,
  }
}
