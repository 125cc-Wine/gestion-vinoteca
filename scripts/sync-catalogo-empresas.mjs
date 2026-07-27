// Empareja el catálogo de productos entre Aroma y La Vid: crea en cada
// empresa los productos que existen solo en la otra (mismo nombre/atributos/
// precio, stock en 0 porque el stock físico es propio de cada punto de venta).
// Además arregla dos inconsistencias puntuales detectadas en el diff manual.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://yjtiopfmokodgwxstijd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdGlvcGZtb2tvZGd3eHN0aWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTI3MDAsImV4cCI6MjA5NjY2ODcwMH0.7e_ACK4YubBiA4VuPLFistMvnWdIItjMG6QIhh40HUw'
)

function normalizar(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

async function cargarTodos(emp) {
  let todos = [], page = 0
  while (true) {
    const { data, error } = await supabase.from('productos').select('*').eq('empresa', emp)
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (error) { console.error(error); process.exit(1) }
    if (!data?.length) break
    todos = todos.concat(data)
    if (data.length < 1000) break
    page++
  }
  return todos
}

const aroma = await cargarTodos('aroma')
const lavid = await cargarTodos('lavid')
const aromaMap = new Map(aroma.map(p => [normalizar(p.nombre), p]))
const lavidMap = new Map(lavid.map(p => [normalizar(p.nombre), p]))

// ── Fix 1: desactivar duplicado con typo "Fiinca Ferrer Acordeon" ──────────
const typoDup = lavid.find(p => p.nombre === 'Fiinca Ferrer Acordeon')
if (typoDup) {
  const { error } = await supabase.from('productos').update({ activo: false }).eq('id', typoDup.id)
  console.log(error ? `ERR desactivando typo: ${error.message}` : `Desactivado duplicado typo: "${typoDup.nombre}" (lavid)`)
}

// ── Fix 2: reactivar "Finca Flichman Estate Chardo-Viog" en aroma ──────────
const chardoViog = aroma.find(p => p.nombre === 'Finca Flichman Estate Chardo-Viog')
if (chardoViog) {
  const { error } = await supabase.from('productos').update({ activo: true }).eq('id', chardoViog.id)
  console.log(error ? `ERR reactivando: ${error.message}` : `Reactivado en aroma: "${chardoViog.nombre}"`)
}

// ── Mirror: crear en la empresa faltante, copiando atributos + precio ──────
const CAMPOS_COPIAR = [
  'nombre', 'bodega', 'varietal', 'categoria', 'anada', 'region', 'sku',
  'precio_venta', 'precio_costo', 'precio_mayorista', 'stock_minimo',
  'unidad_medida', 'proveedor_nombre', 'bodega_id', 'precios_escala', 'codigo_barras',
]

function armarFila(origen, empresaDestino) {
  const fila = { empresa: empresaDestino, stock: 0, activo: true }
  for (const c of CAMPOS_COPIAR) fila[c] = origen[c]
  return fila
}

const soloAroma = aroma.filter(p => p.activo && p.nombre !== 'Coeur sair' && !lavidMap.has(normalizar(p.nombre)))
const soloLavid = lavid.filter(p => p.activo && p.nombre !== 'Fiinca Ferrer Acordeon' && !aromaMap.has(normalizar(p.nombre)))

console.log(`\nA crear en Lavid (desde Aroma): ${soloAroma.length}`)
console.log(`A crear en Aroma (desde Lavid): ${soloLavid.length}`)

const filasLavid = soloAroma.map(p => armarFila(p, 'lavid'))
const filasAroma = soloLavid.map(p => armarFila(p, 'aroma'))

const { data: d1, error: e1 } = await supabase.from('productos').insert(filasLavid).select('id,nombre')
if (e1) console.error('ERR insertando en lavid:', e1.message)
else console.log(`✓ Creados en Lavid: ${d1.length}`)

const { data: d2, error: e2 } = await supabase.from('productos').insert(filasAroma).select('id,nombre')
if (e2) console.error('ERR insertando en aroma:', e2.message)
else console.log(`✓ Creados en Aroma: ${d2.length}`)

console.log('\nListo.')
