import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clienteActual } from '@/lib/session'
import { validarDatos } from '@/lib/datos'

export const dynamic = 'force-dynamic'

// POST → guarda contacto y horarios de entrega del cliente logueado.
export async function POST(req: NextRequest) {
  const cliente = await clienteActual()
  if (!cliente || !cliente.id) return NextResponse.json({ error: 'Tu sesión venció. Volvé a entrar.' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { datos, error } = validarDatos(body)
  if (!datos) return NextResponse.json({ error }, { status: 400 })
  const { error: e } = await db.from('clientes').update({ portal_datos: datos, portal_datos_at: new Date().toISOString() }).eq('id', cliente.id)
  if (e) return NextResponse.json({ error: 'No se pudo guardar. Probá de nuevo.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
