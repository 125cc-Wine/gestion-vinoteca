// Ítems de compras: desde 2026-09-24 se cargan solo en UNIDADES y PRECIO POR
// UNIDAD (cantidad + precio_unitario). Antes el formulario tenía cajas, unidades
// por caja y precio POR CAJA, y en esos ítems viejos `precio_unitario` guarda
// el precio de la caja (ver unidades_por_caja > 1). `cantidad` siempre fue en
// unidades y `subtotal` siempre fue el importe real, así que stock y totales
// no cambian: solo hay que convertir el precio al mostrar o editar.

export interface ItemCompraGuardado {
  producto_id?: string
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  cajas?: number
  unidades_por_caja?: number
}

// Precio por unidad real de un ítem, sea nuevo (ya por unidad) o viejo (por caja).
export function precioPorUnidad(it: Pick<ItemCompraGuardado, 'precio_unitario' | 'unidades_por_caja'>): number {
  const upk = it.unidades_por_caja || 1
  const p = it.precio_unitario || 0
  return upk > 1 ? Math.round((p / upk) * 100) / 100 : p
}

// Lleva un ítem (nuevo o viejo) al formato actual: unidades + precio por
// unidad, sin los campos de caja. Respeta el subtotal guardado.
export function normalizarItemCompra<T extends ItemCompraGuardado>(it: T): Omit<T, 'cajas' | 'unidades_por_caja'> {
  const { cajas: _c, unidades_por_caja: _u, ...resto } = it
  return { ...resto, precio_unitario: precioPorUnidad(it) }
}
