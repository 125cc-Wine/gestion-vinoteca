// Si el comprobante ya tiene CAE (se facturó por AFIP), lo que hay que
// mostrarle al cliente en un recibo de pago es el N° de factura fiscal, no
// el número interno de presupuesto/remito que usamos para el seguimiento
// en el local — es el número que el cliente reconoce como válido.
export function labelComprobante(venta: { tipo: string; numero?: string | null; facturado?: boolean | null; nro_cbte_afip?: string | null }): string {
  if (venta.facturado && venta.nro_cbte_afip) return `Factura ${venta.nro_cbte_afip}`
  const etiqueta = venta.tipo === 'presupuesto' ? 'Presupuesto' : venta.tipo === 'factura' ? 'Factura' : 'Remito'
  return `${etiqueta} ${venta.numero}`
}
