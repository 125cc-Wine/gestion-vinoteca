import { supabase } from '@/lib/supabase'
import { crearVenta, medioPagoDesdeCondicion } from '@/lib/ventas'

// Pedidos de la tienda web (WooCommerce) -> sección Pedidos de Gestión.
//
// Sin webhooks: se consulta la web (como mucho cada INTERVALO_MIN minutos,
// cuando alguien tiene la app abierta, o con el botón "Traer ventas web").
// Así no hace falta exponer un endpoint público a WooCommerce.
//
// Flujo:
//  1. Pedido nuevo en la web (en espera / procesando / completado) -> pedido
//     'pendiente' origen 'web' en Aroma. Se RESERVA el stock en Gestión con
//     mover_stock_sin_eco (la web ya lo descontó: no se vuelve a mandar).
//  2. Alguien lo levanta -> 'preparando'.
//  3. Armado -> se crea el remito de Aroma (sin AFIP, sin mover stock porque
//     ya se reservó) y el pedido queda 'armado' con venta_id.
//  4. Cambios en la web: pago confirmado -> pedido y remito pasan a pagado;
//     cancelado antes de armar -> pedido cancelado y stock devuelto (sin eco).
//     Cancelado DESPUÉS de armar -> no se toca el remito, queda marcado.
//
// Tablas/funciones: sql/2026-09-pedidos-web.sql.

const INTERVALO_MIN = 2
const ESTADOS_QUE_ENTRAN = ['on-hold', 'processing', 'completed']
const ESTADOS_PAGADOS = ['processing', 'completed']
const ESTADOS_CANCELADOS = ['cancelled', 'refunded', 'failed']

interface WooOrder {
  id: number
  number: string
  status: string
  date_created: string
  total: string
  discount_total: string
  shipping_total: string
  payment_method: string
  payment_method_title: string
  customer_note: string
  billing: { first_name: string; last_name: string; email: string; phone: string }
  shipping: { first_name: string; last_name: string; address_1: string; address_2: string; city: string; state: string; postcode: string }
  line_items: { product_id: number; name: string; quantity: number; total: string }[]
  shipping_lines: { method_title: string; total: string }[]
}

interface ItemPedido { producto_id?: string; nombre: string; cantidad: number; precio_unitario: number; subtotal: number }

function wooUrl(path: string, extra: Record<string, string | number> = {}) {
  const params = new URLSearchParams({
    consumer_key: process.env.WOOCOMMERCE_CONSUMER_KEY!,
    consumer_secret: process.env.WOOCOMMERCE_CONSUMER_SECRET!,
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])),
  })
  return `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3/${path}?${params}`
}

export function condicionDesdePago(o: Pick<WooOrder, 'payment_method' | 'payment_method_title'>): string {
  const m = `${o.payment_method} ${o.payment_method_title}`.toLowerCase()
  if (m.includes('bacs') || m.includes('transferencia')) return 'Transferencia'
  if (m.includes('mercado') || m.includes('tarjeta')) return 'Billetera Virtual MercadoPago'
  return 'Contado'
}

function armarNotas(o: WooOrder): string {
  const envio = o.shipping_lines[0]?.method_title || 'sin envío'
  const s = o.shipping
  const dir = [s.address_1, s.address_2, s.city, s.state, s.postcode].filter(Boolean).join(', ')
  return [
    `Pedido web #${o.number} · ${o.payment_method_title || 'sin medio de pago'} · ${envio}`,
    `Cliente: ${[o.billing.first_name, o.billing.last_name].filter(Boolean).join(' ')}${o.billing.email ? ` · ${o.billing.email}` : ''}${o.billing.phone ? ` · ${o.billing.phone}` : ''}`,
    dir ? `Dirección: ${dir}` : '',
    o.customer_note ? `Nota del cliente: ${o.customer_note}` : '',
  ].filter(Boolean).join('\n')
}

async function itemsDesdePedido(o: WooOrder): Promise<{ items: ItemPedido[]; sinVincular: string[] }> {
  const ids = Array.from(new Set(o.line_items.map(i => i.product_id)))
  const { data: prods } = await supabase
    .from('productos')
    .select('id, nombre, woo_product_id')
    .eq('empresa', 'aroma').eq('activo', true)
    .in('woo_product_id', ids.length ? ids : [-1])
  const porWoo = new Map((prods ?? []).map(p => [p.woo_product_id as number, p]))
  const sinVincular: string[] = []
  const items: ItemPedido[] = o.line_items.map(li => {
    const p = porWoo.get(li.product_id)
    if (!p) sinVincular.push(li.name)
    const subtotal = Math.round(parseFloat(li.total || '0') * 100) / 100
    return {
      ...(p ? { producto_id: p.id } : {}),
      nombre: p ? p.nombre : `${li.name} (sin vincular en Gestión)`,
      cantidad: li.quantity,
      precio_unitario: li.quantity ? Math.round((subtotal / li.quantity) * 100) / 100 : subtotal,
      subtotal,
    }
  })
  const envio = parseFloat(o.shipping_total || '0')
  if (envio > 0) {
    items.push({ nombre: `Envío — ${o.shipping_lines[0]?.method_title || 'web'}`, cantidad: 1, precio_unitario: envio, subtotal: envio })
  }
  return { items, sinVincular }
}

async function moverStock(items: ItemPedido[], signo: -1 | 1, motivo: string) {
  const conProducto = items.filter(i => i.producto_id).map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad }))
  if (!conProducto.length) return
  const { error } = await supabase.rpc('mover_stock_sin_eco', { p_items: conProducto, p_signo: signo, p_motivo: motivo })
  if (error) throw new Error(`Stock: ${error.message}`)
}

async function config(clave: string): Promise<string | null> {
  const { data } = await supabase.from('app_config').select('valor').eq('clave', clave).maybeSingle()
  return data?.valor ?? null
}

export interface ResultadoImportacion {
  omitido?: boolean
  nuevos: { id: string; numero: string; cliente: string; total: number }[]
  actualizados: number
  errores: string[]
}

export async function importarPedidosWeb(forzar = false): Promise<ResultadoImportacion> {
  const res: ResultadoImportacion = { nuevos: [], actualizados: 0, errores: [] }
  if (!process.env.WOOCOMMERCE_CONSUMER_KEY) return { ...res, omitido: true }

  const desde = await config('woo_pedidos_desde')
  if (!desde) return { ...res, omitido: true, errores: ['Falta correr sql/2026-09-pedidos-web.sql'] }

  // Reservar el turno: un solo UPDATE condicional, así dos pestañas abiertas
  // no importan el mismo pedido a la vez (el índice único por woo_order_id
  // es la segunda red).
  const ahora = new Date()
  const limite = new Date(ahora.getTime() - INTERVALO_MIN * 60_000).toISOString()
  let q = supabase.from('app_config').update({ valor: ahora.toISOString(), updated_at: ahora.toISOString() })
    .eq('clave', 'woo_pedidos_ultimo_chequeo')
  if (!forzar) q = q.or(`valor.is.null,valor.lt.${limite}`)
  const { data: turno } = await q.select('clave')
  if (!turno?.length) return { ...res, omitido: true }

  // Todos los pedidos creados desde la fecha de corte (son pocos por mes).
  const pedidosWeb: WooOrder[] = []
  for (let page = 1; page <= 10; page++) {
    const r = await fetch(wooUrl('orders', { after: desde, dates_are_gmt: 'true', per_page: 100, page, orderby: 'date', order: 'asc' }), { cache: 'no-store' })
    if (!r.ok) { res.errores.push(`WooCommerce ${r.status}`); return res }
    const lote: WooOrder[] = await r.json()
    pedidosWeb.push(...lote)
    if (lote.length < 100) break
  }
  if (!pedidosWeb.length) return res

  const { data: existentes } = await supabase
    .from('pedidos')
    .select('id, numero, estado, woo_order_id, woo_estado, pago, items, venta_id, stock_reservado, notas, total')
    .in('woo_order_id', pedidosWeb.map(o => o.id))
  const porOrder = new Map((existentes ?? []).map(p => [p.woo_order_id as number, p]))

  for (const o of pedidosWeb) {
    try {
      const pago = ESTADOS_PAGADOS.includes(o.status) ? 'pagado' : 'pendiente'
      const p = porOrder.get(o.id)

      if (!p) {
        if (!ESTADOS_QUE_ENTRAN.includes(o.status)) continue // carrito sin pagar, fallido, etc.
        const { items, sinVincular } = await itemsDesdePedido(o)
        const numero = `WEB-${o.number}`
        const cliente = [o.billing.first_name, o.billing.last_name].filter(Boolean).join(' ') || 'Cliente web'
        const notas = armarNotas(o) + (sinVincular.length ? `\n⚠️ Sin vincular en Gestión (no se reservó stock): ${sinVincular.join(', ')}` : '')
        const { data: nuevo, error } = await supabase.from('pedidos').insert([{
          empresa: 'aroma', numero, cliente_nombre: cliente, vendedor_nombre: 'Tienda web',
          items, subtotal: items.reduce((a, i) => a + i.subtotal, 0),
          descuento: parseFloat(o.discount_total || '0'), total: parseFloat(o.total || '0'),
          estado: 'pendiente', notas, condicion_venta: condicionDesdePago(o),
          origen: 'web', woo_order_id: o.id, woo_estado: o.status, pago,
        }]).select('id').single()
        if (error) {
          // Otra pestaña lo insertó justo antes: no es un error real.
          if (!/duplicate|unique/i.test(error.message)) res.errores.push(`#${o.number}: ${error.message}`)
          continue
        }
        await moverStock(items, -1, `Pedido web #${o.number} (reserva)`)
        await supabase.from('pedidos').update({ stock_reservado: true }).eq('id', nuevo.id)
        res.nuevos.push({ id: nuevo.id, numero, cliente, total: parseFloat(o.total || '0') })
        continue
      }

      // Ya importado: ¿cambió algo en la web?
      if (p.woo_estado === o.status) continue
      const cambios: Record<string, unknown> = { woo_estado: o.status, pago }

      if (ESTADOS_CANCELADOS.includes(o.status) && p.estado !== 'cancelado') {
        if (!p.venta_id) {
          if (p.stock_reservado) await moverStock(p.items as ItemPedido[], 1, `Pedido web #${o.number} cancelado en la web`)
          Object.assign(cambios, { estado: 'cancelado', stock_reservado: false })
        } else {
          // Ya se armó y hay remito: no se deshace solo, se avisa.
          cambios.notas = `⚠️ CANCELADO EN LA WEB después de armado — revisar el remito.\n${p.notas ?? ''}`
        }
      }

      // Pago confirmado en la web con el remito ya creado -> remito pagado + caja.
      if (pago === 'pagado' && p.pago !== 'pagado' && p.venta_id) {
        await marcarVentaPagada(p.venta_id)
      }

      await supabase.from('pedidos').update(cambios).eq('id', p.id)
      res.actualizados++
    } catch (e) {
      res.errores.push(`#${o.number}: ${e instanceof Error ? e.message : 'error'}`)
    }
  }
  return res
}

async function marcarVentaPagada(ventaId: string) {
  const { data: v } = await supabase.from('ventas')
    .select('id, empresa, numero, total, estado_pago, cliente_nombre, condicion_venta').eq('id', ventaId).single()
  if (!v || v.estado_pago === 'pagado') return
  const hoy = new Date().toISOString().split('T')[0]
  await supabase.from('ventas').update({ estado_pago: 'pagado', fecha_pago: hoy, monto_pagado: v.total }).eq('id', v.id)
  await supabase.from('movimientos_caja').insert([{
    empresa: v.empresa, tipo: 'ingreso',
    concepto: `Remito ${v.numero} - ${v.cliente_nombre} (pago web confirmado)`,
    monto: v.total, fecha: hoy, categoria: `Ventas - ${v.condicion_venta || 'Transferencia'}`,
    medio_pago: medioPagoDesdeCondicion(v.condicion_venta) || 'Transferencia',
    referencia_id: v.id,
  }])
}

// "Armado": crea el remito de Aroma (sin AFIP) a partir del pedido web. El
// stock ya se reservó al importar el pedido, así que el remito no lo mueve.
export async function armarPedidoWeb(pedidoId: string): Promise<{ venta?: { id: string; numero: string }; error?: string }> {
  const { data: p, error } = await supabase.from('pedidos').select('*').eq('id', pedidoId).single()
  if (error || !p) return { error: error?.message ?? 'Pedido no encontrado' }
  if (p.origen !== 'web') return { error: 'No es un pedido de la web' }
  if (p.venta_id) return { error: 'Este pedido ya tiene remito' }
  if (p.estado === 'cancelado') return { error: 'El pedido está cancelado' }

  const r = await crearVenta({
    empresa: 'aroma', tipo: 'remito', estado: 'emitido',
    cliente_nombre: p.cliente_nombre, vendedor_nombre: 'Tienda web',
    items: (p.items as ItemPedido[]).map(i => ({ ...i, descuento: 0 })),
    subtotal: p.subtotal, descuento: p.descuento, total: p.total,
    condicion_venta: p.condicion_venta, estado_pago: p.pago === 'pagado' ? 'pagado' : 'pendiente',
    monto_pagado: p.pago === 'pagado' ? p.total : 0,
    notas: p.notas, facturado: false,
    descontarStock: false,
  })
  if (r.error || !r.data) return { error: r.error ?? 'No se pudo crear el remito' }
  await supabase.from('pedidos').update({ estado: 'armado', venta_id: r.data.id }).eq('id', p.id)
  return { venta: { id: r.data.id, numero: r.data.numero } }
}

// Cómo quedaría cargado un pedido de la web, sin escribir nada (para probar
// el mapeo con pedidos reales). GET /api/woo/pedidos?simular=<id del pedido>.
export async function simularPedidoWeb(orderId: number) {
  const r = await fetch(wooUrl(`orders/${orderId}`), { cache: 'no-store' })
  if (!r.ok) return { error: `WooCommerce ${r.status}` }
  const o: WooOrder = await r.json()
  const { items, sinVincular } = await itemsDesdePedido(o)
  return {
    numero: `WEB-${o.number}`, woo_estado: o.status,
    entraria: ESTADOS_QUE_ENTRAN.includes(o.status),
    pago: ESTADOS_PAGADOS.includes(o.status) ? 'pagado' : 'pendiente',
    condicion_venta: condicionDesdePago(o),
    cliente_nombre: [o.billing.first_name, o.billing.last_name].filter(Boolean).join(' '),
    total: parseFloat(o.total || '0'), items, sinVincular, notas: armarNotas(o),
  }
}
