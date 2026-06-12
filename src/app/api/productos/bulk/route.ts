export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const ACCIONES_VALIDAS = ['bodega', 'proveedor', 'varietal', 'precio_fijo', 'aumento_precio', 'eliminar']

export async function POST(req: NextRequest) {
  const { ids, accion, valor } = await req.json()

  if (!ids?.length || !accion) {
    return NextResponse.json({ error: 'ids y accion requeridos' }, { status: 400 })
  }
  if (!ACCIONES_VALIDAS.includes(accion)) {
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  }

  // Obtener los nombres de los productos seleccionados
  const { data: seleccionados, error: fetchErr } = await supabase
    .from('productos')
    .select('id, nombre')
    .in('id', ids)

  if (fetchErr || !seleccionados?.length) {
    return NextResponse.json({ error: fetchErr?.message ?? 'No se encontraron productos' }, { status: 500 })
  }

  // Buscar todas las contrapartes en ambas empresas por nombre
  const nombres = Array.from(new Set(seleccionados.map(p => p.nombre)))
  const { data: todos, error: todosErr } = await supabase
    .from('productos')
    .select('id, precio_venta')
    .in('nombre', nombres)
    .eq('activo', true)

  if (todosErr || !todos) {
    return NextResponse.json({ error: todosErr?.message ?? 'Error buscando contrapartes' }, { status: 500 })
  }

  const todosIds = todos.map(p => p.id)
  let afectados = 0

  if (accion === 'eliminar') {
    const { count, error } = await supabase
      .from('productos')
      .update({ activo: false }, { count: 'exact' })
      .in('id', todosIds)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    afectados = count ?? 0

  } else if (accion === 'bodega') {
    const { count, error } = await supabase
      .from('productos')
      .update({ bodega: valor }, { count: 'exact' })
      .in('id', todosIds)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    afectados = count ?? 0

  } else if (accion === 'varietal') {
    const { count, error } = await supabase
      .from('productos')
      .update({ varietal: valor }, { count: 'exact' })
      .in('id', todosIds)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    afectados = count ?? 0

  } else if (accion === 'proveedor') {
    const { count, error } = await supabase
      .from('productos')
      .update({ proveedor_nombre: valor }, { count: 'exact' })
      .in('id', todosIds)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    afectados = count ?? 0

  } else if (accion === 'precio_fijo') {
    const { count, error } = await supabase
      .from('productos')
      .update({ precio_venta: Number(valor) }, { count: 'exact' })
      .in('id', todosIds)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    afectados = count ?? 0

  } else if (accion === 'aumento_precio') {
    const pct = Number(valor) / 100
    const BATCH = 50
    for (let i = 0; i < todos.length; i += BATCH) {
      const lote = todos.slice(i, i + BATCH)
      const results = await Promise.all(
        lote.map(p => {
          const nuevo = Math.round((p.precio_venta || 0) * (1 + pct) * 100) / 100
          return supabase.from('productos').update({ precio_venta: nuevo }).eq('id', p.id)
        })
      )
      const errFound = results.find(r => r.error)
      if (errFound?.error) return NextResponse.json({ error: errFound.error.message }, { status: 500 })
      afectados += lote.length
    }
  }

  return NextResponse.json({ ok: true, afectados })
}
