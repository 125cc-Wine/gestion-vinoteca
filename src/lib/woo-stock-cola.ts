import { waitUntil } from '@vercel/functions'
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { wooGetEstadoPorId, wooUpdateProductsBatch, type WooBatchItem } from '@/lib/woocommerce'

// Sync de stock a la web INDIVIDUAL por producto.
//
// Un trigger en la base (sql/2026-09-woo-stock-cola.sql) anota en
// woo_stock_cola la DIFERENCIA de stock de cada producto vinculado que cambia
// (venta, compra, edición manual, carga masiva... cualquier camino). Acá se
// procesa esa cola: se suman las diferencias por producto web, se lee el
// stock ACTUAL en la web solo de esos productos y se le aplica la diferencia.
//
// Ventas, compras, pedidos, etc. mandan la DIFERENCIA: una compra de 6 suma
// 6 en la web y una venta de 2 en el local resta 2.
//
// Cuando el stock se FIJA a mano (edición en Productos, Depósito, Inventario,
// cargas masivas → rpc fijar_stock, sql/2026-09-woo-stock-exacto.sql) la fila
// viene con absoluto = true y la web queda con ese mismo número: sumar la
// diferencia arrastraba desfasajes viejos (web 4 + 6 cargados = 10).

interface FilaCola { id: number; producto_id: string; woo_product_id: number; delta: number; stock_sistema: number | null; absoluto: boolean }

export async function procesarColaStockWoo(): Promise<{ procesados: number; errores: number }> {
  if (!process.env.WOOCOMMERCE_CONSUMER_KEY) return { procesados: 0, errores: 0 }

  // Tomar las pendientes marcándolas 'procesando' en un solo UPDATE: si dos
  // pedidos procesan la cola a la vez, cada fila la toma uno solo (si no, la
  // misma diferencia se aplicaría dos veces en la web).
  const { data: filas, error } = await supabase
    .from('woo_stock_cola')
    .update({ estado: 'procesando' })
    .eq('estado', 'pendiente')
    .select('id, producto_id, woo_product_id, delta, stock_sistema, absoluto')
  if (error) { console.error('woo_stock_cola:', error.message); return { procesados: 0, errores: 0 } }
  if (!filas || filas.length === 0) return { procesados: 0, errores: 0 }

  const marcar = (ids: number[], campos: Record<string, unknown>) =>
    supabase.from('woo_stock_cola').update({ ...campos, procesado_at: new Date().toISOString() }).in('id', ids)

  const porWooId = new Map<number, FilaCola[]>()
  for (const f of filas as FilaCola[]) {
    porWooId.set(f.woo_product_id, [...(porWooId.get(f.woo_product_id) ?? []), f])
  }

  // Varios productos de aroma activos en el mismo producto web: no se sabe
  // cuál manda (ver agruparConflictos). No se toca la web; queda marcado.
  const wooIds = Array.from(porWooId.keys())
  const { data: vinculados } = await supabase
    .from('productos')
    .select('woo_product_id')
    .eq('empresa', 'aroma')
    .eq('activo', true)
    .in('woo_product_id', wooIds)
  const cuenta = new Map<number, number>()
  for (const v of vinculados ?? []) cuenta.set(v.woo_product_id, (cuenta.get(v.woo_product_id) ?? 0) + 1)
  const enConflicto = wooIds.filter(id => (cuenta.get(id) ?? 0) > 1)
  if (enConflicto.length) {
    await marcar(enConflicto.flatMap(id => porWooId.get(id)!.map(f => f.id)),
      { estado: 'conflicto', error: 'Varios productos vinculados al mismo producto web' })
  }

  const aProcesar = wooIds.filter(id => !enConflicto.includes(id))
  let procesados = 0, errores = 0
  if (aProcesar.length === 0) return { procesados, errores }

  let web
  try {
    web = await wooGetEstadoPorId(aProcesar)
  } catch (e) {
    // La web no respondió: vuelven a pendiente para el próximo intento.
    await supabase.from('woo_stock_cola').update({ estado: 'pendiente' })
      .in('id', aProcesar.flatMap(id => porWooId.get(id)!.map(f => f.id)))
    console.error('woo_stock_cola: no se pudo leer la web:', e)
    return { procesados, errores: aProcesar.length }
  }

  const items: WooBatchItem[] = []
  const antesDespues = new Map<number, [number, number]>()
  for (const wooId of aProcesar) {
    const filasProd = porWooId.get(wooId)!
    const estado = web.get(wooId)
    if (!estado) {
      await marcar(filasProd.map(f => f.id), { estado: 'error', error: 'El producto no existe en la web' })
      errores++
      continue
    }
    // En orden: un stock fijado pisa lo anterior; las diferencias posteriores se le suman.
    let valor = estado.stock
    for (const f of [...filasProd].sort((a, b) => a.id - b.id)) {
      valor = f.absoluto ? (f.stock_sistema ?? valor) : valor + f.delta
    }
    const nuevo = Math.max(0, valor)
    antesDespues.set(wooId, [estado.stock, nuevo])
    if (nuevo !== estado.stock) items.push({ id: wooId, stock_quantity: nuevo, manage_stock: true })
  }

  if (items.length) {
    try {
      const res = await wooUpdateProductsBatch(items)
      const errorPorId = new Map(res.filter(r => r.error).map(r => [r.id, r.error!.message]))
      for (const it of items) {
        const ids = porWooId.get(it.id)!.map(f => f.id)
        const [antes, despues] = antesDespues.get(it.id)!
        const err = errorPorId.get(it.id) ?? (res.some(r => r.id === it.id) ? null : 'Sin respuesta de la web')
        if (err) { await marcar(ids, { estado: 'error', error: err, stock_web_antes: antes }); errores++ }
        else { await marcar(ids, { estado: 'ok', stock_web_antes: antes, stock_web_despues: despues }); procesados++ }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      await supabase.from('woo_stock_cola').update({ estado: 'pendiente', error: msg })
        .in('id', items.flatMap(it => porWooId.get(it.id)!.map(f => f.id)))
      console.error('woo_stock_cola: batch falló:', msg)
      return { procesados, errores: errores + items.length }
    }
  }
  // Diferencias que se cancelaron entre sí (+2 y -2): nada que mandar.
  const sinCambio = aProcesar.filter(id => antesDespues.has(id) && !items.some(i => i.id === id))
  if (sinCambio.length) {
    await marcar(sinCambio.flatMap(id => porWooId.get(id)!.map(f => f.id)), { estado: 'ok', error: 'Sin cambio neto' })
  }
  return { procesados, errores }
}

// Envuelve un handler de API que puede cambiar stock: responde como siempre
// y, DESPUÉS de responder (waitUntil de Vercel, no frena el guardado),
// procesa la cola para mandar a la web solo los productos que cambiaron.
type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>
export function conSyncStockWeb<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    const res = await handler(req, ctx)
    waitUntil(procesarColaStockWoo().catch(e => console.error('woo_stock_cola:', e)))
    return res
  }
}
