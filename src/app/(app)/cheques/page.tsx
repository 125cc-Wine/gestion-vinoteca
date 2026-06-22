'use client'
import { useEffect, useState } from 'react'

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
  gold:    '#B88A2C',
  goldBg:  'rgba(184,138,44,0.08)',
  goldBd:  'rgba(184,138,44,0.22)',
}

const INP: React.CSSProperties = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 7,
  color: T.text,
  padding: '9px 12px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.12s',
  width: '100%',
}

const LBL: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: T.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 5,
}

interface Cheque {
  id: string
  empresa: string
  cuenta_id?: string
  banco?: string
  nro_cheque?: string
  monto: number
  fecha_emision: string
  fecha_pago: string
  beneficiario: string
  concepto?: string
  estado: 'emitido' | 'acreditado' | 'rechazado' | 'anulado'
  proveedor_id?: string
  notas?: string
  created_at: string
}

interface Cuenta {
  id: string
  empresa: string
  banco: string
  numero_cuenta?: string
  cbu?: string
  alias?: string
  tipo: string
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10)
}

function labelCuenta(c: Cuenta): string {
  const num = c.alias || c.numero_cuenta || c.cbu || ''
  return num ? `${c.banco} — ${num}` : c.banco
}

function fechaPagoStyle(ch: Cheque): React.CSSProperties {
  if (ch.estado === 'acreditado') return { color: T.green, fontWeight: 600 }
  if (ch.estado === 'rechazado') return { color: T.red, fontWeight: 600 }
  if (ch.estado !== 'emitido') return { color: T.muted }
  const hoyD = new Date(); hoyD.setHours(0, 0, 0, 0)
  const vD = new Date(ch.fecha_pago + 'T12:00:00')
  const diff = (vD.getTime() - hoyD.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return { color: T.red, fontWeight: 700 }
  if (diff <= 7) return { color: T.amber, fontWeight: 600 }
  return { color: T.muted }
}

function fechaPagoLabel(ch: Cheque): string {
  const fechaStr = ch.fecha_pago
    ? new Date(ch.fecha_pago + 'T12:00:00').toLocaleDateString('es-AR')
    : '—'
  if (ch.estado !== 'emitido') return fechaStr
  const hoyD = new Date(); hoyD.setHours(0, 0, 0, 0)
  const vD = new Date(ch.fecha_pago + 'T12:00:00')
  const diff = (vD.getTime() - hoyD.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return `${fechaStr} — VENCIDO`
  return fechaStr
}

const ESTADO_STYLE: Record<string, React.CSSProperties> = {
  emitido:    { background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBd}` },
  acreditado: { background: T.greenBg, color: T.green, border: `1px solid ${T.greenBd}` },
  rechazado:  { background: T.redBg,   color: T.red,   border: `1px solid ${T.redBd}` },
  anulado:    { background: T.bg,      color: T.dim,   border: `1px solid ${T.border}` },
}

const ESTADO_LABEL: Record<string, string> = {
  emitido: 'Emitido',
  acreditado: 'Acreditado',
  rechazado: 'Rechazado',
  anulado: 'Anulado',
}

export default function ChequesPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [cheques, setCheques] = useState<Cheque[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCuenta, setFiltroCuenta] = useState('')
  const [modal, setModal] = useState(false)
  const [cuentaModal, setCuentaModal] = useState(false)
  const [detalle, setDetalle] = useState<Cheque | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  // Form cheque
  const [fCuentaId, setFCuentaId] = useState('')
  const [fBanco, setFBanco] = useState('')
  const [fNroCheque, setFNroCheque] = useState('')
  const [fMonto, setFMonto] = useState('')
  const [fFechaEmision, setFFechaEmision] = useState(hoy())
  const [fFechaPago, setFFechaPago] = useState('')
  const [fBeneficiario, setFBeneficiario] = useState('')
  const [fConcepto, setFConcepto] = useState('')
  const [fNotas, setFNotas] = useState('')

  // Form cuenta bancaria
  const [cbBanco, setCbBanco] = useState('')
  const [cbNroCuenta, setCbNroCuenta] = useState('')
  const [cbCbu, setCbCbu] = useState('')
  const [cbAlias, setCbAlias] = useState('')
  const [cbTipo, setCbTipo] = useState('corriente')

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e)
    cargar(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    try {
      const [chRes, cRes] = await Promise.all([
        fetch(`/api/cheques?empresa=${emp}`),
        fetch(`/api/cuentas-bancarias?empresa=${emp}`),
      ])
      const [chData, cData] = await Promise.all([chRes.json(), cRes.json()])
      setCheques(Array.isArray(chData) ? chData : [])
      setCuentas(Array.isArray(cData) ? cData : [])
    } finally {
      setLoading(false)
    }
  }

  function switchEmpresa(emp: string) {
    setEmpresa(emp)
    localStorage.setItem('empresa', emp)
    setFiltroEstado('')
    setFiltroCuenta('')
    cargar(emp)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function abrirNuevo() {
    setFCuentaId('')
    setFBanco('')
    setFNroCheque('')
    setFMonto('')
    setFFechaEmision(hoy())
    setFFechaPago('')
    setFBeneficiario('')
    setFConcepto('')
    setFNotas('')
    setModal(true)
  }

  function onSelectCuenta(cuentaId: string) {
    setFCuentaId(cuentaId)
    const c = cuentas.find(c => c.id === cuentaId)
    setFBanco(c ? c.banco : '')
  }

  async function guardarCheque() {
    if (!fBeneficiario.trim()) { showToast('Ingresá el beneficiario'); return }
    if (!fMonto || Number(fMonto) <= 0) { showToast('Ingresá un monto válido'); return }
    if (!fFechaPago) { showToast('Ingresá la fecha de pago'); return }
    setSaving(true)
    const res = await fetch('/api/cheques', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa,
        cuenta_id: fCuentaId || null,
        banco: fBanco || null,
        nro_cheque: fNroCheque || null,
        monto: Number(fMonto),
        fecha_emision: fFechaEmision,
        fecha_pago: fFechaPago,
        beneficiario: fBeneficiario,
        concepto: fConcepto || null,
        notas: fNotas || null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false)
    cargar(empresa)
    showToast('Cheque registrado')
  }

  async function guardarCuenta() {
    if (!cbBanco.trim()) { showToast('Ingresá el banco'); return }
    setSaving(true)
    const res = await fetch('/api/cuentas-bancarias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa,
        banco: cbBanco,
        numero_cuenta: cbNroCuenta || null,
        cbu: cbCbu || null,
        alias: cbAlias || null,
        tipo: cbTipo,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { showToast('Error: ' + data.error); return }
    setCuentaModal(false)
    setCbBanco(''); setCbNroCuenta(''); setCbCbu(''); setCbAlias(''); setCbTipo('corriente')
    await cargar(empresa)
    // Auto-seleccionar la nueva cuenta
    if (data.id) {
      setFCuentaId(data.id)
      setFBanco(data.banco)
    }
    showToast('Cuenta bancaria agregada')
  }

  async function cambiarEstado(id: string, estado: string) {
    const res = await fetch('/api/cheques', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    cargar(empresa)
    if (detalle?.id === id) setDetalle({ ...detalle, estado: estado as Cheque['estado'] })
    showToast(`Cheque marcado como ${ESTADO_LABEL[estado]}`)
  }

  async function anularCheque(id: string) {
    if (!confirm('¿Anular este cheque?')) return
    await fetch(`/api/cheques?id=${id}`, { method: 'DELETE' })
    cargar(empresa)
    setDetalle(null)
    showToast('Cheque anulado')
  }

  // KPIs
  const hoyStr = hoy()
  const mesActual = hoyStr.slice(0, 7)

  const totalEmitidoMonto = cheques
    .filter(c => c.estado === 'emitido')
    .reduce((a, c) => a + c.monto, 0)

  const pendientesAcreditar = cheques.filter(c => c.estado === 'emitido' && c.fecha_pago <= hoyStr).length

  const acreditadosEsteMes = cheques.filter(c => c.estado === 'acreditado' && c.fecha_pago?.slice(0, 7) === mesActual)

  const totalAcreditadoMes = acreditadosEsteMes.reduce((a, c) => a + c.monto, 0)

  // Filtrado
  const filtrados = cheques.filter(c => {
    if (filtroEstado && c.estado !== filtroEstado) return false
    if (filtroCuenta && c.cuenta_id !== filtroCuenta) return false
    return true
  })

  const esAroma = empresa === 'aroma'

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .tr:hover { background: #FDFAF6 !important; }
        .btn-row:hover { border-color: ${T.border2} !important; color: ${T.muted} !important; }
        .btn-wine:hover { background: #6A0000 !important; }
        .btn-green:hover { background: #236040 !important; }
        .btn-red:hover { background: #A02020 !important; }
        input:focus, select:focus, textarea:focus { border-color: ${T.border2} !important; box-shadow: 0 0 0 3px rgba(128,0,0,0.08) !important; }
      `}</style>

      {/* Page header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Cheques emitidos</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: '3px 0 0' }}>{esAroma ? 'Aroma de Vid' : 'La Vid Consultora'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Switch empresa */}
          <div style={{ display: 'flex', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 3, gap: 3 }}>
            {(['aroma', 'lavid'] as const).map(e => (
              <button key={e} onClick={() => switchEmpresa(e)}
                style={{
                  background: empresa === e ? T.wine : 'transparent',
                  color: empresa === e ? '#fff' : T.muted,
                  border: 'none', borderRadius: 6,
                  padding: '5px 12px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                }}>
                {e === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'}
              </button>
            ))}
          </div>
          <button className="btn-wine" onClick={abrirNuevo}
            style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.12s', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nuevo cheque
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total emitido', value: `$${totalEmitidoMonto.toLocaleString('es-AR')}`, color: T.amber },
            { label: 'Pendientes a acreditar', value: pendientesAcreditar, color: T.red },
            { label: 'Acreditados este mes', value: acreditadosEsteMes.length, color: T.green },
            { label: 'Total acreditado (mes)', value: `$${totalAcreditadoMes.toLocaleString('es-AR')}`, color: T.text },
          ].map(k => (
            <div key={k.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['', 'emitido', 'acreditado', 'rechazado'] as const).map(e => (
              <button key={e} onClick={() => setFiltroEstado(e)}
                style={{ background: filtroEstado === e ? T.wine : T.surface, color: filtroEstado === e ? '#fff' : T.muted, border: `1px solid ${filtroEstado === e ? T.wine : T.border}`, borderRadius: 7, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}>
                {e === '' ? 'Todos' : ESTADO_LABEL[e]}
              </button>
            ))}
          </div>
          <select value={filtroCuenta} onChange={e => setFiltroCuenta(e.target.value)}
            style={{ ...INP, width: 'auto', minWidth: 180, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
            <option value="">Todas las cuentas</option>
            {cuentas.map(c => (
              <option key={c.id} value={c.id}>{labelCuenta(c)}</option>
            ))}
          </select>
        </div>

        {/* Tabla */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['N° cheque', 'Banco / Cuenta', 'Beneficiario', 'Concepto', 'Fecha emisión', 'Fecha pago', 'Monto', 'Estado', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ padding: 48, textAlign: 'center', color: T.muted, fontSize: 13 }}>Cargando...</td></tr>
                ) : filtrados.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: 48, textAlign: 'center', color: T.muted, fontSize: 13 }}>Sin cheques{filtroEstado ? ` con estado "${ESTADO_LABEL[filtroEstado]}"` : ''}</td></tr>
                ) : filtrados.map(ch => {
                  const cuenta = cuentas.find(c => c.id === ch.cuenta_id)
                  const cuentaLabel = cuenta ? labelCuenta(cuenta) : ch.banco || '—'
                  return (
                    <tr key={ch.id} className="tr"
                      style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 0.1s' }}
                      onClick={() => setDetalle(ch)}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: T.muted, whiteSpace: 'nowrap' }}>
                        {ch.nro_cheque || <span style={{ color: T.dim }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: T.muted, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cuentaLabel}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: T.text }}>{ch.beneficiario}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: T.muted, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.concepto || <span style={{ color: T.dim }}>—</span>}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: T.muted, whiteSpace: 'nowrap' }}>
                        {ch.fecha_emision ? new Date(ch.fecha_emision + 'T12:00:00').toLocaleDateString('es-AR') : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, whiteSpace: 'nowrap', ...fechaPagoStyle(ch) }}>
                        {fechaPagoLabel(ch)}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>
                        ${ch.monto.toLocaleString('es-AR')}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ ...(ESTADO_STYLE[ch.estado] || {}), padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'inline-block', whiteSpace: 'nowrap' }}>
                          {ESTADO_LABEL[ch.estado]}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                        {ch.estado === 'emitido' && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn-row"
                              style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 11, color: T.green, fontWeight: 600, transition: 'all 0.12s', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                              onClick={() => cambiarEstado(ch.id, 'acreditado')}>
                              Acreditado
                            </button>
                            <button className="btn-row"
                              style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 11, color: T.red, fontWeight: 600, transition: 'all 0.12s', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                              onClick={() => cambiarEstado(ch.id, 'rechazado')}>
                              Rechazado
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal nuevo cheque */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: T.surface, zIndex: 1, borderRadius: '14px 14px 0 0' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Nuevo cheque emitido</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Cuenta bancaria + botón nueva */}
              <div>
                <label style={LBL}>Cuenta bancaria</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select style={{ ...INP, flex: 1 }} value={fCuentaId} onChange={e => onSelectCuenta(e.target.value)}>
                    <option value="">Seleccionar cuenta...</option>
                    {cuentas.map(c => (
                      <option key={c.id} value={c.id}>{labelCuenta(c)}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => { setCuentaModal(true) }}
                    style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: '9px 12px', cursor: 'pointer', color: T.wine, fontSize: 16, fontWeight: 700, lineHeight: 1, flexShrink: 0, transition: 'border-color 0.12s', fontFamily: 'inherit' }}
                    title="Agregar cuenta bancaria">+</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>N° de cheque</label>
                  <input style={INP} placeholder="Ej: 00012345" value={fNroCheque} onChange={e => setFNroCheque(e.target.value)} />
                </div>
                <div>
                  <label style={LBL}>Beneficiario <span style={{ color: T.red }}>*</span></label>
                  <input style={INP} placeholder="Nombre del beneficiario" value={fBeneficiario} onChange={e => setFBeneficiario(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LBL}>Monto <span style={{ color: T.red }}>*</span></label>
                  <input type="number" style={INP} min={0} placeholder="0" value={fMonto} onChange={e => setFMonto(e.target.value)} />
                </div>
                <div>
                  <label style={LBL}>Fecha emisión</label>
                  <input type="date" style={INP} value={fFechaEmision} onChange={e => setFFechaEmision(e.target.value)} />
                </div>
                <div>
                  <label style={LBL}>Fecha pago <span style={{ color: T.red }}>*</span></label>
                  <input type="date" style={INP} value={fFechaPago} onChange={e => setFFechaPago(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={LBL}>Concepto <span style={{ fontWeight: 400, color: T.dim }}>(opcional)</span></label>
                <input style={INP} placeholder="Ej: Pago factura, servicios..." value={fConcepto} onChange={e => setFConcepto(e.target.value)} />
              </div>

              <div>
                <label style={LBL}>Notas <span style={{ fontWeight: 400, color: T.dim }}>(opcional)</span></label>
                <textarea style={{ ...INP, resize: 'vertical', minHeight: 60 }} placeholder="Observaciones adicionales..." value={fNotas} onChange={e => setFNotas(e.target.value)} />
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button className="btn-wine" onClick={guardarCheque} disabled={saving}
                style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : 'Registrar cheque'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva cuenta bancaria */}
      {cuentaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.55)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setCuentaModal(false)}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(26,18,16,0.20)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Nueva cuenta bancaria</h2>
              <button onClick={() => setCuentaModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LBL}>Banco <span style={{ color: T.red }}>*</span></label>
                  <input style={INP} placeholder="Ej: Banco Galicia, BBVA, HSBC..." value={cbBanco} onChange={e => setCbBanco(e.target.value)} />
                </div>
                <div>
                  <label style={LBL}>Número de cuenta</label>
                  <input style={INP} placeholder="Ej: 123-456789/0" value={cbNroCuenta} onChange={e => setCbNroCuenta(e.target.value)} />
                </div>
                <div>
                  <label style={LBL}>Tipo</label>
                  <select style={INP} value={cbTipo} onChange={e => setCbTipo(e.target.value)}>
                    <option value="corriente">Cuenta corriente</option>
                    <option value="ahorro">Caja de ahorro</option>
                  </select>
                </div>
                <div>
                  <label style={LBL}>CBU</label>
                  <input style={INP} placeholder="22 dígitos" value={cbCbu} onChange={e => setCbCbu(e.target.value)} />
                </div>
                <div>
                  <label style={LBL}>Alias</label>
                  <input style={INP} placeholder="Ej: EMPRESA.GALICIA" value={cbAlias} onChange={e => setCbAlias(e.target.value)} />
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setCuentaModal(false)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button className="btn-wine" onClick={guardarCuenta} disabled={saving}
                style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : 'Agregar cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detalle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setDetalle(null)}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>
                  Cheque {detalle.nro_cheque ? `N° ${detalle.nro_cheque}` : 'sin número'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted }}>{detalle.beneficiario}</p>
              </div>
              <span style={{ ...(ESTADO_STYLE[detalle.estado] || {}), padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'inline-block', flexShrink: 0 }}>
                {ESTADO_LABEL[detalle.estado]}
              </span>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Fila monto */}
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: T.muted }}>Monto</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: T.text }}>${detalle.monto.toLocaleString('es-AR')}</span>
              </div>

              {/* Grid de campos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Banco / Cuenta', value: (() => { const c = cuentas.find(c => c.id === detalle.cuenta_id); return c ? labelCuenta(c) : detalle.banco || '—' })() },
                  { label: 'N° de cheque', value: detalle.nro_cheque || '—' },
                  { label: 'Fecha de emisión', value: detalle.fecha_emision ? new Date(detalle.fecha_emision + 'T12:00:00').toLocaleDateString('es-AR') : '—' },
                  { label: 'Fecha de pago', value: fechaPagoLabel(detalle), extra: fechaPagoStyle(detalle) },
                  { label: 'Concepto', value: detalle.concepto || '—' },
                  { label: 'Empresa', value: detalle.empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 13, color: T.text, ...(f.extra || {}) }}>{f.value}</div>
                  </div>
                ))}
              </div>

              {detalle.notas && (
                <div style={{ background: T.goldBg, border: `1px solid ${T.goldBd}`, borderRadius: 9, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Notas</div>
                  <div style={{ fontSize: 13, color: T.muted }}>{detalle.notas}</div>
                </div>
              )}

              {/* Acciones de estado */}
              {detalle.estado === 'emitido' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-green"
                    onClick={() => cambiarEstado(detalle.id, 'acreditado')}
                    style={{ flex: 1, background: T.green, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' }}>
                    ✓ Marcar acreditado
                  </button>
                  <button className="btn-red"
                    onClick={() => cambiarEstado(detalle.id, 'rechazado')}
                    style={{ flex: 1, background: T.red, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' }}>
                    ✕ Marcar rechazado
                  </button>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => anularCheque(detalle.id)}
                style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 14px', fontSize: 12, color: T.red, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                Anular
              </button>
              <button onClick={() => setDetalle(null)}
                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 20px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 13, padding: '12px 20px', borderRadius: 12, boxShadow: '0 8px 32px rgba(26,18,16,0.12)', zIndex: 300 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
