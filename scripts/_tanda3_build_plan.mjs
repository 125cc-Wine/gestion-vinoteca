import fs from 'fs'

const data = JSON.parse(fs.readFileSync('scripts/_tanda3_crear.json', 'utf8'))
const byName = {}
for (const it of data) byName[it.nombre] = it

function ids(name) {
  const it = byName[name]
  if (!it) throw new Error('missing ' + name)
  return it
}

const plan = { link: [], merge: [], suspicious: [], create: [] }

// --- LINK: already exists in Woo under a different (bodega-prefixed) name, exact price match ---
plan.link.push({
  items: ['Caballero de La Cepa Malbec'],
  woo_id: 11683,
  reason: 'Nombre coincide con "Finca Flichman Caballero de la Cepa Malbec" ya publicado, mismo precio exacto ($18000). Bodega venía null en Supabase.',
})

// --- MERGE: same real product entered twice in Supabase (typo / missing bodega prefix) ---
plan.merge.push({
  primary: 'Iaccarini Via Blanca Malbec',
  duplicates: ['Via Blanca Malbec'],
  reason: 'Misma fila, bodega Iaccarini vs fila suelta con bodega null, mismo precio exacto y nombre "Via Blanca Malbec" idéntico salvo prefijo.',
})
plan.merge.push({
  primary: 'Iaccarini Via Blanca Syrah',
  duplicates: ['Via Blanca Syrah'],
  reason: 'Idem Malbec: duplicado con y sin prefijo Iaccarini, mismo precio exacto.',
})
plan.merge.push({
  primary: 'Iaccarini Via Blanca Bonarda',
  duplicates: ['Via Blanca Bonarda'],
  reason: 'Idem: duplicado con y sin prefijo Iaccarini, mismo precio exacto.',
})
plan.merge.push({
  primary: 'Iaccarini Via Blanca Cab. Sauvignon',
  duplicates: ['Via Blanca Cabernet Sauvignon'],
  reason: 'Idem: duplicado con y sin prefijo Iaccarini (nombre abreviado vs completo), mismo precio exacto.',
})
plan.merge.push({
  primary: 'Humbeto Canale estate Malbec',
  duplicates: ['Humbero Canale estate Malbec'],
  reason: 'Typo duplicado: "Humbeto"/"Humbero" Canale, misma fila real (Humberto Canale Estate Malbec), mismo precio exacto.',
})
plan.merge.push({
  primary: 'Conejo Verde Brut Rose',
  duplicates: ['Consejo Verde Brut Rose'],
  reason: 'Typo duplicado: "Conejo"/"Consejo" Verde Brut Rose, mismo precio exacto ($20000).',
})

// --- SUSPICIOUS: possible dup vs existing Woo product with mismatched data, ambiguous, or broken price ---
const susp = [
  { nombre: 'Foster Firmado Malbec 3000 (Estuche x1)', motivo: 'Posible duplicado de "Enrique Foster Firmado Malbec" (woo id 3933, $97345) ya publicado. Precio Supabase ($338855) es 3.5x el de ese producto -- no coincide ni como error de redondeo. Podria ser una edicion numerada distinta (Estuche x1, "3000" como numero de botella) o un precio mal cargado. Revisar a mano.' },
  { nombre: 'Indomito Blend Kaiken', motivo: 'Precio identico ($15600) a "Indómito Cabernet Franc (Kaiken)" (woo id 10894, draft). Mismo nombre base "Indómito" pero varietal declarado distinto (Blend vs Cabernet Franc). Podria ser el mismo vino mal etiquetado en Woo (Indómito es un blend). Revisar a mano antes de crear/linkear.' },
  { nombre: 'Nietos compañeros Blend G. Rilli', motivo: 'Precio identico ($16100) a DOS productos ya publicados: "Gimenez Riili Nietos Compañeros Blend de Rosados" (id 4012) y "...Blend de Tintas" (id 4009). El nombre en Supabase no especifica color, no se puede determinar cual de los dos es sin dato adicional. Revisar a mano.' },
  { nombre: 'Tucumen Petit Verdot', motivo: 'Mismo precio exacto ($9790) y mismo varietal que "Tucumen Reserva Petit Verdot" (tambien en esta tanda). Tucumen es una bodega chica/boutique; dudoso que tenga dos SKUs de Petit Verdot (regular y Reserva) al mismo precio. Podria ser fila duplicada. Revisar a mano.' },
  { nombre: 'Tucumen Reserva Petit Verdot', motivo: 'Ver "Tucumen Petit Verdot" -- mismo precio y varietal, posible duplicado interno de Supabase.' },
  { nombre: 'Casa Boher Extra Brut', motivo: 'Precio con decimales ($1818.17) muy por debajo de sus hermanos de linea Casa Boher ($15000-17700). Precio roto, no crear hasta corregir.' },
  { nombre: 'Foster Reserva Malbec 1,5 Lts.', motivo: 'Precio ($5000) muy por debajo del equivalente en 750ml "Enrique Foster Reserva Malbec" ($21300 publicado). Un magnum 1.5L deberia costar ~2x el de 750ml, no menos de un cuarto. Precio roto.' },
  { nombre: 'Ique Malbec Magnun Foster', motivo: 'Precio ($1302) muy por debajo del equivalente 750ml "Enrique Foster Ique Malbec" ($11000 publicado). Un magnum deberia costar mas, no una fraccion. Precio roto.' },
  { nombre: 'Lillet Rose 750cc', motivo: 'Precio con decimales ($1269.29), muy bajo para un aperitivo importado Lillet (mercado ARS ~$15000-20000+). Precio roto.' },
  { nombre: 'Lillet Blanc 750cc', motivo: 'Precio con decimales ($1269.29), muy bajo para un aperitivo importado Lillet. Precio roto.' },
  { nombre: 'Be My Hippie Love Tinto', motivo: 'Precio con decimales ($2494.62), patron de precio roto/conversion. Categoria tambien inconsistente (Rosado pero nombre dice "Tinto").' },
  { nombre: 'Rosell Boher Brut', motivo: 'Precio con decimales ($2892.58), muy bajo para un espumante. Precio roto.' },
  { nombre: 'Bressia Profundo', motivo: 'Bressia Profundo es un corte premium reconocido de Mendoza, normalmente de gama alta (~$15000-30000+). $2500 es muy bajo, probablemente precio roto/incompleto.' },
  { nombre: 'Pyros Special Blend', motivo: 'Pyros es una bodega premium de Uco (su Pinot Noir en esta misma tanda esta a $16300). $4000 para un "Special Blend" es sospechosamente bajo. Revisar precio.' },
  { nombre: 'Marchiori & Barraud Dulce Natural', motivo: 'Marchiori & Barraud es una bodega boutique premium (vinos tipicamente $18000-30000+). $1500 para un dulce natural (usualmente formato reducido pero caro por rareza) es sospechosamente bajo. Revisar precio.' },
]
for (const s of susp) plan.suspicious.push({ nombre: s.nombre, motivo: s.motivo })

const skipNames = new Set()
for (const l of plan.link) for (const n of l.items) skipNames.add(n)
for (const m of plan.merge) { skipNames.add(m.primary); for (const d of m.duplicates) skipNames.add(d) }
for (const s of plan.suspicious) skipNames.add(s.nombre)

// --- CREATE: everything else, with merges carrying extra ids ---
const mergeExtraIds = {}
for (const m of plan.merge) {
  const extra = []
  for (const d of m.duplicates) extra.push(ids(d).ids)
  mergeExtraIds[m.primary] = extra
}

for (const it of data) {
  if (skipNames.has(it.nombre)) {
    if (mergeExtraIds[it.nombre]) {
      plan.create.push({ ...it, extraIds: mergeExtraIds[it.nombre] })
    }
    continue
  }
  plan.create.push({ ...it, extraIds: [] })
}

fs.writeFileSync('scripts/_tanda3_plan.json', JSON.stringify(plan, null, 2))
console.log('link:', plan.link.length, '(items:', plan.link.reduce((a, l) => a + l.items.length, 0), ')')
console.log('merge groups:', plan.merge.length, '(consolidates', plan.merge.reduce((a, m) => a + 1 + m.duplicates.length, 0), 'rows into', plan.merge.length, 'products)')
console.log('suspicious:', plan.suspicious.length)
console.log('create:', plan.create.length)
console.log('total accounted:', plan.create.length + plan.suspicious.length + plan.link.reduce((a, l) => a + l.items.length, 0) + plan.merge.reduce((a, m) => a + m.duplicates.length, 0))
