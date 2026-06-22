'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Design tokens ────────────────────────────────────────────────────────────
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

function btn(v: 'default' | 'accent' | 'ghost' | 'danger' | 'green' = 'default', ex: React.CSSProperties = {}): React.CSSProperties {
  const bases = {
    default: { background: T.surface, border: `1px solid ${T.border}`, color: T.muted },
    accent:  { background: T.wine, border: `1px solid ${T.wine}`, color: '#FFFFFF' },
    ghost:   { background: 'transparent', border: '1px solid transparent', color: T.muted },
    danger:  { background: T.redBg, border: `1px solid ${T.redBd}`, color: T.red },
    green:   { background: T.greenBg, border: `1px solid ${T.greenBd}`, color: T.green },
  }
  return { ...bases[v], borderRadius: 7, padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s', ...ex }
}

const INP: React.CSSProperties = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 7,
  color: T.text,
  padding: '9px 12px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box' as const,
  fontFamily: 'inherit',
  width: '100%',
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Visita {
  id: string
  empresa: string
  cliente_id: string | null
  cliente_nombre: string
  vendedor_nombre: string | null
  fecha: string
  tipo: 'visita' | 'llamada' | 'muestra' | 'email'
  estado: 'pendiente' | 'realizada' | 'cancelada'
  notas: string | null
  resultado: string | null
  created_at: string
}

interface Objetivo {
  id: string
  empresa: string
  vendedor_nombre: string
  mes: number
  anio: number
  objetivo_monto: number
}

interface Cliente {
  id: string
  nombre: string
  apellido?: string
  razon_social?: string
}

interface Vendedor {
  id: string
  nombre: string
}

interface VentaResumen {
  vendedor_nombre: string
  total: number
}

type Tab = 'actividad' | 'objetivos'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtFecha(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function Badge({ color, bg, border, children }: { color: string; bg: string; border: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 600, color, background: bg, border: `1px solid ${border}`,
    }}>
      {children}
    </span>
  )
}

function TipoBadge({ tipo }: { tipo: string }) {
  if (tipo === 'visita')   return <Badge color={T.blue}  bg={T.blueBg}  border={T.blueBd}>Visita</Badge>
  if (tipo === 'llamada')  return <Badge color={T.amber} bg={T.amberBg} border={T.amberBd}>Llamada</Badge>
  if (tipo === 'muestra')  return <Badge color={T.wine}  bg={T.wineBg}  border={T.wineBd}>Muestra</Badge>
  if (tipo === 'email')    return <Badge color={T.green} bg={T.greenBg} border={T.greenBd}>Email</Badge>
  return <Badge color={T.dim} bg="rgba(168,152,136,0.10)" border="rgba(168,152,136,0.28)">{tipo}</Badge>
}

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === 'pendiente')  return <Badge color={T.amber} bg={T.amberBg} border={T.amberBd}>Pendiente</Badge>
  if (estado === 'realizada')  return <Badge color={T.green} bg={T.greenBg} border={T.greenBd}>Realizada</Badge>
  if (estado === 'cancelada')  return <Badge color={T.dim}   bg="rgba(168,152,136,0.10)" border="rgba(168,152,136,0.28)">Cancelada</Badge>
  return <Badge color={T.dim} bg="rgba(168,152,136,0.10)" border="rgba(168,152,136,0.28)">{estado}</Badge>
}

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastMsg { id: number; text: string; type: 'ok' | 'err' }

function Toast({ msgs }: { msgs: ToastMsg[] }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {msgs.map(m => (
        <div key={m.id} style={{
          background: m.type === 'ok' ? T.green : T.red,
          color: '#fff', padding: '10px 18px', borderRadius: 8,
          fontSize: 13, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          pointerEvents: 'none', opacity: 1,
        }}>
          {m.text}
        </div>
      ))}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, bg, border }: {
  label: string; value: number | string; color: string; bg: string; border: string
}) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 700, color }}>{value}</span>
    </div>
  )
}

// ─── Visita Modal Form ────────────────────────────────────────────────────────
interface VisitaFormData {
  cliente_id: string | null
  cliente_nombre: string
  vendedor_nombre: string
  fecha: string
  tipo: 'visita' | 'llamada' | 'muestra' | 'email'
  estado: 'pendiente' | 'realizada' | 'cancelada'
  notas: string
  resultado: string
}

const EMPTY_FORM: VisitaFormData = {
  cliente_id: null,
  cliente_nombre: '',
  vendedor_nombre: '',
  fecha: todayISO(),
  tipo: 'visita',
  estado: 'pendiente',
  notas: '',
  resultado: '',
}

interface VisitaModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: VisitaFormData) => Promise<void>
  initial?: Visita | null
  clientes: Cliente[]
  vendedores: Vendedor[]
  title: string
}

function VisitaModal({ open, onClose, onSave, initial, clientes, vendedores, title }: VisitaModalProps) {
  const [form, setForm] = useState<VisitaFormData>(EMPTY_FORM)
  const [clienteSearch, setClienteSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const dirty = form.cliente_nombre !== '' || form.notas !== '' || form.resultado !== ''

  function tryClose() {
    if (dirty) { setConfirmClose(true) } else { onClose() }
  }

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (open && dirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [open, dirty])

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          cliente_id: initial.cliente_id,
          cliente_nombre: initial.cliente_nombre,
          vendedor_nombre: initial.vendedor_nombre || '',
          fecha: initial.fecha,
          tipo: initial.tipo,
          estado: initial.estado,
          notas: initial.notas || '',
          resultado: initial.resultado || '',
        })
        setClienteSearch(initial.cliente_nombre)
      } else {
        setForm({ ...EMPTY_FORM, fecha: todayISO() })
        setClienteSearch('')
      }
    }
  }, [open, initial])

  // Close suggestions on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredClientes = clienteSearch.length > 0
    ? clientes.filter(c => {
        const full = [c.nombre, c.apellido, c.razon_social].filter(Boolean).join(' ').toLowerCase()
        return full.includes(clienteSearch.toLowerCase())
      }).slice(0, 8)
    : []

  function set(k: keyof VisitaFormData, v: string | null) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!form.cliente_nombre.trim()) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  if (!open) return null

  return (
    <>
    {confirmClose && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: T.surface, borderRadius: 12, padding: 28, maxWidth: 360, width: '90%', boxShadow: '0 20px 60px rgba(26,18,16,0.22)', border: `1px solid ${T.border2}` }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 15, color: T.text }}>¿Salir sin guardar?</p>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: T.muted }}>Tenés datos sin guardar en la actividad. Si salís ahora se van a perder.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="cbtn" style={btn('default')} onClick={() => setConfirmClose(false)}>Volver</button>
            <button className="cbtn" style={btn('danger')} onClick={() => { setConfirmClose(false); onClose() }}>Salir igual</button>
          </div>
        </div>
      </div>
    )}
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: T.surface, borderRadius: 12, padding: 28, width: 560, maxWidth: '95vw',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.text }}>{title}</h2>
          <button onClick={tryClose} style={{ ...btn('ghost'), padding: '4px 8px', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        {/* Row 1: Cliente + Vendedor */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Cliente *</label>
            <div ref={searchRef} style={{ position: 'relative' }}>
              <input
                className="cinp"
                style={INP}
                placeholder="Buscar cliente..."
                value={clienteSearch}
                onChange={e => {
                  setClienteSearch(e.target.value)
                  set('cliente_nombre', e.target.value)
                  set('cliente_id', null)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              {showSuggestions && filteredClientes.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, background: T.surface,
                  border: `1px solid ${T.border}`, borderRadius: 7, zIndex: 10,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto',
                }}>
                  {filteredClientes.map(c => {
                    const label = c.razon_social || [c.nombre, c.apellido].filter(Boolean).join(' ')
                    return (
                      <div
                        key={c.id}
                        onMouseDown={() => {
                          setClienteSearch(label)
                          set('cliente_nombre', label)
                          set('cliente_id', c.id)
                          setShowSuggestions(false)
                        }}
                        style={{
                          padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                          color: T.text, borderBottom: `1px solid ${T.border}`,
                        }}
                      >
                        {label}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Vendedor</label>
            <select
              className="cinp"
              style={INP}
              value={form.vendedor_nombre}
              onChange={e => set('vendedor_nombre', e.target.value)}
            >
              <option value="">Sin asignar</option>
              {vendedores.map(v => (
                <option key={v.id} value={v.nombre}>{v.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Fecha + Tipo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Fecha</label>
            <input
              className="cinp"
              type="date"
              style={INP}
              value={form.fecha}
              onChange={e => set('fecha', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Tipo</label>
            <select
              className="cinp"
              style={INP}
              value={form.tipo}
              onChange={e => set('tipo', e.target.value as VisitaFormData['tipo'])}
            >
              <option value="visita">Visita</option>
              <option value="llamada">Llamada</option>
              <option value="muestra">Muestra</option>
              <option value="email">Email</option>
            </select>
          </div>
        </div>

        {/* Estado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Estado</label>
          <select
            className="cinp"
            style={{ ...INP, width: '50%' }}
            value={form.estado}
            onChange={e => set('estado', e.target.value as VisitaFormData['estado'])}
          >
            <option value="pendiente">Pendiente</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        {/* Notas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Notas</label>
          <textarea
            className="cinp"
            style={{ ...INP, minHeight: 72, resize: 'vertical' }}
            value={form.notas}
            onChange={e => set('notas', e.target.value)}
            placeholder="Notas de la actividad..."
          />
        </div>

        {/* Resultado — solo si realizada */}
        {form.estado === 'realizada' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Resultado</label>
            <textarea
              className="cinp"
              style={{ ...INP, minHeight: 60, resize: 'vertical' }}
              value={form.resultado}
              onChange={e => set('resultado', e.target.value)}
              placeholder="Resultado obtenido..."
            />
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
          <button className="cbtn" style={btn('default')} onClick={tryClose} disabled={saving}>
            Cancelar
          </button>
          <button className="cbtn" style={btn('accent')} onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CrmPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [tab, setTab] = useState<Tab>('actividad')
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const toastId = useRef(0)

  // Activity state
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])

  // Filters
  const [filterSearch, setFilterSearch] = useState('')
  const [filterVendedor, setFilterVendedor] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterEstado, setFilterEstado] = useState('')

  // Modals
  const [modalNueva, setModalNueva] = useState(false)
  const [modalEditar, setModalEditar] = useState<Visita | null>(null)

  // Objetivos state
  const now = new Date()
  const [mesSel, setMesSel] = useState(now.getMonth() + 1)
  const [anioSel, setAnioSel] = useState(now.getFullYear())
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [ventasData, setVentasData] = useState<VentaResumen[]>([])
  const [objLoading, setObjLoading] = useState(false)
  const [objInputs, setObjInputs] = useState<Record<string, number>>({})

  // ─── Toast helper ─────────────────────────────────────────────────────────
  function toast(text: string, type: 'ok' | 'err' = 'ok') {
    const id = ++toastId.current
    setToasts(ts => [...ts, { id, text, type }])
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 3000)
  }

  // ─── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    const emp = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(emp)
  }, [])

  useEffect(() => {
    if (!empresa) return
    fetch('/api/clientes').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setClientes(d)
    })
    fetch('/api/vendedores').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setVendedores(d)
    })
  }, [empresa])

  // ─── Fetch Visitas ─────────────────────────────────────────────────────────
  const fetchVisitas = useCallback(async () => {
    if (!empresa) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ empresa })
      if (filterVendedor) params.set('vendedor', filterVendedor)
      if (filterEstado)   params.set('estado', filterEstado)
      if (filterTipo)     params.set('tipo', filterTipo)
      const r = await fetch(`/api/crm/visitas?${params}`)
      const d = await r.json()
      if (Array.isArray(d)) setVisitas(d)
    } finally {
      setLoading(false)
    }
  }, [empresa, filterVendedor, filterEstado, filterTipo])

  useEffect(() => {
    if (tab === 'actividad' && empresa) fetchVisitas()
  }, [tab, empresa, fetchVisitas])

  // ─── Fetch Objetivos ───────────────────────────────────────────────────────
  const fetchObjetivos = useCallback(async () => {
    if (!empresa) return
    setObjLoading(true)
    try {
      const [objRes, repRes] = await Promise.all([
        fetch(`/api/crm/objetivos?empresa=${empresa}&mes=${mesSel}&anio=${anioSel}`),
        fetch(`/api/reportes?empresa=${empresa}&desde=${anioSel}-${String(mesSel).padStart(2,'0')}-01&hasta=${anioSel}-${String(mesSel).padStart(2,'0')}-31`),
      ])
      const objData = await objRes.json()
      const repData = await repRes.json()
      if (Array.isArray(objData)) {
        setObjetivos(objData)
        const inputs: Record<string, number> = {}
        objData.forEach((o: Objetivo) => { inputs[o.vendedor_nombre] = o.objetivo_monto })
        setObjInputs(inputs)
      }
      if (repData && Array.isArray(repData.porVendedor)) {
        setVentasData(repData.porVendedor.map((v: { nombre: string; total: number }) => ({
          vendedor_nombre: v.nombre,
          total: v.total,
        })))
      }
    } finally {
      setObjLoading(false)
    }
  }, [empresa, mesSel, anioSel])

  useEffect(() => {
    if (tab === 'objetivos' && empresa) fetchObjetivos()
  }, [tab, empresa, fetchObjetivos])

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const pendientesMonth = visitas.filter(v => v.estado === 'pendiente' && v.fecha.startsWith(thisMonth)).length
  const realizadasMonth = visitas.filter(v => v.estado === 'realizada' && v.fecha.startsWith(thisMonth)).length
  const muestrasTotal   = visitas.filter(v => v.tipo === 'muestra').length

  // ─── Filtered list ────────────────────────────────────────────────────────
  const filtered = visitas.filter(v => {
    if (filterSearch) {
      const q = filterSearch.toLowerCase()
      if (!v.cliente_nombre.toLowerCase().includes(q)) return false
    }
    return true
  })

  // ─── Handlers ─────────────────────────────────────────────────────────────
  async function handleCrear(form: VisitaFormData) {
    const body = { ...form, empresa }
    const r = await fetch('/api/crm/visitas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!r.ok) { toast('Error al guardar', 'err'); return }
    toast('Actividad creada')
    setModalNueva(false)
    fetchVisitas()
  }

  async function handleEditar(form: VisitaFormData) {
    if (!modalEditar) return
    const r = await fetch('/api/crm/visitas', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: modalEditar.id, ...form }),
    })
    if (!r.ok) { toast('Error al actualizar', 'err'); return }
    toast('Actividad actualizada')
    setModalEditar(null)
    fetchVisitas()
  }

  async function handleMarcarRealizada(visita: Visita) {
    const r = await fetch('/api/crm/visitas', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: visita.id, estado: 'realizada' }),
    })
    if (!r.ok) { toast('Error al actualizar', 'err'); return }
    toast('Marcada como realizada')
    fetchVisitas()
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar esta actividad?')) return
    const r = await fetch(`/api/crm/visitas?id=${id}`, { method: 'DELETE' })
    if (!r.ok) { toast('Error al eliminar', 'err'); return }
    toast('Actividad eliminada')
    fetchVisitas()
  }

  async function handleGuardarObjetivo(vendedorNombre: string) {
    const monto = objInputs[vendedorNombre] ?? 0
    const r = await fetch('/api/crm/objetivos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa, vendedor_nombre: vendedorNombre, mes: mesSel, anio: anioSel, objetivo_monto: monto }),
    })
    if (!r.ok) { toast('Error al guardar objetivo', 'err'); return }
    toast(`Objetivo guardado para ${vendedorNombre}`)
    fetchObjetivos()
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .crm-row:hover { background: #FDFAF6 !important; }
        .cbtn:hover { opacity: 0.85; }
        .cinp:focus { border-color: #C8BAA8 !important; box-shadow: 0 0 0 3px rgba(128,0,0,0.08) !important; }
      `}</style>

      {/* Topbar */}
      <div style={{
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>CRM</h1>
        <button
          className="cbtn"
          style={btn('accent')}
          onClick={() => setModalNueva(true)}
        >
          + Nueva actividad
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px', background: T.bg, minHeight: '100vh' }}>

        {/* Tab switcher */}
        <div style={{
          display: 'inline-flex', background: T.bg, border: `1px solid ${T.border}`,
          borderRadius: 9, padding: 3, gap: 2, marginBottom: 24,
        }}>
          {(['actividad', 'objetivos'] as Tab[]).map(t => (
            <button
              key={t}
              className="cbtn"
              onClick={() => setTab(t)}
              style={{
                borderRadius: 7, padding: '6px 18px', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                border: 'none',
                background: tab === t ? T.wine : 'transparent',
                color: tab === t ? '#fff' : T.muted,
              }}
            >
              {t === 'actividad' ? 'Actividad' : 'Objetivos'}
            </button>
          ))}
        </div>

        {/* ── TAB ACTIVIDAD ── */}
        {tab === 'actividad' && (
          <>
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              <KpiCard label="Pendientes este mes" value={pendientesMonth} color={T.amber} bg={T.amberBg} border={T.amberBd} />
              <KpiCard label="Realizadas este mes" value={realizadasMonth} color={T.green} bg={T.greenBg} border={T.greenBd} />
              <KpiCard label="Muestras enviadas" value={muestrasTotal} color={T.blue} bg={T.blueBg} border={T.blueBd} />
            </div>

            {/* Filter bar */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
              padding: '16px 20px', marginBottom: 16,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <input
                  className="cinp"
                  style={INP}
                  placeholder="Buscar cliente..."
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                />
                <select
                  className="cinp"
                  style={INP}
                  value={filterVendedor}
                  onChange={e => { setFilterVendedor(e.target.value) }}
                >
                  <option value="">Todos los vendedores</option>
                  {vendedores.map(v => <option key={v.id} value={v.nombre}>{v.nombre}</option>)}
                </select>
                <select
                  className="cinp"
                  style={INP}
                  value={filterTipo}
                  onChange={e => { setFilterTipo(e.target.value) }}
                >
                  <option value="">Todos los tipos</option>
                  <option value="visita">Visita</option>
                  <option value="llamada">Llamada</option>
                  <option value="muestra">Muestra</option>
                  <option value="email">Email</option>
                </select>
                <select
                  className="cinp"
                  style={INP}
                  value={filterEstado}
                  onChange={e => { setFilterEstado(e.target.value) }}
                >
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="realizada">Realizada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>

            {/* Apply filters button */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cbtn" style={btn('default')} onClick={fetchVisitas}>
                Aplicar filtros
              </button>
            </div>

            {/* Table */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: T.dim }}>No hay actividades registradas</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                      {['Fecha', 'Cliente', 'Vendedor', 'Tipo', 'Estado', 'Notas', 'Acciones'].map(h => (
                        <th key={h} style={{
                          padding: '10px 14px', textAlign: 'left', fontSize: 11,
                          fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(v => (
                      <tr key={v.id} className="crm-row" style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}>
                        <td style={{ padding: '10px 14px', color: T.text, whiteSpace: 'nowrap' }}>
                          {fmtFecha(v.fecha)}
                        </td>
                        <td style={{ padding: '10px 14px', color: T.text, fontWeight: 500 }}>
                          {v.cliente_nombre}
                        </td>
                        <td style={{ padding: '10px 14px', color: T.muted }}>
                          {v.vendedor_nombre || <span style={{ color: T.dim }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <TipoBadge tipo={v.tipo} />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <EstadoBadge estado={v.estado} />
                        </td>
                        <td style={{ padding: '10px 14px', color: T.muted, maxWidth: 200 }}>
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {v.notas || <span style={{ color: T.dim }}>—</span>}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {v.estado === 'pendiente' && (
                              <button
                                className="cbtn"
                                style={btn('green', { padding: '4px 10px', fontSize: 12 })}
                                onClick={() => handleMarcarRealizada(v)}
                              >
                                Realizada
                              </button>
                            )}
                            <button
                              className="cbtn"
                              style={btn('default', { padding: '4px 10px', fontSize: 12 })}
                              onClick={() => setModalEditar(v)}
                            >
                              Ver/Editar
                            </button>
                            <button
                              className="cbtn"
                              style={btn('danger', { padding: '4px 10px', fontSize: 12 })}
                              onClick={() => handleEliminar(v.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── TAB OBJETIVOS ── */}
        {tab === 'objetivos' && (
          <>
            {/* Month/Year selector */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
              padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <select
                className="cinp"
                style={{ ...INP, width: 'auto', minWidth: 130 }}
                value={mesSel}
                onChange={e => setMesSel(Number(e.target.value))}
              >
                {[
                  [1,'Enero'],[2,'Febrero'],[3,'Marzo'],[4,'Abril'],[5,'Mayo'],[6,'Junio'],
                  [7,'Julio'],[8,'Agosto'],[9,'Septiembre'],[10,'Octubre'],[11,'Noviembre'],[12,'Diciembre'],
                ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select
                className="cinp"
                style={{ ...INP, width: 'auto', minWidth: 90 }}
                value={anioSel}
                onChange={e => setAnioSel(Number(e.target.value))}
              >
                {[anioSel - 2, anioSel - 1, anioSel, anioSel + 1, anioSel + 2].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button className="cbtn" style={btn('accent')} onClick={fetchObjetivos}>
                Cargar
              </button>
            </div>

            {/* Vendedor cards */}
            {objLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando objetivos...</div>
            ) : vendedores.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.dim }}>No hay vendedores registrados</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {vendedores.map(vend => {
                  const monto = objInputs[vend.nombre] ?? 0
                  const realEntry = ventasData.find(v => v.vendedor_nombre === vend.nombre)
                  const real = realEntry?.total ?? 0
                  const objetivo = monto > 0 ? monto : 0
                  const pct = objetivo > 0 ? Math.min((real / objetivo) * 100, 100) : 0
                  const barColor = pct >= 80 ? T.green : pct >= 50 ? T.amber : T.red

                  return (
                    <div key={vend.id} style={{
                      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
                      padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{vend.nombre}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Objetivo $</label>
                          <input
                            className="cinp"
                            type="number"
                            min={0}
                            style={{ ...INP, width: 160 }}
                            value={monto}
                            onChange={e => setObjInputs(prev => ({ ...prev, [vend.nombre]: Number(e.target.value) }))}
                          />
                          <button
                            className="cbtn"
                            style={btn('accent', { padding: '6px 16px' })}
                            onClick={() => handleGuardarObjetivo(vend.nombre)}
                          >
                            Guardar
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Objetivo</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>
                            {objetivo > 0 ? `$${objetivo.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : <span style={{ color: T.dim }}>Sin definir</span>}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Real vendido</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>
                            {`$${real.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Cumplimiento</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: barColor }}>
                            {objetivo > 0 ? `${pct.toFixed(1)}%` : '—'}
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      {objetivo > 0 && (
                        <div>
                          <div style={{
                            height: 10, borderRadius: 6, background: T.bg,
                            border: `1px solid ${T.border}`, overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%', width: `${pct}%`,
                              background: barColor, borderRadius: 6,
                              transition: 'width 0.4s ease',
                            }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <VisitaModal
        open={modalNueva}
        onClose={() => setModalNueva(false)}
        onSave={handleCrear}
        clientes={clientes}
        vendedores={vendedores}
        title="Nueva actividad"
      />
      <VisitaModal
        open={!!modalEditar}
        onClose={() => setModalEditar(null)}
        onSave={handleEditar}
        initial={modalEditar}
        clientes={clientes}
        vendedores={vendedores}
        title="Editar actividad"
      />

      <Toast msgs={toasts} />
    </>
  )
}
