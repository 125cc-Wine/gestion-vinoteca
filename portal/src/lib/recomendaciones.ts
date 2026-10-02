import 'server-only'
import { db } from './db'
import type { ItemCatalogo } from './catalogo'

// "Para vos": a partir de lo que el cliente ya compró (ventas de gestión y
// pedidos del portal todavía sin venta), las bodegas que más pide y los
// productos para volver a pedir. Solo se muestra lo que hoy está en su
// catálogo (lo oculto o discontinuado no aparece).

export interface Recomendaciones {
  bodegas: { clave: string; botellas: number }[]
  productos: { id: string; botellas: number; veces: number; ultima: string }[]
}

interface Linea { producto_id?: string; cantidad?: number }

export async function recomendacionesDe(clienteId: string, catalogo: ItemCatalogo[]): Promise<Recomendaciones> {
  const [{ data: ventas }, { data: pedidos }] = await Promise.all([
    db.from('ventas').select('items, created_at').eq('cliente_id', clienteId).neq('estado', 'cancelado')
      .order('created_at', { ascending: false }).limit(300),
    db.from('pedidos').select('items, created_at').eq('cliente_id', clienteId).neq('estado', 'cancelado')
      .is('venta_id', null).order('created_at', { ascending: false }).limit(100),
  ])

  // Por producto: botellas, en cuántas compras apareció y la última vez.
  const porProducto = new Map<string, { botellas: number; veces: number; ultima: string }>()
  for (const c of [...(ventas ?? []), ...(pedidos ?? [])]) {
    const vistos = new Set<string>()
    for (const l of (Array.isArray(c.items) ? c.items : []) as Linea[]) {
      if (!l?.producto_id) continue
      const p = porProducto.get(l.producto_id) ?? { botellas: 0, veces: 0, ultima: c.created_at }
      p.botellas += Math.max(0, Number(l.cantidad) || 0)
      if (!vistos.has(l.producto_id)) { p.veces++; vistos.add(l.producto_id) }
      if (c.created_at > p.ultima) p.ultima = c.created_at
      porProducto.set(l.producto_id, p)
    }
  }
  if (!porProducto.size) return { bodegas: [], productos: [] }

  // Bodega de cada producto comprado (también de los que ya no están en el
  // catálogo: cuentan para saber qué bodegas le gustan).
  const enCatalogo = new Map(catalogo.map(i => [i.id, i]))
  const faltan = Array.from(porProducto.keys()).filter(id => !enCatalogo.has(id))
  const bodegaDe = new Map<string, string>()
  for (const i of catalogo) if (i.bodega) bodegaDe.set(i.id, i.bodega)
  for (let k = 0; k < faltan.length; k += 200) {
    const { data } = await db.from('productos').select('id, bodega, categoria').in('id', faltan.slice(k, k + 200))
    for (const p of data ?? []) if (p.bodega && p.categoria !== 'Otro') bodegaDe.set(p.id, p.bodega)
  }

  const bodegasConItems = new Set(catalogo.filter(i => i.categoria !== 'Otro').map(i => i.bodega))
  const porBodega = new Map<string, number>()
  for (const [id, p] of Array.from(porProducto.entries())) {
    const b = bodegaDe.get(id)
    const item = enCatalogo.get(id)
    if (!b || (item && item.categoria === 'Otro') || !bodegasConItems.has(b)) continue
    porBodega.set(b, (porBodega.get(b) ?? 0) + p.botellas)
  }

  return {
    bodegas: Array.from(porBodega.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([clave, botellas]) => ({ clave, botellas })),
    productos: Array.from(porProducto.entries())
      .filter(([id]) => enCatalogo.has(id))
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => Number(enCatalogo.get(b.id)!.disponible) - Number(enCatalogo.get(a.id)!.disponible) || b.veces - a.veces || b.botellas - a.botellas)
      .slice(0, 10),
  }
}
