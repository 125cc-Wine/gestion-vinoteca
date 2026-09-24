import { supabase } from '@/lib/supabase'

// Lógica de ventas compartida entre /api/ventas y el armado de pedidos web
// (src/lib/woo-pedidos.ts): número de comprobante, stock, caja y cuenta
// corriente. Movida tal cual desde src/app/api/ventas/route.ts.

// condicion_venta (ventas) -> medio_pago (caja) — son dos listas separadas
// que nunca se cruzaron, así que el Cierre del día (que agrupa por
// medio_pago) nunca veía nada de lo vendido desde Ventas.
export function medioPagoDesdeCondicion(condicion?: string | null): string | undefined {
  const map: Record<string, string> = {
    'Contado': 'Efectivo',
    'Cta. Cte.': 'Cta.Cte.',
    'Transferencia': 'Transferencia',
    'Tarjeta Débito': 'Tarjeta Débito',
    'Tarjeta Crédito': 'Tarjeta Crédito',
    'QR': 'QR',
    'Billetera Virtual MercadoPago': 'MercadoPago',
  }
  return condicion ? map[condicion] : undefined
}

// Descuenta stock de cada ítem de la venta, en las dos empresas (depósito
// compartido). Se usa tanto al crear un remito
// nuevo como al convertir un presupuesto en remito.
export async function descontarStockItems(items: { producto_id?: string; cantidad: number }[]) {
  for (const item of items) {
    if (!item.producto_id) continue
    const { data: prod } = await supabase
      .from('productos')
      .select('id, nombre, empresa, stock, woo_product_id, precio_venta, unidad_medida')
      .eq('id', item.producto_id)
      .single()

    if (!prod) continue

    const factor = prod.unidad_medida === 'caja12' ? 12 : prod.unidad_medida === 'caja6' ? 6 : prod.unidad_medida === 'caja4' ? 4 : 1
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

    // El stock a la web NO se manda acá: el trigger anota la diferencia y
    // se envía por la cola (src/lib/woo-stock-cola.ts). Mandar el stock
    // absoluto pisaba las ventas online, que no se cargan en el sistema.
  }
}

// Inversa de descontarStockItems — devuelve stock al cancelar/eliminar un
// remito. Antes DELETE cancelaba la venta y revertía el cargo de cuenta
// corriente, pero nunca tocaba el stock: un remito cancelado dejaba la
// mercadería descontada para siempre aunque nunca hubiera salido.
export async function devolverStockItems(items: { producto_id?: string; cantidad: number }[]) {
  for (const item of items) {
    if (!item.producto_id) continue
    const { data: prod } = await supabase
      .from('productos')
      .select('id, nombre, empresa, stock, unidad_medida')
      .eq('id', item.producto_id)
      .single()
    if (!prod) continue

    const factor = prod.unidad_medida === 'caja12' ? 12 : prod.unidad_medida === 'caja6' ? 6 : prod.unidad_medida === 'caja4' ? 4 : 1
    const nuevoStock = (prod.stock || 0) + item.cantidad * factor
    await supabase.from('productos').update({ stock: nuevoStock }).eq('id', prod.id)

    const otraEmpresa = prod.empresa === 'aroma' ? 'lavid' : 'aroma'
    const { data: contra } = await supabase.from('productos').select('id').eq('nombre', prod.nombre).eq('empresa', otraEmpresa).single()
    if (contra) await supabase.from('productos').update({ stock: nuevoStock }).eq('id', contra.id)
  }
}


// Crea una venta (presupuesto, remito o devolución) con todos sus efectos.
// body: la fila de ventas + descontarStock / devolverStock.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function crearVenta(body: any): Promise<{ data?: any; error?: string }> {
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

  if (error) return { error: error.message }

  // Si la ficha del cliente tiene cargada otra empresa, corregirla acá —
  // esto es lo que causaba clientes con saldo real (viendo bien las ventas)
  // pero invisibles en el listado de Clientes o con la ficha "vacía" al
  // abrirla parado en la empresa equivocada (ej. Angulos del Mar / Craft
  // Sushi Fusion, saldo $880.100 sin ningún comprobante a la vista).
  if (venta.cliente_id) {
    const { data: cli } = await supabase.from('clientes').select('empresa').eq('id', venta.cliente_id).single()
    if (cli && cli.empresa !== venta.empresa) {
      await supabase.from('clientes').update({ empresa: venta.empresa }).eq('id', venta.cliente_id)
    }
  }

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
          const factor = prod.unidad_medida === 'caja12' ? 12 : prod.unidad_medida === 'caja6' ? 6 : prod.unidad_medida === 'caja4' ? 4 : 1
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
        categoria: 'Devoluciones',
        medio_pago: medioPagoDesdeCondicion(venta.condicion_venta) || 'Efectivo',
        referencia_id: data.id,
      }])
    }
    return { data }
  }

  // Descontar stock si es remito (en ambas empresas — depósito compartido)
  if (descontarStock && venta.items) {
    await descontarStockItems(venta.items)
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
      medio_pago: venta.estado_pago === 'cuenta_corriente' ? 'Cta.Cte.' : medioPagoDesdeCondicion(condicion),
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

  return { data }
}
