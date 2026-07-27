import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://yjtiopfmokodgwxstijd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdGlvcGZtb2tvZGd3eHN0aWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTI3MDAsImV4cCI6MjA5NjY2ODcwMH0.7e_ACK4YubBiA4VuPLFistMvnWdIItjMG6QIhh40HUw'
)
for (const emp of ['aroma', 'lavid']) {
  const { data, error } = await supabase.from('productos')
    .select('id,nombre,precio_venta,precio_costo,empresa,bodega')
    .eq('activo', true).eq('empresa', emp)
    .or('precio_venta.is.null,precio_venta.eq.0')
  if (error) { console.error(error); continue }
  console.log(`\n=== ${emp}: ${data.length} sin precio ===`)
  for (const p of data) console.log(`  ${p.nombre}`)
}
