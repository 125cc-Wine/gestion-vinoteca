'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const T = {
  bg:      '#F5F1EC',
  surface: '#FFFFFF',
  surface2:'#FDFAF6',
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

interface DashData {
  alertas: {
    sinStock: { nombre: string; bodega: string }[]
    stockBajo: { nombre: string; bodega: string; stock: number; stock_minimo: number }[]
    vencidos: { id: string; numero: string; cliente_nombre: string; total: number; created_at: string }[]
    pedidosPendientes: number
  }
  ventasHoy: { total: number; cantidad: number }
  ventasMes: { total: number; cantidad: number }
  caja: { ingresos: number; egresos: number; saldo: number }
  vendedores: { nombre: string; total: number; cantidad: number }[]
  cuentasCorrientes: { cantidad: number; total: number }
  topProductos: { nombre: string; cantidad: number; total: number }[]
}

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

function fmt(n: number) { return '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 }) }

function getDiaSaludo() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function getHoy() {
  return new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// Mini gráfico SVG de barras
function MiniBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1)
  const w = 6, gap = 3, h = 32
  return (
    <svg width={values.length * (w + gap) - gap} height={h} style={{ display: 'block' }}>
      {values.map((v, i) => {
        const barH = Math.max((v / max) * h, 2)
        return <rect key={i} x={i * (w + gap)} y={h - barH} width={w} height={barH} rx={2} fill={color} opacity={i === values.length - 1 ? 1 : 0.4} />
      })}
    </svg>
  )
}

const QUICK_ACTIONS = [
  { label: 'Nueva venta',     sub: 'Ventas',     href: '/ventas',    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: T.wine },
  { label: 'Nuevo cliente',   sub: 'Clientes',   href: '/clientes',  icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', color: T.brown },
  { label: 'Registrar pago',  sub: 'Caja',       href: '/caja',      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', color: T.green },
  { label: 'Ver productos',   sub: 'Catálogo',   href: '/productos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: T.gold },
  { label: 'Ver reportes',    sub: 'Análisis',   href: '/reportes',  icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: T.blue },
  { label: 'Ver pedidos',     sub: 'Pedidos',    href: '/pedidos',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', color: T.amber },
]

const VEND_COLORS = [T.wine, T.gold, T.blue, T.green, T.brown]

export default function DashboardPage() {
  const [empresa, setEmpresa] = useState<string>('aroma')
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const router = useRouter()

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e)
    cargar(e)
    const interval = setInterval(() => cargar(e), 60000)
    return () => clearInterval(interval)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    const res = await fetch(`/api/dashboard?empresa=${emp}`)
    setData(await res.json())
    setLastUpdate(new Date())
    setLoading(false)
  }

  if (loading && !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', background: T.bg }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${T.border2}`, borderTopColor: T.wine, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 13, color: T.muted }}>Cargando datos...</div>
      </div>
    </div>
  )
  if (!data) return null

  const totalAlertas = data.alertas.sinStock.length + data.alertas.stockBajo.length
  const esAroma = empresa === 'aroma'
  const cristian = data.vendedores.find(v => v.nombre === 'Cristian')
  const vendLocal = data.vendedores.filter(v => v.nombre !== 'Cristian')
  const maxVend = Math.max(...data.vendedores.map(v => v.total), 1)
  const mesVsHoy = data.ventasMes.total > 0 ? Math.round((data.ventasHoy.total / data.ventasMes.total) * 100) : 0

  // Barras simuladas proporcionales para sparkline (distribución estimada del mes)
  const mesTotal = data.ventasMes.total
  const fakeWeeks = [mesTotal * 0.2, mesTotal * 0.22, mesTotal * 0.25, mesTotal * 0.33, data.ventasHoy.total]

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .kpi:hover { box-shadow: 0 4px 16px rgba(26,18,16,0.1); transform: translateY(-1px); }
        .kpi { transition: box-shadow 0.15s, transform 0.15s; }
        .qa:hover { background: #F5F1EC !important; border-color: ${T.border2} !important; box-shadow: 0 2px 8px rgba(26,18,16,0.08); transform: translateY(-1px); }
        .qa { transition: all 0.15s; }
        .tr:hover { background: #FDFAF6; }
        .lbtn:hover { opacity: 0.6; }
        .ralert:hover { background: rgba(0,0,0,0.025); }
        .dash-header { padding: 20px 32px; }
        .dash-wrap { padding: 24px 32px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
        @media (max-width: 767px) {
          .dash-header { padding: 14px 16px; }
          .dash-wrap { padding: 12px 14px; }
          .kpi-grid { grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
          .kpi { padding: 14px !important; }
          .kpi .kpi-num { font-size: 22px !important; }
          .qa-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
          .dash-cols { grid-template-columns: 1fr !important; }
          .dash-header-row { flex-direction: column; align-items: flex-start !important; gap: 8px; }
        }
      `}</style>

      {/* ── Header de página ─────────────────────────────────────────────── */}
      <div className="dash-header" style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div className="dash-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 12, color: T.dim, marginBottom: 4, textTransform: 'capitalize' }}>{getHoy()}</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, lineHeight: 1 }}>
              {getDiaSaludo()},{' '}
              <span style={{ color: esAroma ? T.wine : T.blue }}>{esAroma ? 'Aroma de Vid' : 'La Vid Consultora'}</span>
            </h1>
            {lastUpdate && (
              <div style={{ fontSize: 11, color: T.dim, marginTop: 5 }}>
                Datos actualizados a las {lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
          <button className="lbtn" onClick={() => cargar(empresa)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: T.muted, fontSize: 12, transition: 'opacity 0.15s', fontFamily: 'inherit' }}>
            <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" size={13} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="dash-wrap">

        {/* ── KPIs ─────────────────────────────────────────────────────────── */}
        <div className="kpi-grid">

          {/* Ventas hoy */}
          <div className="kpi" style={{ background: T.surface, border: `1px solid ${T.wineBd}`, borderRadius: 12, padding: '20px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.06)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.wine}, ${T.brown})` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ventas hoy</div>
              <div style={{ background: T.wineBg, borderRadius: 8, padding: 7, color: T.wine }}><Icon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 13v-1m0-6V9m-5.5 4h11" size={14} /></div>
            </div>
            <div className="kpi-num" style={{ fontSize: 30, fontWeight: 800, color: T.wine, letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(data.ventasHoy.total)}</div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 6 }}>{data.ventasHoy.cantidad} comprobantes · {mesVsHoy}% del mes</div>
          </div>

          {/* Ventas mes */}
          <div className="kpi" style={{ background: T.surface, border: `1px solid ${T.goldBd}`, borderRadius: 12, padding: '20px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.06)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.gold}, ${T.amber})` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ventas del mes</div>
              <MiniBar values={fakeWeeks} color={T.gold} />
            </div>
            <div className="kpi-num" style={{ fontSize: 30, fontWeight: 800, color: T.gold, letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(data.ventasMes.total)}</div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 6 }}>{data.ventasMes.cantidad} comprobantes emitidos</div>
          </div>

          {/* Caja */}
          <div className="kpi" style={{ background: T.surface, border: `1px solid ${data.caja.saldo >= 0 ? T.greenBd : T.redBd}`, borderRadius: 12, padding: '20px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.06)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: data.caja.saldo >= 0 ? `linear-gradient(90deg, ${T.green}, #5BAF80)` : `linear-gradient(90deg, ${T.red}, #E05555)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Saldo caja hoy</div>
              <div style={{ background: data.caja.saldo >= 0 ? T.greenBg : T.redBg, borderRadius: 8, padding: 7, color: data.caja.saldo >= 0 ? T.green : T.red }}><Icon d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" size={14} /></div>
            </div>
            <div className="kpi-num" style={{ fontSize: 30, fontWeight: 800, color: data.caja.saldo >= 0 ? T.green : T.red, letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(data.caja.saldo)}</div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 6 }}>
              <span style={{ color: T.green }}>↑ {fmt(data.caja.ingresos)}</span>
              {' · '}
              <span style={{ color: T.red }}>↓ {fmt(data.caja.egresos)}</span>
            </div>
          </div>

          {/* Cuentas corrientes */}
          <div className="kpi" style={{ background: T.surface, border: `1px solid ${T.blueBd}`, borderRadius: 12, padding: '20px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.06)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.blue}, #5A8FD0)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cta. corrientes</div>
              <div style={{ background: T.blueBg, borderRadius: 8, padding: 7, color: T.blue }}><Icon d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" size={14} /></div>
            </div>
            <div className="kpi-num" style={{ fontSize: 30, fontWeight: 800, color: T.blue, letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(data.cuentasCorrientes.total)}</div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 6 }}>{data.cuentasCorrientes.cantidad} clientes con saldo pendiente</div>
          </div>
        </div>

        {/* ── Alertas ────────────────────────────────────────────────────────── */}
        {(totalAlertas > 0 || data.alertas.vencidos.length > 0 || data.alertas.pedidosPendientes > 0) && (
          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>

            {totalAlertas > 0 && (
              <div style={{ background: T.surface, border: `1px solid ${T.amberBd}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${T.amberBd}`, background: T.amberBg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.amber }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.amber }}>Stock bajo o sin stock — {totalAlertas} producto{totalAlertas !== 1 ? 's' : ''}</span>
                  </div>
                  <button className="lbtn" onClick={() => router.push('/productos')} style={{ fontSize: 12, color: T.amber, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', transition: 'opacity 0.15s' }}>
                    Ir a productos →
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {data.alertas.sinStock.length > 0 && (
                    <div style={{ padding: '12px 18px', borderRight: data.alertas.stockBajo.length > 0 ? `1px solid ${T.amberBd}` : 'none' }}>
                      <div style={{ fontSize: 10, color: T.red, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Sin stock ({data.alertas.sinStock.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {data.alertas.sinStock.slice(0, 6).map((p, i) => (
                          <div key={i} style={{ fontSize: 12, color: T.red, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.red, flexShrink: 0, display: 'inline-block' }} />
                            {p.nombre}{p.bodega ? <span style={{ color: T.dim }}> · {p.bodega}</span> : ''}
                          </div>
                        ))}
                        {data.alertas.sinStock.length > 6 && <div style={{ fontSize: 11, color: T.dim }}>+{data.alertas.sinStock.length - 6} más</div>}
                      </div>
                    </div>
                  )}
                  {data.alertas.stockBajo.length > 0 && (
                    <div style={{ padding: '12px 18px' }}>
                      <div style={{ fontSize: 10, color: T.amber, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Stock bajo ({data.alertas.stockBajo.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {data.alertas.stockBajo.slice(0, 6).map((p, i) => (
                          <div key={i} style={{ fontSize: 12, color: T.amber, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.amber, flexShrink: 0, display: 'inline-block' }} />
                            {p.nombre} — <span style={{ color: T.dim }}>{p.stock} u.</span>
                          </div>
                        ))}
                        {data.alertas.stockBajo.length > 6 && <div style={{ fontSize: 11, color: T.dim }}>+{data.alertas.stockBajo.length - 6} más</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              {data.alertas.vencidos.length > 0 && (
                <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.redBd}`, borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: T.redBg, borderBottom: `1px solid ${T.redBd}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.red }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.red }}>Vencidos +30 días ({data.alertas.vencidos.length})</span>
                    </div>
                    <button className="lbtn" onClick={() => router.push('/ventas')} style={{ fontSize: 11, color: T.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', transition: 'opacity 0.15s' }}>Ver →</button>
                  </div>
                  <div style={{ padding: '8px 4px' }}>
                    {data.alertas.vencidos.slice(0, 4).map((v, i) => (
                      <div key={i} className="ralert" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.muted, padding: '6px 12px', borderRadius: 6, transition: 'background 0.1s', cursor: 'default' }}>
                        <span><strong style={{ color: T.text }}>{v.numero}</strong> — {v.cliente_nombre}</span>
                        <span style={{ fontWeight: 700, color: T.red }}>{fmt(v.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.alertas.pedidosPendientes > 0 && (
                <div style={{ background: T.surface, border: `1px solid ${T.blueBd}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 300, boxShadow: '0 1px 4px rgba(26,18,16,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: T.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.blue }}>
                      <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.blue }}>
                        {data.alertas.pedidosPendientes} pedido{data.alertas.pedidosPendientes !== 1 ? 's' : ''} pendiente{data.alertas.pedidosPendientes !== 1 ? 's' : ''}
                      </div>
                      <div style={{ fontSize: 11, color: T.dim }}>de entrega</div>
                    </div>
                  </div>
                  <button className="lbtn" onClick={() => router.push('/pedidos')} style={{ fontSize: 12, color: T.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', transition: 'opacity 0.15s' }}>Ver pedidos →</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Grid principal ─────────────────────────────────────────────────── */}
        <div className="dash-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

          {/* Panel vendedores */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Vendedores — mes actual</span>
              <span style={{ fontSize: 11, color: T.dim }}>{data.vendedores.length} activos</span>
            </div>
            <div style={{ padding: '16px 18px' }}>
              {data.vendedores.length === 0 ? (
                <div style={{ fontSize: 13, color: T.dim, textAlign: 'center', padding: '20px 0' }}>Sin ventas registradas</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {vendLocal.map((v, i) => {
                    const pct = (v.total / maxVend) * 100
                    const clr = VEND_COLORS[i % VEND_COLORS.length]
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{v.nombre}</span>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: clr }}>{fmt(v.total)}</span>
                            <span style={{ fontSize: 10, color: T.dim, marginLeft: 5 }}>{v.cantidad}v.</span>
                          </div>
                        </div>
                        <div style={{ height: 6, background: T.bg, borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${clr}, ${clr}BB)`, width: `${pct}%`, transition: 'width 0.7s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {cristian && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Cristian — externo</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.01em' }}>{fmt(cristian.total)}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{cristian.cantidad} comprobantes</div>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: T.wineBg, border: `1px solid ${T.wineBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍷</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top productos */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Top productos — mes</span>
              <button className="lbtn" onClick={() => router.push('/productos')} style={{ fontSize: 11, color: T.wine, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', transition: 'opacity 0.15s' }}>Ver todos →</button>
            </div>
            {data.topProductos.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: 13, color: T.dim }}>Sin datos este mes</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    <th style={{ padding: '8px 18px', fontSize: 10, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>#</th>
                    <th style={{ padding: '8px 8px', fontSize: 10, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Producto</th>
                    <th style={{ padding: '8px 8px', fontSize: 10, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right', borderBottom: `1px solid ${T.border}` }}>Un.</th>
                    <th style={{ padding: '8px 18px', fontSize: 10, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right', borderBottom: `1px solid ${T.border}` }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProductos.map((p, i) => (
                    <tr key={i} className="tr" style={{ borderBottom: i < data.topProductos.length - 1 ? `1px solid ${T.border}` : 'none', transition: 'background 0.1s', cursor: 'default' }}>
                      <td style={{ padding: '9px 18px' }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: i === 0 ? T.goldBg : i === 1 ? 'rgba(150,150,150,0.1)' : i === 2 ? 'rgba(150,90,40,0.08)' : 'transparent',
                          color: i === 0 ? T.gold : i === 1 ? '#909090' : i === 2 ? '#906030' : T.dim,
                          fontSize: 11, fontWeight: 800,
                        }}>{i + 1}</div>
                      </td>
                      <td style={{ padding: '9px 8px' }}>
                        <div style={{ fontSize: 12, color: T.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{p.nombre}</div>
                      </td>
                      <td style={{ padding: '9px 8px', textAlign: 'right', fontSize: 12, color: T.muted }}>{p.cantidad}</td>
                      <td style={{ padding: '9px 18px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: T.green }}>{fmt(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Accesos rápidos */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Accesos rápidos</span>
            </div>
            <div className="qa-grid" style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {QUICK_ACTIONS.map((a, i) => (
                <button key={i} className="qa" onClick={() => router.push(a.href)}
                  style={{
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 9, padding: '12px 12px', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${a.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color }}>
                    <Icon d={a.icon} size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.dim, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{a.sub}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginTop: 2 }}>{a.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
