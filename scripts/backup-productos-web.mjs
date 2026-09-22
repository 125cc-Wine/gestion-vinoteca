// Backup de productos (Supabase) y del catálogo de la web (WooCommerce).
// Uso: node scripts/backup-productos-web.mjs
// Genera backups/AAAA-MM-DD_HHMM/ con:
//   productos.json / productos.csv        todas las filas (activas e inactivas, ambas empresas)
//   web_productos.json / web_productos.csv todos los productos de la web (publicados, borradores, privados, papelera)
//   web_categorias.json / web_etiquetas.json
// Solo lectura: no modifica nada.
import fs from 'fs'
import path from 'path'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
  .filter(l => /^[A-Z_]+=/.test(l)).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')] }))

const ahora = new Date()
const pad = n => String(n).padStart(2, '0')
const dir = path.join('backups', `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}_${pad(ahora.getHours())}${pad(ahora.getMinutes())}`)
fs.mkdirSync(dir, { recursive: true })

function csv(filas, columnas) {
  const esc = v => {
    if (v == null) return ''
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // BOM para que Excel abra bien los acentos
  return '﻿' + [columnas.join(','), ...filas.map(f => columnas.map(c => esc(f[c])).join(','))].join('\n')
}

// --- Supabase: productos (paginado, el REST corta en 1000) ---
const H = { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
const productos = []
for (let desde = 0; ; desde += 1000) {
  const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/productos?select=*&order=empresa,nombre,id&offset=${desde}&limit=1000`, { headers: H })
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`)
  const lote = await r.json()
  productos.push(...lote)
  if (lote.length < 1000) break
}
fs.writeFileSync(path.join(dir, 'productos.json'), JSON.stringify(productos, null, 1))
fs.writeFileSync(path.join(dir, 'productos.csv'), csv(productos, Object.keys(productos[0] ?? {})))
console.log(`productos: ${productos.length} filas`)

// --- WooCommerce ---
const W = (p, x = {}) => `${env.WOOCOMMERCE_URL}/wp-json/wc/v3/${p}?${new URLSearchParams({ consumer_key: env.WOOCOMMERCE_CONSUMER_KEY, consumer_secret: env.WOOCOMMERCE_CONSUMER_SECRET, ...x })}`
async function todas(recurso, extra = {}) {
  const primera = await fetch(W(recurso, { per_page: 100, page: 1, ...extra }))
  if (!primera.ok) throw new Error(`Woo ${recurso} ${primera.status}`)
  const paginas = Number(primera.headers.get('x-wp-totalpages') || 1)
  const res = [...await primera.json()]
  const resto = Array.from({ length: paginas - 1 }, (_, i) => i + 2)
  for (let i = 0; i < resto.length; i += 4) {
    const lotes = await Promise.all(resto.slice(i, i + 4).map(async page => {
      const r = await fetch(W(recurso, { per_page: 100, page, ...extra }))
      if (!r.ok) throw new Error(`Woo ${recurso} p${page} ${r.status}`)
      return r.json()
    }))
    lotes.forEach(l => res.push(...l))
  }
  return res
}

const web = [...await todas('products', { status: 'any' }), ...await todas('products', { status: 'trash' })]
fs.writeFileSync(path.join(dir, 'web_productos.json'), JSON.stringify(web, null, 1))
const webPlano = web.map(p => ({
  id: p.id, nombre: p.name, slug: p.slug, estado: p.status, sku: p.sku, precio: p.regular_price, precio_oferta: p.sale_price,
  stock: p.stock_quantity, stock_estado: p.stock_status, categorias: p.categories.map(c => c.name).join(' | '),
  etiquetas: p.tags.map(t => t.name).join(' | '), imagenes: p.images.map(i => i.src).join(' | '),
  peso: p.weight, permalink: p.permalink, modificado: p.date_modified,
}))
fs.writeFileSync(path.join(dir, 'web_productos.csv'), csv(webPlano, Object.keys(webPlano[0] ?? {})))
console.log(`web productos: ${web.length}`)

const cats = await todas('products/categories')
fs.writeFileSync(path.join(dir, 'web_categorias.json'), JSON.stringify(cats, null, 1))
const tags = await todas('products/tags')
fs.writeFileSync(path.join(dir, 'web_etiquetas.json'), JSON.stringify(tags, null, 1))
console.log(`web categorías: ${cats.length}, etiquetas: ${tags.length}`)
console.log(`\nBackup en ${path.resolve(dir)}`)
