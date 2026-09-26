import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { COOKIE, crearSesionAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Entrada de administración: gestión (/api/clientes/portal, accion 'admin')
// genera un pase al azar, guarda solo su hash en portal_pases, con vencimiento
// de 5 minutos, y abre esta URL. El pase se borra al usarlo (un solo uso).
export async function GET(req: NextRequest, { params }: { params: { pase: string } }) {
  const hash = createHash('sha256').update(params.pase).digest('base64url')
  const { data } = await db.from('portal_pases')
    .delete()
    .eq('hash', hash)
    .gt('expira', new Date().toISOString())
    .select('cliente_id, lista_id').maybeSingle()
  if (!data) return NextResponse.redirect(new URL('/?pase=vencido', req.url), 303)

  const s = crearSesionAdmin(data)
  const res = NextResponse.redirect(new URL('/', req.url), 303)
  res.cookies.set(COOKIE, s.valor, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: s.maxAge })
  return res
}
