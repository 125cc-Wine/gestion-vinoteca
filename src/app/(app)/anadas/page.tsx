'use client'
import { useEffect, useState } from 'react'

const T = {
  bg:      '#F5F1EC',
  surface: '#FFFFFF',
  border:  '#DDD0C0',
  border2: '#C8BAA8',
  text:    '#1A1210',
  muted:   '#6B5D55',
  dim:     '#A89888',
  wine:    '#800000',
  wineBg:  'rgba(128,0,0,0.07)',
  wineBd:  'rgba(128,0,0,0.18)',
  brown:   '#633A2C',
  gold:    '#B88A2C',
  red:     '#C03030',
  redBg:   'rgba(192,48,48,0.08)',
  redBd:   'rgba(192,48,48,0.22)',
  green:   '#2D7A4F',
  greenBg: 'rgba(45,122,79,0.08)',
  greenBd: 'rgba(45,122,79,0.22)',
}

const INP: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`, color: T.text,
  borderRadius: 7, padding: '9px 12px', width: '100%', fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
}
const LBL: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: T.muted,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5,
}

interface Anada {
  id: string
  anio: string
  descripcion?: string
  notas?: string
  activo: boolean
}

const EMPTY = { anio: '', descripcion: '', notas: '' }

export default function AnadasPage() {
  const [anadas, setAnadas] = useState<Anada[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })
  const [editId, setEditId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [toast, setToast] = useState('')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const res = await fetch('/api/anadas')
    setAnadas(await res.json().catch(() => []))
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function abrirNuevo() { setForm({ ...EMPTY }); setEditId(null); setModal(true) }

  function abrirEditar(a: Anada) {
    setForm({ anio: a.anio, descripcion: a.descripcion || '', notas: a.notas || '' })
    setEditId(a.id); setModal(true)
  }

  async function guardar() {
    if (!form.anio.trim()) { showToast('El año es obligatorio'); return }
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { id: editId, ...form } : form
    const res = await fetch('/api/anadas', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false); cargar()
    showToast(editId ? 'Añada actualizada' : 'Añada guardada')
  }

  async function syncDesdeProductos() {
    setSyncing(true)
    const res = await fetch('/api/anadas/sync', { method: 'POST' })
    const data = await res.json()
    setSyncing(false)
    if (data.error) { showToast('Error: ' + data.error); return }
    if (data.insertadas === 0) { showToast('Todo ya estaba sincronizado'); return }
    cargar()
    showToast(`${data.insertadas} añada${data.insertadas !== 1 ? 's' : ''} agregada${data.insertadas !== 1 ? 's' : ''}: ${data.anadas.join(', ')}`)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta añada?')) return
    await fetch(`/api/anadas?id=${id}`, { method: 'DELETE' })
    cargar(); showToast('Añada eliminada')
  }

  const filtradas = anadas.filter(a => {
    const q = busqueda.toLowerCase()
    return !q || `${a.anio} ${a.descripcion || ''}`.toLowerCase().includes(q)
  })

  const anioActual = new Date().getFullYear()

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        .tr:hover { background: #FDFAF6 !important; }
        .btn-act:hover { opacity: 0.85; }
      `}</style>

      {/* Page header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Añadas</h1>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 3, margin: '3px 0 0' }}>{anadas.length} añadas registradas</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-act" onClick={syncDesdeProductos} disabled={syncing} style={{ background: T.surface, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: syncing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: syncing ? 0.6 : 1 }}>
            {syncing ? '...' : '↻ Sync desde productos'}
          </button>
          <button className="btn-act" onClick={abrirNuevo} style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            + Nueva añada
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px' }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
          {/* Filter bar */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, background: T.bg }}>
            <input
              placeholder="Buscar por año o descripción..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: '7px 12px', fontSize: 13, color: T.text, outline: 'none' }}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Año', 'Descripción', 'Notas', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: T.muted, fontSize: 13 }}>Cargando...</td></tr>
              ) : filtradas.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: T.muted, fontSize: 13 }}>No hay añadas todavía</td></tr>
              ) : filtradas.map(a => {
                const diff = anioActual - parseInt(a.anio)
                const badge =
                  diff <= 2  ? { label: 'Joven',    bg: T.greenBg, bd: T.greenBd, color: T.green } :
                  diff <= 6  ? { label: 'En punto',  bg: T.wineBg,  bd: T.wineBd,  color: T.wine  } :
                               { label: 'Reserva',   bg: 'rgba(184,138,44,0.08)', bd: 'rgba(184,138,44,0.22)', color: T.gold  }
                return (
                  <tr key={a.id} className="tr" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{a.anio}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: badge.bg, border: `1px solid ${badge.bd}`, color: badge.color, letterSpacing: '0.04em' }}>{badge.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: T.muted }}>{a.descripcion || '—'}</td>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: T.dim, maxWidth: 280 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.notas || '—'}</span>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => abrirEditar(a)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: T.muted, fontSize: 12, fontWeight: 500 }}>Editar</button>
                        <button onClick={() => eliminar(a.id)} style={{ background: T.redBg, border: `1px solid ${T.redBd}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: T.red, fontSize: 12, fontWeight: 500 }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setModal(false)}
        >
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>{editId ? 'Editar añada' : 'Nueva añada'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LBL}>Año *</label>
                <input
                  style={INP}
                  type="number"
                  min="1900"
                  max={anioActual}
                  value={form.anio}
                  onChange={e => setForm(f => ({ ...f, anio: e.target.value }))}
                  placeholder={`Ej: ${anioActual - 2}`}
                />
              </div>
              <div>
                <label style={LBL}>Descripción</label>
                <input style={INP} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Ej: Cosecha tardía, excelente año" />
              </div>
              <div>
                <label style={LBL}>Notas</label>
                <textarea style={{ ...INP, height: 80, resize: 'none' }} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Características de la añada, condiciones climáticas, etc." />
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setModal(false)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={guardar} style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: T.surface, color: T.text, fontSize: 13, padding: '12px 20px', borderRadius: 12, zIndex: 200, border: `1px solid ${T.border}`, boxShadow: '0 4px 16px rgba(26,18,16,0.12)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
