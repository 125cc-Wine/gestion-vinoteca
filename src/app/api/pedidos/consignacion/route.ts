export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { crearConsignacion } from '@/lib/consignaciones'
import { conSyncStockWeb } from '@/lib/woo-stock-cola'

// Pedido → consignación (hoy: los pedidos de la carta de 125cc, que se
// pueden procesar como venta o como consignación). Mismos efectos que crear
// la consignación desde Consignaciones: sale del depósito (descuenta stock)
// y al liquidarla vuelve lo no vendido y se carga lo vendido a la cuenta
// corriente. El pedido queda 'armado' y apuntando a la consignación, así
// marcarlo "entregado" no vuelve a descontar.
//
// POST { pedido_id }

const err = (m: string, status = 400) => NextResponse.json({ error: m }, { status })

interface ItemPedido { producto_id?: string; nombre: string; cantidad: number; precio_unitario: number }

async function postHandler(req: NextRequest) {
  const { pedido_id } = await req.json().catch(() => ({}))
  if (!pedido_id) return err('Falta el pedido')

  // Se "toma" el pedido (solo si sigue pendiente y sin comprobante) para que
  // dos clics no generen dos consignaciones.
  const { data: tomado, error: e1 } = await supabase.from('pedidos')
    .update({ estado: 'armado' }).eq('id', pedido_id).eq('estado', 'pendiente')
    .is('venta_id', null).is('consignacion_id', null).neq('origen', 'web')
    .select('*')
  if (e1) return err(e1.message, 500)
  const p = tomado?.[0]
  if (!p) return err('El pedido ya fue procesado, entregado o cancelado', 409)
  const volver = () => supabase.from('pedidos').update({ estado: 'pendiente' }).eq('id', p.id)

  if (!p.cliente_id) { await volver(); return err('Para consignar, el pedido tiene que tener un cliente cargado') }

  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  // Pedido de la carta de 125cc: vuelve (se liquida) al terminar la quincena.
  const q = /\[carta-125cc:(\d{4})-(\d{2})-(\d{2})\]/.exec(p.notas || '')
  const fecha_retorno_estimada = q
    ? (q[3] === '01' ? `${q[1]}-${q[2]}-15` : `${q[1]}-${q[2]}-${String(new Date(Number(q[1]), Number(q[2]), 0).getDate()).padStart(2, '0')}`)
    : null
  const r = await crearConsignacion({
    empresa: p.empresa,
    cliente_id: p.cliente_id, cliente_nombre: p.cliente_nombre,
    vendedor_nombre: p.vendedor_nombre || null,
    items: (p.items as ItemPedido[]).map(i => ({
      producto_id: i.producto_id || null, nombre: i.nombre, cantidad: i.cantidad,
      cantidad_vendida: 0, precio_unitario: i.precio_unitario,
    })),
    fecha_salida: hoy, fecha_retorno_estimada,
    estado: 'activa',
    notas: [`Pedido ${p.numero}`, (p.notas || '').replace(/\n?\[carta-125cc:[^\]]+\]/, '')].filter(Boolean).join('\n'),
  })
  if (r.error || !r.data) { await volver(); return err(r.error ?? 'No se pudo crear la consignación', 500) }

  await supabase.from('pedidos').update({ consignacion_id: r.data.id }).eq('id', p.id)
  return NextResponse.json({ ok: true, consignacion: { id: r.data.id, numero: r.data.numero, empresa: p.empresa } })
}

// Avisa a la web el cambio de stock, igual que las ventas.
export const POST = conSyncStockWeb(postHandler)
