'use client'
import { useEffect, useState, useRef } from 'react'

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
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 7,
  color: T.text,
  padding: '9px 12px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.12s',
}

interface ItemCompra { producto_id: string; nombre: string; cantidad: number; precio_unitario: number; subtotal: number }
interface Compra {
  id: string; numero: string; empresa: string
  proveedor_id: string | null; proveedor_nombre: string
  items: ItemCompra[]; total: number; notas: string
  fecha_esperada: string | null; estado: 'pendiente' | 'enviado' | 'recibido' | 'cancelado'
  created_at: string
}
interface Proveedor { id: string; nombre: string; razon_social?: string }
interface Producto { id: string; nombre: string; bodega: string; precio_costo?: number; precio_venta?: number }

const ITEM_EMPTY: ItemCompra = { producto_id: '', nombre: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }
const ESTADO_LABEL: Record<string, string> = { pendiente: 'Pendiente', enviado: 'Enviado', recibido: 'Recibido', cancelado: 'Cancelado' }
const NEXT_ESTADO: Record<string, string> = { pendiente: 'enviado', enviado: 'recibido' }

const ESTADO_STYLE: Record<string, React.CSSProperties> = {
  pendiente: { background: T.amberBg, color: T.amber, border: `1px solid rgba(160,112,16,0.25)` },
  enviado:   { background: T.blueBg,  color: T.blue,  border: `1px solid rgba(43,94,160,0.25)` },
  recibido:  { background: T.greenBg, color: T.green, border: `1px solid rgba(45,122,79,0.25)` },
  cancelado: { background: T.bg,      color: T.dim,   border: `1px solid ${T.border}` },
}

export default function ComprasPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [compras, setCompras] = useState<Compra[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [detalle, setDetalle] = useState<Compra | null>(null)

  const [proveedorId, setProveedorId] = useState('')
  const [proveedorNombre, setProveedorNombre] = useState('')
  const [items, setItems] = useState<ItemCompra[]>([{ ...ITEM_EMPTY }])
  const [notas, setNotas] = useState('')
  const [fechaEsperada, setFechaEsperada] = useState('')
  const [prodSugs, setProdSugs] = useState<number | null>(null)
  const [provSugsOpen, setProvSugsOpen] = useState(false)
  const provRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e); cargar(e)
  }, [])

  const dirtyCompra = proveedorNombre !== '' || items.some(i => i.nombre !== '')

  function tryCloseCompra() {
    if (dirtyCompra) { setConfirmClose(true) } else { setModal(false) }
  }

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (modal && dirtyCompra) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [modal, dirtyCompra])

  async function cargar(emp: string) {
    setLoading(true)
    try {
      const [cRes, provRes, prodRes] = await Promise.all([
        fetch(`/api/compras?empresa=${emp}`),
        fetch(`/api/proveedores?empresa=${emp}`),
        fetch(`/api/productos?empresa=${emp}`),
      ])
      const [cData, provData, prodData] = await Promise.all([cRes.json(), provRes.json(), prodRes.json()])
      setCompras(Array.isArray(cData) ? cData : [])
      setProveedores(Array.isArray(provData) ? provData : [])
      setProductos(Array.isArray(prodData) ? prodData : [])
    } finally { setLoading(false) }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function abrirNuevo() {
    setProveedorId(''); setProveedorNombre(''); setItems([{ ...ITEM_EMPTY }])
    setNotas(''); setFechaEsperada(''); setModal(true)
  }

  function selProducto(idx: number, prod: Producto) {
    const ni = [...items]
    const costo = prod.precio_costo || Math.round((prod.precio_venta || 0) * 0.5)
    ni[idx] = { ...ni[idx], producto_id: prod.id, nombre: prod.nombre + (prod.bodega ? ' - ' + prod.bodega : ''), precio_unitario: costo }
    ni[idx].subtotal = ni[idx].cantidad * ni[idx].precio_unitario
    if (idx === ni.length - 1) ni.push({ ...ITEM_EMPTY })
    setItems(ni); setProdSugs(null)
  }

  function updateItem(idx: number, field: keyof ItemCompra, value: string | number) {
    const ni = [...items]
    ;(ni[idx] as unknown as Record<string, string | number>)[field] = value
    ni[idx].subtotal = ni[idx].cantidad * ni[idx].precio_unitario
    setItems(ni)
  }

  const total = items.reduce((a, i) => a + (i.subtotal || 0), 0)

  async function guardar() {
    if (!proveedorNombre.trim()) { showToast('Ingresá el proveedor'); return }
    if (items.every(i => !i.nombre)) { showToast('Agregá al menos un ítem'); return }
    setSaving(true)
    const validItems = items.filter(i => i.nombre)
    const res = await fetch('/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa, proveedor_id: proveedorId || null, proveedor_nombre: proveedorNombre, items: validItems, notas, fecha_esperada: fechaEsperada || null, total }),
    })
    const data = await res.json(); setSaving(false)
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false); cargar(empresa); showToast('Orden de compra creada')
  }

  async function avanzarEstado(c: Compra) {
    const nuevoEstado = NEXT_ESTADO[c.estado]
    if (!nuevoEstado) return
    const label = nuevoEstado === 'recibido' ? 'marcar como RECIBIDO e incrementar stock' : 'marcar como ENVIADO'
    if (!confirm(`¿Confirmar ${label}?`)) return
    const res = await fetch('/api/compras', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, estado: nuevoEstado, items: c.items }),
    })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    cargar(empresa)
    showToast(nuevoEstado === 'recibido' ? 'Stock actualizado' : 'Estado actualizado')
  }

  async function cancelar(c: Compra) {
    if (!confirm('¿Cancelar esta orden?')) return
    await fetch(`/api/compras?id=${c.id}`, { method: 'DELETE' })
    cargar(empresa); showToast('Cancelada')
  }

  const filtradas = compras.filter(c => {
    if (c.estado === 'cancelado') return false
    if (filtroEstado && c.estado !== filtroEstado) return false
    return true
  })

  const kpis = {
    pendientes: compras.filter(c => c.estado === 'pendiente').length,
    enviadas: compras.filter(c => c.estado === 'enviado').length,
    total: compras.filter(c => c.estado !== 'cancelado').reduce((a, c) => a + c.total, 0),
  }

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .tr:hover { background: #FDFAF6 !important; }
        .btn-row:hover { border-color: ${T.border2} !important; color: ${T.muted} !important; }
        .btn-wine:hover { background: #6A0000 !important; }
        .drop-item:hover { background: ${T.bg} !important; }
        input:focus, select:focus, textarea:focus { border-color: ${T.border2} !important; box-shadow: 0 0 0 3px rgba(128,0,0,0.08) !important; }
      `}</style>

      {/* Page header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Órdenes de compra</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: '3px 0 0' }}>{empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'}</p>
        </div>
        <button className="btn-wine" onClick={abrirNuevo} style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.12s', fontFamily: 'inherit' }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nueva orden
        </button>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Pendientes de envío', value: kpis.pendientes, color: T.amber },
            { label: 'Enviadas',            value: kpis.enviadas,   color: T.blue  },
            { label: 'Total en tránsito',   value: `$${kpis.total.toLocaleString('es-AR')}`, color: T.text },
          ].map(k => (
            <div key={k.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filtro estado */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {['', 'pendiente', 'enviado', 'recibido'].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              style={{ background: filtroEstado === e ? T.wine : T.surface, color: filtroEstado === e ? '#fff' : T.muted, border: `1px solid ${filtroEstado === e ? T.wine : T.border}`, borderRadius: 7, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}>
              {e === '' ? 'Todas' : ESTADO_LABEL[e]}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['N°', 'Proveedor', 'Items', 'Total', 'Estado', 'Fecha esp.', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: T.muted, fontSize: 13 }}>Cargando...</td></tr>
              ) : filtradas.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: T.muted, fontSize: 13 }}>Sin órdenes</td></tr>
              ) : filtradas.map(c => (
                <tr key={c.id} className="tr" style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 0.1s' }} onClick={() => setDetalle(c)}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: T.muted }}>{c.numero}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: T.text }}>{c.proveedor_nombre}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: T.muted }}>{c.items?.length || 0} ítem{c.items?.length !== 1 ? 's' : ''}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: T.text }}>${c.total.toLocaleString('es-AR')}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ ...(ESTADO_STYLE[c.estado] || {}), padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'inline-block' }}>
                      {ESTADO_LABEL[c.estado]}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: T.muted }}>
                    {c.fecha_esperada ? new Date(c.fecha_esperada + 'T12:00:00').toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {NEXT_ESTADO[c.estado] && (
                        <button className="btn-row" style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 11, color: T.dim, transition: 'all 0.12s', fontFamily: 'inherit' }} onClick={() => avanzarEstado(c)}>
                          → {ESTADO_LABEL[NEXT_ESTADO[c.estado]]}
                        </button>
                      )}
                      {c.estado !== 'recibido' && (
                        <button className="btn-row" style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 11, color: T.red, transition: 'all 0.12s', fontFamily: 'inherit' }} onClick={() => cancelar(c)}>Cancelar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nueva OC */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && tryCloseCompra()}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: T.surface, zIndex: 1, borderRadius: '14px 14px 0 0' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Nueva orden de compra</h2>
              <button onClick={tryCloseCompra} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1/-1', position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Proveedor</label>
                  <input ref={provRef} style={{ ...INP, width: '100%' }}
                    placeholder="Buscar proveedor..." value={proveedorNombre}
                    onFocus={() => setProvSugsOpen(true)}
                    onBlur={() => setTimeout(() => setProvSugsOpen(false), 200)}
                    onChange={e => { setProveedorNombre(e.target.value); setProveedorId(''); setProvSugsOpen(true) }} />
                  {provSugsOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 8, zIndex: 30, maxHeight: 180, overflowY: 'auto', boxShadow: '0 8px 24px rgba(26,18,16,0.14)', marginTop: 2 }}>
                      {proveedores.filter(p => !proveedorNombre || p.nombre.toLowerCase().includes(proveedorNombre.toLowerCase()) || (p.razon_social || '').toLowerCase().includes(proveedorNombre.toLowerCase())).slice(0, 8).map(p => (
                        <div key={p.id} className="drop-item" style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                          onMouseDown={() => { setProveedorNombre(p.nombre); setProveedorId(p.id); setProvSugsOpen(false) }}>
                          <span style={{ fontWeight: 500, color: T.text }}>{p.nombre}</span>
                          {p.razon_social && p.razon_social !== p.nombre && <span style={{ color: T.muted }}> — {p.razon_social}</span>}
                        </div>
                      ))}
                      {proveedores.filter(p => !proveedorNombre || p.nombre.toLowerCase().includes(proveedorNombre.toLowerCase()) || (p.razon_social || '').toLowerCase().includes(proveedorNombre.toLowerCase())).length === 0 && (
                        <div style={{ padding: '8px 12px', fontSize: 12, color: T.dim }}>Sin resultados — se usará el nombre ingresado</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Fecha esperada de entrega</label>
                  <input type="date" style={{ ...INP, width: '100%' }} value={fechaEsperada} onChange={e => setFechaEsperada(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Notas</label>
                  <input style={{ ...INP, width: '100%' }} placeholder="Observaciones..." value={notas} onChange={e => setNotas(e.target.value)} />
                </div>
              </div>

              {/* Ítems */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Productos a pedir</div>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                        {['Producto', 'Cantidad', 'Precio unitario', 'Subtotal', ''].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '6px 8px', position: 'relative' }}>
                            <input style={{ ...INP, minWidth: 200 }} placeholder="Buscar producto..."
                              value={item.nombre}
                              onChange={e => { updateItem(idx, 'nombre', e.target.value); updateItem(idx, 'producto_id', ''); setProdSugs(idx) }}
                              onFocus={() => setProdSugs(idx)} onBlur={() => setTimeout(() => setProdSugs(null), 200)} />
                            {prodSugs === idx && (
                              <div style={{ position: 'absolute', top: '100%', left: 8, right: 8, background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 8, zIndex: 20, maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 24px rgba(26,18,16,0.14)', marginTop: 2 }}>
                                {(() => {
                                  const porBodega = proveedorNombre
                                    ? productos.filter(p => p.bodega?.toLowerCase().includes(proveedorNombre.toLowerCase()) || proveedorNombre.toLowerCase().includes((p.bodega || '').toLowerCase()))
                                    : productos
                                  const filtrados = porBodega.filter(p => !item.nombre || p.nombre.toLowerCase().includes(item.nombre.toLowerCase()))
                                  const resultado = filtrados.length > 0 ? filtrados : productos.filter(p => !item.nombre || p.nombre.toLowerCase().includes(item.nombre.toLowerCase()))
                                  return resultado.slice(0, 12).map(p => (
                                    <div key={p.id} className="drop-item" style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }} onMouseDown={() => selProducto(idx, p)}>
                                      <span style={{ fontWeight: 500, color: T.text }}>{p.nombre}</span>
                                      {p.bodega && <span style={{ color: T.muted }}> — {p.bodega}</span>}
                                    </div>
                                  ))
                                })()}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input type="number" style={{ ...INP, width: 70 }} min={1} value={item.cantidad || ''} onChange={e => updateItem(idx, 'cantidad', +e.target.value || 1)} />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input type="number" style={{ ...INP, width: 100 }} min={0} value={item.precio_unitario || ''} onChange={e => updateItem(idx, 'precio_unitario', +e.target.value)} />
                          </td>
                          <td style={{ padding: '6px 8px', fontSize: 13, fontWeight: 600, color: T.muted }}>${item.subtotal.toLocaleString('es-AR')}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            {items.length > 1 && (
                              <button style={{ background: 'transparent', border: 'none', color: T.dim, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setItems(items.filter((_, i) => i !== idx))}>×</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-row" onClick={() => setItems([...items, { ...ITEM_EMPTY }])}
                style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, color: T.wine, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.12s' }}>
                + agregar línea
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Total: <span style={{ color: T.green }}>${total.toLocaleString('es-AR')}</span></span>
                <button onClick={tryCloseCompra} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button className="btn-wine" onClick={guardar} disabled={saving} style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Guardando...' : 'Crear orden'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm close */}
      {confirmClose && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: T.surface, borderRadius: 12, padding: 28, maxWidth: 360, width: '90%', boxShadow: '0 20px 60px rgba(26,18,16,0.22)', border: `1px solid ${T.border2}` }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 15, color: T.text }}>¿Salir sin guardar?</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: T.muted }}>Tenés datos sin guardar en la orden de compra. Si salís ahora se van a perder.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmClose(false)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Volver</button>
              <button onClick={() => { setConfirmClose(false); setModal(false) }} style={{ background: T.red, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Salir igual</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detalle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setDetalle(null)}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>{detalle.numero}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted }}>{detalle.proveedor_nombre}</p>
              </div>
              <span style={{ ...(ESTADO_STYLE[detalle.estado] || {}), padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'inline-block' }}>
                {ESTADO_LABEL[detalle.estado]}
              </span>
            </div>
            <div style={{ padding: '0 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 0 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Producto', 'Cant.', 'P. Unit.', 'Subtotal'].map(h => (
                      <th key={h} style={{ padding: '10px 8px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(detalle.items || []).map((item, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '9px 8px', color: T.text }}>{item.nombre}</td>
                      <td style={{ padding: '9px 8px', color: T.muted }}>{item.cantidad}</td>
                      <td style={{ padding: '9px 8px', color: T.muted }}>${item.precio_unitario?.toLocaleString('es-AR')}</td>
                      <td style={{ padding: '9px 8px', fontWeight: 600, color: T.text }}>${item.subtotal?.toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: T.muted }}>{detalle.notas}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Total: <span style={{ color: T.green }}>${detalle.total.toLocaleString('es-AR')}</span></div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {NEXT_ESTADO[detalle.estado] && (
                <button className="btn-wine" style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' }} onClick={() => { avanzarEstado(detalle); setDetalle(null) }}>
                  → {ESTADO_LABEL[NEXT_ESTADO[detalle.estado]]}
                </button>
              )}
              <button style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 13, padding: '12px 20px', borderRadius: 12, boxShadow: '0 8px 32px rgba(26,18,16,0.12)', zIndex: 200 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
