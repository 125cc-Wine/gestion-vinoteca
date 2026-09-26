import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { COOKIE, crearSesionAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Entrada de administración: gestión (/api/clientes/portal, accion 'admin')
// genera un pase al azar, guarda solo su hash con vencimiento de 5 minutos y
// abre esta URL. El pase se consume al usarlo (un solo uso).
export async function GET(req: NextRequest, { params }: { params: { pase: string } }) {
  const hash = createHash('sha256').update(params.pase).digest('base64url')
  const { data } = await db.from('clientes')
    .update({ portal_admin_pase_hash: null, portal_admin_pase_expira: null })
    .eq('portal_admin_pase_hash', hash)
    .gt('portal_admin_pase_expira', new Date().toISOString())
    .select('id').maybeSingle()
  if (!data) return NextResponse.redirect(new URL('/?pase=vencido', req.url), 303)

  const s = crearSesionAdmin(data.id)
  const res = NextResponse.redirect(new URL('/', req.url), 303)
  res.cookies.set(COOKIE, s.valor, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: s.maxAge })
  return res
}
