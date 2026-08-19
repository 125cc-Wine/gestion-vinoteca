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
// Para cada vendedor activo: calcula total ventas tipo='remito' o
// 'presupuesto' del período (ambos son ventas reales — La Vid Consultora
// factura mayormente por presupuesto en cuenta corriente) y combina con el
// registro guardado en comisiones_vendedor (si existe).
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

  // 2. Obtener ventas tipo='remito' o 'presupuesto' del período (por fechas del mes)
  const [anio, mes] = periodo.split('-').map(Number)
  const desde = new Date(anio, mes - 1, 1).toISOString()
  const hasta  = new Date(anio, mes, 0, 23, 59, 59).toISOString()

  const { data: ventas, error: errVen } = await supabase
    .from('ventas')
    .select('vendedor_nombre, total')
    .eq('empresa', empresa)
    .in('tipo', ['remito', 'presupuesto'])
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

  // 3b. Sumar lo vendido en consignaciones liquidadas en este período — el
  //     cargo a cta. cte. se genera recién al liquidar (ver PUT
  //     /api/consignaciones), así que esa fecha es el momento real de la
  //     venta a efectos de comisión, no la fecha en que se creó la
  //     consignación (que puede ser meses antes). Antes lo vendido por
  //     consignación no contaba para la comisión de nadie.
  const { data: cargosConsignacion } = await supabase
    .from('movimientos_cta_cte')
    .select('monto, referencia_id')
    .eq('empresa', empresa)
    .eq('tipo', 'cargo')
    .ilike('concepto', 'Consignación%liquidada')
    .gte('created_at', desde)
    .lte('created_at', hasta)

  if (cargosConsignacion && cargosConsignacion.length > 0) {
    const consIds = cargosConsignacion.map(c => c.referencia_id).filter(Boolean)
    const { data: consData } = await supabase
      .from('consignaciones')
      .select('id, vendedor_nombre')
      .in('id', consIds)
    const vendedorPorConsId = new Map((consData || []).map(c => [c.id, c.vendedor_nombre || 'Sin asignar']))
    for (const cargo of cargosConsignacion) {
      const nombre = vendedorPorConsId.get(cargo.referencia_id) || 'Sin asignar'
      totalPorVendedor[nombre] = (totalPorVendedor[nombre] || 0) + (cargo.monto || 0)
    }
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

  // 5. Combinar: para cada vendedor activo construir la fila de comisión.
  //    Si ya está "pagada", se usa el total/porcentaje/comisión CONGELADO en
  //    el momento del pago, no el recalculado en vivo — si no, una venta de
  //    ese período que se edita o cancela después cambia silenciosamente el
  //    monto que se ve al lado de una comisión que ya se le pagó al
  //    vendedor, sin ningún aviso de que ya no coincide con lo que salió.
  const resultado = (vendedores || []).map(v => {
    const registro = registrosPorNombre[v.nombre]
    const yaPagada = registro?.estado === 'pagada'

    const porcentaje   = yaPagada ? registro.porcentaje : (registro?.porcentaje ?? v.porcentaje_comision ?? 5)
    const total_ventas = yaPagada ? registro.total_ventas : (totalPorVendedor[v.nombre] || 0)
    const monto_comision = yaPagada ? registro.monto_comision : (total_ventas * porcentaje) / 100

    return {
      id:              registro?.id ?? null,
      vendedor_id:     v.id,
      vendedor_nombre: v.nombre,
      porcentaje_comision: v.porcentaje_comision ?? 5,
      porcentaje,
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
