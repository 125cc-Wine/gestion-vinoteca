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
  brown:   '#633A2C',
  gold:    '#B88A2C',
  goldBg:  'rgba(184,138,44,0.08)',
  goldBd:  'rgba(184,138,44,0.22)',
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
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 7,
  color: T.text,
  padding: '7px 10px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.12s',
}

const fmt = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const fmtN = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 0 })

interface Datos {
  kpis: { totalVentas: number; cantVentas: number; ticketPromedio: number }
  ventasPorDia: { fecha: string; total: number }[]
  rankingProductos: { nombre: string; cantidad: number; total: number }[]
  porVendedor: { nombre: string; ventas: number; total: number }[]
  porCondicion: { condicion: string; ventas: number; total: number }[]
}

type Tab = 'ventas' | 'productos' | 'vendedores' | 'condicion'

function BarChart({ data, color = T.wine }: { data: { label: string; value: number }[], color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
      <svg viewBox={`0 0 ${data.length * 24} 80`} style={{ width: '100%', height: 120, overflow: 'visible' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {data.length > 1 && (() => {
          const pts = data.map((d, i) => [i * 24 + 12, 76 - (d.value / max) * 70] as [number, number])
          const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ')
          const area = `${path} L${pts[pts.length - 1][0]},78 L${pts[0][0]},78 Z`
          return (
            <>
              <path d={area} fill="url(#chartGrad)" />
              <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} />
              ))}
            </>
          )
        })()}
      </svg>
      {data.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
          {[data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].filter(Boolean).map((d, i) => (
            <span key={i} style={{ fontSize: 10, color: T.dim }}>{d.label}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function HBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ flex: 1, height: 6, background: T.bg, borderRadius: 3, overflow: 'hidden', border: `1px solid ${T.border}` }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
    </div>
  )
}

export default function ReportesPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [datos, setDatos] = useState<Datos | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('ventas')
  const [desde, setDesde] = useState(() => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 2); return d.toISOString().split('T')[0]
  })
  const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e); cargar(e, desde, hasta)
  }, [])

  async function cargar(emp: string, d: string, h: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/reportes?empresa=${emp}&desde=${d}&hasta=${h}`)
      const data = await res.json()
      if (!data.error) setDatos(data)
    } finally {
      setLoading(false)
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'ventas',     label: 'Ventas por período' },
    { id: 'productos',  label: 'Ranking productos' },
    { id: 'vendedores', label: 'Por vendedor' },
    { id: 'condicion',  label: 'Condición de pago' },
  ]

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .tr:hover { background: #FDFAF6 !important; }
        input:focus, select:focus { border-color: ${T.border2} !important; box-shadow: 0 0 0 3px rgba(128,0,0,0.08) !important; }
      `}</style>

      {/* Page header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Reportes</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: '3px 0 0' }}>{empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" style={INP} value={desde} onChange={e => { setDesde(e.target.value); cargar(empresa, e.target.value, hasta) }} />
          <span style={{ color: T.dim, fontSize: 13 }}>—</span>
          <input type="date" style={INP} value={hasta} onChange={e => { setHasta(e.target.value); cargar(empresa, desde, e.target.value) }} />
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* KPIs */}
        {datos && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total ventas',       value: fmt(datos.kpis.totalVentas),      color: T.green },
              { label: 'Cantidad de ventas', value: fmtN(datos.kpis.cantVentas),      color: T.text  },
              { label: 'Ticket promedio',    value: fmt(datos.kpis.ticketPromedio),    color: T.amber },
            ].map(k => (
              <div key={k.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: `1px solid ${T.border}` }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ background: 'none', border: 'none', color: tab === t.id ? T.text : T.muted, fontSize: 13, fontWeight: tab === t.id ? 700 : 400, padding: '8px 14px', cursor: 'pointer', borderBottom: tab === t.id ? `2px solid ${T.wine}` : '2px solid transparent', marginBottom: -1, fontFamily: 'inherit', transition: 'color 0.12s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 64, textAlign: 'center', color: T.muted, fontSize: 13 }}>Cargando...</div>
        ) : !datos ? (
          <div style={{ padding: 64, textAlign: 'center', color: T.muted, fontSize: 13 }}>Sin datos</div>
        ) : (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>

            {/* Ventas por período */}
            {tab === 'ventas' && (
              <div>
                <h2 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Evolución de ventas</h2>
                {datos.ventasPorDia.length === 0 ? (
                  <p style={{ color: T.dim, textAlign: 'center', padding: 40, fontSize: 13 }}>Sin ventas en el período</p>
                ) : (
                  <>
                    <BarChart
                      data={datos.ventasPorDia.map(d => ({
                        label: new Date(d.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
                        value: d.total,
                      }))}
                      color={T.wine}
                    />
                    <div style={{ marginTop: 24, overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: T.bg }}>
                            {['Fecha', 'Total'].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Total' ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...datos.ventasPorDia].reverse().map(d => (
                            <tr key={d.fecha} className="tr" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}>
                              <td style={{ padding: '9px 12px', color: T.muted }}>{new Date(d.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                              <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: T.green }}>{fmt(d.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Ranking productos */}
            {tab === 'productos' && (
              <div>
                <h2 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top 20 productos por facturación</h2>
                {datos.rankingProductos.length === 0 ? (
                  <p style={{ color: T.dim, textAlign: 'center', padding: 40, fontSize: 13 }}>Sin datos</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {datos.rankingProductos.map((p, i) => {
                      const maxTotal = datos.rankingProductos[0].total
                      return (
                        <div key={p.nombre} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 11, color: T.dim, width: 20, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{p.nombre}</span>
                              <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                                <span style={{ fontSize: 12, color: T.muted }}>{fmtN(p.cantidad)} u.</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{fmt(p.total)}</span>
                              </div>
                            </div>
                            <HBar pct={(p.total / maxTotal) * 100} color={i === 0 ? T.wine : i < 3 ? T.brown : T.border2} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Por vendedor */}
            {tab === 'vendedores' && (
              <div>
                <h2 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ventas por vendedor</h2>
                {datos.porVendedor.length === 0 ? (
                  <p style={{ color: T.dim, textAlign: 'center', padding: 40, fontSize: 13 }}>Sin datos</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {datos.porVendedor.map((v, i) => {
                      const maxTotal = datos.porVendedor[0].total
                      return (
                        <div key={v.nombre} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 11, color: T.dim, width: 20, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{v.nombre}</span>
                              <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                                <span style={{ fontSize: 12, color: T.muted }}>{v.ventas} venta{v.ventas !== 1 ? 's' : ''}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{fmt(v.total)}</span>
                              </div>
                            </div>
                            <HBar pct={(v.total / maxTotal) * 100} color={T.amber} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Condición de pago */}
            {tab === 'condicion' && (
              <div>
                <h2 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Distribución por condición de pago</h2>
                {datos.porCondicion.length === 0 ? (
                  <p style={{ color: T.dim, textAlign: 'center', padding: 40, fontSize: 13 }}>Sin datos</p>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
                      {datos.porCondicion.map(c => (
                        <div key={c.condicion} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{c.condicion}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 2 }}>{fmt(c.total)}</div>
                          <div style={{ fontSize: 11, color: T.muted }}>{c.ventas} venta{c.ventas !== 1 ? 's' : ''}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {datos.porCondicion.map(c => {
                        const totalGlobal = datos.porCondicion.reduce((a, x) => a + x.total, 0)
                        const pct = totalGlobal ? (c.total / totalGlobal) * 100 : 0
                        return (
                          <div key={c.condicion} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 13, width: 140, flexShrink: 0, color: T.text }}>{c.condicion}</span>
                            <HBar pct={pct} color={T.wine} />
                            <span style={{ fontSize: 12, color: T.muted, width: 44, textAlign: 'right', flexShrink: 0 }}>{pct.toFixed(1)}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
