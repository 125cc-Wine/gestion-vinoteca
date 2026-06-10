'use client'
import { useEffect, useState } from 'react'
import type { Producto } from '@/types'

const CATEGORIAS = ['Tinto', 'Blanco', 'Rosado', 'Espumante', 'Otro']

const EMPTY = {
  empresa: 'aroma' as 'aroma' | 'lavid',
  nombre: '', bodega: '', varietal: '', categoria: 'Tinto' as Producto['categoria'],
  region: '', sku: '', proveedor_nombre: '',
  precio_venta: 0, precio_costo: 0, stock: 0, stock_minimo: 3,
  woo_product_id: undefined as number | undefined, activo: true,
}

export default function ProductosPage() {
  const [empresa, setEmpresa] = useState<string>('aroma')
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })
  const [editId, setEditId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e)
    cargar(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    const res = await fetch(`/api/productos?empresa=${emp}`)
    const data = await res.json()
    setProductos(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function abrirNuevo() {
    setForm({ ...EMPTY, empresa: empresa as 'aroma' | 'lavid' })
    setEditId(null)
    setModal(true)
  }

  function abrirEditar(p: Producto) {
    setForm({
      empresa: p.empresa,
      nombre: p.nombre, bodega: p.bodega || '', varietal: p.varietal || '',
      categoria: p.categoria, region: p.region || '', sku: p.sku || '',
      proveedor_nombre: (p as unknown as Record<string,string>).proveedor_nombre || '',
      precio_venta: p.precio_venta, precio_costo: p.precio_costo || 0,
      stock: p.stock, stock_minimo: p.stock_minimo,
      woo_product_id: p.woo_product_id, activo: p.activo,
    })
    setEditId(p.id!)
    setModal(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio'); return }
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { id: editId, ...form } : form
    const res = await fetch('/api/productos', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false)
    cargar(empresa)
    showToast(editId ? 'Producto actualizado' : 'Producto guardado')
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    await fetch(`/api/productos?id=${id}`, { method: 'DELETE' })
    cargar(empresa)
    showToast('Producto eliminado')
  }

  async function syncWoo() {
    setSyncing(true)
    const res = await fetch('/api/woo/sync', { method: 'POST' })
    const data = await res.json()
    setSyncing(false)
    showToast(`Sync WooCommerce: ${data.ok ?? 0} ok, ${data.errors ?? 0} errores`)
  }

  const filtrados = productos.filter(p => {
    const q = busqueda.toLowerCase()
    const matchQ = !q || `${p.nombre}${p.bodega}${p.varietal}`.toLowerCase().includes(q)
    const matchC = !filtroCategoria || p.categoria === filtroCategoria
    return matchQ && matchC
  })

  const sinStock = productos.filter(p => p.stock === 0).length
  const stockBajo = productos.filter(p => p.stock > 0 && p.stock <= p.stock_minimo).length
  const totalUnidades = productos.reduce((a, p) => a + p.stock, 0)

  function badgeStock(p: Producto) {
    if (p.stock === 0) return <span className="badge badge-red">Sin stock</span>
    if (p.stock <= p.stock_minimo) return <span className="badge badge-yellow">Stock bajo</span>
    return <span className="badge badge-green">OK</span>
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total productos', value: productos.length },
          { label: 'Unidades en stock', value: totalUnidades },
          { label: 'Stock bajo', value: stockBajo, color: 'text-yellow-600' },
          { label: 'Sin stock', value: sinStock, color: 'text-red-500' },
        ].map(m => (
          <div key={m.label} className="card">
            <div className="text-xs text-gray-400 mb-1">{m.label}</div>
            <div className={`text-2xl font-medium ${m.color || 'text-gray-800'}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium text-gray-800">Productos</h1>
        <div className="flex gap-2">
          {empresa === 'aroma' && (
            <button onClick={syncWoo} disabled={syncing} className="btn btn-primary text-xs">
              {syncing ? 'Sincronizando...' : '🔄 Sync WooCommerce'}
            </button>
          )}
          <button onClick={abrirNuevo} className="btn btn-primary">+ Nuevo producto</button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input className="input flex-1" placeholder="Buscar por nombre, bodega, varietal..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <select className="input w-48" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Producto','Bodega','Varietal','Categoría','Proveedor','Precio venta','Costo','Stock','Estado','WooID',''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="text-center py-12 text-gray-400">Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={11} className="text-center py-12 text-gray-400">No hay productos todavía</td></tr>
            ) : filtrados.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{p.nombre}</div>
                  {p.region && <div className="text-xs text-gray-400">{p.region}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.bodega || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{p.varietal || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{p.categoria}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{(p as unknown as Record<string,string>).proveedor_nombre || '—'}</td>
                <td className="px-4 py-3 text-gray-800 font-medium">${p.precio_venta.toLocaleString('es-AR')}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">${(p.precio_costo || 0).toLocaleString('es-AR')}</td>
                <td className="px-4 py-3 text-gray-700">{p.stock}</td>
                <td className="px-4 py-3">{badgeStock(p)}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{p.woo_product_id || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => abrirEditar(p)} className="btn btn-primary text-xs py-1 px-2">✏️</button>
                    <button onClick={() => eliminar(p.id!)} className="btn btn-danger text-xs py-1 px-2">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-medium text-gray-800 mb-5">{editId ? 'Editar producto' : 'Nuevo producto'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Nombre del vino *</label>
                <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Gran Reserva Malbec" />
              </div>
              <div>
                <label className="label">Bodega</label>
                <input className="input" value={form.bodega} onChange={e => setForm(f => ({ ...f, bodega: e.target.value }))} placeholder="Ej: Catena Zapata" />
              </div>
              <div>
                <label className="label">Varietal</label>
                <input className="input" value={form.varietal} onChange={e => setForm(f => ({ ...f, varietal: e.target.value }))} placeholder="Ej: Malbec" />
              </div>
              <div>
                <label className="label">Categoría</label>
                <select className="input" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as Producto['categoria'] }))}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Región</label>
                <input className="input" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} placeholder="Ej: Mendoza" />
              </div>
              <div>
                <label className="label">Proveedor</label>
                <input className="input" value={form.proveedor_nombre} onChange={e => setForm(f => ({ ...f, proveedor_nombre: e.target.value }))} placeholder="Ej: Distribuidora XYZ" />
              </div>
              <div>
                <label className="label">SKU / Código</label>
                <input className="input" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Ej: MAL-CAT-21" />
              </div>
              <div>
                <label className="label">Precio de venta ($)</label>
                <input className="input" type="number" min="0" value={form.precio_venta} onChange={e => setForm(f => ({ ...f, precio_venta: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="label">Precio de costo ($)</label>
                <input className="input" type="number" min="0" value={form.precio_costo} onChange={e => setForm(f => ({ ...f, precio_costo: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="label">Stock actual</label>
                <input className="input" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="label">Stock mínimo (alerta)</label>
                <input className="input" type="number" min="0" value={form.stock_minimo} onChange={e => setForm(f => ({ ...f, stock_minimo: parseInt(e.target.value) || 0 }))} />
              </div>
              {empresa === 'aroma' && (
                <div className="col-span-2">
                  <label className="label">ID producto en WooCommerce</label>
                  <input className="input" type="number" value={form.woo_product_id || ''} onChange={e => setForm(f => ({ ...f, woo_product_id: parseInt(e.target.value) || undefined }))} placeholder="Dejar vacío si no está en la web" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setModal(false)} className="btn btn-primary">Cancelar</button>
              <button onClick={guardar} className="px-5 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 right-6 bg-gray-800 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50">{toast}</div>}
    </div>
  )
}
