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
  goldBg:  'rgba(184,138,44,0.08)',
  goldBd:  'rgba(184,138,44,0.22)',
  green:   '#2D7A4F',
  greenBg: 'rgba(45,122,79,0.08)',
  greenBd: 'rgba(45,122,79,0.22)',
  red:     '#C03030',
  redBg:   'rgba(192,48,48,0.08)',
  redBd:   'rgba(192,48,48,0.22)',
  blue:    '#2B5EA0',
  blueBg:  'rgba(43,94,160,0.08)',
  blueBd:  'rgba(43,94,160,0.22)',
  amber:   '#A07010',
  amberBg: 'rgba(160,112,16,0.07)',
  amberBd: 'rgba(160,112,16,0.22)',
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

interface Bodega {
  id: string
  nombre: string
  proveedor_nombre?: string
  region?: string
  pais?: string
  notas?: string
  activo: boolean
}

interface Proveedor { id: string; nombre: string }

const EMPTY = { nombre: '', proveedor_nombre: '', region: '', pais: 'Argentina', notas: '' }

export default function BodegasPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [bodegas, setBodegas] = useState<Bodega[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })
  const [editId, setEditId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e); cargar(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    const [bRes, pRes] = await Promise.all([fetch('/api/bodegas'), fetch(`/api/proveedores?empresa=${emp}`)])
    setBodegas(await bRes.json().catch(() => []))
    setProveedores(await pRes.json().catch(() => []))
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function abrirNuevo() { setForm({ ...EMPTY }); setEditId(null); setModal(true) }

  function abrirEditar(b: Bodega) {
    setForm({ nombre: b.nombre, proveedor_nombre: b.proveedor_nombre || '', region: b.region || '', pais: b.pais || 'Argentina', notas: b.notas || '' })
    setEditId(b.id); setModal(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio'); return }
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { id: editId, ...form } : form
    const res = await fetch('/api/bodegas', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false); cargar(empresa)
    showToast(editId ? 'Bodega actualizada' : 'Bodega guardada')
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta bodega?')) return
    await fetch(`/api/bodegas?id=${id}`, { method: 'DELETE' })
    cargar(empresa); showToast('Bodega eliminada')
  }

  const filtradas = bodegas.filter(b => {
    const q = busqueda.toLowerCase()
    return !q || `${b.nombre} ${b.proveedor_nombre || ''} ${b.region || ''}`.toLowerCase().includes(q)
  })

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        .tr:hover { background: #FDFAF6 !important; }
        .btn-act:hover { opacity: 0.85; }
      `}</style>

      {/* Page header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Bodegas</h1>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 3, margin: '3px 0 0' }}>{bodegas.length} bodegas registradas</p>
        </div>
        <button className="btn-act" onClick={abrirNuevo} style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          + Nueva bodega
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px' }}>
        {/* Table card */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
          {/* Filter bar */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, background: T.bg, display: 'flex', gap: 8 }}>
            <input
              placeholder="Buscar por nombre, proveedor, región..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: '7px 12px', fontSize: 13, color: T.text, outline: 'none' }}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Bodega', 'Proveedor', 'Región', 'País', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: T.muted, fontSize: 13 }}>Cargando...</td></tr>
              ) : filtradas.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: T.muted, fontSize: 13 }}>No hay bodegas todavía</td></tr>
              ) : filtradas.map(b => (
                <tr key={b.id} className="tr" style={{ borderBottom: `1px solid ${T.border}`, cursor: 'default', transition: 'background 0.1s' }}>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: T.text, fontWeight: 600 }}>{b.nombre}</td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: T.muted }}>{b.proveedor_nombre || '—'}</td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: T.dim }}>{b.region || '—'}</td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: T.dim }}>{b.pais || '—'}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => abrirEditar(b)}
                        style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: T.muted, fontSize: 12, fontWeight: 500 }}
                      >Editar</button>
                      <button
                        onClick={() => eliminar(b.id)}
                        style={{ background: T.redBg, border: `1px solid ${T.redBd}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: T.red, fontSize: 12, fontWeight: 500 }}
                      >Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
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
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(26,18,16,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>{editId ? 'Editar bodega' : 'Nueva bodega'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LBL}>Nombre de la bodega *</label>
                <input style={INP} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Alta Vista" />
              </div>
              <div>
                <label style={LBL}>Proveedor / Distribuidor</label>
                <input
                  style={INP}
                  value={form.proveedor_nombre}
                  onChange={e => setForm(f => ({ ...f, proveedor_nombre: e.target.value }))}
                  placeholder="Escribir o elegir proveedor..."
                  list="proveedores-list"
                />
                <datalist id="proveedores-list">
                  {proveedores.map(p => <option key={p.id} value={p.nombre} />)}
                </datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>Región</label>
                  <input style={INP} value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} placeholder="Ej: Mendoza" />
                </div>
                <div>
                  <label style={LBL}>País</label>
                  <input style={INP} value={form.pais} onChange={e => setForm(f => ({ ...f, pais: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={LBL}>Notas</label>
                <textarea style={{ ...INP, height: 72, resize: 'none' }} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
              </div>
            </div>

            {/* Modal footer */}
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
