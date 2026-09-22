// Auditoría de vínculos Supabase (productos) <-> WooCommerce (aromadevid.com.ar)
//
// SOLO LECTURA: únicamente hace GET contra Supabase REST y WooCommerce REST.
// No modifica nada en ningún lado. Escribe dos archivos locales:
//   scripts/_reporte_auditoria_woo.json  (detalle completo)
//   scripts/_reporte_auditoria_woo.md    (resumen legible, por tipo y gravedad)
//
// Uso (desde la raíz del repo):  node scripts/auditar-vinculos-woo.mjs
// Opcional: --cache  reutiliza scripts/_cache_auditoria_woo.json si existe
//           (evita volver a bajar la web, que es lenta).
//
// Gravedad: 5 = rompe el sync hoy (se pisa / empuja precio a otro producto)
//           4 = vínculo casi seguro equivocado
//           3 = incoherencia que conviene corregir
//           2 = revisar
//           1 = informativo

import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------- env
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, '')
}
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const WOO_URL = process.env.WOOCOMMERCE_URL
const WOO_CK = process.env.WOOCOMMERCE_CONSUMER_KEY
const WOO_CS = process.env.WOOCOMMERCE_CONSUMER_SECRET
if (!SB_URL || !SB_KEY || !WOO_URL || !WOO_CK || !WOO_CS) {
  console.error('Faltan variables en .env.local'); process.exit(1)
}

const OUT_DIR = 'scripts'
const CACHE = path.join(OUT_DIR, '_cache_auditoria_woo.json')
const USE_CACHE = process.argv.includes('--cache')

// ---------------------------------------------------------------- fetch helpers (solo GET)
async function getJson(url, headers = {}, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { method: 'GET', headers })
      if (res.status === 404) return { status: 404, data: null, headers: res.headers }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
      return { status: res.status, data: await res.json(), headers: res.headers }
    } catch (e) {
      if (i >= tries) throw e
      await new Promise(r => setTimeout(r, 1500 * i))
    }
  }
}

async function fetchSupabase() {
  const cols = 'id,empresa,nombre,sku,precio_venta,stock,woo_product_id,activo,bodega,codigo_barras'
  const all = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data } = await getJson(`${SB_URL}/rest/v1/productos?select=${cols}&order=id`, {
      apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Range: `${from}-${from + PAGE - 1}`, 'Range-Unit': 'items',
    })
    all.push(...data)
    if (data.length < PAGE) break
  }
  return all
}

function wooUrl(p, extra = {}) {
  const qs = new URLSearchParams({ consumer_key: WOO_CK, consumer_secret: WOO_CS, ...extra })
  return `${WOO_URL}/wp-json/wc/v3/${p}?${qs}`
}
const WOO_FIELDS = 'id,name,sku,status,regular_price,sale_price,price,stock_quantity,type,parent_id'

async function fetchWooStatus(status) {
  const first = await getJson(wooUrl('products', { status, per_page: 100, page: 1, _fields: WOO_FIELDS }))
  const totalPages = Number(first.headers.get('x-wp-totalpages') || 1)
  const out = [...first.data]
  const pages = []
  for (let p = 2; p <= totalPages; p++) pages.push(p)
  const CONC = 6
  let idx = 0
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (idx < pages.length) {
      const p = pages[idx++]
      const r = await getJson(wooUrl('products', { status, per_page: 100, page: p, _fields: WOO_FIELDS }))
      out.push(...r.data)
      process.stdout.write(`  woo ${status} página ${p}/${totalPages}\n`)
    }
  }))
  return out
}

async function fetchWooById(id) {
  const r = await getJson(wooUrl(`products/${id}`, { _fields: WOO_FIELDS }))
  return r.status === 404 ? null : r.data
}

// ---------------------------------------------------------------- normalización (copiada de src/lib/woocommerce.ts + extras)
const ABREVIATURAS = {
  rva: 'reserva', rsva: 'reserva', res: 'reserva', reserve: 'reserva',
  cab: 'cabernet', sauv: 'sauvignon', esp: 'espumante', bco: 'blanco', tto: 'tinto',
  // extras para la auditoría
  hnos: 'hermanos', hno: 'hermanos', gran: 'gran', cs: 'cabernet sauvignon',
  chard: 'chardonnay', sb: 'sauvignon blanc', ptit: 'petit', vdo: 'verdot',
  mb: 'malbec', mal: 'malbec', malb: 'malbec', cf: 'cabernet franc', sy: 'syrah', pn: 'pinot noir',
  ch: 'chardonnay', rosado: 'rose', rosados: 'rose', plc: 'proyecto las compuertas',
  grigio: 'gris', montequieto: 'monte quieto', suavig: 'sauvignon', flia: 'familia', amp: '',
}
function normalizarNombre(s) {
  let t = (s || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  t = ' ' + t + ' '
  t = t.replace(/ g riili /g, ' gimenez riili ')
    .replace(/ t d /g, ' tierra de ').replace(/ b n /g, ' brut nature ').replace(/ e b /g, ' extra brut ')
    .replace(/ p noir /g, ' pinot noir ').replace(/ p verdot /g, ' petit verdot ').replace(/ p t verd /g, ' petit verdot ')
    .replace(/ cab sauv /g, ' cabernet sauvignon ').replace(/ cab franc /g, ' cabernet franc ')
  return t.trim().split(/\s+/).map(x => ABREVIATURAS[x] ?? x).join(' ').split(/\s+/).filter(Boolean).join(' ')
}
function claveMatch(s) { return normalizarNombre(s).split(' ').filter(Boolean).sort().join(' ') }

const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'x', 'en', 'con', 'vino', 'bodega', 'bodegas', 'finca', 'ml', 'cc', 'cl', '750', '750ml', 'lt', 'l', 'botella', 'estuche', 'caja'])
// palabras genéricas: pesan menos al comparar (dos vinos distintos comparten "malbec")
const GENERICAS = new Set(['malbec', 'cabernet', 'sauvignon', 'franc', 'blanc', 'merlot', 'syrah', 'bonarda', 'chardonnay', 'torrontes', 'pinot', 'noir', 'grigio', 'gris', 'tempranillo', 'petit', 'verdot', 'blend', 'rose', 'rosado', 'tinto', 'blanco', 'reserva', 'gran', 'espumante', 'extra', 'brut', 'nature', 'dulce', 'natural', 'roble', 'joven', 'clasico', 'classic', 'premium', 'seleccion', 'edicion', 'limitada', 'semillon', 'viognier', 'riesling', 'criolla', 'tannat', 'sangiovese', 'barbera', 'ancellotta', 'carmenere', 'moscatel', 'dulce', 'cosecha', 'tardia', 'late', 'harvest', 'organico', 'single', 'vineyard', 'estate', 'valle', 'uco', 'mendoza'])
// varietales para detectar conflicto (no incluye blend/rose: son estilo, ambiguos)
const VARIETALES = ['malbec', 'cabernet sauvignon', 'cabernet franc', 'merlot', 'syrah', 'bonarda', 'chardonnay', 'torrontes', 'pinot noir', 'sauvignon blanc', 'tempranillo', 'petit verdot', 'semillon', 'viognier', 'riesling', 'tannat', 'sangiovese', 'carmenere', 'pinot grigio', 'pinot gris', 'criolla', 'ancellotta', 'barbera', 'charbono', 'cordisco', 'moscatel']
// tokens que distinguen dos vinos de la misma línea (Exupery Malbec vs Exupery Malbec Rosé)
const DIFERENCIADORES = new Set(['rose', 'blanco', 'tinto', 'dulce', 'premium', 'reserva', 'gran', 'brut', 'nature', 'extra', 'blend', 'malbec', 'cabernet', 'franc', 'sauvignon', 'merlot', 'syrah', 'bonarda', 'chardonnay', 'torrontes', 'pinot', 'noir', 'petit', 'verdot', 'semillon', 'primavera', 'silenio', 'blanc', 'naranjo', 'orange', 'magnum', '1500', '375'])
function mismoVino(a, b) {
  if (claveMatch(a) === claveMatch(b)) return true
  const A = new Set(tokens(a)), B = new Set(tokens(b))
  // uno contenido en el otro ("Via Blanca Malbec" ⊂ "Iaccarini Via Blanca Malbec") cuenta como parecido
  const contenido = [...A].every(t => tokMatch(t, B)) || [...B].every(t => tokMatch(t, A))
  if ((!contenido && similitud(a, b) < 0.75) || conflictoVarietal(a, b) || numerosDistintos(a, b)) return false
  for (const t of A) if (DIFERENCIADORES.has(t) && !B.has(t)) return false
  for (const t of B) if (DIFERENCIADORES.has(t) && !A.has(t)) return false
  return true
}

function tokens(s) { return normalizarNombre(s).split(' ').filter(t => t && !STOP.has(t)) }
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length][b.length]
}
const w = t => (GENERICAS.has(t) ? 0.35 : /^\d+$/.test(t) ? 0.5 : 1)
function tokMatch(t, set) {
  if (set.has(t)) return true
  if (t.length >= 5) for (const u of set) if (u.length >= 5 && lev(t, u) <= 1) return true
  // "gimenezriili" vs "gimenez riili", prefijos tipo "cab"/"cabernet"
  for (const u of set) if (t.length >= 4 && u.length >= 4 && (u.startsWith(t) || t.startsWith(u))) return true
  return false
}
// score 0..1 de similitud de nombres (ponderado, tolerante a orden y a typos)
function similitud(a, b) {
  const A = [...new Set(tokens(a))], B = [...new Set(tokens(b))]
  if (!A.length || !B.length) return 0
  const SA = new Set(A), SB = new Set(B)
  let inter = 0, wa = 0, wb = 0, interB = 0
  for (const t of A) { wa += w(t); if (tokMatch(t, SB)) inter += w(t) }
  for (const t of B) { wb += w(t); if (tokMatch(t, SA)) interB += w(t) }
  const cobA = inter / wa, cobB = interB / wb
  // media armónica de cobertura en ambos sentidos, con piso por contención
  const f1 = cobA + cobB ? (2 * cobA * cobB) / (cobA + cobB) : 0
  return Math.round(Math.max(f1, 0.85 * Math.min(1, Math.max(cobA, cobB)) * Math.min(cobA, cobB) ** 0.3) * 100) / 100
}
function varietales(s) {
  const n = ' ' + normalizarNombre(s) + ' '
  const found = new Set()
  for (const v of VARIETALES) if (n.includes(' ' + v + ' ')) found.add(v)
  if (found.has('cabernet sauvignon') || found.has('cabernet franc')) found.delete('cabernet')
  return found
}
function conflictoVarietal(a, b) {
  const A = varietales(a), B = varietales(b)
  if (!A.size || !B.size) return null
  const inter = [...A].filter(x => B.has(x))
  if (inter.length) return null
  return { fila: [...A], web: [...B] }
}
function numerosDistintos(a, b) {
  // añadas / tamaños (1500, 375, 2019) que aparecen en uno y no en el otro
  const na = new Set(normalizarNombre(a).split(' ').filter(t => /^\d{3,4}$/.test(t) && t !== '750'))
  const nb = new Set(normalizarNombre(b).split(' ').filter(t => /^\d{3,4}$/.test(t) && t !== '750'))
  if (!na.size || !nb.size) return null
  const diff = [...na].filter(x => !nb.has(x)).concat([...nb].filter(x => !na.has(x)))
  return diff.length ? { fila: [...na], web: [...nb] } : null
}
const normSku = s => (s ?? '').toString().trim().toUpperCase().replace(/\s+/g, '')
const num = x => { const n = parseFloat(x); return Number.isFinite(n) ? n : 0 }
function ratioPrecio(a, b) { if (!(a > 0) || !(b > 0)) return null; return Math.max(a, b) / Math.min(a, b) }

// ---------------------------------------------------------------- carga de datos
let sb, woo, wooTrash
if (USE_CACHE && fs.existsSync(CACHE)) {
  ;({ sb, woo, wooTrash } = JSON.parse(fs.readFileSync(CACHE, 'utf8')))
  console.log(`(cache) supabase ${sb.length}, woo ${woo.length}, woo papelera ${wooTrash.length}`)
} else {
  console.log('Bajando Supabase...')
  const t0 = Date.now()
  const pSb = fetchSupabase()
  console.log('Bajando WooCommerce (status=any + trash)...')
  const [a, b, c] = await Promise.all([pSb, fetchWooStatus('any'), fetchWooStatus('trash').catch(() => [])])
  sb = a; woo = b; wooTrash = c
  console.log(`supabase ${sb.length} filas, woo ${woo.length} productos, papelera ${wooTrash.length} (${((Date.now() - t0) / 1000).toFixed(1)}s)`)
  fs.writeFileSync(CACHE, JSON.stringify({ fecha: new Date().toISOString(), sb, woo, wooTrash }))
}

const wooById = new Map(woo.map(p => [p.id, p]))
const trashById = new Map(wooTrash.map(p => [p.id, p]))

// ids vinculados que no están en el listado: consultarlos uno por uno (pueden
// ser variaciones, que no salen en /products)
const linkedIds = [...new Set(sb.filter(r => r.woo_product_id).map(r => Number(r.woo_product_id)))]
const faltan = linkedIds.filter(id => !wooById.has(id) && !trashById.has(id))
const extraById = new Map()
if (faltan.length) {
  console.log(`Consultando ${faltan.length} woo ids vinculados que no aparecen en el listado...`)
  for (const id of faltan) {
    try { extraById.set(id, await fetchWooById(id)) } catch (e) { extraById.set(id, { error: String(e.message || e) }) }
  }
}
function wooDe(id) { return wooById.get(id) || trashById.get(id) || extraById.get(id) || null }

// ---------------------------------------------------------------- índices
const activos = sb.filter(r => r.activo)
const porEmp = { aroma: activos.filter(r => r.empresa === 'aroma'), lavid: activos.filter(r => r.empresa === 'lavid') }
const skuIndex = { aroma: new Map(), lavid: new Map() } // sku -> filas activas
for (const r of activos) {
  const s = normSku(r.sku); if (!s) continue
  const m = skuIndex[r.empresa]; if (!m) continue
  if (!m.has(s)) m.set(s, []); m.get(s).push(r)
}
const wooSkuIndex = new Map()
for (const p of woo) {
  const s = normSku(p.sku); if (!s) continue
  if (!wooSkuIndex.has(s)) wooSkuIndex.set(s, []); wooSkuIndex.get(s).push(p)
}

const filaMini = r => ({ id: r.id, empresa: r.empresa, nombre: r.nombre, sku: r.sku || '', precio_venta: num(r.precio_venta), stock: r.stock, activo: r.activo, woo_product_id: r.woo_product_id })
const webMini = p => p ? ({ id: p.id, nombre: p.name, sku: p.sku || '', status: p.status, type: p.type, regular_price: p.regular_price, sale_price: p.sale_price, price: p.price, stock: p.stock_quantity, parent_id: p.parent_id }) : null

const hallazgos = [] // {tipo, gravedad, titulo, accion, ...}
const add = h => hallazgos.push(h)

// ================================================================= 1. varios productos -> mismo woo id (misma empresa)
for (const emp of ['aroma', 'lavid']) {
  const g = new Map()
  for (const r of sb.filter(x => x.empresa === emp && x.woo_product_id)) {
    const k = Number(r.woo_product_id)
    if (!g.has(k)) g.set(k, []); g.get(k).push(r)
  }
  for (const [wid, filas] of g) {
    if (filas.length < 2) continue
    const act = filas.filter(f => f.activo)
    const precios = new Set(act.map(f => num(f.precio_venta)))
    const web = wooDe(wid)
    // ¿son vinos distintos o el mismo vino duplicado con otro nombre?
    let distintos = false
    for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) if (!mismoVino(act[i].nombre, act[j].nombre)) distintos = true
    let grav = 1
    if (act.length >= 2) {
      if (emp === 'aroma') grav = distintos ? 5 : precios.size > 1 ? 4 : 3
      else grav = 2 // lavid no sincroniza
    }
    // cuál de las filas coincide mejor con la web
    const ranking = filas.map(f => ({ id: f.id, nombre: f.nombre, sim: web ? similitud(f.nombre, web.name) : null, skuIgual: web ? normSku(f.sku) && normSku(f.sku) === normSku(web.sku) : null }))
      .sort((a, b) => (b.skuIgual - a.skuIgual) || ((b.sim ?? 0) - (a.sim ?? 0)))
    add({
      tipo: '1_mismo_woo_id', gravedad: grav, empresa: emp, woo_id: wid,
      titulo: act.length < 2
        ? `${filas.length} filas ${emp} -> woo #${wid}, pero sólo ${act.length} activa (las inactivas no sincronizan)`
        : `${filas.length} filas ${emp} activas -> woo #${wid}: ${distintos ? 'VINOS DISTINTOS' : 'mismo vino duplicado'}${precios.size > 1 ? ', PRECIOS DISTINTOS' : ''} (web: "${web?.name ?? '?'}")`,
      web: webMini(web), filas: filas.map(filaMini), ranking,
      accion: act.length < 2
        ? 'Informativo: desvincular la fila inactiva para que no confunda (no afecta el sync).'
        : distintos
        ? `Dejar vinculado a #${wid} sólo la fila que corresponde al producto web (mejor candidato: "${ranking[0].nombre}"${ranking[0].skuIgual ? ', mismo SKU' : ''}); desvincular las otras y buscarles su producto web correcto (o crearlo).`
        : `Mismo vino cargado 2 veces en ${emp}: el sync empuja stock (y precio) de ambas al mismo producto web y la última gana. Fusionar stock en una fila, desactivar la otra${precios.size > 1 ? ' y definir el precio correcto' : ''}.`,
    })
  }
}

// ================================================================= 3/4/5/6a. fila vinculada vs producto web
for (const r of sb.filter(x => x.woo_product_id)) {
  const wid = Number(r.woo_product_id)
  const web = wooDe(wid)
  const base = { empresa: r.empresa, woo_id: wid, fila: filaMini(r), web: webMini(web) }
  const sincroniza = r.empresa === 'aroma' && r.activo
  if (!web || web.error) {
    add({ ...base, tipo: '6a_vinculo_roto', gravedad: sincroniza ? 4 : 2,
      titulo: `woo #${wid} no existe en la web${web?.error ? ' (error: ' + web.error + ')' : ''} (fila ${r.empresa}${r.activo ? '' : ', inactiva'} "${r.nombre}")`,
      accion: 'Desvincular (woo_product_id = null) y, si el vino sigue a la venta, vincular al producto web correcto o crearlo.' })
    continue
  }
  if (web.type === 'variation') {
    add({ ...base, tipo: '8_vinculado_a_variacion', gravedad: 3, titulo: `woo #${wid} es una VARIACIÓN (padre #${web.parent_id}); /products/batch no la actualiza`, accion: 'Revisar: vincular al producto padre o manejar variaciones aparte.' })
  }
  if (trashById.has(wid) || web.status === 'trash') {
    add({ ...base, tipo: '6a_vinculo_roto', gravedad: sincroniza ? 3 : 1, titulo: `woo #${wid} está en la PAPELERA (fila ${r.empresa} "${r.nombre}")`, accion: 'Si el producto web se borró a propósito, desvincular; si no, restaurarlo o vincular al producto vivo.' })
  } else if (web.status !== 'publish' && sincroniza) {
    add({ ...base, tipo: '8_web_no_publicado', gravedad: 1, titulo: `woo #${wid} está en estado "${web.status}" (fila aroma activa "${r.nombre}")`, accion: 'Informativo: el sync le empuja precio/stock pero no se ve en la tienda. Publicar si corresponde.' })
  }
  if (web.type === 'variable' && sincroniza) {
    add({ ...base, tipo: '8_vinculado_a_variable', gravedad: 2, titulo: `woo #${wid} es producto VARIABLE: regular_price del padre no se usa`, accion: 'Revisar: el precio real vive en las variaciones.' })
  }

  // --- SKU
  const sS = normSku(r.sku), sW = normSku(web.sku)
  const otrosConSkuWeb = sW ? (skuIndex[r.empresa]?.get(sW) || []).filter(f => f.id !== r.id && claveMatch(f.nombre) !== claveMatch(r.nombre)) : []
  const sim = similitud(r.nombre, web.name)
  const confV = conflictoVarietal(r.nombre, web.name)
  const numD = numerosDistintos(r.nombre, web.name)
  const pS = num(r.precio_venta), pW = num(web.regular_price) || num(web.price)
  const rat = ratioPrecio(pS, pW)

  // señales de vínculo equivocado
  const señales = []
  if (sS && sW && sS !== sW) señales.push('sku')
  if (otrosConSkuWeb.length) señales.push('sku_web_es_de_otra_fila')
  if (sim < 0.5) señales.push('nombre')
  if (confV) señales.push('varietal')
  if (rat && rat > 1.4) señales.push('precio')

  if (sS && sW && sS !== sW) {
    let grav = 2
    if (otrosConSkuWeb.length) grav = (sim >= 0.8 && !confV) ? (sincroniza ? 3 : 2) : (sincroniza ? 5 : 3)
    else if (sim < 0.5 || confV) grav = sincroniza ? 4 : 3
    else if (r.activo) grav = 2
    else grav = 1
    add({ ...base, tipo: '3_sku_distinto', gravedad: grav, similitud: sim, senales: señales,
      otras_filas_con_sku_web: otrosConSkuWeb.map(filaMini),
      titulo: `SKU fila "${r.sku}" ≠ SKU web "${web.sku}" (${r.empresa}${r.activo ? '' : ', inactiva'}: "${r.nombre}" vs web "${web.name}", sim ${sim})`,
      accion: otrosConSkuWeb.length && sim >= 0.8 && !confV
        ? `El nombre coincide, así que el vínculo parece bien, pero el SKU de la web (${web.sku}) es el de otra fila ("${otrosConSkuWeb[0].nombre}"): corregir el SKU en la web (o en Supabase) para que no se crucen.`
        : otrosConSkuWeb.length
        ? `El SKU de la web (${web.sku}) pertenece a otra fila ("${otrosConSkuWeb[0].nombre}"): el vínculo de esta fila probablemente está mal. Revisar qué vino es #${wid} y re-vincular.`
        : sim >= 0.75 && !confV ? 'Mismo vino, SKU desalineado: unificar SKU (decidir cuál es el correcto y corregir el otro lado).' : 'Nombre y SKU no coinciden: verificar si el vínculo es correcto antes de corregir SKU.' })
  } else if (sS && !sW && r.activo && web.status === 'publish') {
    add({ ...base, tipo: '3_web_sin_sku', gravedad: 1, similitud: sim, titulo: `web #${wid} sin SKU (fila tiene "${r.sku}")`, accion: `Cargar SKU ${r.sku} en la web si el vínculo es correcto.` })
  }

  // --- nombre
  if (sim < 0.6 || confV || numD) {
    let grav = 2
    if (sim < 0.35 || confV) grav = 3
    if (confV && sim < 0.7) grav = 4
    if ((sim < 0.4 || confV) && (señales.includes('sku') || señales.includes('precio') || señales.includes('sku_web_es_de_otra_fila'))) grav = 4
    if (sim <= 0.15) grav = 5 // otro vino: el sync le está empujando precio/stock ajeno
    if (!sincroniza) grav = Math.max(1, grav - 2)
    add({ ...base, tipo: '4_nombre_distinto', gravedad: grav, similitud: sim, conflicto_varietal: confV, numeros_distintos: numD, senales: señales,
      titulo: `sim ${sim}: "${r.nombre}" (${r.empresa}${r.activo ? '' : ', inactiva'}) vs web #${wid} "${web.name}"${confV ? ` [varietal ${confV.fila.join('/')} vs ${confV.web.join('/')}]` : ''}${numD ? ` [números ${numD.fila.join('/')} vs ${numD.web.join('/')}]` : ''}`,
      accion: sim <= 0.15 ? `Vínculo EQUIVOCADO: #${wid} es otro vino. Desvincular ya (cada sync le pone precio/stock de "${r.nombre}") y buscar el producto web correcto.`
        : señales.length >= 2 || (confV && sim < 0.7) ? 'Vínculo probablemente equivocado: revisar el producto web y re-vincular.' : 'Verificar a mano; si es el mismo vino, unificar nombre.' })
  }

  // --- precio (sólo aroma, que es lo que sincroniza)
  if (r.empresa === 'aroma' && r.activo) {
    if (rat && rat > 1.4) {
      const sospecha = sim < 0.6 || confV || (sS && sW && sS !== sW)
      add({ ...base, tipo: '5_precio_distinto', gravedad: sospecha ? 4 : rat > 2 ? 3 : 2, similitud: sim, ratio: Math.round(rat * 100) / 100,
        titulo: `precio fila $${pS} vs web $${pW} (x${rat.toFixed(2)}) "${r.nombre}" vs "${web.name}"`,
        accion: sospecha ? 'Precio + nombre/SKU no coinciden: sospecha de vínculo equivocado, revisar antes de sincronizar.' : 'Mismo vino con precio muy distinto: el próximo sync lo pisa con el de Supabase; confirmar cuál es el correcto.' })
    } else if (pS > 0 && !(pW > 0)) {
      add({ ...base, tipo: '5_precio_distinto', gravedad: 1, titulo: `web #${wid} sin precio (fila $${pS}) "${r.nombre}"`, accion: 'Se completa con el próximo sync de precio.' })
    } else if (!(pS > 0)) {
      add({ ...base, tipo: '8_fila_sin_precio', gravedad: 2, titulo: `fila aroma activa vinculada con precio_venta ${pS} (web $${pW}) "${r.nombre}"`, accion: 'Cargar precio en Supabase: el sync de precio empujaría 0/vacío a la web.' })
    }
  }
}

// ================================================================= 2. pares aroma/lavid
{
  const grupos = new Map() // claveMatch -> {aroma:[], lavid:[]}
  for (const r of activos) {
    const k = claveMatch(r.nombre)
    if (!grupos.has(k)) grupos.set(k, { aroma: [], lavid: [] })
    grupos.get(k)[r.empresa]?.push(r)
  }
  const sinContraparte = { aroma: [], lavid: [] }
  for (const [k, g] of grupos) {
    const { aroma: A, lavid: L } = g
    if (A.length > 1 || L.length > 1) {
      for (const [emp, arr] of [['aroma', A], ['lavid', L]]) if (arr.length > 1) {
        const wids = new Set(arr.map(x => x.woo_product_id).filter(Boolean))
        add({ tipo: '7_nombre_duplicado_misma_empresa', gravedad: emp === 'aroma' && wids.size > 1 ? 3 : 2, empresa: emp,
          titulo: `${arr.length} filas activas ${emp} con el mismo nombre "${arr[0].nombre}"${wids.size > 1 ? ` vinculadas a woo distintos (${[...wids].join(', ')})` : ''}`,
          filas: arr.map(filaMini), accion: 'Duplicado: dejar una sola fila activa por empresa (fusionar stock), la otra desactivar.' })
      }
    }
    if (A.length === 1 && L.length === 1) {
      const a = A[0], l = L[0]
      const difs = []
      if ((a.woo_product_id || null) !== (l.woo_product_id || null)) difs.push(!a.woo_product_id || !l.woo_product_id ? 'uno vinculado y el otro no' : 'woo_product_id distinto')
      if (num(a.precio_venta) !== num(l.precio_venta)) difs.push('precio distinto')
      if (normSku(a.sku) !== normSku(l.sku)) difs.push('sku distinto')
      if (!difs.length) continue
      let grav = 1
      if (difs.includes('woo_product_id distinto')) grav = 4
      else if (difs.includes('precio distinto')) grav = ratioPrecio(num(a.precio_venta), num(l.precio_venta)) > 1.4 ? 3 : 2
      else if (difs.includes('sku distinto')) grav = 2
      if (difs.includes('sku distinto') && grav < 2) grav = 2
      const accion = []
      if (difs.includes('woo_product_id distinto')) accion.push(`unificar woo_product_id (aroma #${a.woo_product_id} vs lavid #${l.woo_product_id}); el que manda el sync es aroma, verificar cuál es el correcto`)
      if (difs.includes('uno vinculado y el otro no')) accion.push(a.woo_product_id ? `copiar woo_product_id ${a.woo_product_id} a la fila lavid` : `la fila aroma NO está vinculada (lavid sí, #${l.woo_product_id}): vincular aroma, sino el sync nunca actualiza ese producto`)
      if (difs.includes('precio distinto')) accion.push(`alinear precio (aroma $${num(a.precio_venta)} vs lavid $${num(l.precio_venta)})`)
      if (difs.includes('sku distinto')) accion.push(`alinear SKU (aroma "${a.sku || ''}" vs lavid "${l.sku || ''}")`)
      if (difs.includes('uno vinculado y el otro no') && !a.woo_product_id) grav = Math.max(grav, 3)
      add({ tipo: '2_par_aroma_lavid', gravedad: grav, diferencias: difs, titulo: `"${a.nombre}": ${difs.join(', ')}`, aroma: filaMini(a), lavid: filaMini(l), accion: accion.join('; ') + '.' })
    }
    if (A.length && !L.length) sinContraparte.aroma.push(...A)
    if (L.length && !A.length) sinContraparte.lavid.push(...L)
  }
  // sin contraparte por nombre: ¿hay contraparte por SKU con otro nombre?
  for (const emp of ['aroma', 'lavid']) {
    const otra = emp === 'aroma' ? 'lavid' : 'aroma'
    for (const r of sinContraparte[emp]) {
      const cand = normSku(r.sku) ? (skuIndex[otra].get(normSku(r.sku)) || []) : []
      if (cand.length) {
        const c = cand[0]
        const difs = ['nombre distinto']
        if ((r.woo_product_id || null) !== (c.woo_product_id || null)) difs.push('woo_product_id distinto')
        if (num(r.precio_venta) !== num(c.precio_venta)) difs.push('precio distinto')
        if (emp === 'lavid') continue // se reporta una sola vez, desde aroma
        add({ tipo: '2_par_aroma_lavid', gravedad: difs.includes('woo_product_id distinto') ? 3 : 2, diferencias: difs,
          titulo: `mismo SKU ${r.sku} con nombres distintos: aroma "${r.nombre}" / lavid "${c.nombre}"${difs.length > 1 ? ' (' + difs.slice(1).join(', ') + ')' : ''}`,
          aroma: filaMini(r), lavid: filaMini(c), similitud: similitud(r.nombre, c.nombre),
          accion: similitud(r.nombre, c.nombre) >= 0.6 ? 'Unificar nombre (y woo id/precio si difieren) entre empresas.' : 'Nombres muy distintos con mismo SKU: uno de los dos SKU está mal cargado; revisar.' })
      } else {
        add({ tipo: '2_sin_contraparte', gravedad: 1, empresa: emp, titulo: `fila activa ${emp} sin par en ${otra}: "${r.nombre}" (SKU ${r.sku || '-'})`, fila: filaMini(r),
          accion: `Informativo: no hay fila ${otra} con mismo nombre ni SKU. Si comparten depósito, crear la contraparte o revisar nombre.` })
      }
    }
  }
}

// ================================================================= 6b. web publicados sin fila vinculada
{
  const vinculadosAroma = new Set(sb.filter(r => r.empresa === 'aroma' && r.woo_product_id).map(r => Number(r.woo_product_id)))
  const vinculadosCualquiera = new Set(sb.filter(r => r.woo_product_id).map(r => Number(r.woo_product_id)))
  const aromaActivosSinVinculo = porEmp.aroma.filter(r => !r.woo_product_id)
  const clavesAroma = new Map()
  for (const r of porEmp.aroma) { const k = claveMatch(r.nombre); if (!clavesAroma.has(k)) clavesAroma.set(k, []); clavesAroma.get(k).push(r) }
  for (const p of woo.filter(p => p.status === 'publish')) {
    if (vinculadosAroma.has(p.id)) continue
    const soloLavid = vinculadosCualquiera.has(p.id)
    const candidatos = []
    const sW = normSku(p.sku)
    if (sW) for (const r of skuIndex.aroma.get(sW) || []) candidatos.push({ por: 'sku', sim: similitud(r.nombre, p.name), ...filaMini(r) })
    for (const r of clavesAroma.get(claveMatch(p.name)) || []) if (!candidatos.some(c => c.id === r.id)) candidatos.push({ por: 'nombre_exacto', sim: 1, ...filaMini(r) })
    if (!candidatos.length) {
      let best = []
      for (const r of aromaActivosSinVinculo) { const s = similitud(r.nombre, p.name); if (s >= 0.75 && !conflictoVarietal(r.nombre, p.name)) best.push({ por: 'nombre_parecido', sim: s, ...filaMini(r) }) }
      best.sort((a, b) => b.sim - a.sim)
      candidatos.push(...best.slice(0, 3))
    }
    const top = candidatos[0]
    let grav = 1
    if (top && (top.por === 'sku' || top.por === 'nombre_exacto') && !top.woo_product_id) grav = 3
    else if (top) grav = 2
    add({ tipo: '6b_web_sin_vinculo', gravedad: grav, woo_id: p.id, web: webMini(p), candidatos, vinculado_solo_en_lavid: soloLavid,
      titulo: `web #${p.id} "${p.name}" (SKU ${p.sku || '-'}, $${p.regular_price || p.price || '-'}, stock ${p.stock_quantity ?? '-'}) sin fila aroma vinculada${soloLavid ? ' (sí vinculado en lavid)' : ''}${top ? ` -> candidato: "${top.nombre}" por ${top.por}${top.woo_product_id ? ` (pero ya vinculada a #${top.woo_product_id})` : ''}` : ''}`,
      accion: top
        ? (top.woo_product_id ? `La fila candidata ya está vinculada a #${top.woo_product_id}: posible producto web duplicado (#${p.id} vs #${top.woo_product_id}); unificar en la web.` : `Vincular fila aroma ${top.id} (y su par lavid) a woo #${p.id}.`)
        : 'Sin candidato en Supabase: vino sólo publicado en la web (despublicar si no hay stock, o dar de alta en gestión).' })
  }
}

// ================================================================= 7. SKUs duplicados
for (const emp of ['aroma', 'lavid']) {
  for (const [s, filas] of skuIndex[emp]) {
    if (filas.length < 2) continue
    const claves = new Set(filas.map(f => claveMatch(f.nombre)))
    add({ tipo: '7_sku_duplicado_supabase', gravedad: claves.size > 1 ? (emp === 'aroma' ? 3 : 2) : 2, empresa: emp, sku: s,
      titulo: `SKU ${s} en ${filas.length} filas activas ${emp}: ${filas.map(f => `"${f.nombre}"`).join(' / ')}`, filas: filas.map(filaMini),
      accion: claves.size > 1 ? 'Productos distintos con el mismo SKU: corregir el SKU de los que no correspondan (el matcheo por SKU los confunde).' : 'Mismo producto duplicado: dejar una sola fila activa.' })
  }
}
for (const [s, ps] of wooSkuIndex) {
  if (ps.length < 2) continue
  const pub = ps.filter(p => p.status === 'publish')
  add({ tipo: '7_sku_duplicado_web', gravedad: pub.length > 1 ? 3 : 2, sku: s,
    titulo: `SKU ${s} en ${ps.length} productos web: ${ps.map(p => `#${p.id} "${p.name}" [${p.status}]`).join(' / ')}`, web: ps.map(webMini),
    accion: 'WooCommerce no debería tener SKU repetido: corregir el SKU del que no corresponda o borrar el duplicado.' })
}

// ================================================================= 8. otros
// 8a. woo id vinculado en lavid pero la fila aroma del mismo vino no está vinculada / aroma inactiva vinculada con web publicada
for (const r of sb.filter(x => x.empresa === 'aroma' && !x.activo && x.woo_product_id)) {
  const web = wooDe(Number(r.woo_product_id))
  if (!web || web.status !== 'publish') continue
  const hayActivaMismoId = porEmp.aroma.some(a => Number(a.woo_product_id) === Number(r.woo_product_id))
  if (hayActivaMismoId) continue
  add({ tipo: '8_aroma_inactiva_web_publicada', gravedad: 2, woo_id: web.id, fila: filaMini(r), web: webMini(web),
    titulo: `fila aroma INACTIVA "${r.nombre}" vinculada a web #${web.id} publicado (stock web ${web.stock_quantity ?? '-'}): el sync no lo actualiza`,
    accion: 'Si el vino ya no se vende, despublicar en la web; si se vende, reactivar la fila o vincular la fila activa correcta.' })
}
// 8b. filas activas aroma con precio pero sin vínculo cuyo SKU existe en la web y ese producto está vinculado a OTRA fila
for (const r of porEmp.aroma.filter(x => !x.woo_product_id && normSku(x.sku))) {
  for (const p of wooSkuIndex.get(normSku(r.sku)) || []) {
    const due = porEmp.aroma.filter(a => Number(a.woo_product_id) === p.id)
    if (!due.length) continue
    if (due.some(d => claveMatch(d.nombre) === claveMatch(r.nombre))) continue
    add({ tipo: '8_sku_web_tomado_por_otra_fila', gravedad: 3, woo_id: p.id, fila: filaMini(r), web: webMini(p), filas_vinculadas: due.map(filaMini),
      titulo: `fila aroma sin vínculo "${r.nombre}" (SKU ${r.sku}) — la web #${p.id} "${p.name}" con ese SKU está vinculada a "${due[0].nombre}"`,
      accion: 'Probable cruce: la fila vinculada a ese producto web quizá es otro vino. Revisar cuál corresponde a #' + p.id + '.' })
  }
}

// ---------------------------------------------------------------- salida
hallazgos.sort((a, b) => b.gravedad - a.gravedad || a.tipo.localeCompare(b.tipo))
const conteo = {}
for (const h of hallazgos) { conteo[h.tipo] ??= { total: 0, porGravedad: {} }; conteo[h.tipo].total++; conteo[h.tipo].porGravedad[h.gravedad] = (conteo[h.tipo].porGravedad[h.gravedad] || 0) + 1 }

const resumenDatos = {
  supabase_filas: sb.length,
  supabase_activas: { aroma: porEmp.aroma.length, lavid: porEmp.lavid.length },
  aroma_activas_vinculadas: porEmp.aroma.filter(r => r.woo_product_id).length,
  lavid_activas_vinculadas: porEmp.lavid.filter(r => r.woo_product_id).length,
  woo_productos: woo.length,
  woo_por_status: woo.reduce((m, p) => (m[p.status] = (m[p.status] || 0) + 1, m), {}),
  woo_por_tipo: woo.reduce((m, p) => (m[p.type] = (m[p.type] || 0) + 1, m), {}),
  woo_papelera: wooTrash.length,
}

fs.writeFileSync(path.join(OUT_DIR, '_reporte_auditoria_woo.json'), JSON.stringify({ generado: new Date().toISOString(), datos: resumenDatos, conteo, hallazgos }, null, 2))

const NOMBRES = {
  '1_mismo_woo_id': '1. Varias filas -> mismo producto web (misma empresa)',
  '2_par_aroma_lavid': '2. Par aroma/lavid incoherente',
  '2_sin_contraparte': '2b. Fila sin contraparte en la otra empresa',
  '3_sku_distinto': '3. SKU distinto fila vs web',
  '3_web_sin_sku': '3b. Web sin SKU',
  '4_nombre_distinto': '4. Nombre muy distinto fila vs web',
  '5_precio_distinto': '5. Precio muy distinto aroma vs web',
  '6a_vinculo_roto': '6a. Vínculo roto (woo id inexistente / papelera)',
  '6b_web_sin_vinculo': '6b. Producto web publicado sin fila aroma vinculada',
  '7_sku_duplicado_supabase': '7a. SKU duplicado en Supabase (misma empresa)',
  '7_sku_duplicado_web': '7b. SKU duplicado en la web',
  '7_nombre_duplicado_misma_empresa': '7c. Nombre duplicado en la misma empresa',
  '8_web_no_publicado': '8. Vinculado a producto web no publicado',
  '8_vinculado_a_variable': '8. Vinculado a producto variable',
  '8_vinculado_a_variacion': '8. Vinculado a variación',
  '8_fila_sin_precio': '8. Fila aroma vinculada sin precio',
  '8_aroma_inactiva_web_publicada': '8. Fila aroma inactiva con web publicada',
  '8_sku_web_tomado_por_otra_fila': '8. SKU web tomado por otra fila',
}
const esc = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
const fmtFila = f => f ? `\`${f.id.slice(0, 8)}\` ${f.empresa} "${esc(f.nombre)}" SKU ${esc(f.sku) || '-'} $${f.precio_venta}${f.activo ? '' : ' (inactiva)'}${f.woo_product_id ? ` -> #${f.woo_product_id}` : ''}` : ''
const fmtWeb = p => p ? `#${p.id} "${esc(p.nombre)}" SKU ${esc(p.sku) || '-'} $${p.regular_price || p.price || '-'} [${p.status}${p.type && p.type !== 'simple' ? ', ' + p.type : ''}]` : '(no existe)'

let md = `# Auditoría vínculos Supabase <-> WooCommerce\n\nGenerado: ${new Date().toLocaleString('es-AR')} — script \`scripts/auditar-vinculos-woo.mjs\` (solo lectura).\n\n`
md += `Datos: ${resumenDatos.supabase_filas} filas Supabase (activas: aroma ${resumenDatos.supabase_activas.aroma}, lavid ${resumenDatos.supabase_activas.lavid}; vinculadas activas: aroma ${resumenDatos.aroma_activas_vinculadas}, lavid ${resumenDatos.lavid_activas_vinculadas}). Web: ${resumenDatos.woo_productos} productos ${JSON.stringify(resumenDatos.woo_por_status)}, tipos ${JSON.stringify(resumenDatos.woo_por_tipo)}, papelera ${resumenDatos.woo_papelera}.\n\n`
md += `Gravedad: **5** rompe el sync hoy · **4** vínculo casi seguro equivocado · **3** incoherencia a corregir · **2** revisar · **1** informativo.\n\n## Conteo\n\n| Tipo | Total | G5 | G4 | G3 | G2 | G1 |\n|---|---|---|---|---|---|---|\n`
for (const [t, c] of Object.entries(conteo).sort((a, b) => a[0].localeCompare(b[0]))) md += `| ${NOMBRES[t] || t} | ${c.total} | ${[5, 4, 3, 2, 1].map(g => c.porGravedad[g] || '').join(' | ')} |\n`

md += `\n## Top gravedad (todas las de gravedad >= 4)\n\n`
for (const h of hallazgos.filter(h => h.gravedad >= 4)) md += `- **G${h.gravedad}** [${NOMBRES[h.tipo] || h.tipo}] ${esc(h.titulo)}\n  - Acción: ${esc(h.accion)}\n`

const LIMITE_POR_TIPO = 300
const LIMITE_ESPECIAL = { "3_web_sin_sku": 25, "2_sin_contraparte": 40 }
for (const t of Object.keys(NOMBRES)) {
  const hs = hallazgos.filter(h => h.tipo === t)
  if (!hs.length) continue
  md += `\n## ${NOMBRES[t]} (${hs.length})\n\n`
  const lim = LIMITE_ESPECIAL[t] ?? LIMITE_POR_TIPO
  for (const h of hs.slice(0, lim)) {
    md += `- **G${h.gravedad}** ${esc(h.titulo)}\n`
    if (h.web && !Array.isArray(h.web)) md += `  - Web: ${fmtWeb(h.web)}\n`
    if (h.fila) md += `  - Fila: ${fmtFila(h.fila)}\n`
    if (h.filas) for (const f of h.filas) md += `  - Fila: ${fmtFila(f)}\n`
    if (h.aroma) md += `  - Aroma: ${fmtFila(h.aroma)}\n  - Lavid: ${fmtFila(h.lavid)}\n`
    if (h.otras_filas_con_sku_web?.length) for (const f of h.otras_filas_con_sku_web) md += `  - Dueña del SKU web: ${fmtFila(f)}\n`
    if (h.filas_vinculadas) for (const f of h.filas_vinculadas) md += `  - Vinculada hoy: ${fmtFila(f)}\n`
    if (h.candidatos?.length) for (const c of h.candidatos.slice(0, 3)) md += `  - Candidato (${c.por}, sim ${c.sim}): ${fmtFila(c)}\n`
    md += `  - Acción: ${esc(h.accion)}\n`
  }
  if (hs.length > lim) md += `
_(${hs.length - lim} más en el JSON)_
`
}
fs.writeFileSync(path.join(OUT_DIR, '_reporte_auditoria_woo.md'), md)

console.log('\nConteo por tipo:')
for (const [t, c] of Object.entries(conteo).sort((a, b) => a[0].localeCompare(b[0]))) console.log(`  ${t.padEnd(36)} ${String(c.total).padStart(4)}  ${JSON.stringify(c.porGravedad)}`)
console.log(`\nReportes: scripts/_reporte_auditoria_woo.json, scripts/_reporte_auditoria_woo.md`)
