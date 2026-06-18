'use client'
import { useEffect, useState } from 'react'

interface Vendedor {
  id: string
  nombre: string
  activo: boolean | null
}

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
  green:   '#2D7A4F',
  greenBg: 'rgba(45,122,79,0.08)',
  greenBd: 'rgba(45,122,79,0.22)',
  red:     '#C03030',
  redBg:   'rgba(192,48,48,0.08)',
  redBd:   'rgba(192,48,48,0.22)',
}

const INP: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
  color: T.text, padding: '9px 12px', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

const EMPTY: Omit<Vendedor, 'id'> = { nombre: '', activo: true }

export default function VendedoresPage() {
  const [empresa, setEmpresa] = useState<'aroma' | 'lavid'>('aroma')
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Vendedor, 'id'>>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const e = (localStorage.getItem('empresa') || 'aroma') as 'aroma' | 'lavid'
    setEmpresa(e)
    cargar(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/vendedores?empresa=${emp}`)
      const data = await res.json()
      if (data.error) { setError(data.error); setVendedores([]) }
      else setVendedores(Array.isArray(data) ? data : [])
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function abrirNuevo() {
    setEditId(null)
    setForm({ ...EMPTY })
    setModal(true)
  }

  function abrirEditar(v: Vendedor) {
    setEditId(v.id)
    setForm({ nombre: v.nombre, activo: v.activo ?? true })
    setModal(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) return
    setGuardando(true)
    try {
      const res = editId
        ? await fetch('/api/vendedores', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editId, ...form }),
          })
        : await fetch('/api/vendedores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: form.nombre, activo: true }),
          })
      const data = await res.json()
      if (data.error) { showToast('Error: ' + data.error); return }
      setModal(false)
      cargar(empresa)
      showToast(editId ? 'Vendedor actualizado' : 'Vendedor creado')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id: string, nombre: string) {
    if (!confirm(`¿Desactivar a ${nombre}?`)) return
    const res = await fetch(`/api/vendedores?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    cargar(empresa)
    showToast('Vendedor desactivado')
  }

  async function reactivar(v: Vendedor) {
    const res = await fetch('/api/vendedores', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: v.id, activo: true }),
    })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    cargar(empresa)
    showToast('Vendedor reactivado')
  }

  const activos = vendedores.filter(v => v.activo !== false)
  const inactivos = vendedores.filter(v => v.activo === false)

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        .tr:hover { background: #FDFAF6 !important; }
        .vinp:focus { border-color: ${T.border2} !important; }
        .btn-act:hover { opacity: 0.85; }
      `}</style>

      {/* Page header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Vendedores</h1>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 3, margin: '3px 0 0' }}>
            {activos.length} activos — {empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'}
          </p>
        </div>
        <button
          className="btn-act"
          onClick={abrirNuevo}
          style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          + Nuevo vendedor
        </button>
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 760 }}>
        {error && (
          <div style={{ background: T.redBg, border: `1px solid ${T.redBd}`, borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: T.red }}>
            <strong>Error al conectar con Supabase:</strong> {error}
            <div style={{ marginTop: 6, color: T.muted, fontSize: 12 }}>
              Verificá que la tabla <code style={{ color: T.text }}>vendedores</code> existe en Supabase y tiene RLS desactivado o políticas para el rol anon.
            </div>
          </div>
        )}

        {/* Tabla activos */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Nombre', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} style={{ padding: '40px 16px', textAlign: 'center', color: T.dim, fontSize: 13 }}>Cargando...</td></tr>
              ) : activos.length === 0 && !error ? (
                <tr><td colSpan={3} style={{ padding: '40px 16px', textAlign: 'center', color: T.dim, fontSize: 13 }}>
                  No hay vendedores. Creá el primero con el botón de arriba.
                </td></tr>
              ) : activos.map(v => (
                <tr key={v.id} className="tr" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s', cursor: 'default' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: T.text, fontWeight: 500 }}>{v.nombre}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.green, background: T.greenBg, border: `1px solid ${T.greenBd}`, borderRadius: 99, padding: '3px 9px' }}>
                      Activo
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => abrirEditar(v)}
                        style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
                      >Editar</button>
                      <button
                        onClick={() => eliminar(v.id, v.nombre)}
                        style={{ background: T.redBg, border: `1px solid ${T.redBd}`, color: T.red, borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
                      >Desactivar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {inactivos.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Inactivos ({inactivos.length})</div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', opacity: 0.7 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {inactivos.map(v => (
                    <tr key={v.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: T.muted }}>{v.nombre}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => reactivar(v)}
                          style={{ background: T.greenBg, border: `1px solid ${T.greenBd}`, color: T.green, borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
                        >Reactivar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setModal(false)}
        >
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>
                {editId ? 'Editar vendedor' : 'Nuevo vendedor'}
              </h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Nombre</label>
                <input
                  className="vinp"
                  style={INP}
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre completo"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && guardar()}
                />
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setModal(false)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer' }}>Cancelar</button>
              <button
                onClick={guardar}
                disabled={guardando || !form.nombre.trim()}
                style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: guardando || !form.nombre.trim() ? 0.5 : 1 }}
              >
                {guardando ? 'Guardando...' : editId ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 13, padding: '12px 20px', borderRadius: 10, boxShadow: '0 4px 16px rgba(26,18,16,0.12)', zIndex: 200 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
