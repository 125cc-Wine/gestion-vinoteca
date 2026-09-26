import 'server-only'
import { db } from './db'
import type { ClientePortal } from './session'

// Lo único que ve el cliente de cada producto. Nunca costo ni stock exacto.
export interface ItemCatalogo {
  id: string
  nombre: string
  bodega: string
  varietal: string
  categoria: string
  precio_lista: number
  precio: number
  disponible: boolean
}

export interface Catalogo {
  lista: string
  descuento: number
  items: ItemCatalogo[]
}

interface FilaProducto {
  id: string; empresa: string; gemelo_id: string | null; activo: boolean
  nombre: string; bodega: string | null; varietal: string | null; categoria: string | null
  precio_venta: number; stock: number | null
}
const COLS = 'id, empresa, gemelo_id, activo, nombre, bodega, varietal, categoria, precio_venta, stock'

async function productosPorId(ids: string[]): Promise<FilaProducto[]> {
  const out: FilaProducto[] = []
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await db.from('productos').select(COLS).in('id', ids.slice(i, i + 100))
    if (error) throw new Error(error.message)
    out.push(...((data ?? []) as FilaProducto[]))
  }
  return out
}

// Arma el catálogo del cliente a partir de su lista asignada. Las listas son
// compartidas entre Aroma y La Vid, así que un producto de la lista puede ser
// la fila de la otra empresa: se pasa a su gemelo (misma botella, fila de la
// empresa del cliente) para usar su precio.
export async function catalogoDe(cliente: ClientePortal): Promise<Catalogo | null> {
  if (!cliente.lista_precio_id) return null
  const { data: lista } = await db.from('listas_precio')
    .select('nombre, producto_ids, descuento').eq('id', cliente.lista_precio_id).maybeSingle()
  if (!lista) return null

  const filas = await productosPorId(lista.producto_ids ?? [])
  const ajenas = filas.filter(f => f.empresa !== cliente.empresa && f.gemelo_id)
  const gemelos = ajenas.length ? await productosPorId(ajenas.map(f => f.gemelo_id!)) : []
  const porId = new Map(gemelos.map(g => [g.id, g]))

  const descuento = Number(lista.descuento) || 0
  const vistos = new Set<string>()
  const items: ItemCatalogo[] = []
  for (const f of filas) {
    const p = f.empresa === cliente.empresa ? f : (f.gemelo_id ? porId.get(f.gemelo_id) : undefined)
    if (!p || p.empresa !== cliente.empresa || !p.activo || !(p.precio_venta > 0) || vistos.has(p.id)) continue
    vistos.add(p.id)
    items.push({
      id: p.id, nombre: p.nombre, bodega: p.bodega || '', varietal: p.varietal || '', categoria: p.categoria || '',
      precio_lista: Number(p.precio_venta),
      precio: Math.round(Number(p.precio_venta) * (1 - descuento / 100)),
      disponible: (p.stock ?? 0) > 0,
    })
  }
  items.sort((a, b) => (a.bodega || a.varietal).localeCompare(b.bodega || b.varietal, 'es') || a.nombre.localeCompare(b.nombre, 'es'))
  return { lista: lista.nombre, descuento, items }
}
