import { createClient } from '@supabase/supabase-js'
import { loadWooEnv } from './_woo_env.mjs'
import fs from 'fs'

const SUPABASE_URL = 'https://yjtiopfmokodgwxstijd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdGlvcGZtb2tvZGd3eHN0aWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTI3MDAsImV4cCI6MjA5NjY2ODcwMH0.7e_ACK4YubBiA4VuPLFistMvnWdIItjMG6QIhh40HUw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
export const { url: WOO_URL, authHeader: WOO_AUTH } = loadWooEnv()

export const CAT_IDS = { Tinto: 66, Blanco: 64, Rosado: 65, Espumante: 67 }

// varietal subcategory id per type (from live Woo taxonomy)
export const VARIETAL_CAT = {
  Blanco: { 'Albariño': 796, 'Chardonnay': 93, 'Chenin Blanc': 1074, 'Chenin': 1074, 'Gewürztraminer': 94, 'Pinot Grigio': 165, 'Riesling': 95, 'Sauvignon Blanc': 96, 'Semillon': 217, 'Semillón': 217, 'Torrontés': 97, 'Torrontes': 97, 'Viognier': 98, 'Blend': 92 },
  Rosado: { 'Barbera': 552, 'Blend': 553, 'Bonarda': 554, 'Cabernet Franc': 555, 'Cabernet Sauvignon': 556, 'Charbono': 557, 'Criolla': 558, 'Garnacha': 1050, 'Malbec': 559, 'Merlot': 560, 'Petit Verdot': 562, 'Pinot Noir': 563, 'Sangiovese': 564, 'Syrah': 565, 'Tannat': 566, 'Tempranillo': 567, 'Zinfandel': 568 },
  Tinto: { 'Ancellotta': 795, 'Barbera': 100, 'Blend': 101, 'Bonarda': 102, 'Cabernet Franc': 103, 'Cabernet Sauvignon': 104, 'Charbono': 327, 'Criolla': 105, 'Garnacha': 845, 'Malbec': 106, 'Merlot': 107, 'Petit Verdot': 108, 'Pinot Noir': 190, 'Sangiovese': 109, 'Syrah': 110, 'Tannat': 342, 'Tempranillo': 111 },
  Espumante: { 'Bonarda': 569, 'Cabernet Franc': 570, 'Cabernet Sauvignon': 571, 'Chardonnay': 579, 'Malbec': 572, 'Merlot': 573, 'Petit Verdot': 575, 'Pinot Grigio': 580, 'Pinot Noir': 576, 'Sangiovese': 577, 'Sauvignon Blanc': 581, 'Semillon': 582, 'Syrah': 578, 'Torrontés': 583, 'Torrontes': 583, 'Viognier': 584, 'Brut': null },
}

// bodegas that already have a dedicated Woo category under "Bodegas" (674)
export const BODEGA_CAT = {
  'Alta-Yarí': 1062, 'Alta-Yari': 1062,
  'Argento': 1045,
  'Bonomo & Montiel': 723,
  'Cruzat': 727,
  'Cuarto Surco': 1063,
  'Domaine Bousquet': 951,
  'Falasco Wines': 794,
  'Fin del Mundo': 1099,
  'Finca Flichman': 1106,
  'Foster': 705,
  'Fuego Blanco': 711,
  'Gimenez Riili': 756,
  'Huentala': 709,
  'Kaiken': 694,
  'Las Perdices': 691,
  'Lorca': 706,
  'Marchiori & Barraud': 701,
  'Monte Quieto': 690,
  'Piedra Negra': 719,
  'Susana Balbo': 752,
  'Tapiz': 677,
  'Abito': 700,
}

const OTRO_CAT = {
  'Whiskies': 115, 'Whisky': 115,
  'Gin': 535,
  'Vermouth': 586,
  'Aperitivos': 590,
  'Aperitivo': 590,
  'Licores': 532,
}

export function resolveCategories(item) {
  const cats = new Set()
  if (item.categoria === 'Otro') {
    const id = OTRO_CAT[item.varietal] || null
    if (id) cats.add(id)
  } else {
    const typeId = CAT_IDS[item.categoria]
    if (typeId) cats.add(typeId)
    const varMap = VARIETAL_CAT[item.categoria]
    if (varMap && item.varietal && varMap[item.varietal]) cats.add(varMap[item.varietal])
  }
  if (item.bodega && BODEGA_CAT[item.bodega]) cats.add(BODEGA_CAT[item.bodega])
  return [...cats].map(id => ({ id }))
}

const PROGRESS_PATH = 'scripts/_progreso_tanda3.json'

export function loadProgress() {
  if (fs.existsSync(PROGRESS_PATH)) return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'))
  return {}
}
export function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2))
}

export async function crearProductoWoo(payload) {
  const res = await fetch(`${WOO_URL}/wp-json/wc/v3/products`, {
    method: 'POST',
    headers: { Authorization: WOO_AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Woo create failed: ${res.status} ${JSON.stringify(data)}`)
  return data
}

export async function actualizarSupabaseWooId(idsList, wooProductId) {
  // idsList: array of {aroma, lavid} maps (primary + any merged duplicates)
  const results = []
  for (const idsMap of idsList) {
    for (const empresa of ['aroma', 'lavid']) {
      const id = idsMap[empresa]
      if (!id) continue
      const { error } = await supabase.from('productos').update({ woo_product_id: wooProductId }).eq('id', id)
      results.push({ empresa, id, status: error ? `ERROR: ${error.message}` : 'ok' })
    }
  }
  return results
}

export function buildTags({ bodega, varietal, categoria, extra = [] }) {
  const tags = new Set()
  if (bodega) tags.add(bodega)
  if (varietal && varietal !== 'Blend') tags.add(varietal)
  if (varietal === 'Blend') tags.add('Blend')
  if (categoria && categoria !== 'Otro') tags.add(categoria.toLowerCase())
  for (const e of extra) tags.add(e)
  return [...tags].filter(Boolean).map(name => ({ name }))
}
