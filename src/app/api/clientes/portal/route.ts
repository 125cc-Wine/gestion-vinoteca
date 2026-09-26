export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, randomInt, scryptSync } from 'crypto'
import { supabase } from '@/lib/supabase'

// Acceso de un cliente al portal de pedidos (app aparte, carpeta portal/).
// El link lleva un token largo al azar; el PIN se guarda solo como hash —
// se muestra una única vez al generarlo, para mandárselo al cliente.
// Formato del hash: "scrypt$<sal>$<hash>" (portal/src/lib/pin.ts lo verifica).

const PORTAL_URL = (process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal-clientes-vinoteca.vercel.app').replace(/\/$/, '')

function hashPin(pin: string) {
  const sal = randomBytes(16)
  return `scrypt$${sal.toString('base64')}$${scryptSync(pin, sal, 32).toString('base64')}`
}

// GET ?cliente_id= → estado del acceso (sin datos secretos)
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('cliente_id')
  if (!id) return NextResponse.json({ error: 'cliente_id requerido' }, { status: 400 })
  const { data, error } = await supabase.from('clientes')
    .select('lista_precio_id, portal_activo, portal_ultimo_acceso, portal_bloqueado_hasta, portal_token')
    .eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    lista_precio_id: data.lista_precio_id,
    activo: !!data.portal_activo && !!data.portal_token,
    ultimo_acceso: data.portal_ultimo_acceso,
    bloqueado_hasta: data.portal_bloqueado_hasta,
    url: data.portal_activo && data.portal_token ? `${PORTAL_URL}/c/${data.portal_token}` : null,
  })
}

// POST { cliente_id, accion: 'generar' | 'revocar' | 'lista', lista_precio_id? }
export async function POST(req: NextRequest) {
  const { cliente_id, accion, lista_precio_id } = await req.json()
  if (!cliente_id) return NextResponse.json({ error: 'cliente_id requerido' }, { status: 400 })

  if (accion === 'lista') {
    const { error } = await supabase.from('clientes').update({ lista_precio_id: lista_precio_id || null }).eq('id', cliente_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (accion === 'revocar') {
    const { error } = await supabase.from('clientes')
      .update({ portal_activo: false, portal_token: null, portal_pin_hash: null }).eq('id', cliente_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (accion === 'generar') {
    // Link y PIN nuevos: el link anterior y sus sesiones abiertas dejan de andar.
    const token = randomBytes(24).toString('base64url')
    const pin = String(randomInt(0, 1_000_000)).padStart(6, '0')
    const { error } = await supabase.from('clientes').update({
      portal_token: token, portal_pin_hash: hashPin(pin), portal_activo: true,
      portal_intentos: 0, portal_bloqueado_hasta: null,
    }).eq('id', cliente_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, url: `${PORTAL_URL}/c/${token}`, pin })
  }

  return NextResponse.json({ error: 'accion inválida' }, { status: 400 })
}
