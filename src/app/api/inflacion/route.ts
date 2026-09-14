export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/inflacion — serie completa, ordenada por mes (para el gráfico de
// parámetros de /financiero y para alimentar el cálculo de erosión).
export async function GET() {
  const { data, error } = await supabase
    .from('indices_inflacion')
    .select('*')
    .order('mes', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
