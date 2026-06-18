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
  // ── 1. ELIMINAR todos los productos activos ──────────────────────────────
  console.log('Eliminando productos activos de ambas empresas...')
  let eliminados = 0
  let elimErr = 0

  for (const empresa of EMPRESAS) {
    const { error, count } = await supabase
      .from('productos')
      .delete({ count: 'exact' })
      .eq('empresa', empresa)
      .eq('activo', true)

    if (error) {
      console.error(`Error eliminando ${empresa}:`, error.message)
      elimErr++
    } else {
      console.log(`  ${empresa}: ${count ?? '?'} eliminados`)
      eliminados += count ?? 0
    }
  }

  // ── 2. IMPORTAR desde JSON ───────────────────────────────────────────────
  const jsonPath = join(__dirname, '..', 'productos_1187_con_precio.json')
  const source = JSON.parse(readFileSync(jsonPath, 'utf8'))
  console.log(`\nLeídos ${source.length} productos del JSON`)

  const registros = []
  for (const p of source) {
    for (const empresa of EMPRESAS) {
      registros.push({
        empresa,
        nombre: p.nombre,
        bodega: p.bodega || null,
        varietal: p.varietal || null,
        categoria: p.categoria || null,
        region: p.region || null,
        sku: p.sku || null,
        proveedor_nombre: p.proveedor_nombre || null,
        precio_venta: p.precio_venta ?? null,
        precio_costo: p.precio_costo ?? null,
        stock: p.stock ?? 0,
        stock_minimo: p.stock_minimo ?? 0,
        activo: true,
      })
    }
  }

  console.log(`Insertando ${registros.length} registros en lotes de ${BATCH}...`)
  let insertOk = 0
  let insertErr = 0

  for (let i = 0; i < registros.length; i += BATCH) {
    const lote = registros.slice(i, i + BATCH)
    const { error } = await supabase.from('productos').insert(lote)
    if (error) {
      console.error(`  Lote ${i}–${i + BATCH} error:`, error.message)
      insertErr += lote.length
    } else {
      insertOk += lote.length
    }
    if ((i / BATCH) % 10 === 9) console.log(`  ${insertOk} insertados...`)
  }

  // ── RESULTADO ────────────────────────────────────────────────────────────
  console.log('\n=== RESULTADO ===')
  console.log(`Eliminados OK:  ${eliminados}`)
  console.log(`Eliminados ERR: ${elimErr}`)
  console.log(`Insertados OK:  ${insertOk}`)
  console.log(`Insertados ERR: ${insertErr}`)
  console.log(`Total esperado: ${source.length * 2}`)
}

main().catch(e => { console.error(e); process.exit(1) })
