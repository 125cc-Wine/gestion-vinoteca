export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { procesarColaStockWoo } from '@/lib/woo-stock-cola'

// GET /api/woo/stock-cola — últimos 100 envíos de stock individuales a la
// web (ver src/lib/woo-stock-cola.ts), con nombre del producto, para ver
// qué se mandó y qué falló.
//
// GET /api/woo/stock-cola?desde=<cursor> — lo que se terminó de procesar
// después del cursor (procesado_at). Lo usa el aviso global de la app
// (WebSyncAvisos) para mostrar un cartelito por cada actualización en la
// web. Con desde=inicio devuelve solo el cursor actual, sin items, para no
// mostrar al abrir la app avisos viejos.
export async function GET(req: NextRequest) {
  const desde = req.nextUrl.searchParams.get('desde')

  if (desde) {
    const ultimo = await supabase
      .from('woo_stock_cola')
      .select('procesado_at')
      .not('procesado_at', 'is', null)
      .order('procesado_at', { ascending: false })
      .limit(1)
    if (ultimo.error) return NextResponse.json({ error: ultimo.error.message }, { status: 500 })
    const cursor = ultimo.data?.[0]?.procesado_at ?? new Date(0).toISOString()
    if (desde === 'inicio') return NextResponse.json({ cursor, items: [] })

    const { data, error } = await supabase
      .from('woo_stock_cola')
      .select('id, woo_product_id, delta, estado, error, stock_web_antes, stock_web_despues, procesado_at, productos(nombre)')
      .gt('procesado_at', desde)
      .lte('procesado_at', cursor)
      .in('estado', ['ok', 'error', 'conflicto'])
      .order('procesado_at')
      .limit(200)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ cursor, items: data })
  }

  const { data, error } = await supabase
    .from('woo_stock_cola')
    .select('*, productos(nombre)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/woo/stock-cola — procesa ya lo pendiente (reintento manual).
export async function POST() {
  return NextResponse.json(await procesarColaStockWoo())
}
