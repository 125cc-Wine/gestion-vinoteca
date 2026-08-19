export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface MovimientoUnificado {
  id: string; fecha: string
  categoria: 'stock' | 'cta_cte'
  tipo: 'egreso' | 'entrada' | 'ajuste' | 'cargo' | 'cobro'
  concepto: string; comprobante: string; comprobante_tipo: string
  cliente: string; producto: string; producto_id: string | null
  cantidad: number | null; monto: number | null
}

// "Movimientos" arrancó mostrando solo el stock que se descuenta al vender
// (desde `ventas`). Cargas de depósito y cobros/cargos de cuenta corriente
// ya se registraban, pero en sus propias pantallas — acá se unifican en un
// solo feed cronológico, sin tocar ninguna tabla nueva.
export async function GET(req: NextRequest) {
  const empresa   = req.nextUrl.searchParams.get('empresa')
  const productoId = req.nextUrl.searchParams.get('producto_id')
  const desde     = req.nextUrl.searchParams.get('desde')
  const hasta     = req.nextUrl.searchParams.get('hasta')

  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  const movimientos: MovimientoUnificado[] = []

  // 1. Stock descontado por ventas (presupuesto/remito, no cancelados)
  let ventasQuery = supabase
    .from('ventas')
    .select('id, numero, tipo, created_at, cliente_nombre, vendedor_nombre, items')
    .eq('empresa', empresa)
    .neq('estado', 'cancelado')
    .order('created_at', { ascending: false })
    .limit(500)
  if (desde) ventasQuery = ventasQuery.gte('created_at', desde)
  if (hasta) ventasQuery = ventasQuery.lte('created_at', hasta + 'T23:59:59')

  const { data: ventas, error: errVentas } = await ventasQuery
  if (errVentas) return NextResponse.json({ error: errVentas.message }, { status: 500 })

  for (const venta of ventas || []) {
    for (const item of (venta.items as { producto_id?: string; nombre: string; cantidad: number }[] || [])) {
      if (productoId && item.producto_id !== productoId) continue
      movimientos.push({
        id:               `venta-${venta.id}-${item.producto_id ?? item.nombre}`,
        fecha:            venta.created_at,
        categoria:        'stock',
        tipo:             'egreso',
        concepto:         `${venta.tipo === 'presupuesto' ? 'Presupuesto' : 'Remito'} ${venta.numero}`,
        comprobante:      venta.numero,
        comprobante_tipo: venta.tipo,
        cliente:          venta.cliente_nombre,
        producto:         item.nombre,
        producto_id:      item.producto_id ?? null,
        cantidad:         item.cantidad,
        monto:            null,
      })
    }
  }

  // 2. Cargas/ajustes manuales de stock (Depósito + "+ Ajuste manual" de esta
  //    misma página, que ahora también escribe acá — ver POST más abajo)
  let stockQuery = supabase
    .from('movimientos_stock')
    .select('*')
    .eq('empresa', empresa)
    .order('created_at', { ascending: false })
    .limit(500)
  if (desde) stockQuery = stockQuery.gte('created_at', desde)
  if (hasta) stockQuery = stockQuery.lte('created_at', hasta + 'T23:59:59')
  if (productoId) stockQuery = stockQuery.eq('producto_id', productoId)

  const { data: stockMovs, error: errStock } = await stockQuery
  if (errStock) return NextResponse.json({ error: errStock.message }, { status: 500 })

  for (const s of stockMovs || []) {
    movimientos.push({
      id:               `stock-${s.id}`,
      fecha:            s.created_at,
      categoria:        'stock',
      tipo:             s.modo === 'establecer' ? 'ajuste' : 'entrada',
      concepto:         s.modo === 'establecer' ? `Ajuste de stock (fijado a ${s.nuevo_stock})` : 'Carga de stock',
      comprobante:      '',
      comprobante_tipo: 'deposito',
      cliente:          '',
      producto:         s.nombre,
      producto_id:      s.producto_id,
      cantidad:         s.delta,
      monto:            null,
    })
  }

  // 3. Cargos y cobros de cuenta corriente (cargar deuda, registrar cobro,
  //    cargo/cobro generado al facturar/cobrar una venta, etc.)
  let ccQuery = supabase
    .from('movimientos_cta_cte')
    .select('id, cliente_id, tipo, concepto, monto, created_at')
    .eq('empresa', empresa)
    .order('created_at', { ascending: false })
    .limit(500)
  if (desde) ccQuery = ccQuery.gte('created_at', desde)
  if (hasta) ccQuery = ccQuery.lte('created_at', hasta + 'T23:59:59')

  const { data: ccMovs, error: errCc } = await ccQuery
  if (errCc) return NextResponse.json({ error: errCc.message }, { status: 500 })

  const clienteIds = Array.from(new Set((ccMovs || []).map(m => m.cliente_id).filter(Boolean)))
  const nombrePorCliente = new Map<string, string>()
  if (clienteIds.length > 0) {
    const { data: clientesData } = await supabase
      .from('clientes')
      .select('id, nombre, apellido, razon_social')
      .in('id', clienteIds)
    for (const c of clientesData || []) {
      nombrePorCliente.set(c.id, c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim())
    }
  }

  for (const m of ccMovs || []) {
    const esAnulado = (m.concepto || '').startsWith('[ANULADO] ')
    const esCobro = m.tipo === 'cobro' || m.tipo === 'pago' || m.tipo === 'nota_credito'
    movimientos.push({
      id:               `cc-${m.id}`,
      fecha:            m.created_at,
      categoria:        'cta_cte',
      tipo:             esAnulado ? 'ajuste' : esCobro ? 'cobro' : 'cargo',
      concepto:         (m.concepto || '').replace('[ANULADO] ', '') || (esCobro ? 'Cobro cuenta corriente' : 'Cargo'),
      comprobante:      '',
      comprobante_tipo: 'cta_cte',
      cliente:          m.cliente_id ? (nombrePorCliente.get(m.cliente_id) || '') : '',
      producto:         '',
      producto_id:      null,
      cantidad:         null,
      monto:            m.monto,
    })
  }

  movimientos.sort((a, b) => b.fecha.localeCompare(a.fecha))
  return NextResponse.json(movimientos.slice(0, 500))
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

  // Antes este ajuste no quedaba registrado en ningún lado — ni en esta
  // misma página (el GET solo leía `ventas`) ni en Depósito. Ahora usa la
  // misma tabla que ya usa Depósito para su historial, así queda visible acá.
  // La tabla no tiene columna "motivo" — se anota en el nombre para no
  // perderlo (Depósito tampoco lo pide, así que no rompe nada existente).
  await supabase.from('movimientos_stock').insert([{
    empresa, nombre: motivo ? `${prod.nombre} — ${motivo}` : prod.nombre,
    delta: Number(cantidad), nuevo_stock: nuevoStock, modo: 'agregar', producto_id: prod.id,
  }])

  return NextResponse.json({ ok: true, producto: prod.nombre, stock_anterior: prod.stock, stock_nuevo: nuevoStock })
}
