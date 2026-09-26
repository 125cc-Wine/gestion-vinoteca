export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes, randomInt, scryptSync } from 'crypto'
import { supabase } from '@/lib/supabase'

// Acceso de clientes al portal de pedidos (app aparte, carpeta portal/).
// El link lleva un token largo al azar; el PIN se guarda solo como hash —
// se muestra al generarlo/compartirlo, para mandárselo al cliente.
// Formato del hash: "scrypt$<sal>$<hash>" (portal/src/lib/pin.ts lo verifica).

const PORTAL_URL = (process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal-clientes-vinoteca.vercel.app').replace(/\/$/, '')

function hashPin(pin: string) {
  const sal = randomBytes(16)
  return `scrypt$${sal.toString('base64')}$${scryptSync(pin, sal, 32).toString('base64')}`
}
const nuevoPin = () => String(randomInt(0, 1_000_000)).padStart(6, '0')
const nuevoToken = () => randomBytes(24).toString('base64url')

// GET ?cliente_id=  → estado del acceso de un cliente (sin datos secretos)
// GET (sin params)  → clientes que tienen lista o acceso al portal (pantalla Portal)
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('cliente_id')
  if (!id) {
    const { data, error } = await supabase.from('clientes')
      .select('id, empresa, nombre, apellido, razon_social, telefono, lista_precio_id, portal_activo, portal_token, portal_ultimo_acceso')
      .eq('activo', true)
      .or('lista_precio_id.not.is.null,portal_token.not.is.null')
      .order('nombre')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      portal_url: PORTAL_URL,
      clientes: (data || []).map(c => ({
        id: c.id, empresa: c.empresa, telefono: c.telefono,
        nombre: c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim(),
        lista_precio_id: c.lista_precio_id,
        activo: !!c.portal_activo && !!c.portal_token,
        ultimo_acceso: c.portal_ultimo_acceso,
      })),
    })
  }
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

// POST { accion, cliente_id?, lista_precio_id?, lista_id? }
//  'lista'     → asigna la lista de precios del cliente
//  'compartir' → deja el acceso listo para mandar: conserva el link si ya
//                tenía (no le corta nada) y genera un PIN nuevo. Con
//                lista_precio_id, además le asigna esa lista.
//  'generar'   → link Y PIN nuevos: el link anterior deja de andar
//  'revocar'   → saca el acceso
//  'admin'     → pase de un solo uso (5 min) para ver el portal como el
//                cliente (cliente_id) o una vista previa de una lista (lista_id).
//                Se guarda solo el hash; el portal lo consume en /admin/<pase>.
export async function POST(req: NextRequest) {
  const { cliente_id, accion, lista_precio_id, lista_id } = await req.json()

  if (accion === 'admin') {
    if (!cliente_id && !lista_id) return NextResponse.json({ error: 'cliente_id o lista_id requerido' }, { status: 400 })
    const pase = randomBytes(24).toString('base64url')
    await supabase.from('portal_pases').delete().lt('expira', new Date().toISOString())
    const { error } = await supabase.from('portal_pases').insert([{
      hash: createHash('sha256').update(pase).digest('base64url'),
      cliente_id: cliente_id || null, lista_id: cliente_id ? null : lista_id,
      expira: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, url: `${PORTAL_URL}/admin/${pase}` })
  }

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

  if (accion === 'generar' || accion === 'compartir') {
    const { data: actual } = await supabase.from('clientes').select('portal_token, portal_activo').eq('id', cliente_id).single()
    const token = accion === 'compartir' && actual?.portal_activo && actual.portal_token ? actual.portal_token : nuevoToken()
    const pin = nuevoPin()
    const cambios: Record<string, unknown> = {
      portal_token: token, portal_pin_hash: hashPin(pin), portal_activo: true,
      portal_intentos: 0, portal_bloqueado_hasta: null,
    }
    if (lista_precio_id) cambios.lista_precio_id = lista_precio_id
    const { error } = await supabase.from('clientes').update(cambios).eq('id', cliente_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, url: `${PORTAL_URL}/c/${token}`, pin })
  }

  return NextResponse.json({ error: 'accion inválida' }, { status: 400 })
}
