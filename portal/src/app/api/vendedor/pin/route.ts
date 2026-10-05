import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { vendedorActual } from '@/lib/session'
import { hashPin, pinValido, verificarPin } from '@/lib/pin'

export const dynamic = 'force-dynamic'

// El vendedor cambia su PIN desde su pantalla del portal (pide el actual).
// El link no cambia y su sesión sigue; desde gestión ya no se le cambia al reenviarle el link.
export async function POST(req: NextRequest) {
  const vendedor = await vendedorActual()
  if (!vendedor) return NextResponse.json({ error: 'Tu sesión venció. Volvé a entrar.' }, { status: 401 })
  const { actual, nuevo } = await req.json().catch(() => ({}))
  if (typeof actual !== 'string' || typeof nuevo !== 'string') return NextResponse.json({ error: 'Completá los dos PIN' }, { status: 400 })

  const { data: v } = await db.from('vendedores').select('portal_pin_hash, portal_intentos, portal_bloqueado_hasta').eq('id', vendedor.id).single()
  if (v?.portal_bloqueado_hasta && new Date(v.portal_bloqueado_hasta) > new Date()) {
    return NextResponse.json({ error: 'Demasiados intentos. Probá de nuevo en unos minutos.' }, { status: 429 })
  }
  if (!verificarPin(actual, v?.portal_pin_hash ?? null)) {
    const intentos = (v?.portal_intentos ?? 0) + 1
    await db.from('vendedores').update(intentos >= 5
      ? { portal_intentos: 0, portal_bloqueado_hasta: new Date(Date.now() + 15 * 60000).toISOString() }
      : { portal_intentos: intentos }).eq('id', vendedor.id)
    return NextResponse.json({ error: 'El PIN actual no es correcto' }, { status: 401 })
  }
  const problema = pinValido(nuevo)
  if (problema) return NextResponse.json({ error: problema }, { status: 400 })
  if (nuevo === actual) return NextResponse.json({ error: 'El PIN nuevo es igual al actual' }, { status: 400 })

  const { error } = await db.from('vendedores').update({ portal_pin_hash: hashPin(nuevo), portal_intentos: 0, portal_bloqueado_hasta: null }).eq('id', vendedor.id)
  if (error) return NextResponse.json({ error: 'No se pudo guardar. Probá de nuevo.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
