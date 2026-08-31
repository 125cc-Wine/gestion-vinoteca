// Aplica las imágenes encontradas (scripts/_data_woo_images_found.json, mapa
// nombre-de-producto -> URL directa de imagen) a los productos sin imagen.
import { loadWooEnv } from './_woo_env.mjs'
import fs from 'fs'

const { url, authHeader } = loadWooEnv()
const gaps = JSON.parse(fs.readFileSync('scripts/_data_woo_gaps.json', 'utf8'))
const foundImages = JSON.parse(fs.readFileSync('scripts/_data_woo_images_found.json', 'utf8'))

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

const noImg = gaps.filter(p => p.missing.includes('images'))
let done = 0, skipped = 0, failed = 0, notFound = 0

for (const p of noImg) {
  const key = `image_${p.id}`
  if (progress[key]?.status === 'ok') { skipped++; continue }
  const imgUrl = foundImages[p.name]
  if (!imgUrl) { notFound++; continue }
  try {
    await putProduct(p.id, { images: [{ src: imgUrl }] })
    progress[key] = { name: p.name, status: 'ok', src: imgUrl }
    done++
    console.log(`OK  [${p.id}] ${p.name} -> ${imgUrl}`)
  } catch (e) {
    progress[key] = { name: p.name, status: 'error', error: String(e.message || e) }
    failed++
    console.log(`ERR [${p.id}] ${p.name}: ${e.message || e}`)
  }
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

console.log(`\nImágenes aplicadas: ${done}, ya hechas antes: ${skipped}, sin URL encontrada todavía: ${notFound}, errores: ${failed}`)
console.log(`Total productos sin imagen: ${noImg.length}`)
