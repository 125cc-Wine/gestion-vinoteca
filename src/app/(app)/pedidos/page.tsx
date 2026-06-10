'use client'
import { useEffect, useState } from 'react'
import SearchSelect from '@/components/SearchSelect'

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
  const [vendedorNombre, setVendedorNombre] = useState('')
  const [items, setItems] = useState<PedidoItem[]>([{ ...ITEM_EMPTY }])
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
      fetch('/api/clientes'),
      fetch('/api/vendedores'),
    ])
    setPedidos(await pRes.json().catch(() => []))
    setProductos(await prRes.json().catch(() => []))
    setClientes(await cRes.json().catch(() => []))
    setVendedores(await vRes.json().catch(() => []))
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function seleccionarProducto(idx: number, prodId: string, prodLabel: string) {
    const prod = productos.find(p => p.id === prodId)
    const newItems = [...items]
    newItems[idx] = { producto_id: prodId, nombre: prodLabel, cantidad: newItems[idx].cantidad, precio_unitario: prod?.precio_venta || 0 }
    setItems(newItems)
    setStockChecked(false)
  }

  function updateItem(idx: number, field: string, value: number | string) {
    const newItems = [...items]
    ;(newItems[idx] as unknown as Record<string,number|string>)[field] = value
    setItems(newItems)
    setStockChecked(false)
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
        estado: 'pendiente', verificarStock: true,
        _dryRun: true,
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
    setClienteId(''); setClienteNombre(''); setVendedorNombre('')
    setItems([{ ...ITEM_EMPTY }]); setNotas(''); setFechaEntrega('')
    setStockStatus({}); setStockChecked(false); setModal(true)
  }

  const productosOpts = productos.map(p => ({ value: p.id, label: p.nombre, sublabel: p.bodega || '', badge: `Stock: ${p.stock}` }))
  const clientesOpts = clientes.map(c => ({ value: c.id, label: c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim(), sublabel: '' }))
  const pendientes = pedidos.filter(p => p.estado === 'pendiente')
  const entregados = pedidos.filter(p => p.estado === 'entregado')

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card"><div className="text-xs text-gray-400 mb-1">Pedidos pendientes</div><div className="text-2xl font-medium text-yellow-600">{pendientes.length}</div></div>
        <div className="card"><div className="text-xs text-gray-400 mb-1">Entregados este mes</div><div className="text-2xl font-medium text-green-600">{entregados.length}</div></div>
        <div className="card"><div className="text-xs text-gray-400 mb-1">Total pedidos</div><div className="text-2xl font-medium text-gray-800">{pedidos.length}</div></div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium text-gray-800">Pedidos pendientes</h1>
        <button onClick={abrirNuevo} className="btn btn-primary">+ Nuevo pedido</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">
            {['Número','Cliente','Vendedor','Productos','Fecha entrega','Estado',''].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">Cargando...</td></tr>
            : pedidos.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">No hay pedidos pendientes</td></tr>
            : pedidos.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.numero}</td>
                <td className="px-4 py-3 text-gray-600">{p.cliente_nombre}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.vendedor_nombre || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{(p.items as PedidoItem[]).length} items</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{p.fecha_entrega ? new Date(p.fecha_entrega + 'T12:00:00').toLocaleDateString('es-AR') : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${p.estado === 'pendiente' ? 'badge-yellow' : p.estado === 'entregado' ? 'badge-green' : 'badge-red'}`}>
                    {p.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setModalDetalle(p)} className="btn btn-primary text-xs py-1 px-2">👁</button>
                    {p.estado === 'pendiente' && <button onClick={() => cambiarEstado(p.id, 'entregado')} className="btn btn-primary text-xs py-1 px-2 text-green-600">✓</button>}
                    <button onClick={() => eliminar(p.id)} className="btn btn-danger text-xs py-1 px-2">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo pedido */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-2xl my-4">
            <h2 className="text-base font-medium text-gray-800 mb-4">Nuevo pedido</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="label">Cliente</label>
                <SearchSelect options={clientesOpts} value={clienteId} onChange={(v,l)=>{setClienteId(v);setClienteNombre(l)}} placeholder="Buscar cliente..." searchPlaceholder="Nombre, CUIT..." />
              </div>
              <div>
                <label className="label">Vendedor</label>
                <div className="flex gap-2 flex-wrap">
                  {vendedores.map(v=>(
                    <button key={v.id} onClick={()=>setVendedorNombre(v.nombre)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${vendedorNombre===v.nombre?'bg-gray-800 text-white border-gray-800':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {v.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <label className="label mb-0">Productos</label>
                <button onClick={()=>setItems([...items,{...ITEM_EMPTY}])} className="text-xs text-blue-600 hover:underline">+ agregar línea</button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const st = stockStatus[item.producto_id]
                  return (
                    <div key={idx} className={`border rounded-xl p-3 ${st ? (st.ok ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30') : 'border-gray-100'}`}>
                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <SearchSelect
                            options={productosOpts}
                            value={item.producto_id}
                            onChange={(v,l)=>seleccionarProducto(idx,v,l)}
                            placeholder="Buscar producto..."
                            searchPlaceholder="Nombre, bodega, varietal..."
                          />
                        </div>
                        <div className="w-20">
                          <input type="number" min="1" className="input text-center" value={item.cantidad}
                            onChange={e=>updateItem(idx,'cantidad',parseInt(e.target.value)||1)} placeholder="Cant." />
                        </div>
                        {items.length > 1 && (
                          <button onClick={()=>setItems(items.filter((_,i)=>i!==idx))} className="text-gray-300 hover:text-red-400 text-xl leading-none mt-2">×</button>
                        )}
                      </div>
                      {st && (
                        <div className={`text-xs mt-2 font-medium ${st.ok ? 'text-green-600' : 'text-red-600'}`}>
                          {st.ok ? `✓ Stock OK — ${st.disponible} disponibles` : `⚠ Stock insuficiente — ${st.disponible} disponibles, pedís ${st.pedido}`}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div><label className="label">Fecha de entrega estimada</label>
                <input type="date" className="input" value={fechaEntrega} onChange={e=>setFechaEntrega(e.target.value)} />
              </div>
              <div><label className="label">Notas</label>
                <input className="input" value={notas} onChange={e=>setNotas(e.target.value)} placeholder="Observaciones..." />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={verificarStock} className="px-4 py-2 rounded-lg border border-blue-200 text-blue-600 text-sm hover:bg-blue-50 transition-all">
                🔍 Verificar stock
              </button>
              <div className="flex gap-3">
                <button onClick={()=>setModal(false)} className="btn btn-primary">Cancelar</button>
                <button onClick={guardar} className="px-5 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700">
                  Guardar pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {modalDetalle && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setModalDetalle(null)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-lg">
            <h2 className="text-base font-medium text-gray-800 mb-4">Pedido {modalDetalle.numero}</h2>
            <div className="text-sm text-gray-500 mb-4 space-y-1">
              <div><strong>Cliente:</strong> {modalDetalle.cliente_nombre}</div>
              {modalDetalle.vendedor_nombre && <div><strong>Vendedor:</strong> {modalDetalle.vendedor_nombre}</div>}
              {modalDetalle.fecha_entrega && <div><strong>Entrega:</strong> {new Date(modalDetalle.fecha_entrega + 'T12:00:00').toLocaleDateString('es-AR')}</div>}
              {modalDetalle.notas && <div><strong>Notas:</strong> {modalDetalle.notas}</div>}
            </div>
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left py-2 text-xs text-gray-400">Producto</th>
                <th className="text-center py-2 text-xs text-gray-400">Cant.</th>
              </tr></thead>
              <tbody>
                {(modalDetalle.items as PedidoItem[]).map((item,i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-800">{item.nombre}</td>
                    <td className="py-2 text-center text-gray-600">{item.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end mt-4">
              <button onClick={()=>setModalDetalle(null)} className="btn btn-primary">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 right-6 bg-gray-800 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50">{toast}</div>}
    </div>
  )
}
