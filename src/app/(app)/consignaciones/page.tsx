'use client'
import { useEffect, useRef, useState } from 'react'

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8',
  text: '#1A1210', muted: '#6B5D55', dim: '#A89888',
  wine: '#800000', wineBg: 'rgba(128,0,0,0.07)', wineBd: 'rgba(128,0,0,0.18)',
  brown: '#633A2C', gold: '#B88A2C', goldBg: 'rgba(184,138,44,0.08)', goldBd: 'rgba(184,138,44,0.22)',
  green: '#2D7A4F', greenBg: 'rgba(45,122,79,0.08)', greenBd: 'rgba(45,122,79,0.22)',
  red: '#C03030', redBg: 'rgba(192,48,48,0.08)', redBd: 'rgba(192,48,48,0.22)',
  blue: '#2B5EA0', blueBg: 'rgba(43,94,160,0.08)', blueBd: 'rgba(43,94,160,0.22)',
  amber: '#A07010', amberBg: 'rgba(160,112,16,0.07)', amberBd: 'rgba(160,112,16,0.22)',
}

function btn(
  v: 'default' | 'accent' | 'ghost' | 'danger' | 'green' = 'default',
  ex: React.CSSProperties = {}
): React.CSSProperties {
  const bases = {
    default: { background: T.surface, border: `1px solid ${T.border}`, color: T.muted },
    accent:  { background: T.wine, border: `1px solid ${T.wine}`, color: '#FFFFFF' },
    ghost:   { background: 'transparent', border: '1px solid transparent', color: T.muted },
    danger:  { background: T.redBg, border: `1px solid ${T.redBd}`, color: T.red },
    green:   { background: T.greenBg, border: `1px solid ${T.greenBd}`, color: T.green },
  }
  return {
    ...bases[v], borderRadius: 7, padding: '6px 14px', fontSize: 13,
    fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.12s', ...ex,
  }
}

const INP: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
  color: T.text, padding: '9px 12px', fontSize: 13, outline: 'none',
  boxSizing: 'border-box' as const, fontFamily: 'inherit',
  transition: 'border-color 0.12s', width: '100%',
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface ConsItem {
  producto_id: string
  nombre: string
  cantidad: number
  cantidad_vendida: number
  precio_unitario: number
}

interface Consignacion {
  id: string
  numero: string
  empresa: string
  cliente_id: string | null
  cliente_nombre: string
  vendedor_nombre: string | null
  items: ConsItem[]
  total: number
  fecha_salida: string
  fecha_retorno_estimada: string | null
  estado: 'activa' | 'liquidada' | 'devuelta' | 'parcial'
  notas: string | null
  created_at: string
}

interface Cliente {
  id: string
  nombre: string
  apellido?: string
  razon_social?: string
}

interface Producto {
  id: string
  nombre: string
  bodega: string
  precio_venta?: number
}

interface Vendedor {
  id: string
  nombre: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function estadoBadge(estado: Consignacion['estado']) {
  const map: Record<string, { bg: string; bd: string; color: string }> = {
    activa:    { bg: T.goldBg,  bd: T.goldBd,  color: T.gold  },
    liquidada: { bg: T.greenBg, bd: T.greenBd, color: T.green },
    devuelta:  { bg: T.blueBg,  bd: T.blueBd,  color: T.blue  },
    parcial:   { bg: T.amberBg, bd: T.amberBd, color: T.amber },
  }
  const s = map[estado] || map.parcial
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 600, background: s.bg,
      border: `1px solid ${s.bd}`, color: s.color,
    }}>
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  )
}

const ITEM_EMPTY: ConsItem = {
  producto_id: '', nombre: '', cantidad: 1, cantidad_vendida: 0, precio_unitario: 0,
}

// ─── ClienteSearch ────────────────────────────────────────────────────────────
function ClienteSearch({
  clientes, value, onChange,
}: {
  clientes: Cliente[]
  value: string
  onChange: (id: string | null, nombre: string) => void
}) {
  const [q, setQ] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = clientes.filter(c => {
    const full = `${c.nombre || ''} ${c.apellido || ''} ${c.razon_social || ''}`.toLowerCase()
    return full.includes(q.toLowerCase())
  }).slice(0, 8)

  useEffect(() => { setQ(value) }, [value])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="cinp"
        style={INP}
        placeholder="Buscar cliente..."
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
          boxShadow: '0 4px 16px rgba(26,18,16,0.10)', maxHeight: 220, overflowY: 'auto',
        }}>
          {filtered.map(c => {
            const label = c.razon_social || `${c.nombre}${c.apellido ? ' ' + c.apellido : ''}`
            return (
              <div
                key={c.id}
                className="cbtn"
                style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` }}
                onMouseDown={() => {
                  onChange(c.id, label)
                  setQ(label)
                  setOpen(false)
                }}
              >
                {label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── ProductoSearch (per-row) ──────────────────────────────────────────────────
function ProductoSearch({
  productos, value, onChange,
}: {
  productos: Producto[]
  value: string
  onChange: (prod: Producto) => void
}) {
  const [q, setQ] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setQ(value) }, [value])

  const filtered = productos.filter(p =>
    `${p.nombre} ${p.bodega || ''}`.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 8)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="cinp"
        style={{ ...INP, minWidth: 180 }}
        placeholder="Buscar producto..."
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 300, minWidth: 260,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
          boxShadow: '0 4px 16px rgba(26,18,16,0.10)', maxHeight: 220, overflowY: 'auto',
        }}>
          {filtered.map(p => (
            <div
              key={p.id}
              className="cbtn"
              style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` }}
              onMouseDown={() => {
                onChange(p)
                setQ(`${p.nombre}${p.bodega ? ' — ' + p.bodega : ''}`)
                setOpen(false)
              }}
            >
              <span style={{ fontWeight: 500 }}>{p.nombre}</span>
              {p.bodega && <span style={{ color: T.dim, marginLeft: 6 }}>{p.bodega}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConsignacionesPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [consignaciones, setConsignaciones] = useState<Consignacion[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [modal, setModal] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [detalleModal, setDetalleModal] = useState<Consignacion | null>(null)
  const [liquidarModal, setLiquidarModal] = useState<Consignacion | null>(null)

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  // Nueva form
  const [form, setForm] = useState({
    cliente_id: null as string | null,
    cliente_nombre: '',
    vendedor_nombre: '',
    fecha_salida: today(),
    fecha_retorno_estimada: '',
    notas: '',
    items: [{ ...ITEM_EMPTY }] as ConsItem[],
  })

  // Liquidar items
  const [liqItems, setLiqItems] = useState<ConsItem[]>([])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function load(e: string) {
    setLoading(true)
    const [cRes, clRes, pRes, vRes] = await Promise.all([
      fetch(`/api/consignaciones?empresa=${e}`),
      fetch(`/api/clientes?empresa=${e}`),
      fetch(`/api/productos?empresa=${e}`),
      fetch(`/api/vendedores?empresa=${e}`),
    ])
    const [cData, clData, pData, vData] = await Promise.all([
      cRes.json(), clRes.json(), pRes.json(), vRes.json(),
    ])
    setConsignaciones(Array.isArray(cData) ? cData : [])
    setClientes(Array.isArray(clData) ? clData : [])
    setProductos(Array.isArray(pData) ? pData : [])
    setVendedores(Array.isArray(vData) ? vData : [])
    setLoading(false)
  }

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e)
    load(e)
  }, [])

  const dirtyConsignacion = form.cliente_nombre !== '' || form.items.some(i => i.nombre !== '')

  function tryCloseConsignacion() {
    if (dirtyConsignacion) { setConfirmClose(true) } else { setModal(false); resetForm() }
  }

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (modal && dirtyConsignacion) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [modal, dirtyConsignacion])

  // ─── KPIs ──────────────────────────────────────────────────────────────────
  const activas = consignaciones.filter(c => c.estado === 'activa')
  const valorEnCalle = activas.reduce((s, c) => s + (c.total || 0), 0)
  const now = new Date()
  const liquidadasMes = consignaciones.filter(c => {
    if (c.estado !== 'liquidada') return false
    const d = new Date(c.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  // ─── Handlers ──────────────────────────────────────────────────────────────
  function resetForm() {
    setForm({
      cliente_id: null,
      cliente_nombre: '',
      vendedor_nombre: '',
      fecha_salida: today(),
      fecha_retorno_estimada: '',
      notas: '',
      items: [{ ...ITEM_EMPTY }],
    })
  }

  function setItem(idx: number, patch: Partial<ConsItem>) {
    setForm(prev => {
      const items = prev.items.map((it, i) => i === idx ? { ...it, ...patch } : it)
      return { ...prev, items }
    })
  }

  function addItem() {
    setForm(prev => ({ ...prev, items: [...prev.items, { ...ITEM_EMPTY }] }))
  }

  function removeItem(idx: number) {
    setForm(prev => {
      if (prev.items.length <= 1) return prev
      return { ...prev, items: prev.items.filter((_, i) => i !== idx) }
    })
  }

  const formTotal = form.items.reduce(
    (s, it) => s + (it.cantidad || 0) * (it.precio_unitario || 0), 0
  )

  async function handleGuardar() {
    if (!form.cliente_nombre) { showToast('Ingrese un cliente'); return }
    if (!form.fecha_salida) { showToast('Ingrese fecha de salida'); return }
    const validItems = form.items.filter(it => it.nombre && it.cantidad > 0)
    if (validItems.length === 0) { showToast('Agregue al menos un producto'); return }

    const res = await fetch('/api/consignaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa,
        cliente_id: form.cliente_id,
        cliente_nombre: form.cliente_nombre,
        vendedor_nombre: form.vendedor_nombre || null,
        fecha_salida: form.fecha_salida,
        fecha_retorno_estimada: form.fecha_retorno_estimada || null,
        notas: form.notas || null,
        items: validItems,
        estado: 'activa',
      }),
    })
    if (!res.ok) { showToast('Error al guardar'); return }
    showToast('Consignación creada')
    setModal(false)
    resetForm()
    load(empresa)
  }

  async function handleDevolver(c: Consignacion) {
    if (!confirm(`¿Devolver toda la consignación ${c.numero}?`)) return
    const res = await fetch('/api/consignaciones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, estado: 'devuelta', items: c.items }),
    })
    if (!res.ok) { showToast('Error al devolver'); return }
    showToast('Consignación devuelta')
    load(empresa)
  }

  async function handleEliminar(c: Consignacion) {
    if (!confirm(`¿Eliminar la consignación ${c.numero}? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/consignaciones?id=${c.id}`, { method: 'DELETE' })
    if (!res.ok) { showToast('Error al eliminar'); return }
    showToast('Consignación eliminada')
    load(empresa)
  }

  function openLiquidar(c: Consignacion) {
    setLiqItems(c.items.map(it => ({ ...it, cantidad_vendida: it.cantidad_vendida || 0 })))
    setLiquidarModal(c)
  }

  async function handleLiquidar() {
    if (!liquidarModal) return
    const res = await fetch('/api/consignaciones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: liquidarModal.id,
        estado: 'liquidada',
        items: liqItems,
      }),
    })
    if (!res.ok) { showToast('Error al liquidar'); return }
    showToast('Consignación liquidada')
    setLiquidarModal(null)
    load(empresa)
  }

  const liqTotal = liqItems.reduce(
    (s, it) => s + (it.cantidad_vendida || 0) * (it.precio_unitario || 0), 0
  )

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'inherit', background: T.bg, minHeight: '100vh' }}>
      <style>{`
        .cons-row:hover { background: #FDFAF6 !important; }
        .cbtn:hover { opacity: 0.85; }
        .cinp:focus { border-color: #C8BAA8 !important; box-shadow: 0 0 0 3px rgba(128,0,0,0.08) !important; }
      `}</style>

      {/* Topbar */}
      <div style={{
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        padding: '16px 28px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Consignaciones</span>
        <button
          className="cbtn"
          style={btn('accent')}
          onClick={() => { resetForm(); setModal(true) }}
        >
          + Nueva consignación
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px' }}>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
            padding: '18px 20px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Activas
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: T.gold }}>{activas.length}</div>
          </div>
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
            padding: '18px 20px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Valor en calle
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: T.wine }}>{fmt(valorEnCalle)}</div>
          </div>
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
            padding: '18px 20px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Liquidadas este mes
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: T.green }}>{liquidadasMes}</div>
          </div>
        </div>

        {/* Table */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 10, overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.dim }}>Cargando...</div>
          ) : consignaciones.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.dim }}>
              No hay consignaciones. Creá la primera.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Número', 'Cliente', 'Vendedor', 'Fecha salida', 'Retorno est.', 'Items', 'Total', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: 11, fontWeight: 600, color: T.dim,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: `1px solid ${T.border}`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consignaciones.map(c => (
                  <tr
                    key={c.id}
                    className="cons-row"
                    style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                  >
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: T.wine }}>{c.numero}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: T.text }}>{c.cliente_nombre}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: T.muted }}>{c.vendedor_nombre || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: T.muted }}>{c.fecha_salida}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: T.muted }}>{c.fecha_retorno_estimada || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: T.muted }}>{(c.items || []).length}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: T.text }}>{fmt(c.total || 0)}</td>
                    <td style={{ padding: '11px 14px' }}>{estadoBadge(c.estado)}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="cbtn"
                          style={btn('default', { padding: '4px 10px', fontSize: 12 })}
                          onClick={() => setDetalleModal(c)}
                        >
                          Ver
                        </button>
                        {c.estado === 'activa' && (
                          <>
                            <button
                              className="cbtn"
                              style={btn('green', { padding: '4px 10px', fontSize: 12 })}
                              onClick={() => openLiquidar(c)}
                            >
                              Liquidar
                            </button>
                            <button
                              className="cbtn"
                              style={btn('danger', { padding: '4px 10px', fontSize: 12 })}
                              onClick={() => handleDevolver(c)}
                            >
                              Devolver todo
                            </button>
                          </>
                        )}
                        <button
                          className="cbtn"
                          style={btn('danger', { padding: '4px 10px', fontSize: 12 })}
                          onClick={() => handleEliminar(c)}
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
      </div>

      {/* ─── Modal Nueva Consignación ─────────────────────────────────────────── */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: T.surface, borderRadius: 14, padding: 24,
            width: '100%', maxWidth: 720,
            boxShadow: '0 8px 40px rgba(26,18,16,0.15)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Nueva consignación</h2>
              <button className="cbtn" style={btn('ghost')} onClick={tryCloseConsignacion}>✕</button>
            </div>

            {/* Row 1: Cliente, Vendedor, Fecha salida */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.dim, display: 'block', marginBottom: 5 }}>Cliente *</label>
                <ClienteSearch
                  clientes={clientes}
                  value={form.cliente_nombre}
                  onChange={(id, nombre) => setForm(p => ({ ...p, cliente_id: id, cliente_nombre: nombre }))}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.dim, display: 'block', marginBottom: 5 }}>Vendedor</label>
                <select
                  className="cinp"
                  style={INP}
                  value={form.vendedor_nombre}
                  onChange={e => setForm(p => ({ ...p, vendedor_nombre: e.target.value }))}
                >
                  <option value="">— Sin vendedor —</option>
                  {vendedores.map(v => (
                    <option key={v.id} value={v.nombre}>{v.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.dim, display: 'block', marginBottom: 5 }}>Fecha salida *</label>
                <input
                  className="cinp"
                  style={INP}
                  type="date"
                  value={form.fecha_salida}
                  onChange={e => setForm(p => ({ ...p, fecha_salida: e.target.value }))}
                />
              </div>
            </div>

            {/* Row 2: Fecha retorno, Notas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.dim, display: 'block', marginBottom: 5 }}>Fecha retorno estimada</label>
                <input
                  className="cinp"
                  style={INP}
                  type="date"
                  value={form.fecha_retorno_estimada}
                  onChange={e => setForm(p => ({ ...p, fecha_retorno_estimada: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.dim, display: 'block', marginBottom: 5 }}>Notas</label>
                <input
                  className="cinp"
                  style={INP}
                  type="text"
                  placeholder="Observaciones..."
                  value={form.notas}
                  onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
                />
              </div>
            </div>

            {/* Items table */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, marginBottom: 8 }}>PRODUCTOS</div>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      {['Producto', 'Cant.', 'Precio unit.', 'Subtotal', ''].map(h => (
                        <th key={h} style={{
                          padding: '8px 10px', textAlign: 'left',
                          fontSize: 11, fontWeight: 600, color: T.dim,
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                          borderBottom: `1px solid ${T.border}`,
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px 10px', minWidth: 220 }}>
                          <ProductoSearch
                            productos={productos}
                            value={item.nombre}
                            onChange={p => setItem(idx, {
                              producto_id: p.id,
                              nombre: p.nombre,
                              precio_unitario: p.precio_venta || 0,
                            })}
                          />
                        </td>
                        <td style={{ padding: '8px 10px', width: 70 }}>
                          <input
                            className="cinp"
                            style={{ ...INP, width: 60 }}
                            type="number"
                            min={1}
                            value={item.cantidad}
                            onChange={e => setItem(idx, { cantidad: Number(e.target.value) || 1 })}
                          />
                        </td>
                        <td style={{ padding: '8px 10px', width: 110 }}>
                          <input
                            className="cinp"
                            style={{ ...INP, width: 100 }}
                            type="number"
                            min={0}
                            value={item.precio_unitario}
                            onChange={e => setItem(idx, { precio_unitario: Number(e.target.value) || 0 })}
                          />
                        </td>
                        <td style={{ padding: '8px 10px', width: 100, fontSize: 13, color: T.muted }}>
                          {fmt(item.cantidad * item.precio_unitario)}
                        </td>
                        <td style={{ padding: '8px 10px', width: 36 }}>
                          <button
                            className="cbtn"
                            style={btn('ghost', { padding: '2px 8px', fontSize: 14, color: T.red })}
                            onClick={() => removeItem(idx)}
                            disabled={form.items.length <= 1}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                className="cbtn"
                style={{ ...btn('default', { marginTop: 8, padding: '5px 12px', fontSize: 12 }) }}
                onClick={addItem}
              >
                + Agregar producto
              </button>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
                Total: <span style={{ color: T.wine }}>{fmt(formTotal)}</span>
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="cbtn" style={btn('default')} onClick={tryCloseConsignacion}>Cancelar</button>
                <button className="cbtn" style={btn('accent')} onClick={handleGuardar}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm close */}
      {confirmClose && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: T.surface, borderRadius: 12, padding: 28, maxWidth: 360, width: '90%', boxShadow: '0 20px 60px rgba(26,18,16,0.22)', border: `1px solid ${T.border2}` }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 15, color: T.text }}>¿Salir sin guardar?</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: T.muted }}>Tenés datos sin guardar en la consignación. Si salís ahora se van a perder.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="cbtn" style={btn('default')} onClick={() => setConfirmClose(false)}>Volver</button>
              <button className="cbtn" style={btn('danger')} onClick={() => { setConfirmClose(false); setModal(false); resetForm() }}>Salir igual</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Liquidar ───────────────────────────────────────────────────── */}
      {liquidarModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: T.surface, borderRadius: 14, padding: 24,
            width: '100%', maxWidth: 620,
            boxShadow: '0 8px 40px rgba(26,18,16,0.15)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>
                Liquidar consignación — {liquidarModal.numero}
              </h2>
              <button className="cbtn" style={btn('ghost')} onClick={() => setLiquidarModal(null)}>✕</button>
            </div>

            <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Producto', 'Enviado', 'Vendido', 'Vuelve', 'Total vendido'].map(h => (
                      <th key={h} style={{
                        padding: '9px 12px', textAlign: 'left',
                        fontSize: 11, fontWeight: 600, color: T.dim,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        borderBottom: `1px solid ${T.border}`,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {liqItems.map((item, idx) => {
                    const vendido = item.cantidad_vendida || 0
                    const vuelve = item.cantidad - vendido
                    return (
                      <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 12px', fontSize: 13, color: T.text, fontWeight: 500 }}>{item.nombre}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, color: T.muted }}>{item.cantidad}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <input
                            className="cinp"
                            style={{ ...INP, width: 70 }}
                            type="number"
                            min={0}
                            max={item.cantidad}
                            value={vendido}
                            onChange={e => {
                              const v = Math.min(Number(e.target.value) || 0, item.cantidad)
                              setLiqItems(prev => prev.map((it, i) => i === idx ? { ...it, cantidad_vendida: v } : it))
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 13, color: T.muted }}>{vuelve}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: T.text }}>
                          {fmt(vendido * item.precio_unitario)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
                Total a cobrar: <span style={{ color: T.green }}>{fmt(liqTotal)}</span>
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="cbtn" style={btn('default')} onClick={() => setLiquidarModal(null)}>Cancelar</button>
                <button className="cbtn" style={btn('green')} onClick={handleLiquidar}>Confirmar liquidación</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Detalle ────────────────────────────────────────────────────── */}
      {detalleModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: T.surface, borderRadius: 14, padding: 24,
            width: '100%', maxWidth: 600,
            boxShadow: '0 8px 40px rgba(26,18,16,0.15)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>
                {detalleModal.numero}
              </h2>
              <button className="cbtn" style={btn('ghost')} onClick={() => setDetalleModal(null)}>✕</button>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Cliente', value: detalleModal.cliente_nombre },
                { label: 'Vendedor', value: detalleModal.vendedor_nombre || '—' },
                { label: 'Fecha salida', value: detalleModal.fecha_salida },
                { label: 'Retorno estimado', value: detalleModal.fecha_retorno_estimada || '—' },
                { label: 'Estado', value: null },
                { label: 'Notas', value: detalleModal.notas || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.dim, textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                  {label === 'Estado'
                    ? estadoBadge(detalleModal.estado)
                    : <div style={{ fontSize: 13, color: T.text }}>{value}</div>
                  }
                </div>
              ))}
            </div>

            {/* Items */}
            <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, textTransform: 'uppercase', marginBottom: 8 }}>Productos</div>
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Producto', 'Enviado', 'Vendido', 'Precio', 'Subtotal'].map(h => (
                      <th key={h} style={{
                        padding: '8px 10px', textAlign: 'left',
                        fontSize: 11, fontWeight: 600, color: T.dim,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        borderBottom: `1px solid ${T.border}`,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(detalleModal.items || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '9px 10px', fontSize: 13, color: T.text }}>{item.nombre}</td>
                      <td style={{ padding: '9px 10px', fontSize: 13, color: T.muted }}>{item.cantidad}</td>
                      <td style={{ padding: '9px 10px', fontSize: 13, color: T.muted }}>{item.cantidad_vendida ?? 0}</td>
                      <td style={{ padding: '9px 10px', fontSize: 13, color: T.muted }}>{fmt(item.precio_unitario)}</td>
                      <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 600, color: T.text }}>
                        {fmt(item.cantidad * item.precio_unitario)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
                Total: <span style={{ color: T.wine }}>{fmt(detalleModal.total || 0)}</span>
              </span>
              <button className="cbtn" style={btn('default')} onClick={() => setDetalleModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: '12px 20px',
          boxShadow: '0 4px 20px rgba(26,18,16,0.12)',
          zIndex: 100, fontSize: 14, color: T.text, fontWeight: 500,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
