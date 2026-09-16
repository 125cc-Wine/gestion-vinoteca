// Backfill único: calcula monto_iva (21%, sobre el total) para compras
// cargadas ANTES de que el formulario empezara a guardarlo por separado (ver
// sql/2026-09-compras-iva.sql), pero solo para las que tienen un número de
// factura con formato de comprobante AFIP real (ptovta-nrocomprobante) — no
// se les aplica a las que tienen un número de factura simple/no estándar
// (podrían ser de un monotributista sin IVA, o una referencia informal), esas
// quedan para revisión manual.
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://yjtiopfmokodgwxstijd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdGlvcGZtb2tvZGd3eHN0aWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTI3MDAsImV4cCI6MjA5NjY2ODcwMH0.7e_ACK4YubBiA4VuPLFistMvnWdIItjMG6QIhh40HUw'
)

const AFIP_FMT = /^[A-Za-z]?\d{1,5}-\d{5,8}$/

const { data, error } = await supabase
  .from('compras')
  .select('id, empresa, numero, nro_factura, proveedor_nombre, total, monto_iva')
if (error) { console.error(error); process.exit(1) }

const candidatas = data.filter(c => c.monto_iva == null && c.nro_factura && AFIP_FMT.test(c.nro_factura.trim()))
const revisar = data.filter(c => c.monto_iva == null && c.nro_factura && !AFIP_FMT.test(c.nro_factura.trim()))

console.log(`Actualizando ${candidatas.length} compras...`)
for (const c of candidatas) {
  const neto = Math.round((c.total / 1.21) * 100) / 100
  const iva = Math.round((c.total - neto) * 100) / 100
  const { error: upErr } = await supabase.from('compras').update({ monto_iva: iva }).eq('id', c.id)
  if (upErr) console.error(`  ERROR ${c.numero}:`, upErr.message)
  else console.log(`  OK ${c.numero} (${c.empresa}) — IVA $${iva} (de un total de $${c.total})`)
}

console.log(`\nSin tocar (número de factura no estándar, requieren revisión manual): ${revisar.length}`)
for (const c of revisar) {
  console.log(`  ${c.numero} (${c.empresa}) proveedor="${c.proveedor_nombre}" factura="${c.nro_factura}" total=$${c.total}`)
}
