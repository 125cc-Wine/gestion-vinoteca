'use client'
import { useState } from 'react'

// Acceso del vendedor de calle al portal: le manda su link por WhatsApp
// conservando su PIN (si ya tenía), le genera un PIN nuevo si se lo olvidó,
// o lo da de baja. Con eso ve sus clientes, toma pedidos y anota cobros
// (que se confirman en Cobros vendedores). El vendedor puede cambiar su PIN
// desde su pantalla del portal.
export default function AccesoPortal({ vendedorId, nombre }: { vendedorId: string; nombre: string }) {
  const [abierto, setAbierto] = useState(false)
  const [res, setRes] = useState<{ url: string; pin: string | null } | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [msg, setMsg] = useState('')

  async function post(accion: 'acceso' | 'nuevo_pin' | 'revocar') {
    if (accion === 'nuevo_pin' && !confirm(`¿Generar un PIN nuevo para ${nombre}? El que tiene deja de funcionar.`)) return
    setOcupado(true); setMsg('')
    const d = await fetch('/api/vendedores/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendedor_id: vendedorId, accion }) })
      .then(r => r.json()).catch(() => ({ error: 'Sin conexión' }))
    setOcupado(false)
    if (d.error) { setMsg('Error: ' + d.error); return }
    if (accion === 'revocar') { setRes(null); setMsg('Acceso dado de baja: el link y el PIN ya no funcionan.') }
    else setRes({ url: d.url, pin: d.pin ?? null })
  }

  const texto = res
    ? `Hola ${nombre}! Este es tu acceso de vendedor al portal: ves tus clientes, tomás pedidos y anotás cobros.\n\n${res.url}\n\n` +
      (res.pin ? `Tu PIN: ${res.pin}\n\nEntrás una vez y queda guardado en el celular. Si querés, lo cambiás por uno tuyo desde el portal. Es personal, no lo compartas.`
               : 'Entrás con tu PIN de siempre. Si no lo recordás, pedime uno nuevo.')
    : ''
  const btn: React.CSSProperties = { background: 'transparent', border: '1px solid #DDD0C0', color: '#6B5D55', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }

  return (
    <span style={{ position: 'relative' }}>
      <button style={btn} onClick={() => setAbierto(a => !a)}>Acceso portal</button>
      {abierto && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50, width: 330, background: '#fff', border: '1px solid #DDD0C0', borderRadius: 12, padding: 14, boxShadow: '0 12px 32px rgba(26,18,16,.14)', textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Portal del vendedor</div>
          <div style={{ fontSize: 12.5, color: '#6B5D55', marginBottom: 10 }}>Ve sus clientes (los asignados en la ficha de cada cliente), toma pedidos, anota cobros y da de alta clientes nuevos.</div>
          {res ? (
            <div style={{ background: '#F5F1EC', borderRadius: 10, padding: 10, fontSize: 12.5 }}>
              <div style={{ wordBreak: 'break-all' }}>{res.url}</div>
              {res.pin
                ? <><div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.2em', margin: '6px 0 4px' }}>PIN {res.pin}</div>
                    <div style={{ fontSize: 11.5, color: '#A89888', marginBottom: 8 }}>El PIN se muestra solo esta vez.</div></>
                : <div style={{ fontSize: 12, color: '#6B5D55', margin: '6px 0 8px' }}>Conserva su PIN de siempre (no se cambió).</div>}
              <a href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer" style={{ ...btn, display: 'inline-block', background: '#25D366', color: '#fff', border: 'none', textDecoration: 'none' }}>Mandar por WhatsApp</a>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button style={{ ...btn, background: '#800000', color: '#fff', border: 'none' }} disabled={ocupado} onClick={() => post('acceso')}>{ocupado ? '…' : '📲 Link (conserva PIN)'}</button>
              <button style={btn} disabled={ocupado} onClick={() => post('nuevo_pin')} title="Si se olvidó el PIN">🔑 PIN nuevo</button>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <button style={{ ...btn, border: 'none', color: '#C03030' }} disabled={ocupado} onClick={() => { if (confirm(`¿Dar de baja el acceso de ${nombre} al portal?`)) post('revocar') }}>Dar de baja</button>
            <button style={{ ...btn, border: 'none' }} onClick={() => { setAbierto(false); setRes(null); setMsg('') }}>Cerrar</button>
          </div>
          {msg && <div style={{ fontSize: 12, color: '#6B5D55', marginTop: 6 }}>{msg}</div>}
        </div>
      )}
    </span>
  )
}
