// Aplica descripciones a los 5 productos publicados sin description.
// Contenido investigado a mano (WebSearch) o redactado honestamente sin inventar datos.
import { loadWooEnv } from './_woo_env.mjs'
import fs from 'fs'

const { url, authHeader } = loadWooEnv()

const DESCRIPTIONS = {
  10832: `Blend de Ricomenciare Family Winery, la bodega de Viviana Catena en La Consulta, Valle de Uco, con viñedos a 930 metros de altura. Camporotondo combina 35% Cabernet Sauvignon, 35% Merlot, 15% Malbec y 15% Cabernet Franc, con maceración liviana y fermentación maloláctica completa en tanques de acero inoxidable. El nombre es un homenaje de la familia a Camporotondo di Fiastrone, en Le Marche (Italia), de donde partieron sus antepasados vitivinicultores. Un corte de guarda, con buen cuerpo y notas especiadas, pensado para acompañar carnes asadas y comidas de peso.`,
  11063: `Costo de envío a domicilio para pedidos realizados en la tienda online de Aroma de Vid. Se suma automáticamente al carrito según la modalidad de entrega elegida; no corresponde a un producto de vino.`,
  11769: `Servicio de armado de regalo con 3 botellas, para pedidos personalizados gestionados directamente con Aroma de Vid. El contenido específico de cada caja se define junto al cliente al momento de la compra.`,
  11768: `Servicio de armado de regalo personalizado (pedido especial), gestionado directamente con Aroma de Vid. El contenido se define junto al cliente al momento de la compra.`,
  11767: `Servicio de armado de regalo personalizado (pedido especial), gestionado directamente con Aroma de Vid. El contenido se define junto al cliente al momento de la compra.`,
}

const PROGRESS_FILE = 'scripts/_progreso_woo_gaps.json'
let progress = {}
if (fs.existsSync(PROGRESS_FILE)) progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))

async function putProduct(id, body) {
  const res = await fetch(`${url}/wp-json/wc/v3/products/${id}`, {
    method: 'PUT',
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return res.json()
}

for (const [id, description] of Object.entries(DESCRIPTIONS)) {
  const key = `description_${id}`
  if (progress[key]?.status === 'ok') { console.log(`skip ${id} (ya hecho)`); continue }
  try {
    await putProduct(id, { description })
    progress[key] = { status: 'ok', words: description.split(/\s+/).length }
    console.log(`OK  [${id}] descripción aplicada (${description.split(/\s+/).length} palabras)`)
  } catch (e) {
    progress[key] = { status: 'error', error: String(e.message || e) }
    console.log(`ERR [${id}]: ${e.message || e}`)
  }
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}
