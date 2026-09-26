import 'server-only'
import { scryptSync, timingSafeEqual } from 'crypto'

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
