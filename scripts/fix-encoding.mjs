import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yjtiopfmokodgwxstijd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdGlvcGZtb2tvZGd3eHN0aWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTI3MDAsImV4cCI6MjA5NjY2ODcwMH0.7e_ACK4YubBiA4VuPLFistMvnWdIItjMG6QIhh40HUw'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const BATCH = 50

// Orden importa: los compuestos van antes que sus partes genéricas
const REEMPLAZOS = [
  // Compuestos con Á± que cambian la letra anterior también
  ['AÁ±',      'añ'],
  ['ViÁ±',     'Viñ'],
  ['MontaÁ±',  'Montañ'],
  ['maÁ±',     'mañ'],
  ['paÁ±',     'pañ'],
  ['niÁ±',     'niñ'],
  // Secuencias de dos caracteres (Á-familia)
  ['Á±',       'ñ'],
  ['Á­',       'í'],
  ['Â°',       '°'],
  ['Á©',       'é'],
  ['Á¡',       'á'],
  ['Áº',       'ú'],
  ['Á³',       'ó'],
  // Secuencias de dos caracteres (Ã-familia)
  ['Ã±',       'ñ'],
  ['Ã­',       'í'],
  ['Ã©',       'é'],
  ['Ã¡',       'á'],
  ['Ãº',       'ú'],
  ['Ã³',       'ó'],
  // Otros
  ['Â´',       "'"],
  // Á solo = Ñ (ej: "Áuke Mapu" → "Ñuke Mapu")
  ['Á',        'Ñ'],
  // Fix para los que ya quedaron con la Ñ borrada en la pasada anterior
  ['uke Mapu', 'Ñuke Mapu'],
]

function limpiar(str) {
  if (!str) return str
  let s = str
  for (const [from, to] of REEMPLAZOS) {
    if (s.includes(from)) s = s.split(from).join(to)
  }
  return s
}

const CAMPOS = ['nombre', 'bodega', 'varietal', 'proveedor_nombre']

async function main() {
  // Traer todos los productos paginando de a 1000
  console.log('Cargando productos de Supabase...')
  let todos = []
  let page = 0
  while (true) {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, bodega, varietal, proveedor_nombre')
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (error) { console.error('Error cargando:', error.message); process.exit(1) }
    if (!data?.length) break
    todos = todos.concat(data)
    if (data.length < 1000) break
    page++
  }
  console.log(`Total cargados: ${todos.length}`)

  // Detectar los que cambian
  const aActualizar = []
  let ejemplos = []

  for (const p of todos) {
    const cambios = {}
    for (const campo of CAMPOS) {
      const original = p[campo]
      const limpio = limpiar(original)
      if (limpio !== original) cambios[campo] = limpio
    }
    if (Object.keys(cambios).length > 0) {
      aActualizar.push({ id: p.id, ...cambios })
      if (ejemplos.length < 5) {
        ejemplos.push({ id: p.id, antes: Object.fromEntries(CAMPOS.filter(c => cambios[c]).map(c => [c, p[c]])), despues: cambios })
      }
    }
  }

  console.log(`\nProductos a actualizar: ${aActualizar.length}`)
  if (aActualizar.length === 0) { console.log('Nada que corregir.'); return }

  // Mostrar ejemplos antes de actualizar
  console.log('\nPrimeros ejemplos:')
  for (const e of ejemplos) {
    for (const campo of Object.keys(e.despues)) {
      console.log(`  [${campo}] "${e.antes[campo]}" → "${e.despues[campo]}"`)
    }
  }
  console.log()

  // Actualizar secuencialmente de a uno para evitar timeouts
  let ok = 0, err = 0
  for (const { id, ...cambios } of aActualizar) {
    const { error } = await supabase.from('productos').update(cambios).eq('id', id)
    if (error) { console.error(`  id=${id} error:`, error.message); err++ }
    else ok++
    if (ok % 50 === 0) console.log(`  ${ok}/${aActualizar.length} actualizados...`)
  }

  console.log('\n=== RESULTADO ===')
  console.log(`Actualizados OK:  ${ok}`)
  console.log(`Actualizados ERR: ${err}`)
}

main().catch(e => { console.error(e); process.exit(1) })
