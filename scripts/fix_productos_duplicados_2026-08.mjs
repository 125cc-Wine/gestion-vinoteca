// Desactiva 31 filas de productos duplicados (mismo vino cargado 2 veces con
// nombre distinto: reimportaciones, variantes de encoding sin "Ú"/"Í", orden
// de palabras invertido, o reimport con datos incompletos). Nunca se borra
// nada — mismo patrón que fix_trivento_dup.mjs. La fila que queda activa en
// cada par ya tiene el precio/stock correcto, no hace falta tocarla.
//
// Detalle de cada par (qué queda activo / qué se desactiva y por qué) en la
// conversación de Claude Code del 2026-08-27.
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const APPLY = process.argv.includes('--apply')

const idsADesactivar = [
  ['4ff10ca5-9da5-4bd7-ae71-709310ee2e4a', 'aroma Fuego Blanco Gewürztraminer (nombre con encoding roto)'],
  ['3529f8a8-c43a-429b-a96a-2e0c80e6f14e', 'lavid Fuego Blanco Gewürztraminer (nombre con encoding roto)'],
  ['d595467f-3b7f-49ef-b978-d516f0f91f98', 'lavid La Flor Brut Nature (sin bodega)'],
  ['f8e7bd8a-54bb-4197-8296-794b75936da4', 'aroma Trivento Golden Rva Cab Franc (sin sku)'],
  ['0f862ca4-f486-4305-ab2f-cd13e8fc2187', 'aroma Yzaguirre Reserva 1884 (reimport 26/ago, se queda la del 12/ago)'],
  ['c433b59e-9e72-4d53-aa44-5d2d58c5da05', 'aroma La Flor Brut Nature (sin bodega)'],
  ['4743e379-d2bf-4fda-9eb1-eeab6716ffc0', 'aroma Nomad Whisky (stock 1, se queda la de stock 2)'],
  ['f27592b9-861f-4be9-8765-507757ec8cdb', 'lavid Pasión 4 Malbec Joffre ($14.200 sin sku, se queda $14.300 con sku)'],
  ['bfc66467-7aa1-4daf-85d0-743621ef8a05', 'lavid Trivento Golden Rva Cab Franc (sin sku)'],
  ['29ecfd7d-eb84-426c-9176-c150506c0cc4', 'aroma Pasión 4 Malbec Joffre ($14.200 sin sku, se queda $14.300 con sku)'],
  ['1d4ebbf6-d6dd-4015-873e-349ecea5487a', 'aroma Bad Brothers Tovio (variante "A. Lanús")'],
  ['b37e9a00-d4ad-4f4f-863c-79861a3777f6', 'lavid Bad Brothers Tovio (variante "A. Lanús")'],
  ['79c5fbd1-9673-4d7e-8c1f-42626cd0208a', 'aroma Alta Vista Chardonnay (orden de palabras invertido)'],
  ['d26a2b3b-2531-409c-90cf-c27982a55ca4', 'lavid Alta Vista Chardonnay (orden de palabras invertido)'],
  ['b250bc99-de06-4000-85d6-d57cd6073b38', 'aroma Alpamanta Astral ("Alphamanta" typo, $20.500 vs $20.520)'],
  ['a90b16fe-e2b3-45e6-97c0-49ff0f841bfb', 'lavid Alpamanta Astral ("Alphamanta" typo, $20.500 vs $20.520)'],
  ['fca242cc-fd2c-481a-b5ea-773ff4688cb3', 'aroma La Fuerza Sideral Barrica Única (encoding roto, falta la Ú)'],
  ['648acf01-ec68-46cb-8934-f3593bec6595', 'lavid La Fuerza Sideral Barrica Única (encoding roto, falta la Ú)'],
  ['6dd90787-e1d2-491a-b1f3-9ece0333d007', 'aroma Zorzal Terroir Único Malbec (encoding roto, falta la Ú)'],
  ['7408f54f-9be5-45b7-ba30-c5259c79b7e0', 'lavid Zorzal Terroir Único Malbec (encoding roto, falta la Ú)'],
  ['c37a2a8e-3789-4197-890d-a218dd7510bd', 'aroma Zorzal Terroir Único Pinot Noir (encoding roto, falta la Ú)'],
  ['318a1a7f-ffc0-457f-9e19-0a45dcaf2beb', 'lavid Zorzal Terroir Único Pinot Noir (encoding roto, falta la Ú)'],
  ['02d67449-19c5-4466-af16-169c6e6971ff', 'aroma Altus Reserva Malbec (variante con sufijo "Gualtallary" redundante)'],
  ['d9fe326a-3336-4d2a-9038-78bd8341fbfc', 'aroma Pleno Cabernet Franc Cuarto Surco (stock 0, se queda la de stock 5)'],
  ['8525fd52-9f65-4cf5-9afc-ec3fd3ad43e1', 'lavid Pleno Cabernet Franc Cuarto Surco (stock 0, se queda la de stock 5)'],
  ['c989cfdf-3e76-4f4e-97f5-6f8749201c47', 'aroma Pleno Malbec Cuarto Surco (stock 0, se queda la de stock 1)'],
  ['62f2ac4c-ec07-4d58-9919-d4ae3f327e75', 'lavid Pleno Malbec Cuarto Surco (stock 0, se queda la de stock 1)'],
  ['8cc377ce-ba0c-4d5c-8bd8-6335647a4fdd', 'aroma Pleno Terroirs Blend Cuarto Surco (stock 0, se queda la de stock 7)'],
  ['dabf0823-24bd-45eb-8476-94fce9655e6c', 'lavid Pleno Terroirs Blend Cuarto Surco (stock 0, se queda la de stock 7)'],
  ['dbe64d0e-cf93-4d78-b405-4ec711ed8ac4', 'aroma Pleno Cabernet Suavignon Cuarto Surco ($17.900 precio viejo, se queda $21.900)'],
  ['5003e676-23f1-4d8e-ae63-fd3a640684ac', 'lavid Pleno Cabernet Suavignon Cuarto Surco ($17.900 precio viejo, se queda $21.900)'],
]

if (!APPLY) {
  console.log(`DRY-RUN: desactivaría ${idsADesactivar.length} productos:`)
  for (const [id, motivo] of idsADesactivar) console.log(` - ${id}  (${motivo})`)
} else {
  let ok = 0
  for (const [id, motivo] of idsADesactivar) {
    const { error } = await supabase.from('productos').update({ activo: false }).eq('id', id)
    if (error) console.error('error', id, error.message)
    else { ok++; console.log('desactivado', id, motivo) }
  }
  console.log(`\nListo: ${ok}/${idsADesactivar.length} desactivados.`)
}
