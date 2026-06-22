'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── Design tokens ──────────────────────────────────────────────────────────
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

const TIPOS: Record<string, string> = {
  consumidor_final:     'Consumidor final',
  responsable_inscripto: 'Resp. Inscripto',
  revendedor:           'Revendedor',
  mayorista:            'Mayorista',
  gastronomia:          'Gastronomía',
  otro:                 'Otro',
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Cliente {
  id: string
  nombre: string
  apellido?: string
  razon_social?: string
  cuit?: string
  direccion?: string
  telefono?: string
  email?: string
  tipo: string
  saldo: number
  activo: boolean
  empresa: string
}

interface Venta {
  id: string
  numero: string
  empresa: string
  tipo: string
  estado: string
  estado_pago?: string
  cliente_id?: string
  cliente_nombre?: string
  total: number
  created_at: string
}

interface MovCtaCte {
  id: string
  cliente_id: string
  tipo: string
  monto: number
  descripcion?: string
  concepto?: string
  created_at: string
}

interface Consignacion {
  id: string
  numero?: string
  empresa: string
  cliente_nombre?: string
  cliente_id?: string
  estado: string
  total: number
  created_at: string
}

interface Visita {
  id: string
  empresa: string
  cliente_nombre?: string
  cliente_id?: string
  tipo: string
  estado: string
  fecha: string
  notas?: string
  created_at: string
}

// ─── Badge ───────────────────────────────────────────────────────────────────
function Badge({ color, bg, border, children }: { color: string; bg: string; border: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color, background: bg, border: `1px solid ${border}` }}>
      {children}
    </span>
  )
}

function tipoBadge(tipo: string) {
  const label = TIPOS[tipo] || tipo
  if (tipo === 'consumidor_final')      return <Badge color={T.amber} bg={T.amberBg} border={T.amberBd}>{label}</Badge>
  if (tipo === 'responsable_inscripto') return <Badge color={T.blue}  bg={T.blueBg}  border={T.blueBd}>{label}</Badge>
  if (tipo === 'revendedor')            return <Badge color={T.wine}  bg={T.wineBg}  border={T.wineBd}>{label}</Badge>
  if (tipo === 'mayorista')             return <Badge color={T.gold}  bg={T.goldBg}  border={T.goldBd}>{label}</Badge>
  if (tipo === 'gastronomia')           return <Badge color={T.green} bg={T.greenBg} border={T.greenBd}>{label}</Badge>
  return <Badge color={T.dim} bg="rgba(168,152,136,0.10)" border="rgba(168,152,136,0.28)">{label}</Badge>
}

function estadoConsignacionBadge(estado: string) {
  if (estado === 'activa' || estado === 'pendiente') return <Badge color={T.amber} bg={T.amberBg} border={T.amberBd}>{estado}</Badge>
  if (estado === 'liquidada' || estado === 'cerrada') return <Badge color={T.green} bg={T.greenBg} border={T.greenBd}>{estado}</Badge>
  if (estado === 'cancelada') return <Badge color={T.red} bg={T.redBg} border={T.redBd}>{estado}</Badge>
  return <Badge color={T.dim} bg="rgba(168,152,136,0.10)" border="rgba(168,152,136,0.28)">{estado}</Badge>
}

function estadoVisitaBadge(estado: string) {
  if (estado === 'realizada' || estado === 'completada') return <Badge color={T.green} bg={T.greenBg} border={T.greenBd}>{estado}</Badge>
  if (estado === 'pendiente') return <Badge color={T.amber} bg={T.amberBg} border={T.amberBd}>{estado}</Badge>
  if (estado === 'cancelada') return <Badge color={T.red} bg={T.redBg} border={T.redBd}>{estado}</Badge>
  return <Badge color={T.blue} bg={T.blueBg} border={T.blueBd}>{estado}</Badge>
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-AR')
const fmtMonto = (n: number) => '$' + n.toLocaleString('es-AR')

// ─── TABS ─────────────────────────────────────────────────────────────────────
type Tab = 'compras' | 'ctacte' | 'consignaciones' | 'crm'
const TABS: { key: Tab; label: string }[] = [
  { key: 'compras',       label: 'Compras' },
  { key: 'ctacte',        label: 'Cuenta corriente' },
  { key: 'consignaciones', label: 'Consignaciones' },
  { key: 'crm',           label: 'Actividad CRM' },
]

// ─── Component ───────────────────────────────────────────────────────────────
export default function ClienteFichaPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [empresa, setEmpresa] = useState('')
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('compras')

  // Tab data
  const [ventas, setVentas] = useState<Venta[]>([])
  const [ventasLoading, setVentasLoading] = useState(false)
  const [movimientos, setMovimientos] = useState<MovCtaCte[]>([])
  const [movsLoading, setMovsLoading] = useState(false)
  const [consignaciones, setConsignaciones] = useState<Consignacion[]>([])
  const [consLoading, setConsLoading] = useState(false)
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [visitasLoading, setVisitasLoading] = useState(false)

  // Track which tabs have been loaded
  const [loaded, setLoaded] = useState<Set<Tab>>(new Set())

  useEffect(() => {
    const emp = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(emp)
    cargarCliente(emp)
  }, [id])

  async function cargarCliente(emp: string) {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()
    if (!error && data) {
      setCliente(data)
      // Load first tab data right away
      cargarVentas(emp)
      setLoaded(new Set<Tab>(['compras']))
    }
    setLoading(false)
  }

  async function cargarVentas(emp: string) {
    setVentasLoading(true)
    const res = await fetch(`/api/ventas?empresa=${emp}&cliente_id=${id}`)
    const data = await res.json()
    setVentas(Array.isArray(data) ? data : [])
    setVentasLoading(false)
  }

  async function cargarMovimientos() {
    setMovsLoading(true)
    const res = await fetch(`/api/cta-cte?cliente_id=${id}`)
    const data = await res.json()
    setMovimientos(Array.isArray(data) ? data : [])
    setMovsLoading(false)
  }

  async function cargarConsignaciones(emp: string) {
    setConsLoading(true)
    const { data, error } = await supabase
      .from('consignaciones')
      .select('*')
      .eq('empresa', emp)
      .eq('cliente_id', id)
      .order('created_at', { ascending: false })
    if (!error && data) setConsignaciones(data)
    else {
      // fallback: filter by nombre if no cliente_id match
      setConsignaciones([])
    }
    setConsLoading(false)
  }

  async function cargarVisitas(emp: string, nombreCliente: string) {
    setVisitasLoading(true)
    // Try by cliente_id first
    let { data, error } = await supabase
      .from('visitas')
      .select('*')
      .eq('empresa', emp)
      .eq('cliente_id', id)
      .order('fecha', { ascending: false })
    if ((!data || data.length === 0) && nombreCliente) {
      // fallback: filter by nombre
      const res = await supabase
        .from('visitas')
        .select('*')
        .eq('empresa', emp)
        .ilike('cliente_nombre', `%${nombreCliente}%`)
        .order('fecha', { ascending: false })
      data = res.data
      error = res.error
    }
    if (!error && data) setVisitas(data)
    else setVisitas([])
    setVisitasLoading(false)
  }

  function switchTab(t: Tab) {
    setTab(t)
    if (loaded.has(t)) return
    setLoaded(prev => new Set<Tab>([...Array.from(prev), t]))
    if (t === 'ctacte') cargarMovimientos()
    if (t === 'consignaciones') cargarConsignaciones(empresa)
    if (t === 'crm') {
      const nombre = cliente?.razon_social || `${cliente?.nombre || ''} ${cliente?.apellido || ''}`.trim()
      cargarVisitas(empresa, nombre)
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const totalCompras = ventas.reduce((a, v) => a + v.total, 0)

  // Running balance for cta-cte
  let saldoAcum = 0
  const movsConSaldo = movimientos.map(m => {
    const esCobro = m.tipo === 'cobro' || m.tipo === 'pago' || m.tipo === 'nota_credito'
    saldoAcum += esCobro ? -m.monto : m.monto
    return { ...m, saldoAcum }
  })

  const nombreDisplay = cliente
    ? (cliente.razon_social || `${cliente.nombre} ${cliente.apellido || ''}`.trim())
    : ''

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
        <span style={{ color: T.dim, fontSize: 14 }}>Cargando...</span>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
        <span style={{ color: T.red, fontSize: 14 }}>Cliente no encontrado</span>
      </div>
    )
  }

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .tab-btn:hover { color: ${T.text} !important; }
        .tr-hover:hover { background: #FDFAF6 !important; }
        .btn-back:hover { border-color: ${T.border2} !important; color: ${T.muted} !important; }
      `}</style>

      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          className="btn-back"
          onClick={() => router.push('/clientes')}
          style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 14px', fontSize: 12, color: T.muted, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s', flexShrink: 0 }}
        >
          ← Volver
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombreDisplay}</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>Ficha de cliente</p>
        </div>
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Info card ──────────────────────────────────────────────────────── */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '24px 28px', marginBottom: 24, boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '18px 28px' }}>

            {/* Nombre / razón social */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Nombre</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{nombreDisplay}</div>
                {cliente.razon_social && (cliente.nombre || cliente.apellido) && (
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{cliente.nombre} {cliente.apellido || ''}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {tipoBadge(cliente.tipo)}
                {cliente.activo
                  ? <Badge color={T.green} bg={T.greenBg} border={T.greenBd}>Activo</Badge>
                  : <Badge color={T.dim} bg="rgba(168,152,136,0.10)" border="rgba(168,152,136,0.28)">Inactivo</Badge>
                }
                {/* Saldo badge */}
                {cliente.saldo >= 0
                  ? <Badge color={T.green} bg={T.greenBg} border={T.greenBd}>Saldo: {fmtMonto(cliente.saldo)}</Badge>
                  : <Badge color={T.red} bg={T.redBg} border={T.redBd}>Saldo: {fmtMonto(cliente.saldo)}</Badge>
                }
              </div>
            </div>

            {/* CUIT */}
            {cliente.cuit && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>CUIT</div>
                <div style={{ fontSize: 13, color: T.text, fontFamily: 'monospace' }}>{cliente.cuit}</div>
              </div>
            )}

            {/* Email */}
            {cliente.email && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Email</div>
                <div style={{ fontSize: 13, color: T.text }}>{cliente.email}</div>
              </div>
            )}

            {/* Teléfono */}
            {cliente.telefono && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Teléfono</div>
                <div style={{ fontSize: 13, color: T.text }}>{cliente.telefono}</div>
              </div>
            )}

            {/* Dirección */}
            {cliente.direccion && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Dirección</div>
                <div style={{ fontSize: 13, color: T.text }}>{cliente.direccion}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 2, background: T.bg, borderRadius: 8, padding: 3, border: `1px solid ${T.border}`, marginBottom: 20, width: 'fit-content' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              className="tab-btn"
              onClick={() => switchTab(t.key)}
              style={{
                background: tab === t.key ? T.wine : 'transparent',
                color: tab === t.key ? '#fff' : T.muted,
                border: 'none', borderRadius: 6, padding: '7px 18px',
                fontSize: 12, fontWeight: tab === t.key ? 600 : 400,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Compras ───────────────────────────────────────────────────── */}
        {tab === 'compras' && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Comprobantes de venta</span>
              {!ventasLoading && ventas.length > 0 && (
                <span style={{ fontSize: 12, color: T.muted }}>
                  Total: <strong style={{ color: T.text }}>{fmtMonto(totalCompras)}</strong>
                  {' · '}{ventas.length} comprobante{ventas.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {ventasLoading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: T.dim, fontSize: 13 }}>Cargando...</div>
            ) : ventas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: T.dim, fontSize: 13 }}>No hay comprobantes para este cliente</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Número', 'Fecha', 'Tipo', 'Total', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h === 'Total' ? 'right' : 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ventas.map(v => (
                    <tr key={v.id} className="tr-hover" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}>
                      <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontWeight: 600, fontSize: 12, color: T.text }}>{v.numero}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: T.muted }}>{fmtDate(v.created_at)}</td>
                      <td style={{ padding: '11px 16px' }}>
                        {v.tipo === 'presupuesto'
                          ? <Badge color={T.wine}  bg={T.wineBg}  border={T.wineBd}>Presupuesto</Badge>
                          : v.tipo === 'remito'
                          ? <Badge color={T.green} bg={T.greenBg} border={T.greenBd}>Remito</Badge>
                          : <Badge color={T.blue}  bg={T.blueBg}  border={T.blueBd}>{v.tipo}</Badge>
                        }
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: T.text }}>{fmtMonto(v.total)}</td>
                      <td style={{ padding: '11px 16px' }}>
                        {v.estado_pago === 'pagado'            ? <Badge color={T.green} bg={T.greenBg} border={T.greenBd}>Pagado</Badge>
                        : v.estado_pago === 'pendiente'        ? <Badge color={T.amber} bg={T.amberBg} border={T.amberBd}>Pendiente</Badge>
                        : v.estado_pago === 'cuenta_corriente' ? <Badge color={T.blue}  bg={T.blueBg}  border={T.blueBd}>Cta. Cte.</Badge>
                        : v.estado ? <Badge color={T.dim} bg="rgba(168,152,136,0.10)" border="rgba(168,152,136,0.28)">{v.estado}</Badge>
                        : <span style={{ color: T.dim }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab: Cuenta corriente ──────────────────────────────────────────── */}
        {tab === 'ctacte' && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Movimientos de cuenta corriente</span>
              <span style={{ fontSize: 12, color: T.muted }}>
                Saldo actual: <strong style={{ color: cliente.saldo >= 0 ? T.green : T.red }}>{fmtMonto(cliente.saldo)}</strong>
              </span>
            </div>
            {movsLoading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: T.dim, fontSize: 13 }}>Cargando...</div>
            ) : movimientos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: T.dim, fontSize: 13 }}>No hay movimientos registrados</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Fecha', 'Tipo', 'Descripción', 'Monto', 'Saldo acum.'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: (h === 'Monto' || h === 'Saldo acum.') ? 'right' : 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movsConSaldo.map(m => {
                    const esCobro = m.tipo === 'cobro' || m.tipo === 'pago' || m.tipo === 'nota_credito'
                    return (
                      <tr key={m.id} className="tr-hover" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}>
                        <td style={{ padding: '11px 16px', fontSize: 12, color: T.muted }}>{fmtDate(m.created_at)}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <Badge
                            color={esCobro ? T.green : T.red}
                            bg={esCobro ? T.greenBg : T.redBg}
                            border={esCobro ? T.greenBd : T.redBd}
                          >
                            {m.tipo === 'nota_credito' ? 'Nota crédito' : esCobro ? 'Cobro/Pago' : 'Cargo'}
                          </Badge>
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: 13, color: T.text }}>{m.descripcion || m.concepto || '—'}</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 600, fontSize: 13, color: esCobro ? T.green : T.red }}>
                          {esCobro ? '-' : '+'}{fmtMonto(m.monto)}
                        </td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', fontSize: 12, color: T.muted }}>
                          {fmtMonto(m.saldoAcum)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab: Consignaciones ────────────────────────────────────────────── */}
        {tab === 'consignaciones' && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Consignaciones</span>
            </div>
            {consLoading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: T.dim, fontSize: 13 }}>Cargando...</div>
            ) : consignaciones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: T.dim, fontSize: 13 }}>No hay consignaciones para este cliente</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Número', 'Fecha', 'Estado', 'Total'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h === 'Total' ? 'right' : 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {consignaciones.map(c => (
                    <tr key={c.id} className="tr-hover" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}>
                      <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontWeight: 600, fontSize: 12, color: T.text }}>{c.numero || c.id.slice(0, 8)}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: T.muted }}>{fmtDate(c.created_at)}</td>
                      <td style={{ padding: '11px 16px' }}>{estadoConsignacionBadge(c.estado)}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: T.text }}>{fmtMonto(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab: Actividad CRM ─────────────────────────────────────────────── */}
        {tab === 'crm' && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Visitas y actividad CRM</span>
            </div>
            {visitasLoading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: T.dim, fontSize: 13 }}>Cargando...</div>
            ) : visitas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: T.dim, fontSize: 13 }}>No hay actividad CRM registrada para este cliente</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Fecha', 'Tipo', 'Estado', 'Notas'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visitas.map(v => (
                    <tr key={v.id} className="tr-hover" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: T.muted }}>{fmtDate(v.fecha || v.created_at)}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: T.text, fontWeight: 500 }}>{v.tipo}</td>
                      <td style={{ padding: '11px 16px' }}>{estadoVisitaBadge(v.estado)}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: T.muted, maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.notas || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
