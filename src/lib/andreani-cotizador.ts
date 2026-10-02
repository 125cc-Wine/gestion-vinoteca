// Cotizador de envíos Andreani con la TARIFA ACTUAL de la cuenta.
//
// La tarifa negociada vive en el plugin nuevo de la web ("Andreani Envíos"),
// que no expone una API: solo cotiza dentro del carrito de WooCommerce. Así
// que acá se simula un carrito en la web (Store API, sin loguearse): se
// agregan N botellas de vinos con stock y medida estándar (1,3 kg, 8×8×32),
// se pone el código postal y se leen las tarifas que devuelve Andreani. No
// crea pedidos ni toca stock; el carrito queda abandonado y vence solo.
//
// La API vieja de Andreani (credenciales del plugin desactivado) cotiza con
// la tarifa ANTERIOR, por eso no se usa.
//
// Si el envío gratis del plugin está activo, Andreani devuelve $0 para
// carritos grandes y no se ve el costo: se avisa con `gratis: true`.

const BASE = () => (process.env.WOOCOMMERCE_URL || '').replace(/\/$/, '')
const AUTH = () => 'Basic ' + Buffer.from(`${process.env.WOOCOMMERCE_CONSUMER_KEY}:${process.env.WOOCOMMERCE_CONSUMER_SECRET}`).toString('base64')

interface Referencia { id: number; nombre: string; stock: number; precio: number }
let cacheRefs: { at: number; refs: Referencia[] } | null = null

// Vinos publicados con stock y medida de botella estándar, de mayor a menor stock.
async function referencias(): Promise<Referencia[]> {
  if (cacheRefs && Date.now() - cacheRefs.at < 10 * 60_000) return cacheRefs.refs
  const params = new URLSearchParams({
    status: 'publish', stock_status: 'instock', per_page: '100', orderby: 'popularity',
    _fields: 'id,name,weight,dimensions,stock_quantity,price,type',
  })
  const res = await fetch(`${BASE()}/wp-json/wc/v3/products?${params}`, { headers: { Authorization: AUTH() }, cache: 'no-store' })
  if (!res.ok) throw new Error(`No se pudo leer el catálogo web (${res.status})`)
  const data: { id: number; name: string; weight: string; dimensions: { length: string; width: string; height: string }; stock_quantity: number | null; price: string; type: string }[] = await res.json()
  const refs = data
    .filter(p => p.type === 'simple' && p.weight === '1.3' && p.dimensions?.height === '32' && (p.stock_quantity ?? 0) > 0 && Number(p.price) > 0)
    .map(p => ({ id: p.id, nombre: p.name, stock: p.stock_quantity ?? 0, precio: Number(p.price) }))
    .sort((a, b) => b.stock - a.stock)
  cacheRefs = { at: Date.now(), refs }
  return refs
}

export interface TarifaEnvio { servicio: string; precio: number; gratis: boolean }
export interface Cotizacion { cp: string; botellas: number; valorDeclarado: number; tarifas: TarifaEnvio[] }

export async function cotizarEnvio(cp: string, botellas: number): Promise<Cotizacion> {
  const refs = await referencias()
  const disponibles = refs.reduce((a, r) => a + r.stock, 0)
  if (botellas > disponibles) throw new Error(`Solo se pueden simular hasta ${disponibles} botellas`)

  const store = `${BASE()}/wp-json/wc/store/v1`
  const inicio = await fetch(`${store}/cart`, { cache: 'no-store' })
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Nonce: inicio.headers.get('nonce') ?? '',
    'Cart-Token': inicio.headers.get('cart-token') ?? '',
  }

  // Repartir las botellas entre los vinos con más stock.
  let faltan = botellas
  for (const r of refs) {
    if (faltan <= 0) break
    const cant = Math.min(faltan, r.stock)
    const add = await fetch(`${store}/cart/add-item`, { method: 'POST', headers, body: JSON.stringify({ id: r.id, quantity: cant }) })
    if (add.ok) faltan -= cant
  }
  if (faltan > 0) throw new Error('No se pudo armar el carrito de prueba')

  const res = await fetch(`${store}/cart/update-customer`, {
    method: 'POST', headers,
    body: JSON.stringify({ shipping_address: { country: 'AR', postcode: cp } }),
  })
  const carrito = await res.json()
  if (!res.ok) throw new Error(carrito?.message || `La web no cotizó (${res.status})`)

  const mu: number = carrito.totals?.currency_minor_unit ?? 0
  const decode = (s: string) => s.replace(/&#8211;/g, '–').replace(/&amp;/g, '&')
  const tarifas: TarifaEnvio[] = (carrito.shipping_rates ?? [])
    .flatMap((p: { shipping_rates: { name: string; price: string; method_id: string }[] }) => p.shipping_rates)
    .filter((t: { method_id: string }) => /andreani/i.test(t.method_id))
    .map((t: { name: string; price: string }) => {
      const nombre = decode(t.name)
      return {
        servicio: nombre.replace(/^Andreani\s*/i, '').replace(/\s*–\s*¡Envío gratis!/i, '').replace(/[()]/g, '').trim() || nombre,
        precio: Number(t.price) / 10 ** mu,
        gratis: /gratis/i.test(nombre),
      }
    })

  return { cp, botellas, valorDeclarado: Number(carrito.totals?.total_items ?? 0) / 10 ** mu, tarifas }
}
