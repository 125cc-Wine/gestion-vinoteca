// Aplica las propuestas revisadas de scripts/_data_woo_categorias_proposal.json vía PUT.
import { loadWooEnv } from './_woo_env.mjs'
import fs from 'fs'

const { url, authHeader } = loadWooEnv()
const proposals = JSON.parse(fs.readFileSync('scripts/_data_woo_categorias_proposal.json', 'utf8'))

const PROGRESS_FILE = 'scripts/_progreso_woo_categorias.json'
let progress = {}
if (fs.existsSync(PROGRESS_FILE)) progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))

async function putProduct(id, body) {
  const res = await fetch(`${url}/wp-json/wc/v3/products/${id}`, {
    method: 'PUT',
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return res.json()
}

let done = 0, skipped = 0, failed = 0
for (const p of proposals) {
  const key = `cat_${p.id}`
  if (progress[key]) { skipped++; continue }
  if (p.skip || !p.afterIds || p.afterIds.length === 0) {
    progress[key] = { name: p.name, status: 'skipped', note: p.note || 'sin propuesta' }
    skipped++
    continue
  }
  const catsPayload = p.afterIds.map(id => ({ id }))
  try {
    await putProduct(p.id, { categories: catsPayload })
    progress[key] = { name: p.name, status: 'ok', categories: p.after }
    done++
    console.log(`OK  [${p.id}] ${p.name} -> ${p.after.join(', ')}`)
  } catch (e) {
    progress[key] = { name: p.name, status: 'error', error: String(e.message || e) }
    failed++
    console.log(`ERR [${p.id}] ${p.name}: ${e.message || e}`)
  }
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

console.log(`\nCategorías corregidas: ${done}, saltadas: ${skipped}, errores: ${failed}`)
