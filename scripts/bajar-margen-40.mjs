// Recalcula precio_venta = precio_costo * 1.4 (bajado de 1.6) para los productos
// que se acaban de cargar desde la lista Bouchee.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://yjtiopfmokodgwxstijd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdGlvcGZtb2tvZGd3eHN0aWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTI3MDAsImV4cCI6MjA5NjY2ODcwMH0.7e_ACK4YubBiA4VuPLFistMvnWdIItjMG6QIhh40HUw'
)

const NOMBRES = [
  'Martini Rosso', 'Martini Extra Dry', 'Pineral', "Pimm'S N° 1", 'Punt E Mes',
  'Glenfidisch', 'Borghetti', 'Tullamore D.E.W.', 'Caol Ila 12 años',
  'Havana  3 años 750 Cc', 'The Glenlivet 12 años', 'Wild Turkey', 'Wild Turkey Honey',
  'Sambucca Borghetti', 'Cutty Sark', 'Tambo Licor de Dulce de Leche',
  'Evan Williams Black', 'Misterio Sweet Chardonnay', 'The Famous Grouse', 'Drambuie',
  'Makers Mark', 'Disaronno', 'Cointreau', 'Hesperidina', 'Finca Flichman Estate Chardo-Viog',
]

let total = 0
for (const nombre of NOMBRES) {
  const { data: rows, error: e1 } = await supabase.from('productos')
    .select('id,empresa,precio_costo').eq('nombre', nombre)
  if (e1) { console.error(`ERR leyendo "${nombre}":`, e1.message); continue }

  for (const r of rows) {
    const venta = Math.round(r.precio_costo * 1.4)
    const { error: e2 } = await supabase.from('productos').update({ precio_venta: venta }).eq('id', r.id)
    if (e2) { console.error(`ERR "${nombre}" (${r.empresa}):`, e2.message); continue }
    total++
  }
  console.log(`"${nombre}" -> costo $${rows[0]?.precio_costo} / venta $${Math.round((rows[0]?.precio_costo || 0) * 1.4)}`)
}

console.log(`\nTotal filas actualizadas: ${total}`)
