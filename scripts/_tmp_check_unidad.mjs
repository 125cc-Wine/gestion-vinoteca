import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const { data: prods } = await supabase.from('productos').select('id,empresa,nombre,unidad_medida,stock').ilike('nombre', '%alta vista%pinot noir%')
console.log('=== unidad_medida del producto ===')
for (const p of prods) console.log(`[${p.empresa}] "${p.nombre}" unidad_medida="${p.unidad_medida}" stock=${p.stock}`)

const { data: compra } = await supabase.from('compras').select('*').eq('numero','DEU-00002').eq('empresa','aroma').single()
console.log('\n=== Item exacto de la compra DEU-00002 ===')
console.log(JSON.stringify(compra.items, null, 2))

// Contar cuantos productos en general tienen unidad_medida distinta de "botella"/null
const { data: all } = await supabase.from('productos').select('unidad_medida').eq('activo', true)
const porUnidad = {}
for (const p of all) porUnidad[p.unidad_medida||'null/botella'] = (porUnidad[p.unidad_medida||'null/botella']||0)+1
console.log('\n=== Distribucion de unidad_medida en todo el catalogo activo ===')
console.log(porUnidad)
