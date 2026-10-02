export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { crearVenta } from '@/lib/ventas'
import { conSyncStockWeb } from '@/lib/woo-stock-cola'

// Pedido (del portal, de un vendedor o cargado a mano) → presupuesto, con los
// mismos efectos que crearlo desde Ventas: descuenta stock, caja si se pagó,
// cargo en cuenta corriente si es Cta. Cte. El pedido queda 'armado' y
// apuntando a la venta; facturar se hace después sobre esa venta (Ventas).
//
// POST { pedido_id, condicion_venta, estado_pago: 'cuenta_corriente' | 'pagado' | 'pendiente' }

const ESTADOS_PAGO = ['cuenta_corriente', 'pagado', 'pendiente']
const err = (m: string, status = 400) => NextResponse.json({ error: m }, { status })

interface ItemPedido { producto_id?: string; nombre: string; cantidad: number; precio_unitario: number }

async function postHandler(req: NextRequest) {
  const { pedido_id, condicion_venta, estado_pago } = await req.json().catch(() => ({}))
  if (!pedido_id) return err('Falta el pedido')
  if (!ESTADOS_PAGO.includes(estado_pago)) return err('Elegí el estado de pago')
  if (typeof condicion_venta !== 'string' || !condicion_venta.trim()) return err('Elegí la condición de venta')

  // Se "toma" el pedido (solo si sigue pendiente y sin comprobante) para que
  // dos clics no generen dos presupuestos.
  const { data: tomado, error: e1 } = await supabase.from('pedidos')
    .update({ estado: 'armado' }).eq('id', pedido_id).eq('estado', 'pendiente').is('venta_id', null).neq('origen', 'web')
    .select('*')
  if (e1) return err(e1.message, 500)
  const p = tomado?.[0]
  if (!p) return err('El pedido ya fue procesado, entregado o cancelado', 409)
  const volver = () => supabase.from('pedidos').update({ estado: 'pendiente' }).eq('id', p.id)

  if (estado_pago === 'cuenta_corriente' && !p.cliente_id) { await volver(); return err('Para Cuenta Corriente el pedido tiene que tener un cliente cargado') }

  let vendedor_id: string | null = p.vendedor_id ?? null
  if (!vendedor_id && p.vendedor_nombre) {
    const { data: v } = await supabase.from('vendedores').select('id').ilike('nombre', p.vendedor_nombre).maybeSingle()
    vendedor_id = v?.id ?? null
  }

  const items = (p.items as ItemPedido[]).map(i => ({
    producto_id: i.producto_id || null, nombre: i.nombre, cantidad: i.cantidad,
    precio_unitario: i.precio_unitario, descuento: 0, subtotal: Math.round(i.cantidad * i.precio_unitario * 100) / 100,
  }))
  const total = Number(p.total) || items.reduce((s, i) => s + i.subtotal, 0)

  const r = await crearVenta({
    empresa: p.empresa, tipo: 'presupuesto', estado: 'emitido',
    cliente_id: p.cliente_id, cliente_nombre: p.cliente_nombre,
    vendedor_id, vendedor_nombre: p.vendedor_nombre || (p.origen === 'portal' ? 'Portal clientes' : null),
    items, subtotal: total, descuento: 0, total,
    estado_pago, condicion_venta: condicion_venta.trim(),
    monto_pagado: estado_pago === 'pagado' ? total : 0,
    notas: [`Pedido ${p.numero}`, p.notas].filter(Boolean).join('\n'),
    facturado: false,
    descontarStock: true,
  })
  if (r.error || !r.data) { await volver(); return err(r.error ?? 'No se pudo crear el presupuesto', 500) }

  await supabase.from('pedidos').update({ venta_id: r.data.id }).eq('id', p.id)
  return NextResponse.json({ ok: true, venta: { id: r.data.id, numero: r.data.numero, empresa: p.empresa } })
}

// Avisa a la web el cambio de stock, igual que las ventas.
export const POST = conSyncStockWeb(postHandler)
