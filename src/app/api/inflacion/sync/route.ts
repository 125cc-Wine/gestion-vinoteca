export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const FUENTE_URL = 'https://api.argentinadatos.com/v1/finanzas/indices/inflacion'

interface FilaFuente { fecha: string; valor: number }

// POST /api/inflacion/sync
// Trae la serie de inflación mensual (INDEC) desde api.argentinadatos.com —
// fuente pública, gratuita, sin API key, que replica los valores oficiales —
// y la carga en indices_inflacion con fuente='indec'. Siempre pisa lo que
// haya en cada mes (incluida una carga manual previa): un valor real
// publicado por INDEC vale más que cualquier estimación provisoria.
export async function POST() {
  let filas: FilaFuente[]
  try {
    const res = await fetch(FUENTE_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    filas = await res.json()
  } catch (e) {
    return NextResponse.json({ error: `No se pudo consultar la fuente de inflación (${FUENTE_URL}): ${e instanceof Error ? e.message : e}` }, { status: 502 })
  }

  if (!Array.isArray(filas) || filas.length === 0) {
    return NextResponse.json({ error: 'La fuente no devolvió datos' }, { status: 502 })
  }

  const rows = filas.map(f => ({
    mes: f.fecha.slice(0, 7) + '-01',
    valor_mensual: f.valor,
    fuente: 'indec' as const,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('indices_inflacion').upsert(rows, { onConflict: 'mes' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ultima = rows[rows.length - 1]
  return NextResponse.json({ sincronizados: rows.length, ultimoMes: ultima.mes.slice(0, 7), ultimoValor: ultima.valor_mensual })
}
