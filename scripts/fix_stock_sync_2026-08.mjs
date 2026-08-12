// Ya se corrió una vez (ago 2026): igualó 28 productos desincronizados y
// creó 14 contrapartes faltantes. Queda documentado para referencia — no
// hace falta volver a correrlo salvo que reaparezca el mismo síntoma
// (usar scripts/check_stock_sync.mjs para verificar el estado actual).
//
// Corrige el stock compartido entre aroma y lavid que quedó desincronizado.
// Causa raíz: scripts/reconciliacion_stock_presupuestos_2026-08.mjs restó lo
// vendido por presupuesto a cada lado (aroma/lavid) POR SEPARADO, partiendo
// del stock que cada lado ya tenía en ese momento (no forzaba que coincidan).
// Como los dos lados no arrancaban iguales, el resultado tampoco.
//
// Esta corrección:
//  1) Para productos con contraparte pero stock distinto -> iguala ambos al
//     mayor de los dos (asume que el lado más bajo llegó a 0 por el "floor"
//     de la reconciliación, no porque efectivamente se vendió más ahí).
//  2) Para productos sin contraparte -> crea la fila que falta en la otra
//     empresa (mismo patrón que el sync de /api/productos POST).
//
// Uso: node scripts/fix_stock_sync_2026-08.mjs           (dry-run)
//      node scripts/fix_stock_sync_2026-08.mjs --apply   (aplica)

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const APPLY = process.argv.includes('--apply')

async function fetchAll(empresa) {
  const PAGE = 1000
  let all = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, stock, activo, empresa, precio_venta, precio_costo, varietal, bodega, categoria, proveedor_nombre, codigo_barras, sku, stock_minimo, unidad_medida')
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
const lavidPorNombre = new Map(lavid.map(p => [p.nombre, p]))
const aromaPorNombre = new Map(aroma.map(p => [p.nombre, p]))

// dedupe: si hay nombres duplicados de un lado, salteamos (no sabemos con cuál emparejar)
const dupLavid = new Set()
{ const c = new Map(); for (const p of lavid) c.set(p.nombre, (c.get(p.nombre) || 0) + 1); for (const [n, v] of c) if (v > 1) dupLavid.add(n) }
const dupAroma = new Set()
{ const c = new Map(); for (const p of aroma) c.set(p.nombre, (c.get(p.nombre) || 0) + 1); for (const [n, v] of c) if (v > 1) dupAroma.add(n) }

let igualados = 0, creados = 0, salteadosPorDup = 0
const log = []

for (const p of aroma) {
  if (dupAroma.has(p.nombre) || dupLavid.has(p.nombre)) { if (dupAroma.has(p.nombre)) salteadosPorDup++; continue }
  const contra = lavidPorNombre.get(p.nombre)
  if (!contra) {
    // crear contraparte en lavid
    const nueva = {
      empresa: 'lavid', nombre: p.nombre, activo: true,
      precio_venta: p.precio_venta, precio_costo: p.precio_costo, stock: p.stock,
      varietal: p.varietal, bodega: p.bodega, categoria: p.categoria,
      proveedor_nombre: p.proveedor_nombre, codigo_barras: p.codigo_barras, sku: p.sku,
      stock_minimo: p.stock_minimo, unidad_medida: p.unidad_medida,
    }
    log.push(`CREAR en lavid: ${p.nombre} (stock ${p.stock})`)
    creados++
    if (APPLY) {
      const { error } = await supabase.from('productos').insert([nueva])
      if (error) console.error('  error creando', p.nombre, error.message)
    }
    continue
  }
  if (contra.stock !== p.stock) {
    const nuevo = Math.max(p.stock, contra.stock)
    log.push(`IGUALAR: ${p.nombre} — aroma=${p.stock} lavid=${contra.stock} -> ambos=${nuevo}`)
    igualados++
    if (APPLY) {
      if (p.stock !== nuevo) await supabase.from('productos').update({ stock: nuevo }).eq('id', p.id)
      if (contra.stock !== nuevo) await supabase.from('productos').update({ stock: nuevo }).eq('id', contra.id)
    }
  }
}

// lavid sin contraparte en aroma
for (const p of lavid) {
  if (dupLavid.has(p.nombre) || dupAroma.has(p.nombre)) continue
  if (aromaPorNombre.has(p.nombre)) continue
  const nueva = {
    empresa: 'aroma', nombre: p.nombre, activo: true,
    precio_venta: p.precio_venta, precio_costo: p.precio_costo, stock: p.stock,
    varietal: p.varietal, bodega: p.bodega, categoria: p.categoria,
    proveedor_nombre: p.proveedor_nombre, codigo_barras: p.codigo_barras, sku: p.sku,
    stock_minimo: p.stock_minimo, unidad_medida: p.unidad_medida,
  }
  log.push(`CREAR en aroma: ${p.nombre} (stock ${p.stock})`)
  creados++
  if (APPLY) {
    const { error } = await supabase.from('productos').insert([nueva])
    if (error) console.error('  error creando', p.nombre, error.message)
  }
}

console.log(log.join('\n'))
console.log(`\n${APPLY ? 'APLICADO' : 'DRY-RUN'}: ${igualados} productos igualados, ${creados} contrapartes creadas, ${salteadosPorDup} salteados por nombre duplicado.`)
