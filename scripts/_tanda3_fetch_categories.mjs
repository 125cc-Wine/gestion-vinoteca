import { loadWooEnv } from './_woo_env.mjs'
import fs from 'fs'

const { url, authHeader } = loadWooEnv()
let all = []
let page = 1
while (true) {
  const res = await fetch(`${url}/wp-json/wc/v3/products/categories?per_page=100&page=${page}`, { headers: { Authorization: authHeader } })
  const data = await res.json()
  if (!data.length) break
  all = all.concat(data)
  if (data.length < 100) break
  page++
}
fs.writeFileSync('scripts/_tanda3_woo_categories.json', JSON.stringify(all, null, 2))
console.log('Total categories:', all.length)
