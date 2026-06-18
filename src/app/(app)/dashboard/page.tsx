'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  bg:      '#F4EEE6',
  surface: '#FFFFFF',
  card:    '#FFFFFF',
  border:  '#E8DDD0',
  border2: '#D4C4B0',
  text:    '#1C1410',
  muted:   '#7A6858',
  dim:     '#B0A090',
  accent:  '#8B1A2A',
  accentL: '#B02840',
  gold:    '#B08020',
  goldL:   '#C99030',
  green:   '#2E7A4F',
  greenBg: 'rgba(46,122,79,0.08)',
  red:     '#C03030',
  redBg:   'rgba(192,48,48,0.08)',
  blue:    '#3070A8',
  blueBg:  'rgba(48,112,168,0.08)',
  amber:   '#B07010',
  amberBg: 'rgba(176,112,16,0.08)',
  purple:  '#7A50A0',
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

const QUICK = [
  { label: 'Nueva venta',    sub: 'Ventas',     href: '/ventas',    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Nuevo cliente',  sub: 'Clientes',   href: '/clientes',  icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  { label: 'Registrar pago', sub: 'Caja',       href: '/caja',      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Ver productos',  sub: 'Catálogo',   href: '/productos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: 'Ver reportes',   sub: 'Análisis',   href: '/reportes',  icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Compras',        sub: 'Proveedores',href: '/compras',   icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
]

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

function getDiaSaludo() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function getHoy() {
  return new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

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
    const d = await res.json()
    setData(d)
    setLastUpdate(new Date())
    setLoading(false)
  }

  if (loading && !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', background: C.bg }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${C.border2}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 13, color: C.muted }}>Cargando datos...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!data) return null

  const totalAlertas = data.alertas.sinStock.length + data.alertas.stockBajo.length
  const esAroma = empresa === 'aroma'
  const cristian = data.vendedores.find(v => v.nombre === 'Cristian')
  const locales = data.vendedores.filter(v => v.nombre !== 'Cristian')
  const maxVendedor = Math.max(...data.vendedores.map(v => v.total), 1)

  const kpis = [
    {
      label: 'Ventas hoy', value: data.ventasHoy.total,
      sub: `${data.ventasHoy.cantidad} comprobantes`,
      color: C.accent, bg: 'rgba(139,26,42,0.07)', border: 'rgba(139,26,42,0.18)',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 13v-1m0-6V9m-5.5 4h11',
    },
    {
      label: 'Ventas del mes', value: data.ventasMes.total,
      sub: `${data.ventasMes.cantidad} comprobantes`,
      color: C.gold, bg: C.amberBg, border: 'rgba(176,128,32,0.22)',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      label: 'Saldo caja hoy', value: data.caja.saldo,
      sub: `Ingr. ${fmt(data.caja.ingresos)} / Egr. ${fmt(data.caja.egresos)}`,
      color: data.caja.saldo >= 0 ? C.green : C.red,
      bg: data.caja.saldo >= 0 ? C.greenBg : C.redBg,
      border: data.caja.saldo >= 0 ? 'rgba(46,122,79,0.22)' : 'rgba(192,48,48,0.22)',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    },
    {
      label: 'Cuentas corrientes', value: data.cuentasCorrientes.total,
      sub: `${data.cuentasCorrientes.cantidad} clientes con saldo`,
      color: C.blue, bg: C.blueBg, border: 'rgba(48,112,168,0.22)',
      icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    },
  ]

  const vendColors = [C.accent, C.gold, C.blue, C.green, C.purple]

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '28px 32px', color: C.text }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .q-card { transition: all 0.15s ease; cursor: pointer; }
        .q-card:hover { background: ${C.bg} !important; border-color: ${C.border2} !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(28,20,16,0.08); }
        .kpi-card { transition: box-shadow 0.15s, transform 0.15s; }
        .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(28,20,16,0.1); }
        .alert-row:hover { background: rgba(0,0,0,0.04) !important; }
        .ref-btn:hover { opacity: 0.6; }
        .top-row:hover { background: ${C.bg} !important; border-radius: 6px; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 12, color: C.dim, marginBottom: 4, textTransform: 'capitalize' }}>{getHoy()}</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
            {getDiaSaludo()},&nbsp;
            <span style={{ color: esAroma ? C.accent : C.blue }}>
              {esAroma ? 'Aroma de Vid' : 'La Vid Consultora'}
            </span>
          </h1>
        </div>
        <button className="ref-btn" onClick={() => cargar(empresa)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: C.muted, fontSize: 12, transition: 'opacity 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" size={13} />
          {lastUpdate ? lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : 'Actualizar'}
        </button>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="kpi-card" style={{
            background: C.card, border: `1px solid ${kpi.border}`,
            borderRadius: 12, padding: '18px 20px', position: 'relative', overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(28,20,16,0.06)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${kpi.color}, transparent)`, borderRadius: '12px 12px 0 0' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{kpi.label}</span>
              <div style={{ color: kpi.color, background: kpi.bg, borderRadius: 8, padding: 7 }}>
                <Icon d={kpi.icon} size={14} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, lineHeight: 1, marginBottom: 5, letterSpacing: '-0.02em' }}>
              {fmt(kpi.value)}
            </div>
            <div style={{ fontSize: 11, color: C.dim }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Alertas ─────────────────────────────────────────────────────────── */}
      {(totalAlertas > 0 || data.alertas.vencidos.length > 0 || data.alertas.pedidosPendientes > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>

          {totalAlertas > 0 && (
            <div style={{ background: C.amberBg, border: `1px solid rgba(176,112,16,0.22)`, borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.amber }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.amber }}>Alertas de stock — {totalAlertas} producto{totalAlertas > 1 ? 's' : ''}</span>
                </div>
                <button className="ref-btn" onClick={() => router.push('/productos')} style={{ fontSize: 11, color: C.amber, background: 'none', border: 'none', cursor: 'pointer', transition: 'opacity 0.15s', fontWeight: 600 }}>
                  Ver productos →
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {data.alertas.sinStock.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: C.red, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sin stock ({data.alertas.sinStock.length})</div>
                    {data.alertas.sinStock.slice(0, 6).map((p, i) => (
                      <div key={i} style={{ fontSize: 11, color: C.red, display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0', opacity: 0.8 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.red, flexShrink: 0, display: 'inline-block' }} />
                        {p.nombre}
                      </div>
                    ))}
                    {data.alertas.sinStock.length > 6 && <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>+{data.alertas.sinStock.length - 6} más</div>}
                  </div>
                )}
                {data.alertas.stockBajo.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: C.amber, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stock bajo ({data.alertas.stockBajo.length})</div>
                    {data.alertas.stockBajo.slice(0, 6).map((p, i) => (
                      <div key={i} style={{ fontSize: 11, color: C.amber, display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0', opacity: 0.85 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.amber, flexShrink: 0, display: 'inline-block' }} />
                        {p.nombre} — <span style={{ color: C.dim }}>{p.stock} u.</span>
                      </div>
                    ))}
                    {data.alertas.stockBajo.length > 6 && <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>+{data.alertas.stockBajo.length - 6} más</div>}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {data.alertas.vencidos.length > 0 && (
              <div style={{ flex: 1, background: C.redBg, border: `1px solid rgba(192,48,48,0.2)`, borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.red }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.red }}>Vencidos +30 días ({data.alertas.vencidos.length})</span>
                  </div>
                  <button className="ref-btn" onClick={() => router.push('/ventas')} style={{ fontSize: 11, color: C.red, background: 'none', border: 'none', cursor: 'pointer', transition: 'opacity 0.15s', fontWeight: 600 }}>Ver →</button>
                </div>
                {data.alertas.vencidos.slice(0, 3).map((v, i) => (
                  <div key={i} className="alert-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.red, padding: '4px 6px', borderRadius: 5, transition: 'background 0.1s', opacity: 0.8 }}>
                    <span><strong>{v.numero}</strong> — {v.cliente_nombre}</span>
                    <span style={{ fontWeight: 700 }}>{fmt(v.total)}</span>
                  </div>
                ))}
              </div>
            )}
            {data.alertas.pedidosPendientes > 0 && (
              <div style={{ background: C.blueBg, border: `1px solid rgba(48,112,168,0.2)`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.blue }} />
                  <span style={{ fontSize: 12, color: C.blue, fontWeight: 500 }}>
                    {data.alertas.pedidosPendientes} pedido{data.alertas.pedidosPendientes > 1 ? 's' : ''} pendiente{data.alertas.pedidosPendientes > 1 ? 's' : ''}
                  </span>
                </div>
                <button className="ref-btn" onClick={() => router.push('/pedidos')} style={{ fontSize: 11, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', transition: 'opacity 0.15s', fontWeight: 600 }}>Ver →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Grid principal ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

        {/* Vendedores del mes */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(28,20,16,0.05)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Vendedores — mes actual</div>
          {data.vendedores.length === 0 ? (
            <div style={{ fontSize: 12, color: C.dim }}>Sin ventas registradas</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {data.vendedores.filter(v => v.nombre !== 'Cristian').map((v, i) => {
                const pct = (v.total / maxVendedor) * 100
                const clr = vendColors[i % vendColors.length]
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 600, color: C.text }}>{v.nombre}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: clr, fontWeight: 700 }}>{fmt(v.total)}</span>
                        <span style={{ color: C.dim, marginLeft: 6, fontSize: 10 }}>{v.cantidad}v.</span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: `linear-gradient(90deg, ${clr}, ${clr}88)`, borderRadius: 3, width: `${pct}%`, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {cristian && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Cristian — vendedor externo</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>{fmt(cristian.total)}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{cristian.cantidad} comprobantes</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(176,128,32,0.1)', border: `2px solid rgba(176,128,32,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  🍷
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top productos */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(28,20,16,0.05)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Top productos — mes</div>
          {data.topProductos.length === 0 ? (
            <div style={{ fontSize: 12, color: C.dim }}>Sin datos este mes</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {data.topProductos.map((p, i) => (
                <div key={i} className="top-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', transition: 'background 0.1s', cursor: 'default' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i === 0 ? 'rgba(176,128,32,0.12)' : i === 1 ? 'rgba(150,150,150,0.1)' : i === 2 ? 'rgba(150,90,40,0.1)' : C.bg,
                    color: i === 0 ? C.gold : i === 1 ? '#909090' : i === 2 ? '#906030' : C.dim,
                    fontSize: 11, fontWeight: 800,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{p.nombre}</div>
                    <div style={{ fontSize: 10, color: C.dim, marginTop: 1 }}>{p.cantidad} unidades</div>
                  </div>
                  <div style={{ fontSize: 12, color: C.green, fontWeight: 700, flexShrink: 0 }}>{fmt(p.total)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accesos rápidos */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(28,20,16,0.05)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Accesos rápidos</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {QUICK.map((a, i) => (
              <button key={i} className="q-card" onClick={() => router.push(a.href)}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 9, padding: '12px 12px', textAlign: 'left',
                  display: 'flex', flexDirection: 'column', gap: 7,
                  boxShadow: '0 1px 3px rgba(28,20,16,0.04)',
                }}>
                <div style={{ color: C.muted, display: 'flex' }}>
                  <Icon d={a.icon} size={14} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.dim, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{a.sub}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginTop: 2 }}>{a.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
