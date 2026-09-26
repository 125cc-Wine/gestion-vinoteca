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
  descuento: number
  items: ItemCatalogo[]
}

interface FilaProducto {
  id: string; nombre: string; bodega: string | null; varietal: string | null; categoria: string | null
  precio_venta: number; stock: number | null
}

// Todo el catálogo de la empresa del cliente: vinos, vermouths y bebidas
// activos y con precio, menos lo marcado "oculto del portal" desde gestión
// (productos.portal_oculto: comida, aceites, "Varios", etc.). El precio es
// el de lista con el descuento del cliente (propio o el general).
export async function catalogoDe(cliente: ClientePortal): Promise<Catalogo> {
  const filas: FilaProducto[] = []
  const PAGINA = 1000
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await db.from('productos')
      .select('id, nombre, bodega, varietal, categoria, precio_venta, stock')
      .eq('empresa', cliente.empresa).eq('activo', true).eq('portal_oculto', false).gt('precio_venta', 0)
      .order('id').range(desde, desde + PAGINA - 1)
    if (error) throw new Error(error.message)
    filas.push(...((data ?? []) as FilaProducto[]))
    if (!data || data.length < PAGINA) break
  }

  const factor = 1 - cliente.descuento / 100
  const items = filas.map(p => ({
    id: p.id, nombre: p.nombre, bodega: p.bodega || '', varietal: p.varietal || '', categoria: p.categoria || '',
    precio_lista: Number(p.precio_venta),
    precio: Math.round(Number(p.precio_venta) * factor),
    disponible: (p.stock ?? 0) > 0,
  }))
  items.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return { descuento: cliente.descuento, items }
}
