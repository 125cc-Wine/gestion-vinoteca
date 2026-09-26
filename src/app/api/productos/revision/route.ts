export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Productos con datos dudosos (bodega / categoría / varietal) que quedaron
// para que los decida una persona después de la auditoría de catálogo del
// 27/9/2026 (tabla productos_revision). Se muestran en Portal clientes.

interface FilaRevision {
  id: number; producto_id: string; problema: string; nota: string | null
  categoria_propuesta: string | null; bodega_propuesta: string | null; varietal_propuesto: string | null
}

// GET → productos pendientes (agrupados) + bodegas y varietales existentes para autocompletar
export async function GET() {
  const { data: rev, error } = await supabase.from('productos_revision')
    .select('id, producto_id, problema, nota, categoria_propuesta, bodega_propuesta, varietal_propuesto')
    .is('resuelto_at', null).order('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const filas = (rev || []) as FilaRevision[]
  const ids = Array.from(new Set(filas.map(f => f.producto_id)))

  const productos: { id: string; nombre: string; categoria: string | null; bodega: string | null; varietal: string | null; stock: number | null }[] = []
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await supabase.from('productos').select('id, nombre, categoria, bodega, varietal, stock').in('id', ids.slice(i, i + 100))
    productos.push(...(data || []))
  }
  const porId = new Map(productos.map(p => [p.id, p]))

  const pendientes = ids.map(id => {
    const p = porId.get(id)
    const suyas = filas.filter(f => f.producto_id === id)
    const primera = (k: 'categoria_propuesta' | 'bodega_propuesta' | 'varietal_propuesto') => suyas.find(f => f[k])?.[k] ?? null
    return p && {
      ...p,
      problemas: suyas.map(f => ({ problema: f.problema, nota: f.nota })),
      propuesta: { categoria: primera('categoria_propuesta'), bodega: primera('bodega_propuesta'), varietal: primera('varietal_propuesto') },
    }
  }).filter(Boolean)
    .sort((a, b) => (b!.stock ?? 0) - (a!.stock ?? 0) || a!.nombre.localeCompare(b!.nombre))

  // Valores ya usados, para sugerir y no inventar variantes nuevas.
  const usados = { bodegas: new Set<string>(), varietales: new Set<string>() }
  for (let desde = 0; ; desde += 1000) {
    const { data } = await supabase.from('productos').select('bodega, varietal')
      .eq('empresa', 'aroma').eq('activo', true).range(desde, desde + 999)
    for (const r of data || []) { if (r.bodega) usados.bodegas.add(r.bodega); if (r.varietal) usados.varietales.add(r.varietal) }
    if (!data || data.length < 1000) break
  }
  const ord = (s: Set<string>) => Array.from(s).sort((a, b) => a.localeCompare(b, 'es'))
  return NextResponse.json({ pendientes, bodegas: ord(usados.bodegas), varietales: ord(usados.varietales) })
}

// POST { producto_id, accion: 'guardar' | 'ok', categoria?, bodega?, varietal? }
//  'guardar' → aplica los datos al producto y a su gemelo de la otra empresa
//  'ok'      → está bien como está; solo se saca de la lista
export async function POST(req: NextRequest) {
  const { producto_id, accion, categoria, bodega, varietal } = await req.json()
  if (!producto_id) return NextResponse.json({ error: 'producto_id requerido' }, { status: 400 })

  if (accion === 'guardar') {
    const cambios: Record<string, string | null> = {}
    const limpio = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
    if (categoria !== undefined) cambios.categoria = limpio(categoria)
    if (bodega !== undefined) cambios.bodega = limpio(bodega)
    if (varietal !== undefined) cambios.varietal = limpio(varietal)
    const { data: p } = await supabase.from('productos').select('gemelo_id').eq('id', producto_id).single()
    const ids = [producto_id, p?.gemelo_id].filter(Boolean)
    const { error } = await supabase.from('productos').update(cambios).in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (accion !== 'ok') {
    return NextResponse.json({ error: 'accion inválida' }, { status: 400 })
  }

  const { error } = await supabase.from('productos_revision').update({ resuelto_at: new Date().toISOString() })
    .eq('producto_id', producto_id).is('resuelto_at', null)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
