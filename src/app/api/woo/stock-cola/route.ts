export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { procesarColaStockWoo } from '@/lib/woo-stock-cola'

// GET /api/woo/stock-cola — últimos 100 envíos de stock individuales a la
// web (ver src/lib/woo-stock-cola.ts), con nombre del producto, para ver
// qué se mandó y qué falló.
export async function GET() {
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
