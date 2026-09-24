export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { claveMatch, normalizarNombre } from '@/lib/woocommerce'

// POST /api/woo/publicar  { producto_id, publicar?: boolean, vincularA?: number, simular?: boolean }
//
// Crea en WooCommerce un producto que existe en Gestión pero no en la web, y
// lo deja vinculado (woo_product_id). Antes había que crearlo a mano en
// WordPress y después "Vincular web" por nombre — doble carga y fuente de
// los vínculos cruzados.
//
// - Precio, SKU y stock salen del sistema. El stock va COMPLETO: el
//   producto es nuevo en la web (de ahí en más se sincroniza por diferencias,
//   ver src/lib/woo-stock-cola.ts).
// - Categorías: se buscan por nombre entre las que ya existen en la web
//   (tipo de vino > varietal, espirituosas, bodega). Nunca se crean nuevas.
// - Si en la web ya hay un producto con el mismo nombre, NO crea un
//   duplicado: devuelve 409 con ese producto, y el front ofrece vincularlo
//   (mismo endpoint con vincularA).
// - publicar=false (default) lo crea como borrador para cargarle foto y
//   descripción en WordPress antes de mostrarlo.
// - simular=true: devuelve lo que crearía (categorías, SKU...) sin escribir.

const WOO_URL = process.env.WOOCOMMERCE_URL!
function wooUrl(path: string, extra: Record<string, string | number> = {}) {
  const params = new URLSearchParams({
    consumer_key: process.env.WOOCOMMERCE_CONSUMER_KEY!,
    consumer_secret: process.env.WOOCOMMERCE_CONSUMER_SECRET!,
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])),
  })
  return `${WOO_URL}/wp-json/wc/v3/${path}?${params}`
}
async function woo<T>(path: string, init?: RequestInit, extra?: Record<string, string | number>): Promise<T> {
  const res = await fetch(wooUrl(path, extra), { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json' } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || `WooCommerce ${res.status}`)
  return data as T
}

interface Cat { id: number; name: string; parent: number }
interface WooProd { id: number; name: string; status: string; sku: string; permalink: string }

// Sinónimos entre cómo se escribe en Gestión y cómo se llama la categoría web.
const ALIAS: Record<string, string> = {
  whiskies: 'whiskyes', whisky: 'whiskyes', torrontes: 'torrontes',
  espumante: 'espumosos', 'pinot gris': 'pinot grigio',
}
const norm = (s: string) => { const n = normalizarNombre(s); return ALIAS[n] ?? n }

async function categoriasWeb(): Promise<Cat[]> {
  const todas: Cat[] = []
  for (let page = 1; page <= 5; page++) {
    const lote = await woo<Cat[]>('products/categories', undefined, { per_page: 100, page, _fields: 'id,name,parent' })
    todas.push(...lote)
    if (lote.length < 100) break
  }
  return todas
}

function elegirCategorias(cats: Cat[], p: { nombre: string; categoria: string | null; varietal: string | null; bodega: string | null }): number[] {
  const hija = (parent: number, nombre: string) => cats.find(c => c.parent === parent && norm(c.name) === norm(nombre))
  const raiz = (nombre: string) => cats.find(c => c.parent === 0 && norm(c.name) === norm(nombre))
  const ids: number[] = []
  const varietal = (p.varietal || '').trim()

  const vinos = raiz('Vinos')
  const tipoPorCategoria: Record<string, [string, string]> = {
    // categoria -> [subcategoría de Vinos, cómo se llama el "blend" ahí]
    Tinto: ['Vinos Tintos', 'Blend de tintas'],
    Blanco: ['Vino Blancos', 'Blend de Blancas'],
    Rosado: ['Rosados', 'Blend'],
    Espumante: ['Espumosos', ''],
  }
  const tipo = p.categoria ? tipoPorCategoria[p.categoria] : undefined
  if (vinos && tipo) {
    const sub = hija(vinos.id, tipo[0])
    ids.push(vinos.id)
    if (sub) {
      ids.push(sub.id)
      if (varietal) {
        const v = hija(sub.id, varietal) ?? (norm(varietal) === 'blend' && tipo[1] ? hija(sub.id, tipo[1]) : undefined)
        if (v) ids.push(v.id)
      }
    }
  } else if (varietal) {
    // Espirituosas (Gin, Whiskies...) o categorías sueltas (Licores).
    const esp = raiz('Espirituosas')
    const v = (esp && hija(esp.id, varietal)) || raiz(varietal)
    if (v) { if (esp && v.parent === esp.id) ids.push(esp.id); ids.push(v.id) }
  }

  // Bodega: por el campo bodega, o si el nombre del producto la contiene
  // (muchos productos no tienen bodega cargada pero sí la llevan en el nombre).
  const bodegas = raiz('Bodegas')
  if (bodegas) {
    const hijas = cats.filter(c => c.parent === bodegas.id)
    let b = p.bodega ? hijas.find(c => norm(c.name) === norm(p.bodega!)) : undefined
    if (!b) {
      const n = ` ${normalizarNombre(p.nombre)} `
      b = hijas
        .filter(c => n.includes(` ${normalizarNombre(c.name)} `))
        .sort((a, z) => z.name.length - a.name.length)[0]
    }
    if (b) ids.push(bodegas.id, b.id)
  }
  return Array.from(new Set(ids))
}

export async function POST(req: NextRequest) {
  if (!process.env.WOOCOMMERCE_CONSUMER_KEY || !WOO_URL) {
    return NextResponse.json({ error: 'WooCommerce no configurado' }, { status: 400 })
  }
  const body = await req.json().catch(() => ({}))
  const productoId: string | undefined = body.producto_id
  if (!productoId) return NextResponse.json({ error: 'producto_id requerido' }, { status: 400 })

  const { data: prod, error } = await supabase
    .from('productos')
    .select('id, nombre, sku, precio_venta, stock, categoria, varietal, bodega, woo_product_id, activo')
    .eq('id', productoId)
    .single()
  if (error || !prod) return NextResponse.json({ error: error?.message ?? 'Producto no encontrado' }, { status: 404 })
  if (prod.woo_product_id) {
    return NextResponse.json({ error: `Ya está vinculado al producto web #${prod.woo_product_id}` }, { status: 409 })
  }

  const vincular = async (wooId: number) => {
    // Se vincula esta fila; el trigger de gemelos copia el vínculo a la otra empresa.
    const { error: e } = await supabase.from('productos').update({ woo_product_id: wooId }).eq('id', prod.id)
    if (e) throw new Error(e.message)
  }
  const links = (p: WooProd) => ({
    id: p.id, nombre: p.name, estado: p.status, permalink: p.permalink,
    editar: `${WOO_URL}/wp-admin/post.php?post=${p.id}&action=edit`,
  })

  try {
    // Vincular a uno que ya existe (después de un 409 por nombre repetido).
    if (body.vincularA) {
      const existente = await woo<WooProd>(`products/${Number(body.vincularA)}`)
      const { count } = await supabase.from('productos').select('id', { count: 'exact', head: true })
        .eq('empresa', 'aroma').eq('activo', true).eq('woo_product_id', existente.id)
      if (count) return NextResponse.json({ error: `El producto web #${existente.id} ya está vinculado a otro producto` }, { status: 409 })
      await vincular(existente.id)
      return NextResponse.json({ accion: 'vinculado', producto: links(existente) })
    }

    // ¿Ya existe en la web con el mismo nombre? (evita duplicados)
    const encontrados = await woo<WooProd[]>('products', undefined, {
      search: prod.nombre, status: 'any', per_page: 20, _fields: 'id,name,status,sku,permalink',
    })
    const clave = claveMatch(prod.nombre)
    const igual = encontrados.find(p => claveMatch(p.name) === clave && p.status !== 'trash')
    if (igual) {
      return NextResponse.json({
        error: `Ya existe en la web un producto con ese nombre: "${igual.name}" (#${igual.id})`,
        existente: links(igual),
      }, { status: 409 })
    }

    // SKU: en WooCommerce es único. Si ya lo usa otro producto (hay SKUs de
    // proveedor repetidos entre vinos distintos), se crea sin SKU.
    let sku = (prod.sku || '').trim()
    const avisos: string[] = []
    if (sku) {
      const conSku = await woo<WooProd[]>('products', undefined, { sku, status: 'any', _fields: 'id,name' })
      if (conSku.length) {
        avisos.push(`El SKU ${sku} ya lo usa "${conSku[0].name}" en la web: el producto va sin SKU.`)
        sku = ''
      }
    }

    const cats = await categoriasWeb()
    const categorias = elegirCategorias(cats, prod)
    if (!categorias.length) avisos.push('No se encontró una categoría web que coincida: asignala en WordPress.')
    if (body.simular) {
      return NextResponse.json({
        accion: 'simulacion', nombre: prod.nombre, sku: sku || null, precio: prod.precio_venta, stock: prod.stock,
        estado: body.publicar ? 'publish' : 'draft',
        categorias: categorias.map(id => cats.find(c => c.id === id)?.name), avisos,
      })
    }

    const creado = await woo<WooProd>('products', {
      method: 'POST',
      body: JSON.stringify({
        name: prod.nombre,
        type: 'simple',
        status: body.publicar ? 'publish' : 'draft',
        regular_price: String(prod.precio_venta ?? 0),
        ...(sku ? { sku } : {}),
        manage_stock: true,
        stock_quantity: Math.max(0, prod.stock ?? 0),
        categories: categorias.map(id => ({ id })),
      }),
    })
    await vincular(creado.id)
    return NextResponse.json({ accion: 'creado', producto: links(creado), categorias: categorias.length, avisos })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error desconocido' }, { status: 502 })
  }
}
