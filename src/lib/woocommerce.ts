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
