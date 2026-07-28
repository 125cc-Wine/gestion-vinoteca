// Lista los productos publicados en aromadevid.com.ar sin ninguna imagen
// cargada. Usa la Store API pública de WooCommerce (no necesita credenciales).

const BASE = 'https://aromadevid.com.ar/wp-json/wc/store/v1/products'

async function getAll() {
  const all = []
  let page = 1
  while (page <= 50) {
    const res = await fetch(`${BASE}?per_page=100&page=${page}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    const batch = await res.json()
    all.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return all
}

const productos = await getAll()
console.log(`Total publicados: ${productos.length}`)

const categorias = new Set()
for (const p of productos) for (const c of p.categories || []) categorias.add(c.name)
console.log('Categorías encontradas:', [...categorias].join(' | '))

const esVino = p => (p.categories || []).some(c => /vino/i.test(c.name))
const sinImagen = productos.filter(p => (!p.images || p.images.length === 0))
const vinosSinImagen = sinImagen.filter(esVino)
const otrosSinImagen = sinImagen.filter(p => !esVino(p))

console.log(`\nSin imagen (categoría Vino): ${vinosSinImagen.length}`)
for (const p of vinosSinImagen) console.log(`  ${p.name}`)

console.log(`\nSin imagen (otras categorías, no vino): ${otrosSinImagen.length}`)
for (const p of otrosSinImagen) {
  const cats = (p.categories || []).map(c => c.name).join(', ')
  console.log(`  ${p.name}  [${cats}]`)
}
