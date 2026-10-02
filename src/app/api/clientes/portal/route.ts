export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes, randomInt, scryptSync } from 'crypto'
import { supabase } from '@/lib/supabase'
import { grupoPrecio } from '@/lib/precioPortal'

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
  // Opciones para los descuentos especiales de un cliente: bodegas/marcas,
  // grupos (tipo de vino o rubro) y productos de su empresa.
  if (req.nextUrl.searchParams.get('opciones')) {
    const empresa = req.nextUrl.searchParams.get('empresa') === 'lavid' ? 'lavid' : 'aroma'
    const prods: { id: string; nombre: string; bodega: string | null; categoria: string | null; varietal: string | null }[] = []
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await supabase.from('productos').select('id, nombre, bodega, categoria, varietal')
        .eq('empresa', empresa).eq('activo', true).gt('precio_venta', 0).order('nombre').range(desde, desde + 999)
      if (error) return err(error.message)
      prods.push(...(data || []))
      if (!data || data.length < 1000) break
    }
    const uniq = (xs: (string | null)[]) => Array.from(new Set(xs.filter((x): x is string => !!x))).sort((a, b) => a.localeCompare(b, 'es'))
    return NextResponse.json({
      marcas: uniq(prods.map(p => p.bodega)),
      grupos: uniq(prods.map(p => grupoPrecio(p))),
      productos: prods.map(p => ({ id: p.id, nombre: p.nombre })),
    })
  }

  const id = req.nextUrl.searchParams.get('cliente_id')
  if (!id) {
    const [general, { data, error }] = await Promise.all([
      descuentoGeneral(),
      supabase.from('clientes')
        .select('id, empresa, nombre, apellido, razon_social, telefono, portal_descuento, portal_activo, portal_token, portal_ultimo_acceso, portal_bloqueado, portal_datos')
        .eq('activo', true)
        .or('portal_descuento.not.is.null,portal_token.not.is.null,portal_bloqueado.eq.true')
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
        activo: !!c.portal_activo && !!c.portal_token && !c.portal_bloqueado,
        suspendido: !!c.portal_bloqueado,
        datos: c.portal_datos ?? null,
        ultimo_acceso: c.portal_ultimo_acceso,
      })),
    })
  }
  const [general, { data, error }, { data: reglas }] = await Promise.all([
    descuentoGeneral(),
    supabase.from('clientes')
      .select('portal_descuento, portal_activo, portal_ultimo_acceso, portal_bloqueado_hasta, portal_token, portal_bloqueado, portal_datos, portal_datos_at')
      .eq('id', id).single(),
    supabase.from('portal_reglas_cliente').select('nivel, clave, descuento').eq('cliente_id', id).order('nivel'),
  ])
  if (error) return err(error.message)
  return NextResponse.json({
    descuento: data.portal_descuento == null ? null : Number(data.portal_descuento),
    descuento_general: general,
    activo: !!data.portal_activo && !!data.portal_token && !data.portal_bloqueado,
    suspendido: !!data.portal_bloqueado,
    datos: data.portal_datos ?? null,
    datos_at: data.portal_datos_at,
    reglas: (reglas || []).map(r => ({ ...r, descuento: Number(r.descuento) })),
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

  // Descuento especial de este cliente para un grupo, bodega/marca o producto.
  // Sin descuento = se borra (vuelve a lo general).
  if (accion === 'regla_cliente') {
    const { nivel, clave } = body
    if (!['grupo', 'marca', 'producto'].includes(nivel) || typeof clave !== 'string' || !clave.trim()) return err('Regla inválida', 400)
    const d = aDescuento(body.descuento)
    if (d === 'invalido') return err('Descuento inválido', 400)
    const q = d == null
      ? supabase.from('portal_reglas_cliente').delete().eq('cliente_id', cliente_id).eq('nivel', nivel).eq('clave', clave)
      : supabase.from('portal_reglas_cliente').upsert({ cliente_id, nivel, clave: clave.trim(), descuento: d, updated_at: new Date().toISOString() }, { onConflict: 'cliente_id,nivel,clave' })
    const { error } = await q
    if (error) return err(error.message)
    return NextResponse.json({ ok: true })
  }

  if (accion === 'revocar') {
    const { error } = await supabase.from('clientes')
      .update({ portal_activo: false, portal_token: null, portal_pin_hash: null, portal_bloqueado: true }).eq('id', cliente_id)
    if (error) return err(error.message)
    return NextResponse.json({ ok: true })
  }

  if (accion === 'generar' || accion === 'compartir') {
    const { data: actual } = await supabase.from('clientes').select('portal_token, portal_activo, cuit, email, telefono').eq('id', cliente_id).single()
    const token = accion === 'compartir' && actual?.portal_activo && actual.portal_token ? actual.portal_token : nuevoToken()
    const pin = nuevoPin()
    const cambios: Record<string, unknown> = {
      portal_token: token, portal_pin_hash: hashPin(pin), portal_activo: true, portal_bloqueado: false,
      portal_intentos: 0, portal_bloqueado_hasta: null,
    }
    if ('descuento' in body) {
      const d = aDescuento(body.descuento)
      if (d === 'invalido') return err('Descuento inválido', 400)
      cambios.portal_descuento = d
    }
    const { error } = await supabase.from('clientes').update(cambios).eq('id', cliente_id)
    if (error) return err(error.message)
    // Con qué puede entrar sin el link (portal → CUIT, email o teléfono + PIN).
    const cuit = (actual?.cuit || '').replace(/\D/g, '')
    const usuario = cuit.length === 11 ? `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`
      : actual?.email?.trim() || ((actual?.telefono || '').replace(/\D/g, '').length >= 8 ? actual!.telefono!.trim() : null)
    return NextResponse.json({ ok: true, url: `${PORTAL_URL}/c/${token}`, pin, portal: PORTAL_URL, usuario })
  }

  return err('accion inválida', 400)
}
