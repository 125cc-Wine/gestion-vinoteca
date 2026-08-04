export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  const desde   = req.nextUrl.searchParams.get('desde')
  const hasta   = req.nextUrl.searchParams.get('hasta')
  const limitParam = req.nextUrl.searchParams.get('limit')

  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  // "ambas" agrega Aroma + La Vid en un solo reporte — no filtra por empresa.
  const ambas = empresa === 'ambas'

  let q = supabase
    .from('ventas')
    .select('id, numero, tipo, total, created_at, cliente_nombre, vendedor_nombre, items, estado_pago, condicion_venta')
    .neq('estado', 'cancelado')
    .order('created_at', { ascending: true })

  if (!ambas) q = q.eq('empresa', empresa)
  if (desde) q = q.gte('created_at', desde)
  if (hasta) q = q.lte('created_at', hasta + 'T23:59:59')

  const { data: ventas, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Las devoluciones no son ventas — si se incluyen acá, la mercadería
  // devuelta se contaba dos veces: como venta original y como "venta" de
  // la propia devolución (con total y cantidades positivas).
  const list = (ventas || []).filter(v => v.tipo !== 'devolucion')

  // Costo por producto, para calcular margen en el ranking (join en JS
  // porque "items" guarda una copia del producto al momento de la venta,
  // no el costo actual — y de última el costo actual es lo que interesa
  // para saber qué tan rentable es el producto HOY). Los ids de producto
  // son UUID únicos globales, así que sumar ambas empresas al mismo Map
  // no genera colisiones.
  let productosCostoQ = supabase.from('productos').select('id, precio_costo')
  if (!ambas) productosCostoQ = productosCostoQ.eq('empresa', empresa)
  const { data: productosCosto } = await productosCostoQ
  const costoPorId = new Map((productosCosto ?? []).map(p => [p.id, p.precio_costo || 0]))

  // 1. Ventas por día
  const porDia: Record<string, number> = {}
  for (const v of list) {
    const dia = v.created_at.split('T')[0]
    porDia[dia] = (porDia[dia] || 0) + v.total
  }
  const ventasPorDia = Object.entries(porDia).map(([fecha, total]) => ({ fecha, total }))

  // 2. Ranking productos (con margen estimado al costo actual)
  const prodMap: Record<string, { nombre: string; cantidad: number; total: number; margen: number }> = {}
  for (const v of list) {
    for (const item of (v.items as { nombre: string; cantidad: number; subtotal: number; producto_id?: string }[] || [])) {
      const key = item.nombre
      if (!prodMap[key]) prodMap[key] = { nombre: item.nombre, cantidad: 0, total: 0, margen: 0 }
      prodMap[key].cantidad += item.cantidad
      prodMap[key].total   += item.subtotal || 0
      const costo = item.producto_id ? costoPorId.get(item.producto_id) : undefined
      if (costo != null) prodMap[key].margen += (item.subtotal || 0) - costo * item.cantidad
    }
  }
  // limit=0 (o "all") devuelve el ranking completo, sin techo.
  const limit = limitParam === 'all' || limitParam === '0' ? undefined : Number(limitParam) || 20
  const rankingCompleto = Object.values(prodMap).sort((a, b) => b.total - a.total)
  const rankingProductos = limit ? rankingCompleto.slice(0, limit) : rankingCompleto

  // 3. Ventas por vendedor
  const vendMap: Record<string, { nombre: string; ventas: number; total: number }> = {}
  for (const v of list) {
    const key = v.vendedor_nombre || 'Sin asignar'
    if (!vendMap[key]) vendMap[key] = { nombre: key, ventas: 0, total: 0 }
    vendMap[key].ventas += 1
    vendMap[key].total  += v.total
  }
  const porVendedor = Object.values(vendMap).sort((a, b) => b.total - a.total)

  // 4. Resumen por condición de pago
  const condMap: Record<string, { condicion: string; ventas: number; total: number }> = {}
  for (const v of list) {
    const key = v.estado_pago === 'cuenta_corriente' ? 'Cta. Corriente'
              : v.estado_pago === 'pendiente'         ? 'Pendiente'
              : v.condicion_venta || 'Contado'
    if (!condMap[key]) condMap[key] = { condicion: key, ventas: 0, total: 0 }
    condMap[key].ventas += 1
    condMap[key].total  += v.total
  }
  const porCondicion = Object.values(condMap).sort((a, b) => b.total - a.total)

  // KPIs
  const totalVentas   = list.reduce((a, v) => a + v.total, 0)
  const cantVentas    = list.length
  const ticketPromedio = cantVentas ? totalVentas / cantVentas : 0
  // Facturado vs. efectivamente cobrado en el período — antes el reporte
  // solo mostraba lo facturado, sin distinguir cuánto de eso ya se cobró.
  const cobrado        = list.filter(v => v.estado_pago === 'pagado').reduce((a, v) => a + v.total, 0)
  const pendienteCobro  = totalVentas - cobrado
  const margenTotal     = Object.values(prodMap).reduce((a, p) => a + p.margen, 0)

  return NextResponse.json({
    kpis: { totalVentas, cantVentas, ticketPromedio, cobrado, pendienteCobro, margenTotal },
    ventasPorDia,
    rankingProductos,
    porVendedor,
    porCondicion,
  })
}
