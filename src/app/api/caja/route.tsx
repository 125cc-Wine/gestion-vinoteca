'use client'
import { useEffect, useState } from 'react'

interface Movimiento {
  id: string
  empresa: string
  tipo: 'ingreso' | 'egreso'
  concepto: string
  monto: number
  fecha: string
  categoria?: string
  created_at: string
}

interface CierreCaja {
  fecha: string
  saldo_inicial: number
  total_ingresos: number
  total_egresos: number
  saldo_final: number
  movimientos: number
}

const CATEGORIAS_INGRESO = ['Ventas - Contado','Ventas - Tarjeta Débito','Ventas - Tarjeta Crédito','Ventas - QR','Ventas - MercadoPago','Ventas - Transferencia','Ventas - Cta. Cte.','Cobro cuenta corriente','Otro ingreso']
const CATEGORIAS_EGRESO = ['Compra mercadería','Gastos operativos','Sueldos','Servicios','Impuestos','Retiro de caja','Otro egreso']

export default function CajaPage() {
  const [empresa, setEmpresa] = useState<string>('aroma')
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [modalCierre, setModalCierre] = useState(false)
  const [modalApertura, setModalApertura] = useState(false)
  const [tipoMov, setTipoMov] = useState<'ingreso' | 'egreso'>('ingreso')
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [fechaMov, setFechaMov] = useState(new Date().toISOString().split('T')[0])
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0])
  const [saldoApertura, setSaldoApertura] = useState('')
  const [cierreCaja, setCierreCaja] = useState<CierreCaja | null>(null)
  const [toast, setToast] = useState('')
  const [vista, setVista] = useState<'dia' | 'mes'>('dia')

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e)
    cargar(e, fechaFiltro)
  }, [])

  async function cargar(emp: string, fecha: string) {
    setLoading(true)
    let url = `/api/caja?empresa=${emp}`
    if (vista === 'dia') url += `&fecha=${fecha}`
    else {
      const [y, m] = fecha.split('-')
      url += `&desde=${y}-${m}-01&hasta=${y}-${m}-31`
    }
    const res = await fetch(url)
    const data = await res.json()
    setMovimientos(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function guardarMovimiento() {
    if (!concepto.trim()) { showToast('El concepto es obligatorio'); return }
    if (!monto || parseFloat(monto) <= 0) { showToast('El monto debe ser mayor a 0'); return }

    const res = await fetch('/api/caja', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa, tipo: tipoMov, concepto, monto: parseFloat(monto),
        fecha: fechaMov, categoria,
      }),
    })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false)
    setConcepto(''); setMonto(''); setCategoria('')
    cargar(empresa, fechaFiltro)
    showToast(`${tipoMov === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado`)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este movimiento?')) return
    await fetch(`/api/caja?id=${id}`, { method: 'DELETE' })
    cargar(empresa, fechaFiltro)
    showToast('Movimiento eliminado')
  }

  async function registrarApertura() {
    if (!saldoApertura) { showToast('Ingresá el saldo inicial'); return }
    await fetch('/api/caja', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa, tipo: 'ingreso',
        concepto: `Apertura de caja - Saldo inicial`,
        monto: parseFloat(saldoApertura),
        fecha: fechaFiltro,
        categoria: 'Apertura de caja',
      }),
    })
    setModalApertura(false)
    setSaldoApertura('')
    cargar(empresa, fechaFiltro)
    showToast('Apertura de caja registrada')
  }

  function generarCierre() {
    const ingresos = movimientos.filter(m => m.tipo === 'ingreso')
    const egresos = movimientos.filter(m => m.tipo === 'egreso')
    const apertura = ingresos.find(m => m.categoria === 'Apertura de caja')
    const saldoInicial = apertura ? apertura.monto : 0
    const totalIngresos = ingresos.filter(m => m.categoria !== 'Apertura de caja').reduce((a, m) => a + m.monto, 0)
    const totalEgresos = egresos.reduce((a, m) => a + m.monto, 0)

    setCierreCaja({
      fecha: fechaFiltro,
      saldo_inicial: saldoInicial,
      total_ingresos: totalIngresos,
      total_egresos: totalEgresos,
      saldo_final: saldoInicial + totalIngresos - totalEgresos,
      movimientos: movimientos.length,
    })
    setModalCierre(true)
  }

  function imprimirCierre() {
    if (!cierreCaja) return
    const w = window.open('', '_blank', 'width=600,height=500')
    if (!w) return
    const empNombre = empresa === 'aroma' ? 'Aroma de Vid' : 'MDP La Vid Consultora S.R.L.'
    w.document.write(`
      <html><head><title>Cierre de Caja</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;margin:24px}
      h2{font-size:16px}table{width:100%;border-collapse:collapse}
      td{padding:6px 8px;border-bottom:1px solid #eee}
      .total{font-weight:bold;font-size:14px;border-top:2px solid #000}
      </style></head><body>
      <h2>${empNombre}</h2>
      <h3>CIERRE DE CAJA — ${new Date(cierreCaja.fecha + 'T12:00:00').toLocaleDateString('es-AR')}</h3>
      <table>
        <tr><td>Saldo inicial (apertura)</td><td style="text-align:right">$${cierreCaja.saldo_inicial.toLocaleString('es-AR')}</td></tr>
        <tr><td>Total ingresos del día</td><td style="text-align:right;color:green">+$${cierreCaja.total_ingresos.toLocaleString('es-AR')}</td></tr>
        <tr><td>Total egresos del día</td><td style="text-align:right;color:red">-$${cierreCaja.total_egresos.toLocaleString('es-AR')}</td></tr>
        <tr><td>Total movimientos</td><td style="text-align:right">${cierreCaja.movimientos}</td></tr>
        <tr class="total"><td>SALDO FINAL DE CAJA</td><td style="text-align:right">$${cierreCaja.saldo_final.toLocaleString('es-AR')}</td></tr>
      </table>
      <br><br>
      <div style="display:flex;justify-content:space-between;margin-top:40px">
        <div style="text-align:center;width:200px"><div style="border-top:1px solid #000;padding-top:4px">Firma responsable</div></div>
        <div style="text-align:center;width:200px"><div style="border-top:1px solid #000;padding-top:4px">Firma supervisor</div></div>
      </div>
      </body></html>
    `)
    w.document.close(); w.focus()
    setTimeout(() => w.print(), 400)
  }

  const ingresos = movimientos.filter(m => m.tipo === 'ingreso' && m.categoria !== 'Apertura de caja')
  const egresos = movimientos.filter(m => m.tipo === 'egreso')
  const apertura = movimientos.find(m => m.categoria === 'Apertura de caja')
  const saldoInicial = apertura ? apertura.monto : 0
  const totalIngresos = ingresos.reduce((a, m) => a + m.monto, 0)
  const totalEgresos = egresos.reduce((a, m) => a + m.monto, 0)
  const saldoActual = saldoInicial + totalIngresos - totalEgresos

  return (
    <div>
      {/* Métricas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-xs text-gray-400 mb-1">Saldo inicial</div>
          <div className="text-2xl font-medium text-gray-800">${saldoInicial.toLocaleString('es-AR')}</div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-400 mb-1">Ingresos del día</div>
          <div className="text-2xl font-medium text-green-600">+${totalIngresos.toLocaleString('es-AR')}</div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-400 mb-1">Egresos del día</div>
          <div className="text-2xl font-medium text-red-500">-${totalEgresos.toLocaleString('es-AR')}</div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-400 mb-1">Saldo actual</div>
          <div className={`text-2xl font-medium ${saldoActual >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
            ${saldoActual.toLocaleString('es-AR')}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-gray-800">Caja</h1>
          <input
            type="date"
            className="input w-40 text-sm"
            value={fechaFiltro}
            onChange={e => { setFechaFiltro(e.target.value); cargar(empresa, e.target.value) }}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalApertura(true)} className="btn btn-primary text-xs">🔓 Apertura</button>
          <button onClick={() => { setTipoMov('ingreso'); setCategoria('Otro ingreso'); setModal(true) }} className="btn btn-primary text-xs text-green-600">+ Ingreso</button>
          <button onClick={() => { setTipoMov('egreso'); setCategoria('Otro egreso'); setModal(true) }} className="btn btn-primary text-xs text-red-500">- Egreso</button>
          <button onClick={generarCierre} className="btn btn-primary text-xs">🔒 Cierre</button>
        </div>
      </div>

      {/* Tabla movimientos */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">
            {['Hora','Concepto','Categoría','Tipo','Monto',''].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">Cargando...</td></tr>
              : movimientos.length === 0
              ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">No hay movimientos para esta fecha</td></tr>
              : movimientos.map(m => (
                <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50 ${m.categoria === 'Apertura de caja' ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{m.concepto}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{m.categoria || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${m.tipo === 'ingreso' ? 'badge-green' : 'badge-red'}`}>
                      {m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-medium ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-500'}`}>
                    {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => eliminar(m.id)} className="btn btn-danger text-xs py-1 px-2">🗑</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Modal nuevo movimiento */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-md">
            <h2 className="text-base font-medium text-gray-800 mb-5">
              {tipoMov === 'ingreso' ? '+ Nuevo ingreso' : '- Nuevo egreso'}
            </h2>
            <div className="flex gap-2 mb-4">
              <button onClick={() => { setTipoMov('ingreso'); setCategoria('Otro ingreso') }} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${tipoMov === 'ingreso' ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 text-gray-500'}`}>Ingreso</button>
              <button onClick={() => { setTipoMov('egreso'); setCategoria('Otro egreso') }} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${tipoMov === 'egreso' ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-200 text-gray-500'}`}>Egreso</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Categoría</label>
                <select className="input" value={categoria} onChange={e => setCategoria(e.target.value)}>
                  {(tipoMov === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Concepto *</label>
                <input className="input" value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Descripción del movimiento" />
              </div>
              <div>
                <label className="label">Monto ($) *</label>
                <input className="input" type="number" min="0" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="label">Fecha</label>
                <input className="input" type="date" value={fechaMov} onChange={e => setFechaMov(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setModal(false)} className="btn btn-primary">Cancelar</button>
              <button onClick={guardarMovimiento} className={`px-5 py-2 rounded-lg text-white text-sm font-medium ${tipoMov === 'ingreso' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}>
                Registrar {tipoMov}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal apertura */}
      {modalApertura && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalApertura(false)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-sm">
            <h2 className="text-base font-medium text-gray-800 mb-5">🔓 Apertura de caja</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Fecha</label>
                <input className="input" type="date" value={fechaFiltro} onChange={e => setFechaFiltro(e.target.value)} />
              </div>
              <div>
                <label className="label">Saldo inicial ($)</label>
                <input className="input text-xl" type="number" min="0" value={saldoApertura} onChange={e => setSaldoApertura(e.target.value)} placeholder="0.00" autoFocus />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setModalApertura(false)} className="btn btn-primary">Cancelar</button>
              <button onClick={registrarApertura} className="px-5 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700">
                Abrir caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cierre */}
      {modalCierre && cierreCaja && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalCierre(false)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-sm">
            <h2 className="text-base font-medium text-gray-800 mb-5">🔒 Cierre de caja</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium">{new Date(cierreCaja.fecha + 'T12:00:00').toLocaleDateString('es-AR')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Saldo inicial</span>
                <span className="font-medium">${cierreCaja.saldo_inicial.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Total ingresos</span>
                <span className="font-medium text-green-600">+${cierreCaja.total_ingresos.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Total egresos</span>
                <span className="font-medium text-red-500">-${cierreCaja.total_egresos.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Movimientos</span>
                <span className="font-medium">{cierreCaja.movimientos}</span>
              </div>
              <div className="flex justify-between py-3 mt-1">
                <span className="font-medium text-gray-800 text-base">SALDO FINAL</span>
                <span className={`font-bold text-xl ${cierreCaja.saldo_final >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
                  ${cierreCaja.saldo_final.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setModalCierre(false)} className="btn btn-primary">Cerrar</button>
              <button onClick={imprimirCierre} className="px-5 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700">
                🖨️ Imprimir cierre
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 right-6 bg-gray-800 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50">{toast}</div>}
    </div>
  )
}
