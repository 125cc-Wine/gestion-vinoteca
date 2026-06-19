'use client'
import { useEffect, useState, useCallback } from 'react'

const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8',
  text: '#1A1210', muted: '#6B5D55', dim: '#A89888',
  wine: '#800000', wineBg: 'rgba(128,0,0,0.07)',
  green: '#2D7A4F', greenBg: 'rgba(45,122,79,0.08)', greenBd: 'rgba(45,122,79,0.22)',
  red: '#C03030', redBg: 'rgba(192,48,48,0.08)', redBd: 'rgba(192,48,48,0.22)',
  amber: '#A07010', amberBg: 'rgba(160,112,16,0.07)', amberBd: 'rgba(160,112,16,0.22)',
  gold: '#B88A2C', goldBg: 'rgba(184,138,44,0.08)',
}

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function buildWaLink(telefono: string | null, nombre: string, monto: number, empresa: string) {
  if (!telefono) return null
  let tel = telefono.replace(/\D/g, '')
  if (tel.startsWith('0')) tel = tel.slice(1)
  const empresaNombre = empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid'
  const text = encodeURIComponent(
    `Hola ${nombre}, te recordamos que tenés un saldo pendiente de ${fmt(monto)} en ${empresaNombre}. ¡Cuando puedas nos coordinamos el pago! 🙏`
  )
  return `https://wa.me/54${tel}?text=${text}`
}

type BucketColor = 'green' | 'amber' | 'gold' | 'red'

function getBucketColor(row: AgingRow): BucketColor {
  if (row.bucket_mas90 > 0) return 'red'
  if (row.bucket_90 > 0) return 'gold'
  if (row.bucket_60 > 0) return 'amber'
  return 'green'
}

const BUCKET_STYLES: Record<BucketColor, { bg: string; bd: string; color: string }> = {
  green: { bg: T.greenBg, bd: T.greenBd, color: T.green },
  amber: { bg: T.amberBg, bd: T.amberBd, color: T.amber },
  gold:  { bg: T.goldBg,  bd: T.amberBd, color: T.gold },
  red:   { bg: T.redBg,   bd: T.redBd,   color: T.red },
}

interface AgingRow {
  cliente_id: string
  cliente_nombre: string
  telefono: string | null
  saldo_total: number
  bucket_30: number
  bucket_60: number
  bucket_90: number
  bucket_mas90: number
  dias_maximo: number
  ultima_compra: string | null
}

interface VentaDetalle {
  id: string
  total: number
  created_at: string
  dias: number
}

function KpiCard({
  label, amount, color, bg, bd,
}: { label: string; amount: number; color: string; bg: string; bd: string }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${bd}`,
      borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 160,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>
        {fmt(amount)}
      </div>
      <div style={{ fontSize: 10, color: T.dim, marginTop: 2, background: bg, borderRadius: 6, padding: '2px 7px', display: 'inline-block' }}>
        {label}
      </div>
    </div>
  )
}

export default function AgingPage() {
  const [empresa, setEmpresa] = useState<string>('aroma')
  const [rows, setRows] = useState<AgingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal detalle
  const [modalCliente, setModalCliente] = useState<AgingRow | null>(null)
  const [detalleVentas, setDetalleVentas] = useState<VentaDetalle[]>([])
  const [detalleLoading, setDetalleLoading] = useState(false)

  useEffect(() => {
    const e = localStorage.getItem('empresa')
    if (e) setEmpresa(e)
  }, [])

  const load = useCallback(async (emp: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/aging?empresa=${emp}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar')
      setRows(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(empresa) }, [empresa, load])

  async function openDetalle(row: AgingRow) {
    setModalCliente(row)
    setDetalleLoading(true)
    setDetalleVentas([])
    try {
      const res = await fetch(
        `/api/ventas?empresa=${empresa}&cliente_id=${row.cliente_id}`
      )
      const data = await res.json()
      const now = Date.now()
      const raw: { id: string; total: number; created_at: string; tipo?: string; estado_pago?: string }[] =
        Array.isArray(data) ? data : data.ventas ?? []
      const ventas: VentaDetalle[] = raw
        .filter(v => v.tipo === 'remito' && v.estado_pago === 'cuenta_corriente')
        .map(v => ({
          id: v.id,
          total: v.total,
          created_at: v.created_at,
          dias: Math.floor((now - new Date(v.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        }))
      ventas.sort((a, b) => b.dias - a.dias)
      setDetalleVentas(ventas)
    } catch {
      setDetalleVentas([])
    } finally {
      setDetalleLoading(false)
    }
  }

  // KPI totals
  const total30 = rows.reduce((s, r) => s + r.bucket_30, 0)
  const total60 = rows.reduce((s, r) => s + r.bucket_60, 0)
  const total90 = rows.reduce((s, r) => s + r.bucket_90, 0)
  const totalMas90 = rows.reduce((s, r) => s + r.bucket_mas90, 0)
  const totalGeneral = rows.reduce((s, r) => s + r.saldo_total, 0)

  // Footer totals
  const footerBucket = {
    b30: total30,
    b60: total60,
    b90: total90,
    bMas90: totalMas90,
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`
        .aging-tr { transition: background 0.1s; }
        .aging-tr:hover { filter: brightness(0.97); }
        .btn-wa:hover { opacity: 0.85; }
        .btn-ver:hover { background: ${T.wineBg} !important; }
        .sel-empresa { outline: none; }
        .aging-badge { display: inline-block; border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 700; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>
            Aging · Cuenta Corriente
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted }}>
            Antigüedad de deuda por cliente — ordenado por vencimiento
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: T.muted }}>Empresa:</span>
          <select
            className="sel-empresa"
            value={empresa}
            onChange={e => {
              setEmpresa(e.target.value)
              localStorage.setItem('empresa', e.target.value)
            }}
            style={{
              background: T.surface, border: `1px solid ${T.border2}`,
              borderRadius: 8, padding: '7px 12px', fontSize: 13,
              color: T.text, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <option value="aroma">Aroma de Vid</option>
            <option value="lavid">La Vid Consultora</option>
          </select>
          <button
            onClick={() => load(empresa)}
            style={{
              background: T.wine, color: '#fff', border: 'none', borderRadius: 8,
              padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="0–30 días" amount={total30} color={T.green} bg={T.greenBg} bd={T.greenBd} />
        <KpiCard label="31–60 días" amount={total60} color={T.amber} bg={T.amberBg} bd={T.amberBd} />
        <KpiCard label="61–90 días" amount={total90} color={T.gold} bg={T.goldBg} bd={T.amberBd} />
        <KpiCard label="+90 días" amount={totalMas90} color={T.red} bg={T.redBg} bd={T.redBd} />
        <div style={{
          background: T.wineBg, border: `1px solid rgba(128,0,0,0.22)`,
          borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 160,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.wine, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 6 }}>
            Total deuda
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.wine }}>
            {fmt(totalGeneral)}
          </div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
            {rows.length} clientes
          </div>
        </div>
      </div>

      {/* Estado carga / error */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: T.muted, fontSize: 14 }}>
          Cargando aging...
        </div>
      )}
      {!loading && error && (
        <div style={{ background: T.redBg, border: `1px solid ${T.redBd}`, borderRadius: 10, padding: '14px 20px', color: T.red, fontSize: 13 }}>
          Error: {error}
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: T.muted, fontSize: 14 }}>
              Sin clientes con saldo pendiente en {empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'}.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                    {['Cliente', 'Saldo total', '0–30 d', '31–60 d', '61–90 d', '+90 d', 'Días máx', 'Acciones'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: h === 'Cliente' ? 'left' : 'right',
                        fontSize: 11, fontWeight: 700, color: T.muted,
                        textTransform: 'uppercase' as const, letterSpacing: '0.07em',
                        whiteSpace: 'nowrap',
                        ...(h === 'Acciones' ? { textAlign: 'center' as const } : {}),
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const bColor = getBucketColor(row)
                    const bs = BUCKET_STYLES[bColor]
                    return (
                      <tr
                        key={row.cliente_id}
                        className="aging-tr"
                        style={{
                          borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none',
                          background: bs.bg,
                        }}
                      >
                        {/* Cliente */}
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ fontWeight: 600, color: T.text }}>{row.cliente_nombre}</div>
                          {row.telefono && (
                            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{row.telefono}</div>
                          )}
                          {row.ultima_compra && (
                            <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>
                              Última: {fmtDate(row.ultima_compra)}
                            </div>
                          )}
                        </td>
                        {/* Saldo total */}
                        <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: bs.color }}>
                          {fmt(row.saldo_total)}
                        </td>
                        {/* Buckets */}
                        <td style={{ padding: '11px 14px', textAlign: 'right', color: row.bucket_30 > 0 ? T.green : T.dim }}>
                          {row.bucket_30 > 0 ? fmt(row.bucket_30) : '—'}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', color: row.bucket_60 > 0 ? T.amber : T.dim }}>
                          {row.bucket_60 > 0 ? fmt(row.bucket_60) : '—'}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', color: row.bucket_90 > 0 ? T.gold : T.dim }}>
                          {row.bucket_90 > 0 ? fmt(row.bucket_90) : '—'}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', color: row.bucket_mas90 > 0 ? T.red : T.dim, fontWeight: row.bucket_mas90 > 0 ? 700 : 400 }}>
                          {row.bucket_mas90 > 0 ? fmt(row.bucket_mas90) : '—'}
                        </td>
                        {/* Días máx */}
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <span className="aging-badge" style={{ background: bs.bg, color: bs.color, border: `1px solid ${bs.bd}` }}>
                            {row.dias_maximo > 0 ? `${row.dias_maximo}d` : '—'}
                          </span>
                        </td>
                        {/* Acciones */}
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                            {/* WhatsApp */}
                            {row.telefono && buildWaLink(row.telefono, row.cliente_nombre, row.saldo_total, empresa) && (
                              <a
                                href={buildWaLink(row.telefono, row.cliente_nombre, row.saldo_total, empresa)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-wa"
                                title="Enviar recordatorio por WhatsApp"
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  width: 30, height: 30, borderRadius: 8,
                                  background: '#25D366', color: '#fff',
                                  fontSize: 14, textDecoration: 'none',
                                  transition: 'opacity 0.12s',
                                }}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                              </a>
                            )}
                            {/* Ver detalle */}
                            <button
                              className="btn-ver"
                              onClick={() => openDetalle(row)}
                              title="Ver detalle de ventas pendientes"
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                background: 'transparent', border: `1px solid ${T.border2}`,
                                borderRadius: 8, padding: '5px 10px', fontSize: 12,
                                color: T.wine, cursor: 'pointer', fontFamily: 'inherit',
                                fontWeight: 600, transition: 'background 0.12s',
                              }}
                            >
                              Ver
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Footer totales */}
                <tfoot>
                  <tr style={{ background: T.bg, borderTop: `2px solid ${T.border2}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.muted, fontSize: 12 }}>
                      TOTALES ({rows.length})
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: T.text }}>
                      {fmt(totalGeneral)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: T.green }}>
                      {fmt(footerBucket.b30)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: T.amber }}>
                      {fmt(footerBucket.b60)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: T.gold }}>
                      {fmt(footerBucket.b90)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: T.red }}>
                      {fmt(footerBucket.bMas90)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal detalle */}
      {modalCliente && (
        <div
          onClick={e => e.target === e.currentTarget && setModalCliente(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.4)',
            backdropFilter: 'blur(6px)', zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div style={{
            background: T.surface, border: `1px solid ${T.border2}`,
            borderRadius: 14, width: '100%', maxWidth: 620,
            boxShadow: '0 20px 60px rgba(26,18,16,0.18)',
            overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '18px 22px', borderBottom: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                  {modalCliente.cliente_nombre}
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                  Ventas pendientes en cuenta corriente · Saldo {fmt(modalCliente.saldo_total)}
                </div>
              </div>
              <button
                onClick={() => setModalCliente(null)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: T.muted, fontSize: 20, lineHeight: 1, padding: '4px 8px',
                  borderRadius: 6,
                }}
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '4px 0' }}>
              {detalleLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: T.muted, fontSize: 13 }}>
                  Cargando ventas...
                </div>
              ) : detalleVentas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: T.muted, fontSize: 13 }}>
                  No se encontraron ventas pendientes.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      {['Fecha', 'Remito', 'Monto', 'Días vencido', 'Estado'].map(h => (
                        <th key={h} style={{
                          padding: '8px 16px', textAlign: h === 'Fecha' || h === 'Remito' ? 'left' : 'right',
                          fontSize: 11, fontWeight: 700, color: T.muted,
                          textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                          borderBottom: `1px solid ${T.border}`,
                          ...(h === 'Estado' ? { textAlign: 'center' as const } : {}),
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detalleVentas.map((v, i) => {
                      let diasColor = T.green
                      let diasLabel = '0–30 d'
                      if (v.dias > 90) { diasColor = T.red; diasLabel = '+90 d' }
                      else if (v.dias > 60) { diasColor = T.gold; diasLabel = '61–90 d' }
                      else if (v.dias > 30) { diasColor = T.amber; diasLabel = '31–60 d' }
                      return (
                        <tr key={v.id} style={{
                          borderBottom: i < detalleVentas.length - 1 ? `1px solid ${T.border}` : 'none',
                        }}>
                          <td style={{ padding: '10px 16px', color: T.muted }}>
                            {fmtDate(v.created_at)}
                          </td>
                          <td style={{ padding: '10px 16px', color: T.dim, fontSize: 11 }}>
                            #{v.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: T.text }}>
                            {fmt(v.total)}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: diasColor }}>
                            {v.dias}d
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                              background: diasColor === T.red ? T.redBg : diasColor === T.gold ? T.goldBg : diasColor === T.amber ? T.amberBg : T.greenBg,
                              color: diasColor,
                              border: `1px solid ${diasColor}33`,
                            }}>
                              {diasLabel}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: T.bg, borderTop: `2px solid ${T.border2}` }}>
                      <td colSpan={2} style={{ padding: '10px 16px', fontWeight: 700, color: T.muted, fontSize: 12 }}>
                        {detalleVentas.length} ventas
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: T.text }}>
                        {fmt(detalleVentas.reduce((s, v) => s + v.total, 0))}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '14px 22px', borderTop: `1px solid ${T.border}`,
              display: 'flex', gap: 10, justifyContent: 'flex-end',
            }}>
              {modalCliente.telefono && buildWaLink(modalCliente.telefono, modalCliente.cliente_nombre, modalCliente.saldo_total, empresa) && (
                <a
                  href={buildWaLink(modalCliente.telefono, modalCliente.cliente_nombre, modalCliente.saldo_total, empresa)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: '#25D366', color: '#fff',
                    border: 'none', borderRadius: 8, padding: '8px 16px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Enviar WhatsApp
                </a>
              )}
              <button
                onClick={() => setModalCliente(null)}
                style={{
                  background: T.bg, border: `1px solid ${T.border2}`,
                  borderRadius: 8, padding: '8px 18px', fontSize: 13,
                  color: T.muted, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
