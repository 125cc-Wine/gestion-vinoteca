import { supabase, loadProgress, saveProgress } from './_tanda3_lib.mjs'
import fs from 'fs'

const plan = JSON.parse(fs.readFileSync('scripts/_tanda3_plan.json', 'utf8'))
const data = JSON.parse(fs.readFileSync('scripts/_tanda3_crear.json', 'utf8'))
const byName = {}
for (const it of data) byName[it.nombre] = it

const progress = loadProgress()

async function linkIds(idsMap, wooId) {
  const out = []
  for (const empresa of ['aroma', 'lavid']) {
    const id = idsMap[empresa]
    if (!id) continue
    const { error } = await supabase.from('productos').update({ woo_product_id: wooId }).eq('id', id)
    out.push(`${empresa}:${id}:${error ? 'ERROR ' + error.message : 'ok'}`)
  }
  return out
}

async function main() {
  // LINK
  for (const l of plan.link) {
    for (const nombre of l.items) {
      if (progress[nombre]) { console.log('SKIP ya procesado:', nombre); continue }
      const it = byName[nombre]
      const res = await linkIds(it.ids, l.woo_id)
      console.log('LINK', nombre, '-> woo', l.woo_id, res)
      progress[nombre] = { status: 'linkeado', woo_id: l.woo_id, reason: l.reason, detalle: res, fecha: new Date().toISOString() }
      saveProgress(progress)
    }
  }

  // suspicious: just log, no woo action
  for (const s of plan.suspicious) {
    if (progress[s.nombre]) { console.log('SKIP ya procesado:', s.nombre); continue }
    progress[s.nombre] = { status: 'sospechoso-revisar', motivo: s.motivo, fecha: new Date().toISOString() }
    saveProgress(progress)
    console.log('SOSPECHOSO', s.nombre)
  }

  console.log('\nLink + suspicious done.')
}

main().catch(e => { console.error(e); process.exit(1) })
