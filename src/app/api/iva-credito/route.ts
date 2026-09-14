export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/iva-credito?empresa=aroma|lavid|ambas — serie de crédito fiscal
// cargado a mano, por mes.
export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  let q = supabase.from('iva_credito_manual').select('*').order('mes', { ascending: true })
  if (empresa !== 'ambas') q = q.eq('empresa', empresa)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PUT { empresa, mes: 'YYYY-MM', monto, notas? }
// Carga/corrige el crédito fiscal de un mes puntual para una empresa (el
// número que da el contador o AFIP — ver sql/2026-09-iva-credito-manual.sql
// para por qué no se puede calcular solo).
export async function PUT(req: NextRequest) {
  const { empresa, mes, monto, notas } = await req.json()
  if (!empresa || !mes || monto == null) {
    return NextResponse.json({ error: 'empresa, mes y monto son requeridos' }, { status: 400 })
  }
  if (empresa !== 'aroma' && empresa !== 'lavid') {
    return NextResponse.json({ error: 'empresa debe ser aroma o lavid (no "ambas") — el crédito fiscal es propio de cada CUIT' }, { status: 400 })
  }

  const mesFecha = mes.length <= 7 ? `${mes}-01` : mes
  const { data, error } = await supabase
    .from('iva_credito_manual')
    .upsert([{ empresa, mes: mesFecha, monto: Number(monto), notas: notas || null, updated_at: new Date().toISOString() }], { onConflict: 'empresa,mes' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
