'use client'
import { useEffect, useState } from 'react'
import type { MovimientoCaja, MedioPago } from '@/types'

const MEDIOS_PAGO: MedioPago[] = [
  'Efectivo', 'Tarjeta Débito', 'Tarjeta Crédito', 'QR', 'MercadoPago', 'Transferencia', 'Cta.Cte.',
]
const CATEGORIAS = ['Ventas', 'Compras', 'Gastos', 'Sueldos', 'Impuestos', 'Otros']

const FORM_EMPTY = {
  tipo: 'ingreso' as 'ingreso' | 'egreso',
  concepto: '',
  monto: 0,
  fecha: new Date().toISOString().split('T')[0],
  categoria: 'Ventas',
  medio_pago: 'Efectivo' as MedioPago,
}

export default function CajaPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([])
  const [loading, setLoading] = useState(true)

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ ...FORM_EMPTY })

  const [cierreModal, setCierreModal] = useState(false)
  const [fechaCierre, setFechaCierre] = useState(new Date().toISOString().split('T')[0])

  const [toast, setToast] = useState('')

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e)
    cargar(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    const res = await fetch(`/api/caja?empresa=${emp}`)
    const data = await res.json()
    setMovimientos(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function guardar() {
    if (!form.concepto.trim()) { showToast('El concepto es obligatorio'); return }
    if (!form.monto || form.monto <= 0) { showToast('Ingresá un monto válido'); return }
    const res = await fetch('/api/caja', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, empresa }),
    })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false)
    cargar(empresa)
    showToast('Movimiento registrado')
    setForm({ ...FORM_EMPTY, fecha: new Date().toISOString().split('T')[0] })
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este movimiento?')) return
    await fetch(`/api/caja?id=${id}`, { method: 'DELETE' })
    cargar(empresa)
    showToast('Movimiento eliminado')
  }

  const totalIngresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0)
  const totalEgresos = movimientos.filter(m => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0)
  const saldo = totalIngresos - totalEgresos

  const movsCierre = movimientos.filter(m => m.fecha === fechaCierre)
  const cierreData = MEDIOS_PAGO.map(mp => {
    const movsMp = movsCierre.filter(m => m.medio_pago === mp)
    const ingresos = movsMp.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0)
    const egresos = movsMp.filter(m => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0)
    return { mp, ingresos, egresos, neto: ingresos - egresos }
  }).filter(x => x.ingresos > 0 || x.egresos > 0)

  const totalNetoCierre = movsCierre
    .reduce((a, m) => a + (m.tipo === 'ingreso' ? m.monto : -m.monto), 0)

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card border-l-4 border-l-emerald-400">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total ingresos</div>
          <div className="text-2xl font-bold text-emerald-600">${totalIngresos.toLocaleString('es-AR')}</div>
        </div>
        <div className="card border-l-4 border-l-red-400">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total egresos</div>
          <div className="text-2xl font-bold text-red-500">${totalEgresos.toLocaleString('es-AR')}</div>
        </div>
        <div className={`card border-l-4 ${saldo >= 0 ? 'border-l-blue-400' : 'border-l-red-500'}`}>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Saldo neto</div>
          <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
            ${saldo.toLocaleString('es-AR')}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">Caja y flujo de fondos</h1>
        <div className="flex gap-2">
          <button onClick={() => setCierreModal(true)} className="btn btn-primary">
            📊 Cierre de caja
          </button>
          <button onClick={() => setModal(true)} className="btn btn-primary">
            + Nuevo movimiento
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Fecha', 'Tipo', 'Concepto', 'Categoría', 'Medio de pago', 'Monto', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Cargando...</td></tr>
            ) : movimientos.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No hay movimientos todavía</td></tr>
            ) : movimientos.map(m => (
              <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-xs font-medium">{m.fecha}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${m.tipo === 'ingreso' ? 'badge-green' : 'badge-red'}`}>
                    {m.tipo}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{m.concepto}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{m.categoria || '—'}</td>
                <td className="px-4 py-3">
                  {m.medio_pago ? (
                    <span className="badge badge-gray text-xs">{m.medio_pago}</span>
                  ) : '—'}
                </td>
                <td className={`px-4 py-3 font-semibold ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString('es-AR')}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => eliminar(m.id!)} className="btn btn-danger text-xs py-1 px-2">🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo movimiento */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setModal(false)}
        >
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-md shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-5">Nuevo movimiento</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'ingreso' | 'egreso' }))}>
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div>
                <label className="label">Fecha</label>
                <input type="date" className="input" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Concepto *</label>
                <input className="input" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} placeholder="Descripción del movimiento" />
              </div>
              <div>
                <label className="label">Categoría</label>
                <select className="input" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Medio de pago</label>
                <select className="input" value={form.medio_pago} onChange={e => setForm(f => ({ ...f, medio_pago: e.target.value as MedioPago }))}>
                  {MEDIOS_PAGO.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Monto ($) *</label>
                <input type="number" min="0" className="input" value={form.monto || ''} onChange={e => setForm(f => ({ ...f, monto: parseFloat(e.target.value) || 0 }))} />
              </div>
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

      {/* Modal cierre de caja por medio de pago */}
      {cierreModal && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setCierreModal(false)}
        >
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">Cierre de caja</h2>
            <div className="mb-5">
              <label className="label">Fecha</label>
              <input type="date" className="input" value={fechaCierre} onChange={e => setFechaCierre(e.target.value)} />
            </div>

            {cierreData.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No hay movimientos para esta fecha
              </div>
            ) : (
              <div className="space-y-0 mb-4 border border-gray-100 rounded-xl overflow-hidden">
                {cierreData.map(item => (
                  <div key={item.mp} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                    <span className="text-sm font-semibold text-gray-700">{item.mp}</span>
                    <div className="text-right">
                      {item.ingresos > 0 && (
                        <div className="text-xs text-emerald-600 font-medium">
                          +${item.ingresos.toLocaleString('es-AR')}
                        </div>
                      )}
                      {item.egresos > 0 && (
                        <div className="text-xs text-red-500 font-medium">
                          -${item.egresos.toLocaleString('es-AR')}
                        </div>
                      )}
                      <div className={`text-sm font-bold ${item.neto >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                        ${item.neto.toLocaleString('es-AR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cierreData.length > 0 && (
              <div className="flex items-center justify-between py-3 px-1 border-t border-gray-200 mb-4">
                <span className="text-sm font-bold text-gray-900">TOTAL NETO</span>
                <span className={`text-xl font-bold ${totalNetoCierre >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${totalNetoCierre.toLocaleString('es-AR')}
                </span>
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={() => setCierreModal(false)} className="btn btn-primary">Cerrar</button>
            </div>
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
