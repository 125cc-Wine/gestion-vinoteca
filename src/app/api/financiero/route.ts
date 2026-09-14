export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { construirIndice, costoOportunidad, type IndiceInflacionRow } from '@/lib/inflacion'

const PAGE = 1000
async function fetchAll<T>(table: string, cols: string, build?: (q: any) => any): Promise<T[]> {
  let all: T[] = []
  let from = 0
  while (true) {
    let q = supabase.from(table).select(cols)
    if (build) q = build(q)
    const { data, error } = await q.range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    all = all.concat((data ?? []) as T[])
    if (!data || data.length < PAGE) break
    from += PAGE
  }
  return all
}

interface VentaRow {
  id: string; empresa: string; tipo: string; numero: string | null; total: number; monto_pagado: number | null
  created_at: string; cliente_id: string | null; cliente_nombre: string
  items: { nombre: string; cantidad: number; subtotal: number; producto_id?: string }[]
  estado_pago: string | null; estado: string
  facturado: boolean | null; nro_cbte_afip: string | null
}
interface MovCtaCte { empresa: string; tipo: 'cargo' | 'cobro'; monto: number; referencia_id: string | null; created_at: string }
interface Cheque { id: string; empresa: string; monto: number; fecha_emision: string; fecha_pago: string; banco: string | null; cliente_id: string | null; estado: string }
interface Producto { id: string; nombre: string; bodega: string | null; categoria: string | null; precio_costo: number | null }

// GET /api/financiero?empresa=aroma|lavid|ambas&desde=...&hasta=...
//
// "Ganancia real" = margen nominal (venta - costo actual, igual que
// Reportes) MENOS el costo de oportunidad de la plata que queda inmovilizada
// mientras se cobra: ventas a crédito (cta. cte.) que tardan en cobrarse, y
// cheques recibidos que quedan en cartera hasta su fecha de pago. Ese costo
// se mide con la inflación mensual (INDEC) acumulada entre la venta y el
// cobro efectivo (o hoy, si sigue pendiente) — ver src/lib/inflacion.ts para
// la fórmula.
//
// Alcance deliberado (v1): la erosión de cta. cte. solo cubre VENTAS del
// período (presupuesto/remito/factura con un cargo de cta. cte. asociado),
// no la "deuda cargada a mano" (migraciones, ajustes) que vive en
// movimientos_cta_cte sin una venta detrás — esa es una porción chica y sin
// una fecha de origen tan limpia; para el saldo completo, Cobranzas (aging)
// sigue siendo la fuente de verdad.
export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  const desde   = req.nextUrl.searchParams.get('desde')
  const hasta   = req.nextUrl.searchParams.get('hasta')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  const ambas = empresa === 'ambas'
  const empresas = ambas ? ['aroma', 'lavid'] : [empresa]

  try {
    const [indicesRaw, ventas, movs, cheques, productos] = await Promise.all([
      fetchAll<IndiceInflacionRow>('indices_inflacion', 'mes, valor_mensual'),
      // Incluye 'devolucion' (notas de crédito) además de presupuesto/remito/
      // factura: el margen y la erosión de cta. cte. las siguen excluyendo
      // (igual que Reportes), pero el IVA débito fiscal las necesita — una
      // NC facturada resta del débito del período en que se emitió.
      fetchAll<VentaRow>('ventas', 'id, empresa, tipo, numero, total, monto_pagado, created_at, cliente_id, cliente_nombre, items, estado_pago, estado, facturado, nro_cbte_afip', q => {
        let qq = q.neq('estado', 'cancelado').in('tipo', ['presupuesto', 'remito', 'factura', 'devolucion'])
        if (!ambas) qq = qq.eq('empresa', empresa)
        if (desde) qq = qq.gte('created_at', desde)
        if (hasta) qq = qq.lte('created_at', hasta + 'T23:59:59')
        return qq
      }),
      fetchAll<MovCtaCte>('movimientos_cta_cte', 'empresa, tipo, monto, referencia_id, created_at', q =>
        q.in('tipo', ['cargo', 'cobro']).in('empresa', empresas)
      ),
      fetchAll<Cheque>('cheques', 'id, empresa, monto, fecha_emision, fecha_pago, banco, cliente_id, estado', q =>
        q.eq('tipo', 'recibido').in('empresa', empresas)
      ),
      fetchAll<Producto>('productos', 'id, nombre, bodega, categoria, precio_costo'),
    ])

    const acumulado = construirIndice(indicesRaw)
    const hoy = new Date()

    const costoPorId = new Map(productos.map(p => [p.id, p.precio_costo || 0]))
    const costoPorNombre = new Map(productos.map(p => [p.nombre.trim().toLowerCase(), p.precio_costo || 0]))
    const categoriaPorId = new Map(productos.map(p => [p.id, p.categoria || 'Sin categoría']))
    const nombrePorId = new Map(productos.map(p => [p.id, `${p.nombre}${p.bodega ? ' - ' + p.bodega : ''}`]))

    const costoDeItem = (item: VentaRow['items'][number]): number => {
      let c = item.producto_id ? costoPorId.get(item.producto_id) : undefined
      if (c == null) c = costoPorNombre.get(item.nombre.split(' - ')[0].trim().toLowerCase())
      return c ?? 0
    }
    const categoriaDeItem = (item: VentaRow['items'][number]): string => {
      return (item.producto_id && categoriaPorId.get(item.producto_id)) || 'Sin categoría'
    }
    const nombreDeItem = (item: VentaRow['items'][number]): string => {
      return (item.producto_id && nombrePorId.get(item.producto_id)) || item.nombre
    }

    // Ventas con cargo de cta. cte. asociado (fueron a crédito) y sus cobros,
    // agrupados por venta (referencia_id apunta al id de la venta en ambos
    // casos — ver comentarios en /api/ventas y /api/cta-cte).
    const ventasACredito = new Set(movs.filter(m => m.tipo === 'cargo' && m.referencia_id).map(m => m.referencia_id!))
    const cobrosPorVenta = new Map<string, { monto: number; fecha: Date }[]>()
    for (const m of movs) {
      if (m.tipo !== 'cobro' || !m.referencia_id) continue
      const arr = cobrosPorVenta.get(m.referencia_id) || []
      arr.push({ monto: m.monto, fecha: new Date(m.created_at) })
      cobrosPorVenta.set(m.referencia_id, arr)
    }

    let margenNominal = 0
    let costoOportunidadCtaCte = 0
    let montoExpuestoActual = 0
    let sumaDiasPonderada = 0
    let sumaMontoCobrado = 0

    const porCliente = new Map<string, { nombre: string; margenNominal: number; costoOportunidad: number; montoExpuesto: number; diasPond: number; montoCobradoPond: number }>()
    const porProducto = new Map<string, { nombre: string; margenNominal: number; costoOportunidad: number }>()
    const porCategoria = new Map<string, { categoria: string; margenNominal: number; costoOportunidad: number }>()

    const detalleCreditos: {
      id: string; numero: string | null; cliente_nombre: string; fecha_venta: string
      total: number; totalPagado: number; restante: number
      cobros: { monto: number; fecha: string; dias: number }[]
      costoOportunidad: number
    }[] = []

    for (const v of ventas) {
      // Las notas de crédito (devolucion) no son ventas — se procesan aparte
      // más abajo, solo para IVA (igual que Reportes las excluye del margen).
      if (v.tipo === 'devolucion') continue
      const fechaVenta = new Date(v.created_at)
      const esCredito = ventasACredito.has(v.id)

      // Costo de oportunidad total de ESTA venta (0 si fue de contado).
      //
      // Cuánto está REALMENTE pendiente sale de venta.monto_pagado (el mismo
      // campo que usa Reportes), no de sumar los movimientos de cta. cte. con
      // referencia_id = esta venta: hay cobros viejos ("Cobro cuenta
      // corriente (Aging)", previos a que esa pantalla empezara a etiquetar
      // cada aplicación con su referencia_id) que sí saldaron la venta pero
      // quedaron grabados como un movimiento genérico sin referencia — si acá
      // solo mirábamos los movimientos CON referencia, esas ventas ya
      // cobradas seguían apareciendo como "pendiente" (caso real: Diego
      // Alvarez Irune, PRES-000021, pagada y marcada como $511.516
      // pendientes). Los movimientos con referencia sí se usan para las
      // FECHAS de cobro (necesarias para medir la demora); lo cobrado por
      // esa vía vieja sin fecha rastreable no le suma costo de oportunidad —
      // preferimos no imputarle una fecha inventada a no tener certeza.
      // Además: cuando estado_pago ya es 'pagado', se confía en eso por
      // encima de monto_pagado — hay ventas editadas a mano (cambiar el
      // estado a "pagado" desde la edición, no desde el botón "Cobrar") que
      // quedaron con monto_pagado=0 pese a estar saldadas (caso real: Victor
      // Duarte, PRES-000098, ajustada por edición con su cobro de cta. cte.
      // registrado y todo, pero monto_pagado nunca se tocó). Mismo criterio
      // que ya usa el KPI "pendiente de cobro" de Reportes.
      const totalPagado = v.estado_pago === 'pagado' ? v.total : (v.monto_pagado || 0)
      let costoVenta = 0
      if (esCredito) {
        const cobrosFechados = (cobrosPorVenta.get(v.id) || []).slice().sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
        const cobrosDetalle: { monto: number; fecha: string; dias: number }[] = []
        let cobradoConFecha = 0
        for (const c of cobrosFechados) {
          const montoAplicable = Math.min(c.monto, Math.max(0, totalPagado - cobradoConFecha))
          if (montoAplicable <= 0.01) continue
          costoVenta += costoOportunidad(montoAplicable, fechaVenta, c.fecha, acumulado, hoy)
          const dias = Math.max(0, Math.round((c.fecha.getTime() - fechaVenta.getTime()) / 86400000))
          sumaDiasPonderada += dias * montoAplicable
          sumaMontoCobrado += montoAplicable
          cobradoConFecha += montoAplicable
          cobrosDetalle.push({ monto: montoAplicable, fecha: c.fecha.toISOString(), dias })
        }
        const restante = Math.max(0, parseFloat((v.total - totalPagado).toFixed(2)))
        if (restante > 0.01) {
          costoVenta += costoOportunidad(restante, fechaVenta, hoy, acumulado, hoy)
          montoExpuestoActual += restante
        }
        // Detalle transacción por transacción — para poder verificar a ojo
        // cada venta a crédito (fecha de venta, cuándo/cuánto se cobró, qué
        // sigue pendiente) en vez de confiar ciegamente en los agregados.
        detalleCreditos.push({
          id: v.id, numero: v.numero, cliente_nombre: v.cliente_nombre, fecha_venta: v.created_at,
          total: v.total, totalPagado, restante, cobros: cobrosDetalle, costoOportunidad: costoVenta,
        })
      }
      costoOportunidadCtaCte += costoVenta

      const clienteKey = v.cliente_id || v.cliente_nombre
      if (!porCliente.has(clienteKey)) porCliente.set(clienteKey, { nombre: v.cliente_nombre, margenNominal: 0, costoOportunidad: 0, montoExpuesto: 0, diasPond: 0, montoCobradoPond: 0 })
      const cli = porCliente.get(clienteKey)!
      cli.costoOportunidad += costoVenta
      if (esCredito) {
        cli.montoExpuesto += Math.max(0, v.total - totalPagado)
      }

      // Margen nominal + reparto del costo de oportunidad de la venta a cada
      // ítem, a prorrata de su participación en el total (para poder abrir
      // por producto/categoría). Ventas viejas sin "items" quedan afuera del
      // reparto pero ya suman al total vía costoVenta más arriba.
      for (const item of (v.items || [])) {
        const costoItem = costoDeItem(item)
        const margenItem = (item.subtotal || 0) - costoItem * item.cantidad
        margenNominal += margenItem
        cli.margenNominal += margenItem

        const shareCosto = v.total > 0 ? ((item.subtotal || 0) / v.total) * costoVenta : 0

        const keyProd = item.producto_id && nombrePorId.get(item.producto_id) ? item.producto_id : item.nombre
        if (!porProducto.has(keyProd)) porProducto.set(keyProd, { nombre: nombreDeItem(item), margenNominal: 0, costoOportunidad: 0 })
        const prod = porProducto.get(keyProd)!
        prod.margenNominal += margenItem
        prod.costoOportunidad += shareCosto

        const cat = categoriaDeItem(item)
        if (!porCategoria.has(cat)) porCategoria.set(cat, { categoria: cat, margenNominal: 0, costoOportunidad: 0 })
        const catRow = porCategoria.get(cat)!
        catRow.margenNominal += margenItem
        catRow.costoOportunidad += shareCosto
      }
    }

    // Erosión de los cheques recibidos que quedan en cartera hasta su fecha
    // de pago (capa aparte de la de cta. cte.: si un cheque canceló una
    // venta a crédito, la erosión de esa venta ya se cortó en la fecha en
    // que se registró el cobro con ese cheque — esto mide la demora
    // ADICIONAL hasta que el cheque en sí se puede cobrar).
    let costoOportunidadCheques = 0
    const chequesDetalle: { id: string; banco: string | null; monto: number; fecha_emision: string; fecha_pago: string; dias: number; costoOportunidad: number; vencido: boolean }[] = []
    for (const ch of cheques) {
      // Anulados no representan plata real; rechazados son un problema de
      // riesgo crediticio (el cheque nunca se cobró), no de demora — ambos
      // quedan fuera de esta erosión por timing.
      if (ch.estado === 'anulado' || ch.estado === 'rechazado') continue
      if (!ch.fecha_emision || !ch.fecha_pago) continue
      if (desde && ch.fecha_emision < desde) continue
      if (hasta && ch.fecha_emision > hasta) continue
      // +T12:00:00 para que el parseo caiga a mediodía local, no medianoche
      // UTC — evita que una fecha DATE (sin hora) se corra un día en un
      // server con huso horario negativo (mismo truco que ya usa Reportes).
      const fEmision = new Date(ch.fecha_emision + 'T12:00:00')
      const fPago = new Date(ch.fecha_pago + 'T12:00:00')
      const fFin = fPago < hoy ? fPago : hoy
      const dias = Math.max(0, Math.round((fFin.getTime() - fEmision.getTime()) / 86400000))
      const c = costoOportunidad(ch.monto, fEmision, fFin, acumulado, hoy)
      costoOportunidadCheques += c
      chequesDetalle.push({ id: ch.id, banco: ch.banco, monto: ch.monto, fecha_emision: ch.fecha_emision, fecha_pago: ch.fecha_pago, dias, costoOportunidad: c, vencido: fPago < hoy })
    }

    const costoOportunidadTotal = costoOportunidadCtaCte + costoOportunidadCheques
    const gananciaReal = margenNominal - costoOportunidadTotal

    // IVA débito fiscal: toda venta con facturado=true tiene un CAE real de
    // AFIP, y a esa altura ya se le calculó el 21% (ver /api/afip/factura,
    // misma fórmula acá: neto = total/1.21). Una nota de crédito (tipo
    // 'devolucion' facturada) resta, no suma — es lo que ese mismo cálculo
    // hace al pedir el CAE de la NC. OJO: la fecha usada es created_at, no
    // la fecha real de emisión ante AFIP — la tabla `ventas` no tiene una
    // columna de fecha de comprobante separada (ver comentario en
    // /api/afip/factura/route.ts), así que un presupuesto viejo facturado
    // más tarde queda fechado acá con el día que se CARGÓ en el sistema, no
    // el día que efectivamente se facturó. Para la mayoría de los casos
    // (factura poco después de la venta) no cambia el mes; para presupuestos
    // viejos facturados mucho después, sí puede correr el período.
    const ALICUOTA_IVA = 0.21
    const detalleFacturas: { id: string; numero: string | null; nro_cbte_afip: string | null; tipo: string; fecha: string; cliente_nombre: string; total: number; neto: number; iva: number }[] = []
    let ivaDebitoFiscal = 0
    for (const v of ventas) {
      if (!v.facturado) continue
      const neto = parseFloat((v.total / (1 + ALICUOTA_IVA)).toFixed(2))
      const iva = parseFloat((v.total - neto).toFixed(2))
      const signo = v.tipo === 'devolucion' ? -1 : 1
      ivaDebitoFiscal += signo * iva
      detalleFacturas.push({ id: v.id, numero: v.numero, nro_cbte_afip: v.nro_cbte_afip, tipo: v.tipo, fecha: v.created_at, cliente_nombre: v.cliente_nombre, total: signo * v.total, neto: signo * neto, iva: signo * iva })
    }
    detalleFacturas.sort((a, b) => b.fecha.localeCompare(a.fecha))

    // Crédito fiscal: NO se puede calcular solo con los datos de Compras (no
    // queda registrado si una compra discriminó IVA ni cuánto — ver
    // sql/2026-09-iva-credito-manual.sql). Se carga a mano por mes y empresa
    // desde la pestaña IVA; acá solo se suma lo que ya esté cargado para los
    // meses del rango pedido, y se avisa qué meses faltan.
    const mesesEnRango: string[] = []
    if (desde && hasta) {
      const cursor = new Date(Number(desde.slice(0, 4)), Number(desde.slice(5, 7)) - 1, 1)
      const fin = new Date(Number(hasta.slice(0, 4)), Number(hasta.slice(5, 7)) - 1, 1)
      while (cursor <= fin) {
        mesesEnRango.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
        cursor.setMonth(cursor.getMonth() + 1)
      }
    }
    // Si la tabla todavía no existe (falta correr la migración), que no se
    // caiga toda la pestaña Financiero por eso — se degrada mostrando el
    // crédito fiscal en $0 y todos los meses como "sin cargar".
    let creditoRows: { empresa: string; mes: string; monto: number }[] = []
    try {
      creditoRows = await fetchAll<{ empresa: string; mes: string; monto: number }>(
        'iva_credito_manual', 'empresa, mes, monto', q => q.in('empresa', empresas)
      )
    } catch { /* tabla no creada todavía — ver sql/2026-09-iva-credito-manual.sql */ }
    const creditoPorMes = new Map<string, number>() // 'YYYY-MM' -> suma de empresas en alcance
    for (const r of creditoRows) {
      const mes = r.mes.slice(0, 7)
      creditoPorMes.set(mes, (creditoPorMes.get(mes) || 0) + (r.monto || 0))
    }
    const ivaCreditoFiscal = mesesEnRango.reduce((a, m) => a + (creditoPorMes.get(m) || 0), 0)
    const mesesSinCredito = mesesEnRango.filter(m => !creditoPorMes.has(m))
    const ivaNeto = ivaDebitoFiscal - ivaCreditoFiscal

    return NextResponse.json({
      parametros: {
        ultimoMesInflacion: acumulado.ultimoMes,
        mesesCargados: indicesRaw.length,
      },
      kpis: {
        margenNominal,
        costoOportunidadCtaCte,
        costoOportunidadCheques,
        costoOportunidadTotal,
        gananciaReal,
        pctErosion: margenNominal > 0 ? (costoOportunidadTotal / margenNominal) * 100 : 0,
        montoExpuestoActual,
        diasPromedioCobro: sumaMontoCobrado > 0 ? sumaDiasPonderada / sumaMontoCobrado : 0,
      },
      porCliente: Array.from(porCliente.values())
        .filter(c => c.costoOportunidad > 0.5 || c.montoExpuesto > 0.5)
        .sort((a, b) => b.costoOportunidad - a.costoOportunidad),
      porProducto: Array.from(porProducto.values()).sort((a, b) => b.costoOportunidad - a.costoOportunidad),
      porCategoria: Array.from(porCategoria.values()).sort((a, b) => b.costoOportunidad - a.costoOportunidad),
      cheques: chequesDetalle.sort((a, b) => b.costoOportunidad - a.costoOportunidad),
      detalleCreditos: detalleCreditos.sort((a, b) => b.fecha_venta.localeCompare(a.fecha_venta)),
      iva: {
        debitoFiscal: ivaDebitoFiscal,
        creditoFiscal: ivaCreditoFiscal,
        neto: ivaNeto,
        mesesEnRango,
        mesesSinCredito,
        detalleFacturas,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error desconocido' }, { status: 500 })
  }
}
