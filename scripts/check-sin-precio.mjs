import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://yjtiopfmokodgwxstijd.supabase.co',
  process.env.SUPABASE_SECRET_KEY
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
