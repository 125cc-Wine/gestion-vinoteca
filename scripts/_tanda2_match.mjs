import fs from 'fs'

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'con', 'vino', 'wine'])

function tokens(s) {
  return normalize(s).split(' ').filter(w => w.length > 1 && !STOP.has(w))
}

const woo = JSON.parse(fs.readFileSync('scripts/_tanda2_woo_full.json', 'utf8'))
const wooTok = woo.map(p => ({ ...p, tok: new Set(tokens(p.name)) }))

const items = JSON.parse(fs.readFileSync('scripts/_tanda2_crear.json', 'utf8'))

const results = []
for (const item of items) {
  const itemTok = tokens(item.nombre)
  const bodegaTok = tokens(item.bodega)
  const candidates = []
  for (const w of wooTok) {
    // overlap score
    const overlap = itemTok.filter(t => w.tok.has(t)).length
    const bodegaMatch = bodegaTok.length > 0 && bodegaTok.every(t => w.tok.has(t))
    if (overlap >= 2 || bodegaMatch) {
      let priceOk = null
      if (w.price && item.precio) {
        const wp = parseFloat(w.price)
        if (!isNaN(wp) && wp > 0) {
          const ratio = wp / item.precio
          priceOk = ratio > 0.5 && ratio < 2.0
        }
      }
      candidates.push({
        id: w.id, name: w.name, price: w.price, status: w.status,
        overlap, bodegaMatch, priceOk,
        permalink: w.permalink,
      })
    }
  }
  candidates.sort((a, b) => (b.bodegaMatch - a.bodegaMatch) || (b.overlap - a.overlap))
  results.push({ nombre: item.nombre, bodega: item.bodega, precio: item.precio, candidates: candidates.slice(0, 5) })
}

fs.writeFileSync('scripts/_tanda2_match_results.json', JSON.stringify(results, null, 2))
const withCand = results.filter(r => r.candidates.length > 0).length
console.log(`Items con al menos 1 candidato: ${withCand} / ${results.length}`)
console.log(`Items sin ningun candidato (crear directo probable): ${results.length - withCand}`)
