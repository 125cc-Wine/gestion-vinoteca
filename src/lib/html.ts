// Los comprobantes imprimibles arman el HTML pegando strings directo
// (cliente, notas, nombres de producto, etc.) sin pasar por React — sin este
// escape, un nombre con "<script>" o comillas raras podía romper el layout
// o ejecutarse al abrir el comprobante.
export function esc(s: unknown): string {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
