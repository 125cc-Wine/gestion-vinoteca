import { createClient } from '@supabase/supabase-js'
import { loadWooEnv } from './_woo_env.mjs'
import fs from 'fs'

const SUPABASE_URL = 'https://yjtiopfmokodgwxstijd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdGlvcGZtb2tvZGd3eHN0aWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTI3MDAsImV4cCI6MjA5NjY2ODcwMH0.7e_ACK4YubBiA4VuPLFistMvnWdIItjMG6QIhh40HUw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
export const { url: WOO_URL, authHeader: WOO_AUTH } = loadWooEnv()

export const CAT_IDS = { Tinto: 66, Blanco: 64, Rosado: 65, Espumante: 67 }

const PROGRESS_PATH = 'scripts/_progreso_tanda2.json'

export function loadProgress() {
  if (fs.existsSync(PROGRESS_PATH)) {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'))
  }
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

export async function actualizarSupabaseWooId(ids, wooProductId) {
  const results = {}
  for (const empresa of ['aroma', 'lavid']) {
    const id = ids[empresa]
    if (!id) continue
    const { error } = await supabase.from('productos').update({ woo_product_id: wooProductId }).eq('id', id)
    results[empresa] = error ? `ERROR: ${error.message}` : 'ok'
  }
  return results
}

export function buildDescription({ nombre, bodega, varietal, categoria, notas }) {
  const catTxt = {
    Tinto: 'vino tinto',
    Blanco: 'vino blanco',
    Rosado: 'vino rosado',
    Espumante: 'vino espumante',
  }[categoria] || 'vino'
  let base = `${nombre} es un ${catTxt}`
  if (varietal && varietal !== 'Blend') base += ` elaborado con uvas ${varietal}`
  else if (varietal === 'Blend') base += ' de corte (blend)'
  if (bodega) base += `, producido por ${bodega}`
  base += '.'
  if (notas) base += ` ${notas}`
  return base
}

export function buildShortDescription({ bodega, varietal, categoria }) {
  const parts = []
  if (varietal) parts.push(varietal)
  if (categoria) parts.push(categoria)
  if (bodega) parts.push(bodega)
  return parts.join(' | ')
}

export function buildTags({ bodega, varietal, categoria, extra = [] }) {
  const tags = new Set()
  if (bodega) tags.add(bodega)
  if (varietal && varietal !== 'Blend') tags.add(varietal)
  if (varietal === 'Blend') tags.add('Blend')
  if (categoria) tags.add(categoria.toLowerCase())
  for (const e of extra) tags.add(e)
  return [...tags].map(name => ({ name }))
}
