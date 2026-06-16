'use client'
import { useEffect, useState } from 'react'
import type { Proveedor } from '@/types'

const C = {
  bg: '#0F0F0F', surface: '#141414', card: '#1A1A1A', border: '#2A2A2A',
  accent: '#8B1A2A', text: '#E8E8E8', muted: '#888888', dim: '#555555',
  green: '#4CAF7D', amber: '#D4820A', red: '#E05555',
}
const INP: React.CSSProperties = {
  background: '#111', border: `1px solid ${C.border}`, borderRadius: 6,
  color: C.text, padding: '6px 10px', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box',
}
function btn(v: 'default' | 'accent' | 'ghost' | 'danger' = 'default', ex: React.CSSProperties = {}): React.CSSProperties {
  const b = {
    default: { background: '#222', border: `1px solid ${C.border}` },
    accent:  { background: C.accent, border: 'none' },
    ghost:   { background: 'transparent', border: '1px solid transparent' },
    danger:  { background: 'rgba(224,85,85,0.1)', border: `1px solid rgba(224,85,85,0.3)` },
  }
  return { ...b[v], color: C.text, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', ...ex }
}
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: C.dim, fontWeight: 500, marginBottom: 4 }}>{children}</div>
}

const EMPTY: Omit<Proveedor, 'id' | 'created_at'> = {
  empresa: 'aroma', nombre: '', razon_social: '', cuit: '',
  email: '', telefono: '', direccion: '', contacto: '', saldo: 0, notas: '', activo: true,
}

interface Compra {
  id: string; numero: string; proveedor_nombre: string
  items: { nombre: string; cantidad: number; precio_unitario: number; subtotal: number }[]
  total: number; estado: string; fecha_esperada: string | null; created_at: string
}

const ESTADO_COLOR: Record<string, string> = { pendiente: C.amber, enviado: '#7AADFF', recibido: C.green, cancelado: C.dim }
const ESTADO_LABEL: Record<string, string> = { pendiente: 'Pendiente', enviado: 'Enviado', recibido: 'Recibido', cancelado: 'Cancelado' }

export default function ProveedoresPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  // Historial compras
  const [histProv, setHistProv] = useState<Proveedor | null>(null)
  const [histCompras, setHistCompras] = useState<Compra[]>([])
  const [histLoading, setHistLoading] = useState(false)

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e); cargar(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/proveedores?empresa=${emp}`)
      const data = await res.json()
      setProveedores(Array.isArray(data) ? data : [])
    } finally { setLoading(false) }
  }

  async function abrirHistorial(p: Proveedor) {
    setHistProv(p); setHistCompras([]); setHistLoading(true)
    const res = await fetch(`/api/compras?empresa=${empresa}&proveedor_id=${p.id}`)
    const data = await res.json()
    setHistCompras(Array.isArray(data) ? data.filter((c: Compra) => c.estado !== 'cancelado') : [])
    setHistLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function abrirNuevo() { setForm({ ...EMPTY, empresa: empresa as 'aroma' | 'lavid' }); setEditId(null); setModal(true) }

  function abrirEditar(p: Proveedor) {
    setForm({ empresa: p.empresa, nombre: p.nombre, razon_social: p.razon_social || '', cuit: p.cuit || '', email: p.email || '', telefono: p.telefono || '', direccion: p.direccion || '', contacto: p.contacto || '', saldo: p.saldo, notas: p.notas || '', activo: p.activo })
    setEditId(p.id!); setModal(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio'); return }
    setSaving(true)
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { id: editId, ...form } : { ...form, empresa }
    const res = await fetch('/api/proveedores', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json(); setSaving(false)
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false); cargar(empresa)
    showToast(editId ? 'Proveedor actualizado' : 'Proveedor guardado')
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este proveedor?')) return
    await fetch(`/api/proveedores?id=${id}`, { method: 'DELETE' })
    cargar(empresa); showToast('Proveedor eliminado')
  }

  const filtrados = proveedores.filter(p => {
    const q = busqueda.toLowerCase()
    return !q || `${p.nombre}${p.razon_social || ''}${p.cuit || ''}`.toLowerCase().includes(q)
  })

  const saldoTotal = proveedores.reduce((a, p) => a + (p.saldo || 0), 0)

  const OVERLAY: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }

  return (
    <div style={{ padding: 28, background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`.prow:hover{background:rgba(255,255,255,0.025)!important}.pinp:focus{border-color:#555!important}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Proveedores</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>{empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'}</p>
        </div>
        <button onClick={abrirNuevo} style={{ ...btn('accent'), padding: '8px 18px', fontSize: 13 }}>+ Nuevo proveedor</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total proveedores', value: proveedores.length, color: C.text },
          { label: 'Saldo a pagar', value: `$${saldoTotal.toLocaleString('es-AR')}`, color: saldoTotal > 0 ? C.red : C.text },
          { label: 'Activos', value: proveedores.filter(p => p.activo).length, color: C.green },
        ].map(k => (
          <div key={k.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <input className="pinp" style={{ ...INP, marginBottom: 14 }} placeholder="Buscar por nombre, CUIT, contacto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />

      {/* Tabla */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
              {['Proveedor', 'CUIT', 'Contacto', 'Teléfono', 'Saldo', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: C.dim }}>Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: C.dim }}>Sin proveedores</td></tr>
            ) : filtrados.map(p => (
              <tr key={p.id} className="prow" style={{ borderBottom: `1px solid rgba(42,42,42,0.6)` }}>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ fontWeight: 600, color: C.text }}>{p.nombre}</div>
                  {p.razon_social && p.razon_social !== p.nombre && <div style={{ fontSize: 11, color: C.dim, marginTop: 1 }}>{p.razon_social}</div>}
                </td>
                <td style={{ padding: '11px 14px', color: C.muted, fontFamily: 'monospace', fontSize: 12 }}>{p.cuit || '—'}</td>
                <td style={{ padding: '11px 14px', color: C.muted, fontSize: 12 }}>{p.contacto || '—'}</td>
                <td style={{ padding: '11px 14px', color: C.muted, fontSize: 12 }}>{p.telefono || '—'}</td>
                <td style={{ padding: '11px 14px', fontWeight: 600, color: (p.saldo || 0) > 0 ? C.red : C.text }}>${(p.saldo || 0).toLocaleString('es-AR')}</td>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button style={btn('default', { padding: '4px 10px', fontSize: 11 })} onClick={() => abrirHistorial(p)}>Compras</button>
                    <button style={btn('default', { padding: '4px 10px', fontSize: 11 })} onClick={() => abrirEditar(p)}>Editar</button>
                    <button style={btn('danger', { padding: '4px 10px', fontSize: 11 })} onClick={() => eliminar(p.id!)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal historial compras */}
      {histProv && (
        <div style={OVERLAY} onClick={e => e.target === e.currentTarget && setHistProv(null)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: '100%', maxWidth: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{histProv.nombre}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>Historial de órdenes de compra</p>
              </div>
              <button onClick={() => setHistProv(null)} style={btn('ghost', { fontSize: 18, color: C.dim, padding: '2px 8px' })}>×</button>
            </div>

            {histLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.dim }}>Cargando...</div>
            ) : histCompras.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.dim }}>Sin órdenes de compra registradas</div>
            ) : (
              <>
                {/* Resumen */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {[
                    { label: 'Órdenes', value: histCompras.length },
                    { label: 'Total comprado', value: `$${histCompras.reduce((a, c) => a + c.total, 0).toLocaleString('es-AR')}` },
                    { label: 'Última compra', value: new Date(histCompras[0].created_at).toLocaleDateString('es-AR') },
                  ].map(k => (
                    <div key={k.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: C.dim, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{k.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{k.value}</div>
                    </div>
                  ))}
                </div>

                {/* Lista OCs */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {histCompras.map(c => (
                    <div key={c.id} style={{ border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: C.surface }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.muted }}>{c.numero}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, color: ESTADO_COLOR[c.estado], background: `${ESTADO_COLOR[c.estado]}18`, border: `1px solid ${ESTADO_COLOR[c.estado]}44` }}>
                            {ESTADO_LABEL[c.estado]}
                          </span>
                          <span style={{ fontSize: 11, color: C.dim }}>{new Date(c.created_at).toLocaleDateString('es-AR')}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: C.green }}>${c.total.toLocaleString('es-AR')}</span>
                      </div>
                      <div style={{ padding: '8px 14px' }}>
                        {(c.items || []).map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: i < c.items.length - 1 ? `1px solid rgba(42,42,42,0.4)` : 'none' }}>
                            <span style={{ color: C.text }}>{item.nombre}</span>
                            <span style={{ color: C.muted }}>{item.cantidad} u. × ${item.precio_unitario?.toLocaleString('es-AR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal editar/nuevo */}
      {modal && (
        <div style={OVERLAY} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{editId ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
              <button onClick={() => setModal(false)} style={btn('ghost', { fontSize: 18, color: C.dim, padding: '2px 8px' })}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}><Label>Nombre *</Label><input className="pinp" style={INP} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></div>
              <div style={{ gridColumn: '1/-1' }}><Label>Razón social</Label><input className="pinp" style={INP} value={form.razon_social} onChange={e => setForm(f => ({ ...f, razon_social: e.target.value }))} /></div>
              <div><Label>CUIT</Label><input className="pinp" style={INP} value={form.cuit} onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))} /></div>
              <div><Label>Contacto</Label><input className="pinp" style={INP} value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))} /></div>
              <div><Label>Teléfono</Label><input className="pinp" style={INP} value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} /></div>
              <div><Label>Email</Label><input className="pinp" style={INP} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div style={{ gridColumn: '1/-1' }}><Label>Dirección</Label><input className="pinp" style={INP} value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} /></div>
              <div style={{ gridColumn: '1/-1' }}><Label>Saldo (negativo = deuda)</Label><input className="pinp" type="number" style={INP} value={form.saldo} onChange={e => setForm(f => ({ ...f, saldo: parseFloat(e.target.value) || 0 }))} /></div>
              <div style={{ gridColumn: '1/-1' }}><Label>Notas</Label><textarea className="pinp" style={{ ...INP, height: 72, resize: 'none' }} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => setModal(false)} style={btn('default', { padding: '7px 16px' })}>Cancelar</button>
              <button onClick={guardar} disabled={saving} style={{ ...btn('accent', { padding: '7px 18px', fontSize: 13 }), opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar'}
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
