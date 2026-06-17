'use client'
import { useEffect, useState } from 'react'
import type { MovimientoCaja, MedioPago } from '@/types'

const C = { bg:'#0F0F0F', surface:'#141414', card:'#1A1A1A', border:'#2A2A2A', accent:'#8B1A2A', text:'#E8E8E8', muted:'#888888', dim:'#555555', green:'#4CAF7D', amber:'#D4820A', red:'#E05555' }
const btn = (bg = C.accent): React.CSSProperties => ({ background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 })
const INP: React.CSSProperties = { background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: '8px 12px', width: '100%', fontSize: 13, outline: 'none' }
const LBL: React.CSSProperties = { display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }

const MEDIOS_PAGO: MedioPago[] = ['Efectivo', 'Tarjeta Débito', 'Tarjeta Crédito', 'QR', 'MercadoPago', 'Transferencia', 'Cta.Cte.']
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
    setEmpresa(e); cargar(e)
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
    setModal(false); cargar(empresa)
    showToast('Movimiento registrado')
    setForm({ ...FORM_EMPTY, fecha: new Date().toISOString().split('T')[0] })
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este movimiento?')) return
    await fetch(`/api/caja?id=${id}`, { method: 'DELETE' })
    cargar(empresa); showToast('Movimiento eliminado')
  }

  const totalIngresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0)
  const totalEgresos  = movimientos.filter(m => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0)
  const saldo = totalIngresos - totalEgresos

  const movsCierre = movimientos.filter(m => m.fecha === fechaCierre)
  const cierreData = MEDIOS_PAGO.map(mp => {
    const movsMp = movsCierre.filter(m => m.medio_pago === mp)
    const ingresos = movsMp.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0)
    const egresos  = movsMp.filter(m => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0)
    return { mp, ingresos, egresos, neto: ingresos - egresos }
  }).filter(x => x.ingresos > 0 || x.egresos > 0)

  const totalNetoCierre = movsCierre.reduce((a, m) => a + (m.tipo === 'ingreso' ? m.monto : -m.monto), 0)

  return (
    <div style={{ padding: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total ingresos', value: `$${totalIngresos.toLocaleString('es-AR')}`, color: C.green },
          { label: 'Total egresos',  value: `$${totalEgresos.toLocaleString('es-AR')}`,  color: C.red  },
          { label: 'Saldo neto',     value: `$${saldo.toLocaleString('es-AR')}`,          color: saldo >= 0 ? C.green : C.red },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Caja y flujo de fondos</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btn('#2A2A2A')} onClick={() => setCierreModal(true)}>Cierre de caja</button>
          <button style={btn()} onClick={() => { setForm({ ...FORM_EMPTY, fecha: new Date().toISOString().split('T')[0] }); setModal(true) }}>+ Nuevo movimiento</button>
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Fecha','Tipo','Concepto','Categoría','Medio de pago','Monto',''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: C.muted }}>Cargando...</td></tr>
            ) : movimientos.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: C.muted }}>No hay movimientos todavía</td></tr>
            ) : movimientos.map(m => (
              <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: '10px 16px', color: C.dim, fontSize: 12 }}>{m.fecha}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ background: m.tipo === 'ingreso' ? `${C.green}22` : `${C.red}22`, color: m.tipo === 'ingreso' ? C.green : C.red, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                    {m.tipo}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', color: C.text }}>{m.concepto}</td>
                <td style={{ padding: '10px 16px', color: C.dim, fontSize: 12 }}>{m.categoria || '—'}</td>
                <td style={{ padding: '10px 16px' }}>
                  {m.medio_pago
                    ? <span style={{ background: '#2A2A2A', color: C.muted, padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{m.medio_pago}</span>
                    : <span style={{ color: C.dim }}>—</span>}
                </td>
                <td style={{ padding: '10px 16px', fontWeight: 700, color: m.tipo === 'ingreso' ? C.green : C.red }}>
                  {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString('es-AR')}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <button style={btn(C.red)} onClick={() => eliminar(m.id!)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo movimiento */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 440 }}>
            <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Nuevo movimiento</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LBL}>Tipo</label>
                <select style={INP} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'ingreso' | 'egreso' }))}>
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div>
                <label style={LBL}>Fecha</label>
                <input type="date" style={INP} value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={LBL}>Concepto *</label>
                <input style={INP} value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} placeholder="Descripción del movimiento" />
              </div>
              <div>
                <label style={LBL}>Categoría</label>
                <select style={INP} value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>Medio de pago</label>
                <select style={INP} value={form.medio_pago} onChange={e => setForm(f => ({ ...f, medio_pago: e.target.value as MedioPago }))}>
                  {MEDIOS_PAGO.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={LBL}>Monto ($) *</label>
                <input type="number" min="0" style={INP} value={form.monto || ''} onChange={e => setForm(f => ({ ...f, monto: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button style={btn('#2A2A2A')} onClick={() => setModal(false)}>Cancelar</button>
              <button style={btn()} onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cierre de caja */}
      {cierreModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setCierreModal(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 380 }}>
            <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Cierre de caja</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={LBL}>Fecha</label>
              <input type="date" style={INP} value={fechaCierre} onChange={e => setFechaCierre(e.target.value)} />
            </div>

            {cierreData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted, fontSize: 13 }}>
                No hay movimientos para esta fecha
              </div>
            ) : (
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                {cierreData.map((item, i) => (
                  <div key={item.mp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < cierreData.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.mp}</span>
                    <div style={{ textAlign: 'right' }}>
                      {item.ingresos > 0 && <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>+${item.ingresos.toLocaleString('es-AR')}</div>}
                      {item.egresos  > 0 && <div style={{ fontSize: 11, color: C.red,   fontWeight: 600 }}>-${item.egresos.toLocaleString('es-AR')}</div>}
                      <div style={{ fontSize: 14, fontWeight: 700, color: item.neto >= 0 ? C.text : C.red }}>${item.neto.toLocaleString('es-AR')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cierreData.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${C.border}`, marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>TOTAL NETO</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: totalNetoCierre >= 0 ? C.green : C.red }}>
                  ${totalNetoCierre.toLocaleString('es-AR')}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={btn('#2A2A2A')} onClick={() => setCierreModal(false)}>Cerrar</button>
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
