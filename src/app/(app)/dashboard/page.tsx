'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  bg:      '#0F0F0F',
  surface: '#141414',
  card:    '#1A1A1A',
  border:  '#2A2A2A',
  accent:  '#8B1A2A',
  text:    '#E8E8E8',
  muted:   '#888888',
  dim:     '#555555',
  green:   '#4CAF7D',
  amber:   '#D4820A',
  red:     '#E05555',
  blue:    '#7AADFF',
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

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', ...style }}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
      {children}
    </div>
  )
}

export default function DashboardPage() {
  const [empresa, setEmpresa] = useState<string>('aroma')
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
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
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, color: C.dim, fontSize: 13 }}>
      Cargando...
    </div>
  )

  if (!data) return null

  const totalAlertas = data.alertas.sinStock.length + data.alertas.stockBajo.length
  const cristian = data.vendedores.find(v => v.nombre === 'Cristian')
  const locales = data.vendedores.filter(v => v.nombre !== 'Cristian')
  const maxVendedor = locales[0]?.total || 1

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: 24, color: C.text }}>
      <style>{`
        .dash-alert-row:hover { background: rgba(255,255,255,0.03) !important; }
        .quick-card:hover { background: #222 !important; border-color: #3A3A3A !important; }
        .quick-card { transition: background 0.15s, border-color 0.15s; cursor: pointer; }
        .link-btn:hover { opacity: 0.7; }
      `}</style>

      {/* ── Alertas ─────────────────────────────────────────────────────────── */}
      {(totalAlertas > 0 || data.alertas.vencidos.length > 0 || data.alertas.pedidosPendientes > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>

          {/* Stock */}
          {totalAlertas > 0 && (
            <div style={{ background: 'rgba(212,130,10,0.07)', border: `1px solid rgba(212,130,10,0.25)`, borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.amber }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.amber }}>Alertas de stock — {totalAlertas} producto{totalAlertas > 1 ? 's' : ''}</span>
                </div>
                <button className="link-btn" onClick={() => router.push('/productos')} style={{ fontSize: 11, color: C.amber, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Ver productos →
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {data.alertas.sinStock.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: C.red, fontWeight: 600, marginBottom: 6 }}>Sin stock ({data.alertas.sinStock.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {data.alertas.sinStock.slice(0, 8).map((p, i) => (
                        <div key={i} style={{ fontSize: 11, color: '#CC8888', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.red, flexShrink: 0, display: 'inline-block' }} />
                          {p.nombre}{p.bodega ? ` · ${p.bodega}` : ''}
                        </div>
                      ))}
                      {data.alertas.sinStock.length > 8 && <div style={{ fontSize: 11, color: C.dim }}>+{data.alertas.sinStock.length - 8} más</div>}
                    </div>
                  </div>
                )}
                {data.alertas.stockBajo.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: C.amber, fontWeight: 600, marginBottom: 6 }}>Stock bajo ({data.alertas.stockBajo.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {data.alertas.stockBajo.slice(0, 8).map((p, i) => (
                        <div key={i} style={{ fontSize: 11, color: '#C8A060', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.amber, flexShrink: 0, display: 'inline-block' }} />
                          {p.nombre}{p.bodega ? ` · ${p.bodega}` : ''} — {p.stock} u.
                        </div>
                      ))}
                      {data.alertas.stockBajo.length > 8 && <div style={{ fontSize: 11, color: C.dim }}>+{data.alertas.stockBajo.length - 8} más</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vencidos */}
          {data.alertas.vencidos.length > 0 && (
            <div style={{ background: 'rgba(224,85,85,0.07)', border: `1px solid rgba(224,85,85,0.25)`, borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.red }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.red }}>Comprobantes vencidos +30 días ({data.alertas.vencidos.length})</span>
                </div>
                <button className="link-btn" onClick={() => router.push('/ventas')} style={{ fontSize: 11, color: C.red, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Ver ventas →
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {data.alertas.vencidos.map((v, i) => (
                  <div key={i} className="dash-alert-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#CC8888', padding: '5px 8px', borderRadius: 6, background: 'rgba(224,85,85,0.06)' }}>
                    <span><strong style={{ color: '#E08888' }}>{v.numero}</strong> — {v.cliente_nombre}</span>
                    <span style={{ fontWeight: 600 }}>${v.total.toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pedidos pendientes */}
          {data.alertas.pedidosPendientes > 0 && (
            <div style={{ background: 'rgba(122,173,255,0.07)', border: `1px solid rgba(122,173,255,0.2)`, borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue }} />
                <span style={{ fontSize: 13, color: C.blue }}>
                  {data.alertas.pedidosPendientes} pedido{data.alertas.pedidosPendientes > 1 ? 's' : ''} pendiente{data.alertas.pedidosPendientes > 1 ? 's' : ''} de entrega
                </span>
              </div>
              <button className="link-btn" onClick={() => router.push('/pedidos')} style={{ fontSize: 11, color: C.blue, background: 'none', border: 'none', cursor: 'pointer' }}>
                Ver pedidos →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <Card>
          <Label>Ventas hoy</Label>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.text }}>${data.ventasHoy.total.toLocaleString('es-AR')}</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{data.ventasHoy.cantidad} comprobantes</div>
        </Card>
        <Card>
          <Label>Ventas del mes</Label>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.text }}>${data.ventasMes.total.toLocaleString('es-AR')}</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{data.ventasMes.cantidad} comprobantes</div>
        </Card>
        <Card>
          <Label>Caja hoy</Label>
          <div style={{ fontSize: 26, fontWeight: 700, color: data.caja.saldo >= 0 ? C.green : C.red }}>
            ${data.caja.saldo.toLocaleString('es-AR')}
          </div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>
            <span style={{ color: C.green }}>+${data.caja.ingresos.toLocaleString('es-AR')}</span>
            {' / '}
            <span style={{ color: C.red }}>-${data.caja.egresos.toLocaleString('es-AR')}</span>
          </div>
        </Card>
        <Card>
          <Label>Cuentas corrientes</Label>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.blue }}>${data.cuentasCorrientes.total.toLocaleString('es-AR')}</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{data.cuentasCorrientes.cantidad} clientes con saldo</div>
        </Card>
      </div>

      {/* ── Panels ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>

        {/* Vendedores */}
        <Card>
          <Label>Vendedores — mes actual</Label>
          {locales.length === 0 ? (
            <div style={{ fontSize: 12, color: C.dim, paddingTop: 8 }}>Sin ventas registradas</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {locales.map((v, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, color: C.text }}>{v.nombre}</span>
                    <span style={{ color: C.muted }}>${v.total.toLocaleString('es-AR')} · {v.cantidad} v.</span>
                  </div>
                  <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: C.accent, borderRadius: 2, width: `${(v.total / maxVendedor) * 100}%`, transition: 'width 0.4s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Cristian */}
        <Card>
          <Label>Cristian — vendedor de calle</Label>
          {cristian ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4 }}>
              <div>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>Total mes</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.text }}>${cristian.total.toLocaleString('es-AR')}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 2 }}>Comprobantes</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: C.muted }}>{cristian.cantidad}</div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: C.dim, paddingTop: 8 }}>Sin ventas este mes</div>
          )}
        </Card>

        {/* Top productos */}
        <Card>
          <Label>Top productos — mes</Label>
          {data.topProductos.length === 0 ? (
            <div style={{ fontSize: 12, color: C.dim, paddingTop: 8 }}>Sin datos</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.topProductos.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ color: C.dim, fontWeight: 700, fontSize: 11, minWidth: 16 }}>{i + 1}</span>
                  <span style={{ color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</span>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: C.green, fontWeight: 600, fontSize: 11 }}>${p.total.toLocaleString('es-AR')}</div>
                    <div style={{ color: C.dim, fontSize: 10 }}>{p.cantidad} u.</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Accesos rápidos ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {[
          { label: 'Nuevo presupuesto', sub: 'Ventas', href: '/ventas' },
          { label: 'Nuevo remito',      sub: 'Ventas', href: '/ventas' },
          { label: 'Agregar producto',  sub: 'Catálogo', href: '/productos' },
          { label: 'Movimiento caja',   sub: 'Caja', href: '/caja' },
          { label: 'Ver clientes',      sub: 'Clientes', href: '/clientes' },
        ].map(a => (
          <button
            key={a.label}
            className="quick-card"
            onClick={() => router.push(a.href)}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '16px 14px', textAlign: 'left', cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 10, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{a.sub}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
