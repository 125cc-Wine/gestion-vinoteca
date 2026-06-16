export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { empresa } = await req.json()
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  const { data: prods, error } = await supabase
    .from('productos')
    .select('id, precio_venta')
    .eq('empresa', empresa)
    .neq('activo', false)
    .gt('precio_venta', 0)
    .or('precio_costo.is.null,precio_costo.eq.0')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!prods?.length) return NextResponse.json({ actualizados: 0 })

  const updates = prods.map(p => ({ id: p.id, precio_costo: Math.round(p.precio_venta * 0.5) }))

  let actualizados = 0
  const BATCH = 200
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH)
    const { error: ue } = await supabase
      .from('productos')
      .upsert(batch, { onConflict: 'id' })
    if (!ue) actualizados += batch.length
  }

  return NextResponse.json({ actualizados })
}
