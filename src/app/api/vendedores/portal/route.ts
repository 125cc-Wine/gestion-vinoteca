export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PORTAL_URL, hashPin, nuevoPin, nuevoToken } from '@/lib/portalPin'

// Acceso del vendedor de calle al portal (Vendedores > Acceso al portal).
// GET ?vendedor_id= → estado. POST { vendedor_id, accion: 'acceso' | 'revocar' }
//   'acceso': mismo link si ya tenía, PIN nuevo (el anterior deja de servir).
//   'revocar': link y PIN dejan de funcionar (y se cierran sus sesiones).
const err = (m: string, status = 500) => NextResponse.json({ error: m }, { status })

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('vendedor_id')
  if (!id) return err('vendedor_id requerido', 400)
  const { data, error } = await supabase.from('vendedores').select('portal_token, portal_ultimo_acceso').eq('id', id).single()
  if (error) return err(error.message)
  return NextResponse.json({ activo: !!data.portal_token, ultimo_acceso: data.portal_ultimo_acceso })
}

export async function POST(req: NextRequest) {
  const { vendedor_id, accion } = await req.json().catch(() => ({}))
  if (!vendedor_id) return err('vendedor_id requerido', 400)

  if (accion === 'revocar') {
    const { error } = await supabase.from('vendedores').update({ portal_token: null, portal_pin_hash: null }).eq('id', vendedor_id)
    if (error) return err(error.message)
    return NextResponse.json({ ok: true })
  }

  if (accion === 'acceso') {
    const { data: actual } = await supabase.from('vendedores').select('portal_token').eq('id', vendedor_id).single()
    const token = actual?.portal_token || nuevoToken()
    const pin = nuevoPin()
    const { error } = await supabase.from('vendedores').update({
      portal_token: token, portal_pin_hash: hashPin(pin), portal_intentos: 0, portal_bloqueado_hasta: null,
    }).eq('id', vendedor_id)
    if (error) return err(error.message)
    return NextResponse.json({ ok: true, url: `${PORTAL_URL}/v/${token}`, pin })
  }

  return err('accion inválida', 400)
}
