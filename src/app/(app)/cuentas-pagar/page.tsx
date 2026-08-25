'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { onOverlayMouseDown, onOverlayClick } from '@/lib/overlayClose'

const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8',
  text: '#1A1210', muted: '#6B5D55', dim: '#A89888',
  wine: '#800000', wineBg: 'rgba(128,0,0,0.07)',
  green: '#2D7A4F', greenBg: 'rgba(45,122,79,0.08)', greenBd: 'rgba(45,122,79,0.22)',
  red: '#C03030', redBg: 'rgba(192,48,48,0.08)', redBd: 'rgba(192,48,48,0.22)',
  amber: '#A07010', amberBg: 'rgba(160,112,16,0.07)', amberBd: 'rgba(160,112,16,0.22)',
  gold: '#B88A2C', goldBg: 'rgba(184,138,44,0.08)',
}

const MEDIOS_PAGO = ['Efectivo', 'Cheque', 'Transferencia', 'Tarjeta Débito', 'Tarjeta Crédito']

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s.length <= 10 ? s + 'T12:00:00' : s)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

interface Factura {
  id: string; numero: string; nro_factura?: string | null
  total: number; monto_pagado: number; pendiente: number
  fecha_vencimiento?: string | null; fecha_factura?: string | null
  dias: number
}

interface ProveedorRow {
  proveedor_id: string | null
  proveedor_nombre: string
  telefono: string | null
  saldo_total: number
  vencido_mas30: number
  vencido: number
  por_vencer_7: number
  vigente: number
  dias_maximo_vencido: number
  proximo_vencimiento: string | null
  factura_mas_vencida: string | null
  cantidad_facturas: number
  facturas: Factura[]
}

interface ChequePendiente {
  id: string; nro_cheque: string | null; banco: string | null
  monto: number; fecha_pago: string; dias: number
  beneficiario: string; proveedor_id: string | null
  compra_id: string | null; compra_numero: string | null
}

type BucketColor = 'green' | 'amber' | 'gold' | 'red'

function getBucketColor(row: ProveedorRow): BucketColor {
  if (row.vencido_mas30 > 0) return 'red'
  if (row.vencido > 0) return 'gold'
  if (row.por_vencer_7 > 0) return 'amber'
  return 'green'
}

const BUCKET_STYLES: Record<BucketColor, { bg: string; bd: string; color: string }> = {
  green: { bg: T.greenBg, bd: T.greenBd, color: T.green },
  amber: { bg: T.amberBg, bd: T.amberBd, color: T.amber },
  gold:  { bg: T.goldBg,  bd: T.amberBd, color: T.gold },
  red:   { bg: T.redBg,   bd: T.redBd,   color: T.red },
}

function diasLabel(dias: number): string {
  if (dias > 0) return `Vencido hace ${dias} d`
  if (dias === 0) return 'Vence hoy'
  return `Vence en ${-dias} d`
}

export default function CuentasPagarPage() {
  const [empresa, setEmpresa] = useState<string>(
    () => (typeof window !== 'undefined' && localStorage.getItem('empresa')) || 'aroma'
  )
  const [proveedores, setProveedores] = useState<ProveedorRow[]>([])
  const [cheques, setCheques] = useState<ChequePendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalProveedor, setModalProveedor] = useState<ProveedorRow | null>(null)

  // Modal "Registrar pago" — mismo patrón que usa Compras, duplicado acá para
  // no tener que ir y venir entre pantallas: ves la deuda del proveedor y
  // pagás una factura puntual sin salir de Cuentas por Pagar.
  const [pagoFactura, setPagoFactura] = useState<Factura | null>(null)
  const [pMonto, setPMonto] = useState(0)
  const [pMedioPago, setPMedioPago] = useState('Efectivo')
  const [pFecha, setPFecha] = useState('')
  const [pChNumero, setPChNumero] = useState('')
  const [pChBanco, setPChBanco] = useState('')
  const [pChFecha, setPChFecha] = useState('')
  const [pagando, setPagando] = useState(false)

  const loadIdRef = useRef(0)

  const load = useCallback(async (emp: string) => {
    const id = ++loadIdRef.current
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cuentas-pagar?empresa=${emp}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar')
      if (id !== loadIdRef.current) return
      setProveedores(data.proveedores || [])
      setCheques(data.cheques || [])
    } catch (e: unknown) {
      if (id !== loadIdRef.current) return
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      if (id === loadIdRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => { load(empresa) }, [empresa, load])

  function abrirPago(f: Factura, provNombre: string, provId: string | null) {
    setPMonto(f.pendiente)
    setPMedioPago('Efectivo')
    setPFecha(new Date().toISOString().split('T')[0])
    setPChNumero(''); setPChBanco(''); setPChFecha('')
    setPagoFactura({ ...f, id: f.id })
    // guardamos referencia extra en un ref implícito vía closure de confirmarPago
    pagoContextRef.current = { provNombre, provId }
  }
  const pagoContextRef = useRef<{ provNombre: string; provId: string | null }>({ provNombre: '', provId: null })

  async function confirmarPago() {
    if (!pagoFactura) return
    const restante = pagoFactura.pendiente
    if (!pMonto || pMonto <= 0) { alert('Monto inválido'); return }
    if (pMonto > restante + 0.01) { alert(`No puede ser mayor a lo que falta (${fmt(restante)})`); return }
    if (pMedioPago === 'Cheque' && (!pChNumero || !pChFecha)) { alert('Completá el N° de cheque y la fecha de cobro'); return }

    setPagando(true)
    try {
      const montoPagadoTotal = parseFloat((pagoFactura.monto_pagado + pMonto).toFixed(2))
      const cubreTotal = montoPagadoTotal >= pagoFactura.total - 0.01
      const res = await fetch('/api/compras', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pagoFactura.id,
          estado_pago: cubreTotal ? 'pagado' : 'pendiente',
          monto_pagado: montoPagadoTotal,
          fecha_pago: pFecha,
          medio_pago: pMedioPago,
        }),
      })
      const data = await res.json()
      if (data.error) { alert('Error: ' + data.error); return }

      if (pMedioPago === 'Cheque') {
        await fetch('/api/cheques', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresa, banco: pChBanco || null, nro_cheque: pChNumero,
            monto: pMonto, fecha_emision: pFecha, fecha_pago: pChFecha,
            beneficiario: pagoContextRef.current.provNombre,
            concepto: `Pago ${pagoFactura.numero}${pagoFactura.nro_factura ? ` — Fact. ${pagoFactura.nro_factura}` : ''}`,
            proveedor_id: pagoContextRef.current.provId, compra_id: pagoFactura.id,
          }),
        })
      }

      setPagoFactura(null)
      setModalProveedor(null)
      load(empresa)
    } finally {
      setPagando(false)
    }
  }

  const totalGeneral = proveedores.reduce((a, p) => a + p.saldo_total, 0)
  const totalVencido = proveedores.reduce((a, p) => a + p.vencido_mas30 + p.vencido, 0)
  const chequesProximos7 = cheques.filter(c => c.dias <= 0 && c.dias >= -7).reduce((a, c) => a + c.monto, 0)
  const chequesVencidos = cheques.filter(c => c.dias > 0)

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px 60px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Cuentas por Pagar</h1>
            <p style={{ fontSize: 13, color: T.muted, margin: '4px 0 0' }}>Lo que le debemos a los proveedores — facturas pendientes y cheques emitidos sin acreditar.</p>
          </div>
          <select value={empresa} onChange={e => { setEmpresa(e.target.value); localStorage.setItem('empresa', e.target.value) }}
            style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 13, fontFamily: 'inherit', background: '#fff', fontWeight: 600 }}>
            <option value="aroma">Aroma de Vid</option>
            <option value="lavid">La Vid Consultora</option>
          </select>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 26 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Total adeudado</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{fmt(totalGeneral)}</div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.redBd}`, borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.red, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Facturas vencidas</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.red }}>{fmt(totalVencido)}</div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.amberBd}`, borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Cheques ≤7 días</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.amber }}>{fmt(chequesProximos7)}</div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Proveedores con deuda</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{proveedores.length}</div>
          </div>
        </div>

        {error && (
          <div style={{ background: T.redBg, border: `1px solid ${T.redBd}`, color: T.red, borderRadius: 10, padding: '12px 16px', marginBottom: 18, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Tabla de proveedores */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.text }}>
            Por proveedor
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: T.dim, fontSize: 13 }}>Cargando...</div>
          ) : proveedores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: T.dim, fontSize: 13 }}>No hay deuda pendiente con proveedores 🎉</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Proveedor', 'Facturas', 'Vencido +30d', 'Vencido', 'Por vencer (7d)', 'Vigente', 'Total', 'Estado', ''].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: h === 'Total' || h.startsWith('Ven') || h === 'Vigente' || h === 'Facturas' ? 'right' : 'left', fontSize: 10.5, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proveedores.map(p => {
                  const bc = BUCKET_STYLES[getBucketColor(p)]
                  return (
                    <tr key={p.proveedor_id ?? p.proveedor_nombre} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }} onClick={() => setModalProveedor(p)}>
                      <td style={{ padding: '10px 14px', color: T.text, fontWeight: 600 }}>{p.proveedor_nombre}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: T.muted }}>{p.cantidad_facturas}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: p.vencido_mas30 > 0 ? T.red : T.dim, fontWeight: p.vencido_mas30 > 0 ? 700 : 400 }}>{p.vencido_mas30 > 0 ? fmt(p.vencido_mas30) : '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: p.vencido > 0 ? T.gold : T.dim, fontWeight: p.vencido > 0 ? 700 : 400 }}>{p.vencido > 0 ? fmt(p.vencido) : '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: p.por_vencer_7 > 0 ? T.amber : T.dim, fontWeight: p.por_vencer_7 > 0 ? 700 : 400 }}>{p.por_vencer_7 > 0 ? fmt(p.por_vencer_7) : '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: T.dim }}>{p.vigente > 0 ? fmt(p.vigente) : '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: T.text }}>{fmt(p.saldo_total)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: bc.bg, color: bc.color, border: `1px solid ${bc.bd}` }}>
                          {diasLabel(p.dias_maximo_vencido)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: T.wine, fontWeight: 600 }}>Ver →</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Cheques emitidos pendientes de acreditar */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Cheques emitidos por acreditar</span>
            {chequesVencidos.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: T.red, background: T.redBg, border: `1px solid ${T.redBd}`, borderRadius: 20, padding: '2px 10px' }}>
                {chequesVencidos.length} pasados de fecha
              </span>
            )}
          </div>
          {cheques.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: T.dim, fontSize: 13 }}>No hay cheques emitidos pendientes de acreditar</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['N° cheque', 'Banco', 'Beneficiario', 'Factura', 'Monto', 'Vencimiento', ''].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: h === 'Monto' ? 'right' : 'left', fontSize: 10.5, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cheques.map(c => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: T.text }}>{c.nro_cheque || '—'}</td>
                    <td style={{ padding: '10px 14px', color: T.muted }}>{c.banco || '—'}</td>
                    <td style={{ padding: '10px 14px', color: T.text }}>{c.beneficiario}</td>
                    <td style={{ padding: '10px 14px', color: T.muted, fontFamily: 'monospace', fontSize: 12 }}>{c.compra_numero || '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: T.text }}>{fmt(c.monto)}</td>
                    <td style={{ padding: '10px 14px', color: T.muted }}>{fmtDate(c.fecha_pago)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
                        background: c.dias > 0 ? T.redBg : c.dias >= -7 ? T.amberBg : T.greenBg,
                        color: c.dias > 0 ? T.red : c.dias >= -7 ? T.amber : T.green,
                        border: `1px solid ${c.dias > 0 ? T.redBd : c.dias >= -7 ? T.amberBd : T.greenBd}`,
                      }}>
                        {diasLabel(c.dias)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal detalle proveedor */}
      {modalProveedor && (
        <div
          onMouseDown={onOverlayMouseDown} onClick={e => onOverlayClick(e, () => setModalProveedor(null))}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.4)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, width: '100%', maxWidth: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{modalProveedor.proveedor_nombre}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Debemos <strong style={{ color: T.wine }}>{fmt(modalProveedor.saldo_total)}</strong> en {modalProveedor.cantidad_facturas} factura{modalProveedor.cantidad_facturas !== 1 ? 's' : ''}</div>
              </div>
              <button onClick={() => setModalProveedor(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Factura', 'Vencimiento', 'Pendiente', 'Estado', ''].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: h === 'Pendiente' ? 'right' : 'left', fontSize: 10.5, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modalProveedor.facturas.map(f => (
                    <tr key={f.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600, color: T.text, fontSize: 12 }}>{f.numero}</div>
                        {f.nro_factura && <div style={{ fontSize: 10.5, color: T.dim }}>Fact. {f.nro_factura}</div>}
                      </td>
                      <td style={{ padding: '10px 16px', color: T.muted, fontSize: 12 }}>{fmtDate(f.fecha_vencimiento || f.fecha_factura || null)}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: T.text }}>
                        {fmt(f.pendiente)}
                        {f.monto_pagado > 0 && <div style={{ fontSize: 10, fontWeight: 400, color: T.amber }}>ya pagó {fmt(f.monto_pagado)}</div>}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: f.dias > 0 ? T.redBg : T.greenBg, color: f.dias > 0 ? T.red : T.green, border: `1px solid ${f.dias > 0 ? T.redBd : T.greenBd}` }}>
                          {diasLabel(f.dias)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => abrirPago(f, modalProveedor.proveedor_nombre, modalProveedor.proveedor_id)}
                          style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Pagar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalProveedor(null)} style={{ background: T.bg, border: `1px solid ${T.border2}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal registrar pago */}
      {pagoFactura && (
        <div
          onMouseDown={onOverlayMouseDown} onClick={e => onOverlayClick(e, () => { if (!pagando) setPagoFactura(null) })}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(6px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Registrar pago</div>
              <button onClick={() => setPagoFactura(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12, color: T.muted }}>
                {pagoFactura.numero} — falta <strong style={{ color: T.wine }}>{fmt(pagoFactura.pendiente)}</strong>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Monto de este pago</label>
                <input type="number" autoFocus value={pMonto || ''} onChange={e => setPMonto(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Medio de pago</label>
                <select value={pMedioPago} onChange={e => setPMedioPago(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit' }}>
                  {MEDIOS_PAGO.map(mp => <option key={mp}>{mp}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Fecha de pago</label>
                <input type="date" value={pFecha} onChange={e => setPFecha(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>

              {pMedioPago === 'Cheque' && (
                <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Datos del cheque
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 11, color: T.muted, marginBottom: 5 }}>N° de cheque</label>
                      <input value={pChNumero} onChange={e => setPChNumero(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 11, color: T.muted, marginBottom: 5 }}>Banco</label>
                      <input value={pChBanco} onChange={e => setPChBanco(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: T.muted, marginBottom: 5 }}>Fecha de cobro del cheque</label>
                    <input type="date" value={pChFecha} onChange={e => setPChFecha(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setPagoFactura(null)} disabled={pagando} style={{ background: T.bg, border: `1px solid ${T.border2}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button disabled={pagando || !pMonto} onClick={confirmarPago} style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: pagando ? 'default' : 'pointer', opacity: pagando || !pMonto ? 0.6 : 1, fontFamily: 'inherit' }}>
                {pagando ? 'Guardando...' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
