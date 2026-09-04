import fs from 'fs'
import { OVERRIDES } from './_tanda3_overrides.mjs'

const plan = JSON.parse(fs.readFileSync('scripts/_tanda3_plan.json', 'utf8'))

const missing = []
const composed = []
for (const it of plan.create) {
  const ov = OVERRIDES[it.nombre]
  if (!ov) { missing.push(it.nombre); continue }
  composed.push({
    nombre: it.nombre,
    bodega: ov.bodegaFix !== undefined ? ov.bodegaFix : it.bodega,
    varietal: ov.varietalFix || it.varietal,
    categoria: ov.categoriaFix || it.categoria,
    precio: it.precio,
    stock: it.stock,
    ids: it.ids,
    extraIds: it.extraIds || [],
    descripcion: ov.descripcion,
    imagen: null,
    fixSupabaseCategoria: ov.categoriaFix || null,
    fixSupabaseVarietal: ov.varietalFix || null,
    fixSupabaseBodega: ov.bodegaFix !== undefined ? ov.bodegaFix : null,
    extraTags: ov.extraTags || [],
  })
}

if (missing.length) {
  console.error('FALTAN OVERRIDES para', missing.length, 'items:')
  for (const m of missing) console.error('  -', m)
  process.exit(1)
}

console.log('Total composed:', composed.length)

const CHUNK = 20
let n = 0
for (let i = 0; i < composed.length; i += CHUNK) {
  n++
  const chunk = composed.slice(i, i + CHUNK)
  fs.writeFileSync(`scripts/_tanda3_batch_${String(n).padStart(2, '0')}.json`, JSON.stringify(chunk, null, 2))
  console.log(`Batch ${n}: ${chunk.length} items`)
}
