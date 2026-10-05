// Mensaje de WhatsApp con el acceso al portal de clientes (link + PIN y
// cómo entrar después sin el link). Lo usan Portal clientes y la ficha del cliente.
// pin null = se reenvía el link y el cliente sigue con el PIN que ya tenía.
export function textoAcceso(nombre: string, empresa: string, d: { url: string; pin: string | null; portal?: string; usuario?: string | null }) {
  const emp = empresa === 'lavid' ? 'La Vid Consultora' : 'Aroma de Vid'
  const cuit = d.usuario && /^\d{2}-\d{8}-\d$/.test(d.usuario) ? d.usuario : null
  const despues = d.portal
    ? `\n\nTambién podés entrar desde ${d.portal.replace(/^https?:\/\//, '')} con tu CUIT${cuit ? ` (${cuit})` : ''}.`
    : ''
  const pin = d.pin
    ? `Tu PIN: ${d.pin}\n\nEntrás una sola vez y queda guardado en tu celular. Si querés, lo cambiás por uno tuyo en "Mi cuenta".`
    : 'Entrás con tu PIN de siempre. Si no lo recordás, pedinos uno nuevo.'
  return `Hola ${nombre}! Te compartimos tu acceso a la lista de precios de ${emp}, con disponibilidad actualizada y donde podés hacer tus pedidos:\n\n${d.url}\n\n${pin}${despues}`
}
