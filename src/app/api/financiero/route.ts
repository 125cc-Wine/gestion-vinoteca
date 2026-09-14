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
  id: string; empresa: string; tipo: string; total: number; monto_pagado: number | null
  created_at: string; cliente_id: string | null; cliente_nombre: string
  items: { nombre: string; cantidad: number; subtotal: number; producto_id?: string }[]
  estado_pago: string | null; estado: string
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
      fetchAll<VentaRow>('ventas', 'id, empresa, tipo, total, monto_pagado, created_at, cliente_id, cliente_nombre, items, estado_pago, estado', q => {
        let qq = q.neq('estado', 'cancelado').in('tipo', ['presupuesto', 'remito', 'factura'])
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

    for (const v of ventas) {
      const fechaVenta = new Date(v.created_at)
      const esCredito = ventasACredito.has(v.id)

      // Costo de oportunidad total de ESTA venta (0 si fue de contado).
      let costoVenta = 0
      if (esCredito) {
        const cobros = (cobrosPorVenta.get(v.id) || []).slice().sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
        let cobradoAcum = 0
        for (const c of cobros) {
          cobradoAcum += c.monto
          costoVenta += costoOportunidad(c.monto, fechaVenta, c.fecha, acumulado, hoy)
          const dias = Math.max(0, Math.round((c.fecha.getTime() - fechaVenta.getTime()) / 86400000))
          sumaDiasPonderada += dias * c.monto
          sumaMontoCobrado += c.monto
        }
        const restante = Math.max(0, parseFloat((v.total - cobradoAcum).toFixed(2)))
        if (restante > 0.01) {
          costoVenta += costoOportunidad(restante, fechaVenta, hoy, acumulado, hoy)
          montoExpuestoActual += restante
        }
      }
      costoOportunidadCtaCte += costoVenta

      const clienteKey = v.cliente_id || v.cliente_nombre
      if (!porCliente.has(clienteKey)) porCliente.set(clienteKey, { nombre: v.cliente_nombre, margenNominal: 0, costoOportunidad: 0, montoExpuesto: 0, diasPond: 0, montoCobradoPond: 0 })
      const cli = porCliente.get(clienteKey)!
      cli.costoOportunidad += costoVenta
      if (esCredito) {
        const restante = Math.max(0, v.total - (cobrosPorVenta.get(v.id) || []).reduce((a, c) => a + c.monto, 0))
        cli.montoExpuesto += restante
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
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error desconocido' }, { status: 500 })
  }
}
