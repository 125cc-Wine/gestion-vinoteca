import fs from 'fs'

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'con', 'vino', 'wine', 'x750', 'x1000', '750ml', 'ml', 'estate'])

function tokens(s) {
  return normalize(s).split(' ').filter(w => w.length > 1 && !STOP.has(w))
}

const woo = JSON.parse(fs.readFileSync('scripts/_tanda2_woo_full.json', 'utf8'))
const wooTok = woo.map(p => ({ ...p, tok: tokens(p.name), norm: normalize(p.name) }))

const items = JSON.parse(fs.readFileSync('scripts/_tanda3_crear.json', 'utf8'))

const results = []
for (const item of items) {
  const itemNorm = normalize(item.nombre)
  const itemTok = tokens(item.nombre)
  const bodegaTok = new Set(tokens(item.bodega || ''))
  const itemDistinctive = itemTok.filter(t => !bodegaTok.has(t))

  let exact = null
  const distinctiveMatches = []
  const bodegaOnlyMatches = []

  for (const w of wooTok) {
    if (w.norm === itemNorm) { exact = w; continue }
    const bodegaMatch = bodegaTok.size > 0 && [...bodegaTok].every(t => w.tok.includes(t))
    if (!bodegaMatch) {
      // also try: all item tokens present in woo name regardless of bodega field (for null-bodega items)
      const allTokPresent = itemTok.length > 0 && itemTok.every(t => w.tok.includes(t))
      if (allTokPresent && bodegaTok.size === 0) {
        distinctiveMatches.push({ id: w.id, name: w.name, price: w.price, status: w.status, permalink: w.permalink, distinctiveOverlap: itemTok.length, distinctiveOverlapRatio: 1, priceRatio: null, note: 'no-bodega-full-match' })
      }
      continue
    }
    const wDistinctive = w.tok.filter(t => !bodegaTok.has(t))
    const distinctiveOverlap = itemDistinctive.filter(t => wDistinctive.includes(t)).length
    const distinctiveOverlapRatio = itemDistinctive.length > 0 ? distinctiveOverlap / itemDistinctive.length : 0
    let priceRatio = null
    if (w.price && item.precio) {
      const wp = parseFloat(w.price)
      if (!isNaN(wp) && wp > 0) priceRatio = wp / item.precio
    }
    const entry = { id: w.id, name: w.name, price: w.price, status: w.status, permalink: w.permalink, distinctiveOverlap, distinctiveOverlapRatio: +distinctiveOverlapRatio.toFixed(2), priceRatio: priceRatio ? +priceRatio.toFixed(2) : null }
    if (distinctiveOverlap >= 1 || itemDistinctive.length === 0) {
      distinctiveMatches.push(entry)
    } else {
      bodegaOnlyMatches.push(entry)
    }
  }
  distinctiveMatches.sort((a, b) => b.distinctiveOverlapRatio - a.distinctiveOverlapRatio)
  bodegaOnlyMatches.sort((a, b) => (b.priceRatio && a.priceRatio) ? Math.abs(1 - b.priceRatio) - Math.abs(1 - a.priceRatio) : 0)

  let category
  if (exact) category = 'EXACT_MATCH'
  else if (distinctiveMatches.length > 0 && distinctiveMatches[0].distinctiveOverlapRatio >= 0.5) category = 'LIKELY_DUP'
  else if (distinctiveMatches.length > 0) category = 'REVIEW'
  else if (bodegaOnlyMatches.length > 0) category = 'SAME_BODEGA_ONLY'
  else category = 'NO_MATCH'

  results.push({
    nombre: item.nombre, bodega: item.bodega, precio: item.precio, category,
    exact: exact ? { id: exact.id, name: exact.name, price: exact.price, permalink: exact.permalink } : null,
    distinctiveMatches: distinctiveMatches.slice(0, 3),
    bodegaOnlyMatches: bodegaOnlyMatches.slice(0, 3),
  })
}

fs.writeFileSync('scripts/_tanda3_match_results.json', JSON.stringify(results, null, 2))
const counts = {}
for (const r of results) counts[r.category] = (counts[r.category] || 0) + 1
console.log(counts)
