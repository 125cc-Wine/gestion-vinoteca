export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { wooUpdateStockAndPrice } from '@/lib/woocommerce'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })
  const clienteId = req.nextUrl.searchParams.get('cliente_id')

  const PAGE = 1000
  let all: unknown[] = []
  let from = 0
  while (true) {
    let query = supabase
      .from('ventas')
      .select('*')
      .eq('empresa', empresa)
      .neq('estado', 'cancelado')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1)
    if (clienteId) query = query.eq('cliente_id', clienteId)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return NextResponse.json(all)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { descontarStock, devolverStock, ...venta } = body

  // Generar número de comprobante
  const prefijos: Record<string, string> = { presupuesto: 'PRES', remito: 'REM', devolucion: 'DEV' }
  const tipo = prefijos[venta.tipo] || 'COMP'
  const { count } = await supabase
    .from('ventas')
    .select('*', { count: 'exact', head: true })
    .eq('empresa', venta.empresa)
    .eq('tipo', venta.tipo)

  venta.numero = `${tipo}-${String((count || 0) + 1).padStart(6, '0')}`

  const { data, error } = await supabase
    .from('ventas')
    .insert([venta])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Devolver stock si es devolución (incrementar)
  if (devolverStock && venta.items) {
    for (const item of venta.items) {
      if (item.producto_id) {
        const { data: prod } = await supabase
          .from('productos')
          .select('id, nombre, empresa, stock, woo_product_id, precio_venta, unidad_medida')
          .eq('id', item.producto_id)
          .single()
        if (prod) {
          const factor = prod.unidad_medida === 'caja12' ? 12 : prod.unidad_medida === 'caja6' ? 6 : 1
          const nuevoStock = (prod.stock || 0) + item.cantidad * factor
          await supabase.from('productos').update({ stock: nuevoStock }).eq('id', prod.id)
          const otraEmpresa = prod.empresa === 'aroma' ? 'lavid' : 'aroma'
          const { data: contra } = await supabase.from('productos').select('id').eq('nombre', prod.nombre).eq('empresa', otraEmpresa).single()
          if (contra) await supabase.from('productos').update({ stock: nuevoStock }).eq('id', contra.id)
        }
      }
    }
    // Registrar egreso en caja si había pago (devolución de dinero)
    if (venta.total > 0 && venta.estado_pago === 'pagado') {
      await supabase.from('movimientos_caja').insert([{
        empresa: venta.empresa, tipo: 'egreso',
        concepto: `Devolución ${venta.numero} - ${venta.cliente_nombre}`,
        monto: venta.total, fecha: new Date().toISOString().split('T')[0],
        categoria: 'Devoluciones', referencia_id: data.id,
      }])
    }
    return NextResponse.json(data)
  }

  // Descontar stock si es remito (en ambas empresas — depósito compartido)
  if (descontarStock && venta.items) {
    for (const item of venta.items) {
      if (item.producto_id) {
        const { data: prod } = await supabase
          .from('productos')
          .select('id, nombre, empresa, stock, woo_product_id, precio_venta, unidad_medida')
          .eq('id', item.producto_id)
          .single()

        if (prod) {
          const factor = prod.unidad_medida === 'caja12' ? 12 : prod.unidad_medida === 'caja6' ? 6 : 1
          const nuevoStock = Math.max(0, (prod.stock || 0) - item.cantidad * factor)
          await supabase.from('productos').update({ stock: nuevoStock }).eq('id', prod.id)

          // Descontar mismo stock en la otra empresa
          const otraEmpresa = prod.empresa === 'aroma' ? 'lavid' : 'aroma'
          const { data: contra } = await supabase
            .from('productos')
            .select('id, woo_product_id, precio_venta')
            .eq('nombre', prod.nombre)
            .eq('empresa', otraEmpresa)
            .single()

          if (contra) {
            await supabase.from('productos').update({ stock: nuevoStock }).eq('id', contra.id)
          }

          // Sync WooCommerce con el producto de aroma (sea el principal o la contraparte)
          if (process.env.WOOCOMMERCE_CONSUMER_KEY) {
            const aromaProd = prod.empresa === 'aroma' ? prod : contra
            if (aromaProd?.woo_product_id) {
              try {
                await wooUpdateStockAndPrice(aromaProd.woo_product_id, aromaProd.precio_venta, nuevoStock)
              } catch (e) {
                console.error('WooCommerce sync error:', e)
              }
            }
          }
        }
      }
    }
  }

  // Registrar en caja (tanto presupuesto como remito)
  if (venta.total > 0 && venta.estado_pago !== 'pendiente') {
    const tipoLabel = venta.tipo === 'presupuesto' ? 'Presupuesto' : 'Remito'
    const condicion = venta.condicion_venta || 'Contado'
    await supabase.from('movimientos_caja').insert([{
      empresa: venta.empresa,
      tipo: 'ingreso',
      concepto: `${tipoLabel} ${venta.numero} - ${venta.cliente_nombre}`,
      monto: venta.total,
      fecha: new Date().toISOString().split('T')[0],
      categoria: `Ventas - ${condicion}`,
      referencia_id: data.id,
    }])
  }

  // Si es cuenta corriente, sumar al saldo del cliente
  if (venta.estado_pago === 'cuenta_corriente' && venta.cliente_id && venta.total > 0) {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('saldo')
      .eq('id', venta.cliente_id)
      .single()

    const saldoAnterior = cliente?.saldo || 0
    const saldoNuevo = saldoAnterior + venta.total

    await supabase.from('clientes').update({ saldo: saldoNuevo }).eq('id', venta.cliente_id)

    await supabase.from('movimientos_cta_cte').insert([{
      cliente_id: venta.cliente_id,
      empresa: venta.empresa,
      tipo: 'cargo',
      concepto: `${venta.tipo === 'presupuesto' ? 'Presupuesto' : 'Remito'} ${venta.numero}`,
      monto: venta.total,
      saldo_anterior: saldoAnterior,
      saldo_nuevo: saldoNuevo,
      referencia_id: data.id,
    }])
  }

  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, descontarStock: _ds, devolverStock: _dvs, ...rest } = body

  const { data, error } = await supabase
    .from('ventas')
    .update(rest)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabase
    .from('ventas')
    .update({ estado: 'cancelado' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
