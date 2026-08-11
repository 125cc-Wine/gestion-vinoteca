// Actualización de precios Foster + Lorca — listas Mayo 2026 (mismo grupo,
// bodegafosterlorca.com.ar). Mismo patrón que Tapiz/Zolo: update-si-existe /
// insert-si-no-existe por (empresa, nombre), sin ON CONFLICT.
//
// Decisiones confirmadas con el usuario:
//  - Duplicados "Enrique Foster Malbec Los Altepes/Barrancos" se BORRAN,
//    queda solo "Foster Los Altepes/Barrancos".
//  - La línea "Lois" de la lista Lorca es la misma que ya está cargada bajo
//    bodega "Foster" (Blanc de Blancs, Espumante Dulce, Malbec Esp.) — se
//    actualiza precio nomás, sin tocar bodega ni renombrar.
//  - "Lorca Gran Poetico" (Malbec/Petit Verdot/Blend) = "Grandes Varietales"
//    de la lista nueva, mismo renombre de línea — se actualiza esa fila.
//  - "Lorca Inspirado" salta de $6.986 a $97.345 (confirmado, no es error).
//  - Se omite Bag in Box (próximo lanzamiento) e Inspirado 3000 (sin stock).
//
// Uso: node scripts/update_foster_lorca_2026-05.mjs           (dry-run)
//      node scripts/update_foster_lorca_2026-05.mjs --apply   (aplica)

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
const costo50 = v => Math.round(v * 0.5);

// Nombres a borrar (duplicados)
const aBorrar = ['Enrique Foster Malbec Los Altepes', 'Enrique Foster Malbec Los Barrancos'];

// Updates: [nombre existente, precio_venta nuevo]
const updates = [
  // Foster
  ['Foster Los Altepes', 22350],
  ['Foster Los Barrancos', 22350],
  ['Foster Reserva Malbec', 22875],
  ['Foster Reserva Bonarda', 22875],
  ['Foster Limited Edition Malbec', 54785],
  ['Foster Firmado Malbec', 97345],
  // Lois (bodega Foster, no tocar)
  ['Lois Blanc de Blancs E. Foster', 24695],
  ['Lois Espumante Dulce Foster', 24695],
  ['Lois Malbec Esp. Eb Foster', 24695],
  // Lorca — Fantasía
  ['Lorca Fantasia Chardonnay', 12470],
  ['Lorca Fantasia Torrontes', 12470],
  ['Lorca Fantasia Sauvignon Blanc', 12470],
  ['Lorca Fantasia Malbec', 12470],
  ['Lorca Fantasia Cabernet Franc', 12470],
  ['Lorca Fantasia Cabernet Sauvignon', 12470],
  ['Lorca Fantasia Criolla', 12470],
  // Lorca — El Mirador
  ['Lorca Fantasia El Mirador Criolla Dulce Natural', 12470],
  ['Lorca Fantasía El Mirador Moscatel Dulce Natural', 12470],
  // Lorca — Zapam Zucum
  ['Zapam Zucum Malbec Orgánico Lorca', 12470],
  ['Zapam Zucum Cab. Sauv. Lorca', 12470],
  // Lorca — Ópalo
  ['Lorca Opalo Malbec', 18510],
  ['Lorca Opalo Cabernet Sauvignon', 18510],
  ['Lorca Opalo Syrah', 18510],
  // Lorca — Natural
  ['Lorca Natural Cabernet Franc Malbec', 22875],
  // Lorca — Poético
  ['Lorca Poetico Malbec', 22875],
  ['Lorca Poetico Cabernet Franc', 22875],
  ['Lorca Poetico Cabernet Sauvignon', 22875],
  ['Lorca Poetico Chardonnay', 22875],
  ['Lorca Poetico Syrah', 22875],
  ['Lorca Poetico White Blend', 22875],
  // Lorca — Gran Ópalo
  ['Lorca Gran Opalo Red Blend', 38525],
  // Lorca — Grandes Varietales (= Gran Poetico renombrado)
  ['Lorca Gran Poetico Malbec', 54785],
  ['Lorca Gran Poetico Blend', 54785],
  ['Lorca Gran Poetico Petit Verdot', 54785],
  // Lorca — Inspirado (salto de precio confirmado)
  ['Lorca Inspirado Cabernet Franc', 97345],
  ['Lorca Inspirado Cabernet-Cabernet', 97345],
  ['Lorca Inspirado Red Blend', 97345],
];

// Nuevos productos: [nombre, bodega, varietal, categoria, precio_venta]
const nuevos = [
  // Foster
  ['Foster Firmado Bonarda', 'Foster', 'Bonarda', 'Tinto', 97345],
  ['Foster Firmado Malbec 3000 (Estuche x1)', 'Foster', 'Malbec', 'Tinto', 338855],
  ['Foster Caja de Madera x6 (Malbec y Bonarda)', 'Foster', 'Blend', 'Tinto', 605000],
  // Lorca — El Mirador nuevos
  ['Lorca El Mirador Pedro Ximénez', 'Lorca', 'Pedro Ximénez', 'Blanco', 12470],
  ['Lorca El Mirador Ancellotta-Malbec', 'Lorca', 'Ancellotta-Malbec', 'Tinto', 12470],
  ['Lorca El Mirador Criolla Blanca', 'Lorca', 'Criolla', 'Blanco', 12470],
  // Lorca — Joven
  ['Lorca Joven Malbec', 'Lorca', 'Malbec', 'Tinto', 10635],
  // Lorca — Ópalo nuevo
  ['Lorca Opalo Semillon Sauvignon Blanc', 'Lorca', 'Semillón-Sauvignon Blanc', 'Blanco', 18510],
  // Lorca — Skin Contact (nuevo)
  ['Lorca Skin Contact Viognier', 'Lorca', 'Viognier', 'Blanco', 22875],
  // Lorca — Inspirado nuevo
  ['Lorca Inspirado Chardonnay', 'Lorca', 'Chardonnay', 'Blanco', 97345],
  ['Lorca Caja de Madera x6 Inspirado (Blend, Cab.Cab, Cab.Franc)', 'Lorca', 'Blend', 'Tinto', 605000],
  // Lorca — Ancestral (nuevo)
  ['Lorca Ancestral Blend', 'Lorca', 'Blend', 'Tinto', 143955],
  ['Lorca Ancestral Malbec', 'Lorca', 'Malbec', 'Tinto', 143955],
  ['Lorca Ancestral White Blend', 'Lorca', 'Blend', 'Blanco', 143955],
];

async function main() {
  // 1. Borrar duplicados
  const { data: dups } = await supabase.from('productos').select('id,empresa,nombre').in('nombre', aBorrar);
  console.log(`Duplicados a borrar: ${dups?.length ?? 0}`);
  for (const d of dups ?? []) console.log('  ', d.empresa, d.nombre);

  // 2. Updates
  const nombresUpdate = updates.map(u => u[0]);
  const { data: existentes } = await supabase.from('productos').select('id,empresa,nombre').in('empresa', EMPRESAS).in('nombre', nombresUpdate);
  const mapExistentes = new Map((existentes ?? []).map(p => [`${p.empresa}|${p.nombre}`, p.id]));
  const toUpdate = [];
  const noEncontrados = [];
  for (const empresa of EMPRESAS) {
    for (const [nombre, precio_venta] of updates) {
      const id = mapExistentes.get(`${empresa}|${nombre}`);
      if (!id) { noEncontrados.push(`${empresa}|${nombre}`); continue; }
      toUpdate.push({ id, empresa, nombre, precio_venta });
    }
  }

  // 3. Nuevos
  const toInsert = [];
  for (const empresa of EMPRESAS) {
    for (const [nombre, bodega, varietal, categoria, precio_venta] of nuevos) {
      toInsert.push({ empresa, nombre, bodega, varietal, categoria, precio_venta, precio_costo: costo50(precio_venta), sku: null, codigo_barras: null, stock: 0, stock_minimo: 0, activo: true });
    }
  }

  console.log(`\n${toUpdate.length} filas a actualizar, ${toInsert.length} filas nuevas a insertar.`);
  if (noEncontrados.length) console.log('NO encontrados (se omiten):', noEncontrados);

  if (!APPLY) {
    console.log('\nDry-run. Ejecutá con --apply para aplicar de verdad.');
    return;
  }

  let borrados = 0;
  for (const d of dups ?? []) {
    const { error } = await supabase.from('productos').delete().eq('id', d.id);
    if (error) console.error('ERROR borrando', d.nombre, error.message); else borrados++;
  }

  let updated = 0;
  const errors = [];
  for (const row of toUpdate) {
    const { error } = await supabase.from('productos').update({ precio_venta: row.precio_venta }).eq('id', row.id);
    if (error) errors.push({ nombre: row.nombre, empresa: row.empresa, error });
    else updated++;
  }

  let inserted = 0;
  if (toInsert.length) {
    const { data, error } = await supabase.from('productos').insert(toInsert).select('id');
    if (error) errors.push({ batch: 'insert', error });
    else inserted = data.length;
  }

  console.log(`\nOK: ${borrados} borrados, ${updated} actualizados, ${inserted} insertados.`);
  if (errors.length) { console.error('ERRORES:', JSON.stringify(errors, null, 2)); process.exit(1); }
}

main();
