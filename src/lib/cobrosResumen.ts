// Tipos y formato de "cómo se cobró" una venta — sin server-only para poder
// usarlo en pantallas cliente. La consulta vive en cobrosVenta.ts.

export interface CobroVenta { fecha: string; monto: number; medio: string }

// "Efectivo $33.380 · Transferencia $12.380" — suma por medio de pago.
export function resumenCobros(cobros: CobroVenta[]): string {
  const porMedio = new Map<string, number>()
  for (const c of cobros) porMedio.set(c.medio, (porMedio.get(c.medio) || 0) + c.monto)
  return Array.from(porMedio, ([medio, monto]) => `${medio} $${Math.round(monto).toLocaleString('es-AR')}`).join(' · ')
}

// Al editar una venta en cta. cte. y bajarle el total, /api/ventas deja un
// movimiento tipo 'cobro' con concepto "... (ajuste al editar)" para corregir
// el saldo. No entró plata: es una rebaja del cargo. Mostrarlo o sumarlo como
// cobro hacía aparecer facturas "pagadas parcialmente" sin que nadie cobrara.
export function esAjusteEdicion(m: { tipo?: string | null; concepto?: string | null }): boolean {
  return m.tipo === 'cobro' && /\(ajuste al editar\)\s*$/.test(m.concepto || '')
}
