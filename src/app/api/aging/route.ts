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

  // 1. Clientes con saldo > 0
  const { data: clientes, error: errClientes } = await supabase
    .from('clientes')
    .select('id, nombre, telefono, saldo')
    .gt('saldo', 0)
    .order('nombre')

  if (errClientes) return NextResponse.json({ error: errClientes.message }, { status: 500 })
  if (!clientes || clientes.length === 0) return NextResponse.json([])

  const clienteIds = clientes.map((c: { id: string }) => c.id)

  // 2. Ventas (remitos) en cuenta corriente de esta empresa
  const { data: ventas, error: errVentas } = await supabase
    .from('ventas')
    .select('id, cliente_id, cliente_nombre, total, created_at')
    .eq('empresa', empresa)
    .eq('tipo', 'remito')
    .eq('estado_pago', 'cuenta_corriente')
    .in('cliente_id', clienteIds)
    .order('created_at', { ascending: false })

  if (errVentas) return NextResponse.json({ error: errVentas.message }, { status: 500 })

  // 3. Agrupar ventas por cliente y calcular buckets
  const ventasPorCliente: Record<string, { id: string; total: number; created_at: string; dias: number }[]> = {}
  for (const v of (ventas ?? [])) {
    if (!ventasPorCliente[v.cliente_id]) ventasPorCliente[v.cliente_id] = []
    ventasPorCliente[v.cliente_id].push({
      id: v.id,
      total: v.total,
      created_at: v.created_at,
      dias: diffDays(v.created_at),
    })
  }

  // 4. Construir resultado
  const result = clientes
    .map((c: { id: string; nombre: string; telefono: string | null; saldo: number }) => {
      const items = ventasPorCliente[c.id] ?? []

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

      return {
        cliente_id: c.id,
        cliente_nombre: c.nombre,
        telefono: c.telefono,
        saldo_total: c.saldo,
        bucket_30,
        bucket_60,
        bucket_90,
        bucket_mas90,
        dias_maximo,
        ultima_compra,
      }
    })
    // Ordenar: más vencidos primero
    .sort((a, b) => b.dias_maximo - a.dias_maximo)

  return NextResponse.json(result)
}
