// Desactiva el duplicado de "Trivento Reserve Malbec 375cc." (SKU 12028)
// que quedó con precio viejo ($2000, sin stock, sin ventas) y deja como
// único activo el par que se usa realmente ($6000, referenciado en
// PRES-000137).
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const APPLY = process.argv.includes('--apply')

const idsADesactivar = [
  'b77e74d7-e109-4ab6-acb8-397cd771422c', // aroma, $2000
  'e2394f51-1c62-482a-80a5-cf22a79a507f', // lavid, $2000
]

if (!APPLY) {
  console.log('DRY-RUN: desactivaría', idsADesactivar)
} else {
  for (const id of idsADesactivar) {
    const { error } = await supabase.from('productos').update({ activo: false }).eq('id', id)
    if (error) console.error('error', id, error.message)
    else console.log('desactivado', id)
  }
}
