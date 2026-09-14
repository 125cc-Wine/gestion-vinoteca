export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/inflacion — serie completa, ordenada por mes (para el panel de
// parámetros de /financiero y para alimentar el cálculo de erosión).
// Paginada por las dudas — Supabase corta en 1000 filas por default, y
// aunque /api/inflacion/sync ya recorta la fuente a los últimos años, sin
// esto un crecimiento futuro de la tabla podría cortar los meses más
// recientes en silencio (justo los que más importan).
export async function GET() {
  const PAGE = 1000
  const data: { mes: string; valor_mensual: number; fuente: string }[] = []
  let from = 0
  while (true) {
    const { data: page, error } = await supabase
      .from('indices_inflacion')
      .select('*')
      .order('mes', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!page || page.length === 0) break
    data.push(...page)
    if (page.length < PAGE) break
    from += PAGE
  }
  return NextResponse.json(data)
}

// PUT { mes: 'YYYY-MM', valor_mensual: number }
// Carga/corrige a mano un mes puntual — pensado para el mes en curso, que
// INDEC todavía no publicó. Queda marcado fuente='manual' hasta que
// /api/inflacion/sync traiga el valor real de INDEC y lo pise.
export async function PUT(req: NextRequest) {
  const { mes, valor_mensual } = await req.json()
  if (!mes || valor_mensual == null) {
    return NextResponse.json({ error: 'mes y valor_mensual son requeridos' }, { status: 400 })
  }

  const mesFecha = mes.length <= 7 ? `${mes}-01` : mes
  const { data, error } = await supabase
    .from('indices_inflacion')
    .upsert([{ mes: mesFecha, valor_mensual: Number(valor_mensual), fuente: 'manual', updated_at: new Date().toISOString() }], { onConflict: 'mes' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
