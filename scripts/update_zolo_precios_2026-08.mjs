// Actualización de precios Bodega Zolo (+ Solou) — lista nueva Ñuke Mapu, ago 2026.
// Mismo patrón que scripts/update_tapiz_precios_2026-08.mjs: update-si-existe /
// insert-si-no-existe por (empresa, nombre), sin depender de ON CONFLICT (la tabla
// no tiene esa unique constraint).
//
// Uso: node scripts/update_zolo_precios_2026-08.mjs           (dry-run)
//      node scripts/update_zolo_precios_2026-08.mjs --apply   (aplica de verdad)

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const text = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
  const env = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnvLocal();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const APPLY = process.argv.includes('--apply');
const EMPRESAS = ['aroma', 'lavid'];

// Productos existentes: solo cambia precio_venta (se preserva precio_costo/sku/etc.
// actuales). `nombreNuevo`/`categoriaNueva` solo en el caso de Zolo Zero Malbec (rename).
const updates = [
  { nombre: 'Zolo Black Cabernet Franc', precio_venta: 60500 },
  { nombre: 'Zolo Black Malbec', precio_venta: 60500 },
  { nombre: 'Zolo Black Petit Verdot', precio_venta: 60500 },
  { nombre: 'Zolo Bonarda', precio_venta: 15000 },
  { nombre: 'Zolo Cabernet Sauvignon', precio_venta: 15000 },
  { nombre: 'Zolo Malbec', precio_venta: 15000 },
  { nombre: 'Zolo Red Blend', precio_venta: 15000 },
  { nombre: 'Zolo Reserva Cabernet Franc', precio_venta: 21300 },
  { nombre: 'Zolo Reserva Cabernet Sauvignon', precio_venta: 21300 },
  { nombre: 'Zolo Reserva Malbec', precio_venta: 21300 },
  { nombre: 'Zolo Sauvignon Blanc', precio_venta: 15000 },
  { nombre: 'Zolo Torrontes', precio_venta: 15000 },
  { nombre: 'Zolo White Blend', precio_venta: 15000 },
  { nombre: 'Zolo Zero Malbec', precio_venta: 15750, nombreNuevo: 'Zolo Zero Malbec Rosé', categoriaNueva: 'Rosado' },
];

// Productos nuevos: no existen todavía, se insertan completos.
const nuevos = [
  { nombre: 'Zolo Zero Espumante Rosé', bodega: 'Zolo', varietal: 'Espumante', categoria: 'Espumante', precio_venta: 23800, precio_costo: 11900 },
  { nombre: 'Solou Malbec Rosé', bodega: 'Solou', varietal: 'Malbec', categoria: 'Rosado', precio_venta: 15750, precio_costo: 7875 },
];

async function main() {
  const nombresExistentes = updates.map(u => u.nombre);
  const { data: existentes, error: fetchErr } = await supabase
    .from('productos')
    .select('id,empresa,nombre,categoria')
    .in('empresa', EMPRESAS)
    .in('nombre', nombresExistentes);

  if (fetchErr) { console.error('Error leyendo productos:', fetchErr); process.exit(1); }

  const map = new Map(existentes.map(p => [`${p.empresa}|${p.nombre}`, p]));
  const toUpdate = [];
  const noEncontrados = [];

  for (const empresa of EMPRESAS) {
    for (const u of updates) {
      const prev = map.get(`${empresa}|${u.nombre}`);
      if (!prev) { noEncontrados.push(`${empresa}|${u.nombre}`); continue }
      const fields = { precio_venta: u.precio_venta };
      if (u.nombreNuevo) fields.nombre = u.nombreNuevo;
      if (u.categoriaNueva) fields.categoria = u.categoriaNueva;
      toUpdate.push({ id: prev.id, empresa, nombreOriginal: u.nombre, fields });
    }
  }

  const toInsert = [];
  for (const empresa of EMPRESAS) {
    for (const n of nuevos) {
      toInsert.push({
        empresa, nombre: n.nombre, bodega: n.bodega, varietal: n.varietal, categoria: n.categoria,
        precio_venta: n.precio_venta, precio_costo: n.precio_costo, sku: null, codigo_barras: null,
        stock: 0, stock_minimo: 0, activo: true,
      });
    }
  }

  console.log(`${toUpdate.length} filas a actualizar, ${toInsert.length} filas nuevas a insertar.`);
  if (noEncontrados.length) console.log('NO encontrados (se omiten):', noEncontrados);

  if (!APPLY) {
    console.log('Dry-run (no se escribió nada). Ejecutá con --apply para aplicar de verdad.');
    console.log('Ejemplo update:', JSON.stringify(toUpdate[0], null, 2));
    console.log('Ejemplo insert:', JSON.stringify(toInsert[0], null, 2));
    return;
  }

  let updated = 0;
  const errors = [];
  for (const row of toUpdate) {
    const { error } = await supabase.from('productos').update(row.fields).eq('id', row.id);
    if (error) errors.push({ nombre: row.nombreOriginal, empresa: row.empresa, error });
    else updated++;
  }

  let inserted = 0;
  if (toInsert.length) {
    const { data, error } = await supabase.from('productos').insert(toInsert).select('id');
    if (error) errors.push({ batch: 'insert', error });
    else inserted = data.length;
  }

  console.log(`OK: ${updated} actualizados, ${inserted} insertados.`);
  if (errors.length) { console.error('ERRORES:', JSON.stringify(errors, null, 2)); process.exit(1); }
}

main();
