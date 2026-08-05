// Aplica la actualización de precios Tapiz (ago 2026) directo vía supabase-js,
// evitando el SQL Editor (el paste de ahí venía cortando el texto).
// Mismo efecto que update_tapiz_precios_2026-08.sql:
//  - Actualiza precio_venta / bodega / varietal / categoria de los 28 productos existentes.
//  - NO pisa precio_costo, sku, codigo_barras, stock, stock_minimo de los existentes.
//  - Da de alta los 5 productos nuevos con sus valores completos.
//
// Uso: node scripts/update_tapiz_precios_2026-08.mjs           (dry-run, no escribe nada)
//      node scripts/update_tapiz_precios_2026-08.mjs --apply   (escribe de verdad)

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const path = join(__dirname, '..', '.env.local');
  const text = readFileSync(path, 'utf-8');
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

// [empresa, nombre, bodega, varietal, categoria, precio_venta, precio_costo_default, sku, codigo_barras]
const rows = [
  ['Tapiz Malbec','Tapiz','Malbec','Tinto',17200,1000,'2714','7798116200034'],
  ['Tapiz Cabernet Sauvignon','Tapiz','Cabernet Sauvignon','Tinto',17200,1000,'2717','7798116200010'],
  ['Tapiz Merlot','Tapiz','Merlot','Tinto',17200,1000,'2715','7798116200041'],
  ['Tapiz Syrah','Tapiz','Syrah','Tinto',17200,1000,'2736','7798116200362'],
  ['Tapiz Pinot Noir','Tapiz','Pinot Noir','Tinto',17200,1000,'2747','7798116200508'],
  ['Tapiz Bonarda','Tapiz','Bonarda','Tinto',17200,1000,'2756',null],
  ['Tapiz Reserva Malbec','Tapiz','Malbec','Tinto',22800,1500,'2719','7798116200157'],
  ['Tapiz Reserva Cabernet Sauvignon','Tapiz','Cabernet Sauvignon','Tinto',22800,1500,'2777','7798116200171'],
  ['Tapiz Reserva Merlot','Tapiz','Merlot','Tinto',22800,1500,'2743','7798116200164'],
  ['Tapiz Reserva Cabernet Merlot','Tapiz','Blend','Tinto',21720,1500,'2737','7798116200188'],
  ['Tapiz Alta Collection Malbec','Tapiz','Malbec','Tinto',24000,1600,'2738','859481003402'],
  ['Tapiz Alta Collection Cabernet Sauvignon','Tapiz','Cabernet Sauvignon','Tinto',24000,1600,'2739','859481003419'],
  ['Tapiz Alta Collection Cabernet Franc','Tapiz','Cabernet Franc','Tinto',24000,1600,'2759','7798116201451'],
  ['Tapiz Malbec Orgánico','Tapiz','Malbec','Tinto',18000,1500,'2763',null],
  ['Tapiz Seleccion de Barricas','Tapiz','Blend','Tinto',44320,3600,'2718','7798116200423'],
  ['Tapiz Black Tears','Tapiz','Blend','Tinto',97000,6000,'2735',null],
  ['Tapiz Black Tears 1,5 Lts.','Tapiz','Malbec','Tinto',97000,12000,'2761',null],
  ['Tapiz Las Notas de J.C.','Tapiz','Merlot','Tinto',110000,9000,'2748','7798116201154'],
  ['Tapiz Sauvignon Blanc','Tapiz','Sauvignon Blanc','Blanco',17200,1000,'2716','7798116200058'],
  ['Tapiz Torrontes','Tapiz','Torrontes','Blanco',17200,1000,'2749','7798116200133'],
  ['Tapiz Chardonnay','Tapiz','Chardonnay','Blanco',17200,1000,'2753',null],
  ['Tapiz Reserva Chardonnay','Tapiz','Chardonnay','Blanco',20800,1000,'2744','7798116200119'],
  ['Tapiz Alta Collection Sauvignon Blanc','Tapiz','Sauvignon Blanc','Blanco',20500,1300,'2741','7798116200539'],
  ['Tapiz Alta Collection Chardonnay','Tapiz','Chardonnay','Blanco',20500,1050,'2742',null],
  ['Tapiz Alta Collection Rose','Tapiz','Merlot','Rosado',20500,1205,'2740',null],
  ['Tapiz Extra Brut Malbec','Tapiz','Extra Brut','Espumante',20650,1500,'2746','7798116200720'],
  ['Tapiz Extra Brut Chard-Pinot','Tapiz','Extra Brut','Espumante',19670,1500,'2745','7798116200744'],
  ['Tapiz Extra Brut Torrontes','Tapiz','Extra Brut','Espumante',19000,1400,'2758','7798116200737'],
  ['Tapiz Retrato por Jean Claude','Tapiz','Blend','Tinto',110000,9000,null,null],
  ['Tapiz Bicentenario','Tapiz','Blend','Tinto',38250,3000,null,null],
  ['Tapiz Seleccion de Barricas Blanco','Tapiz','Blend','Blanco',39100,3350,null,null],
  ['Tapiz Aceite de Oliva Arauco 500ml','Tapiz','Aceite de Oliva','Otro',33000,0,null,null],
  ['Tapiz Aceite de Oliva Blend 500ml','Tapiz','Aceite de Oliva','Otro',34400,0,null,null],
];

const EMPRESAS = ['aroma', 'lavid'];

async function main() {
  // La tabla no tiene constraint UNIQUE en (empresa, nombre), así que no se puede usar
  // upsert()/ON CONFLICT. Se hace update-si-existe / insert-si-no-existe fila por fila.
  const nombres = rows.map(r => r[0]);
  const { data: existing, error: fetchErr } = await supabase
    .from('productos')
    .select('id,empresa,nombre,precio_costo,sku,codigo_barras')
    .in('empresa', EMPRESAS)
    .in('nombre', nombres);

  if (fetchErr) {
    console.error('Error leyendo productos existentes:', fetchErr);
    process.exit(1);
  }

  const existingMap = new Map(existing.map(p => [`${p.empresa}|${p.nombre}`, p]));

  const toUpdate = [];
  const toInsert = [];
  for (const empresa of EMPRESAS) {
    for (const [nombre, bodega, varietal, categoria, precio_venta, precio_costo_default, sku, codigo_barras] of rows) {
      const prev = existingMap.get(`${empresa}|${nombre}`);
      const base = { empresa, nombre, bodega, varietal, categoria, precio_venta, activo: true };
      if (prev) {
        toUpdate.push({
          id: prev.id,
          ...base,
          precio_costo: prev.precio_costo,
          sku: prev.sku || sku,
          codigo_barras: prev.codigo_barras || codigo_barras,
        });
      } else {
        toInsert.push({ ...base, precio_costo: precio_costo_default, sku, codigo_barras, stock: 0, stock_minimo: 0 });
      }
    }
  }

  console.log(`${toUpdate.length + toInsert.length} filas a procesar (${toInsert.length} nuevas, ${toUpdate.length} a actualizar).`);

  if (!APPLY) {
    console.log('Dry-run (no se escribió nada). Ejecutá con --apply para aplicar de verdad.');
    console.log('Ejemplo update:', JSON.stringify(toUpdate[0], null, 2));
    console.log('Ejemplo insert:', JSON.stringify(toInsert[0], null, 2));
    return;
  }

  let updated = 0;
  const errors = [];
  for (const row of toUpdate) {
    const { id, ...fields } = row;
    const { error } = await supabase.from('productos').update(fields).eq('id', id);
    if (error) errors.push({ nombre: row.nombre, empresa: row.empresa, error });
    else updated++;
  }

  let inserted = 0;
  if (toInsert.length) {
    const { data, error } = await supabase.from('productos').insert(toInsert).select('id');
    if (error) errors.push({ batch: 'insert', error });
    else inserted = data.length;
  }

  console.log(`OK: ${updated} actualizados, ${inserted} insertados.`);
  if (errors.length) {
    console.error('ERRORES:', JSON.stringify(errors, null, 2));
    process.exit(1);
  }
}

main();
