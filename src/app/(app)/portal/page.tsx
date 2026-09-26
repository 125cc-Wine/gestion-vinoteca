'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Pantalla única para manejar el portal de pedidos de clientes (app aparte,
// carpeta portal/): verlo como admin, compartirlo con un cliente en un paso
// y ver quién tiene acceso. Toda la lógica de accesos vive en
// /api/clientes/portal.

const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8',
  text: '#1A1210', muted: '#6B5D55', dim: '#A89888',
  wine: '#800000', wineBg: 'rgba(128,0,0,0.07)',
  green: '#2D7A4F', greenBg: 'rgba(45,122,79,0.08)', greenBd: 'rgba(45,122,79,0.22)',
  red: '#C03030', redBg: 'rgba(192,48,48,0.08)', redBd: 'rgba(192,48,48,0.22)',
  wa: '#1F9D55',
}
const INP: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit', background: T.surface, color: T.text, outline: 'none', boxSizing: 'border-box' }
const BTN: React.CSSProperties = { borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${T.border2}`, background: T.surface, color: T.text, whiteSpace: 'nowrap' }
const CARD: React.CSSProperties = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }
const LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }

interface Lista { id: string; nombre: string; descuento: number; empresa: string }
interface ClientePortal { id: string; empresa: string; telefono: string | null; nombre: string; lista_precio_id: string | null; activo: boolean; ultimo_acceso: string | null }
interface ClienteMini { id: string; nombre: string; apellido?: string; razon_social?: string; telefono?: string; empresa: string; lista_precio_id?: string | null }

const nombreDe = (c: ClienteMini) => c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function linkWhatsApp(telefono: string | null | undefined, texto: string) {
  const tel = (telefono || '').replace(/\D/g, '').replace(/^(54)?9?0?/, '')
  return tel.length >= 8 ? `https://wa.me/549${tel}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`
}
function mensaje(nombre: string, empresa: string, url: string, pin: string) {
  const emp = empresa === 'lavid' ? 'La Vid Consultora' : 'Aroma de Vid'
  return `Hola ${nombre}! Te compartimos tu acceso a la lista de precios de ${emp}, con disponibilidad actualizada y donde podés hacer tus pedidos:\n\n${url}\n\nTu PIN: ${pin}\n\nGuardá este mensaje, el link es personal.`
}

export default function PortalPage() {
  const [listas, setListas] = useState<Lista[]>([])
  const [conPortal, setConPortal] = useState<ClientePortal[]>([])
  const [todos, setTodos] = useState<ClienteMini[]>([])
  const [portalUrl, setPortalUrl] = useState('')
  const [cargando, setCargando] = useState(true)
  const [toast, setToast] = useState('')

  const [listaPreview, setListaPreview] = useState('')
  const [q, setQ] = useState('')
  const [abiertoSug, setAbiertoSug] = useState(false)
  const [elegido, setElegido] = useState<ClienteMini | null>(null)
  const [listaElegida, setListaElegida] = useState('')
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [ultimo, setUltimo] = useState<{ nombre: string; url: string; pin: string; texto: string } | null>(null)

  function aviso(m: string) { setToast(m); setTimeout(() => setToast(''), 3500) }

  async function cargar() {
    const [{ data: ls }, r, rc] = await Promise.all([
      supabase.from('listas_precio').select('id,nombre,descuento,empresa').order('nombre'),
      fetch('/api/clientes/portal').then(x => x.json()),
      fetch('/api/clientes').then(x => x.json()),
    ])
    const l = (ls as Lista[]) || []
    setListas(l)
    setListaPreview(p => p || l[0]?.id || '')
    if (!r.error) { setConPortal(r.clientes); setPortalUrl(r.portal_url) }
    setTodos(Array.isArray(rc) ? rc : [])
    setCargando(false)
  }
  useEffect(() => { cargar() }, [])

  const listaPorId = useMemo(() => new Map(listas.map(l => [l.id, l])), [listas])
  const sugerencias = useMemo(() => {
    const t = norm(q.trim())
    if (t.length < 2) return []
    return todos.filter(c => norm(`${nombreDe(c)} ${c.nombre}`).includes(t)).slice(0, 12)
  }, [q, todos])

  // La ventana se abre en el clic (antes del fetch) para que el navegador no la bloquee.
  async function abrirAdmin(destino: { cliente_id?: string; lista_id?: string }) {
    const w = window.open('about:blank', '_blank')
    const d = await fetch('/api/clientes/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'admin', ...destino }) }).then(x => x.json())
    if (d.error || !d.url) { w?.close(); aviso('Error: ' + (d.error || 'no se pudo abrir')); return }
    if (w) w.location.href = d.url; else window.location.href = d.url
  }

  async function compartir(c: { id: string; nombre: string; empresa: string; telefono?: string | null }, lista_precio_id?: string) {
    const w = window.open('about:blank', '_blank')
    setOcupado(c.id)
    try {
      const d = await fetch('/api/clientes/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'compartir', cliente_id: c.id, lista_precio_id }) }).then(x => x.json())
      if (d.error) { w?.close(); aviso('Error: ' + d.error); return }
      const texto = mensaje(c.nombre, c.empresa, d.url, d.pin)
      setUltimo({ nombre: c.nombre, url: d.url, pin: d.pin, texto })
      const wa = linkWhatsApp(c.telefono, texto)
      if (w) w.location.href = wa; else window.open(wa, '_blank')
      cargar()
    } finally { setOcupado(null) }
  }

  async function agregar() {
    if (!elegido || !listaElegida) return
    await compartir({ id: elegido.id, nombre: nombreDe(elegido), empresa: elegido.empresa, telefono: elegido.telefono }, listaElegida)
    setElegido(null); setQ('')
  }

  async function cambiarLista(c: ClientePortal, lista: string) {
    const d = await fetch('/api/clientes/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'lista', cliente_id: c.id, lista_precio_id: lista }) }).then(x => x.json())
    if (d.error) { aviso('Error: ' + d.error); return }
    setConPortal(prev => prev.map(x => x.id === c.id ? { ...x, lista_precio_id: lista || null } : x))
    aviso('Lista actualizada')
  }

  async function quitar(c: ClientePortal) {
    if (!confirm(`¿Quitarle el acceso al portal a ${c.nombre}? Su link deja de funcionar.`)) return
    const d = await fetch('/api/clientes/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'revocar', cliente_id: c.id }) }).then(x => x.json())
    if (d.error) { aviso('Error: ' + d.error); return }
    aviso('Acceso quitado'); cargar()
  }

  const nombreLista = (id: string | null) => {
    const l = id ? listaPorId.get(id) : null
    return l ? `${l.nombre}${Number(l.descuento) > 0 ? ` (−${Number(l.descuento)}%)` : ''}` : '—'
  }

  return (
    <div style={{ padding: '24px 20px 80px', maxWidth: 980, margin: '0 auto', color: T.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Portal de clientes</h1>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>Donde tus clientes ven su lista de precios con stock del día y te hacen pedidos.</div>
        </div>
        {portalUrl && <span style={{ fontSize: 12, color: T.dim }}>{portalUrl.replace('https://', '')}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Ver el portal */}
        <div style={CARD}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>👁 Ver el portal</div>
          <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>Abrilo como lo ve un cliente. No hace falta link ni PIN.</div>
          <label style={LABEL}>Lista</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select style={INP} value={listaPreview} onChange={e => setListaPreview(e.target.value)}>
              {listas.map(l => <option key={l.id} value={l.id}>{nombreLista(l.id)}</option>)}
            </select>
            <button style={{ ...BTN, background: T.wine, color: '#FFF', border: 'none' }} disabled={!listaPreview} onClick={() => abrirAdmin({ lista_id: listaPreview })}>
              Abrir
            </button>
          </div>
        </div>

        {/* Compartir */}
        <div style={CARD}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📲 Compartir con un cliente</div>
          <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>Elegí cliente y lista: se abre WhatsApp con el link y el PIN listos para mandar.</div>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <label style={LABEL}>Cliente</label>
            {elegido ? (
              <div style={{ ...INP, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{nombreDe(elegido)}</span>
                <button onClick={() => { setElegido(null); setQ('') }} style={{ background: 'none', border: 'none', color: T.dim, cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            ) : (
              <input style={INP} placeholder="Buscar por nombre o razón social…" value={q}
                onChange={e => { setQ(e.target.value); setAbiertoSug(true) }} onFocus={() => setAbiertoSug(true)}
                onBlur={() => setTimeout(() => setAbiertoSug(false), 150)} />
            )}
            {!elegido && abiertoSug && sugerencias.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(26,18,16,0.12)', maxHeight: 260, overflowY: 'auto', marginTop: 4 }}>
                {sugerencias.map(c => (
                  <div key={c.id} onMouseDown={() => { setElegido(c); setListaElegida(c.lista_precio_id || listaElegida || listas[0]?.id || '') }}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                    {nombreDe(c)} <span style={{ color: T.dim, fontSize: 11 }}>· {c.empresa === 'lavid' ? 'La Vid' : 'Aroma'}{c.telefono ? ' · 📱' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <label style={LABEL}>Lista</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select style={INP} value={listaElegida} onChange={e => setListaElegida(e.target.value)}>
              <option value="">— Elegí una lista —</option>
              {listas.map(l => <option key={l.id} value={l.id}>{nombreLista(l.id)}</option>)}
            </select>
            <button style={{ ...BTN, background: T.wa, color: '#FFF', border: 'none', opacity: elegido && listaElegida ? 1 : 0.5 }}
              disabled={!elegido || !listaElegida || !!ocupado} onClick={agregar}>
              Enviar por WhatsApp
            </button>
          </div>
        </div>
      </div>

      {ultimo && (
        <div style={{ ...CARD, background: T.greenBg, borderColor: T.greenBd, marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>Acceso listo para {ultimo.nombre}</div>
            <div style={{ fontSize: 12, color: T.muted, wordBreak: 'break-all', marginTop: 4 }}>{ultimo.url}</div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.15em', marginTop: 4 }}>PIN {ultimo.pin}</div>
          </div>
          <button style={BTN} onClick={() => navigator.clipboard?.writeText(ultimo.texto).then(() => aviso('Mensaje copiado'))}>Copiar mensaje</button>
          <button style={{ ...BTN, border: 'none', background: 'none', color: T.dim }} onClick={() => setUltimo(null)}>Cerrar</button>
        </div>
      )}

      {/* Clientes con portal */}
      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Clientes en el portal</div>
          <span style={{ fontSize: 12, color: T.dim }}>{conPortal.filter(c => c.activo).length} con acceso</span>
        </div>
        {cargando ? (
          <div style={{ padding: 32, textAlign: 'center', color: T.dim, fontSize: 13 }}>Cargando…</div>
        ) : conPortal.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: T.dim, fontSize: 13 }}>Todavía ningún cliente. Compartí el portal con el primero desde arriba.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {['Cliente', 'Lista', 'Estado', ''].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: T.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {conPortal.map(c => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>
                      {c.nombre}
                      <div style={{ fontSize: 11, color: T.dim }}>{c.empresa === 'lavid' ? 'La Vid' : 'Aroma'}{c.telefono ? '' : ' · sin teléfono'}</div>
                    </td>
                    <td style={{ padding: '10px 16px', minWidth: 180 }}>
                      <select style={{ ...INP, padding: '6px 8px', fontSize: 12.5 }} value={c.lista_precio_id || ''} onChange={e => cambiarLista(c, e.target.value)}>
                        <option value="">— Sin lista —</option>
                        {listas.map(l => <option key={l.id} value={l.id}>{nombreLista(l.id)}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: c.activo ? T.green : T.dim, whiteSpace: 'nowrap' }}>
                      {c.activo ? (c.ultimo_acceso ? `Entró el ${new Date(c.ultimo_acceso).toLocaleDateString('es-AR')}` : 'Con acceso · no entró aún') : 'Sin acceso'}
                    </td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button title="Ver el portal como este cliente" style={{ ...BTN, padding: '6px 10px', marginRight: 6 }} onClick={() => abrirAdmin({ cliente_id: c.id })}>👁 Ver</button>
                      <button title="Mandarle el link con un PIN nuevo por WhatsApp" disabled={!c.lista_precio_id || ocupado === c.id}
                        style={{ ...BTN, padding: '6px 10px', marginRight: 6, background: T.wa, color: '#FFF', border: 'none', opacity: c.lista_precio_id ? 1 : 0.5 }}
                        onClick={() => compartir(c)}>📲 Compartir</button>
                      {c.activo && (
                        <button title="Quitar acceso" style={{ ...BTN, padding: '6px 10px', background: T.redBg, borderColor: T.redBd, color: T.red }} onClick={() => quitar(c)}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: T.dim, marginTop: 14, lineHeight: 1.5 }}>
        "Compartir" le manda su mismo link con un PIN nuevo (el anterior deja de servir). Si alguien más consiguió el link, usá ✕ y volvé a compartir: se genera un link nuevo.
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: T.text, color: '#FFF', padding: '10px 18px', borderRadius: 10, fontSize: 13, zIndex: 300 }}>{toast}</div>}
    </div>
  )
}
