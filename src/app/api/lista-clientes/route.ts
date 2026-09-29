export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Lista de precios que ven los clientes en el portal (Catálogo > Lista para
// clientes): descuento general, reglas por grupo / marca / producto
// (portal_reglas), qué se oculta y en qué rubro va cada bebida. El cálculo
// en sí está en src/lib/precioPortal.ts (y su copia en el portal).

const CLAVE_GENERAL = 'portal_descuento_general'
const err = (m: string, status = 500) => NextResponse.json({ error: m }, { status })

function aDescuento(v: unknown): number | null | 'invalido' {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n < 100 ? Math.round(n * 100) / 100 : 'invalido'
}

export async function GET() {
  const productos: unknown[] = []
  for (let desde = 0; ; desde += 1000) {
    // Una fila por producto (las de Aroma): todo se replica al gemelo de La Vid.
    const { data, error } = await supabase.from('productos')
      .select('id, nombre, bodega, varietal, categoria, precio_venta, stock, portal_oculto')
      .eq('empresa', 'aroma').eq('activo', true).gt('precio_venta', 0)
      .order('nombre').range(desde, desde + 999)
    if (error) return err(error.message)
    productos.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  const [{ data: reglas, error: e1 }, { data: cfg }] = await Promise.all([
    supabase.from('portal_reglas').select('nivel, clave, descuento, oculto'),
    supabase.from('app_config').select('valor').eq('clave', CLAVE_GENERAL).maybeSingle(),
  ])
  if (e1) return err(e1.message)
  const general = Number(cfg?.valor)
  return NextResponse.json({
    general: Number.isFinite(general) ? general : 35,
    reglas: (reglas || []).map(r => ({ ...r, descuento: r.descuento == null ? null : Number(r.descuento) })),
    productos,
  })
}

// POST { accion, ... }
//  'general' { descuento }
//  'regla'   { nivel: 'grupo'|'marca'|'producto', clave, descuento?, oculto? }
//            sin descuento y sin ocultar = se borra la regla (vuelve a heredar)
//  'rubro'   { producto_id, varietal } → mueve una bebida a otro rubro (y su gemelo)
export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.accion === 'general') {
    const d = aDescuento(body.descuento)
    if (d === 'invalido' || d === null) return err('Descuento inválido', 400)
    const { error } = await supabase.from('app_config')
      .upsert({ clave: CLAVE_GENERAL, valor: String(d), updated_at: new Date().toISOString() }, { onConflict: 'clave' })
    if (error) return err(error.message)
    return NextResponse.json({ ok: true })
  }

  if (body.accion === 'regla') {
    const { nivel, clave } = body
    if (!['grupo', 'marca', 'producto'].includes(nivel) || !clave) return err('Regla inválida', 400)
    const d = aDescuento(body.descuento)
    if (d === 'invalido') return err('Descuento inválido', 400)
    const oculto = !!body.oculto
    const q = d == null && !oculto
      ? supabase.from('portal_reglas').delete().eq('nivel', nivel).eq('clave', clave)
      : supabase.from('portal_reglas').upsert({ nivel, clave, descuento: d, oculto, updated_at: new Date().toISOString() }, { onConflict: 'nivel,clave' })
    const { error } = await q
    if (error) return err(error.message)
    return NextResponse.json({ ok: true })
  }

  if (body.accion === 'rubro') {
    const varietal = typeof body.varietal === 'string' ? body.varietal.trim() : ''
    if (!body.producto_id || !varietal) return err('Datos inválidos', 400)
    const { data: p } = await supabase.from('productos').select('gemelo_id').eq('id', body.producto_id).single()
    const { error } = await supabase.from('productos').update({ varietal })
      .in('id', [body.producto_id, p?.gemelo_id].filter(Boolean))
    if (error) return err(error.message)
    return NextResponse.json({ ok: true })
  }

  return err('accion inválida', 400)
}
