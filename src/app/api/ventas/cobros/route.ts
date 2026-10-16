export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { cobrosDeVentas } from '@/lib/cobrosVenta'

// GET ?ids=a,b,c → { [venta_id]: [{ fecha, monto, medio }] }
// Cómo se cobró cada venta, según la caja (ver src/lib/cobrosVenta.ts).
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get('ids') || '').split(',').map(s => s.trim()).filter(Boolean)
  if (ids.length > 500) return NextResponse.json({ error: 'Máximo 500 ventas por consulta' }, { status: 400 })
  return NextResponse.json(await cobrosDeVentas(ids))
}
