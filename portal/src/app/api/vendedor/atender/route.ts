import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { COOKIE_VC, vendedorActual } from '@/lib/session'

export const dynamic = 'force-dynamic'

// El vendedor elige a qué cliente atiende (pedido, cuenta). Solo sus clientes.
// POST { cliente_id } · DELETE → vuelve a su lista.
export async function POST(req: NextRequest) {
  const vendedor = await vendedorActual()
  if (!vendedor) return NextResponse.json({ error: 'Tu sesión venció.' }, { status: 401 })
  const { cliente_id } = await req.json().catch(() => ({}))
  if (typeof cliente_id !== 'string') return NextResponse.json({ error: 'Falta el cliente' }, { status: 400 })
  const { data } = await db.from('clientes').select('id').eq('id', cliente_id).eq('vendedor_id', vendedor.id).maybeSingle()
  if (!data) return NextResponse.json({ error: 'Ese cliente no está en tu cartera' }, { status: 404 })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_VC, cliente_id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 12 * 3600 })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_VC)
  return res
}
