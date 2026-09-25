// HTML imprimible de la lista de precios que se le manda al cliente.
// Es la "carta de presentación" de la empresa: tapa con índice de bodegas
// (en listas largas), bodegas agrupadas por tipo de vino, precio de lista y
// precio final si hay descuento, y los sin stock marcados "Consultar".
// Se abre en una ventana nueva y se imprime / guarda como PDF desde el
// navegador (Chrome conserva los links del índice dentro del PDF).
import { esc } from '@/lib/html'

export interface ListaPrecioItem {
  id: string
  nombre: string
  bodega: string
  varietal: string
  categoria: string
  precio_venta: number
  stock: number
}

export interface ListaPrecioOpciones {
  empresa: 'aroma' | 'lavid'
  titulo: string | null
  descuento: number
  validezDias: number
  items: ListaPrecioItem[]
}

const EMPRESAS = {
  aroma: {
    nombre: 'Aroma de Vid', accent: '#7A1022', accentSoft: '#F6ECEC', logo: '/logos/aroma.jpg',
    telefono: '(0223) 491-1705', domicilio: 'Roca 2787, Mar del Plata', web: 'aromadevid.com.ar',
  },
  lavid: {
    nombre: 'La Vid Consultora', accent: '#23508C', accentSoft: '#EAF0F7', logo: '/logos/lavid.png',
    telefono: '(0223) 685-0870', domicilio: 'Roca 2787, Mar del Plata', web: '',
  },
} as const

// Orden de los tipos dentro de cada bodega — el mismo que usa cualquier carta.
const ORDEN_CATEGORIA = ['Espumante', 'Blanco', 'Rosado', 'Tinto', 'Dulce']
const PLURAL_CATEGORIA: Record<string, string> = {
  Espumante: 'Espumantes', Blanco: 'Blancos', Rosado: 'Rosados', Tinto: 'Tintos', Dulce: 'Dulces',
}
// En listas cortas la tapa + índice es más papel que ayuda.
const MIN_GRUPOS_INDICE = 8
const MIN_ITEMS_INDICE = 60

const pesos = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR')

// Fecha local (no toISOString, que es UTC y en Argentina puede correr un día).
function fechaArchivo(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function slug(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function ordenCategoria(c: string) {
  const i = ORDEN_CATEGORIA.indexOf(c)
  return i === -1 ? ORDEN_CATEGORIA.length : i
}

export function listaPreciosHtml(o: ListaPrecioOpciones): string {
  const emp = EMPRESAS[o.empresa]
  const hoy = new Date()
  const vence = new Date(hoy); vence.setDate(vence.getDate() + o.validezDias)
  const fechaLarga = (d: Date) => d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
  const mesAnio = hoy.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase())
  const conDescuento = o.descuento > 0
  const factor = 1 - o.descuento / 100

  // Bodega para vinos; en aperitivos/destilados el varietal hace de rubro
  // ("Whiskies", "Gin"...) — igual que las planillas que se armaban a mano.
  const grupos = new Map<string, ListaPrecioItem[]>()
  for (const it of o.items) {
    const key = it.bodega || it.varietal || 'Otros'
    if (!grupos.has(key)) grupos.set(key, [])
    grupos.get(key)!.push(it)
  }
  const ordenados = Array.from(grupos.entries()).sort((a, b) => a[0].localeCompare(b[0], 'es'))
  const conIndice = ordenados.length >= MIN_GRUPOS_INDICE && o.items.length >= MIN_ITEMS_INDICE
  const sinStock = o.items.filter(i => !(i.stock > 0)).length

  const fila = (p: ListaPrecioItem) => {
    const agotado = !(p.stock > 0)
    const detalle = p.varietal && p.bodega && !p.nombre.toLowerCase().includes(p.varietal.toLowerCase())
      ? `<span class="var">${esc(p.varietal)}</span>` : ''
    return `<tr class="${agotado ? 'agotado' : ''}">
      <td class="prod"><span class="nom">${esc(p.nombre)}</span>${detalle}${agotado ? '<span class="pill">Consultar disponibilidad</span>' : ''}</td>
      ${conDescuento
        ? `<td class="num lista">${pesos(p.precio_venta)}</td><td class="num final">${pesos(p.precio_venta * factor)}</td>`
        : `<td class="num final">${pesos(p.precio_venta)}</td>`}
    </tr>`
  }

  const secciones = ordenados.map(([grupo, items]) => {
    const porCat = new Map<string, ListaPrecioItem[]>()
    for (const it of items) {
      const c = it.categoria || ''
      if (!porCat.has(c)) porCat.set(c, [])
      porCat.get(c)!.push(it)
    }
    const cats = Array.from(porCat.entries()).sort((a, b) => ordenCategoria(a[0]) - ordenCategoria(b[0]) || a[0].localeCompare(b[0]))
    // Un solo tipo (o sin tipo, como destilados) no necesita subtítulo.
    const mostrarCat = cats.length > 1
    const cuerpo = cats.map(([cat, its]) => `
      ${mostrarCat && cat ? `<tr class="cat"><td colspan="${conDescuento ? 3 : 2}"><span class="dot dot-${slug(cat)}"></span>${esc(PLURAL_CATEGORIA[cat] ?? cat)}</td></tr>` : ''}
      ${its.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(fila).join('')}`).join('')
    return `<section class="grupo" id="g-${slug(grupo)}">
      <h2><span>${esc(grupo)}</span><small>${items.length} ${items.length === 1 ? 'etiqueta' : 'etiquetas'}</small></h2>
      <table>
        <colgroup><col>${conDescuento ? '<col class="c-num"><col class="c-num">' : '<col class="c-num">'}</colgroup>
        <thead><tr><th>Producto</th>${conDescuento ? `<th class="num">Lista</th><th class="num">Su precio <em>−${o.descuento}%</em></th>` : '<th class="num">Precio</th>'}</tr></thead>
        <tbody>${cuerpo}</tbody>
      </table>
    </section>`
  }).join('')

  const indice = conIndice ? `
    <nav class="indice">
      <h3>Índice</h3>
      <ol>${ordenados.map(([g, its]) => `<li><a href="#g-${slug(g)}"><span>${esc(g)}</span><i></i><b>${its.length}</b></a></li>`).join('')}</ol>
    </nav>` : ''

  const tituloLista = o.titulo ? esc(o.titulo) : 'Lista de precios'
  const docTitle = ['Lista de precios', emp.nombre, o.titulo, fechaArchivo(hoy)].filter(Boolean).join(' - ')
  const contacto = [emp.telefono, emp.domicilio, emp.web].filter(Boolean).join('  ·  ')
  const pie = `${emp.nombre}  ·  ${contacto}`

  const encabezado = conIndice ? `
    <header class="tapa">
      <div class="marca"><img src="${emp.logo}" alt="" onerror="this.style.display='none'"><span>${emp.nombre}</span></div>
      <div class="tapa-cuerpo">
        <div class="kicker">Lista de precios · ${mesAnio}</div>
        <h1>${tituloLista}</h1>
        <div class="datos">
          <div><b>${o.items.length}</b><span>etiquetas</span></div>
          <div><b>${ordenados.length}</b><span>bodegas</span></div>
          ${conDescuento ? `<div><b>${o.descuento}%</b><span>de descuento</span></div>` : ''}
          <div><b>${vence.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</b><span>precios válidos hasta</span></div>
        </div>
      </div>
      ${indice}
      <p class="nota">Precios en pesos argentinos, válidos hasta el ${fechaLarga(vence)}.${sinStock > 0 ? ' Los productos marcados <span class="pill">Consultar disponibilidad</span> no tienen stock inmediato.' : ''}</p>
    </header>` : `
    <header class="cab">
      <div class="marca"><img src="${emp.logo}" alt="" onerror="this.style.display='none'"><span>${emp.nombre}</span></div>
      <div class="cab-der">
        <div class="kicker">Lista de precios · ${mesAnio}</div>
        <h1>${tituloLista}</h1>
        <div class="validez">Válida hasta el ${fechaLarga(vence)}${conDescuento ? ` · ${o.descuento}% de descuento` : ''}</div>
      </div>
    </header>`

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>${esc(docTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--ac:${emp.accent};--ac-soft:${emp.accentSoft};--ink:#1E1A18;--mute:#77706B;--line:#E7E1DA;--paper:#FFFFFF}
  *{box-sizing:border-box}
  html,body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,Arial,sans-serif;font-size:10.5pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{max-width:190mm;margin:0 auto;padding:10mm 0}
  @page{size:A4;margin:14mm 12mm 16mm;
    @bottom-left{content:"${pie.replace(/[\\"<]/g, '')}";font:7.5pt Inter,Arial,sans-serif;color:#9A928C}
    @bottom-right{content:"Página " counter(page) " de " counter(pages);font:7.5pt Inter,Arial,sans-serif;color:#9A928C}}
  @page:first{@bottom-left{content:none}}
  @media print{body{padding:0;max-width:none}}
  .marca{display:flex;align-items:center;gap:10px;font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:17pt;color:var(--ac)}
  .marca img{height:40px;width:auto;object-fit:contain}
  .kicker{font-size:8pt;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--mute)}
  h1{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;color:var(--ink);margin:4px 0 0;line-height:1.05}

  /* Tapa (listas largas) */
  .tapa{break-after:page}
  .tapa-cuerpo{margin:22mm 0 10mm;padding-left:6mm;border-left:3px solid var(--ac)}
  .tapa h1{font-size:40pt}
  .datos{display:flex;gap:10mm;margin-top:8mm}
  .datos div{display:flex;flex-direction:column}
  .datos b{font-family:'Cormorant Garamond',Georgia,serif;font-size:22pt;font-weight:600;color:var(--ac);line-height:1}
  .datos span{font-size:7.5pt;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin-top:3px}
  .indice{background:var(--ac-soft);border-radius:4px;padding:6mm 7mm 5mm}
  .indice h3{margin:0 0 4mm;font-size:8pt;letter-spacing:.16em;text-transform:uppercase;color:var(--ac)}
  .indice ol{list-style:none;margin:0;padding:0;columns:2;column-gap:10mm}
  .indice li{break-inside:avoid}
  .indice a{display:flex;align-items:baseline;gap:6px;padding:1.6mm 0;color:var(--ink);text-decoration:none;font-size:9.5pt}
  .indice i{flex:1;border-bottom:1px dotted #BFB6AE;transform:translateY(-3px)}
  .indice b{font-weight:600;color:var(--mute);font-size:8.5pt}
  .nota{font-size:8pt;color:var(--mute);margin:5mm 0 0;line-height:1.5}

  /* Encabezado compacto (listas cortas) */
  .cab{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:5mm;border-bottom:2px solid var(--ac);margin-bottom:6mm}
  .cab-der{text-align:right}
  .cab h1{font-size:24pt}
  .validez{font-size:8.5pt;color:var(--mute);margin-top:3px}

  /* Bodegas */
  .grupo{margin:0 0 7mm}
  .grupo h2{display:flex;justify-content:space-between;align-items:baseline;margin:0 0 1.5mm;padding-bottom:1.5mm;border-bottom:1.5px solid var(--ac);break-after:avoid}
  .grupo h2 span{font-family:'Cormorant Garamond',Georgia,serif;font-size:17pt;font-weight:600;color:var(--ac)}
  .grupo h2 small{font-size:7.5pt;letter-spacing:.1em;text-transform:uppercase;color:var(--mute)}
  table{width:100%;border-collapse:collapse}
  col.c-num{width:27mm}
  thead th{font-size:7pt;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);text-align:left;padding:1.5mm 2mm}
  thead th em{font-style:normal;color:var(--ac)}
  th.num,td.num{text-align:right;white-space:nowrap}
  tbody tr{break-inside:avoid}
  tbody td{padding:1.7mm 2mm;border-bottom:1px solid var(--line);vertical-align:baseline}
  .nom{font-weight:500}
  .var{color:var(--mute);margin-left:6px;font-size:9pt}
  .lista{color:var(--mute);text-decoration:line-through;font-size:9pt}
  .final{font-weight:700;font-variant-numeric:tabular-nums}
  tr.cat td{border-bottom:none;padding:3.5mm 2mm 1mm;font-size:7.5pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ink)}
  .dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;background:#B9A99A;vertical-align:1px}
  .dot-tinto{background:#7A1022}.dot-blanco{background:#D9C27A}.dot-rosado{background:#E59AA6}.dot-espumante{background:#C9B98C;box-shadow:inset 0 0 0 1.5px #EFE6CC}.dot-dulce{background:#B8742A}
  tr.agotado .nom,tr.agotado .final{color:#9A928C}
  .pill{display:inline-block;margin-left:8px;padding:.3mm 2mm;border:1px solid #D8CFC7;border-radius:10px;font-size:6.8pt;font-weight:600;letter-spacing:.04em;color:var(--mute);white-space:nowrap;vertical-align:1px}
  .fin{margin-top:8mm;padding-top:4mm;border-top:1px solid var(--line);font-size:8pt;color:var(--mute);display:flex;justify-content:space-between}
</style></head><body>
${encabezado}
<main>${secciones}</main>
<footer class="fin"><span>${emp.nombre} · ${esc(contacto)}</span><span>Precios válidos hasta el ${fechaLarga(vence)}</span></footer>
</body></html>`
}

// Abre la lista en una ventana nueva y lanza la impresión cuando las
// tipografías terminaron de cargar (si no, el PDF sale con la de respaldo).
export function imprimirListaPrecios(o: ListaPrecioOpciones) {
  const w = window.open('', '_blank', 'width=960,height=800')
  if (!w) return false
  w.document.write(listaPreciosHtml(o))
  w.document.close()
  w.focus()
  let lanzado = false
  const lanzar = () => { if (lanzado) return; lanzado = true; setTimeout(() => w.print(), 150) }
  // Esperar a que cargue la hoja de Google Fonts y después a las fuentes.
  w.addEventListener('load', () => {
    const fonts = w.document.fonts
    if (fonts?.ready) fonts.ready.then(lanzar)
    else lanzar()
  })
  setTimeout(lanzar, 4000)
  return true
}
