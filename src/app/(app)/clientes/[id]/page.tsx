'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { onOverlayMouseDown, onOverlayClick } from '@/lib/overlayClose'
import { ChequesRecibidosFieldset, nuevoChequeRecibido, sumaCheques, chequesCompletos, type ChequeRecibido } from '@/components/ChequesRecibidosFieldset'

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

const MEDIOS_PAGO_COBRO = ['Efectivo', 'Transferencia', 'Tarjeta Débito', 'Tarjeta Crédito', 'QR', 'MercadoPago', 'Cheque']

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
  facturado?: boolean
  nro_cbte_afip?: string | null
}

interface MovCtaCte {
  id: string
  cliente_id: string
  tipo: string
  monto: number
  monto_pagado?: number
  descripcion?: string
  concepto?: string
  created_at: string
  referencia_id?: string | null
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

  // Registrar cobro (cuenta corriente)
  const [cobroModal, setCobroModal] = useState(false)
  const [cobroMonto, setCobroMonto] = useState(0)
  const [cobroConcepto, setCobroConcepto] = useState('Cobro cuenta corriente')
  const [cobroFecha, setCobroFecha] = useState('')
  const [cobroMedioPago, setCobroMedioPago] = useState('Efectivo')
  const [cobroSplit, setCobroSplit] = useState(false)
  const [cobroMonto2, setCobroMonto2] = useState(0)
  const [cobroMedioPago2, setCobroMedioPago2] = useState('Transferencia')
  const [cobroGuardando, setCobroGuardando] = useState(false)
  const [cobroCheques1, setCobroCheques1] = useState<ChequeRecibido[]>([nuevoChequeRecibido()])
  const [cobroCheques2, setCobroCheques2] = useState<ChequeRecibido[]>([nuevoChequeRecibido()])
  const cobroMonto1Final = cobroMedioPago === 'Cheque' ? sumaCheques(cobroCheques1) : cobroMonto
  const cobroMonto2Final = cobroMedioPago2 === 'Cheque' ? sumaCheques(cobroCheques2) : cobroMonto2
  const [cargoModal, setCargoModal] = useState(false)
  const [cargoMonto, setCargoMonto] = useState(0)
  const [cargoConcepto, setCargoConcepto] = useState('')
  const [cargoFecha, setCargoFecha] = useState('')
  const [cargoGuardando, setCargoGuardando] = useState(false)

  // Editar / anular un cargo cargado a mano
  const [editarMov, setEditarMov] = useState<MovCtaCte | null>(null)
  const [editarMonto, setEditarMonto] = useState(0)
  const [editarConcepto, setEditarConcepto] = useState('')
  const [editarFecha, setEditarFecha] = useState('')
  const [editarGuardando, setEditarGuardando] = useState(false)

  useEffect(() => {
    async function cargarVentas(emp: string) {
      setVentasLoading(true)
      const res = await fetch(`/api/ventas?empresa=${emp}&cliente_id=${id}`)
      const data = await res.json()
      setVentas(Array.isArray(data) ? data : [])
      setVentasLoading(false)
    }

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

    const emp = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(emp)
    cargarCliente(emp)
  }, [id])

  async function cargarMovimientos() {
    setMovsLoading(true)
    const res = await fetch(`/api/cta-cte?cliente_id=${id}`)
    const data = await res.json()
    setMovimientos(Array.isArray(data) ? data : [])
    setMovsLoading(false)
  }

  function abrirCobro() {
    setCobroMonto(0)
    setCobroConcepto('Cobro cuenta corriente')
    setCobroFecha(new Date().toISOString().split('T')[0])
    setCobroMedioPago('Efectivo')
    setCobroSplit(false)
    setCobroMonto2(0)
    setCobroMedioPago2('Transferencia')
    const nombre = cliente?.razon_social || `${cliente?.nombre ?? ''} ${cliente?.apellido ?? ''}`.trim()
    setCobroCheques1([nuevoChequeRecibido(nombre)])
    setCobroCheques2([nuevoChequeRecibido(nombre)])
    setCobroModal(true)
  }

  async function guardarCobro() {
    if (!cliente) return
    const monto1 = cobroMedioPago === 'Cheque' ? sumaCheques(cobroCheques1) : cobroMonto
    const monto2 = cobroSplit ? (cobroMedioPago2 === 'Cheque' ? sumaCheques(cobroCheques2) : cobroMonto2) : 0
    if (!monto1 || monto1 <= 0) return
    if (cobroSplit && (!monto2 || monto2 <= 0)) { alert('Ingresá el monto del segundo medio de pago'); return }
    if (cobroMedioPago === 'Cheque' && !chequesCompletos(cobroCheques1)) { alert('Completá N° de cheque, monto y fecha de cobro en cada cheque (medio 1)'); return }
    if (cobroSplit && cobroMedioPago2 === 'Cheque' && !chequesCompletos(cobroCheques2)) { alert('Completá N° de cheque, monto y fecha de cobro en cada cheque (medio 2)'); return }
    // Se abre acá, antes del primer await, para que el navegador lo reconozca
    // como originado por el clic del usuario y no lo bloquee como popup.
    const wRecibo = window.open('', '_blank', 'width=650,height=850')
    setCobroGuardando(true)
    const nombreCliente = cliente.razon_social || `${cliente.nombre} ${cliente.apellido || ''}`.trim()
    const body = cobroSplit
      ? { empresa, cliente_id: id, cliente_nombre: nombreCliente, tipo: 'cobro', concepto: cobroConcepto, fecha: cobroFecha, pagos: [{ monto: monto1, medio_pago: cobroMedioPago }, { monto: monto2, medio_pago: cobroMedioPago2 }] }
      : { empresa, cliente_id: id, cliente_nombre: nombreCliente, tipo: 'cobro', concepto: cobroConcepto, monto: monto1, fecha: cobroFecha, medio_pago: cobroMedioPago }
    const res = await fetch('/api/cta-cte', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.error) { setCobroGuardando(false); alert('Error: ' + data.error); wRecibo?.close(); return }

    const crearCheque = (ch: ChequeRecibido) => fetch('/api/cheques', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa, tipo: 'recibido', banco: ch.banco || null, nro_cheque: ch.numero,
        monto: ch.monto, fecha_emision: cobroFecha, fecha_pago: ch.fecha,
        librador: ch.librador || nombreCliente, concepto: cobroConcepto,
        cliente_id: id,
      }),
    })
    if (cobroMedioPago === 'Cheque') for (const ch of cobroCheques1) await crearCheque(ch)
    if (cobroSplit && cobroMedioPago2 === 'Cheque') for (const ch of cobroCheques2) await crearCheque(ch)

    setCobroGuardando(false)
    setCobroModal(false)
    setCliente(prev => prev ? { ...prev, saldo: data.saldo_nuevo } : prev)
    cargarMovimientos()
    // Recibo de pago — con el medio de pago principal (si se dividió en 2, se
    // muestra el primero; el detalle completo queda igual en el historial).
    if (data.id && wRecibo) {
      wRecibo.location.href = `/api/print/recibo?id=${data.id}&empresa=${empresa}&medio=${encodeURIComponent(cobroMedioPago)}`
    } else {
      wRecibo?.close()
    }
    // El cobro se reparte FIFO contra ventas abiertas — si el tab de compras
    // ya estaba cargado, sus estado_pago pueden haber cambiado.
    if (loaded.has('compras')) {
      const r = await fetch(`/api/ventas?empresa=${empresa}&cliente_id=${id}`)
      const d = await r.json()
      setVentas(Array.isArray(d) ? d : [])
    }
  }

  function abrirCargo() {
    setCargoMonto(0)
    setCargoConcepto('')
    setCargoFecha(new Date().toISOString().split('T')[0])
    setCargoModal(true)
  }

  async function guardarCargo() {
    if (!cliente || !cargoMonto || cargoMonto <= 0) return
    if (!cargoConcepto.trim()) { alert('Ingresá un concepto/motivo de la deuda'); return }
    setCargoGuardando(true)
    const nombreCliente = cliente.razon_social || `${cliente.nombre} ${cliente.apellido || ''}`.trim()
    const res = await fetch('/api/cta-cte', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa, cliente_id: id, cliente_nombre: nombreCliente, tipo: 'cargo', concepto: cargoConcepto, monto: cargoMonto, fecha: cargoFecha }),
    })
    const data = await res.json()
    setCargoGuardando(false)
    if (data.error) { alert('Error: ' + data.error); return }
    setCargoModal(false)
    setCliente(prev => prev ? { ...prev, saldo: data.saldo_nuevo } : prev)
    cargarMovimientos()
  }

  function abrirEditar(m: MovCtaCte) {
    setEditarMov(m)
    setEditarMonto(m.monto)
    setEditarConcepto(m.concepto || m.descripcion || '')
    setEditarFecha(new Date(m.created_at).toISOString().split('T')[0])
  }

  async function guardarEditar() {
    if (!editarMov || !editarMonto || editarMonto <= 0) return
    if (!editarConcepto.trim()) { alert('Ingresá un concepto/motivo'); return }
    setEditarGuardando(true)
    const res = await fetch('/api/cta-cte', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editarMov.id, accion: 'editar', monto: editarMonto, concepto: editarConcepto, fecha: editarFecha }),
    })
    const data = await res.json()
    setEditarGuardando(false)
    if (data.error) { alert('Error: ' + data.error); return }
    setEditarMov(null)
    setCliente(prev => prev ? { ...prev, saldo: data.saldo_nuevo } : prev)
    cargarMovimientos()
  }

  async function anularCargo(m: MovCtaCte) {
    if (!confirm(`¿Anular el cargo "${m.concepto || m.descripcion || 'Deuda cargada'}" de ${fmtMonto(m.monto)}? Se descuenta del saldo del cliente y queda marcado como anulado (no se borra, para mantener el historial).`)) return
    const res = await fetch('/api/cta-cte', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, accion: 'anular' }),
    })
    const data = await res.json()
    if (data.error) { alert('Error: ' + data.error); return }
    setCliente(prev => prev ? { ...prev, saldo: data.saldo_nuevo } : prev)
    cargarMovimientos()
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

  // Filas de cuenta corriente — el cargo que se genera al facturar en cta.
  // cte. (ver /api/ventas POST) y el cobro que lo salda después (/api/ventas/
  // cobrar) comparten referencia_id (el id de la venta), pero antes se
  // mostraban como dos renglones sueltos ("Cargo Presupuesto 0008" y "Cobro
  // Presupuesto 0008") que además duplicaban lo que ya se ve en la tab
  // Comprobantes. Acá se agrupan por referencia_id en una sola fila con el
  // neto pendiente — las deudas cargadas a mano (Cargar deuda) y los cobros
  // genéricos sin comprobante puntual no tienen referencia_id, así que
  // siguen mostrándose sueltos como antes.
  interface FilaCtaCte {
    key: string
    fecha: string
    esVenta: boolean
    ventaId?: string
    concepto: string
    cargoTotal: number
    cobroTotal: number
    neto: number
    esAnulado: boolean
    mov?: MovCtaCte
    fechaCobro?: string
  }

  const gruposPorRef = new Map<string, MovCtaCte[]>()
  const movsSueltos: MovCtaCte[] = []
  for (const m of movimientos) {
    if (m.referencia_id) {
      const arr = gruposPorRef.get(m.referencia_id) || []
      arr.push(m)
      gruposPorRef.set(m.referencia_id, arr)
    } else {
      movsSueltos.push(m)
    }
  }

  const filas: FilaCtaCte[] = []
  for (const [refId, movs] of Array.from(gruposPorRef.entries())) {
    const cargos = movs.filter(m => m.tipo === 'cargo')
    const cobros = movs.filter(m => m.tipo === 'cobro' || m.tipo === 'pago' || m.tipo === 'nota_credito')
    const cargoTotal = cargos.reduce((a, m) => a + m.monto, 0)
    const cobroTotal = cobros.reduce((a, m) => a + m.monto, 0)
    const fechaBase = cargos.length > 0
      ? cargos.reduce((min, m) => (m.created_at < min ? m.created_at : min), cargos[0].created_at)
      : movs[0].created_at
    // Fecha del cobro más reciente del grupo — para poder ver cuándo se
    // registró el pago, no solo que "está pagada".
    const fechaCobro = cobros.length > 0
      ? cobros.reduce((max, m) => (m.created_at > max ? m.created_at : max), cobros[0].created_at)
      : undefined
    const conceptoBase = (cargos[0]?.concepto || movs[0].concepto || '')
      .replace(/ \(ajuste al editar\)$/, '').replace(/ \(anulado\)$/, '')
    filas.push({
      key: refId,
      fecha: fechaBase,
      esVenta: true,
      ventaId: refId,
      concepto: conceptoBase || '—',
      cargoTotal,
      cobroTotal,
      neto: parseFloat((cargoTotal - cobroTotal).toFixed(2)),
      esAnulado: false,
      fechaCobro,
    })
  }
  for (const m of movsSueltos) {
    const esAnulado = (m.concepto || '').startsWith('[ANULADO] ')
    const esCobro = m.tipo === 'cobro' || m.tipo === 'pago' || m.tipo === 'nota_credito'
    filas.push({
      key: m.id,
      fecha: m.created_at,
      esVenta: false,
      concepto: (m.descripcion || m.concepto || '').replace('[ANULADO] ', '') || '—',
      cargoTotal: esCobro ? 0 : m.monto,
      cobroTotal: esCobro ? m.monto : 0,
      neto: esAnulado ? 0 : (esCobro ? -m.monto : m.monto),
      esAnulado,
      mov: m,
    })
  }
  filas.sort((a, b) => b.fecha.localeCompare(a.fecha))

  let saldoAcum = 0
  const filasConSaldo = filas.map(f => {
    saldoAcum += f.neto
    return { ...f, saldoAcum }
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
                      <td style={{ padding: '11px 16px' }}>
                        <button
                          onClick={() => window.open(`/api/print/venta?id=${v.id}&empresa=${v.empresa}`, '_blank')}
                          title="Ver / imprimir comprobante"
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'monospace', fontWeight: 600, color: T.wine, fontSize: 12, textDecoration: 'underline' }}
                        >
                          {v.facturado && v.nro_cbte_afip ? `Factura ${v.nro_cbte_afip}` : v.numero}
                        </button>
                        {v.facturado && v.nro_cbte_afip && (
                          <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>interno #{v.numero}</div>
                        )}
                      </td>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 12, color: T.muted }}>
                  Saldo actual: <strong style={{ color: cliente.saldo >= 0 ? T.green : T.red }}>{fmtMonto(cliente.saldo)}</strong>
                </span>
                <button onClick={abrirCargo} style={{ background: T.surface, color: T.wine, border: `1px solid ${T.wineBd}`, borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cargar deuda
                </button>
                {cliente.saldo > 0 && (
                  <button onClick={abrirCobro} style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Registrar cobro
                  </button>
                )}
              </div>
            </div>
            {movsLoading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: T.dim, fontSize: 13 }}>Cargando...</div>
            ) : movimientos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: T.dim, fontSize: 13 }}>No hay movimientos registrados</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Fecha', 'Tipo', 'Descripción', 'Monto', 'Saldo acum.', ''].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: (h === 'Monto' || h === 'Saldo acum.') ? 'right' : 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filasConSaldo.map(f => {
                    if (f.esVenta) {
                      // Cargo + cobro(s) de la misma venta, unificados: antes
                      // aparecían como dos renglones sueltos que duplicaban lo
                      // que ya se ve en la tab Comprobantes.
                      const pagada = f.neto <= 0.01
                      const parcial = !pagada && f.cobroTotal > 0.01
                      const color = pagada ? T.green : parcial ? T.amber : T.blue
                      const bg = pagada ? T.greenBg : parcial ? T.amberBg : T.blueBg
                      const bd = pagada ? T.greenBd : parcial ? T.amberBd : T.blueBd
                      return (
                        <tr key={f.key} className="tr-hover" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}>
                          <td style={{ padding: '11px 16px', fontSize: 12, color: T.muted }}>{fmtDate(f.fecha)}</td>
                          <td style={{ padding: '11px 16px' }}>
                            <Badge color={color} bg={bg} border={bd}>
                              {pagada ? 'Pagado' : parcial ? 'Parcial' : 'Cta. Cte.'}
                            </Badge>
                          </td>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: T.text }}>
                            {f.concepto}
                            {parcial && (
                              <div style={{ fontSize: 10, fontWeight: 400, color: T.amber, marginTop: 2 }}>
                                Cobrado {fmtMonto(f.cobroTotal)}{f.fechaCobro ? ` el ${fmtDate(f.fechaCobro)}` : ''}, falta {fmtMonto(f.neto)}
                              </div>
                            )}
                            {pagada && f.cobroTotal > 0.01 && (
                              <div style={{ fontSize: 10, fontWeight: 400, color: T.green, marginTop: 2 }}>
                                Cobrado{f.fechaCobro ? ` el ${fmtDate(f.fechaCobro)}` : ''}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 600, fontSize: 13, color }}>
                            {fmtMonto(f.cargoTotal)}
                          </td>
                          <td style={{ padding: '11px 16px', textAlign: 'right', fontSize: 12, color: T.muted }}>
                            {fmtMonto(f.saldoAcum)}
                          </td>
                          <td style={{ padding: '11px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => window.open(`/api/print/venta?id=${f.ventaId}&empresa=${empresa}`, '_blank')}
                              title="Ver / imprimir comprobante"
                              style={{ background: T.surface, color: T.muted, border: `1px solid ${T.border2}`, borderRadius: 6, padding: '4px 9px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                            >
                              Ver comprobante
                            </button>
                          </td>
                        </tr>
                      )
                    }

                    const m = f.mov!
                    const esCobro = f.cobroTotal > 0
                    return (
                      <tr key={f.key} className="tr-hover" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s', opacity: f.esAnulado ? 0.55 : 1 }}>
                        <td style={{ padding: '11px 16px', fontSize: 12, color: T.muted }}>{fmtDate(f.fecha)}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <Badge
                            color={f.esAnulado ? T.dim : esCobro ? T.green : T.red}
                            bg={f.esAnulado ? 'rgba(168,152,136,0.10)' : esCobro ? T.greenBg : T.redBg}
                            border={f.esAnulado ? 'rgba(168,152,136,0.28)' : esCobro ? T.greenBd : T.redBd}
                          >
                            {f.esAnulado ? 'Anulado' : m.tipo === 'nota_credito' ? 'Nota crédito' : esCobro ? 'Cobro/Pago' : 'Cargo'}
                          </Badge>
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: 13, color: T.text, textDecoration: f.esAnulado ? 'line-through' : 'none' }}>
                          {f.concepto}
                          {!f.esAnulado && m.tipo === 'cargo' && (m.monto_pagado || 0) > 0 && (m.monto_pagado || 0) < m.monto && (
                            <div style={{ fontSize: 10, fontWeight: 400, color: T.amber, marginTop: 2, textDecoration: 'none' }}>
                              Parcial: cobrado {fmtMonto(m.monto_pagado || 0)}, falta {fmtMonto(m.monto - (m.monto_pagado || 0))}
                            </div>
                          )}
                          {!f.esAnulado && m.tipo === 'cargo' && (m.monto_pagado || 0) >= m.monto && m.monto > 0 && (
                            <div style={{ fontSize: 10, fontWeight: 400, color: T.green, marginTop: 2, textDecoration: 'none' }}>
                              Cobrada
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 600, fontSize: 13, color: f.esAnulado ? T.dim : esCobro ? T.green : T.red, textDecoration: f.esAnulado ? 'line-through' : 'none' }}>
                          {esCobro ? '-' : '+'}{fmtMonto(m.monto)}
                        </td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', fontSize: 12, color: T.muted }}>
                          {fmtMonto(f.saldoAcum)}
                        </td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {m.tipo === 'cargo' && !f.esAnulado && (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button onClick={() => abrirEditar(m)} title="Editar monto/concepto/fecha" style={{ background: T.surface, color: T.muted, border: `1px solid ${T.border2}`, borderRadius: 6, padding: '4px 9px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                                Editar
                              </button>
                              <button onClick={() => anularCargo(m)} title="Anular este cargo" style={{ background: T.redBg, color: T.red, border: `1px solid ${T.redBd}`, borderRadius: 6, padding: '4px 9px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                                Anular
                              </button>
                            </div>
                          )}
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

      {/* ── Modal registrar cobro ──────────────────────────────────────────── */}
      {cobroModal && cliente && (
        <div
          onMouseDown={onOverlayMouseDown} onClick={e => onOverlayClick(e, () => { setCobroModal(false) })}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.4)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(26,18,16,0.18)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Registrar cobro</div>
              <button onClick={() => setCobroModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12, color: T.muted }}>
                Saldo actual: <strong style={{ color: T.wine }}>{fmtMonto(cliente.saldo)}</strong> — el monto se aplica automáticamente a las facturas/remitos abiertos más viejos primero.
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                  {cobroSplit ? 'Monto — medio 1' : 'Monto cobrado'}
                  {cobroMedioPago === 'Cheque' && <span style={{ fontWeight: 400, color: T.dim, textTransform: 'none', letterSpacing: 0 }}> (suma de los cheques)</span>}
                </label>
                <input type="number" autoFocus
                  disabled={cobroMedioPago === 'Cheque'}
                  value={cobroMedioPago === 'Cheque' ? (cobroMonto1Final || '') : (cobroMonto || '')}
                  onChange={e => setCobroMonto(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit', ...(cobroMedioPago === 'Cheque' ? { background: T.bg, color: T.muted } : {}) }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Medio de pago</label>
                <select value={cobroMedioPago} onChange={e => setCobroMedioPago(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit' }}>
                  {MEDIOS_PAGO_COBRO.map(mp => <option key={mp}>{mp}</option>)}
                </select>
              </div>

              {cobroMedioPago === 'Cheque' && (
                <ChequesRecibidosFieldset cheques={cobroCheques1} onChange={setCobroCheques1} />
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.muted, cursor: 'pointer' }}>
                <input type="checkbox" checked={cobroSplit} onChange={e => setCobroSplit(e.target.checked)} />
                Dividir en 2 medios de pago (ej. mitad efectivo, mitad transferencia)
              </label>

              {cobroSplit && (
                <>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                      Monto — medio 2
                      {cobroMedioPago2 === 'Cheque' && <span style={{ fontWeight: 400, color: T.dim, textTransform: 'none', letterSpacing: 0 }}> (suma de los cheques)</span>}
                    </label>
                    <input type="number"
                      disabled={cobroMedioPago2 === 'Cheque'}
                      value={cobroMedioPago2 === 'Cheque' ? (cobroMonto2Final || '') : (cobroMonto2 || '')}
                      onChange={e => setCobroMonto2(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit', ...(cobroMedioPago2 === 'Cheque' ? { background: T.bg, color: T.muted } : {}) }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Medio de pago — medio 2</label>
                    <select value={cobroMedioPago2} onChange={e => setCobroMedioPago2(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit' }}>
                      {MEDIOS_PAGO_COBRO.map(mp => <option key={mp}>{mp}</option>)}
                    </select>
                  </div>
                  {cobroMedioPago2 === 'Cheque' && (
                    <ChequesRecibidosFieldset cheques={cobroCheques2} onChange={setCobroCheques2} />
                  )}
                  <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
                    Total: {fmtMonto(cobroMonto1Final + cobroMonto2Final)}
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Concepto</label>
                <input value={cobroConcepto} onChange={e => setCobroConcepto(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Fecha</label>
                <input type="date" value={cobroFecha} onChange={e => setCobroFecha(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setCobroModal(false)} style={{ background: T.bg, border: `1px solid ${T.border2}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button disabled={cobroGuardando || !cobroMonto1Final} onClick={guardarCobro} style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: cobroGuardando ? 'default' : 'pointer', opacity: cobroGuardando || !cobroMonto1Final ? 0.6 : 1, fontFamily: 'inherit' }}>
                {cobroGuardando ? 'Guardando...' : 'Confirmar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal cargar deuda (cargo suelto, sin venta asociada) ─────────────── */}
      {cargoModal && cliente && (
        <div
          onMouseDown={onOverlayMouseDown} onClick={e => onOverlayClick(e, () => { setCargoModal(false) })}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.4)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(26,18,16,0.18)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Cargar deuda</div>
              <button onClick={() => setCargoModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12, color: T.muted }}>
                Saldo actual: <strong style={{ color: T.wine }}>{fmtMonto(cliente.saldo)}</strong> — suma este monto a la deuda del cliente sin generar ninguna venta ni factura (para deudas viejas, ajustes, etc.).
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Monto adeudado</label>
                <input type="number" autoFocus value={cargoMonto || ''} onChange={e => setCargoMonto(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Concepto / motivo</label>
                <input autoFocus={false} placeholder="Ej: saldo anterior, préstamo, ajuste..." value={cargoConcepto} onChange={e => setCargoConcepto(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Fecha</label>
                <input type="date" value={cargoFecha} onChange={e => setCargoFecha(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setCargoModal(false)} style={{ background: T.bg, border: `1px solid ${T.border2}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button disabled={cargoGuardando || !cargoMonto} onClick={guardarCargo} style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: cargoGuardando ? 'default' : 'pointer', opacity: cargoGuardando || !cargoMonto ? 0.6 : 1, fontFamily: 'inherit' }}>
                {cargoGuardando ? 'Guardando...' : 'Confirmar deuda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal editar cargo ────────────────────────────────────────────────── */}
      {editarMov && (
        <div
          onMouseDown={onOverlayMouseDown} onClick={e => onOverlayClick(e, () => { setEditarMov(null) })}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.4)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(26,18,16,0.18)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Editar cargo</div>
              <button onClick={() => setEditarMov(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(editarMov.monto_pagado || 0) > 0.01 && (editarMov.monto_pagado || 0) < editarMov.monto - 0.01 && (
                <div style={{ fontSize: 12, color: T.amber, background: T.amberBg, border: `1px solid ${T.amberBd}`, borderRadius: 8, padding: '8px 12px' }}>
                  Este cargo tiene un pago parcial registrado — el monto queda fijo, solo se puede corregir el concepto o la fecha.
                </div>
              )}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Monto adeudado</label>
                <input
                  type="number" autoFocus value={editarMonto || ''} onChange={e => setEditarMonto(parseFloat(e.target.value) || 0)}
                  disabled={(editarMov.monto_pagado || 0) > 0.01 && (editarMov.monto_pagado || 0) < editarMov.monto - 0.01}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Concepto / motivo</label>
                <input value={editarConcepto} onChange={e => setEditarConcepto(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Fecha</label>
                <input type="date" value={editarFecha} onChange={e => setEditarFecha(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditarMov(null)} style={{ background: T.bg, border: `1px solid ${T.border2}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button disabled={editarGuardando || !editarMonto} onClick={guardarEditar} style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: editarGuardando ? 'default' : 'pointer', opacity: editarGuardando || !editarMonto ? 0.6 : 1, fontFamily: 'inherit' }}>
                {editarGuardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
