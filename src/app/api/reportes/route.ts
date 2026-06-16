export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  const desde   = req.nextUrl.searchParams.get('desde')
  const hasta   = req.nextUrl.searchParams.get('hasta')

  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  let q = supabase
    .from('ventas')
    .select('id, numero, tipo, total, created_at, cliente_nombre, vendedor_nombre, items, estado_pago, condicion_venta')
    .eq('empresa', empresa)
    .neq('estado', 'cancelado')
    .order('created_at', { ascending: true })

  if (desde) q = q.gte('created_at', desde)
  if (hasta) q = q.lte('created_at', hasta + 'T23:59:59')

  const { data: ventas, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const list = ventas || []

  // 1. Ventas por día
  const porDia: Record<string, number> = {}
  for (const v of list) {
    const dia = v.created_at.split('T')[0]
    porDia[dia] = (porDia[dia] || 0) + v.total
  }
  const ventasPorDia = Object.entries(porDia).map(([fecha, total]) => ({ fecha, total }))

  // 2. Ranking productos
  const prodMap: Record<string, { nombre: string; cantidad: number; total: number }> = {}
  for (const v of list) {
    for (const item of (v.items as { nombre: string; cantidad: number; subtotal: number }[] || [])) {
      const key = item.nombre
      if (!prodMap[key]) prodMap[key] = { nombre: item.nombre, cantidad: 0, total: 0 }
      prodMap[key].cantidad += item.cantidad
      prodMap[key].total   += item.subtotal || 0
    }
  }
  const rankingProductos = Object.values(prodMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)

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

  return NextResponse.json({
    kpis: { totalVentas, cantVentas, ticketPromedio },
    ventasPorDia,
    rankingProductos,
    porVendedor,
    porCondicion,
  })
}
