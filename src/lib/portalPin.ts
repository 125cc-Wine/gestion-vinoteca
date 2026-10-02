import 'server-only'
import { randomBytes, randomInt, scryptSync } from 'crypto'

// Accesos al portal (clientes y vendedores): link con token al azar + PIN de
// 6 números. El PIN se guarda solo como hash "scrypt$<sal>$<hash>" (lo
// verifica portal/src/lib/pin.ts).
export const PORTAL_URL = (process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal-clientes-vinoteca.vercel.app').replace(/\/$/, '')

export function hashPin(pin: string) {
  const sal = randomBytes(16)
  return `scrypt$${sal.toString('base64')}$${scryptSync(pin, sal, 32).toString('base64')}`
}
export const nuevoPin = () => String(randomInt(0, 1_000_000)).padStart(6, '0')
export const nuevoToken = () => randomBytes(24).toString('base64url')
