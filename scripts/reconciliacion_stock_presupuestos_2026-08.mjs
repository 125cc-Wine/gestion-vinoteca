// Reconciliación puntual (ago 2026): hasta este momento el sistema solo
// descontaba stock al crear un Remito, nunca un Presupuesto — pero en este
// negocio el Presupuesto ES la venta real (ver commit que cambia
// descontarStock en src/app/(app)/ventas/page.tsx). Resultado: 278 productos
// tenían ventas por presupuesto históricas que nunca bajaron el stock.
//
// Este script quedó documentado para referencia — ya se corrió una vez
// (ago 2026) y aplicó la corrección. No hace falta volver a correrlo salvo
// que aparezca otra ventana de tiempo con el mismo problema.
//
// Fórmula: nuevo_stock = max(0, stock_actual - total_vendido_por_presupuesto)
// aplicado por separado a la fila de "aroma" y la de "lavid" de cada producto
// (cada una con su propio stock actual, no se fuerza a que coincidan).
//
// Uso: node scripts/reconciliacion_stock_presupuestos_2026-08.mjs           (dry-run)
//      node scripts/reconciliacion_stock_presupuestos_2026-08.mjs --apply   (aplica)

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

async function fetchAll(table, cols, filters = {}) {
  const PAGE = 1000;
  let all = [];
  let from = 0;
  while (true) {
    let q = supabase.from(table).select(cols);
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { data, error } = await q.range(from, from + PAGE - 1);
    if (error) { console.error(error); break; }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function main() {
  const productos = await fetchAll('productos', 'id,empresa,nombre,stock,unidad_medida,activo');
  const byId = new Map(productos.map(p => [p.id, p]));

  let ventas = [];
  for (const emp of ['aroma', 'lavid']) {
    ventas = ventas.concat(await fetchAll('ventas', 'id,empresa,numero,tipo,estado,items,created_at', { empresa: emp, tipo: 'presupuesto' }));
  }
  ventas = ventas.filter(v => v.estado !== 'cancelado');

  const factorDe = u => u === 'caja12' ? 12 : u === 'caja6' ? 6 : u === 'caja4' ? 4 : 1;
  const vendidoPorNombre = new Map();
  for (const v of ventas) {
    let items = v.items;
    if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = []; } }
    for (const it of (items || [])) {
      if (!it.producto_id) continue;
      const prod = byId.get(it.producto_id);
      if (!prod) continue;
      const cant = (it.cantidad || 0) * factorDe(prod.unidad_medida);
      vendidoPorNombre.set(prod.nombre, (vendidoPorNombre.get(prod.nombre) || 0) + cant);
    }
  }

  const stockPorNombre = new Map();
  for (const p of productos) {
    const cur = stockPorNombre.get(p.nombre) || {};
    cur[p.empresa] = { id: p.id, stock: p.stock };
    stockPorNombre.set(p.nombre, cur);
  }

  let actualizados = 0;
  const errores = [];
  for (const [nombre, vendidoTotal] of vendidoPorNombre.entries()) {
    if (vendidoTotal <= 0) continue;
    const st = stockPorNombre.get(nombre) || {};
    for (const lado of [st.aroma, st.lavid]) {
      if (!lado) continue;
      const nuevo = Math.max(0, lado.stock - vendidoTotal);
      if (nuevo === lado.stock) continue;
      if (APPLY) {
        const { error } = await supabase.from('productos').update({ stock: nuevo }).eq('id', lado.id);
        if (error) errores.push({ nombre, id: lado.id, error: error.message });
        else actualizados++;
      } else {
        console.log(nombre, '|', lado.stock, '->', nuevo);
        actualizados++;
      }
    }
  }
  console.log(APPLY ? `Aplicado: ${actualizados} filas actualizadas.` : `Dry-run: ${actualizados} filas cambiarían.`);
  if (errores.length) console.error('ERRORES:', errores);
}

main();
