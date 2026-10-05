import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clienteActual } from '@/lib/session'
import { hashPin, pinValido, verificarPin } from '@/lib/pin'

export const dynamic = 'force-dynamic'

// El cliente cambia su PIN desde "Mi cuenta". Hace falta la cuenta
// habilitada (entró con link + PIN) y el PIN actual. El link no cambia y sus
// sesiones abiertas siguen; desde gestión ya no se le cambia al reenviarle el link.
export async function POST(req: NextRequest) {
  const cliente = await clienteActual()
  if (!cliente?.id || !cliente.verificado || cliente.admin || cliente.vendedor) {
    return NextResponse.json({ error: 'Para cambiar el PIN entrá con tu link personal.' }, { status: 401 })
  }
  const { actual, nuevo } = await req.json().catch(() => ({}))
  if (typeof actual !== 'string' || typeof nuevo !== 'string') return NextResponse.json({ error: 'Completá los dos PIN' }, { status: 400 })

  const { data: c } = await db.from('clientes').select('portal_pin_hash, portal_intentos, portal_bloqueado_hasta').eq('id', cliente.id).single()
  if (c?.portal_bloqueado_hasta && new Date(c.portal_bloqueado_hasta) > new Date()) {
    return NextResponse.json({ error: 'Demasiados intentos. Probá de nuevo en unos minutos.' }, { status: 429 })
  }
  if (!verificarPin(actual, c?.portal_pin_hash ?? null)) {
    const intentos = (c?.portal_intentos ?? 0) + 1
    await db.from('clientes').update(intentos >= 5
      ? { portal_intentos: 0, portal_bloqueado_hasta: new Date(Date.now() + 15 * 60000).toISOString() }
      : { portal_intentos: intentos }).eq('id', cliente.id)
    return NextResponse.json({ error: 'El PIN actual no es correcto' }, { status: 401 })
  }
  const problema = pinValido(nuevo)
  if (problema) return NextResponse.json({ error: problema }, { status: 400 })
  if (nuevo === actual) return NextResponse.json({ error: 'El PIN nuevo es igual al actual' }, { status: 400 })

  const { error } = await db.from('clientes').update({ portal_pin_hash: hashPin(nuevo), portal_intentos: 0, portal_bloqueado_hasta: null }).eq('id', cliente.id)
  if (error) return NextResponse.json({ error: 'No se pudo guardar. Probá de nuevo.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
