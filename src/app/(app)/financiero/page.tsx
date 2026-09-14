'use client'
import { useEffect, useState } from 'react'
import type { IndiceInflacion } from '@/types'

const T = {
  bg:      '#F5F1EC',
  surface: '#FFFFFF',
  border:  '#DDD0C0',
  border2: '#C8BAA8',
  text:    '#1A1210',
  muted:   '#6B5D55',
  dim:     '#A89888',
  wine:    '#800000',
  brown:   '#633A2C',
  gold:    '#B88A2C',
  green:   '#2D7A4F',
  greenBg: 'rgba(45,122,79,0.08)',
  greenBd: 'rgba(45,122,79,0.22)',
  red:     '#C03030',
  redBg:   'rgba(192,48,48,0.08)',
  redBd:   'rgba(192,48,48,0.22)',
  blue:    '#2B5EA0',
  blueBg:  'rgba(43,94,160,0.08)',
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
}

const fmt = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const fmtN = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 0 })

interface PorCliente { nombre: string; margenNominal: number; costoOportunidad: number; montoExpuesto: number }
interface PorProducto { nombre: string; margenNominal: number; costoOportunidad: number }
interface PorCategoria { categoria: string; margenNominal: number; costoOportunidad: number }
interface ChequeErosion { id: string; banco: string | null; monto: number; fecha_emision: string; fecha_pago: string; dias: number; costoOportunidad: number; vencido: boolean }

interface Datos {
  parametros: { ultimoMesInflacion: string | null; mesesCargados: number }
  kpis: {
    margenNominal: number; costoOportunidadCtaCte: number; costoOportunidadCheques: number
    costoOportunidadTotal: number; gananciaReal: number; pctErosion: number
    montoExpuestoActual: number; diasPromedioCobro: number
  }
  porCliente: PorCliente[]
  porProducto: PorProducto[]
  porCategoria: PorCategoria[]
  cheques: ChequeErosion[]
}

type Tab = 'cliente' | 'producto' | 'categoria' | 'cheques'

function HBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ flex: 1, height: 6, background: T.bg, borderRadius: 3, overflow: 'hidden', border: `1px solid ${T.border}` }}>
      <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
    </div>
  )
}

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
function labelMes(mesIso: string) {
  const [y, m] = mesIso.split('-').map(Number)
  return `${MESES[m - 1]} ${y}`
}
function mesActualIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function FinancieroPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [datos, setDatos] = useState<Datos | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('cliente')
  const [desde, setDesde] = useState(() => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 2); return d.toISOString().split('T')[0]
  })
  const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0])

  const [serie, setSerie] = useState<IndiceInflacion[]>([])
  const [syncing, setSyncing] = useState(false)
  const [manualValor, setManualValor] = useState('')
  const [guardandoManual, setGuardandoManual] = useState(false)
  const [showParametros, setShowParametros] = useState(false)

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e); cargar(e, desde, hasta); cargarSerie()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function cargar(emp: string, d: string, h: string) {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/financiero?empresa=${emp}&desde=${d}&hasta=${h}`)
      const data = await res.json()
      if (data.error) setError(data.error)
      else setDatos(data)
    } catch {
      setError('No se pudo cargar el análisis financiero')
    } finally {
      setLoading(false)
    }
  }

  async function cargarSerie() {
    const res = await fetch('/api/inflacion')
    const data = await res.json()
    if (Array.isArray(data)) setSerie(data)
  }

  async function sincronizar() {
    setSyncing(true)
    try {
      await fetch('/api/inflacion/sync', { method: 'POST' })
      await cargarSerie()
      await cargar(empresa, desde, hasta)
    } finally {
      setSyncing(false)
    }
  }

  async function guardarManual() {
    const v = parseFloat(manualValor.replace(',', '.'))
    if (Number.isNaN(v)) return
    setGuardandoManual(true)
    try {
      await fetch('/api/inflacion', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mes: mesActualIso(), valor_mensual: v }) })
      setManualValor('')
      await cargarSerie()
      await cargar(empresa, desde, hasta)
    } finally {
      setGuardandoManual(false)
    }
  }

  const ultimosMeses = [...serie].sort((a, b) => b.mes.localeCompare(a.mes)).slice(0, 6)
  const tieneMesActual = serie.some(s => s.mes.slice(0, 7) === mesActualIso())

  const TABS: { id: Tab; label: string }[] = [
    { id: 'cliente',   label: 'Por cliente' },
    { id: 'producto',  label: 'Por producto' },
    { id: 'categoria', label: 'Por categoría' },
    { id: 'cheques',   label: 'Cheques en cartera' },
  ]

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .tr:hover { background: #FDFAF6 !important; }
        input:focus, select:focus { border-color: ${T.border2} !important; box-shadow: 0 0 0 3px rgba(128,0,0,0.08) !important; }
      `}</style>

      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Financiero</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: '3px 0 0' }}>
            Ganancia real y costo de oportunidad — {empresa === 'aroma' ? 'Aroma de Vid' : empresa === 'lavid' ? 'La Vid Consultora' : 'Aroma de Vid + La Vid Consultora'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={empresa}
            style={{ ...INP, width: 'auto', padding: '5px 10px', fontSize: 13 }}
            onChange={e => { const emp = e.target.value; setEmpresa(emp); cargar(emp, desde, hasta) }}
          >
            <option value="aroma">Aroma de Vid</option>
            <option value="lavid">La Vid Consultora</option>
            <option value="ambas">Ambas empresas (total)</option>
          </select>
          <input type="date" style={INP} value={desde} onChange={e => { setDesde(e.target.value); cargar(empresa, e.target.value, hasta) }} />
          <span style={{ color: T.dim, fontSize: 13 }}>—</span>
          <input type="date" style={INP} value={hasta} onChange={e => { setHasta(e.target.value); cargar(empresa, desde, e.target.value) }} />
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* Explicación general */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: T.text, margin: 0, lineHeight: 1.6 }}>
            Esta página compara lo que ganaste <strong>en los papeles</strong> con lo que en la práctica te queda en el
            bolsillo. Cuando vendés a cuenta corriente, o cobrás con un cheque a fecha, esa plata no la tenés disponible
            de entrada — pasan días o meses hasta que la cobrás de verdad. En el medio, los precios suben (inflación), así
            que esos mismos pesos, cuando por fin entran, valen menos de lo que valían el día de la venta. Acá abajo
            separamos cuánto de tu margen &quot;de factura&quot; se pierde por esa demora, y cuánto te queda realmente.
          </p>
        </div>

        {/* Parámetros de inflación */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 20, overflow: 'hidden' }}>
          <button
            onClick={() => setShowParametros(s => !s)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: T.muted }}>
              Parámetros — inflación mensual (INDEC)
              {datos?.parametros.ultimoMesInflacion && (
                <span style={{ fontWeight: 400, color: T.dim, marginLeft: 8 }}>
                  último dato: {labelMes(datos.parametros.ultimoMesInflacion)}
                </span>
              )}
            </span>
            <span style={{ color: T.dim, fontSize: 12 }}>{showParametros ? '▲ ocultar' : '▼ ver / ajustar'}</span>
          </button>
          {showParametros && (
            <div style={{ padding: '4px 18px 18px', borderTop: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 12, color: T.muted, margin: '10px 0 14px', lineHeight: 1.5 }}>
                El costo de oportunidad se mide con la inflación mensual publicada por INDEC (vía api.argentinadatos.com).
                El mes en curso todavía no está publicado — se puede cargar una estimación provisoria acá, y al sincronizar
                de nuevo el valor real de INDEC la reemplaza automáticamente.
              </p>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ultimosMeses.map(m => (
                    <div key={m.mes} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12 }}>
                      <span style={{ width: 130, color: T.text }}>{labelMes(m.mes.slice(0, 7))}</span>
                      <span style={{ fontWeight: 700, color: T.text, width: 50, textAlign: 'right' }}>{m.valor_mensual.toFixed(1)}%</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                        background: m.fuente === 'indec' ? T.greenBg : T.amberBg,
                        color: m.fuente === 'indec' ? T.green : T.amber,
                        border: `1px solid ${m.fuente === 'indec' ? T.greenBd : T.amberBd}`,
                      }}>
                        {m.fuente === 'indec' ? 'INDEC' : 'estimado'}
                      </span>
                    </div>
                  ))}
                  {serie.length === 0 && <span style={{ fontSize: 12, color: T.dim }}>Sin datos cargados todavía.</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={sincronizar} disabled={syncing}
                    style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 7, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: syncing ? 'default' : 'pointer', opacity: syncing ? 0.6 : 1, fontFamily: 'inherit' }}>
                    {syncing ? 'Sincronizando...' : 'Sincronizar con INDEC'}
                  </button>
                  {!tieneMesActual && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: T.muted }}>{labelMes(mesActualIso())}:</span>
                      <input value={manualValor} onChange={e => setManualValor(e.target.value)} placeholder="% estimado" style={{ ...INP, width: 90, padding: '5px 8px' }} />
                      <button onClick={guardarManual} disabled={guardandoManual || !manualValor}
                        style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 600, color: T.text, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Guardar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: T.redBg, border: `1px solid ${T.redBd}`, borderRadius: 10, padding: 16, color: T.red, fontSize: 13, marginBottom: 20 }}>{error}</div>
        )}

        {loading ? (
          <div style={{ padding: 64, textAlign: 'center', color: T.muted, fontSize: 13 }}>Cargando...</div>
        ) : !datos ? null : (
          <>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px,1fr))', gap: 14, marginBottom: 14 }}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Margen nominal</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{fmt(datos.kpis.margenNominal)}</div>
                <p style={{ fontSize: 11, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>
                  Precio de venta menos el costo actual del producto — la ganancia &quot;de factura&quot;, igual que en Reportes.
                  Todavía no tiene en cuenta si esa plata ya la cobraste o si la seguís esperando.
                </p>
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.redBd}`, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Costo de oportunidad</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.red }}>−{fmt(datos.kpis.costoOportunidadTotal)}</div>
                <p style={{ fontSize: 11, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>
                  Lo que se te licúa por la demora en cobrar: <strong>{fmt(datos.kpis.costoOportunidadCtaCte)}</strong> de
                  ventas a cuenta corriente que tardaron en pagarse, más <strong>{fmt(datos.kpis.costoOportunidadCheques)}</strong> de
                  cheques que quedaron en cartera hasta poder depositarse.
                </p>
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.greenBd}`, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Ganancia real</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.green }}>{fmt(datos.kpis.gananciaReal)}</div>
                <p style={{ fontSize: 11, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>
                  Margen nominal menos el costo de oportunidad: lo que realmente te queda, en pesos con el poder de compra
                  de hoy. Un <strong>{datos.kpis.pctErosion.toFixed(1)}%</strong> de tu margen &quot;de papel&quot; se lo comió la demora en cobrar.
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px,1fr))', gap: 14, marginBottom: 24 }}>
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Expuesto hoy en cta. cte.</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.amber }}>{fmt(datos.kpis.montoExpuestoActual)}</div>
                <p style={{ fontSize: 11, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>
                  De las ventas del período elegido, cuánta plata sigue sin cobrarse hoy. No es el saldo total de cuenta
                  corriente de tus clientes (para eso está Cobranzas) — es solo lo que corresponde a este rango de fechas.
                </p>
              </div>
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Días promedio de cobro</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.blue }}>{datos.kpis.diasPromedioCobro.toFixed(0)} días</div>
                <p style={{ fontSize: 11, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>
                  En promedio (pesando más las ventas con más plata en juego), cuántos días pasan entre que vendés algo a
                  cuenta corriente y el día en que efectivamente te lo pagan. Solo cuenta lo que ya se cobró en el período.
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ background: 'none', border: 'none', color: tab === t.id ? T.text : T.muted, fontSize: 13, fontWeight: tab === t.id ? 700 : 400, padding: '8px 14px', cursor: 'pointer', borderBottom: tab === t.id ? `2px solid ${T.wine}` : '2px solid transparent', marginBottom: -1, fontFamily: 'inherit' }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>

              {tab === 'cliente' && (
                <div>
                  <h2 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Clientes que más erosionan el margen</h2>
                  <p style={{ margin: '0 0 20px', fontSize: 12, color: T.muted, lineHeight: 1.6, maxWidth: 640 }}>
                    No es un ranking de quién más te compra, sino de quién más plata te hace perder por tardar en pagar
                    (o por tener mucha plata parada hace mucho tiempo). &quot;pend.&quot; es lo que ese cliente todavía te debe hoy
                    de este período; el número en rojo es cuánto ya se licuó por la demora, ya sea de lo que pagó tarde o
                    de lo que sigue debiendo.
                  </p>
                  {datos.porCliente.length === 0 ? (
                    <p style={{ color: T.dim, textAlign: 'center', padding: 40, fontSize: 13 }}>Sin ventas a crédito con erosión relevante en el período</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {datos.porCliente.map((c, i) => {
                        const max = datos.porCliente[0].costoOportunidad || 1
                        return (
                          <div key={c.nombre + i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 11, color: T.dim, width: 20, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, gap: 12 }}>
                                <span style={{ fontSize: 13, fontWeight: 500, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombre}</span>
                                <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                                  {c.montoExpuesto > 0.5 && <span style={{ fontSize: 12, color: T.amber }} title="Aún pendiente de cobro">{fmt(c.montoExpuesto)} pend.</span>}
                                  <span style={{ fontSize: 13, fontWeight: 700, color: T.red }}>−{fmt(c.costoOportunidad)}</span>
                                </div>
                              </div>
                              <HBar pct={(c.costoOportunidad / max) * 100} color={T.wine} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === 'producto' && (
                <div>
                  <h2 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ganancia real por producto</h2>
                  <p style={{ margin: '0 0 20px', fontSize: 12, color: T.muted, lineHeight: 1.6, maxWidth: 640 }}>
                    El &quot;margen nominal&quot; es el mismo de siempre. La columna &quot;costo oportunidad&quot; reparte, a prorrata de lo
                    que vendió cada producto, la erosión de las ventas a cuenta corriente en las que participó. Dos
                    productos con el mismo margen de papel pueden dejarte una ganancia real muy distinta si uno se vende
                    de contado y el otro casi siempre a cuenta corriente.
                  </p>
                  {datos.porProducto.length === 0 ? (
                    <p style={{ color: T.dim, textAlign: 'center', padding: 40, fontSize: 13 }}>Sin datos</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: T.bg }}>
                            {['Producto', 'Margen nominal', 'Costo oportunidad', 'Ganancia real'].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Producto' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {datos.porProducto.slice(0, 100).map((p, i) => (
                            <tr key={p.nombre + i} className="tr" style={{ borderBottom: `1px solid ${T.border}` }}>
                              <td style={{ padding: '9px 12px', color: T.text, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</td>
                              <td style={{ padding: '9px 12px', textAlign: 'right', color: T.muted }}>{fmt(p.margenNominal)}</td>
                              <td style={{ padding: '9px 12px', textAlign: 'right', color: T.red }}>{p.costoOportunidad > 0.5 ? `−${fmt(p.costoOportunidad)}` : '—'}</td>
                              <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: T.green }}>{fmt(p.margenNominal - p.costoOportunidad)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'categoria' && (
                <div>
                  <h2 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ganancia real por categoría</h2>
                  <p style={{ margin: '0 0 20px', fontSize: 12, color: T.muted, lineHeight: 1.6, maxWidth: 640 }}>
                    Lo mismo que &quot;Por producto&quot; pero agrupado por Tinto / Blanco / Rosado / Espumante / Otro — sirve para
                    ver de un vistazo si alguna categoría entera se apoya mucho en ventas a crédito y por eso rinde menos
                    en la práctica de lo que muestra su margen nominal.
                  </p>
                  {datos.porCategoria.length === 0 ? (
                    <p style={{ color: T.dim, textAlign: 'center', padding: 40, fontSize: 13 }}>Sin datos</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {datos.porCategoria.map((c, i) => {
                        const max = Math.max(...datos.porCategoria.map(x => x.margenNominal), 1)
                        return (
                          <div key={c.categoria + i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 13, width: 120, flexShrink: 0, color: T.text }}>{c.categoria}</span>
                            <div style={{ flex: 1 }}><HBar pct={(c.margenNominal / max) * 100} color={T.brown} /></div>
                            <span style={{ fontSize: 12, color: T.muted, width: 100, textAlign: 'right', flexShrink: 0 }}>{fmt(c.margenNominal)} nom.</span>
                            <span style={{ fontSize: 12, color: T.red, width: 90, textAlign: 'right', flexShrink: 0 }}>{c.costoOportunidad > 0.5 ? `−${fmt(c.costoOportunidad)}` : '—'}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.green, width: 100, textAlign: 'right', flexShrink: 0 }}>{fmt(c.margenNominal - c.costoOportunidad)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === 'cheques' && (
                <div>
                  <h2 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cheques recibidos en cartera</h2>
                  <p style={{ margin: '0 0 20px', fontSize: 12, color: T.muted, lineHeight: 1.6, maxWidth: 640 }}>
                    Cuando un cliente te paga con un cheque a fecha, esa deuda se cancela en su cuenta corriente ese mismo
                    día — pero vos todavía no podés usar esa plata hasta el día en que el cheque se puede depositar. Esta
                    tabla mide esa demora extra: cuántos días quedan &quot;presos&quot; en el cheque, y cuánto se licúa mientras tanto.
                  </p>
                  {datos.cheques.length === 0 ? (
                    <p style={{ color: T.dim, textAlign: 'center', padding: 40, fontSize: 13 }}>Sin cheques recibidos en el período</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: T.bg }}>
                            {['Banco', 'Monto', 'Emisión', 'Fecha de pago', 'Días', 'Costo oportunidad'].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Banco' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {datos.cheques.map(ch => (
                            <tr key={ch.id} className="tr" style={{ borderBottom: `1px solid ${T.border}` }}>
                              <td style={{ padding: '9px 12px', color: T.text }}>{ch.banco || '—'}</td>
                              <td style={{ padding: '9px 12px', textAlign: 'right', color: T.muted }}>{fmt(ch.monto)}</td>
                              <td style={{ padding: '9px 12px', textAlign: 'right', color: T.muted }}>{new Date(ch.fecha_emision + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                              <td style={{ padding: '9px 12px', textAlign: 'right', color: T.muted }}>{new Date(ch.fecha_pago + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                              <td style={{ padding: '9px 12px', textAlign: 'right', color: ch.vencido ? T.green : T.amber }}>{fmtN(ch.dias)}</td>
                              <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: T.red }}>{ch.costoOportunidad > 0.5 ? `−${fmt(ch.costoOportunidad)}` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  )
}
