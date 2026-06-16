export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa   = req.nextUrl.searchParams.get('empresa')
  const productoId = req.nextUrl.searchParams.get('producto_id')
  const desde     = req.nextUrl.searchParams.get('desde')
  const hasta     = req.nextUrl.searchParams.get('hasta')

  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  let query = supabase
    .from('ventas')
    .select('id, numero, tipo, created_at, cliente_nombre, vendedor_nombre, items')
    .eq('empresa', empresa)
    .neq('estado', 'cancelado')
    .order('created_at', { ascending: false })
    .limit(500)

  if (desde) query = query.gte('created_at', desde)
  if (hasta) query = query.lte('created_at', hasta + 'T23:59:59')

  const { data: ventas, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const movimientos: {
    id: string; fecha: string; tipo: 'egreso' | 'entrada' | 'ajuste'
    concepto: string; comprobante: string; comprobante_tipo: string
    cliente: string; producto: string; producto_id: string | null; cantidad: number
  }[] = []

  for (const venta of ventas || []) {
    for (const item of (venta.items as { producto_id?: string; nombre: string; cantidad: number }[] || [])) {
      if (productoId && item.producto_id !== productoId) continue
      movimientos.push({
        id:               `${venta.id}-${item.producto_id ?? item.nombre}`,
        fecha:            venta.created_at,
        tipo:             'egreso',
        concepto:         `${venta.tipo === 'presupuesto' ? 'Presupuesto' : 'Remito'} ${venta.numero}`,
        comprobante:      venta.numero,
        comprobante_tipo: venta.tipo,
        cliente:          venta.cliente_nombre,
        producto:         item.nombre,
        producto_id:      item.producto_id ?? null,
        cantidad:         item.cantidad,
      })
    }
  }

  return NextResponse.json(movimientos)
}

// Registro manual de ajuste de stock
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { empresa, producto_id, producto_nombre, cantidad, motivo } = body

  if (!empresa || cantidad === undefined) {
    return NextResponse.json({ error: 'faltan campos' }, { status: 400 })
  }

  let query = supabase.from('productos').select('id, stock, nombre').eq('empresa', empresa)
  if (producto_id) {
    query = query.eq('id', producto_id)
  } else if (producto_nombre) {
    query = query.ilike('nombre', `%${producto_nombre}%`)
  } else {
    return NextResponse.json({ error: 'producto_id o producto_nombre requerido' }, { status: 400 })
  }

  const { data: prods, error: pe } = await query.limit(1)
  if (pe || !prods?.length) return NextResponse.json({ error: 'producto no encontrado' }, { status: 404 })
  const prod = prods[0]

  const nuevoStock = Math.max(0, prod.stock + Number(cantidad))
  const { error: ue } = await supabase.from('productos').update({ stock: nuevoStock }).eq('id', prod.id)
  if (ue) return NextResponse.json({ error: ue.message }, { status: 500 })

  return NextResponse.json({ ok: true, producto: prod.nombre, stock_anterior: prod.stock, stock_nuevo: nuevoStock })
}
