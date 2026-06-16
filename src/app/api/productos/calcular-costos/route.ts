export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { empresa } = await req.json()
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  // Traer todos los productos sin precio_costo que tengan precio_venta
  const { data: prods, error } = await supabase
    .from('productos')
    .select('id, precio_venta, precio_costo')
    .eq('empresa', empresa)
    .neq('activo', false)
    .gt('precio_venta', 0)
    .or('precio_costo.is.null,precio_costo.eq.0')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!prods?.length) return NextResponse.json({ actualizados: 0 })

  let actualizados = 0
  for (const p of prods) {
    const costo = Math.round(p.precio_venta * 0.5)
    const { error: ue } = await supabase
      .from('productos')
      .update({ precio_costo: costo })
      .eq('id', p.id)
    if (!ue) actualizados++
  }

  return NextResponse.json({ actualizados })
}
