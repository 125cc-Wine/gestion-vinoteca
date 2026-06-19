/*
  ══════════════════════════════════════════════════════════════════
  SQL A EJECUTAR EN SUPABASE ANTES DE USAR ESTE MÓDULO:
  ══════════════════════════════════════════════════════════════════

  ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS porcentaje_comision NUMERIC(5,2) DEFAULT 5;

  CREATE TABLE IF NOT EXISTS comisiones_vendedor (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa TEXT NOT NULL,
    vendedor_id UUID,
    vendedor_nombre TEXT NOT NULL,
    periodo TEXT NOT NULL,
    total_ventas NUMERIC(12,2) DEFAULT 0,
    porcentaje NUMERIC(5,2) DEFAULT 0,
    monto_comision NUMERIC(12,2) DEFAULT 0,
    estado TEXT DEFAULT 'pendiente',
    pagada_at TIMESTAMPTZ,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(empresa, vendedor_nombre, periodo)
  );

  ══════════════════════════════════════════════════════════════════
*/

export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// ── GET ?empresa=&periodo=YYYY-MM ──────────────────────────────────────────
// Para cada vendedor activo: calcula total ventas tipo='remito' del período
// y combina con el registro guardado en comisiones_vendedor (si existe).
export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  const periodo  = req.nextUrl.searchParams.get('periodo') // YYYY-MM

  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })
  if (!periodo)  return NextResponse.json({ error: 'periodo requerido' }, { status: 400 })

  // 1. Obtener vendedores activos
  const { data: vendedores, error: errV } = await supabase
    .from('vendedores')
    .select('id, nombre, porcentaje_comision')
    .neq('activo', false)
    .order('nombre')

  if (errV) return NextResponse.json({ error: errV.message }, { status: 500 })

  // 2. Obtener ventas tipo='remito' del período (por fechas del mes)
  const [anio, mes] = periodo.split('-').map(Number)
  const desde = new Date(anio, mes - 1, 1).toISOString()
  const hasta  = new Date(anio, mes, 0, 23, 59, 59).toISOString()

  const { data: ventas, error: errVen } = await supabase
    .from('ventas')
    .select('vendedor_nombre, total')
    .eq('empresa', empresa)
    .eq('tipo', 'remito')
    .neq('estado', 'cancelado')
    .gte('created_at', desde)
    .lte('created_at', hasta)

  if (errVen) return NextResponse.json({ error: errVen.message }, { status: 500 })

  // 3. Sumar ventas por nombre de vendedor
  const totalPorVendedor: Record<string, number> = {}
  for (const v of ventas || []) {
    const nombre = v.vendedor_nombre || 'Sin asignar'
    totalPorVendedor[nombre] = (totalPorVendedor[nombre] || 0) + (v.total || 0)
  }

  // 4. Obtener registros guardados en comisiones_vendedor para este período
  const { data: registros, error: errR } = await supabase
    .from('comisiones_vendedor')
    .select('*')
    .eq('empresa', empresa)
    .eq('periodo', periodo)

  if (errR) return NextResponse.json({ error: errR.message }, { status: 500 })

  const registrosPorNombre: Record<string, typeof registros[0]> = {}
  for (const r of registros || []) {
    registrosPorNombre[r.vendedor_nombre] = r
  }

  // 5. Combinar: para cada vendedor activo construir la fila de comisión
  const resultado = (vendedores || []).map(v => {
    const porcentaje   = registrosPorNombre[v.nombre]?.porcentaje ?? v.porcentaje_comision ?? 5
    const total_ventas = totalPorVendedor[v.nombre] || 0
    const monto_comision = (total_ventas * porcentaje) / 100
    const registro = registrosPorNombre[v.nombre]

    return {
      id:              registro?.id ?? null,
      vendedor_id:     v.id,
      vendedor_nombre: v.nombre,
      porcentaje_comision: v.porcentaje_comision ?? 5,
      porcentaje:      porcentaje,
      total_ventas,
      monto_comision,
      estado:          registro?.estado ?? 'pendiente',
      pagada_at:       registro?.pagada_at ?? null,
      notas:           registro?.notas ?? '',
    }
  })

  return NextResponse.json(resultado)
}

// ── POST → upsert comisión (guardar o marcar como pagada) ─────────────────
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    empresa, vendedor_id, vendedor_nombre, periodo,
    total_ventas, porcentaje, monto_comision,
    estado, notas,
  } = body

  if (!empresa || !vendedor_nombre || !periodo) {
    return NextResponse.json({ error: 'empresa, vendedor_nombre y periodo son requeridos' }, { status: 400 })
  }

  const pagada_at = estado === 'pagada' ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from('comisiones_vendedor')
    .upsert(
      [{
        empresa,
        vendedor_id:     vendedor_id ?? null,
        vendedor_nombre,
        periodo,
        total_ventas:    total_ventas ?? 0,
        porcentaje:      porcentaje ?? 5,
        monto_comision:  monto_comision ?? 0,
        estado:          estado ?? 'pendiente',
        pagada_at,
        notas:           notas ?? null,
      }],
      { onConflict: 'empresa,vendedor_nombre,periodo' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ── PATCH ?accion=pagar|editar_porcentaje ──────────────────────────────────
export async function PATCH(req: NextRequest) {
  const accion = req.nextUrl.searchParams.get('accion')
  const body   = await req.json()

  if (accion === 'pagar') {
    const { empresa, vendedor_nombre, periodo, notas } = body
    if (!empresa || !vendedor_nombre || !periodo) {
      return NextResponse.json({ error: 'empresa, vendedor_nombre y periodo requeridos' }, { status: 400 })
    }

    // Upsert marcando como pagada
    const { data, error } = await supabase
      .from('comisiones_vendedor')
      .upsert(
        [{
          empresa,
          vendedor_nombre,
          periodo,
          estado:     'pagada',
          pagada_at:  new Date().toISOString(),
          notas:      notas ?? null,
          // estos campos se ignoran en update si ya existen por el onConflict
          total_ventas:   body.total_ventas ?? 0,
          porcentaje:     body.porcentaje ?? 5,
          monto_comision: body.monto_comision ?? 0,
        }],
        { onConflict: 'empresa,vendedor_nombre,periodo' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (accion === 'editar_porcentaje') {
    const { vendedor_id, porcentaje_comision } = body
    if (!vendedor_id) return NextResponse.json({ error: 'vendedor_id requerido' }, { status: 400 })

    // Actualizar el porcentaje base en la tabla vendedores
    const { data, error } = await supabase
      .from('vendedores')
      .update({ porcentaje_comision })
      .eq('id', vendedor_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'accion no válida' }, { status: 400 })
}
