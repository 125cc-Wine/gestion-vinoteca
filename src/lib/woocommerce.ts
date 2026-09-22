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
  reserve: 'reserva',   // ingles vs español (Trivento usa "Reserve" en la web)
  cab: 'cabernet',
  sauv: 'sauvignon',
  esp: 'espumante',
  bco: 'blanco',
  tto: 'tinto',
}

// Normaliza un nombre para poder comparar productos entre Supabase y
// WooCommerce ignorando acentos, mayúsculas, espacios dobles, signos y
// abreviaturas conocidas (Rva = Reserva).
// "Alta-Yarí Rva Chardonnay" y "Alta Yari Reserva Chardonnay" matchean.
export function normalizarNombre(s: string): string {
  return (s || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '') // saca acentos
    .toLowerCase()
    .replace(/&/g, ' y ')                     // "Costa & Pampa" == "Costa y Pampa"
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(t => ABREVIATURAS[t] ?? t)
    .filter(Boolean)
    .join(' ')
}

// Clave de matcheo INDEPENDIENTE DEL ORDEN de las palabras. Ordena los tokens
// alfabéticamente, así "Trivento Golden Reserve Malbec" y "Trivento Malbec
// Golden Rva" caen en la misma clave. Se usa solo para comparar, no para
// mostrar. El nombre lindo se sigue tomando de normalizarNombre / el original.
export function claveMatch(s: string): string {
  return normalizarNombre(s).split(' ').filter(Boolean).sort().join(' ')
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

export interface WooEstado { stock: number; precio: number }

// Trae precio y stock ACTUALES en la web de los ids pedidos, en tandas de
// 100 (filtro "include") en paralelo y pidiendo solo esos campos
// (_fields). Traer el catalogo completo con wooGetAllProducts tarda >70s
// con ~1100 productos (cada producto viene con descripcion, imagenes,
// atributos...) y eso superaba el limite de la funcion en Vercel: el
// boton "Sync Precio" fallaba en la vista previa. Asi tarda unos segundos.
// Ids que no vuelven (producto borrado en la web) no aparecen en el mapa.
export async function wooGetEstadoPorId(ids: number[]): Promise<Map<number, WooEstado>> {
  const mapa = new Map<number, WooEstado>()
  const tandas: number[][] = []
  for (let i = 0; i < ids.length; i += 100) tandas.push(ids.slice(i, i + 100))
  const CONCURRENCIA = 4
  for (let i = 0; i < tandas.length; i += CONCURRENCIA) {
    await Promise.all(tandas.slice(i, i + CONCURRENCIA).map(async tanda => {
      const url = wooUrl('products', {
        include: tanda.join(','),
        per_page: tanda.length,
        status: 'any',
        _fields: 'id,regular_price,price,stock_quantity',
      })
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`WooCommerce error: ${res.status}`)
      const data: { id: number; regular_price: string; price: string; stock_quantity: number | null }[] = await res.json()
      for (const d of data) {
        mapa.set(d.id, {
          stock: d.stock_quantity ?? 0,
          precio: parseFloat(d.regular_price || d.price || '0') || 0,
        })
      }
    }))
  }
  return mapa
}

export interface WooBatchItem {
  id: number
  regular_price?: string
  stock_quantity?: number
  manage_stock?: boolean
}

export interface WooBatchResultItem {
  id: number
  error?: { code: string; message: string }
}

// Actualiza varios productos en UN solo pedido a WooCommerce, en vez de un
// PUT por producto. El endpoint /products/batch de WooCommerce acepta hasta
// 100 items por llamada (limite propio de WooCommerce, WOOCOMMERCE_MAX_
// _BATCH_ITEMS) y hace las escrituras del lado del servidor de WordPress,
// asi que 100 productos salen en UN round-trip HTTP en vez de 100. Esto es
// lo que hace viable sincronizar catalogos grandes (1000+ productos) sin
// que la funcion serverless que lo llama se quede sincronizando uno por uno
// hasta que el hosting corte la conexion a mitad de camino (ver historia:
// antes de esto, "Sync precios" hacia 1 request por producto y con >1000
// productos superaba largamente cualquier timeout de funcion serverless,
// sin ningun aviso de hasta donde habia llegado).
export async function wooUpdateProductsBatch(items: WooBatchItem[]): Promise<WooBatchResultItem[]> {
  if (items.length === 0) return []
  const url = wooUrl('products/batch')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ update: items }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WooCommerce batch error: ${res.status} - ${err}`)
  }
  const data = await res.json()
  return data.update ?? []
}
