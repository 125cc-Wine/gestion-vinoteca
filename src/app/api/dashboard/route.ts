export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  const hoy = new Date().toISOString().split('T')[0]
  const inicioMes = hoy.substring(0, 7) + '-01'

  const hace30dias = new Date()
  hace30dias.setDate(hace30dias.getDate() - 30)
  const hace30diasStr = hace30dias.toISOString().split('T')[0]

  const [
    { data: productos },
    { data: ventasHoy },
    { data: ventasMes },
    { data: cajaHoy },
    { data: clientes },
    { data: vencidos },
    { data: pedidosPendientes },
  ] = await Promise.all([
    supabase.from('productos').select('id,nombre,bodega,stock,stock_minimo,precio_venta').eq('empresa', empresa).eq('activo', true),
    supabase.from('ventas').select('*').eq('empresa', empresa).gte('created_at', hoy).neq('estado', 'cancelado'),
    supabase.from('ventas').select('*').eq('empresa', empresa).gte('created_at', inicioMes).neq('estado', 'cancelado'),
    supabase.from('movimientos_caja').select('*').eq('empresa', empresa).eq('fecha', hoy),
    supabase.from('clientes').select('id,nombre,saldo').eq('activo', true),
    supabase.from('ventas').select('id,numero,cliente_nombre,total,created_at').eq('empresa', empresa).eq('estado_pago', 'pendiente').lte('created_at', hace30diasStr + 'T00:00:00'),
    supabase.from('pedidos').select('id,numero,cliente_nombre').eq('empresa', empresa).eq('estado', 'pendiente'),
  ])

  // Stock alerts
  const sinStock = (productos || []).filter(p => p.stock === 0)
  const stockBajo = (productos || []).filter(p => p.stock > 0 && p.stock <= p.stock_minimo)

  // Ventas hoy
  const totalVentasHoy = (ventasHoy || []).reduce((a, v) => a + v.total, 0)
  const cantVentasHoy = (ventasHoy || []).length

  // Ventas mes
  const totalVentasMes = (ventasMes || []).reduce((a, v) => a + v.total, 0)

  // Por vendedor hoy
  const porVendedor: Record<string, { nombre: string; total: number; cantidad: number }> = {}
  for (const v of ventasMes || []) {
    const key = v.vendedor_nombre || 'Sin asignar'
    if (!porVendedor[key]) porVendedor[key] = { nombre: key, total: 0, cantidad: 0 }
    porVendedor[key].total += v.total
    porVendedor[key].cantidad++
  }

  // Caja hoy
  const ingresosHoy = (cajaHoy || []).filter(m => m.tipo === 'ingreso' && m.categoria !== 'Apertura de caja').reduce((a, m) => a + m.monto, 0)
  const egresosHoy = (cajaHoy || []).filter(m => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0)
  const saldoCaja = ingresosHoy - egresosHoy

  // Clientes con saldo
  const clientesConSaldo = (clientes || []).filter(c => c.saldo > 0)
  const totalCuentasCorrientes = clientesConSaldo.reduce((a, c) => a + c.saldo, 0)

  // Top productos vendidos este mes
  const topProductos: Record<string, { nombre: string; cantidad: number; total: number }> = {}
  for (const v of ventasMes || []) {
    for (const item of (v.items || []) as { nombre: string; cantidad: number; subtotal: number }[]) {
      const key = item.nombre
      if (!topProductos[key]) topProductos[key] = { nombre: key, cantidad: 0, total: 0 }
      topProductos[key].cantidad += item.cantidad
      topProductos[key].total += item.subtotal
    }
  }
  const topProductosArr = Object.values(topProductos).sort((a, b) => b.total - a.total).slice(0, 5)

  return NextResponse.json({
    alertas: {
      sinStock: sinStock.slice(0, 10),
      stockBajo: stockBajo.slice(0, 10),
      vencidos: (vencidos || []).slice(0, 5),
      pedidosPendientes: (pedidosPendientes || []).length,
    },
    ventasHoy: { total: totalVentasHoy, cantidad: cantVentasHoy },
    ventasMes: { total: totalVentasMes, cantidad: (ventasMes || []).length },
    caja: { ingresos: ingresosHoy, egresos: egresosHoy, saldo: saldoCaja },
    vendedores: Object.values(porVendedor).sort((a, b) => b.total - a.total),
    cuentasCorrientes: { cantidad: clientesConSaldo.length, total: totalCuentasCorrientes },
    topProductos: topProductosArr,
  })
}
