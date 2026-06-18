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
  width: '100%',
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 7,
  padding: '9px 12px',
  fontSize: 13,
  color: T.text,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.12s',
}

const LBL: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: T.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 5,
}

const DROP: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: T.surface,
  border: `1px solid ${T.border2}`,
  borderRadius: 8,
  zIndex: 100,
  maxHeight: 220,
  overflowY: 'auto',
  marginTop: 2,
  boxShadow: '0 8px 24px rgba(26,18,16,0.14)',
}

const ESTADO_STYLE: Record<string, React.CSSProperties> = {
  pendiente: { background: T.amberBg, color: T.amber, border: `1px solid rgba(160,112,16,0.25)` },
  entregado: { background: T.greenBg, color: T.green, border: `1px solid rgba(45,122,79,0.25)` },
  cancelado:  { background: T.redBg,   color: T.red,   border: `1px solid rgba(192,48,48,0.25)` },
}

interface Producto { id: string; nombre: string; bodega?: string; stock: number; precio_venta: number }
interface Cliente { id: string; nombre: string; apellido?: string; razon_social?: string }
interface PedidoItem { producto_id: string; nombre: string; cantidad: number; precio_unitario: number }
interface StockStatus { [key: string]: { disponible: number; pedido: number; ok: boolean } }
interface Pedido {
  id: string; numero: string; cliente_nombre: string; vendedor_nombre?: string
  items: PedidoItem[]; estado: string; fecha_entrega?: string; notas?: string; created_at: string
}

const ITEM_EMPTY: PedidoItem = { producto_id: '', nombre: '', cantidad: 1, precio_unitario: 0 }

export default function PedidosPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vendedores, setVendedores] = useState<{id:string;nombre:string}[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteSearch, setClienteSearch] = useState('')
  const [clienteOpen, setClienteOpen] = useState(false)
  const [vendedorNombre, setVendedorNombre] = useState('')
  const [items, setItems] = useState<PedidoItem[]>([{ ...ITEM_EMPTY }])
  const [prodSearches, setProdSearches] = useState<string[]>([''])
  const [prodOpen, setProdOpen] = useState<number>(-1)
  const [notas, setNotas] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [stockStatus, setStockStatus] = useState<StockStatus>({})
  const [stockChecked, setStockChecked] = useState(false)
  const [toast, setToast] = useState('')
  const [modalDetalle, setModalDetalle] = useState<Pedido | null>(null)

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e); cargar(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    const [pRes, prRes, cRes, vRes] = await Promise.all([
      fetch(`/api/pedidos?empresa=${emp}`),
      fetch(`/api/productos?empresa=${emp}`),
      fetch(`/api/clientes?empresa=${emp}`),
      fetch(`/api/vendedores?empresa=${emp}`),
    ])
    setPedidos(await pRes.json().catch(() => []))
    setProductos(await prRes.json().catch(() => []))
    setClientes(await cRes.json().catch(() => []))
    setVendedores(await vRes.json().catch(() => []))
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function seleccionarProducto(idx: number, prodId: string, prodNombre: string) {
    const prod = productos.find(p => p.id === prodId)
    const newItems = [...items]
    newItems[idx] = { producto_id: prodId, nombre: prodNombre, cantidad: newItems[idx].cantidad, precio_unitario: prod?.precio_venta || 0 }
    setItems(newItems)
    setProdOpen(-1)
    setStockChecked(false)
  }

  function updateItem(idx: number, field: string, value: number | string) {
    const newItems = [...items]
    ;(newItems[idx] as unknown as Record<string, number | string>)[field] = value
    setItems(newItems)
    setStockChecked(false)
  }

  function addItem() {
    setItems(i => [...i, { ...ITEM_EMPTY }])
    setProdSearches(s => [...s, ''])
  }

  function removeItem(idx: number) {
    setItems(i => i.filter((_, j) => j !== idx))
    setProdSearches(s => s.filter((_, j) => j !== idx))
    if (prodOpen === idx) setProdOpen(-1)
  }

  async function verificarStock() {
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa, cliente_id: clienteId || null, cliente_nombre: clienteNombre || 'Sin cliente',
        vendedor_nombre: vendedorNombre || null,
        items: items.filter(i => i.producto_id),
        notas, fecha_entrega: fechaEntrega || null,
        estado: 'pendiente', verificarStock: true, _dryRun: true,
      }),
    })
    const data = await res.json()
    if (data.stockStatus) { setStockStatus(data.stockStatus); setStockChecked(true) }
  }

  async function guardar() {
    if (items.every(i => !i.producto_id)) { showToast('Agregá al menos un producto'); return }
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa, cliente_id: clienteId || null, cliente_nombre: clienteNombre || 'Sin cliente',
        vendedor_nombre: vendedorNombre || null,
        items: items.filter(i => i.producto_id),
        notas, fecha_entrega: fechaEntrega || null, estado: 'pendiente',
      }),
    })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false); cargar(empresa)
    showToast(`Pedido ${data.numero} creado`)
  }

  async function cambiarEstado(id: string, estado: string) {
    await fetch('/api/pedidos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, estado }) })
    cargar(empresa); showToast(`Pedido ${estado}`)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Cancelar este pedido?')) return
    await fetch(`/api/pedidos?id=${id}`, { method: 'DELETE' })
    cargar(empresa); showToast('Pedido cancelado')
  }

  function abrirNuevo() {
    setClienteId(''); setClienteNombre(''); setClienteSearch(''); setClienteOpen(false)
    setVendedorNombre(''); setItems([{ ...ITEM_EMPTY }]); setProdSearches([''])
    setProdOpen(-1); setNotas(''); setFechaEntrega('')
    setStockStatus({}); setStockChecked(false); setModal(true)
  }

  const pendientes = pedidos.filter(p => p.estado === 'pendiente')
  const entregados = pedidos.filter(p => p.estado === 'entregado')

  const clientesFiltrados = (() => {
    const q = clienteSearch.toLowerCase()
    return q
      ? clientes.filter(c => `${c.razon_social || ''} ${c.nombre} ${c.apellido || ''}`.toLowerCase().includes(q)).slice(0, 20)
      : clientes.slice(0, 20)
  })()

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .tr:hover { background: #FDFAF6 !important; }
        .btn-row:hover { border-color: ${T.border2} !important; color: ${T.muted} !important; }
        .btn-wine:hover { background: #6A0000 !important; }
        .btn-ghost:hover { background: ${T.bg} !important; }
        .drop-item:hover { background: ${T.bg} !important; }
        input:focus, select:focus, textarea:focus { border-color: ${T.border2} !important; box-shadow: 0 0 0 3px rgba(128,0,0,0.08) !important; }
      `}</style>

      {/* Page header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Pedidos</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: '3px 0 0' }}>Gestión de pedidos de clientes</p>
        </div>
        <button className="btn-wine" onClick={abrirNuevo} style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.12s', fontFamily: 'inherit' }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nuevo pedido
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Pedidos pendientes', value: pendientes.length, color: T.amber },
            { label: 'Entregados',         value: entregados.length, color: T.green },
            { label: 'Total pedidos',      value: pedidos.length,    color: T.text  },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{kpi.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Número','Cliente','Vendedor','Productos','Fecha entrega','Estado',''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: T.muted, fontSize: 13 }}>Cargando...</td></tr>
              ) : pedidos.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: T.muted, fontSize: 13 }}>No hay pedidos todavía</td></tr>
              ) : pedidos.map(p => (
                <tr key={p.id} className="tr" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: T.text, fontWeight: 600 }}>{p.numero}</td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: T.text }}>{p.cliente_nombre}</td>
                  <td style={{ padding: '11px 16px', fontSize: 12, color: T.muted }}>{p.vendedor_nombre || '—'}</td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: T.muted }}>{(p.items as PedidoItem[]).length} items</td>
                  <td style={{ padding: '11px 16px', fontSize: 12, color: T.muted }}>
                    {p.fecha_entrega ? new Date(p.fecha_entrega + 'T12:00:00').toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ ...(ESTADO_STYLE[p.estado] || { background: T.bg, color: T.dim, border: `1px solid ${T.border}` }), padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'inline-block' }}>
                      {p.estado}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-row" style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 11, color: T.dim, transition: 'all 0.12s', fontFamily: 'inherit' }} onClick={() => setModalDetalle(p)}>Ver</button>
                      {p.estado === 'pendiente' && (
                        <button className="btn-row" style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 11, color: T.green, transition: 'all 0.12s', fontFamily: 'inherit' }} onClick={() => cambiarEstado(p.id, 'entregado')}>Entregar</button>
                      )}
                      <button className="btn-row" style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 11, color: T.red, transition: 'all 0.12s', fontFamily: 'inherit' }} onClick={() => eliminar(p.id)}>Cancelar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nuevo pedido */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24, overflowY: 'auto' }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 680, margin: 'auto', boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: T.surface, zIndex: 1, borderRadius: '14px 14px 0 0' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Nuevo pedido</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Cliente */}
                <div>
                  <label style={LBL}>Cliente</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={INP}
                      placeholder="Buscar cliente..."
                      value={clienteOpen ? clienteSearch : (clienteNombre || '')}
                      onFocus={() => { setClienteOpen(true); setClienteSearch('') }}
                      onChange={e => setClienteSearch(e.target.value)}
                      onBlur={() => setTimeout(() => setClienteOpen(false), 200)}
                    />
                    {clienteOpen && (
                      <div style={DROP}>
                        <div
                          className="drop-item"
                          onMouseDown={() => { setClienteId(''); setClienteNombre(''); setClienteOpen(false) }}
                          style={{ padding: '8px 12px', cursor: 'pointer', color: T.dim, fontSize: 12, borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                        >
                          — Sin cliente —
                        </div>
                        {clientesFiltrados.map(c => {
                          const label = c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()
                          return (
                            <div key={c.id}
                              className="drop-item"
                              onMouseDown={() => { setClienteId(c.id); setClienteNombre(label); setClienteOpen(false) }}
                              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.border}`, background: clienteId === c.id ? T.bg : 'transparent', transition: 'background 0.1s' }}>
                              <div style={{ color: T.text, fontSize: 13 }}>{label}</div>
                            </div>
                          )
                        })}
                        {clientesFiltrados.length === 0 && (
                          <div style={{ padding: '8px 12px', color: T.dim, fontSize: 12 }}>Sin resultados</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendedor */}
                <div>
                  <label style={LBL}>Vendedor</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
                    {vendedores.map(v => (
                      <button key={v.id} onClick={() => setVendedorNombre(v.nombre)}
                        style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${vendedorNombre === v.nombre ? T.wine : T.border}`, background: vendedorNombre === v.nombre ? T.wine : 'transparent', color: vendedorNombre === v.nombre ? '#fff' : T.muted, transition: 'all 0.12s' }}>
                        {v.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ ...LBL, margin: 0 }}>Productos</label>
                  <button className="btn-row" style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: T.muted, transition: 'all 0.12s', fontFamily: 'inherit' }} onClick={addItem}>+ agregar línea</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map((item, idx) => {
                    const st = stockStatus[item.producto_id]
                    const q = (prodSearches[idx] || '').toLowerCase()
                    const filtered = prodOpen === idx
                      ? (q ? productos.filter(p => `${p.nombre} ${p.bodega || ''}`.toLowerCase().includes(q)) : productos).slice(0, 25)
                      : []
                    return (
                      <div key={idx} style={{ border: `1px solid ${st ? (st.ok ? T.greenBd : T.redBd) : T.border}`, borderRadius: 10, padding: 10, background: st ? (st.ok ? T.greenBg : T.redBg) : 'transparent', transition: 'border-color 0.12s' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <input
                              style={INP}
                              placeholder="Buscar producto..."
                              value={prodOpen === idx ? (prodSearches[idx] || '') : item.nombre}
                              onFocus={() => {
                                setProdOpen(idx)
                                setProdSearches(s => { const n = [...s]; n[idx] = ''; return n })
                              }}
                              onChange={e => setProdSearches(s => { const n = [...s]; n[idx] = e.target.value; return n })}
                              onBlur={() => setTimeout(() => setProdOpen(p => p === idx ? -1 : p), 200)}
                            />
                            {prodOpen === idx && (
                              <div style={DROP}>
                                {filtered.map(p => (
                                  <div key={p.id}
                                    className="drop-item"
                                    onMouseDown={() => seleccionarProducto(idx, p.id, p.nombre)}
                                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}>
                                    <div style={{ color: T.text, fontSize: 13 }}>{p.nombre}</div>
                                    <div style={{ color: T.dim, fontSize: 11 }}>{p.bodega ? `${p.bodega} · ` : ''}Stock: {p.stock}</div>
                                  </div>
                                ))}
                                {filtered.length === 0 && (
                                  <div style={{ padding: '8px 12px', color: T.dim, fontSize: 12 }}>Sin resultados</div>
                                )}
                              </div>
                            )}
                          </div>
                          <input
                            type="number" min="1"
                            style={{ ...INP, width: 80, textAlign: 'center' }}
                            value={item.cantidad}
                            onChange={e => updateItem(idx, 'cantidad', parseInt(e.target.value) || 1)}
                            placeholder="Cant."
                          />
                          {items.length > 1 && (
                            <button onClick={() => removeItem(idx)}
                              style={{ background: 'none', border: 'none', color: T.dim, fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '6px 4px', fontFamily: 'inherit' }}>×</button>
                          )}
                        </div>
                        {st && (
                          <div style={{ fontSize: 12, marginTop: 6, fontWeight: 600, color: st.ok ? T.green : T.red }}>
                            {st.ok ? `✓ Stock OK — ${st.disponible} disponibles` : `⚠ Stock insuficiente — ${st.disponible} disponibles, pedís ${st.pedido}`}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={LBL}>Fecha de entrega estimada</label>
                  <input type="date" style={INP} value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} />
                </div>
                <div>
                  <label style={LBL}>Notas</label>
                  <input style={INP} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones..." />
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-row" style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }} onClick={verificarStock}>Verificar stock</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setModal(false)}>Cancelar</button>
                <button className="btn-wine" style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' }} onClick={guardar}>Guardar pedido</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {modalDetalle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setModalDetalle(null)}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Pedido {modalDetalle.numero}</h2>
              <button onClick={() => setModalDetalle(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, borderBottom: `1px solid ${T.border}` }}>
              <div><span style={{ color: T.dim }}>Cliente:</span> <span style={{ color: T.text }}>{modalDetalle.cliente_nombre}</span></div>
              {modalDetalle.vendedor_nombre && <div><span style={{ color: T.dim }}>Vendedor:</span> <span style={{ color: T.text }}>{modalDetalle.vendedor_nombre}</span></div>}
              {modalDetalle.fecha_entrega && <div><span style={{ color: T.dim }}>Entrega:</span> <span style={{ color: T.text }}>{new Date(modalDetalle.fecha_entrega + 'T12:00:00').toLocaleDateString('es-AR')}</span></div>}
              {modalDetalle.notas && <div><span style={{ color: T.dim }}>Notas:</span> <span style={{ color: T.text }}>{modalDetalle.notas}</span></div>}
              <div><span style={{ color: T.dim }}>Estado:</span>{' '}
                <span style={{ ...(ESTADO_STYLE[modalDetalle.estado] || {}), padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'inline-block' }}>{modalDetalle.estado}</span>
              </div>
            </div>
            <div style={{ padding: '0 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: '10px 0 8px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Producto</th>
                    <th style={{ textAlign: 'center', padding: '10px 0 8px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cant.</th>
                  </tr>
                </thead>
                <tbody>
                  {(modalDetalle.items as PedidoItem[]).map((item, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '9px 0', color: T.text }}>{item.nombre}</td>
                      <td style={{ padding: '9px 0', textAlign: 'center', color: T.muted }}>{item.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setModalDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: T.surface, color: T.text, fontSize: 13, padding: '12px 20px', borderRadius: 12, zIndex: 200, border: `1px solid ${T.border}`, boxShadow: '0 8px 32px rgba(26,18,16,0.12)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
