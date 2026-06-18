'use client'
import { useEffect, useState } from 'react'
import type { MovimientoCaja, MedioPago } from '@/types'

interface CierreCaja {
  id: string
  empresa: string
  fecha: string
  efectivo_sistema: number
  efectivo_real: number
  diferencia: number
  notas?: string | null
  cerrado_por?: string | null
  created_at?: string
}

const T = {
  bg:      '#F5F1EC',
  surface: '#FFFFFF',
  border:  '#DDD0C0',
  border2: '#C8BAA8',
  text:    '#1A1210',
  muted:   '#6B5D55',
  dim:     '#A89888',
  wine:    '#800000',
  wineBg:  'rgba(128,0,0,0.07)',
  wineBd:  'rgba(128,0,0,0.18)',
  green:   '#2D7A4F',
  greenBg: 'rgba(45,122,79,0.08)',
  greenBd: 'rgba(45,122,79,0.22)',
  red:     '#C03030',
  redBg:   'rgba(192,48,48,0.08)',
  redBd:   'rgba(192,48,48,0.22)',
  blue:    '#2B5EA0',
  blueBg:  'rgba(43,94,160,0.08)',
  blueBd:  'rgba(43,94,160,0.22)',
  amber:   '#A07010',
  amberBg: 'rgba(160,112,16,0.07)',
  amberBd: 'rgba(160,112,16,0.22)',
}

const INP: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`, color: T.text,
  borderRadius: 7, padding: '9px 12px', width: '100%', fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
}
const LBL: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: T.muted,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5,
}

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

type PageTab = 'movimientos' | 'cierre'

export default function CajaPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ ...FORM_EMPTY })
  const [cierreModal, setCierreModal] = useState(false)
  const [fechaCierre, setFechaCierre] = useState(new Date().toISOString().split('T')[0])
  const [toast, setToast] = useState('')
  const [pageTab, setPageTab] = useState<PageTab>('movimientos')

  // Cierre del día
  const today = new Date().toISOString().split('T')[0]
  const [cierreFecha, setCierreFecha] = useState(today)
  const [cierreReal, setCierreReal] = useState<number | ''>('')
  const [cierreNotas, setCierreNotas] = useState('')
  const [cierreGuardando, setCierreGuardando] = useState(false)
  const [cierres, setCierres] = useState<CierreCaja[]>([])
  const [cierresLoading, setCierresLoading] = useState(false)

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e); cargar(e); cargarCierres(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    const res = await fetch(`/api/caja?empresa=${emp}`)
    const data = await res.json()
    setMovimientos(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function cargarCierres(emp: string) {
    setCierresLoading(true)
    try {
      const res = await fetch(`/api/cierres-caja?empresa=${emp}&limit=10`)
      const data = await res.json()
      setCierres(Array.isArray(data) ? data : [])
    } finally {
      setCierresLoading(false)
    }
  }

  async function registrarCierre() {
    if (cierreReal === '') { showToast('Ingresá el efectivo real contado'); return }
    setCierreGuardando(true)
    try {
      const res = await fetch('/api/cierres-caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa,
          fecha: cierreFecha,
          efectivo_sistema: efectivoDia,
          efectivo_real: Number(cierreReal),
          notas: cierreNotas || null,
          cerrado_por: null,
        }),
      })
      const data = await res.json()
      if (data.error) { showToast('Error: ' + data.error); return }
      showToast('Cierre registrado correctamente')
      setCierreReal('')
      setCierreNotas('')
      cargarCierres(empresa)
    } finally {
      setCierreGuardando(false)
    }
  }

  async function eliminarCierre(id: string) {
    if (!confirm('¿Eliminar este cierre?')) return
    await fetch(`/api/cierres-caja?id=${id}`, { method: 'DELETE' })
    cargarCierres(empresa)
    showToast('Cierre eliminado')
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

  // Efectivo del día seleccionado para cierre
  const movsDelDia = movimientos.filter(m => m.fecha === cierreFecha && m.medio_pago === 'Efectivo')
  const efectivoDia =
    movsDelDia.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0) -
    movsDelDia.filter(m => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0)
  const diferenciaCierre = cierreReal !== '' ? Number(cierreReal) - efectivoDia : 0

  const movsCierre = movimientos.filter(m => m.fecha === fechaCierre)
  const cierreData = MEDIOS_PAGO.map(mp => {
    const movsMp = movsCierre.filter(m => m.medio_pago === mp)
    const ingresos = movsMp.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0)
    const egresos  = movsMp.filter(m => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0)
    return { mp, ingresos, egresos, neto: ingresos - egresos }
  }).filter(x => x.ingresos > 0 || x.egresos > 0)

  const totalNetoCierre = movsCierre.reduce((a, m) => a + (m.tipo === 'ingreso' ? m.monto : -m.monto), 0)

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        .tr:hover { background: #FDFAF6 !important; }
        .btn-act:hover { opacity: 0.85; }
      `}</style>

      {/* Page header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Caja y flujo de fondos</h1>
            <p style={{ fontSize: 12, color: T.muted, marginTop: 3, margin: '3px 0 0' }}>Movimientos de caja</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setCierreModal(true)}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontWeight: 500 }}
            >Resumen del día</button>
            <button
              className="btn-act"
              onClick={() => { setForm({ ...FORM_EMPTY, fecha: new Date().toISOString().split('T')[0] }); setModal(true) }}
              style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >+ Nuevo movimiento</button>
          </div>
        </div>
        {/* Page-level tab bar */}
        <div style={{ display: 'flex', gap: 2, padding: '0 28px', marginTop: 12 }}>
          {([
            { id: 'movimientos', label: 'Movimientos' },
            { id: 'cierre',      label: 'Cierre del día' },
          ] as { id: PageTab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setPageTab(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: pageTab === t.id ? 700 : 400,
                color: pageTab === t.id ? T.text : T.muted,
                padding: '8px 14px',
                borderBottom: pageTab === t.id ? `2px solid ${T.wine}` : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 0.12s',
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* ── MOVIMIENTOS tab ── */}
        {pageTab === 'movimientos' && (
          <>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Total ingresos', value: `$${totalIngresos.toLocaleString('es-AR')}`, color: T.green, sub: 'ingresos registrados' },
                { label: 'Total egresos',  value: `$${totalEgresos.toLocaleString('es-AR')}`,  color: T.red,   sub: 'egresos registrados' },
                { label: 'Saldo neto',     value: `$${saldo.toLocaleString('es-AR')}`,          color: saldo >= 0 ? T.green : T.red, sub: 'balance actual' },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{kpi.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Table card */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Fecha', 'Tipo', 'Concepto', 'Categoría', 'Medio de pago', 'Monto', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: T.muted, fontSize: 13 }}>Cargando...</td></tr>
                  ) : movimientos.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: T.muted, fontSize: 13 }}>No hay movimientos todavía</td></tr>
                  ) : movimientos.map(m => (
                    <tr key={m.id} className="tr" style={{ borderBottom: `1px solid ${T.border}`, cursor: 'default', transition: 'background 0.1s' }}>
                      <td style={{ padding: '10px 16px', color: T.dim, fontSize: 12 }}>{m.fecha}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          background: m.tipo === 'ingreso' ? T.greenBg : T.redBg,
                          color: m.tipo === 'ingreso' ? T.green : T.red,
                          border: `1px solid ${m.tipo === 'ingreso' ? T.greenBd : T.redBd}`,
                          padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                        }}>
                          {m.tipo}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: T.text, fontSize: 13 }}>{m.concepto}</td>
                      <td style={{ padding: '10px 16px', color: T.dim, fontSize: 12 }}>{m.categoria || '—'}</td>
                      <td style={{ padding: '10px 16px' }}>
                        {m.medio_pago
                          ? <span style={{ background: T.bg, color: T.muted, border: `1px solid ${T.border}`, padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{m.medio_pago}</span>
                          : <span style={{ color: T.dim }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 700, fontSize: 13, color: m.tipo === 'ingreso' ? T.green : T.red }}>
                        {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString('es-AR')}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <button
                          onClick={() => eliminar(m.id!)}
                          style={{ background: T.redBg, border: `1px solid ${T.redBd}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: T.red, fontSize: 12, fontWeight: 500 }}
                        >Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── CIERRE DEL DÍA tab ── */}
        {pageTab === 'cierre' && (
          <div style={{ maxWidth: 680 }}>

            {/* Form card */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(26,18,16,0.05)', marginBottom: 24 }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: T.text }}>Registrar cierre</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Fecha */}
                <div>
                  <label style={LBL}>Fecha</label>
                  <input
                    type="date"
                    style={INP}
                    value={cierreFecha}
                    onChange={e => setCierreFecha(e.target.value)}
                  />
                </div>

                {/* Efectivo en sistema (read-only) */}
                <div>
                  <label style={LBL}>Efectivo en sistema</label>
                  <div style={{
                    ...INP,
                    background: T.bg,
                    color: T.muted,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'default',
                  }}>
                    ${efectivoDia.toLocaleString('es-AR')}
                  </div>
                  <div style={{ fontSize: 10, color: T.dim, marginTop: 4 }}>
                    Ingresos - egresos en Efectivo del día
                  </div>
                </div>

                {/* Efectivo real */}
                <div>
                  <label style={LBL}>Efectivo real contado</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    style={INP}
                    value={cierreReal}
                    placeholder="0"
                    onChange={e => setCierreReal(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Diferencia (read-only) */}
                <div>
                  <label style={LBL}>Diferencia</label>
                  <div style={{
                    ...INP,
                    background: cierreReal === '' ? T.bg : diferenciaCierre >= 0 ? 'rgba(45,122,79,0.07)' : 'rgba(192,48,48,0.07)',
                    border: `1px solid ${cierreReal === '' ? T.border : diferenciaCierre >= 0 ? T.greenBd : T.redBd}`,
                    color: cierreReal === '' ? T.dim : diferenciaCierre >= 0 ? T.green : T.red,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'default',
                  }}>
                    {cierreReal === '' ? '—' : `${diferenciaCierre >= 0 ? '+' : ''}$${diferenciaCierre.toLocaleString('es-AR')}`}
                  </div>
                </div>

                {/* Notas */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LBL}>Notas</label>
                  <input
                    style={INP}
                    value={cierreNotas}
                    onChange={e => setCierreNotas(e.target.value)}
                    placeholder="Observaciones (opcional)"
                  />
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn-act"
                  onClick={registrarCierre}
                  disabled={cierreGuardando}
                  style={{
                    background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8,
                    padding: '9px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    opacity: cierreGuardando ? 0.7 : 1,
                  }}
                >
                  {cierreGuardando ? 'Guardando...' : 'Registrar cierre'}
                </button>
              </div>
            </div>

            {/* Recent cierres table */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Últimos cierres</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Fecha', 'Sistema', 'Real', 'Diferencia', 'Notas', ''].map(h => (
                      <th key={h} style={{ textAlign: h === 'Fecha' || h === 'Notas' || h === '' ? 'left' : 'right', padding: '9px 14px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cierresLoading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 36, color: T.muted, fontSize: 13 }}>Cargando...</td></tr>
                  ) : cierres.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 36, color: T.muted, fontSize: 13 }}>No hay cierres registrados</td></tr>
                  ) : cierres.map(c => (
                    <tr key={c.id} className="tr" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}>
                      <td style={{ padding: '9px 14px', color: T.muted, fontSize: 12 }}>{c.fecha}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 13, color: T.text }}>
                        ${c.efectivo_sistema.toLocaleString('es-AR')}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: T.text }}>
                        ${c.efectivo_real.toLocaleString('es-AR')}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: c.diferencia >= 0 ? T.green : T.red }}>
                        {c.diferencia >= 0 ? '+' : ''}${c.diferencia.toLocaleString('es-AR')}
                      </td>
                      <td style={{ padding: '9px 14px', fontSize: 12, color: T.muted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.notas || '—'}
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <button
                          onClick={() => eliminarCierre(c.id)}
                          style={{ background: T.redBg, border: `1px solid ${T.redBd}`, borderRadius: 6, padding: '3px 10px', cursor: 'pointer', color: T.red, fontSize: 11, fontWeight: 500 }}
                        >Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modal nuevo movimiento */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setModal(false)}
        >
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(26,18,16,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Nuevo movimiento</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                  {MEDIOS_PAGO.map(mp => <option key={mp}>{mp}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={LBL}>Monto ($) *</label>
                <input type="number" min="0" style={INP} value={form.monto || ''} onChange={e => setForm(f => ({ ...f, monto: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setModal(false)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={guardar} style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cierre de caja */}
      {cierreModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setCierreModal(false)}
        >
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Cierre de caja</h2>
              <button onClick={() => setCierreModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={LBL}>Fecha</label>
                <input type="date" style={INP} value={fechaCierre} onChange={e => setFechaCierre(e.target.value)} />
              </div>

              {cierreData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: T.muted, fontSize: 13 }}>
                  No hay movimientos para esta fecha
                </div>
              ) : (
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                  {cierreData.map((item, i) => (
                    <div key={item.mp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < cierreData.length - 1 ? `1px solid ${T.border}` : 'none', background: i % 2 === 0 ? T.surface : T.bg }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.mp}</span>
                      <div style={{ textAlign: 'right' }}>
                        {item.ingresos > 0 && <div style={{ fontSize: 11, color: T.green, fontWeight: 700 }}>+${item.ingresos.toLocaleString('es-AR')}</div>}
                        {item.egresos  > 0 && <div style={{ fontSize: 11, color: T.red,   fontWeight: 700 }}>-${item.egresos.toLocaleString('es-AR')}</div>}
                        <div style={{ fontSize: 14, fontWeight: 700, color: item.neto >= 0 ? T.text : T.red }}>${item.neto.toLocaleString('es-AR')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cierreData.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${T.border}`, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>TOTAL NETO</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: totalNetoCierre >= 0 ? T.green : T.red }}>
                    ${totalNetoCierre.toLocaleString('es-AR')}
                  </span>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setCierreModal(false)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: T.surface, color: T.text, fontSize: 13, padding: '12px 20px', borderRadius: 12, zIndex: 200, border: `1px solid ${T.border}`, boxShadow: '0 4px 16px rgba(26,18,16,0.12)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
