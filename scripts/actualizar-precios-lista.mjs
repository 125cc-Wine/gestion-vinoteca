import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const SUPABASE_URL = 'https://yjtiopfmokodgwxstijd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdGlvcGZtb2tvZGd3eHN0aWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTI3MDAsImV4cCI6MjA5NjY2ODcwMH0.7e_ACK4YubBiA4VuPLFistMvnWdIItjMG6QIhh40HUw'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizar(s) {
  if (!s) return ''
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // quitar acentos
    .replace(/[^a-z0-9\s]/g, ' ')                        // solo letras/números
    .replace(/\s+/g, ' ')
    .trim()
}

// Convierte "9.917,36" → 9917.36 (formato AR)
function parsePrecioAR(s) {
  if (!s) return null
  const limpio = s.trim().replace(/\./g, '').replace(',', '.')
  const n = parseFloat(limpio)
  return isNaN(n) ? null : n
}

// Puntaje de overlap de palabras (0-1)
function scoreMatch(a, b) {
  const wa = new Set(normalizar(a).split(' ').filter(w => w.length > 2))
  const wb = new Set(normalizar(b).split(' ').filter(w => w.length > 2))
  if (wa.size === 0 || wb.size === 0) return 0
  let comunes = 0
  for (const w of wa) if (wb.has(w)) comunes++
  return comunes / Math.max(wa.size, wb.size)
}

// ─── Parsear CSV ──────────────────────────────────────────────────────────────

console.log('Leyendo CSV...')
const csv = readFileSync('./Rpt_ListaPreciosSimple.csv', 'latin1')
const lineas = csv.split('\n')

const listaPrecios = []
for (const linea of lineas) {
  const cols = linea.split(';')
  if (cols.length < 9) continue
  const desc = cols[1]?.trim()
  const finalStr = cols[8]?.trim()
  if (!desc || desc === 'descripcion' || !finalStr || finalStr === 'Final') continue
  const precio = parsePrecioAR(finalStr)
  if (!desc || precio === null || precio <= 0) continue
  listaPrecios.push({ desc, precio, descNorm: normalizar(desc) })
}
console.log(`Lista de precios: ${listaPrecios.length} items`)

// ─── Cargar productos de Supabase ─────────────────────────────────────────────

console.log('Cargando productos de Supabase...')
let todos = []
let page = 0
while (true) {
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, empresa, precio_venta')
    .eq('activo', true)
    .eq('empresa', 'aroma')   // solo aroma, luego replicamos a lavid por nombre
    .range(page * 1000, (page + 1) * 1000 - 1)
  if (error) { console.error('Error:', error.message); process.exit(1) }
  if (!data?.length) break
  todos = todos.concat(data)
  if (data.length < 1000) break
  page++
}
console.log(`Productos en Supabase (aroma): ${todos.length}`)

// ─── Matching ─────────────────────────────────────────────────────────────────

console.log('\nBuscando matches...')
const actualizaciones = []
const sinMatch = []
const UMBRAL = 0.65

for (const prod of todos) {
  const normProd = normalizar(prod.nombre)
  let mejorScore = 0
  let mejorItem = null

  for (const item of listaPrecios) {
    const s = scoreMatch(normProd, item.descNorm)
    if (s > mejorScore) {
      mejorScore = s
      mejorItem = item
    }
  }

  if (mejorScore >= UMBRAL && mejorItem) {
    actualizaciones.push({
      id: prod.id,
      nombre: prod.nombre,
      precioAnterior: prod.precio_venta,
      precioNuevo: mejorItem.precio,
      matchDesc: mejorItem.desc,
      score: mejorScore,
    })
  } else {
    sinMatch.push(prod.nombre)
  }
}

console.log(`\nCon match: ${actualizaciones.length}`)
console.log(`Sin match:  ${sinMatch.length}`)

// Mostrar ejemplos
console.log('\nPrimeros 20 matches:')
for (const u of actualizaciones.slice(0, 20)) {
  console.log(`  [${(u.score * 100).toFixed(0)}%] "${u.nombre}" → "${u.matchDesc}" = $${u.precioNuevo.toLocaleString('es-AR')}`)
}

if (actualizaciones.length === 0) {
  console.log('Nada que actualizar.')
  process.exit(0)
}

// ─── Confirmar ────────────────────────────────────────────────────────────────

console.log('\n¿Proceder con la actualización? (Ctrl+C para cancelar, Enter para continuar)')
await new Promise(r => setTimeout(r, 3000))   // pausa automática de 3s

// ─── Actualizar Supabase para ambas empresas ──────────────────────────────────

console.log('\nActualizando precios en Supabase...')

// Obtener todos los productos de lavid también (para sync por nombre)
let lavid = []
page = 0
while (true) {
  const { data } = await supabase
    .from('productos')
    .select('id, nombre, precio_venta')
    .eq('activo', true)
    .eq('empresa', 'lavid')
    .range(page * 1000, (page + 1) * 1000 - 1)
  if (!data?.length) break
  lavid = lavid.concat(data)
  if (data.length < 1000) break
  page++
}
const lavidMap = new Map(lavid.map(p => [normalizar(p.nombre), p]))

let okAroma = 0, okLavid = 0, errores = 0

for (const u of actualizaciones) {
  // Actualizar aroma
  const { error: e1 } = await supabase
    .from('productos')
    .update({ precio_venta: u.precioNuevo })
    .eq('id', u.id)

  if (e1) { console.error(`  ERR aroma id=${u.id}:`, e1.message); errores++; continue }
  okAroma++

  // Sync lavid por nombre normalizado
  const lavidProd = lavidMap.get(normalizar(u.nombre))
  if (lavidProd) {
    const { error: e2 } = await supabase
      .from('productos')
      .update({ precio_venta: u.precioNuevo })
      .eq('id', lavidProd.id)
    if (e2) console.error(`  ERR lavid id=${lavidProd.id}:`, e2.message)
    else okLavid++
  }

  if (okAroma % 50 === 0) console.log(`  ${okAroma}/${actualizaciones.length} actualizados...`)
}

console.log('\n=== RESULTADO ===')
console.log(`Actualizados aroma: ${okAroma}`)
console.log(`Actualizados lavid: ${okLavid}`)
console.log(`Errores:            ${errores}`)
console.log(`Sin match:          ${sinMatch.length}`)
if (sinMatch.length > 0 && sinMatch.length <= 30) {
  console.log('\nProductos sin precio en la lista:')
  for (const n of sinMatch) console.log(`  - ${n}`)
}
