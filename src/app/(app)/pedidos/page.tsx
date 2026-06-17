'use client'
import { useEffect, useState } from 'react'

const C = { bg:'#0F0F0F', surface:'#141414', card:'#1A1A1A', border:'#2A2A2A', accent:'#8B1A2A', text:'#E8E8E8', muted:'#888888', dim:'#555555', green:'#4CAF7D', amber:'#D4820A', red:'#E05555' }
const btn = (bg = C.accent): React.CSSProperties => ({ background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 })
const INP: React.CSSProperties = { background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: '8px 12px', width: '100%', fontSize: 13, outline: 'none' }
const LBL: React.CSSProperties = { display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }

const DROP: React.CSSProperties = { position: 'absolute', top: '100%', left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, zIndex: 100, maxHeight: 220, overflowY: 'auto', marginTop: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }

const ESTADO_COLOR: Record<string, string> = { pendiente: C.amber, entregado: C.green, cancelado: C.red }

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
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Pedidos pendientes', value: pendientes.length, color: C.amber },
          { label: 'Entregados',         value: entregados.length, color: C.green },
          { label: 'Total pedidos',      value: pedidos.length,    color: C.text  },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Pedidos</h1>
        <button style={btn()} onClick={abrirNuevo}>+ Nuevo pedido</button>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Número','Cliente','Vendedor','Productos','Fecha entrega','Estado',''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: C.muted }}>Cargando...</td></tr>
            ) : pedidos.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: C.muted }}>No hay pedidos todavía</td></tr>
            ) : pedidos.map(p => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: '11px 16px', color: C.text, fontWeight: 600 }}>{p.numero}</td>
                <td style={{ padding: '11px 16px', color: C.muted }}>{p.cliente_nombre}</td>
                <td style={{ padding: '11px 16px', color: C.dim, fontSize: 12 }}>{p.vendedor_nombre || '—'}</td>
                <td style={{ padding: '11px 16px', color: C.dim }}>{(p.items as PedidoItem[]).length} items</td>
                <td style={{ padding: '11px 16px', color: C.dim, fontSize: 12 }}>
                  {p.fecha_entrega ? new Date(p.fecha_entrega + 'T12:00:00').toLocaleDateString('es-AR') : '—'}
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <span style={{ background: `${ESTADO_COLOR[p.estado] || C.dim}22`, color: ESTADO_COLOR[p.estado] || C.dim, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                    {p.estado}
                  </span>
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={btn('#2A2A2A')} onClick={() => setModalDetalle(p)}>Ver</button>
                    {p.estado === 'pendiente' && (
                      <button style={btn(C.green)} onClick={() => cambiarEstado(p.id, 'entregado')}>Entregar</button>
                    )}
                    <button style={btn(C.red)} onClick={() => eliminar(p.id)}>Cancelar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo pedido */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24, overflowY: 'auto' }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 680, margin: 'auto' }}>
            <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Nuevo pedido</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
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
                        onMouseDown={() => { setClienteId(''); setClienteNombre(''); setClienteOpen(false) }}
                        style={{ padding: '8px 12px', cursor: 'pointer', color: C.dim, fontSize: 12, borderBottom: `1px solid ${C.border}` }}
                      >
                        — Sin cliente —
                      </div>
                      {clientesFiltrados.map(c => {
                        const label = c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()
                        return (
                          <div key={c.id}
                            onMouseDown={() => { setClienteId(c.id); setClienteNombre(label); setClienteOpen(false) }}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`, background: clienteId === c.id ? '#222' : 'transparent' }}>
                            <div style={{ color: C.text, fontSize: 13 }}>{label}</div>
                          </div>
                        )
                      })}
                      {clientesFiltrados.length === 0 && (
                        <div style={{ padding: '8px 12px', color: C.dim, fontSize: 12 }}>Sin resultados</div>
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
                      style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${vendedorNombre === v.nombre ? C.accent : C.border}`, background: vendedorNombre === v.nombre ? C.accent : 'transparent', color: vendedorNombre === v.nombre ? '#fff' : C.muted }}>
                      {v.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Productos */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ ...LBL, margin: 0 }}>Productos</label>
                <button style={{ ...btn('#2A2A2A'), padding: '4px 10px', fontSize: 12 }} onClick={addItem}>+ agregar línea</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item, idx) => {
                  const st = stockStatus[item.producto_id]
                  const q = (prodSearches[idx] || '').toLowerCase()
                  const filtered = prodOpen === idx
                    ? (q ? productos.filter(p => `${p.nombre} ${p.bodega || ''}`.toLowerCase().includes(q)) : productos).slice(0, 25)
                    : []
                  return (
                    <div key={idx} style={{ border: `1px solid ${st ? (st.ok ? C.green : C.red) : C.border}`, borderRadius: 10, padding: 10, background: st ? (st.ok ? '#4CAF7D0A' : '#E055550A') : 'transparent' }}>
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
                                  onMouseDown={() => seleccionarProducto(idx, p.id, p.nombre)}
                                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${C.border}` }}>
                                  <div style={{ color: C.text, fontSize: 13 }}>{p.nombre}</div>
                                  <div style={{ color: C.dim, fontSize: 11 }}>{p.bodega ? `${p.bodega} · ` : ''}Stock: {p.stock}</div>
                                </div>
                              ))}
                              {filtered.length === 0 && (
                                <div style={{ padding: '8px 12px', color: C.dim, fontSize: 12 }}>Sin resultados</div>
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
                            style={{ background: 'none', border: 'none', color: C.dim, fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '6px 4px' }}>×</button>
                        )}
                      </div>
                      {st && (
                        <div style={{ fontSize: 12, marginTop: 6, fontWeight: 600, color: st.ok ? C.green : C.red }}>
                          {st.ok ? `✓ Stock OK — ${st.disponible} disponibles` : `⚠ Stock insuficiente — ${st.disponible} disponibles, pedís ${st.pedido}`}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={LBL}>Fecha de entrega estimada</label>
                <input type="date" style={INP} value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} />
              </div>
              <div>
                <label style={LBL}>Notas</label>
                <input style={INP} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones..." />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button style={btn('#2A2A2A')} onClick={verificarStock}>Verificar stock</button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btn('#2A2A2A')} onClick={() => setModal(false)}>Cancelar</button>
                <button style={btn()} onClick={guardar}>Guardar pedido</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {modalDetalle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setModalDetalle(null)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 480 }}>
            <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Pedido {modalDetalle.numero}</h2>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div><span style={{ color: C.dim }}>Cliente:</span> <span style={{ color: C.text }}>{modalDetalle.cliente_nombre}</span></div>
              {modalDetalle.vendedor_nombre && <div><span style={{ color: C.dim }}>Vendedor:</span> <span style={{ color: C.text }}>{modalDetalle.vendedor_nombre}</span></div>}
              {modalDetalle.fecha_entrega && <div><span style={{ color: C.dim }}>Entrega:</span> <span style={{ color: C.text }}>{new Date(modalDetalle.fecha_entrega + 'T12:00:00').toLocaleDateString('es-AR')}</span></div>}
              {modalDetalle.notas && <div><span style={{ color: C.dim }}>Notas:</span> <span style={{ color: C.text }}>{modalDetalle.notas}</span></div>}
              <div><span style={{ color: C.dim }}>Estado:</span>{' '}
                <span style={{ color: ESTADO_COLOR[modalDetalle.estado] || C.dim, fontWeight: 700 }}>{modalDetalle.estado}</span>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', fontSize: 11, color: C.muted }}>Producto</th>
                  <th style={{ textAlign: 'center', padding: '6px 0', fontSize: 11, color: C.muted }}>Cant.</th>
                </tr>
              </thead>
              <tbody>
                {(modalDetalle.items as PedidoItem[]).map((item, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '8px 0', color: C.text }}>{item.nombre}</td>
                    <td style={{ padding: '8px 0', textAlign: 'center', color: C.muted }}>{item.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button style={btn('#2A2A2A')} onClick={() => setModalDetalle(null)}>Cerrar</button>
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
