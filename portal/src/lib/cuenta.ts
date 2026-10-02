import 'server-only'
import { db } from './db'

// "Mi cuenta": saldo de cuenta corriente, movimientos y comprobantes del
// cliente, tal como están en gestión (clientes.saldo y movimientos_cta_cte
// son la fuente; saldo positivo = el cliente debe). Nunca costos ni datos
// internos: de cada comprobante, solo productos, cantidades y precios.

export interface Movimiento { id: string; fecha: string; concepto: string; tipo: 'cargo' | 'cobro'; monto: number; saldo: number }
export interface Comprobante {
  id: string; numero: string; fecha: string; total: number; pendiente: number
  estado: 'pagado' | 'pendiente'; vence: string | null; factura: string | null
  items: { nombre: string; cantidad: number; precio: number; subtotal: number }[]
}
export interface Cuenta { saldo: number; movimientos: Movimiento[]; comprobantes: Comprobante[] }

const TIPO_CBTE: Record<number, string> = { 1: 'Factura A', 6: 'Factura B', 11: 'Factura C', 3: 'Nota de crédito A', 8: 'Nota de crédito B', 13: 'Nota de crédito C' }

// Los conceptos de gestión dicen "Presupuesto PRES-…": para el cliente es una compra.
const conceptoCliente = (c: string | null) => (c || '')
  .replace(/^Presupuesto /, 'Compra ')
  .replace(/\(ajuste al editar\)/, '(ajuste)')
  .replace(/^Cobro cuenta corriente/, 'Pago')
  .replace(/\(aplicado a Presupuesto /, '(aplicado a ')

export async function cuentaDe(clienteId: string): Promise<Cuenta> {
  const [{ data: cli }, { data: movs }, { data: ventas }] = await Promise.all([
    db.from('clientes').select('saldo').eq('id', clienteId).maybeSingle(),
    db.from('movimientos_cta_cte').select('id, created_at, concepto, tipo, monto, saldo_nuevo')
      .eq('cliente_id', clienteId).order('created_at', { ascending: false }).limit(80),
    db.from('ventas').select('id, numero, created_at, total, estado_pago, monto_pagado, facturado, cbte_tipo, nro_cbte_afip, fecha_vencimiento, items')
      .eq('cliente_id', clienteId).neq('estado', 'cancelado').order('created_at', { ascending: false }).limit(60),
  ])

  return {
    saldo: Number(cli?.saldo) || 0,
    movimientos: (movs ?? []).map(m => ({
      id: m.id, fecha: m.created_at, concepto: conceptoCliente(m.concepto),
      tipo: m.tipo === 'cobro' ? 'cobro' : 'cargo', monto: Number(m.monto) || 0, saldo: Number(m.saldo_nuevo) || 0,
    })),
    comprobantes: (ventas ?? []).map(v => {
      const total = Number(v.total) || 0
      // Mismo criterio que gestión: 'pagado' manda sobre monto_pagado.
      const pendiente = v.estado_pago === 'pagado' ? 0 : Math.max(0, total - (Number(v.monto_pagado) || 0))
      return {
        id: v.id, numero: v.numero, fecha: v.created_at, total, pendiente,
        estado: pendiente > 0.5 ? 'pendiente' : 'pagado',
        vence: pendiente > 0.5 ? v.fecha_vencimiento : null,
        factura: v.facturado && v.nro_cbte_afip ? `${TIPO_CBTE[v.cbte_tipo as number] ?? 'Factura'} ${v.nro_cbte_afip}` : null,
        items: (Array.isArray(v.items) ? v.items : []).map((i: { nombre?: string; cantidad?: number; precio_unitario?: number; subtotal?: number }) => ({
          nombre: (i.nombre || '').replace(/ - [^-]+$/, ''), cantidad: Number(i.cantidad) || 0,
          precio: Number(i.precio_unitario) || 0, subtotal: Number(i.subtotal) || 0,
        })),
      }
    }),
  }
}
