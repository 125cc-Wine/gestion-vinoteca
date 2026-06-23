export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/bodegas/sync
// Detecta nombres de bodega en la tabla `productos` que no existen en `bodegas` y los inserta.
export async function POST() {
  const [{ data: prods, error: e1 }, { data: bods, error: e2 }] = await Promise.all([
    supabase.from('productos').select('bodega').not('bodega', 'is', null).neq('bodega', ''),
    supabase.from('bodegas').select('nombre'),
  ])

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })

  const existentes = new Set((bods ?? []).map(b => b.nombre.toLowerCase().trim()))
  const nuevas = Array.from(new Set(
    (prods ?? []).map(p => (p.bodega as string).trim()).filter(b => b && !existentes.has(b.toLowerCase()))
  ))

  if (nuevas.length === 0) return NextResponse.json({ insertadas: 0, mensaje: 'Todo ya estaba sincronizado' })

  const { data, error } = await supabase
    .from('bodegas')
    .insert(nuevas.map(nombre => ({ nombre, activo: true })))
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ insertadas: data?.length ?? 0, bodegas: data?.map(b => b.nombre) })
}
