'use client'
import { useEffect, useState, useRef } from 'react'

const C = {
  bg: '#0F0F0F', surface: '#141414', card: '#1A1A1A', border: '#2A2A2A',
  accent: '#8B1A2A', text: '#E8E8E8', muted: '#888888', dim: '#555555',
  green: '#4CAF7D', amber: '#D4820A', red: '#E05555',
}
const INP: React.CSSProperties = {
  background: '#111', border: `1px solid ${C.border}`, borderRadius: 6,
  color: C.text, padding: '6px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
}
function btn(v: 'default' | 'accent' | 'danger' | 'ghost' = 'default', ex: React.CSSProperties = {}): React.CSSProperties {
  const b = { default: { background: '#222', border: `1px solid ${C.border}` }, accent: { background: C.accent, border: 'none' }, danger: { background: 'rgba(224,85,85,0.1)', border: `1px solid rgba(224,85,85,0.3)` }, ghost: { background: 'transparent', border: '1px solid transparent' } }
  return { ...b[v], color: C.text, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', ...ex }
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
interface Producto { id: string; nombre: string; bodega: string; precio_costo?: number }

const ITEM_EMPTY: ItemCompra = { producto_id: '', nombre: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }
const ESTADO_LABEL: Record<string, string> = { pendiente: 'Pendiente', enviado: 'Enviado', recibido: 'Recibido', cancelado: 'Cancelado' }
const ESTADO_COLOR: Record<string, string> = { pendiente: C.amber, enviado: '#7AADFF', recibido: C.green, cancelado: C.dim }
const NEXT_ESTADO: Record<string, string> = { pendiente: 'enviado', enviado: 'recibido' }

export default function ComprasPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [compras, setCompras] = useState<Compra[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [detalle, setDetalle] = useState<Compra | null>(null)

  const [proveedorId, setProveedorId] = useState('')
  const [proveedorNombre, setProveedorNombre] = useState('')
  const [items, setItems] = useState<ItemCompra[]>([{ ...ITEM_EMPTY }])
  const [notas, setNotas] = useState('')
  const [fechaEsperada, setFechaEsperada] = useState('')
  const [prodSugs, setProdSugs] = useState<number | null>(null)
  const provRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e); cargar(e)
  }, [])

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
    ni[idx] = { ...ni[idx], producto_id: prod.id, nombre: prod.nombre + (prod.bodega ? ' - ' + prod.bodega : ''), precio_unitario: prod.precio_costo || 0 }
    ni[idx].subtotal = ni[idx].cantidad * ni[idx].precio_unitario
    if (idx === ni.length - 1) ni.push({ ...ITEM_EMPTY })
    setItems(ni); setProdSugs(null)
  }

  function updateItem(idx: number, field: keyof ItemCompra, value: string | number) {
    const ni = [...items]
    ;(ni[idx] as Record<string, string | number>)[field] = value
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
    <div style={{ padding: 28, background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`.crow:hover{background:rgba(255,255,255,0.025)!important}.cinp:focus{border-color:#555!important}.psug:hover{background:rgba(255,255,255,0.07)!important}`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Órdenes de compra</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>{empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'}</p>
        </div>
        <button onClick={abrirNuevo} style={{ ...btn('accent'), padding: '8px 18px', fontSize: 13 }}>+ Nueva orden</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Pendientes de envío', value: kpis.pendientes, color: C.amber },
          { label: 'Enviadas', value: kpis.enviadas, color: '#7AADFF' },
          { label: 'Total en tránsito', value: `$${kpis.total.toLocaleString('es-AR')}`, color: C.text },
        ].map(k => (
          <div key={k.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filtro estado */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['', 'pendiente', 'enviado', 'recibido'].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)}
            style={{ ...btn(filtroEstado === e ? 'accent' : 'ghost', { padding: '4px 12px', fontSize: 12 }), border: `1px solid ${filtroEstado === e ? C.accent : C.border}` }}>
            {e === '' ? 'Todas' : ESTADO_LABEL[e]}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
              {['N°', 'Proveedor', 'Items', 'Total', 'Estado', 'Fecha esp.', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: C.dim }}>Cargando...</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: C.dim }}>Sin órdenes</td></tr>
            ) : filtradas.map(c => (
              <tr key={c.id} className="crow" style={{ borderBottom: `1px solid rgba(42,42,42,0.6)`, cursor: 'pointer' }} onClick={() => setDetalle(c)}>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: C.muted }}>{c.numero}</td>
                <td style={{ padding: '10px 14px', fontWeight: 500 }}>{c.proveedor_nombre}</td>
                <td style={{ padding: '10px 14px', color: C.muted }}>{c.items?.length || 0} ítem{c.items?.length !== 1 ? 's' : ''}</td>
                <td style={{ padding: '10px 14px', fontWeight: 700 }}>${c.total.toLocaleString('es-AR')}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, color: ESTADO_COLOR[c.estado], background: `${ESTADO_COLOR[c.estado]}18`, border: `1px solid ${ESTADO_COLOR[c.estado]}44` }}>
                    {ESTADO_LABEL[c.estado]}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', color: C.muted, fontSize: 12 }}>
                  {c.fecha_esperada ? new Date(c.fecha_esperada + 'T12:00:00').toLocaleDateString('es-AR') : '—'}
                </td>
                <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {NEXT_ESTADO[c.estado] && (
                      <button className="cinp" style={btn('default', { padding: '3px 8px', fontSize: 11 })} onClick={() => avanzarEstado(c)}>
                        → {ESTADO_LABEL[NEXT_ESTADO[c.estado]]}
                      </button>
                    )}
                    {c.estado !== 'recibido' && (
                      <button className="cinp" style={btn('danger', { padding: '3px 8px', fontSize: 11 })} onClick={() => cancelar(c)}>Cancelar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nueva OC */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Nueva orden de compra</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 500, marginBottom: 5 }}>Proveedor</div>
                <input ref={provRef} className="cinp" style={{ ...INP, width: '100%' }} list="prov-dl"
                  placeholder="Nombre del proveedor" value={proveedorNombre}
                  onChange={e => {
                    setProveedorNombre(e.target.value)
                    const p = proveedores.find(p => (p.razon_social || p.nombre) === e.target.value)
                    if (p) setProveedorId(p.id); else setProveedorId('')
                  }} />
                <datalist id="prov-dl">{proveedores.map(p => <option key={p.id} value={p.razon_social || p.nombre} />)}</datalist>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 500, marginBottom: 5 }}>Fecha esperada de entrega</div>
                <input type="date" className="cinp" style={{ ...INP, width: '100%' }} value={fechaEsperada} onChange={e => setFechaEsperada(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 500, marginBottom: 5 }}>Notas</div>
                <input className="cinp" style={{ ...INP, width: '100%' }} placeholder="Observaciones..." value={notas} onChange={e => setNotas(e.target.value)} />
              </div>
            </div>

            {/* Ítems */}
            <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Productos a pedir</div>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                    {['Producto', 'Cantidad', 'Precio unitario', 'Subtotal', ''].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, color: C.dim, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid rgba(42,42,42,0.5)` }}>
                      <td style={{ padding: '6px 8px', position: 'relative' }}>
                        <input className="cinp" style={{ ...INP, minWidth: 200 }} placeholder="Buscar producto..."
                          value={item.nombre}
                          onChange={e => { updateItem(idx, 'nombre', e.target.value); updateItem(idx, 'producto_id', ''); setProdSugs(idx) }}
                          onFocus={() => setProdSugs(idx)} onBlur={() => setTimeout(() => setProdSugs(null), 150)} />
                        {prodSugs === idx && item.nombre.length >= 1 && (
                          <div style={{ position: 'absolute', top: '100%', left: 8, right: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, zIndex: 20, maxHeight: 180, overflowY: 'auto' }}>
                            {productos.filter(p => p.nombre.toLowerCase().includes(item.nombre.toLowerCase())).slice(0, 8).map(p => (
                              <div key={p.id} className="psug" style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12 }} onMouseDown={() => selProducto(idx, p)}>
                                <span style={{ fontWeight: 500 }}>{p.nombre}</span>
                                {p.bodega && <span style={{ color: C.muted }}> — {p.bodega}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input type="number" className="cinp" style={{ ...INP, width: 70 }} min={1} value={item.cantidad || ''} onChange={e => updateItem(idx, 'cantidad', +e.target.value || 1)} />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input type="number" className="cinp" style={{ ...INP, width: 100 }} min={0} value={item.precio_unitario || ''} onChange={e => updateItem(idx, 'precio_unitario', +e.target.value)} />
                      </td>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: C.muted }}>${item.subtotal.toLocaleString('es-AR')}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        {items.length > 1 && (
                          <button style={{ background: 'transparent', border: 'none', color: C.dim, fontSize: 16, cursor: 'pointer' }} onClick={() => setItems(items.filter((_, i) => i !== idx))}>×</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setItems([...items, { ...ITEM_EMPTY }])} style={{ ...btn('ghost', { fontSize: 12 }), color: C.accent }}>+ agregar línea</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Total: <span style={{ color: C.green }}>${total.toLocaleString('es-AR')}</span></span>
                <button onClick={() => setModal(false)} style={btn('default', { padding: '7px 16px' })}>Cancelar</button>
                <button onClick={guardar} disabled={saving} style={{ ...btn('accent', { padding: '7px 18px', fontSize: 13 }), opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Guardando...' : 'Crear orden'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detalle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setDetalle(null)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: '100%', maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{detalle.numero}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>{detalle.proveedor_nombre}</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, color: ESTADO_COLOR[detalle.estado], background: `${ESTADO_COLOR[detalle.estado]}18`, border: `1px solid ${ESTADO_COLOR[detalle.estado]}44` }}>
                {ESTADO_LABEL[detalle.estado]}
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Producto', 'Cant.', 'P. Unit.', 'Subtotal'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, color: C.dim, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(detalle.items || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid rgba(42,42,42,0.5)` }}>
                    <td style={{ padding: '8px 10px' }}>{item.nombre}</td>
                    <td style={{ padding: '8px 10px', color: C.muted }}>{item.cantidad}</td>
                    <td style={{ padding: '8px 10px', color: C.muted }}>${item.precio_unitario?.toLocaleString('es-AR')}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>${item.subtotal?.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: C.muted }}>{detalle.notas}</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Total: <span style={{ color: C.green }}>${detalle.total.toLocaleString('es-AR')}</span></div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {NEXT_ESTADO[detalle.estado] && (
                <button style={btn('accent', { padding: '7px 16px' })} onClick={() => { avanzarEstado(detalle); setDetalle(null) }}>
                  → {ESTADO_LABEL[NEXT_ESTADO[detalle.estado]]}
                </button>
              )}
              <button style={btn('default', { padding: '7px 16px' })} onClick={() => setDetalle(null)}>Cerrar</button>
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
