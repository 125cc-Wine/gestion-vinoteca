// Cálculo del precio que ve un cliente en el portal de pedidos.
// ⚠ Hay una copia idéntica en src/lib/precioPortal.ts de la app de gestión (son dos apps
// separadas): si se cambia una, cambiar la otra.
//
// Descuento, de lo más específico a lo más general:
//   1. regla del producto  2. regla de la marca/bodega  3. regla del grupo
//   (tipo de vino, o rubro de bebida)  4. base = descuento propio del
//   cliente, o el general del portal si no tiene.
// Oculto: si el producto está marcado oculto, o su marca o su grupo.

export interface ReglaPortal {
  nivel: 'grupo' | 'marca' | 'producto'
  clave: string
  descuento: number | null
  oculto: boolean
}

export interface ProductoPrecio {
  id: string
  categoria: string | null
  bodega: string | null
  varietal: string | null
  precio_venta: number
  portal_oculto?: boolean | null
}

export type OrigenDescuento = 'producto' | 'marca' | 'grupo' | 'base'

// Vinos: por tipo (Tinto, Blanco…). Bebidas (categoría "Otro"): por rubro,
// que en gestión se guarda en el campo varietal.
export function grupoPrecio(p: { categoria: string | null; varietal: string | null }) {
  return p.categoria === 'Otro' ? (p.varietal || 'Otras bebidas') : (p.categoria || 'Sin categoría')
}

export function indexarReglas(reglas: ReglaPortal[]) {
  return new Map(reglas.map(r => [`${r.nivel}:${r.clave}`, r]))
}

export function precioPortal(p: ProductoPrecio, reglas: Map<string, ReglaPortal>, base: number) {
  const rProducto = reglas.get(`producto:${p.id}`)
  const rMarca = p.bodega ? reglas.get(`marca:${p.bodega}`) : undefined
  const rGrupo = reglas.get(`grupo:${grupoPrecio(p)}`)

  const oculto = !!(p.portal_oculto || rProducto?.oculto || rMarca?.oculto || rGrupo?.oculto)
  let descuento = base
  let origen: OrigenDescuento = 'base'
  for (const [r, o] of [[rGrupo, 'grupo'], [rMarca, 'marca'], [rProducto, 'producto']] as const) {
    if (r && r.descuento != null) { descuento = Number(r.descuento); origen = o }
  }
  const lista = Number(p.precio_venta)
  return { oculto, descuento, origen, lista, precio: Math.round(lista * (1 - descuento / 100)) }
}
