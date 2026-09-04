import { supabase, WOO_URL, WOO_AUTH, loadProgress, saveProgress, buildTags, resolveCategories } from './_tanda3_lib.mjs'
import fs from 'fs'

const batchFile = process.argv[2]
if (!batchFile) { console.error('Uso: node _tanda3_process_batch.mjs <archivo.json>'); process.exit(1) }

const items = JSON.parse(fs.readFileSync(batchFile, 'utf8'))
const progress = loadProgress()

async function crearProductoWoo(payload) {
  const res = await fetch(`${WOO_URL}/wp-json/wc/v3/products`, {
    method: 'POST',
    headers: { Authorization: WOO_AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Woo create failed: ${res.status} ${JSON.stringify(data)}`)
  return data
}

async function main() {
  let ok = 0, err = 0
  for (const item of items) {
    if (progress[item.nombre] && progress[item.nombre].status !== 'error') {
      console.log(`SKIP (ya procesado): ${item.nombre}`)
      continue
    }
    try {
      const payload = {
        name: item.nombre.trim(),
        type: 'simple',
        status: 'publish',
        regular_price: String(item.precio),
        manage_stock: true,
        stock_quantity: item.stock || 0,
        stock_status: item.stock > 0 ? 'instock' : 'outofstock',
        description: item.descripcion,
        short_description: [item.varietal, item.categoria, item.bodega].filter(Boolean).join(' | '),
        categories: resolveCategories(item),
        tags: buildTags({ bodega: item.bodega, varietal: item.varietal, categoria: item.categoria, extra: item.extraTags || [] }),
        images: item.imagen ? [{ src: item.imagen }] : [],
      }
      const created = await crearProductoWoo(payload)
      console.log(`OK creado: ${item.nombre} -> woo id ${created.id}${item.imagen ? '' : ' (SIN IMAGEN)'}`)

      const idsGroups = [item.ids, ...(item.extraIds || [])]
      const linkResults = []
      for (const idsMap of idsGroups) {
        for (const empresa of ['aroma', 'lavid']) {
          const id = idsMap[empresa]
          if (!id) continue
          const campos = { woo_product_id: created.id }
          if (item.fixSupabaseCategoria) campos.categoria = item.fixSupabaseCategoria
          if (item.fixSupabaseBodega) campos.bodega = item.fixSupabaseBodega
          if (item.fixSupabaseVarietal) campos.varietal = item.fixSupabaseVarietal
          const { error } = await supabase.from('productos').update(campos).eq('id', id)
          if (error) console.error(`  supabase ${empresa} ${id} ERROR:`, error.message)
          linkResults.push(`${empresa}:${id}:${error ? 'ERR' : 'ok'}`)
        }
      }

      progress[item.nombre] = { status: 'creado', woo_id: created.id, tiene_imagen: !!item.imagen, linked: linkResults, fecha: new Date().toISOString() }
      ok++
    } catch (e) {
      console.error(`ERROR: ${item.nombre}:`, e.message)
      progress[item.nombre] = { status: 'error', error: e.message, fecha: new Date().toISOString() }
      err++
    }
    saveProgress(progress)
  }
  console.log(`\n=== Batch ${batchFile}: OK=${ok} ERR=${err} ===`)
}

main().catch(e => { console.error(e); process.exit(1) })
