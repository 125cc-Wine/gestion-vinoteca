// Deriva tags para los productos que no tienen ninguno, usando:
//  - categorías del producto (varietal/tipo/región ya vienen ahí en muchos casos)
//  - palabras clave del nombre del producto
//  - reutiliza tags existentes (case-insensitive) por id, o propone nombre nuevo
// Salida: scripts/_data_woo_tags_proposal.json para revisión manual antes de aplicar.
import fs from 'fs'

const products = JSON.parse(fs.readFileSync('scripts/_data_woo_products_full.json', 'utf8'))
const existingTags = JSON.parse(fs.readFileSync('scripts/_data_woo_tags.json', 'utf8'))
const gaps = JSON.parse(fs.readFileSync('scripts/_data_woo_gaps.json', 'utf8'))

const byLower = new Map()
for (const t of existingTags) {
  const k = t.name.toLowerCase().trim()
  if (!byLower.has(k)) byLower.set(k, t)
}

function findTag(name) {
  return byLower.get(name.toLowerCase().trim())
}

// varietal keyword -> nombre de tag preferido (exacto, se busca case-insensitive)
const VARIETAL_RULES = [
  [/cabernet\s+franc/i, 'Cabernet Franc'],
  [/cabernet\s+sauvignon/i, 'Cabernet Sauvignon'],
  [/\bmalbec\b/i, 'Malbec'],
  [/\bsyrah\b|\bshiraz\b/i, 'Syrah'],
  [/\bmerlot\b/i, 'Merlot'],
  [/pinot\s+noir/i, 'Pinot Noir'],
  [/pinot\s+gris|pinot\s+grigio/i, 'Pinot Gris'],
  [/\bchardonnay\b/i, 'Chardonnay'],
  [/\btorrontés\b|\btorrontes\b/i, 'torrontes riojano'],
  [/\bviognier\b/i, 'Viognier'],
  [/petit\s+verdot/i, 'Petit Verdot'],
  [/\bmoscatel\b/i, 'moscatel'],
  [/\bcriolla\b/i, 'criolla'],
  [/\bnaranjo\b|skin\s+contact/i, 'Naranjo'],
  [/red\s+blend|blend/i, 'Blend'],
]

const TIPO_BLANCO_VARIETALS = /chardonnay|viognier|torront|pinot\s+gris|pinot\s+grigio|moscatel|sauvignon\s+blanc/i
const TIPO_ROSADO = /ros[ée]|rosado/i
const TIPO_ESPUMANTE = /sparkling|extra\s+brut|brut\s+nature|espumante|espumoso/i

function deriveTagsForProduct(p) {
  const name = p.name
  const cats = p.categories.map(c => c.toLowerCase())
  const proposed = [] // { id?, name }
  const addExisting = (tagName) => {
    const t = findTag(tagName)
    if (t) {
      if (!proposed.some(x => x.id === t.id)) proposed.push({ id: t.id, name: t.name })
    } else {
      if (!proposed.some(x => x.name && x.name.toLowerCase() === tagName.toLowerCase())) proposed.push({ name: tagName })
    }
  }

  // No es vino: vermouth, gin, combos, regalos
  if (/vermouth/i.test(name)) {
    addExisting('vermouth')
    if (/org[aá]nico/i.test(name)) addExisting('organico')
    return { proposed, category: 'vermouth' }
  }
  if (/\bgin\b/i.test(name) || cats.includes('gin')) {
    if (/import/i.test(name) || cats.includes('importado')) addExisting('gin importado')
    else addExisting('gin nacional')
    return { proposed, category: 'gin' }
  }
  if (/^combo\s+envio/i.test(name)) {
    return { proposed: [], category: 'no-aplica', skip: true }
  }
  if (/^regalos?\b/i.test(name) || /ferrero\s+rocher|\+\s*2\s*copas/i.test(name)) {
    addExisting('regalos')
    return { proposed, category: 'regalo' }
  }

  // Varietal
  let varietalFound = null
  for (const [re, tagName] of VARIETAL_RULES) {
    if (re.test(name)) { varietalFound = tagName; addExisting(tagName); break }
  }
  // Blend adicional si el nombre dice "Blend" y no fue el match principal
  if (/blend/i.test(name) && varietalFound !== 'Blend') addExisting('Blend')
  // Blend por categoría, si el nombre no deja claro que es varietal único (ej. "Cuatro Uvas")
  if (!varietalFound && (cats.includes('blend de tintas') || cats.includes('blend de blancas'))) addExisting('Blend')
  // "Corte" es el término argentino clásico para blend/assemblage (ej. Pulenta Gran Corte)
  if (!varietalFound && /\bcorte\b/i.test(name)) addExisting('Blend')

  // Tipo
  let tipo = 'Tinto'
  if (TIPO_ESPUMANTE.test(name)) tipo = 'Espumoso'
  else if (TIPO_ROSADO.test(name) || cats.includes('rosados')) tipo = 'rosado'
  else if (TIPO_BLANCO_VARIETALS.test(name) || cats.includes('vinos blancos') || cats.includes('vino blancos') || cats.includes('blancas')) tipo = 'Blanco'
  else if (cats.includes('vinos tintos') || cats.includes('tintas')) tipo = 'Tinto'
  addExisting(tipo)

  // Reserva / Gran reserva / Orgánico
  if (/gran\s+reserva/i.test(name)) addExisting('Gran Reserva')
  else if (/reserva|reserve/i.test(name)) addExisting('Reserva')
  if (/org[aá]nico/i.test(name)) addExisting('organico')
  if (/single\s+vineyard/i.test(name)) addExisting('Single Vineyard')
  if (/\bguarda\b/i.test(name)) addExisting('vino de guarda')

  return { proposed, category: 'vino' }
}

const proposals = []
for (const g of gaps) {
  if (!g.missing.includes('tags')) continue
  const p = products.find(x => x.id === g.id)
  const result = deriveTagsForProduct(p)
  proposals.push({ id: p.id, name: p.name, categories: p.categories, ...result })
}

fs.writeFileSync('scripts/_data_woo_tags_proposal.json', JSON.stringify(proposals, null, 2))
console.log(`Propuestas generadas: ${proposals.length}`)
const withoutProposal = proposals.filter(p => !p.skip && p.proposed.length === 0)
console.log(`Sin ninguna propuesta (revisar manual): ${withoutProposal.length}`)
for (const p of withoutProposal) console.log(' -', p.name)
