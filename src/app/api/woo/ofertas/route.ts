export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

// GET /api/woo/ofertas — productos de la web con precio rebajado (ej. la
// rebaja del 25% en vinos). Solo informa: el precio del sistema sigue siendo
// el de lista; la oferta vive únicamente en la web.
export async function GET() {
  const base = (process.env.WOOCOMMERCE_URL || '').replace(/\/$/, '')
  if (!base || !process.env.WOOCOMMERCE_CONSUMER_KEY) return NextResponse.json([])
  const auth = 'Basic ' + Buffer.from(`${process.env.WOOCOMMERCE_CONSUMER_KEY}:${process.env.WOOCOMMERCE_CONSUMER_SECRET}`).toString('base64')
  const out: { id: number; regular: number; oferta: number }[] = []
  try {
    for (let page = 1; page < 20; page++) {
      const params = new URLSearchParams({ on_sale: 'true', status: 'any', per_page: '100', page: String(page), _fields: 'id,regular_price,sale_price' })
      const res = await fetch(`${base}/wp-json/wc/v3/products?${params}`, { headers: { Authorization: auth }, cache: 'no-store' })
      if (!res.ok) break
      const data: { id: number; regular_price: string; sale_price: string }[] = await res.json()
      for (const d of data) {
        const oferta = parseFloat(d.sale_price || '0')
        if (oferta > 0) out.push({ id: d.id, regular: parseFloat(d.regular_price || '0'), oferta })
      }
      if (data.length < 100) break
    }
  } catch {
    return NextResponse.json(out)
  }
  return NextResponse.json(out)
}
