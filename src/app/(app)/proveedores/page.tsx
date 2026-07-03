'use client'
import { useEffect, useState } from 'react'
import type { Proveedor } from '@/types'

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
  blue:    '#2B5EA0',
  blueBg:  'rgba(43,94,160,0.08)',
  blueBd:  'rgba(43,94,160,0.22)',
  amber:   '#A07010',
  amberBg: 'rgba(160,112,16,0.07)',
  amberBd: 'rgba(160,112,16,0.22)',
}

const INP: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
  color: T.text, padding: '9px 12px', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
      {children}
    </div>
  )
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

const ESTADO_STYLE: Record<string, { color: string; bg: string; bd: string }> = {
  pendiente: { color: T.amber, bg: T.amberBg, bd: T.amberBd },
  enviado:   { color: T.blue,  bg: T.blueBg,  bd: T.blueBd  },
  recibido:  { color: T.green, bg: T.greenBg, bd: T.greenBd },
  cancelado: { color: T.dim,   bg: 'rgba(168,152,136,0.08)', bd: 'rgba(168,152,136,0.22)' },
}
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
      const res = await fetch('/api/proveedores')
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

  const OVERLAY: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)',
    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  }

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`.tr:hover{background:#FDFAF6!important}.pinp:focus{border-color:${T.border2}!important}.btn-act:hover{opacity:0.85}`}</style>

      {/* Page header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>Proveedores</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: T.muted }}>{empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'}</p>
        </div>
        <button className="btn-act" onClick={abrirNuevo} style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Nuevo proveedor
        </button>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total proveedores', value: proveedores.length, color: T.text, sub: 'registrados' },
            { label: 'Saldo a pagar', value: `$${saldoTotal.toLocaleString('es-AR')}`, color: saldoTotal > 0 ? T.red : T.text, sub: 'deuda acumulada' },
            { label: 'Activos', value: proveedores.filter(p => p.activo).length, color: T.green, sub: 'proveedores activos' },
          ].map(k => (
            <div key={k.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{k.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
          {/* Filter bar */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, background: T.bg, display: 'flex', gap: 8 }}>
            <input
              className="pinp"
              placeholder="Buscar por nombre, CUIT, contacto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: '7px 12px', fontSize: 13, color: T.text, outline: 'none' }}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Proveedor', 'CUIT', 'Contacto', 'Teléfono', 'Saldo', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: T.dim, fontSize: 13 }}>Cargando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: T.dim, fontSize: 13 }}>Sin proveedores</td></tr>
              ) : filtrados.map(p => (
                <tr key={p.id} className="tr" style={{ borderBottom: `1px solid ${T.border}`, cursor: 'default', transition: 'background 0.1s' }}>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{p.nombre}</div>
                    {p.razon_social && p.razon_social !== p.nombre && <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>{p.razon_social}</div>}
                  </td>
                  <td style={{ padding: '11px 14px', color: T.muted, fontFamily: 'monospace', fontSize: 12 }}>{p.cuit || '—'}</td>
                  <td style={{ padding: '11px 14px', color: T.muted, fontSize: 12 }}>{p.contacto || '—'}</td>
                  <td style={{ padding: '11px 14px', color: T.muted, fontSize: 12 }}>{p.telefono || '—'}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 700, fontSize: 13, color: (p.saldo || 0) > 0 ? T.red : T.text }}>${(p.saldo || 0).toLocaleString('es-AR')}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => abrirHistorial(p)}
                        style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', fontSize: 11, color: T.muted, cursor: 'pointer', fontWeight: 500 }}
                      >Compras</button>
                      <button
                        onClick={() => abrirEditar(p)}
                        style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', fontSize: 11, color: T.muted, cursor: 'pointer', fontWeight: 500 }}
                      >Editar</button>
                      <button
                        onClick={() => eliminar(p.id!)}
                        style={{ background: T.redBg, border: `1px solid ${T.redBd}`, borderRadius: 6, padding: '4px 9px', fontSize: 11, color: T.red, cursor: 'pointer', fontWeight: 500 }}
                      >Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal historial compras */}
      {histProv && (
        <div style={OVERLAY} onClick={e => e.target === e.currentTarget && setHistProv(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, width: '100%', maxWidth: 700, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>{histProv.nombre}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Historial de órdenes de compra</p>
              </div>
              <button onClick={() => setHistProv(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {histLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: T.dim, fontSize: 13 }}>Cargando...</div>
              ) : histCompras.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: T.dim, fontSize: 13 }}>Sin órdenes de compra registradas</div>
              ) : (
                <>
                  {/* Resumen */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {[
                      { label: 'Órdenes', value: histCompras.length },
                      { label: 'Total comprado', value: `$${histCompras.reduce((a, c) => a + c.total, 0).toLocaleString('es-AR')}` },
                      { label: 'Última compra', value: new Date(histCompras[0].created_at).toLocaleDateString('es-AR') },
                    ].map(k => (
                      <div key={k.label} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{k.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{k.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Lista OCs */}
                  <div>
                    {histCompras.map(c => {
                      const es = ESTADO_STYLE[c.estado] || ESTADO_STYLE.cancelado
                      return (
                        <div key={c.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 12, color: T.muted }}>{c.numero}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, color: es.color, background: es.bg, border: `1px solid ${es.bd}` }}>
                                {ESTADO_LABEL[c.estado]}
                              </span>
                              <span style={{ fontSize: 11, color: T.dim }}>{new Date(c.created_at).toLocaleDateString('es-AR')}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: T.green, fontSize: 13 }}>${c.total.toLocaleString('es-AR')}</span>
                          </div>
                          <div style={{ padding: '8px 14px', background: T.surface }}>
                            {(c.items || []).map((item, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: i < c.items.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                                <span style={{ color: T.text }}>{item.nombre}</span>
                                <span style={{ color: T.muted }}>{item.cantidad} u. × ${item.precio_unitario?.toLocaleString('es-AR')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal editar/nuevo */}
      {modal && (
        <div style={OVERLAY} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>{editId ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setModal(false)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={guardar} disabled={saving} style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar'}
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
