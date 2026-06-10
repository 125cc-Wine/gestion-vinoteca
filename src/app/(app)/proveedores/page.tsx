'use client'
import { useEffect, useState } from 'react'
import type { Proveedor } from '@/types'

const EMPTY: Omit<Proveedor, 'id' | 'created_at'> = {
  empresa: 'aroma', nombre: '', razon_social: '', cuit: '', email: '', telefono: '', direccion: '', contacto: '', saldo: 0, notas: '', activo: true,
}

export default function ProveedoresPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })
  const [editId, setEditId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e); cargar(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    const res = await fetch(`/api/proveedores?empresa=${emp}`)
    const data = await res.json()
    setProveedores(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function abrirNuevo() { setForm({ ...EMPTY, empresa: empresa as 'aroma' | 'lavid' }); setEditId(null); setModal(true) }

  function abrirEditar(p: Proveedor) {
    setForm({ empresa: p.empresa, nombre: p.nombre, razon_social: p.razon_social || '', cuit: p.cuit || '', email: p.email || '', telefono: p.telefono || '', direccion: p.direccion || '', contacto: p.contacto || '', saldo: p.saldo, notas: p.notas || '', activo: p.activo })
    setEditId(p.id!); setModal(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio'); return }
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { id: editId, ...form } : form
    const res = await fetch('/api/proveedores', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
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

  const saldoTotal = proveedores.reduce((a, p) => a + p.saldo, 0)

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card"><div className="text-xs text-gray-400 mb-1">Total proveedores</div><div className="text-2xl font-medium text-gray-800">{proveedores.length}</div></div>
        <div className="card col-span-2"><div className="text-xs text-gray-400 mb-1">Saldo total a pagar</div><div className={`text-2xl font-medium ${saldoTotal < 0 ? 'text-red-500' : 'text-gray-800'}`}>${saldoTotal.toLocaleString('es-AR')}</div></div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium text-gray-800">Proveedores</h1>
        <button onClick={abrirNuevo} className="btn btn-primary">+ Nuevo proveedor</button>
      </div>

      <input className="input mb-4" placeholder="Buscar por nombre, CUIT..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Proveedor', 'CUIT', 'Contacto', 'Teléfono', 'Saldo', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No hay proveedores todavía</td></tr>
            ) : filtrados.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3"><div className="font-medium text-gray-800">{p.nombre}</div>{p.razon_social && <div className="text-xs text-gray-400">{p.razon_social}</div>}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.cuit || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.contacto || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.telefono || '—'}</td>
                <td className="px-4 py-3 font-medium"><span className={p.saldo < 0 ? 'text-red-500' : 'text-gray-700'}>${p.saldo.toLocaleString('es-AR')}</span></td>
                <td className="px-4 py-3"><div className="flex gap-2">
                  <button onClick={() => abrirEditar(p)} className="btn btn-primary text-xs py-1 px-2">✏️</button>
                  <button onClick={() => eliminar(p.id!)} className="btn btn-danger text-xs py-1 px-2">🗑</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-medium text-gray-800 mb-5">{editId ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Nombre *</label><input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></div>
              <div className="col-span-2"><label className="label">Razón social</label><input className="input" value={form.razon_social} onChange={e => setForm(f => ({ ...f, razon_social: e.target.value }))} /></div>
              <div><label className="label">CUIT</label><input className="input" value={form.cuit} onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))} /></div>
              <div><label className="label">Contacto</label><input className="input" value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))} /></div>
              <div><label className="label">Teléfono</label><input className="input" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} /></div>
              <div><label className="label">Email</label><input className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="col-span-2"><label className="label">Dirección</label><input className="input" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} /></div>
              <div className="col-span-2"><label className="label">Saldo (negativo = deuda)</label><input className="input" type="number" value={form.saldo} onChange={e => setForm(f => ({ ...f, saldo: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="col-span-2"><label className="label">Notas</label><textarea className="input h-20 resize-none" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} /></div>
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
