// Carga precio de costo desde la lista Bouchee Bebidas S.R.L. (26/07/2026) para
// productos que estaban sin precio, aplicando 60% de margen sobre costo.
// precio_venta = round(costo * 1.6)

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://yjtiopfmokodgwxstijd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdGlvcGZtb2tvZGd3eHN0aWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTI3MDAsImV4cCI6MjA5NjY2ODcwMH0.7e_ACK4YubBiA4VuPLFistMvnWdIItjMG6QIhh40HUw'
)

const MARGEN = 1.6

// nombre EXACTO como está guardado en la tabla productos -> costo unitario (PU) de Bouchee
const MATCHES = {
  'Martini Rosso': 7400,
  'Martini Extra Dry': 10330,
  'Pineral': 9850,
  "Pimm'S N° 1": 13000,
  'Punt E Mes': 8345,
  'Glenfidisch': 138300,
  'Borghetti': 16650,
  'Tullamore D.E.W.': 47800,
  'Caol Ila 12 años': 115000,
  'Havana  3 años 750 Cc': 16140,
  'The Glenlivet 12 años': 84300,
  'Wild Turkey': 34780,
  'Wild Turkey Honey': 34780,
  'Sambucca Borghetti': 45000,
  'Cutty Sark': 26000,
  'Tambo Licor de Dulce de Leche': 28720,
  'Evan Williams Black': 43600,
  'Misterio Sweet Chardonnay': 2735,
  'The Famous Grouse': 40000,
  'Drambuie': 56000,
  'Makers Mark': 86400,
  'Disaronno': 45000,
  'Cointreau': 65000,
  'Hesperidina': 12840,
  'Finca Flichman Estate Chardo-Viog': 3180,
}

let totalOk = 0
for (const [nombre, costo] of Object.entries(MATCHES)) {
  const venta = Math.round(costo * MARGEN)
  const { data, error } = await supabase
    .from('productos')
    .update({ precio_costo: costo, precio_venta: venta })
    .eq('nombre', nombre)
    .or('precio_venta.is.null,precio_venta.eq.0')
    .select('id,nombre,empresa')

  if (error) { console.error(`ERR "${nombre}":`, error.message); continue }
  console.log(`"${nombre}" -> costo $${costo} / venta $${venta} (${data.length} fila(s): ${data.map(d => d.empresa).join(', ')})`)
  totalOk += data.length
}

console.log(`\nTotal filas actualizadas: ${totalOk}`)
