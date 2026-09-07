// Busca fotos ya subidas a la biblioteca de medios (subidas junto con la carga masiva
// del catálogo) que nunca se vincularon a ningún producto, y las cruza por nombre de
// archivo vs nombre de producto para proponer matches de alta confianza.
import fs from 'fs'

async function fetchAllMedia() {
  const all = []
  let page = 1
  while (true) {
    const res = await fetch(`https://www.aromadevid.com.ar/wp-json/wp/v2/media?per_page=100&page=${page}&after=2026-08-20T00:00:00&orderby=date&order=desc`)
    if (!res.ok) break
    const batch = await res.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    all.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return all
}

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // sin acentos
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokenize(s) {
  const stop = new Set(['de', 'la', 'el', 'los', 'las', 'del', 'y', 'con', 'en', 'ml', 'lt', 'lts', 'cc'])
  return normalize(s).split(' ').filter(w => w.length > 2 && !stop.has(w) && !/^\d+$/.test(w))
}

const gaps = JSON.parse(fs.readFileSync('scripts/_data_woo_gaps.json', 'utf8'))
const targets = gaps.filter(p => p.missing.includes('images'))
console.log(`Productos sin imagen a matchear: ${targets.length}`)

console.log('Descargando lista de medios...')
const media = await fetchAllMedia()
console.log(`Total medios recientes: ${media.length}`)

const mediaInfo = media.map(m => {
  const filename = (m.slug || m.title?.rendered || '').replace(/-\d+$/, '')
  return { id: m.id, url: m.source_url, filename, tokens: tokenize(filename) }
})

// Varietales/términos genéricos: coincidir SOLO en esto no cuenta como match real,
// hace falta que ademas coincida algo distintivo (marca/línea/nombre propio).
const GENERIC = new Set([
  'malbec','cabernet','sauvignon','franc','pinot','noir','chardonnay','blend','reserva',
  'reserve','merlot','syrah','bonarda','petit','verdot','rose','rosado','blanco','tinto',
  'gran','extra','brut','nature','organico','organic','red','white','vino','wine','estate',
  'gran reserva','joven','clasico','classic','seleccion','edicion','especial'
])

function distintivos(tokens) {
  return tokens.filter(t => !GENERIC.has(t))
}

function score(productTokens, mediaTokens) {
  if (mediaTokens.length === 0) return 0
  const matched = productTokens.filter(t => mediaTokens.includes(t))
  const distinctiveMatched = matched.filter(t => !GENERIC.has(t))
  if (distinctiveMatched.length === 0) return 0 // exige al menos 1 termino no generico en comun
  return matched.length / Math.max(productTokens.length, 1)
}

const proposals = []
for (const p of targets) {
  const pTokens = tokenize(p.name)
  let best = null
  for (const m of mediaInfo) {
    const s = score(pTokens, m.tokens)
    if (!best || s > best.score) best = { ...m, score: s }
  }
  if (best && best.score >= 0.5) {
    proposals.push({ id: p.id, name: p.name, pTokens, media: best })
  }
}

proposals.sort((a, b) => b.media.score - a.media.score)
fs.writeFileSync('scripts/_data_woo_fotos_huerfanas_proposal.json', JSON.stringify(proposals, null, 2))

console.log(`\nPropuestas encontradas (score >= 0.5): ${proposals.length}`)
for (const pr of proposals) {
  console.log(`  [${pr.id}] ${pr.name}  <-  ${pr.media.filename} (score ${pr.media.score.toFixed(2)}) id:${pr.media.id}`)
}
