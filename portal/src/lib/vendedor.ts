import 'server-only'
import { db } from './db'

// Datos de la pantalla del vendedor de calle: su cartera (con saldo y
// vencidos para cobrar en la visita), sus pedidos del mes y sus cobros.

export interface ClienteCartera {
  id: string; nombre: string; empresa: 'aroma' | 'lavid'; direccion: string | null; telefono: string | null
  saldo: number; vencido: number; ultimaCompra: string | null; nuevo: boolean
}
export interface ResumenVendedor {
  clientes: ClienteCartera[]
  mes: { pedidos: number; total: number; comisionPct: number }
  cobros: { id: string; cliente: string; monto: number; medio: string; estado: string; fecha: string }[]
}

export async function resumenVendedor(vendedorId: string): Promise<ResumenVendedor> {
  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0)
  const [{ data: cs }, { data: v }, { data: peds }, { data: cobros }] = await Promise.all([
    db.from('clientes').select('id, nombre, apellido, razon_social, empresa, direccion, telefono, saldo, activo, alta_vendedor_id, alta_revisada_at')
      .eq('vendedor_id', vendedorId).order('nombre'),
    db.from('vendedores').select('porcentaje_comision').eq('id', vendedorId).maybeSingle(),
    db.from('pedidos').select('total').eq('vendedor_id', vendedorId).neq('estado', 'cancelado').gte('created_at', inicioMes.toISOString()),
    db.from('cobros_vendedor').select('id, cliente_nombre, monto, medio, estado, created_at').eq('vendedor_id', vendedorId)
      .order('created_at', { ascending: false }).limit(15),
  ])
  const lista = (cs ?? []).filter(c => c.activo !== false)
  const ids = lista.map(c => c.id)

  // Vencido y última compra por cliente (ventas abiertas con vencimiento pasado).
  const vencido = new Map<string, number>(), ultima = new Map<string, string>()
  if (ids.length) {
    const { data: ventas } = await db.from('ventas').select('cliente_id, total, monto_pagado, estado_pago, fecha_vencimiento, created_at')
      .in('cliente_id', ids).neq('estado', 'cancelado')
    const hoy = new Date().toISOString().slice(0, 10)
    for (const x of ventas ?? []) {
      if (!ultima.get(x.cliente_id) || x.created_at > ultima.get(x.cliente_id)!) ultima.set(x.cliente_id, x.created_at)
      const pend = x.estado_pago === 'pagado' ? 0 : Math.max(0, (Number(x.total) || 0) - (Number(x.monto_pagado) || 0))
      if (pend > 0.5 && x.fecha_vencimiento && x.fecha_vencimiento < hoy) vencido.set(x.cliente_id, (vencido.get(x.cliente_id) ?? 0) + pend)
    }
  }

  return {
    clientes: lista.map(c => ({
      id: c.id, nombre: c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim(),
      empresa: c.empresa === 'lavid' ? 'lavid' : 'aroma', direccion: c.direccion || null, telefono: c.telefono || null,
      saldo: Number(c.saldo) || 0, vencido: vencido.get(c.id) ?? 0, ultimaCompra: ultima.get(c.id) ?? null,
      nuevo: !!c.alta_vendedor_id && !c.alta_revisada_at,
    })),
    mes: {
      pedidos: (peds ?? []).length,
      total: (peds ?? []).reduce((s, p) => s + (Number(p.total) || 0), 0),
      comisionPct: Number(v?.porcentaje_comision) || 0,
    },
    cobros: (cobros ?? []).map(c => ({ id: c.id, cliente: c.cliente_nombre || '', monto: Number(c.monto) || 0, medio: c.medio, estado: c.estado, fecha: c.created_at })),
  }
}
