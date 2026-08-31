// Aplica las propuestas de tags (scripts/_data_woo_tags_proposal.json) vía PUT
// wp-json/wc/v3/products/{id}. Guarda progreso en scripts/_progreso_woo_gaps.json
import { loadWooEnv } from './_woo_env.mjs'
import fs from 'fs'

const { url, authHeader } = loadWooEnv()
const proposals = JSON.parse(fs.readFileSync('scripts/_data_woo_tags_proposal.json', 'utf8'))

const PROGRESS_FILE = 'scripts/_progreso_woo_gaps.json'
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
  const key = `tags_${p.id}`
  if (progress[key]) { skipped++; continue }
  if (p.skip || p.proposed.length === 0) {
    progress[key] = { name: p.name, status: 'skipped-no-proposal' }
    skipped++
    continue
  }
  const tagsPayload = p.proposed.map(t => t.id ? { id: t.id } : { name: t.name })
  try {
    await putProduct(p.id, { tags: tagsPayload })
    progress[key] = { name: p.name, status: 'ok', tags: p.proposed.map(t => t.name) }
    done++
    console.log(`OK  [${p.id}] ${p.name} -> ${p.proposed.map(t => t.name).join(', ')}`)
  } catch (e) {
    progress[key] = { name: p.name, status: 'error', error: String(e.message || e) }
    failed++
    console.log(`ERR [${p.id}] ${p.name}: ${e.message || e}`)
  }
  // guardar progreso cada iteración (son solo 87, no hace falta batchear más)
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

console.log(`\nTags aplicados: ${done}, saltados (ya hechos/sin propuesta): ${skipped}, errores: ${failed}`)
