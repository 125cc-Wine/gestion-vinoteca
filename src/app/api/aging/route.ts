export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function diffDays(from: string): number {
  const now = Date.now()
  const then = new Date(from).getTime()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  // 1. Ventas pendientes en cuenta corriente (presupuesto, remito y factura)
  //    NO filtramos por clientes.saldo — usamos las ventas como fuente de verdad
  const { data: ventas, error: errVentas } = await supabase
    .from('ventas')
    .select('id, numero, cliente_id, cliente_nombre, total, created_at, tipo')
    .eq('empresa', empresa)
    .in('tipo', ['presupuesto', 'remito', 'factura'])
    .eq('estado_pago', 'cuenta_corriente')
    .neq('estado', 'cancelado')
    .order('created_at', { ascending: false })

  if (errVentas) return NextResponse.json({ error: errVentas.message }, { status: 500 })
  if (!ventas || ventas.length === 0) return NextResponse.json([])

  // 2. Devoluciones pendientes de netear (tipo='devolucion', mismo cliente)
  const clienteIdsConVentas = Array.from(new Set(ventas.map(v => v.cliente_id)))
  const { data: devoluciones } = await supabase
    .from('ventas')
    .select('id, cliente_id, total')
    .eq('empresa', empresa)
    .eq('tipo', 'devolucion')
    .neq('estado', 'cancelado')
    .in('cliente_id', clienteIdsConVentas)

  // monto devuelto por cliente
  const devPorCliente: Record<string, number> = {}
  for (const d of (devoluciones ?? [])) {
    const key = d.cliente_id || '__sin_cliente__'
    devPorCliente[key] = (devPorCliente[key] || 0) + Math.abs(d.total || 0)
  }

  // 3. Datos de contacto de los clientes
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, telefono')
    .in('id', clienteIdsConVentas)

  const telPorCliente: Record<string, string | null> = {}
  for (const c of (clientes ?? [])) telPorCliente[c.id] = c.telefono

  // 4. Agrupar por cliente y calcular buckets
  //    Ojo: v.cliente_id puede ser null (venta a "Consumidor Final" sin
  //    cliente asignado). Usar ese valor directo como clave de objeto lo
  //    convierte en el string "null" — después el frontend mandaba
  //    cliente_id=null a /api/ventas y la búsqueda nunca encontraba nada
  //    (comparaba contra el texto "null", no contra un cliente_id vacío).
  //    Por eso agrupamos con una clave interna separada y devolvemos el
  //    cliente_id real (string o null) en la respuesta.
  type VentaItem = { id: string; numero?: string; total: number; created_at: string; dias: number; tipo: string }
  const SIN_CLIENTE = '__sin_cliente__'
  const ventasPorCliente: Record<string, { nombre: string; items: VentaItem[]; clienteId: string | null }> = {}

  for (const v of ventas) {
    const key = v.cliente_id || SIN_CLIENTE
    if (!ventasPorCliente[key]) {
      ventasPorCliente[key] = { nombre: v.cliente_nombre, items: [], clienteId: v.cliente_id }
    }
    ventasPorCliente[key].items.push({
      id: v.id,
      numero: v.numero,
      total: v.total,
      created_at: v.created_at,
      dias: diffDays(v.created_at),
      tipo: v.tipo,
    })
  }

  // 5. Construir resultado — saldo_total calculado desde ventas, no desde clientes.saldo
  const result = Object.values(ventasPorCliente).map(({ nombre, items, clienteId }) => {
    let bucket_30 = 0
    let bucket_60 = 0
    let bucket_90 = 0
    let bucket_mas90 = 0
    let dias_maximo = 0
    let ultima_compra: string | null = null

    for (const v of items) {
      if (v.dias <= 30) bucket_30 += v.total
      else if (v.dias <= 60) bucket_60 += v.total
      else if (v.dias <= 90) bucket_90 += v.total
      else bucket_mas90 += v.total

      if (v.dias > dias_maximo) dias_maximo = v.dias
      if (!ultima_compra || v.created_at > ultima_compra) ultima_compra = v.created_at
    }

    // Netear devoluciones del bucket más antiguo con saldo
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
    if (saldo_total <= 0) return null  // neteo total, ya no debe nada

    return {
      cliente_id: clienteId,
      cliente_nombre: nombre,
      telefono: clienteId ? (telPorCliente[clienteId] ?? null) : null,
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
}
