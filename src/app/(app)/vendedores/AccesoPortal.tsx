'use client'
import { useState } from 'react'

// Acceso del vendedor de calle al portal, dentro de su ficha: ve sus
// clientes (los asignados en la ficha de cada cliente), toma pedidos, anota
// cobros (que se confirman en Cobros vendedores) y da de alta clientes.
// El link es fijo; el PIN se guarda cifrado, así que solo se puede mostrar
// cuando se genera uno nuevo. El vendedor puede cambiarlo desde el portal.

// Teléfono argentino → número para wa.me (549 + característica + número).
export function waNumero(tel: string | null | undefined) {
  let d = (tel || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('54')) d = d.slice(2)
  if (d.startsWith('9')) d = d.slice(1)
  if (d.startsWith('0')) d = d.slice(1)
  return d.length >= 10 ? '549' + d : ''
}

const C = { border: '#DDD0C0', muted: '#6B5D55', dim: '#A89888', wine: '#800000', red: '#C03030', green: '#2D7A4F', bg: '#F5F1EC' }
const btn: React.CSSProperties = { background: '#fff', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 7, padding: '7px 12px', fontSize: 12.5, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }

export default function AccesoPortal({ vendedor, onCambio }: {
  vendedor: { id: string; nombre: string; telefono: string | null; portal_url: string | null; portal_ultimo_acceso: string | null }
  onCambio: () => void
}) {
  const [url, setUrl] = useState(vendedor.portal_url)
  const [pin, setPin] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [msg, setMsg] = useState('')
  const [copiado, setCopiado] = useState(false)

  async function post(accion: 'acceso' | 'nuevo_pin' | 'revocar') {
    if (accion === 'nuevo_pin' && !confirm(`¿Generar un PIN nuevo para ${vendedor.nombre}? El que tiene deja de funcionar.`)) return
    if (accion === 'revocar' && !confirm(`¿Dar de baja el acceso de ${vendedor.nombre} al portal? El link y el PIN dejan de funcionar.`)) return
    setOcupado(true); setMsg('')
    const d = await fetch('/api/vendedores/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendedor_id: vendedor.id, accion }) })
      .then(r => r.json()).catch(() => ({ error: 'Sin conexión' }))
    setOcupado(false)
    if (d.error) { setMsg('Error: ' + d.error); return }
    if (accion === 'revocar') { setUrl(null); setPin(null); setMsg('Acceso dado de baja.') }
    else { setUrl(d.url); setPin(d.pin ?? null) }
    onCambio()
  }

  const texto = url
    ? `Hola ${vendedor.nombre}! Este es tu acceso de vendedor al portal: ves tus clientes, tomás pedidos y anotás cobros.\n\n${url}\n\n` +
      (pin ? `Tu PIN: ${pin}\n\nEntrás una vez y queda guardado en el celular. Si querés, lo cambiás por uno tuyo desde el portal. Es personal, no lo compartas.`
           : 'Entrás con tu PIN de siempre. Si no lo recordás, pedime uno nuevo.')
    : ''
  const wa = waNumero(vendedor.telefono)

  async function copiar() {
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000) }
    catch { setMsg('No se pudo copiar: seleccioná el texto a mano.') }
  }

  return (
    <div>
      {!url ? (
        <>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>Todavía no tiene acceso al portal.</div>
          <button style={{ ...btn, background: C.wine, color: '#fff', border: 'none' }} disabled={ocupado} onClick={() => post('acceso')}>
            {ocupado ? 'Generando…' : 'Generar link y PIN'}
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
            {vendedor.portal_ultimo_acceso
              ? `Último ingreso: ${new Date(vendedor.portal_ultimo_acceso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}`
              : 'Todavía no entró nunca.'}
          </div>
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 11px', fontSize: 12.5, fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all', userSelect: 'all' }}>{url}</div>
          {pin ? (
            <div style={{ margin: '10px 0' }}>
              <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.2em' }}>PIN {pin}</span>
              <div style={{ fontSize: 11.5, color: C.dim }}>El PIN se muestra solo esta vez: mandáselo ahora.</div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: C.muted, margin: '8px 0 10px' }}>El PIN no se puede volver a mostrar (se guarda cifrado). Si no lo recuerda, generale uno nuevo.</div>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {wa
              ? <a href={`https://wa.me/${wa}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer" style={{ ...btn, background: '#25D366', color: '#fff', border: 'none', textDecoration: 'none' }}>Enviar a su WhatsApp</a>
              : <a href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer" style={{ ...btn, background: '#25D366', color: '#fff', border: 'none', textDecoration: 'none' }} title="Cargá su teléfono en la ficha para mandárselo directo">WhatsApp (elegir contacto)</a>}
            <button style={btn} onClick={copiar}>{copiado ? '✓ Copiado' : 'Copiar mensaje'}</button>
            <button style={btn} disabled={ocupado} onClick={() => post('nuevo_pin')}>PIN nuevo</button>
            <button style={{ ...btn, color: C.red, borderColor: 'rgba(192,48,48,0.3)' }} disabled={ocupado} onClick={() => post('revocar')}>Dar de baja</button>
          </div>
        </>
      )}
      {msg && <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>{msg}</div>}
    </div>
  )
}
