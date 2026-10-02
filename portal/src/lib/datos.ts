// Contacto y horarios de entrega que carga/confirma el cliente en el portal
// (clientes.portal_datos). No pisa la ficha de gestión: se guarda aparte y
// en gestión se ve en la ficha del cliente y en sus pedidos del portal.

export const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const

export interface DatosEntrega {
  contacto: string
  telefono: string
  email: string
  direccion: string
  dias: string[]
  desde: string
  hasta: string
  notas: string
}

const txt = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const hora = (v: unknown) => (typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : '')

// Normaliza lo que llega del formulario; devuelve el error a mostrar si falta algo.
export function validarDatos(b: Record<string, unknown>): { datos?: DatosEntrega; error?: string } {
  const datos: DatosEntrega = {
    contacto: txt(b.contacto, 80),
    telefono: txt(b.telefono, 40),
    email: txt(b.email, 120),
    direccion: txt(b.direccion, 200),
    dias: Array.isArray(b.dias) ? DIAS.filter(d => (b.dias as unknown[]).includes(d)) : [],
    desde: hora(b.desde),
    hasta: hora(b.hasta),
    notas: txt(b.notas, 300),
  }
  if (!datos.contacto) return { error: 'Decinos quién recibe los pedidos' }
  if (datos.telefono.replace(/\D/g, '').length < 8) return { error: 'Falta un teléfono o WhatsApp de contacto' }
  if (datos.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(datos.email)) return { error: 'El email no parece válido' }
  if (!datos.direccion) return { error: 'Falta la dirección de entrega' }
  if (!datos.dias.length) return { error: 'Marcá al menos un día en que podés recibir' }
  if (!datos.desde || !datos.hasta) return { error: 'Completá el horario en que podés recibir' }
  return { datos }
}
