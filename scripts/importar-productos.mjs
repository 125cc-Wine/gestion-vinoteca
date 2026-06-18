import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://yjtiopfmokodgwxstijd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdGlvcGZtb2tvZGd3eHN0aWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTI3MDAsImV4cCI6MjA5NjY2ODcwMH0.7e_ACK4YubBiA4VuPLFistMvnWdIItjMG6QIhh40HUw'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const BATCH = 50
const EMPRESAS = ['aroma', 'lavid']

async function main() {
  const jsonPath = join(__dirname, '..', 'productos_con_precio.json')
  const source = JSON.parse(readFileSync(jsonPath, 'utf8'))
  console.log(`Leídos ${source.length} productos del JSON`)

  // Traer todos los productos existentes (id, nombre, empresa)
  console.log('Cargando productos existentes de Supabase...')
  let existentes = []
  let page = 0
  while (true) {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, empresa')
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (error) { console.error('Error leyendo existentes:', error.message); process.exit(1) }
    if (!data || data.length === 0) break
    existentes = existentes.concat(data)
    if (data.length < 1000) break
    page++
  }
  console.log(`Existentes en Supabase: ${existentes.length}`)

  // Mapa nombre|empresa -> { id, empresa }
  const mapa = new Map(existentes.map(p => [`${p.nombre}|${p.empresa}`, { id: p.id, empresa: p.empresa }]))

  const insertar = []
  const actualizar = []

  for (const p of source) {
    for (const empresa of EMPRESAS) {
      const key = `${p.nombre}|${empresa}`
      const campos = {
        precio_venta: p.precio_venta,
        precio_costo: p.precio_costo,
        varietal: p.varietal || null,
        proveedor_nombre: p.proveedor_nombre || p.proveedor || null,
        bodega: p.bodega || null,
      }
      if (mapa.has(key)) {
        const { id, empresa: emp } = mapa.get(key)
        actualizar.push({ id, empresa: emp, ...campos })
      } else {
        insertar.push({
          empresa,
          nombre: p.nombre,
          stock: 0,
          activo: true,
          ...campos,
        })
      }
    }
  }

  console.log(`A insertar: ${insertar.length} | A actualizar: ${actualizar.length}`)

  // Insertar en lotes de 50
  let insertOk = 0, insertErr = 0
  for (let i = 0; i < insertar.length; i += BATCH) {
    const lote = insertar.slice(i, i + BATCH)
    const { error } = await supabase.from('productos').insert(lote)
    if (error) {
      console.error(`Lote insert ${i}-${i + BATCH} error:`, error.message)
      insertErr += lote.length
    } else {
      insertOk += lote.length
    }
    if (i % 500 === 0 && i > 0) console.log(`  Insertados: ${insertOk}...`)
  }

  // Actualizar en lotes de 50 (update por id)
  let updateOk = 0, updateErr = 0
  for (let i = 0; i < actualizar.length; i += BATCH) {
    const lote = actualizar.slice(i, i + BATCH)
    await Promise.all(lote.map(async ({ id, empresa: _e, ...campos }) => {
      const { error } = await supabase.from('productos').update(campos).eq('id', id)
      if (error) {
        console.error(`Update id=${id} error:`, error.message)
        updateErr++
      } else {
        updateOk++
      }
    }))
    if (i % 500 === 0 && i > 0) console.log(`  Actualizados: ${updateOk}...`)
  }

  console.log('\n=== RESULTADO ===')
  console.log(`Insertados OK:   ${insertOk}`)
  console.log(`Insertados ERR:  ${insertErr}`)
  console.log(`Actualizados OK: ${updateOk}`)
  console.log(`Actualizados ERR:${updateErr}`)
  console.log(`Total procesados: ${insertOk + insertErr + updateOk + updateErr} / ${source.length * 2}`)
}

main().catch(e => { console.error(e); process.exit(1) })
