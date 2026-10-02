// Sesión del login de gestión: cookie httpOnly firmada con HMAC-SHA256
// (GESTION_SESSION_SECRET). Usa Web Crypto para poder verificarse también en
// el middleware (que corre en Edge, sin el módulo crypto de Node).

export const COOKIE_SESION = 'gv_s'
export const DURACION_SESION_S = 30 * 24 * 60 * 60

export interface Sesion { u: string; email: string; e: number }

const enc = new TextEncoder()

function b64url(bytes: Uint8Array) {
  let s = ''
  bytes.forEach(b => { s += String.fromCharCode(b) })
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function desdeB64url(s: string) {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(b, c => c.charCodeAt(0))
}

async function clave() {
  const s = process.env.GESTION_SESSION_SECRET
  if (!s || s.length < 32) return null
  return crypto.subtle.importKey('raw', enc.encode(s), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function firmarSesion(datos: Omit<Sesion, 'e'>): Promise<string> {
  const k = await clave()
  if (!k) throw new Error('Falta GESTION_SESSION_SECRET')
  const cuerpo = b64url(enc.encode(JSON.stringify({ ...datos, e: Date.now() + DURACION_SESION_S * 1000 })))
  const firma = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(cuerpo)))
  return `${cuerpo}.${b64url(firma)}`
}

export async function leerSesion(valor: string | undefined | null): Promise<Sesion | null> {
  if (!valor) return null
  const [cuerpo, firma] = valor.split('.')
  if (!cuerpo || !firma) return null
  const k = await clave()
  if (!k) return null
  try {
    const ok = await crypto.subtle.verify('HMAC', k, desdeB64url(firma), enc.encode(cuerpo))
    if (!ok) return null
    const s = JSON.parse(new TextDecoder().decode(desdeB64url(cuerpo))) as Sesion
    return typeof s.u === 'string' && s.e > Date.now() ? s : null
  } catch { return null }
}
