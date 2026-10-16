// Tipos y formato de "cómo se cobró" una venta — sin server-only para poder
// usarlo en pantallas cliente. La consulta vive en cobrosVenta.ts.

export interface CobroVenta { fecha: string; monto: number; medio: string }

// "Efectivo $33.380 · Transferencia $12.380" — suma por medio de pago.
export function resumenCobros(cobros: CobroVenta[]): string {
  const porMedio = new Map<string, number>()
  for (const c of cobros) porMedio.set(c.medio, (porMedio.get(c.medio) || 0) + c.monto)
  return Array.from(porMedio, ([medio, monto]) => `${medio} $${Math.round(monto).toLocaleString('es-AR')}`).join(' · ')
}
