// Trae TODOS los productos publicados vía REST v3 (con auth), detecta huecos
// (sin descripción, sin imagen, sin tags) y guarda:
//  - scripts/_data_woo_products_full.json  (todos los productos, campos relevantes)
//  - scripts/_data_woo_gaps.json           (solo los que tienen algún hueco, priorizados)
//  - scripts/_data_woo_tags.json           (todos los tags existentes en la tienda)
import { loadWooEnv } from './_woo_env.mjs'
import fs from 'fs'

const { url, authHeader } = loadWooEnv()

async function fetchAllProducts() {
  const all = []
  let page = 1
  while (true) {
    const res = await fetch(`${url}/wp-json/wc/v3/products?per_page=100&page=${page}&status=publish`, {
      headers: { Authorization: authHeader },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    const batch = await res.json()
    if (batch.length === 0) break
    all.push(...batch)
    console.log(`  page ${page}: +${batch.length} (total ${all.length})`)
    if (batch.length < 100) break
    page++
  }
  return all
}

async function fetchAllTags() {
  const all = []
  let page = 1
  while (true) {
    const res = await fetch(`${url}/wp-json/wc/v3/products/tags?per_page=100&page=${page}`, {
      headers: { Authorization: authHeader },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    const batch = await res.json()
    if (batch.length === 0) break
    all.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return all
}

console.log('Descargando productos...')
const products = await fetchAllProducts()
console.log(`Total productos publicados: ${products.length}`)

console.log('Descargando tags...')
const tags = await fetchAllTags()
console.log(`Total tags existentes: ${tags.length}`)

const stripHtml = (s) => (s || '').replace(/<[^>]*>/g, '').trim()

const slim = products.map(p => ({
  id: p.id,
  name: p.name,
  sku: p.sku,
  permalink: p.permalink,
  description: stripHtml(p.description),
  short_description: stripHtml(p.short_description),
  images: (p.images || []).map(i => i.src),
  tags: (p.tags || []).map(t => ({ id: t.id, name: t.name })),
  categories: (p.categories || []).map(c => c.name),
  stock_status: p.stock_status,
  stock_quantity: p.stock_quantity,
  price: p.price,
}))

fs.writeFileSync('scripts/_data_woo_products_full.json', JSON.stringify(slim, null, 2))
fs.writeFileSync('scripts/_data_woo_tags.json', JSON.stringify(tags.map(t => ({ id: t.id, name: t.name, slug: t.slug, count: t.count })), null, 2))

const gaps = slim
  .map(p => {
    const missing = []
    if (!p.description || p.description.length < 5) missing.push('description')
    if (!p.images || p.images.length === 0) missing.push('images')
    if (!p.tags || p.tags.length === 0) missing.push('tags')
    return { ...p, missing }
  })
  .filter(p => p.missing.length > 0)

// priorizar vendibles hoy
gaps.sort((a, b) => {
  const aSell = a.stock_status === 'instock' || (a.stock_quantity ?? 0) > 0
  const bSell = b.stock_status === 'instock' || (b.stock_quantity ?? 0) > 0
  if (aSell === bSell) return 0
  return aSell ? -1 : 1
})

fs.writeFileSync('scripts/_data_woo_gaps.json', JSON.stringify(gaps, null, 2))

console.log(`\nProductos con algún hueco: ${gaps.length}`)
console.log(`  sin description: ${gaps.filter(p => p.missing.includes('description')).length}`)
console.log(`  sin images: ${gaps.filter(p => p.missing.includes('images')).length}`)
console.log(`  sin tags: ${gaps.filter(p => p.missing.includes('tags')).length}`)
console.log(`  vendibles hoy (instock/stock>0) con hueco: ${gaps.filter(p => p.stock_status === 'instock' || (p.stock_quantity ?? 0) > 0).length}`)
