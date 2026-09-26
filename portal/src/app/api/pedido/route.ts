import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clienteActual } from '@/lib/session'
import { catalogoDe } from '@/lib/catalogo'

export const dynamic = 'force-dynamic'

// Crea el pedido en la tabla "pedidos" de gestión (origen 'portal'). Los
// precios se recalculan acá con la lista del cliente: nunca se toma el precio
// que manda el navegador.
export async function POST(req: NextRequest) {
  const cliente = await clienteActual()
  if (!cliente) return NextResponse.json({ error: 'Tu sesión venció. Volvé a entrar con tu link.' }, { status: 401 })
  const catalogo = await catalogoDe(cliente)
  if (!catalogo) return NextResponse.json({ error: 'Tu lista de precios no está configurada.' }, { status: 409 })

  const body = await req.json().catch(() => null)
  const pedidos: { id: string; cantidad: number }[] = Array.isArray(body?.items) ? body.items : []
  const porId = new Map(catalogo.items.map(i => [i.id, i]))
  const items = []
  for (const it of pedidos) {
    const p = porId.get(it?.id)
    const cant = Math.floor(Number(it?.cantidad))
    if (!p || !(cant >= 1 && cant <= 999)) return NextResponse.json({ error: 'Hay un producto que ya no está en tu lista. Actualizá la página.' }, { status: 400 })
    items.push({ producto_id: p.id, nombre: p.nombre, cantidad: cant, precio_unitario: p.precio, a_confirmar: !p.disponible })
  }
  if (items.length === 0 || items.length > 300) return NextResponse.json({ error: 'El pedido está vacío.' }, { status: 400 })

  const notasCliente = typeof body?.notas === 'string' ? body.notas.trim().slice(0, 1000) : ''
  const fecha = typeof body?.fecha_entrega === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.fecha_entrega) ? body.fecha_entrega : null
  const aConfirmar = items.filter(i => i.a_confirmar).length
  const notas = [
    `Pedido hecho por el cliente desde el portal · Lista "${catalogo.lista}"${catalogo.descuento ? ` (−${catalogo.descuento}%)` : ''}`,
    aConfirmar ? `${aConfirmar} producto${aConfirmar > 1 ? 's' : ''} sin stock al pedir (a confirmar)` : '',
    notasCliente ? `Nota del cliente: ${notasCliente}` : '',
  ].filter(Boolean).join('\n')
  const total = items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)

  // Misma numeración que la app de gestión (src/app/api/pedidos/route.ts).
  const { count } = await db.from('pedidos').select('*', { count: 'exact', head: true }).eq('empresa', cliente.empresa)
  const numero = `PED-${String((count || 0) + 1).padStart(6, '0')}`

  const { data, error } = await db.from('pedidos').insert([{
    empresa: cliente.empresa, numero, cliente_id: cliente.id, cliente_nombre: cliente.nombre,
    items, subtotal: total, descuento: 0, total, estado: 'pendiente', origen: 'portal',
    notas, fecha_entrega: fecha,
  }]).select('numero, total').single()
  if (error) return NextResponse.json({ error: 'No se pudo enviar el pedido. Probá de nuevo en un momento.' }, { status: 500 })
  return NextResponse.json({ ok: true, numero: data.numero, total: data.total })
}
