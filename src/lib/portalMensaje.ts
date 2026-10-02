// Mensaje de WhatsApp con el acceso al portal de clientes (link + PIN y
// cómo entrar después sin el link). Lo usan Portal clientes y la ficha del cliente.
export function textoAcceso(nombre: string, empresa: string, d: { url: string; pin: string; portal?: string; usuario?: string | null }) {
  const emp = empresa === 'lavid' ? 'La Vid Consultora' : 'Aroma de Vid'
  const tipo = !d.usuario ? '' : /@/.test(d.usuario) ? 'email' : /^\d{2}-\d{8}-\d$/.test(d.usuario) ? 'CUIT' : 'teléfono'
  const despues = d.usuario && d.portal
    ? `\n\nSi perdés el link, entrá en ${d.portal.replace(/^https?:\/\//, '')} con tu ${tipo} (${d.usuario}) y este PIN.`
    : ''
  return `Hola ${nombre}! Te compartimos tu acceso a la lista de precios de ${emp}, con disponibilidad actualizada y donde podés hacer tus pedidos:\n\n${d.url}\n\nTu PIN: ${d.pin}\n\nEntrás una sola vez y queda guardado en tu celular.${despues}`
}
