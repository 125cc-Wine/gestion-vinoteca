import 'server-only'
import { supabase } from '@/lib/supabase'

// Lógica compartida de consignaciones: la usan /api/consignaciones (alta y
// cambios de estado) y /api/pedidos/consignacion (pasar un pedido —ej. el
// de la carta de 125cc— a consignación). Mismo efecto por los dos caminos.

export interface ConsItem {
  producto_id: string
  nombre?: string
  cantidad: number
  cantidad_vendida?: number
  precio_unitario?: number
}

// Ajusta el stock de un producto (delta positivo o negativo) y sincroniza la
// contraparte en la otra empresa — mismo patrón que usan ventas y compras
// para el depósito compartido. Clampeado en 0 para no ir a negativo.
// `motivo` queda en movimientos_stock (antes esta función no dejaba ningún
// rastro — la mercadería salía/volvía del depósito por consignación sin
// aparecer nunca en la pantalla de Movimientos).
export async function ajustarStock(productoId: string, delta: number, motivo: string) {
  const { data: prod } = await supabase.from('productos').select('id, stock, nombre, empresa').eq('id', productoId).single()
  if (!prod) return
  const nuevoStock = Math.max(0, (prod.stock || 0) + delta)
  await supabase.from('productos').update({ stock: nuevoStock }).eq('id', prod.id)
  await supabase.from('movimientos_stock').insert([{
    empresa: prod.empresa, producto_id: prod.id,
    nombre: `${prod.nombre} — ${motivo}`, delta, nuevo_stock: nuevoStock, modo: 'agregar',
  }])
  const otra = prod.empresa === 'aroma' ? 'lavid' : 'aroma'
  const { data: contra } = await supabase.from('productos').select('id').eq('nombre', prod.nombre).eq('empresa', otra).single()
  if (contra) await supabase.from('productos').update({ stock: nuevoStock }).eq('id', contra.id)
}

// Alta de una consignación: numera (CONS-00001 por empresa), calcula el
// total y descuenta del depósito lo que sale. `body` son las columnas de
// `consignaciones` (empresa, cliente_id, cliente_nombre, items, ...).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function crearConsignacion(body: any): Promise<{ data?: any; error?: string }> {
  const { count } = await supabase
    .from('consignaciones')
    .select('*', { count: 'exact', head: true })
    .eq('empresa', body.empresa)

  const numero = `CONS-${String((count || 0) + 1).padStart(5, '0')}`

  const items: ConsItem[] = body.items || []
  const total = items.reduce(
    (acc, item) => acc + (item.cantidad || 0) * (item.precio_unitario || 0),
    0
  )

  const { data, error } = await supabase
    .from('consignaciones')
    .insert([{ ...body, numero, total }])
    .select()
    .single()

  if (error) return { error: error.message }

  // Si la ficha del cliente tiene cargada otra empresa, corregirla acá —
  // mismo fix que /api/ventas, para que no quede invisible/sin explicación
  // en el listado de Clientes de la empresa donde realmente opera.
  if (body.cliente_id) {
    const { data: cli } = await supabase.from('clientes').select('empresa').eq('id', body.cliente_id).single()
    if (cli && cli.empresa !== body.empresa) {
      await supabase.from('clientes').update({ empresa: body.empresa }).eq('id', body.cliente_id)
    }
  }

  // La mercadería consignada sale físicamente del depósito — antes esto
  // nunca descontaba stock, así que al liquidar/devolver (que sí sumaban de
  // vuelta lo no vendido) el stock quedaba inflado con unidades que jamás
  // se habían restado.
  for (const item of items) {
    if (!item.producto_id) continue
    await ajustarStock(item.producto_id, -(item.cantidad || 0), `Consignación ${numero}`)
  }

  return { data }
}
