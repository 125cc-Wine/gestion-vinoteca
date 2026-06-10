'use client'
import { useEffect, useState } from 'react'

interface Bodega {
  id: string
  nombre: string
  proveedor_nombre?: string
  region?: string
  pais?: string
  notas?: string
  activo: boolean
}

interface Proveedor {
  id: string
  nombre: string
}

const EMPTY = { nombre: '', proveedor_nombre: '', region: '', pais: 'Argentina', notas: '' }

export default function BodegasPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [bodegas, setBodegas] = useState<Bodega[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })
  const [editId, setEditId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e)
    cargar(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    const [bRes, pRes] = await Promise.all([
      fetch('/api/bodegas'),
      fetch(`/api/proveedores?empresa=${emp}`),
    ])
    setBodegas(await bRes.json().catch(() => []))
    setProveedores(await pRes.json().catch(() => []))
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function abrirNuevo() { setForm({ ...EMPTY }); setEditId(null); setModal(true) }

  function abrirEditar(b: Bodega) {
    setForm({ nombre: b.nombre, proveedor_nombre: b.proveedor_nombre || '', region: b.region || '', pais: b.pais || 'Argentina', notas: b.notas || '' })
    setEditId(b.id); setModal(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio'); return }
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { id: editId, ...form } : form
    const res = await fetch('/api/bodegas', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false); cargar(empresa)
    showToast(editId ? 'Bodega actualizada' : 'Bodega guardada')
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta bodega?')) return
    await fetch(`/api/bodegas?id=${id}`, { method: 'DELETE' })
    cargar(empresa); showToast('Bodega eliminada')
  }

  const filtradas = bodegas.filter(b => {
    const q = busqueda.toLowerCase()
    return !q || `${b.nombre} ${b.proveedor_nombre || ''} ${b.region || ''}`.toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium text-gray-800">Bodegas</h1>
        <button onClick={abrirNuevo} className="btn btn-primary">+ Nueva bodega</button>
      </div>

      <input className="input mb-4" placeholder="Buscar por nombre, proveedor, región..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">
            {['Bodega','Proveedor','Región','País',''].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-12 text-gray-400">Cargando...</td></tr>
            : filtradas.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-gray-400">No hay bodegas todavía</td></tr>
            : filtradas.map(b => (
              <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{b.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{b.proveedor_nombre || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{b.region || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{b.pais || '—'}</td>
                <td className="px-4 py-3"><div className="flex gap-2">
                  <button onClick={() => abrirEditar(b)} className="btn btn-primary text-xs py-1 px-2">✏️</button>
                  <button onClick={() => eliminar(b.id)} className="btn btn-danger text-xs py-1 px-2">🗑</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-md">
            <h2 className="text-base font-medium text-gray-800 mb-5">{editId ? 'Editar bodega' : 'Nueva bodega'}</h2>
            <div className="space-y-3">
              <div><label className="label">Nombre de la bodega *</label>
                <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Alta Vista" />
              </div>
              <div><label className="label">Proveedor / Distribuidor</label>
                <select className="input" value={form.proveedor_nombre} onChange={e => setForm(f => ({ ...f, proveedor_nombre: e.target.value }))}>
                  <option value="">— Sin proveedor asignado —</option>
                  {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Región</label>
                  <input className="input" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} placeholder="Ej: Mendoza" />
                </div>
                <div><label className="label">País</label>
                  <input className="input" value={form.pais} onChange={e => setForm(f => ({ ...f, pais: e.target.value }))} />
                </div>
              </div>
              <div><label className="label">Notas</label>
                <textarea className="input h-16 resize-none" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
              </div>
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
