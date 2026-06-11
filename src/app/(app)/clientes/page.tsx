'use client'
import { useEffect, useState } from 'react'
import type { Cliente } from '@/types'

const TIPOS = [
  { value: 'consumidor_final', label: 'Consumidor final' },
  { value: 'revendedor',       label: 'Revendedor' },
  { value: 'mayorista',        label: 'Mayorista' },
  { value: 'gastronomia',      label: 'Gastronomía' },
  { value: 'otro',             label: 'Otro' },
]

interface MovCtaCte {
  id: string
  tipo: string
  concepto: string
  monto: number
  saldo_anterior?: number
  saldo_nuevo?: number
  fecha?: string
  created_at: string
}

const EMPTY: Omit<Cliente, 'id' | 'created_at'> = {
  empresa: 'aroma',
  nombre: '', apellido: '', razon_social: '', cuit: '', email: '', telefono: '',
  direccion: '', tipo: 'consumidor_final', saldo: 0, limite_credito: 0, notas: '', activo: true,
}

export default function ClientesPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })
  const [editId, setEditId] = useState<string | null>(null)

  const [cobroModal, setCobroModal] = useState(false)
  const [cobroCliente, setCobroCliente] = useState<Cliente | null>(null)
  const [cobroMonto, setCobroMonto] = useState(0)
  const [cobroConcepto, setCobroConcepto] = useState('Cobro cuenta corriente')
  const [cobroFecha, setCobroFecha] = useState(new Date().toISOString().split('T')[0])

  const [histModal, setHistModal] = useState(false)
  const [histCliente, setHistCliente] = useState<Cliente | null>(null)
  const [histMovs, setHistMovs] = useState<MovCtaCte[]>([])
  const [histCargando, setHistCargando] = useState(false)
  const [histDesde, setHistDesde] = useState('')
  const [histHasta, setHistHasta] = useState(new Date().toISOString().split('T')[0])

  const [busqueda, setBusqueda] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e); cargar(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    const res = await fetch(`/api/clientes?empresa=${emp}`)
    const data = await res.json()
    setClientes(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  function abrirNuevo() {
    setForm({ ...EMPTY, empresa: empresa as 'aroma' | 'lavid' })
    setEditId(null); setModal(true)
  }

  function abrirEditar(c: Cliente) {
    setForm({
      empresa: c.empresa, nombre: c.nombre, apellido: c.apellido || '',
      razon_social: c.razon_social || '', cuit: c.cuit || '', email: c.email || '',
      telefono: c.telefono || '', direccion: c.direccion || '', tipo: c.tipo,
      saldo: c.saldo, limite_credito: c.limite_credito || 0, notas: c.notas || '', activo: c.activo,
    })
    setEditId(c.id!)
    setModal(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio'); return }
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { id: editId, ...form } : form
    const res = await fetch('/api/clientes', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false); cargar(empresa)
    showToast(editId ? 'Cliente actualizado' : 'Cliente guardado')
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este cliente?')) return
    await fetch(`/api/clientes?id=${id}`, { method: 'DELETE' })
    cargar(empresa); showToast('Cliente eliminado')
  }

  function abrirCobro(c: Cliente) {
    setCobroCliente(c)
    setCobroMonto(0)
    setCobroConcepto('Cobro cuenta corriente')
    setCobroFecha(new Date().toISOString().split('T')[0])
    setCobroModal(true)
  }

  async function guardarCobro() {
    if (!cobroCliente) return
    if (!cobroMonto || cobroMonto <= 0) { showToast('Ingresá un monto válido'); return }
    const nombreCliente = cobroCliente.razon_social ||
      `${cobroCliente.nombre} ${cobroCliente.apellido || ''}`.trim()
    const res = await fetch('/api/cta-cte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa,
        cliente_id: cobroCliente.id,
        cliente_nombre: nombreCliente,
        tipo: 'cobro',
        concepto: cobroConcepto,
        monto: cobroMonto,
        fecha: cobroFecha,
      }),
    })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setCobroModal(false)
    cargar(empresa)
    showToast(`Cobro de $${cobroMonto.toLocaleString('es-AR')} registrado`)
  }

  async function abrirHistorial(c: Cliente) {
    setHistCliente(c)
    setHistDesde('')
    setHistHasta(new Date().toISOString().split('T')[0])
    setHistModal(true)
    await fetchHistorial(c.id!, '', new Date().toISOString().split('T')[0])
  }

  async function fetchHistorial(clienteId: string, desde: string, hasta: string) {
    setHistCargando(true)
    let url = `/api/cta-cte?cliente_id=${clienteId}`
    if (desde) url += `&desde=${desde}`
    if (hasta) url += `&hasta=${hasta}`
    const res = await fetch(url)
    const data = await res.json()
    setHistMovs(Array.isArray(data) ? data : [])
    setHistCargando(false)
  }

  function copiarMensajeWhatsApp(c: Cliente) {
    const nombre = c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()
    const empNombre = empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'
    const mensaje =
      `Hola ${nombre}, le escribimos desde ${empNombre}.\n` +
      `Su saldo pendiente es de $${c.saldo.toLocaleString('es-AR')}.\n` +
      `Por favor comuníquese con nosotros para coordinar el pago.\n` +
      `¡Muchas gracias!`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(mensaje).then(() => showToast('Mensaje copiado al portapapeles ✓'))
    } else {
      const url = c.telefono
        ? `https://wa.me/549${c.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
        : `https://wa.me/?text=${encodeURIComponent(mensaje)}`
      window.open(url, '_blank')
    }
  }

  const filtrados = clientes.filter(c => {
    const q = busqueda.toLowerCase()
    return !q || `${c.nombre} ${c.apellido || ''} ${c.razon_social || ''} ${c.cuit || ''} ${c.telefono || ''}`.toLowerCase().includes(q)
  })

  const conSaldo = clientes.filter(c => c.saldo !== 0).length
  const saldoTotal = clientes.reduce((a, c) => a + c.saldo, 0)

  const totalCobradoHist = histMovs.filter(m => m.tipo === 'cobro' || m.tipo === 'pago').reduce((a, m) => a + m.monto, 0)
  const totalCargadoHist = histMovs.filter(m => m.tipo === 'cargo').reduce((a, m) => a + m.monto, 0)

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total clientes</div>
          <div className="text-2xl font-bold text-gray-900">{clientes.length}</div>
        </div>
        <div className="card">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Con saldo pendiente</div>
          <div className="text-2xl font-bold text-amber-600">{conSaldo}</div>
        </div>
        <div className={`card col-span-2 ${saldoTotal > 0 ? 'border-l-4 border-l-amber-400' : ''}`}>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Saldo total cuentas corrientes</div>
          <div className={`text-2xl font-bold ${saldoTotal > 0 ? 'text-amber-600' : saldoTotal < 0 ? 'text-red-500' : 'text-gray-900'}`}>
            ${saldoTotal.toLocaleString('es-AR')}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">Clientes</h1>
        <button onClick={abrirNuevo} className="btn btn-primary">+ Nuevo cliente</button>
      </div>

      <input
        className="input mb-4"
        placeholder="Buscar por nombre, CUIT, razón social..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
      />

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Cliente', 'CUIT', 'Contacto', 'Tipo', 'Saldo', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No hay clientes todavía</td></tr>
            ) : filtrados.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-800">{c.nombre} {c.apellido || ''}</div>
                  {c.razon_social && <div className="text-xs text-gray-400">{c.razon_social}</div>}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.cuit || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {c.telefono && <div>{c.telefono}</div>}
                  {c.email && <div>{c.email}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className="badge badge-blue">
                    {TIPOS.find(t => t.value === c.tipo)?.label || c.tipo}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">
                  <span className={c.saldo > 0 ? 'text-amber-600' : c.saldo < 0 ? 'text-red-500' : 'text-gray-400'}>
                    ${c.saldo.toLocaleString('es-AR')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => abrirEditar(c)} className="btn btn-primary text-xs py-1 px-2">✏️</button>
                    <button onClick={() => abrirHistorial(c)} className="btn btn-primary text-xs py-1 px-2" title="Ver historial de cuenta corriente">
                      📋 Historial
                    </button>
                    {c.saldo > 0 && (
                      <>
                        <button onClick={() => abrirCobro(c)} className="btn btn-success text-xs py-1 px-2">
                          💰 Cobrar
                        </button>
                        <button onClick={() => copiarMensajeWhatsApp(c)} className="btn btn-whatsapp text-xs py-1 px-2">
                          📱 WA
                        </button>
                      </>
                    )}
                    <button onClick={() => eliminar(c.id!)} className="btn btn-danger text-xs py-1 px-2">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal edición cliente */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-5">{editId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Nombre *</label>
                <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></div>
              <div><label className="label">Apellido</label>
                <input className="input" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} /></div>
              <div className="col-span-2"><label className="label">Razón social</label>
                <input className="input" value={form.razon_social} onChange={e => setForm(f => ({ ...f, razon_social: e.target.value }))} /></div>
              <div><label className="label">CUIT</label>
                <input className="input" value={form.cuit} onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))} placeholder="20-12345678-9" /></div>
              <div><label className="label">Tipo</label>
                <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as Cliente['tipo'] }))}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select></div>
              <div><label className="label">Teléfono</label>
                <input className="input" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} /></div>
              <div><label className="label">Email</label>
                <input className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="col-span-2"><label className="label">Dirección</label>
                <input className="input" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} /></div>
              <div><label className="label">Saldo cuenta corriente ($)</label>
                <input className="input" type="number" value={form.saldo} onChange={e => setForm(f => ({ ...f, saldo: parseFloat(e.target.value) || 0 }))} /></div>
              <div><label className="label">Límite de crédito ($)</label>
                <input className="input" type="number" value={form.limite_credito} onChange={e => setForm(f => ({ ...f, limite_credito: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="col-span-2"><label className="label">Notas</label>
                <textarea className="input h-20 resize-none" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setModal(false)} className="btn btn-primary">Cancelar</button>
              <button onClick={guardar} className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 shadow-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cobro */}
      {cobroModal && cobroCliente && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setCobroModal(false)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-1">Registrar cobro</h2>
            <p className="text-sm text-gray-500 mb-5">
              {cobroCliente.razon_social || `${cobroCliente.nombre} ${cobroCliente.apellido || ''}`.trim()}
              {' — '}
              <span className="font-semibold text-amber-600">Saldo: ${cobroCliente.saldo.toLocaleString('es-AR')}</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="label">Monto a cobrar ($) *</label>
                <input type="number" min="0" className="input" value={cobroMonto || ''} onChange={e => setCobroMonto(parseFloat(e.target.value) || 0)} placeholder="0" autoFocus />
              </div>
              <div>
                <label className="label">Concepto</label>
                <input className="input" value={cobroConcepto} onChange={e => setCobroConcepto(e.target.value)} />
              </div>
              <div>
                <label className="label">Fecha</label>
                <input type="date" className="input" value={cobroFecha} onChange={e => setCobroFecha(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setCobroModal(false)} className="btn btn-primary">Cancelar</button>
              <button onClick={guardarCobro} className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm">Registrar cobro</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal historial cuenta corriente */}
      {histModal && histCliente && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setHistModal(false)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Historial — {histCliente.razon_social || `${histCliente.nombre} ${histCliente.apellido || ''}`.trim()}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500">Saldo actual:</span>
                  <span className={`text-sm font-bold ${histCliente.saldo > 0 ? 'text-amber-600' : histCliente.saldo < 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                    ${histCliente.saldo.toLocaleString('es-AR')}
                  </span>
                  {histCliente.saldo > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      Deuda pendiente
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setHistModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* Filtros por fecha */}
            <div className="flex gap-3 mb-4 items-end">
              <div>
                <label className="label">Desde</label>
                <input type="date" className="input w-40" value={histDesde} onChange={e => setHistDesde(e.target.value)} />
              </div>
              <div>
                <label className="label">Hasta</label>
                <input type="date" className="input w-40" value={histHasta} onChange={e => setHistHasta(e.target.value)} />
              </div>
              <button
                onClick={() => fetchHistorial(histCliente.id!, histDesde, histHasta)}
                className="btn btn-primary px-4"
              >
                Filtrar
              </button>
              <button
                onClick={() => { setHistDesde(''); setHistHasta(new Date().toISOString().split('T')[0]); fetchHistorial(histCliente.id!, '', new Date().toISOString().split('T')[0]) }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Ver todo
              </button>
            </div>

            {/* Resumen del período */}
            {histMovs.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="text-xs text-red-500 font-semibold uppercase tracking-wide mb-0.5">Total cargado</div>
                  <div className="text-lg font-bold text-red-600">${totalCargadoHist.toLocaleString('es-AR')}</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3">
                  <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-0.5">Total cobrado</div>
                  <div className="text-lg font-bold text-emerald-600">${totalCobradoHist.toLocaleString('es-AR')}</div>
                </div>
                <div className={`rounded-xl p-3 ${totalCargadoHist - totalCobradoHist > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Neto período</div>
                  <div className={`text-lg font-bold ${totalCargadoHist - totalCobradoHist > 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                    ${(totalCargadoHist - totalCobradoHist).toLocaleString('es-AR')}
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de movimientos */}
            {histCargando ? (
              <div className="text-center py-10 text-gray-400">Cargando...</div>
            ) : histMovs.length === 0 ? (
              <div className="text-center py-10 text-gray-400">No hay movimientos en este período</div>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-semibold uppercase tracking-wide">Fecha</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-semibold uppercase tracking-wide">Tipo</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-semibold uppercase tracking-wide">Concepto</th>
                      <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-semibold uppercase tracking-wide">Monto</th>
                      <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-semibold uppercase tracking-wide">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {histMovs.map(m => {
                      const esCobro = m.tipo === 'cobro' || m.tipo === 'pago'
                      return (
                        <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/70">
                          <td className="px-4 py-2.5 text-gray-400 text-xs">
                            {new Date(m.created_at).toLocaleDateString('es-AR')}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`badge ${esCobro ? 'badge-green' : 'badge-red'}`}>
                              {esCobro ? 'Cobro' : 'Cargo'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">{m.concepto}</td>
                          <td className={`px-4 py-2.5 text-right font-semibold ${esCobro ? 'text-emerald-600' : 'text-red-500'}`}>
                            {esCobro ? '-' : '+'}${m.monto.toLocaleString('es-AR')}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-500 text-xs">
                            {m.saldo_nuevo !== undefined ? `$${m.saldo_nuevo.toLocaleString('es-AR')}` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50 max-w-sm">
          {toast}
        </div>
      )}
    </div>
  )
}
