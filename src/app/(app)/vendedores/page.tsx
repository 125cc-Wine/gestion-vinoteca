'use client'
import { useEffect, useState } from 'react'

interface Vendedor {
  id: string
  nombre: string
  empresa: string | null
  activo: boolean | null
}

const C = {
  bg: '#0F0F0F', surface: '#141414', card: '#1A1A1A', border: '#2A2A2A',
  accent: '#8B1A2A', text: '#E8E8E8', muted: '#888888', dim: '#555555',
  green: '#4CAF7D', red: '#E05555',
}

const INP: React.CSSProperties = {
  background: '#111', border: `1px solid ${C.border}`, borderRadius: 6,
  color: C.text, padding: '7px 10px', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

const EMPTY: Omit<Vendedor, 'id'> = { nombre: '', empresa: null, activo: true }

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
    setForm({ ...EMPTY, empresa })
    setModal(true)
  }

  function abrirEditar(v: Vendedor) {
    setEditId(v.id)
    setForm({ nombre: v.nombre, empresa: v.empresa, activo: v.activo ?? true })
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
            body: JSON.stringify({ ...form, empresa: form.empresa || empresa }),
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
    <div style={{ padding: 32, maxWidth: 720 }}>
      <style>{`
        .vrow:hover { background: rgba(255,255,255,0.03) !important; }
        .vinp:focus { border-color: ${C.accent} !important; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>Vendedores</h1>
          <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0' }}>
            {activos.length} activos — {empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'}
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          style={{ background: C.accent, border: 'none', color: C.text, borderRadius: 7, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          + Nuevo vendedor
        </button>
      </div>

      {error && (
        <div style={{ background: '#3A1010', border: '1px solid #8B2020', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: C.red }}>
          <strong>Error al conectar con Supabase:</strong> {error}
          <div style={{ marginTop: 6, color: C.muted, fontSize: 12 }}>
            Verificá que la tabla <code style={{ color: C.text }}>vendedores</code> existe en Supabase y tiene RLS desactivado o políticas para el rol anon.
          </div>
        </div>
      )}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Nombre', 'Empresa', 'Estado', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 11, color: C.dim, fontWeight: 600, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '40px 16px', textAlign: 'center', color: C.dim, fontSize: 13 }}>Cargando...</td></tr>
            ) : activos.length === 0 && !error ? (
              <tr><td colSpan={4} style={{ padding: '40px 16px', textAlign: 'center', color: C.dim, fontSize: 13 }}>
                No hay vendedores. Creá el primero con el botón de arriba.
              </td></tr>
            ) : activos.map(v => (
              <tr key={v.id} className="vrow" style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.1s' }}>
                <td style={{ padding: '12px 16px', fontSize: 14, color: C.text, fontWeight: 500 }}>{v.nombre}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>
                  {v.empresa === 'aroma' ? 'Aroma de Vid' : v.empresa === 'lavid' ? 'La Vid' : '— ambas —'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.green, background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.25)', borderRadius: 99, padding: '2px 10px' }}>
                    Activo
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => abrirEditar(v)} style={{ background: '#222', border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>
                      Editar
                    </button>
                    <button onClick={() => eliminar(v.id, v.nombre)} style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.25)', color: C.red, borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>
                      Desactivar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inactivos.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 12, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Inactivos ({inactivos.length})</div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {inactivos.map(v => (
                  <tr key={v.id} style={{ borderBottom: `1px solid ${C.border}`, opacity: 0.5 }}>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: C.muted }}>{v.nombre}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: C.dim }}>
                      {v.empresa === 'aroma' ? 'Aroma' : v.empresa === 'lavid' ? 'La Vid' : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <button onClick={() => reactivar(v)} style={{ background: 'rgba(76,175,125,0.1)', border: '1px solid rgba(76,175,125,0.2)', color: C.green, borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>
                        Reactivar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: '100%', maxWidth: 400 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 20px' }}>
              {editId ? 'Editar vendedor' : 'Nuevo vendedor'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: C.dim, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</label>
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

              <div>
                <label style={{ fontSize: 11, color: C.dim, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Empresa</label>
                <select
                  className="vinp"
                  style={INP}
                  value={form.empresa ?? ''}
                  onChange={e => setForm(f => ({ ...f, empresa: e.target.value || null }))}
                >
                  <option value="aroma">Aroma de Vid</option>
                  <option value="lavid">La Vid Consultora</option>
                  <option value="">Ambas</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => setModal(false)} style={{ background: '#222', border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando || !form.nombre.trim()} style={{ background: C.accent, border: 'none', color: C.text, borderRadius: 6, padding: '7px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: guardando || !form.nombre.trim() ? 0.5 : 1 }}>
                {guardando ? 'Guardando...' : editId ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 100 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
