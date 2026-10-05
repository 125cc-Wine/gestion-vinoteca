export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PORTAL_URL, hashPin, nuevoPin, nuevoToken } from '@/lib/portalPin'

// Acceso del vendedor de calle al portal (Vendedores > Acceso al portal).
// GET ?vendedor_id= → estado. POST { vendedor_id, accion: 'acceso' | 'nuevo_pin' | 'revocar' }
//   'acceso': mismo link y, si ya tenía PIN, lo conserva (no se puede volver a
//             mostrar: se guarda cifrado). Si no tenía acceso, link y PIN nuevos.
//   'nuevo_pin': mismo link, PIN nuevo (si se lo olvidó).
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

  if (accion === 'acceso' || accion === 'nuevo_pin') {
    const { data: actual } = await supabase.from('vendedores').select('portal_token, portal_pin_hash').eq('id', vendedor_id).single()
    const token = actual?.portal_token || nuevoToken()
    const conservaPin = accion === 'acceso' && !!actual?.portal_token && !!actual.portal_pin_hash
    const pin = conservaPin ? null : nuevoPin()
    const { error } = await supabase.from('vendedores').update({
      portal_token: token,
      ...(pin ? { portal_pin_hash: hashPin(pin), portal_intentos: 0, portal_bloqueado_hasta: null } : {}),
    }).eq('id', vendedor_id)
    if (error) return err(error.message)
    return NextResponse.json({ ok: true, url: `${PORTAL_URL}/v/${token}`, pin, conservaPin })
  }

  return err('accion inválida', 400)
}
