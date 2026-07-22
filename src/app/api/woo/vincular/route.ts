export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { wooGetAllProducts, claveMatch } from '@/lib/woocommerce'

// Vincula productos que YA existen en Supabase pero no tienen woo_product_id,
// matcheándolos por nombre (normalizado e independiente del orden de palabras)
// contra el catálogo de WooCommerce.
// Rellena el woo_product_id vacío en la fila existente en vez de duplicar.
//
//   GET  /api/woo/vincular        -> preview: qué se vincularía (no toca nada)
//   POST /api/woo/vincular        -> aplica: setea woo_product_id en las filas
//
// Solo toca filas con woo_product_id NULL. Nunca pisa un ID ya cargado.
// Los casos ambiguos (un nombre que matchea varias filas, o varios productos
// Woo con el mismo nombre) se reportan como conflictos y NO se tocan.

interface MatchResult {
  vincular: { supabaseId: string; nombre: string; wooId: number; wooNombre: string }[]
  conflictos: { nombre: string; motivo: string }[]
  // Productos del sistema sin vincular que NO matchearon con nada (para asignar
  // a mano el par desde la web).
  sinMatchList: { supabaseId: string; nombre: string }[]
  // Productos de la web que todavía no están vinculados a ninguna fila (los
  // candidatos disponibles para asignar manualmente).
  wooLibres: { wooId: number; nombre: string }[]
  totalSinVincular: number
  totalWoo: number
}

async function computeMatches(): Promise<MatchResult> {
  if (!process.env.WOOCOMMERCE_CONSUMER_KEY || !process.env.WOOCOMMERCE_URL) {
    throw new Error('WooCommerce no configurado (faltan WOOCOMMERCE_URL / WOOCOMMERCE_CONSUMER_KEY)')
  }

  // 1. Productos de la web, indexados por clave de matcheo (normalizada e
  //    independiente del orden). Si dos productos Woo caen en la misma clave,
  //    marcamos esa clave como ambigua para no vincular a ciegas.
  const woo = await wooGetAllProducts()
  const wooPorNombre = new Map<string, { id: number; nombre: string }>()
  const wooAmbiguos = new Set<string>()
  for (const w of woo) {
    const key = claveMatch(w.name)
    if (!key) continue
    if (wooPorNombre.has(key)) wooAmbiguos.add(key)
    else wooPorNombre.set(key, { id: w.id, nombre: w.name })
  }

  // 2. Productos de Aroma activos sin woo_product_id (paginado).
  const PAGE = 1000
  const sinVincular: { id: string; nombre: string }[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre')
      .eq('empresa', 'aroma')
      .eq('activo', true)
      .is('woo_product_id', null)
      .order('nombre')
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    sinVincular.push(...(data as { id: string; nombre: string }[]))
    if (data.length < PAGE) break
    from += PAGE
  }

  // 3. Cruce. Detectamos también nombres de Supabase que se repiten para
  //    no vincular dos filas distintas al mismo producto Woo.
  const vecesEnSupabase = new Map<string, number>()
  for (const p of sinVincular) {
    const k = claveMatch(p.nombre)
    vecesEnSupabase.set(k, (vecesEnSupabase.get(k) ?? 0) + 1)
  }

  const vincular: MatchResult['vincular'] = []
  const conflictos: MatchResult['conflictos'] = []
  const sinMatchList: MatchResult['sinMatchList'] = []

  for (const p of sinVincular) {
    const key = claveMatch(p.nombre)
    const w = wooPorNombre.get(key)
    if (!w) { sinMatchList.push({ supabaseId: p.id, nombre: p.nombre }); continue }
    if (wooAmbiguos.has(key)) {
      conflictos.push({ nombre: p.nombre, motivo: 'Varios productos en la web con ese nombre' })
      continue
    }
    if ((vecesEnSupabase.get(key) ?? 0) > 1) {
      conflictos.push({ nombre: p.nombre, motivo: 'Varias filas en el sistema con ese nombre' })
      continue
    }
    vincular.push({ supabaseId: p.id, nombre: p.nombre, wooId: w.id, wooNombre: w.nombre })
  }

  // Productos de la web todavía no vinculados a ninguna fila del sistema:
  // candidatos disponibles para asignar a mano.
  const { data: usados } = await supabase
    .from('productos')
    .select('woo_product_id')
    .eq('empresa', 'aroma')
    .not('woo_product_id', 'is', null)
  const usadosSet = new Set((usados ?? []).map(u => u.woo_product_id))
  const wooLibres = woo
    .filter(w => !usadosSet.has(w.id))
    .map(w => ({ wooId: w.id, nombre: w.name }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  return {
    vincular,
    conflictos,
    sinMatchList,
    wooLibres,
    totalSinVincular: sinVincular.length,
    totalWoo: woo.length,
  }
}

export async function GET() {
  try {
    const r = await computeMatches()
    return NextResponse.json({
      resumen: {
        productos_sin_vincular: r.totalSinVincular,
        productos_en_web: r.totalWoo,
        se_pueden_vincular: r.vincular.length,
        conflictos: r.conflictos.length,
        sin_match_en_web: r.sinMatchList.length,
      },
      vincular: r.vincular,
      conflictos: r.conflictos,
      sinMatch: r.sinMatchList,   // para asignar a mano
      wooLibres: r.wooLibres,     // candidatos de la web disponibles
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

// Aplica una lista de pares (supabaseId -> wooId), con guardia de NULL para
// nunca pisar un ID ya cargado. Devuelve cuántos se escribieron.
async function aplicarPares(pares: { supabaseId: string; wooId: number; nombre?: string }[]) {
  let ok = 0
  const errores: string[] = []
  for (const v of pares) {
    const { error } = await supabase
      .from('productos')
      .update({ woo_product_id: v.wooId })
      .eq('id', v.supabaseId)
      .is('woo_product_id', null)
    if (error) errores.push(`${v.nombre ?? v.supabaseId}: ${error.message}`)
    else ok++
  }
  return { ok, errores }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    // Modo MANUAL: body { manual: [{ supabaseId, wooId }, ...] }.
    // Asigna pares elegidos a mano, sin recalcular el matcheo automático.
    if (Array.isArray(body?.manual)) {
      const pares = (body.manual as { supabaseId?: string; wooId?: number }[])
        .filter(m => m.supabaseId && typeof m.wooId === 'number')
        .map(m => ({ supabaseId: m.supabaseId as string, wooId: m.wooId as number }))
      if (!pares.length) return NextResponse.json({ error: 'No hay pares válidos' }, { status: 400 })
      const { ok, errores } = await aplicarPares(pares)
      return NextResponse.json({ vinculados: ok, intentados: pares.length, errores })
    }

    // Modo AUTOMÁTICO: recalcula matches y aplica todos o el subconjunto { ids }.
    const r = await computeMatches()
    const filtro: string[] | null = Array.isArray(body?.ids) ? body.ids : null
    const aVincular = filtro
      ? r.vincular.filter(v => filtro.includes(v.supabaseId))
      : r.vincular

    const { ok, errores } = await aplicarPares(aVincular)
    return NextResponse.json({
      vinculados: ok,
      intentados: aVincular.length,
      conflictos: r.conflictos.length,
      errores,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
