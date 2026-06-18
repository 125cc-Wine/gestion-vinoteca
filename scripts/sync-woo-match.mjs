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
  const source = JSON.parse(readFileSync(join(__dirname, '..', 'woo_match_para_supabase.json'), 'utf8'))
  console.log(`Leídos ${source.length} productos del JSON`)

  // Traer todos los productos de ambas empresas (id, nombre, empresa, bodega, varietal)
  console.log('Cargando productos de Supabase...')
  let existentes = []
  let page = 0
  while (true) {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, empresa, bodega, varietal')
      .in('empresa', EMPRESAS)
      .eq('activo', true)
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (error) { console.error('Error cargando productos:', error.message); process.exit(1) }
    if (!data || data.length === 0) break
    existentes = existentes.concat(data)
    if (data.length < 1000) break
    page++
  }
  console.log(`Productos en Supabase: ${existentes.length}`)

  // Mapa nombre|empresa -> { id, bodega, varietal }
  const mapa = new Map(existentes.map(p => [`${p.nombre}|${p.empresa}`, p]))

  // Armar lista de updates
  const updates = []
  let sinMatch = 0

  for (const item of source) {
    for (const empresa of EMPRESAS) {
      const key = `${item.nombre}|${empresa}`
      const prod = mapa.get(key)
      if (!prod) { sinMatch++; continue }

      const cambios = {
        woo_product_id: item.woo_product_id,
        precio_venta: item.precio_venta,
      }
      // bodega y varietal solo si están vacíos en Supabase
      if (!prod.bodega && item.bodega) cambios.bodega = item.bodega
      if (!prod.varietal && item.varietal) cambios.varietal = item.varietal

      updates.push({ id: prod.id, ...cambios })
    }
  }

  console.log(`Updates a aplicar: ${updates.length} | Sin match: ${sinMatch}`)

  // Actualizar en lotes de 50
  let ok = 0, err = 0
  for (let i = 0; i < updates.length; i += BATCH) {
    const lote = updates.slice(i, i + BATCH)
    await Promise.all(lote.map(async ({ id, ...campos }) => {
      const { error } = await supabase.from('productos').update(campos).eq('id', id)
      if (error) { console.error(`  id=${id} error:`, error.message); err++ }
      else ok++
    }))
    if ((i / BATCH) % 10 === 9) console.log(`  ${ok} actualizados...`)
  }

  console.log('\n=== RESULTADO ===')
  console.log(`Actualizados OK:  ${ok}`)
  console.log(`Actualizados ERR: ${err}`)
  console.log(`Sin match en DB:  ${sinMatch} (${sinMatch / EMPRESAS.length} productos × 2 empresas)`)
}

main().catch(e => { console.error(e); process.exit(1) })
