import { loadWooEnv } from './_woo_env.mjs'
import fs from 'fs'

const { url, authHeader } = loadWooEnv()

async function main() {
  let all = []
  let page = 1
  while (true) {
    const res = await fetch(`${url}/wp-json/wc/v3/products?per_page=100&page=${page}&status=any`, {
      headers: { Authorization: authHeader },
    })
    if (!res.ok) throw new Error(`page ${page}: ${res.status} ${await res.text()}`)
    const data = await res.json()
    if (!data.length) break
    all = all.concat(data.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      price: p.regular_price || p.price,
      permalink: p.permalink,
      categories: (p.categories || []).map(c => c.name),
      images: (p.images || []).map(i => i.src),
    })))
    console.log(`page ${page}: +${data.length} (total ${all.length})`)
    if (data.length < 100) break
    page++
  }
  fs.writeFileSync('scripts/_tanda2_woo_full.json', JSON.stringify(all, null, 2))
  console.log('Guardado', all.length, 'productos en scripts/_tanda2_woo_full.json')
}

main().catch(e => { console.error(e); process.exit(1) })
