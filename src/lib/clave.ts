import 'server-only'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto'

// Contraseñas de gestión: scrypt con sal propia ("scrypt$sal$hash").
export function hashClave(clave: string) {
  const sal = randomBytes(16).toString('base64url')
  return `scrypt$${sal}$${scryptSync(clave, sal, 64).toString('base64url')}`
}

export function verificarClave(clave: string, guardado: string | null | undefined) {
  const [tipo, sal, hash] = (guardado || '').split('$')
  if (tipo !== 'scrypt' || !sal || !hash) return false
  const a = scryptSync(clave, sal, 64), b = Buffer.from(hash, 'base64url')
  return a.length === b.length && timingSafeEqual(a, b)
}

// Invitaciones: el link lleva un token al azar; en la base queda solo su sha256.
export function nuevoTokenInvitacion() {
  const token = randomBytes(24).toString('base64url')
  return { token, hash: hashToken(token) }
}
export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex')
