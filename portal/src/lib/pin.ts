import 'server-only'
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

// Formato: "scrypt$<sal base64>$<hash base64>". Lo genera la app de gestión
// (src/app/api/clientes/portal/route.ts) — mantener los dos iguales.
export function verificarPin(pin: string, guardado: string | null): boolean {
  if (!guardado) return false
  const [alg, sal, hash] = guardado.split('$')
  if (alg !== 'scrypt' || !sal || !hash) return false
  const esperado = Buffer.from(hash, 'base64')
  const calculado = scryptSync(pin, Buffer.from(sal, 'base64'), esperado.length)
  return timingSafeEqual(esperado, calculado)
}

// Mismo formato que hashPin de gestión (src/lib/portalPin.ts).
export function hashPin(pin: string) {
  const sal = randomBytes(16)
  return `scrypt$${sal.toString('base64')}$${scryptSync(pin, sal, 32).toString('base64')}`
}

// PIN que elige el cliente: 4 a 8 números, que no sean todos iguales ni una
// escalera (1234, 4321…), porque son los primeros que se prueban.
export function pinValido(pin: string): string | null {
  if (!/^\d{4,8}$/.test(pin)) return 'El PIN tiene que tener entre 4 y 8 números'
  if (/^(\d)\1+$/.test(pin)) return 'No uses todos números iguales'
  const d = pin.split('').map(Number)
  const escalera = (paso: number) => d.every((x, i) => i === 0 || x === (d[i - 1] + paso + 10) % 10)
  if (escalera(1) || escalera(-1)) return 'No uses números seguidos (como 1234)'
  return null
}
