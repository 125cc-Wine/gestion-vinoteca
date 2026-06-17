'use client'
import { useEffect, useState } from 'react'

const C = { bg:'#0F0F0F', surface:'#141414', card:'#1A1A1A', border:'#2A2A2A', accent:'#8B1A2A', text:'#E8E8E8', muted:'#888888', dim:'#555555', green:'#4CAF7D', amber:'#D4820A', red:'#E05555' }
const btn = (bg = C.accent): React.CSSProperties => ({ background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 })
const INP: React.CSSProperties = { background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: '8px 12px', width: '100%', fontSize: 13, outline: 'none' }
const LBL: React.CSSProperties = { display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }

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
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Bodegas</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '2px 0 0' }}>{bodegas.length} bodegas registradas</p>
        </div>
        <button style={btn()} onClick={abrirNuevo}>+ Nueva bodega</button>
      </div>

      <input
        style={{ ...INP, maxWidth: 360, marginBottom: 16 }}
        placeholder="Buscar por nombre, proveedor, región..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
      />

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Bodega', 'Proveedor', 'Región', 'País', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: C.muted }}>Cargando...</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: C.muted }}>No hay bodegas todavía</td></tr>
            ) : filtradas.map(b => (
              <tr key={b.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: '11px 16px', color: C.text, fontWeight: 600 }}>{b.nombre}</td>
                <td style={{ padding: '11px 16px', color: C.muted }}>{b.proveedor_nombre || '—'}</td>
                <td style={{ padding: '11px 16px', color: C.dim }}>{b.region || '—'}</td>
                <td style={{ padding: '11px 16px', color: C.dim }}>{b.pais || '—'}</td>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={btn('#2A2A2A')} onClick={() => abrirEditar(b)}>Editar</button>
                    <button style={btn(C.red)} onClick={() => eliminar(b.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 480 }}>
            <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>{editId ? 'Editar bodega' : 'Nueva bodega'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button style={btn('#2A2A2A')} onClick={() => setModal(false)}>Cancelar</button>
              <button style={btn()} onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1E1E1E', color: C.text, fontSize: 13, padding: '12px 20px', borderRadius: 12, zIndex: 100, border: `1px solid ${C.border}` }}>
          {toast}
        </div>
      )}
    </div>
  )
}
