export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import { cotizarEnvio } from '@/lib/andreani-cotizador'

// GET /api/andreani/cotizar?cp=7300&botellas=42 — cuánto cobra Andreani por
// ese envío con la tarifa actual (ver src/lib/andreani-cotizador.ts).
export async function GET(req: NextRequest) {
  const cp = (req.nextUrl.searchParams.get('cp') || '').replace(/\D/g, '')
  const botellas = Math.floor(Number(req.nextUrl.searchParams.get('botellas')))
  if (cp.length !== 4) return NextResponse.json({ error: 'Código postal de 4 dígitos' }, { status: 400 })
  if (!(botellas >= 1 && botellas <= 300)) return NextResponse.json({ error: 'Cantidad de botellas entre 1 y 300' }, { status: 400 })
  try {
    return NextResponse.json(await cotizarEnvio(cp, botellas))
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'No se pudo cotizar' }, { status: 502 })
  }
}
