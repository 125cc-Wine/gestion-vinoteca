const WOO_URL = process.env.WOOCOMMERCE_URL!
const WOO_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY!
const WOO_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET!

function wooUrl(path: string, extra: Record<string, string | number> = {}) {
  const params = new URLSearchParams({
    consumer_key: WOO_KEY,
    consumer_secret: WOO_SECRET,
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])),
  })
  return `${WOO_URL}/wp-json/wc/v3/${path}?${params}`
}

export async function wooGetProducts(page = 1, perPage = 100) {
  const url = wooUrl('products', { page, per_page: perPage, status: 'publish' })
  const res = await fetch(url, { cache: 'no-store' })
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

// Abreviaturas que significan lo mismo escritas de dos formas. Se expanden a
// nivel token en ambos lados (web y Supabase) antes de comparar, para que
// "Rva" y "Reserva" matcheen. Agregar acá nuevos casos que aparezcan.
const ABREVIATURAS: Record<string, string> = {
  rva: 'reserva',
  rsva: 'reserva',
  res: 'reserva',
}

// Normaliza un nombre para poder comparar productos entre Supabase y
// WooCommerce ignorando acentos, mayúsculas, espacios dobles, signos y
// abreviaturas conocidas (Rva = Reserva).
// "Alta-Yarí Rva Chardonnay" y "Alta Yari Reserva Chardonnay" matchean.
export function normalizarNombre(s: string): string {
  return (s || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '') // saca acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(t => ABREVIATURAS[t] ?? t)
    .filter(Boolean)
    .join(' ')
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
  const url = wooUrl(`products/${wooId}`)
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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
