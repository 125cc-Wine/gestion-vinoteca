// Contacto y horarios de entrega que el cliente cargó en el portal
// (clientes.portal_datos). Se muestra en la ficha del cliente y en sus pedidos.

export interface DatosEntregaPortal {
  contacto?: string; telefono?: string; email?: string; direccion?: string
  dias?: string[]; desde?: string; hasta?: string; notas?: string
}

export function resumenHorario(d: DatosEntregaPortal | null | undefined) {
  if (!d) return ''
  const dias = d.dias?.length === 6 ? 'Lun a Sáb' : d.dias?.length === 5 && !d.dias.includes('Sáb') ? 'Lun a Vie' : (d.dias || []).join(', ')
  return [dias, d.desde && d.hasta ? `${d.desde} a ${d.hasta} h` : ''].filter(Boolean).join(' · ')
}

export default function DatosEntrega({ datos, fecha, color = { muted: '#6B5D55', text: '#1A1210' } }: {
  datos: DatosEntregaPortal | null | undefined; fecha?: string | null; color?: { muted: string; text: string }
}) {
  if (!datos) return <div style={{ fontSize: 12, color: color.muted }}>Todavía no confirmó sus datos de entrega en el portal.</div>
  const fila = (k: string, v?: string) => v ? <div><span style={{ color: color.muted }}>{k}:</span> <span style={{ color: color.text }}>{v}</span></div> : null
  return (
    <div style={{ fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {fila('Recibe', datos.contacto)}
      {fila('Tel/WhatsApp', datos.telefono)}
      {fila('Email', datos.email)}
      {fila('Entrega en', datos.direccion)}
      {fila('Horario', resumenHorario(datos))}
      {fila('Indicaciones', datos.notas)}
      {fecha && <div style={{ color: color.muted, fontSize: 11, marginTop: 2 }}>Confirmado por el cliente el {new Date(fecha).toLocaleDateString('es-AR')}</div>}
    </div>
  )
}
