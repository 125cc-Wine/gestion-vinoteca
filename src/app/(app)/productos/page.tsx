'use client'
import { useEffect, useState } from 'react'
import type { Producto } from '@/types'
import ComboInput from '@/components/ComboInput'

const CATEGORIAS = ['Tinto', 'Blanco', 'Rosado', 'Espumante', 'Otro']

const VARIETALES = [
  'Malbec', 'Cabernet Sauvignon', 'Merlot', 'Syrah', 'Bonarda', 'Tempranillo',
  'Pinot Noir', 'Cabernet Franc', 'Petit Verdot', 'Tannat', 'Sangiovese',
  'Chardonnay', 'Torrontés', 'Sauvignon Blanc', 'Viognier', 'Riesling',
  'Pinot Gris', 'Semillón', 'Gewürztraminer', 'Moscatel',
  'Blend Tinto', 'Blend Blanco', 'Corte',
  'Vermouth', 'Gin', 'Whisky', 'Licor', 'Cerveza', 'Vodka', 'Pisco',
  'Fernet', 'Bitter', 'Espumoso',
]

const EMPTY: Omit<Producto, 'id' | 'created_at' | 'updated_at'> = {
  empresa: 'aroma',
  nombre: '', bodega: '', varietal: '',
  categoria: 'Tinto',
  region: '', sku: '',
  precio_venta: 0,
  precio_mayorista: 0,
  precio_costo: 0,
  stock: 0, stock_minimo: 3,
  woo_product_id: undefined,
  activo: true,
}

interface Bodega { id: string; nombre: string; empresa?: string }
interface Proveedor { id: string; nombre: string }

interface WooPreview {
  woo_product_id: number
  nombre: string
  sku: string
  bodega: string
  varietal: string
  region: string
  categoria: string
  precio_venta: number
  stock: number
  ya_importado: boolean
}

export default function ProductosPage() {
  const [empresa, setEmpresa] = useState<string>('aroma')
  const [productos, setProductos] = useState<Producto[]>([])
  const [bodegas, setBodegas] = useState<Bodega[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })
  const [editId, setEditId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [importModal, setImportModal] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importProductos, setImportProductos] = useState<WooPreview[]>([])
  const [importSeleccionados, setImportSeleccionados] = useState<Set<number>>(new Set())
  const [importando, setImportando] = useState(false)
  const [soloNuevos, setSoloNuevos] = useState(true)
  const [toast, setToast] = useState('')

  // Selección masiva
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [bulkCargando, setBulkCargando] = useState(false)
  const [bulkBodega, setBulkBodega] = useState('')
  const [bulkProveedor, setBulkProveedor] = useState('')
  const [bulkVarietal, setBulkVarietal] = useState('')
  const [bulkPct, setBulkPct] = useState('')
  const [bulkPrecio, setBulkPrecio] = useState('')

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e)
    cargar(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    const [pRes, bRes, prvRes] = await Promise.all([
      fetch(`/api/productos?empresa=${emp}`),
      fetch('/api/bodegas'),
      fetch(`/api/proveedores?empresa=${emp}`),
    ])
    setProductos(await pRes.json().catch(() => []))
    setBodegas(await bRes.json().catch(() => []))
    setProveedores(await prvRes.json().catch(() => []))
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 4000) }

  function abrirNuevo() {
    setForm({ ...EMPTY, empresa: empresa as 'aroma' | 'lavid' })
    setEditId(null)
    setModal(true)
  }

  function abrirEditar(p: Producto) {
    setForm({
      empresa: p.empresa, nombre: p.nombre, bodega: p.bodega || '', varietal: p.varietal || '',
      categoria: p.categoria, region: p.region || '', sku: p.sku || '',
      precio_venta: p.precio_venta,
      precio_mayorista: p.precio_mayorista || 0,
      precio_costo: p.precio_costo || 0,
      stock: p.stock, stock_minimo: p.stock_minimo,
      woo_product_id: p.woo_product_id,
      activo: p.activo,
    })
    setEditId(p.id!)
    setModal(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio'); return }
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { id: editId, ...form } : form
    const res = await fetch('/api/productos', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false)
    cargar(empresa)
    const wooMsg = data.woo_sync === 'ok' ? ' · WooCommerce actualizado ✓' : ''
    showToast(editId ? `Producto actualizado${wooMsg}` : 'Producto guardado')
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
    showToast(`Sync WooCommerce: ${data.ok} ok, ${data.errors} errores`)
  }

  async function abrirImport() {
    setImportModal(true)
    setImportLoading(true)
    setImportProductos([])
    setImportSeleccionados(new Set())
    try {
      const res = await fetch('/api/woo/sync')
      const text = await res.text()
      let data: { error?: string; productos?: WooPreview[] }
      try { data = JSON.parse(text) } catch { data = { error: `Respuesta inesperada del servidor (${res.status})` } }
      if (!res.ok || data.error) {
        showToast('Error: ' + (data.error ?? `HTTP ${res.status}`))
        setImportModal(false)
        return
      }
      const lista: WooPreview[] = data.productos || []
      setImportProductos(lista)
      setImportSeleccionados(new Set(lista.filter(p => !p.ya_importado).map(p => p.woo_product_id)))
    } catch {
      showToast('Error de red al conectar con WooCommerce')
      setImportModal(false)
    }
    setImportLoading(false)
  }

  function toggleSeleccionWoo(id: number) {
    setImportSeleccionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function seleccionarTodosNuevos() {
    setImportSeleccionados(new Set(importProductos.filter(p => !p.ya_importado).map(p => p.woo_product_id)))
  }

  async function importarSeleccionados() {
    const aImportar = importProductos.filter(p => importSeleccionados.has(p.woo_product_id) && !p.ya_importado)
    if (!aImportar.length) { showToast('No hay productos nuevos seleccionados'); return }
    setImportando(true)
    const res = await fetch('/api/woo/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productos: aImportar }),
    })
    const data = await res.json()
    setImportando(false)
    if (data.error) { showToast('Error: ' + data.error); return }
    setImportModal(false)
    cargar(empresa)
    showToast(`${data.imported} producto${data.imported !== 1 ? 's' : ''} importado${data.imported !== 1 ? 's' : ''} correctamente`)
  }

  // ── Selección masiva ──────────────────────────────────────────────────────

  function toggleSeleccionado(id: string) {
    setSeleccionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleTodos() {
    const todosIds = filtrados.map(p => p.id!)
    const todosChecked = todosIds.length > 0 && todosIds.every(id => seleccionados.has(id))
    setSeleccionados(todosChecked ? new Set() : new Set(todosIds))
  }

  async function ejecutarBulk(accion: string, valor: string | number) {
    if (!seleccionados.size) return
    if (accion === 'eliminar' && !confirm(`¿Eliminar ${seleccionados.size} producto${seleccionados.size !== 1 ? 's' : ''} en ambas empresas?`)) return
    setBulkCargando(true)
    const res = await fetch('/api/productos/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(seleccionados), accion, valor }),
    })
    const data = await res.json()
    setBulkCargando(false)
    if (data.error) { showToast('Error: ' + data.error); return }
    setSeleccionados(new Set())
    cargar(empresa)
    showToast(`${data.afectados} producto${data.afectados !== 1 ? 's' : ''} actualizados en ambas empresas`)
  }

  // ─────────────────────────────────────────────────────────────────────────

  const filtrados = productos.filter(p => {
    const q = busqueda.toLowerCase()
    const matchQ = !q || `${p.nombre}${p.bodega}${p.varietal}`.toLowerCase().includes(q)
    const matchC = !filtroCategoria || p.categoria === filtroCategoria
    return matchQ && matchC
  })

  const todosSeleccionados = filtrados.length > 0 && filtrados.every(p => seleccionados.has(p.id!))
  const algunoSeleccionado = filtrados.some(p => seleccionados.has(p.id!))

  const sinStock = productos.filter(p => p.stock === 0).length
  const stockBajo = productos.filter(p => p.stock > 0 && p.stock <= p.stock_minimo).length
  const totalUnidades = productos.reduce((a, p) => a + p.stock, 0)

  const valorPotencial = productos.reduce((a, p) => a + p.stock * (p.precio_venta || 0), 0)
  const capitalInmovilizado = productos.reduce((a, p) => {
    const pv = p.precio_venta || 0
    const costo = p.precio_costo && p.precio_costo > 0 ? p.precio_costo : pv * 0.5
    return a + p.stock * costo
  }, 0)
  const prodsSinCosto = productos.filter(p => !p.precio_costo || p.precio_costo === 0).length
  const margenBruto = valorPotencial - capitalInmovilizado
  const margenPct = valorPotencial > 0 ? Math.round((margenBruto / valorPotencial) * 100) : 0

  function badgeStock(p: Producto) {
    if (p.stock === 0) return <span className="badge badge-red">Sin stock</span>
    if (p.stock <= p.stock_minimo) return <span className="badge badge-yellow">Stock bajo</span>
    return <span className="badge badge-green">OK</span>
  }

  return (
    <div>
      {/* Métricas stock */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total productos', value: productos.length },
          { label: 'Unidades en stock', value: totalUnidades },
          { label: 'Stock bajo', value: stockBajo, color: 'text-amber-600' },
          { label: 'Sin stock', value: sinStock, color: 'text-red-500' },
        ].map(m => (
          <div key={m.label} className="card">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{m.label}</div>
            <div className={`text-2xl font-bold ${m.color || 'text-gray-900'}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Valuación del stock */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card border-l-4 border-l-blue-300">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Valor potencial</div>
          <div className="text-2xl font-bold text-blue-600">${valorPotencial.toLocaleString('es-AR')}</div>
          <div className="text-xs text-gray-400 mt-1">Si se vende todo a precio lista</div>
        </div>
        <div className="card border-l-4 border-l-amber-300">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Capital inmovilizado</div>
          <div className="text-2xl font-bold text-amber-600">${capitalInmovilizado.toLocaleString('es-AR')}</div>
          <div className="text-xs text-gray-400 mt-1">
            {prodsSinCosto > 0
              ? `${prodsSinCosto} prod. usan estimado 50% (sin costo cargado)`
              : 'Basado en precio costo cargado'}
          </div>
        </div>
        <div className="card border-l-4 border-l-emerald-300">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Margen bruto estimado</div>
          <div className="text-2xl font-bold text-emerald-600">${margenBruto.toLocaleString('es-AR')}</div>
          <div className="text-xs text-gray-400 mt-1">{margenPct}% sobre el valor potencial</div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">Productos</h1>
        <div className="flex gap-2">
          {empresa === 'aroma' && (
            <>
              <button onClick={abrirImport} className="btn btn-primary text-xs">
                ⬇️ Importar desde web
              </button>
              <button onClick={syncWoo} disabled={syncing} className="btn btn-primary text-xs">
                {syncing ? 'Sincronizando...' : '🔄 Sync precio/stock → web'}
              </button>
            </>
          )}
          <button onClick={abrirNuevo} className="btn btn-primary">+ Nuevo producto</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <input
          className="input flex-1"
          placeholder="Buscar por nombre, bodega, varietal..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <select
          className="input w-48"
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Barra de acciones masivas */}
      {seleccionados.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Contador */}
            <span className="text-sm font-semibold text-blue-800 shrink-0">
              ✓ {seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setSeleccionados(new Set())}
              className="text-xs text-blue-400 hover:text-blue-600 shrink-0 mr-2"
            >
              Limpiar
            </button>

            <div className="w-px h-5 bg-blue-200 shrink-0" />

            {/* Bodega */}
            <div className="flex items-center gap-1 shrink-0">
              <select
                className="input text-xs py-1 px-2 h-8 max-w-[160px]"
                value={bulkBodega}
                onChange={e => setBulkBodega(e.target.value)}
              >
                <option value="">Bodega...</option>
                {bodegas.map(b => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
              </select>
              <button
                disabled={!bulkBodega || bulkCargando}
                onClick={() => ejecutarBulk('bodega', bulkBodega)}
                className="btn btn-primary text-xs py-1 px-2 h-8 disabled:opacity-40"
              >
                Asignar
              </button>
            </div>

            {/* Proveedor */}
            <div className="flex items-center gap-1 shrink-0">
              <select
                className="input text-xs py-1 px-2 h-8 max-w-[160px]"
                value={bulkProveedor}
                onChange={e => setBulkProveedor(e.target.value)}
              >
                <option value="">Proveedor...</option>
                {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
              </select>
              <button
                disabled={!bulkProveedor || bulkCargando}
                onClick={() => ejecutarBulk('proveedor', bulkProveedor)}
                className="btn btn-primary text-xs py-1 px-2 h-8 disabled:opacity-40"
              >
                Asignar
              </button>
            </div>

            {/* Varietal */}
            <div className="flex items-center gap-1 shrink-0">
              <input
                className="input text-xs py-1 px-2 h-8 w-32"
                placeholder="Varietal..."
                value={bulkVarietal}
                onChange={e => setBulkVarietal(e.target.value)}
              />
              <button
                disabled={!bulkVarietal.trim() || bulkCargando}
                onClick={() => { ejecutarBulk('varietal', bulkVarietal); setBulkVarietal('') }}
                className="btn btn-primary text-xs py-1 px-2 h-8 disabled:opacity-40"
              >
                Asignar
              </button>
            </div>

            <div className="w-px h-5 bg-blue-200 shrink-0" />

            {/* Aumento % */}
            <div className="flex items-center gap-1 shrink-0">
              <input
                className="input text-xs py-1 px-2 h-8 w-20"
                type="number"
                placeholder="% aum."
                value={bulkPct}
                onChange={e => setBulkPct(e.target.value)}
              />
              <button
                disabled={!bulkPct || bulkCargando}
                onClick={() => { ejecutarBulk('aumento_precio', Number(bulkPct)); setBulkPct('') }}
                className="btn btn-primary text-xs py-1 px-2 h-8 disabled:opacity-40"
              >
                Aumentar %
              </button>
            </div>

            {/* Precio fijo */}
            <div className="flex items-center gap-1 shrink-0">
              <input
                className="input text-xs py-1 px-2 h-8 w-24"
                type="number"
                placeholder="$ precio"
                value={bulkPrecio}
                onChange={e => setBulkPrecio(e.target.value)}
              />
              <button
                disabled={!bulkPrecio || bulkCargando}
                onClick={() => { ejecutarBulk('precio_fijo', Number(bulkPrecio)); setBulkPrecio('') }}
                className="btn btn-primary text-xs py-1 px-2 h-8 disabled:opacity-40"
              >
                Fijar precio
              </button>
            </div>

            <div className="w-px h-5 bg-blue-200 shrink-0" />

            {/* Eliminar */}
            <button
              disabled={bulkCargando}
              onClick={() => ejecutarBulk('eliminar', '')}
              className="btn btn-danger text-xs py-1 px-3 h-8 disabled:opacity-40 shrink-0"
            >
              🗑 Eliminar seleccionados
            </button>

            {bulkCargando && (
              <span className="text-xs text-blue-500 italic">Aplicando...</span>
            )}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  ref={el => { if (el) el.indeterminate = !todosSeleccionados && algunoSeleccionado }}
                  onChange={toggleTodos}
                  className="rounded cursor-pointer"
                />
              </th>
              {['Producto', 'Bodega', 'Varietal', 'Categoría', 'Precio venta', 'Precio mayor.', 'Costo', 'Stock', 'Val. stock', 'Estado', 'WooID', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13} className="text-center py-12 text-gray-400">Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={13} className="text-center py-12 text-gray-400">No hay productos todavía</td></tr>
            ) : filtrados.map(p => (
              <tr
                key={p.id}
                className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors ${seleccionados.has(p.id!) ? 'bg-blue-50/50' : ''}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={seleccionados.has(p.id!)}
                    onChange={() => toggleSeleccionado(p.id!)}
                    className="rounded cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-800">{p.nombre}</div>
                  {p.region && <div className="text-xs text-gray-400">{p.region}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.bodega || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{p.varietal || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{p.categoria}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">
                  ${(p.precio_venta || 0).toLocaleString('es-AR')}
                </td>
                <td className="px-4 py-3 text-blue-600 text-xs font-medium">
                  {p.precio_mayorista ? `$${p.precio_mayorista.toLocaleString('es-AR')}` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  ${(p.precio_costo || 0).toLocaleString('es-AR')}
                </td>
                <td className="px-4 py-3 text-gray-700 font-medium">{p.stock}</td>
                <td className="px-4 py-3 text-xs">
                  <div className="text-blue-600 font-medium">${(p.stock * (p.precio_venta || 0)).toLocaleString('es-AR')}</div>
                  <div className="text-gray-400">${(p.stock * (p.precio_costo && p.precio_costo > 0 ? p.precio_costo : (p.precio_venta || 0) * 0.5)).toLocaleString('es-AR')} costo</div>
                </td>
                <td className="px-4 py-3">{badgeStock(p)}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{p.woo_product_id || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => abrirEditar(p)} className="btn btn-primary text-xs py-1 px-2">✏️</button>
                    <button onClick={() => eliminar(p.id!)} className="btn btn-danger text-xs py-1 px-2">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal edición */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setModal(false)}
        >
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-5">
              {editId ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Nombre del vino *</label>
                <input className="input" value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Gran Reserva Malbec" />
              </div>
              <div>
                <label className="label">Bodega</label>
                <ComboInput
                  value={form.bodega}
                  onChange={v => setForm(f => ({ ...f, bodega: v }))}
                  options={bodegas.map(b => b.nombre)}
                  placeholder="Escribir o elegir bodega..."
                />
              </div>
              <div>
                <label className="label">Varietal / Tipo</label>
                <ComboInput
                  value={form.varietal}
                  onChange={v => setForm(f => ({ ...f, varietal: v }))}
                  options={VARIETALES}
                  placeholder="Ej: Malbec, Gin, Fernet..."
                />
              </div>
              <div>
                <label className="label">Categoría</label>
                <select className="input" value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value as Producto['categoria'] }))}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Región</label>
                <input className="input" value={form.region}
                  onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                  placeholder="Ej: Mendoza" />
              </div>
              <div>
                <label className="label">SKU / Código</label>
                <input className="input" value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  placeholder="Ej: MAL-CAT-21" />
              </div>
              <div>
                <label className="label">Precio de venta ($)</label>
                <input className="input" type="number" min="0" value={form.precio_venta}
                  onChange={e => setForm(f => ({ ...f, precio_venta: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="label">Precio mayorista ($)</label>
                <input className="input" type="number" min="0" value={form.precio_mayorista || ''}
                  onChange={e => setForm(f => ({ ...f, precio_mayorista: parseFloat(e.target.value) || 0 }))}
                  placeholder="Dejar en 0 si no aplica" />
              </div>
              <div>
                <label className="label">Precio de costo ($)</label>
                <input className="input" type="number" min="0" value={form.precio_costo}
                  onChange={e => setForm(f => ({ ...f, precio_costo: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="label">Stock actual</label>
                <input className="input" type="number" min="0" value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="label">Stock mínimo (alerta)</label>
                <input className="input" type="number" min="0" value={form.stock_minimo}
                  onChange={e => setForm(f => ({ ...f, stock_minimo: parseInt(e.target.value) || 0 }))} />
              </div>
              {empresa === 'aroma' && (
                <div className="col-span-2">
                  <label className="label">ID producto en WooCommerce</label>
                  <input className="input" type="number"
                    value={form.woo_product_id || ''}
                    onChange={e => setForm(f => ({ ...f, woo_product_id: parseInt(e.target.value) || undefined }))}
                    placeholder="Dejar vacío si no está en la web" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setModal(false)} className="btn btn-primary">Cancelar</button>
              <button
                onClick={guardar}
                className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 shadow-sm"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal importar desde WooCommerce */}
      {importModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setImportModal(false)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">

            <div className="flex items-start justify-between mb-4 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">Importar desde WooCommerce</h2>
                {!importLoading && (
                  <p className="text-sm text-gray-400 mt-0.5">
                    {importProductos.length} productos en la web ·{' '}
                    <span className="text-emerald-600 font-medium">
                      {importProductos.filter(p => !p.ya_importado).length} nuevos
                    </span>
                    {' · '}
                    <span className="text-gray-400">
                      {importProductos.filter(p => p.ya_importado).length} ya importados
                    </span>
                  </p>
                )}
              </div>
              <button onClick={() => setImportModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {importLoading ? (
              <div className="flex-1 flex items-center justify-center py-16 text-gray-400">
                Cargando productos desde la web...
              </div>
            ) : (
              <>
                <div className="flex gap-4 mb-3 flex-shrink-0 items-center">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={soloNuevos} onChange={e => setSoloNuevos(e.target.checked)} className="rounded" />
                    Solo mostrar nuevos
                  </label>
                  <button onClick={seleccionarTodosNuevos} className="text-xs text-blue-600 hover:underline">
                    Seleccionar todos los nuevos
                  </button>
                  <button
                    onClick={() => setImportSeleccionados(new Set())}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Deseleccionar todo
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white border-b border-gray-100">
                      <tr>
                        {['', 'Nombre', 'Bodega', 'Varietal', 'Categoría', 'Precio', 'Stock', 'Estado'].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 text-xs text-gray-400 font-semibold uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importProductos
                        .filter(p => !soloNuevos || !p.ya_importado)
                        .map(p => (
                          <tr
                            key={p.woo_product_id}
                            className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors ${p.ya_importado ? 'opacity-50' : ''}`}
                          >
                            <td className="px-3 py-2.5">
                              <input
                                type="checkbox"
                                disabled={p.ya_importado}
                                checked={importSeleccionados.has(p.woo_product_id)}
                                onChange={() => toggleSeleccionWoo(p.woo_product_id)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[200px]">
                              <div className="truncate">{p.nombre}</div>
                              {p.sku && <div className="text-xs text-gray-400">{p.sku}</div>}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 text-xs">{p.bodega || <span className="text-gray-300">—</span>}</td>
                            <td className="px-3 py-2.5 text-gray-600 text-xs">{p.varietal || <span className="text-gray-300">—</span>}</td>
                            <td className="px-3 py-2.5">
                              <span className="badge badge-gray text-xs">{p.categoria}</span>
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-gray-800 text-xs">
                              {p.precio_venta > 0 ? `$${(p.precio_venta || 0).toLocaleString('es-AR')}` : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-gray-500 text-xs">{p.stock}</td>
                            <td className="px-3 py-2.5">
                              {p.ya_importado
                                ? <span className="badge badge-gray text-xs">Ya importado</span>
                                : <span className="badge badge-green text-xs">Nuevo</span>}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center mt-4 flex-shrink-0">
                  <span className="text-sm text-gray-500">
                    {importSeleccionados.size} producto{importSeleccionados.size !== 1 ? 's' : ''} seleccionado{importSeleccionados.size !== 1 ? 's' : ''}
                  </span>
                  <div className="flex gap-3">
                    <button onClick={() => setImportModal(false)} className="btn btn-primary">Cancelar</button>
                    <button
                      onClick={importarSeleccionados}
                      disabled={importando || importSeleccionados.size === 0}
                      className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 shadow-sm disabled:opacity-50"
                    >
                      {importando ? 'Importando...' : `Importar ${importSeleccionados.size} productos`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
