const WOO_URL = process.env.WOOCOMMERCE_URL!
const WOO_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY!
const WOO_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET!

function getAuthHeader() {
  const credentials = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64')
  return `Basic ${credentials}`
}

export async function wooGetProducts(page = 1, perPage = 100) {
  const url = `${WOO_URL}/wp-json/wc/v3/products?page=${page}&per_page=${perPage}&status=publish`
  const res = await fetch(url, {
    headers: { Authorization: getAuthHeader() },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`WooCommerce error: ${res.status}`)
  return res.json()
}

export async function wooGetAllProducts(): Promise<WooProduct[]> {
  const all: WooProduct[] = []
  let page = 1
  while (page <= 20) {
    const batch: WooProduct[] = await wooGetProducts(page, 100)
    all.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return all
}

export interface WooProduct {
  id: number
  name: string
  sku: string
  regular_price: string
  price: string
  stock_quantity: number | null
  manage_stock: boolean
  status: string
  categories: { id: number; name: string; slug: string }[]
  attributes: { id: number; name: string; options: string[] }[]
  images: { src: string }[]
}

export function mapWooToProducto(woo: WooProduct) {
  const attr = (names: string[]) => {
    for (const name of names) {
      const found = woo.attributes.find(
        a => a.name.toLowerCase() === name.toLowerCase()
      )
      if (found?.options?.[0]) return found.options[0]
    }
    return ''
  }

  const cats = woo.categories.map(c => c.name.toLowerCase())
  let categoria: 'Tinto' | 'Blanco' | 'Rosado' | 'Espumante' | 'Otro' = 'Otro'
  if (cats.some(c => c.includes('tinto'))) categoria = 'Tinto'
  else if (cats.some(c => c.includes('blanco'))) categoria = 'Blanco'
  else if (cats.some(c => c.includes('rosado'))) categoria = 'Rosado'
  else if (cats.some(c => c.includes('espumante') || c.includes('espumoso'))) categoria = 'Espumante'

  return {
    woo_product_id: woo.id,
    nombre: woo.name,
    sku: woo.sku || '',
    bodega: attr(['bodega', 'winery', 'productor', 'producer']),
    varietal: attr(['varietal', 'cepa', 'uva', 'grape', 'tipo']),
    region: attr(['región', 'region', 'origen', 'procedencia']),
    categoria,
    precio_venta: parseFloat(woo.regular_price || woo.price || '0') || 0,
    stock: woo.stock_quantity ?? 0,
  }
}

export async function wooUpdateProduct(
  wooId: number,
  data: { regular_price?: string; stock_quantity?: number; manage_stock?: boolean }
) {
  const url = `${WOO_URL}/wp-json/wc/v3/products/${wooId}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WooCommerce update error: ${res.status} - ${err}`)
  }
  return res.json()
}

export async function wooUpdateStockAndPrice(
  wooId: number,
  precio: number,
  stock: number
) {
  return wooUpdateProduct(wooId, {
    regular_price: precio.toString(),
    stock_quantity: stock,
    manage_stock: true,
  })
}
