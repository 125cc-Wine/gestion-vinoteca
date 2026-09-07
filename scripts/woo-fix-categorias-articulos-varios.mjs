// Corrige vinos/espumantes que quedaron con categoría "Artículos varios" (id 15)
// en vez de su categoría real (varietal + Vinos Tintos/Blancos/Rosados/Espumosos).
// Genera scripts/_data_woo_categorias_proposal.json para revisión manual.
import { loadWooEnv } from './_woo_env.mjs'
import fs from 'fs'

const { url, authHeader } = loadWooEnv()
const products = JSON.parse(fs.readFileSync('scripts/_data_woo_articulos_varios_realcats.json', 'utf8'))
const allCats = JSON.parse(fs.readFileSync('scripts/_data_woo_categories.json', 'utf8'))

const ARTICULOS_VARIOS_ID = 15
const STYLE_TOP = { tinto: 66, blanco: 64, rosado: 65, espumoso: 67 }

// varietal -> { tinto: id, blanco: id, rosado: id, espumoso: id } (solo se llenan las que existen)
function findVarietalCats(varietalName) {
  const matches = allCats.filter(c => c.name.toLowerCase() === varietalName.toLowerCase())
  const out = {}
  for (const m of matches) {
    if (m.parent === STYLE_TOP.tinto) out.tinto = m.id
    else if (m.parent === STYLE_TOP.blanco || m.parent === 1089) out.blanco = m.id
    else if (m.parent === STYLE_TOP.rosado) out.rosado = m.id
    else if (m.parent === STYLE_TOP.espumoso) out.espumoso = m.id
  }
  return out
}

const VARIETAL_RULES = [
  [/cabernet\s+franc/i, 'Cabernet Franc', 'tinto'],
  [/cabernet\s+sauvignon/i, 'Cabernet Sauvignon', 'tinto'],
  [/\bmalbec\b/i, 'Malbec', 'tinto'],
  [/\bsyrah\b|\bshiraz\b/i, 'Syrah', 'tinto'],
  [/\bmerlot\b/i, 'Merlot', 'tinto'],
  [/pinot\s+noir/i, 'Pinot Noir', 'tinto'],
  [/pinot\s+gris|pinot\s+grigio/i, 'Pinot Grigio', 'blanco'],
  [/\bchardonnay\b/i, 'Chardonnay', 'blanco'],
  [/\btorront[ée]s?\b/i, 'Torrontés', 'blanco'],
  [/\bviognier\b/i, 'Viognier', 'blanco'],
  [/petit\s+verdot/i, 'Petit Verdot', 'tinto'],
  [/\bsemill[oó]n\b/i, 'Semillon', 'blanco'],
  [/\btannat\b/i, 'Tannat', 'tinto'],
]

function stripAccents(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '') }

function deriveCategoryFix(p) {
  const name = p.name
  const nameNorm = stripAccents(name).toLowerCase()

  // No son vino: dejar como estaban (no tocar)
  if (/branca\s+menta|jerez\b|amaro|licor/i.test(name)) return null
  // Regalos / combos: dejar como estaban
  if (/^regalos?\b/i.test(name) || /combo\s+envio/i.test(name) || /ferrero\s+rocher/i.test(name) || /calonia/i.test(name)) return null
  // Gaseosas / comida: dejar como estaban
  if (/sanpellegrino|colsani|panettone|bud[ií]n|cantuccini|pan\s+dulce/i.test(name)) return null
  // No es producto de vino real (bebida gaseosa, comida): ya tienen su categoría correcta, no deberían estar en este listado si se filtra bien

  let style = 'tinto'
  if (/sparkling|extra\s+brut|brut\s+nature|espumante|espumoso/i.test(nameNorm)) style = 'espumoso'
  else if (/ros[ée]|rosado/i.test(nameNorm)) style = 'rosado'

  let varietalName = null
  let varietalDefaultStyle = null
  for (const [re, tagName, defStyle] of VARIETAL_RULES) {
    if (re.test(name)) { varietalName = tagName; varietalDefaultStyle = defStyle; break }
  }

  // si el nombre no marcó espumante/rosado explícito, pero el varietal es típicamente blanco, usar blanco
  if (style === 'tinto' && varietalDefaultStyle === 'blanco') style = 'blanco'

  const newCatIds = new Set()
  newCatIds.add(STYLE_TOP[style])

  if (varietalName) {
    const vc = findVarietalCats(varietalName)
    if (vc[style]) newCatIds.add(vc[style])
    else if (vc.tinto && style === 'tinto') newCatIds.add(vc.tinto)
    // si no existe la variante exacta (ej: "Malbec Blanco" no existe), nos quedamos solo con el nivel superior
  } else {
    // sin varietal detectado: usar "Blend" si el nombre lo sugiere
    if (/blend|corte\b/i.test(nameNorm)) {
      const vc = findVarietalCats('Blend')
      if (vc[style]) newCatIds.add(vc[style])
      else if (allCats.find(c => c.name === 'Blend de tintas' && style === 'tinto')) {
        newCatIds.add(allCats.find(c => c.name === 'Blend de tintas').id)
      }
    }
  }

  const keepCats = (p.categories || [])
    .filter(c => c.id !== ARTICULOS_VARIOS_ID)
    .map(c => c.id)

  const finalIds = new Set([...keepCats, ...newCatIds])

  return {
    id: p.id,
    name: p.name,
    before: p.categories.map(c => `${c.name} (id:${c.id})`),
    after: [...finalIds].map(id => allCats.find(c => c.id === id)?.name || `id:${id}`),
    afterIds: [...finalIds],
    varietalDetected: varietalName,
    styleDetected: style,
  }
}

const targets = products.filter(p => p.categories.some(c => c.id === ARTICULOS_VARIOS_ID))
const proposals = []
const skipped = []
for (const p of targets) {
  const fix = deriveCategoryFix(p)
  if (fix) proposals.push(fix)
  else skipped.push({ id: p.id, name: p.name, categories: p.categories })
}

fs.writeFileSync('scripts/_data_woo_categorias_proposal.json', JSON.stringify(proposals, null, 2))
fs.writeFileSync('scripts/_data_woo_categorias_skipped.json', JSON.stringify(skipped, null, 2))

console.log(`Total con "Artículos varios": ${targets.length}`)
console.log(`Propuestas de corrección: ${proposals.length}`)
console.log(`Sin tocar (no parecen vino / combos / regalos): ${skipped.length}`)
console.log('\n--- SKIPPED (revisar si alguno SÍ es vino) ---')
skipped.forEach(s => console.log(`  [${s.id}] ${s.name}`))
