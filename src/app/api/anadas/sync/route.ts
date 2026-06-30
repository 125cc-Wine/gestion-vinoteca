export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/anadas/sync
// Detecta años de añada en `productos` que no existen en `anadas` y los inserta.
export async function POST() {
  const [{ data: prods, error: e1 }, { data: anas, error: e2 }] = await Promise.all([
    supabase.from('productos').select('anada').not('anada', 'is', null).neq('anada', ''),
    supabase.from('anadas').select('anio'),
  ])

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })

  const existentes = new Set((anas ?? []).map(a => String(a.anio).trim()))
  const nuevas = Array.from(new Set(
    (prods ?? [])
      .map(p => String(p.anada).trim())
      .filter(a => a && !existentes.has(a))
  ))

  if (nuevas.length === 0) return NextResponse.json({ insertadas: 0 })

  const { data, error } = await supabase
    .from('anadas')
    .insert(nuevas.map(anio => ({ anio, activo: true })))
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ insertadas: data?.length ?? 0, anadas: data?.map(a => a.anio) })
}
