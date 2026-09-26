export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes, randomInt, scryptSync } from 'crypto'
import { supabase } from '@/lib/supabase'

// Portal de pedidos de clientes (app aparte, carpeta portal/).
// - El cliente ve todo el catálogo menos lo marcado productos.portal_oculto,
//   con su descuento propio (clientes.portal_descuento) o, si no tiene, el
//   general (app_config 'portal_descuento_general').
// - Acceso por link (token largo al azar) + PIN; el PIN se guarda solo como
//   hash "scrypt$<sal>$<hash>" (portal/src/lib/pin.ts lo verifica).

const PORTAL_URL = (process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal-clientes-vinoteca.vercel.app').replace(/\/$/, '')
const CLAVE_GENERAL = 'portal_descuento_general'

function hashPin(pin: string) {
  const sal = randomBytes(16)
  return `scrypt$${sal.toString('base64')}$${scryptSync(pin, sal, 32).toString('base64')}`
}
const nuevoPin = () => String(randomInt(0, 1_000_000)).padStart(6, '0')
const nuevoToken = () => randomBytes(24).toString('base64url')
const err = (m: string, status = 500) => NextResponse.json({ error: m }, { status })

// null = "usa el general"; si no, un % entre 0 y 99.
function aDescuento(v: unknown): number | null | 'invalido' {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n < 100 ? Math.round(n * 100) / 100 : 'invalido'
}

async function descuentoGeneral() {
  const { data } = await supabase.from('app_config').select('valor').eq('clave', CLAVE_GENERAL).maybeSingle()
  const n = Number(data?.valor)
  return Number.isFinite(n) ? n : 35
}

// GET ?cliente_id=  → estado del acceso de un cliente (sin datos secretos)
// GET               → pantalla Portal: descuento general + clientes con acceso o descuento propio
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('cliente_id')
  if (!id) {
    const [general, { data, error }] = await Promise.all([
      descuentoGeneral(),
      supabase.from('clientes')
        .select('id, empresa, nombre, apellido, razon_social, telefono, portal_descuento, portal_activo, portal_token, portal_ultimo_acceso')
        .eq('activo', true)
        .or('portal_descuento.not.is.null,portal_token.not.is.null')
        .order('nombre'),
    ])
    if (error) return err(error.message)
    return NextResponse.json({
      portal_url: PORTAL_URL,
      descuento_general: general,
      clientes: (data || []).map(c => ({
        id: c.id, empresa: c.empresa, telefono: c.telefono,
        nombre: c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim(),
        descuento: c.portal_descuento == null ? null : Number(c.portal_descuento),
        activo: !!c.portal_activo && !!c.portal_token,
        ultimo_acceso: c.portal_ultimo_acceso,
      })),
    })
  }
  const [general, { data, error }] = await Promise.all([
    descuentoGeneral(),
    supabase.from('clientes')
      .select('portal_descuento, portal_activo, portal_ultimo_acceso, portal_bloqueado_hasta, portal_token')
      .eq('id', id).single(),
  ])
  if (error) return err(error.message)
  return NextResponse.json({
    descuento: data.portal_descuento == null ? null : Number(data.portal_descuento),
    descuento_general: general,
    activo: !!data.portal_activo && !!data.portal_token,
    ultimo_acceso: data.portal_ultimo_acceso,
    bloqueado_hasta: data.portal_bloqueado_hasta,
    url: data.portal_activo && data.portal_token ? `${PORTAL_URL}/c/${data.portal_token}` : null,
  })
}

// POST { accion, ... }
//  'general'   { descuento }            → descuento general del portal
//  'descuento' { cliente_id, descuento } → descuento propio (null = usa el general)
//  'compartir' { cliente_id, descuento? } → deja el acceso listo para mandar:
//                conserva el link si ya tenía y genera un PIN nuevo
//  'generar'   { cliente_id }            → link Y PIN nuevos (el link anterior deja de andar)
//  'revocar'   { cliente_id }            → saca el acceso
//  'ocultar'   { producto_id, oculto }   → oculta/muestra un producto en el portal
//                (y en su gemelo de la otra empresa)
//  'admin'     { cliente_id } | { empresa } → pase de un solo uso (5 min) para
//                ver el portal como el cliente, o una vista previa sin cliente.
//                Se guarda solo el hash; el portal lo consume en /admin/<pase>.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { cliente_id, accion } = body

  if (accion === 'general') {
    const d = aDescuento(body.descuento)
    if (d === 'invalido' || d === null) return err('Descuento inválido', 400)
    const { error } = await supabase.from('app_config')
      .upsert({ clave: CLAVE_GENERAL, valor: String(d), updated_at: new Date().toISOString() }, { onConflict: 'clave' })
    if (error) return err(error.message)
    return NextResponse.json({ ok: true })
  }

  if (accion === 'ocultar') {
    if (!body.producto_id) return err('producto_id requerido', 400)
    const { data: p } = await supabase.from('productos').select('id, gemelo_id').eq('id', body.producto_id).single()
    const ids = [body.producto_id, p?.gemelo_id].filter(Boolean)
    const { error } = await supabase.from('productos').update({ portal_oculto: !!body.oculto }).in('id', ids)
    if (error) return err(error.message)
    return NextResponse.json({ ok: true })
  }

  if (accion === 'admin') {
    if (!cliente_id && !body.empresa) return err('cliente_id o empresa requerido', 400)
    const pase = randomBytes(24).toString('base64url')
    await supabase.from('portal_pases').delete().lt('expira', new Date().toISOString())
    const { error } = await supabase.from('portal_pases').insert([{
      hash: createHash('sha256').update(pase).digest('base64url'),
      cliente_id: cliente_id || null,
      empresa: cliente_id ? null : (body.empresa === 'lavid' ? 'lavid' : 'aroma'),
      expira: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }])
    if (error) return err(error.message)
    return NextResponse.json({ ok: true, url: `${PORTAL_URL}/admin/${pase}` })
  }

  if (!cliente_id) return err('cliente_id requerido', 400)

  if (accion === 'descuento') {
    const d = aDescuento(body.descuento)
    if (d === 'invalido') return err('Descuento inválido', 400)
    const { error } = await supabase.from('clientes').update({ portal_descuento: d }).eq('id', cliente_id)
    if (error) return err(error.message)
    return NextResponse.json({ ok: true })
  }

  if (accion === 'revocar') {
    const { error } = await supabase.from('clientes')
      .update({ portal_activo: false, portal_token: null, portal_pin_hash: null }).eq('id', cliente_id)
    if (error) return err(error.message)
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
    if ('descuento' in body) {
      const d = aDescuento(body.descuento)
      if (d === 'invalido') return err('Descuento inválido', 400)
      cambios.portal_descuento = d
    }
    const { error } = await supabase.from('clientes').update(cambios).eq('id', cliente_id)
    if (error) return err(error.message)
    return NextResponse.json({ ok: true, url: `${PORTAL_URL}/c/${token}`, pin })
  }

  return err('accion inválida', 400)
}
