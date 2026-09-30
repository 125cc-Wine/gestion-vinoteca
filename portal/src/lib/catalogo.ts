import 'server-only'
import { db } from './db'
import type { ClientePortal } from './session'
import { indexarReglas, precioPortal, type ReglaPortal } from './precioPortal'

// Lo único que ve el cliente de cada producto. Nunca costo ni stock exacto.
export interface ItemCatalogo {
  id: string
  nombre: string
  bodega: string
  varietal: string
  categoria: string
  precio_lista: number
  precio: number
  descuento: number
  disponible: boolean
}

export interface Catalogo {
  items: ItemCatalogo[]
  marcas: { clave: string; logo: string | null; destacada: boolean }[]   // con logo o destacadas, en orden
}

interface FilaProducto {
  id: string; nombre: string; bodega: string | null; varietal: string | null; categoria: string | null
  precio_venta: number; stock: number | null; portal_oculto: boolean
}

// Todo el catálogo de la empresa del cliente (activo y con precio), con el
// precio y lo oculto según las reglas de gestión > Catálogo > Lista para
// clientes (ver precioPortal.ts). La base es el descuento propio del
// cliente o el general.
export async function catalogoDe(cliente: ClientePortal): Promise<Catalogo> {
  const filas: FilaProducto[] = []
  const PAGINA = 1000
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await db.from('productos')
      .select('id, nombre, bodega, varietal, categoria, precio_venta, stock, portal_oculto')
      .eq('empresa', cliente.empresa).eq('activo', true).gt('precio_venta', 0)
      .order('id').range(desde, desde + PAGINA - 1)
    if (error) throw new Error(error.message)
    filas.push(...((data ?? []) as FilaProducto[]))
    if (!data || data.length < PAGINA) break
  }
  const [{ data: reglas }, { data: marcas }] = await Promise.all([
    db.from('portal_reglas').select('nivel, clave, descuento, oculto'),
    db.from('portal_marcas').select('clave, logo, destacada').or('destacada.eq.true,logo.not.is.null').order('orden'),
  ])
  const idx = indexarReglas((reglas ?? []) as ReglaPortal[])

  const items: ItemCatalogo[] = []
  for (const p of filas) {
    const r = precioPortal(p, idx, cliente.descuento)
    if (r.oculto) continue
    items.push({
      id: p.id, nombre: p.nombre, bodega: p.bodega || '', varietal: p.varietal || '', categoria: p.categoria || '',
      precio_lista: r.lista, precio: r.precio, descuento: r.descuento,
      disponible: (p.stock ?? 0) > 0,
    })
  }
  items.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return { items, marcas: (marcas ?? []) as Catalogo['marcas'] }
}
