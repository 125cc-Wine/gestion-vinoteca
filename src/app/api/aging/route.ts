export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function diffDays(from: string): number {
  const now = Date.now()
  const then = new Date(from).getTime()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

const PAGE = 1000
async function fetchAll<T>(table: string, cols: string, eqs: Record<string, string> = {}): Promise<T[]> {
  let all: T[] = []
  let from = 0
  while (true) {
    let q = supabase.from(table).select(cols)
    for (const [k, v] of Object.entries(eqs)) q = q.eq(k, v)
    const { data, error } = await q.range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    all = all.concat((data ?? []) as T[])
    if (!data || data.length < PAGE) break
    from += PAGE
  }
  return all
}

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  try {
    // 1. Ventas pendientes en cuenta corriente de ESTA empresa (presupuesto,
    //    remito y factura). Se usa total - monto_pagado, no el total bruto,
    //    para no sobrecontar ventas que ya tienen un pago parcial registrado.
    const ventasEmpresa = await fetchAll<{
      id: string; numero?: string; cliente_id: string | null; cliente_nombre: string
      total: number; monto_pagado: number | null; created_at: string; tipo: string
      estado_pago: string; estado: string
    }>('ventas', 'id, numero, cliente_id, cliente_nombre, total, monto_pagado, created_at, tipo, estado_pago, estado', { empresa })
      .then(rows => rows.filter(v =>
        ['presupuesto', 'remito', 'factura'].includes(v.tipo) &&
        v.estado_pago === 'cuenta_corriente' &&
        v.estado !== 'cancelado'
      ))

    // 2. Deuda "cargada a mano" (Cargar deuda, migraciones de sistema
    //    anterior, etc.) que no está atada a ninguna venta.
    //    movimientos_cta_cte.monto_pagado no sirve para saber cuánto de un
    //    cargo sigue abierto: una migración vieja lo dejó igual a "monto" en
    //    el 100% de los cargos existentes, marcándolos a todos como
    //    "cobrados" sin importar si realmente lo estaban. En cambio usamos
    //    clientes.saldo (que sí se mantiene al día en cada alta/edición/
    //    cobro) menos lo que ya se explica con ventas abiertas — la
    //    diferencia es la deuda cargada que sigue pendiente. clientes.saldo
    //    es global (no está partido por empresa), así que ese residuo se
    //    reparte a prorrata de en qué empresa están cargados los
    //    movimientos de cta_cte del cliente.
    const [ventasGlobales, movimientosCtaCte, clientesConSaldo] = await Promise.all([
      fetchAll<{ cliente_id: string | null; total: number; monto_pagado: number | null; tipo: string; estado_pago: string; estado: string }>(
        'ventas', 'cliente_id, total, monto_pagado, tipo, estado_pago, estado'
      ).then(rows => rows.filter(v =>
        ['presupuesto', 'remito', 'factura'].includes(v.tipo) &&
        v.estado_pago === 'cuenta_corriente' &&
        v.estado !== 'cancelado'
      )),
      fetchAll<{ cliente_id: string; empresa: string; tipo: string; monto: number; referencia_id: string | null; created_at: string }>(
        'movimientos_cta_cte', 'cliente_id, empresa, tipo, monto, referencia_id, created_at'
      ),
      fetchAll<{ id: string; nombre: string; apellido: string | null; razon_social: string | null; telefono: string | null; vendedor_id: string | null; saldo: number }>(
        'clientes', 'id, nombre, apellido, razon_social, telefono, vendedor_id, saldo'
      ).then(rows => rows.filter(c => c.saldo > 0)),
    ])

    if (ventasEmpresa.length === 0 && clientesConSaldo.length === 0) return NextResponse.json([])

    // Total de ventas abiertas por cliente, en TODAS las empresas (para
    // aislar cuánto del saldo global no se explica con ninguna venta).
    const pendienteVentasGlobalPorCliente: Record<string, number> = {}
    for (const v of ventasGlobales) {
      if (!v.cliente_id) continue
      const pendiente = (v.total || 0) - (v.monto_pagado || 0)
      pendienteVentasGlobalPorCliente[v.cliente_id] = (pendienteVentasGlobalPorCliente[v.cliente_id] || 0) + pendiente
    }

    const cargos = movimientosCtaCte.filter(m => m.tipo === 'cargo')

    // Un cargo anulado/corregido a mano queda en la tabla como un "cobro" que
    // referencia el mismo comprobante (mismo referencia_id) y la misma
    // empresa, por el monto exacto que lo cancela — ver ejemplo real: cargo
    // de $72.150 en Aroma para un cliente cuya deuda real era 100% de La Vid,
    // corregido después con un cobro de $72.150 sobre esa misma referencia.
    // Si no se descuenta ese cargo ya anulado antes de prorratear, sigue
    // pesando en el reparto entre empresas y le termina atribuyendo a Aroma
    // una porción de una deuda que nunca fue de Aroma. Los cobros con
    // referencia_id null (cobros genéricos, tipo "Cobro cta. cte." repartido
    // FIFO) no se pueden atar a un cargo puntual, así que no participan acá
    // — ya están reflejados en clientes.saldo, que es lo que arma
    // residualGlobal más abajo.
    const cargoSumPorKey: Record<string, number> = {}
    const cobroSumPorKey: Record<string, number> = {}
    const keyOf = (m: { cliente_id: string; referencia_id: string | null; empresa: string }) =>
      `${m.cliente_id}|${m.referencia_id}|${m.empresa}`
    for (const c of cargos) {
      if (!c.referencia_id) continue
      cargoSumPorKey[keyOf(c)] = (cargoSumPorKey[keyOf(c)] || 0) + (c.monto || 0)
    }
    for (const m of movimientosCtaCte) {
      if (m.tipo !== 'cobro' || !m.referencia_id) continue
      const key = keyOf(m)
      if (!(key in cargoSumPorKey)) continue // no hay cargo puntual al que netear
      cobroSumPorKey[key] = (cobroSumPorKey[key] || 0) + (m.monto || 0)
    }

    // Cargos por cliente, separados por empresa (para el prorrateo, ya
    // neteados contra su reversa si la tuvieron) y con la fecha más vieja
    // (para ubicar el residuo en el bucket de antigüedad correcto).
    const cargoBrutoPorCliente: Record<string, { aroma: number; lavid: number }> = {}
    const cargoFechaMasViejaPorCliente: Record<string, string> = {}
    for (const c of cargos) {
      if (!cargoBrutoPorCliente[c.cliente_id]) cargoBrutoPorCliente[c.cliente_id] = { aroma: 0, lavid: 0 }
      const fechaActual = cargoFechaMasViejaPorCliente[c.cliente_id]
      if (!fechaActual || c.created_at < fechaActual) cargoFechaMasViejaPorCliente[c.cliente_id] = c.created_at
      if (c.empresa !== 'aroma' && c.empresa !== 'lavid') continue
      if (!c.referencia_id) { cargoBrutoPorCliente[c.cliente_id][c.empresa] += (c.monto || 0); continue }
    }
    // Los cargos con referencia_id se agregan netos por key (una sola vez
    // por key, no por cada fila, para no descontar de más si hay varios
    // cargos apilados sobre el mismo comprobante — ver "ajuste al editar").
    const keysVistas = new Set<string>()
    for (const c of cargos) {
      if (!c.referencia_id) continue
      if (c.empresa !== 'aroma' && c.empresa !== 'lavid') continue
      const key = keyOf(c)
      if (keysVistas.has(key)) continue
      keysVistas.add(key)
      const neto = Math.max(0, (cargoSumPorKey[key] || 0) - (cobroSumPorKey[key] || 0))
      cargoBrutoPorCliente[c.cliente_id][c.empresa] += neto
    }

    const clientePorId: Record<string, typeof clientesConSaldo[number]> = {}
    for (const c of clientesConSaldo) clientePorId[c.id] = c

    // 3. Devoluciones pendientes de netear (tipo='devolucion', mismo
    //    cliente), en esta empresa.
    const idsRelevantes = Array.from(new Set([
      ...ventasEmpresa.map(v => v.cliente_id).filter((id): id is string => !!id),
      ...clientesConSaldo.map(c => c.id),
    ]))
    const { data: devoluciones } = idsRelevantes.length > 0 ? await supabase
      .from('ventas')
      .select('id, cliente_id, total')
      .eq('empresa', empresa)
      .eq('tipo', 'devolucion')
      .neq('estado', 'cancelado')
      .in('cliente_id', idsRelevantes) : { data: [] as { id: string; cliente_id: string; total: number }[] }

    const devPorCliente: Record<string, number> = {}
    for (const d of (devoluciones ?? [])) {
      const key = d.cliente_id || '__sin_cliente__'
      devPorCliente[key] = (devPorCliente[key] || 0) + Math.abs(d.total || 0)
    }

    // 4. Agrupar por cliente y calcular buckets.
    type Item = { total: number; created_at: string; dias: number }
    const SIN_CLIENTE = '__sin_cliente__'
    const porCliente: Record<string, { nombre: string; items: Item[]; clienteId: string | null }> = {}

    for (const v of ventasEmpresa) {
      const key = v.cliente_id || SIN_CLIENTE
      if (!porCliente[key]) porCliente[key] = { nombre: v.cliente_nombre, items: [], clienteId: v.cliente_id }
      const pendiente = (v.total || 0) - (v.monto_pagado || 0)
      if (pendiente <= 0.01) continue
      porCliente[key].items.push({ total: pendiente, created_at: v.created_at, dias: diffDays(v.created_at) })
    }

    // Residuo de deuda cargada a mano, prorrateado a esta empresa.
    for (const c of clientesConSaldo) {
      const pendienteVentas = pendienteVentasGlobalPorCliente[c.id] || 0
      const residualGlobal = Math.max(0, c.saldo - pendienteVentas)
      if (residualGlobal <= 0.01) continue
      const bruto = cargoBrutoPorCliente[c.id]
      const brutoTotal = bruto ? bruto.aroma + bruto.lavid : 0
      const share = brutoTotal > 0 ? (bruto![empresa as 'aroma' | 'lavid'] || 0) / brutoTotal : (empresa === 'aroma' ? 1 : 0)
      const residualEmpresa = residualGlobal * share
      if (residualEmpresa <= 0.01) continue

      const key = c.id
      if (!porCliente[key]) {
        const nombre = c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()
        porCliente[key] = { nombre, items: [], clienteId: c.id }
      }
      const fecha = cargoFechaMasViejaPorCliente[c.id] || new Date().toISOString()
      porCliente[key].items.push({ total: residualEmpresa, created_at: fecha, dias: diffDays(fecha) })
    }

    // 5. Construir resultado.
    const result = Object.entries(porCliente).map(([key, { nombre, items, clienteId }]) => {
      let bucket_30 = 0, bucket_60 = 0, bucket_90 = 0, bucket_mas90 = 0
      let dias_maximo = 0
      let ultima_compra: string | null = null

      for (const it of items) {
        if (it.dias <= 30) bucket_30 += it.total
        else if (it.dias <= 60) bucket_60 += it.total
        else if (it.dias <= 90) bucket_90 += it.total
        else bucket_mas90 += it.total

        if (it.dias > dias_maximo) dias_maximo = it.dias
        if (!ultima_compra || it.created_at > ultima_compra) ultima_compra = it.created_at
      }

      let devPendiente = devPorCliente[clienteId ?? SIN_CLIENTE] || 0
      if (devPendiente > 0) {
        const descuento = (bucket: number) => {
          const aplicado = Math.min(bucket, devPendiente)
          devPendiente -= aplicado
          return bucket - aplicado
        }
        bucket_mas90 = descuento(bucket_mas90)
        bucket_90    = descuento(bucket_90)
        bucket_60    = descuento(bucket_60)
        bucket_30    = descuento(bucket_30)
      }

      const saldo_total = bucket_30 + bucket_60 + bucket_90 + bucket_mas90
      if (saldo_total <= 0.01) return null

      const cliente = clienteId ? clientePorId[clienteId] : null
      return {
        cliente_id: clienteId,
        cliente_nombre: nombre,
        telefono: cliente?.telefono ?? null,
        vendedor_id: cliente?.vendedor_id ?? null,
        saldo_total,
        bucket_30,
        bucket_60,
        bucket_90,
        bucket_mas90,
        dias_maximo,
        ultima_compra,
      }
    })
      .filter(Boolean)
      .sort((a, b) => b!.dias_maximo - a!.dias_maximo)

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error desconocido' }, { status: 500 })
  }
}
