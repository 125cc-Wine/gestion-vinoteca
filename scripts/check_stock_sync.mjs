// Diagnóstico: ¿el stock está sincronizado entre aroma y lavid?
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function fetchAll(empresa) {
  const PAGE = 1000
  let all = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, stock, activo, empresa')
      .eq('empresa', empresa)
      .eq('activo', true)
      .range(from, from + PAGE - 1)
    if (error) { console.error(error); process.exit(1) }
    all = all.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

const aroma = await fetchAll('aroma')
const lavid = await fetchAll('lavid')

console.log(`aroma activos: ${aroma.length}, lavid activos: ${lavid.length}`)

const lavidPorNombre = new Map(lavid.map(p => [p.nombre, p]))
const aromaPorNombre = new Map(aroma.map(p => [p.nombre, p]))

let sinContraparte = 0
let contraparteDuplicada = 0
let stockDistinto = 0
const ejemplosSinContraparte = []
const ejemplosStockDistinto = []

for (const p of aroma) {
  const contra = lavidPorNombre.get(p.nombre)
  if (!contra) {
    sinContraparte++
    if (ejemplosSinContraparte.length < 15) ejemplosSinContraparte.push(p.nombre)
    continue
  }
  if (contra.stock !== p.stock) {
    stockDistinto++
    if (ejemplosStockDistinto.length < 20) ejemplosStockDistinto.push(`${p.nombre}: aroma=${p.stock} lavid=${contra.stock}`)
  }
}

// contraparte duplicada (mismo nombre repetido en lavid)
const countLavidNombre = new Map()
for (const p of lavid) countLavidNombre.set(p.nombre, (countLavidNombre.get(p.nombre) || 0) + 1)
const duplicadosLavid = [...countLavidNombre.entries()].filter(([, c]) => c > 1)
const countAromaNombre = new Map()
for (const p of aroma) countAromaNombre.set(p.nombre, (countAromaNombre.get(p.nombre) || 0) + 1)
const duplicadosAroma = [...countAromaNombre.entries()].filter(([, c]) => c > 1)

console.log(`\nProductos de aroma SIN contraparte en lavid (por nombre exacto): ${sinContraparte}`)
console.log(ejemplosSinContraparte.map(n => '  - ' + n).join('\n'))

console.log(`\nProductos con contraparte pero STOCK DISTINTO: ${stockDistinto}`)
console.log(ejemplosStockDistinto.map(n => '  - ' + n).join('\n'))

console.log(`\nNombres duplicados en lavid (podrían romper el .single() del sync): ${duplicadosLavid.length}`)
console.log(duplicadosLavid.slice(0, 15).map(([n, c]) => `  - ${n} (${c})`).join('\n'))

console.log(`\nNombres duplicados en aroma: ${duplicadosAroma.length}`)
console.log(duplicadosAroma.slice(0, 15).map(([n, c]) => `  - ${n} (${c})`).join('\n'))

// lavid sin contraparte en aroma
let sinContraparteLavid = 0
for (const p of lavid) {
  if (!aromaPorNombre.has(p.nombre)) sinContraparteLavid++
}
console.log(`\nProductos de lavid SIN contraparte en aroma: ${sinContraparteLavid}`)
