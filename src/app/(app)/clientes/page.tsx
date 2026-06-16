'use client'
import { useEffect, useState } from 'react'
import type { Cliente } from '@/types'

const TIPOS = [
  { value: 'consumidor_final', label: 'Consumidor final' },
  { value: 'revendedor',       label: 'Revendedor' },
  { value: 'mayorista',        label: 'Mayorista' },
  { value: 'gastronomia',      label: 'Gastronomía' },
  { value: 'otro',             label: 'Otro' },
]

interface MovCtaCte {
  id: string; tipo: string; concepto: string; monto: number
  saldo_anterior?: number; saldo_nuevo?: number; fecha?: string; created_at: string
}

const EMPTY: Omit<Cliente, 'id' | 'created_at'> = {
  empresa: 'aroma', nombre: '', apellido: '', razon_social: '', cuit: '',
  email: '', telefono: '', direccion: '', tipo: 'consumidor_final',
  saldo: 0, limite_credito: 0, notas: '', activo: true,
}

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#0F0F0F', surface: '#141414', card: '#1A1A1A', border: '#2A2A2A',
  accent: '#8B1A2A', text: '#E8E8E8', muted: '#888888', dim: '#555555',
  green: '#4CAF7D', amber: '#D4820A', red: '#E05555',
  dangerBg: '#3A1010', dangerBorder: '#8B2020',
}

const INP: React.CSSProperties = {
  background: '#111', border: `1px solid ${C.border}`, borderRadius: 6,
  color: C.text, padding: '6px 9px', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

function btn(v: 'default' | 'accent' | 'ghost' | 'danger' | 'green' = 'default', ex: React.CSSProperties = {}): React.CSSProperties {
  const bases: Record<string, React.CSSProperties> = {
    default: { background: '#222', border: `1px solid ${C.border}` },
    accent:  { background: C.accent, border: `1px solid ${C.accent}` },
    ghost:   { background: 'transparent', border: '1px solid transparent' },
    danger:  { background: C.dangerBg, border: `1px solid ${C.dangerBorder}` },
    green:   { background: 'rgba(76,175,125,0.15)', border: '1px solid rgba(76,175,125,0.35)' },
  }
  return { ...bases[v], color: C.text, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer', ...ex }
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: C.dim, fontWeight: 500, marginBottom: 4 }}>{children}</div>
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function ClientesPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })
  const [editId, setEditId] = useState<string | null>(null)
  const [cobroModal, setCobroModal] = useState(false)
  const [cobroCliente, setCobroCliente] = useState<Cliente | null>(null)
  const [cobroMonto, setCobroMonto] = useState(0)
  const [cobroConcepto, setCobroConcepto] = useState('Cobro cuenta corriente')
  const [cobroFecha, setCobroFecha] = useState(new Date().toISOString().split('T')[0])
  const [histModal, setHistModal] = useState(false)
  const [histCliente, setHistCliente] = useState<Cliente | null>(null)
  const [histMovs, setHistMovs] = useState<MovCtaCte[]>([])
  const [histCargando, setHistCargando] = useState(false)
  const [histDesde, setHistDesde] = useState('')
  const [histHasta, setHistHasta] = useState(new Date().toISOString().split('T')[0])
  const [busqueda, setBusqueda] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e); cargar(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    const res = await fetch(`/api/clientes?empresa=${emp}`)
    const data = await res.json()
    setClientes(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  function abrirNuevo() {
    setForm({ ...EMPTY, empresa: empresa as 'aroma' | 'lavid' })
    setEditId(null); setModal(true)
  }

  function abrirEditar(c: Cliente) {
    setForm({
      empresa: c.empresa, nombre: c.nombre, apellido: c.apellido || '',
      razon_social: c.razon_social || '', cuit: c.cuit || '', email: c.email || '',
      telefono: c.telefono || '', direccion: c.direccion || '', tipo: c.tipo,
      saldo: c.saldo, limite_credito: c.limite_credito || 0, notas: c.notas || '', activo: c.activo,
    })
    setEditId(c.id!); setModal(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio'); return }
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { id: editId, ...form } : form
    const res = await fetch('/api/clientes', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false); cargar(empresa)
    showToast(editId ? 'Cliente actualizado' : 'Cliente guardado')
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este cliente?')) return
    await fetch(`/api/clientes?id=${id}`, { method: 'DELETE' })
    cargar(empresa); showToast('Cliente eliminado')
  }

  function abrirCobro(c: Cliente) {
    setCobroCliente(c); setCobroMonto(0)
    setCobroConcepto('Cobro cuenta corriente')
    setCobroFecha(new Date().toISOString().split('T')[0])
    setCobroModal(true)
  }

  async function guardarCobro() {
    if (!cobroCliente) return
    if (!cobroMonto || cobroMonto <= 0) { showToast('Ingresá un monto válido'); return }
    const nombreCliente = cobroCliente.razon_social || `${cobroCliente.nombre} ${cobroCliente.apellido || ''}`.trim()
    const res = await fetch('/api/cta-cte', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa, cliente_id: cobroCliente.id, cliente_nombre: nombreCliente, tipo: 'cobro', concepto: cobroConcepto, monto: cobroMonto, fecha: cobroFecha }),
    })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setCobroModal(false); cargar(empresa)
    showToast(`Cobro de $${cobroMonto.toLocaleString('es-AR')} registrado`)
  }

  async function abrirHistorial(c: Cliente) {
    setHistCliente(c); setHistDesde('')
    setHistHasta(new Date().toISOString().split('T')[0])
    setHistModal(true)
    await fetchHistorial(c.id!, '', new Date().toISOString().split('T')[0])
  }

  async function fetchHistorial(clienteId: string, desde: string, hasta: string) {
    setHistCargando(true)
    let url = `/api/cta-cte?cliente_id=${clienteId}`
    if (desde) url += `&desde=${desde}`
    if (hasta) url += `&hasta=${hasta}`
    const res = await fetch(url)
    const data = await res.json()
    setHistMovs(Array.isArray(data) ? data : [])
    setHistCargando(false)
  }

  function copiarMensajeWhatsApp(c: Cliente) {
    const nombre = c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()
    const empNombre = empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'
    const mensaje = `Hola ${nombre}, le escribimos desde ${empNombre}.\nSu saldo pendiente es de $${c.saldo.toLocaleString('es-AR')}.\nPor favor comuníquese con nosotros para coordinar el pago.\n¡Muchas gracias!`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mensaje).then(() => showToast('Mensaje copiado al portapapeles'))
    } else {
      const url = c.telefono
        ? `https://wa.me/549${c.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
        : `https://wa.me/?text=${encodeURIComponent(mensaje)}`
      window.open(url, '_blank')
    }
  }

  const filtrados = clientes.filter(c => {
    const q = busqueda.toLowerCase()
    return !q || `${c.nombre} ${c.apellido || ''} ${c.razon_social || ''} ${c.cuit || ''} ${c.telefono || ''}`.toLowerCase().includes(q)
  })

  const conSaldo = clientes.filter(c => c.saldo !== 0).length
  const saldoTotal = clientes.reduce((a, c) => a + c.saldo, 0)
  const totalCobradoHist = histMovs.filter(m => m.tipo === 'cobro' || m.tipo === 'pago').reduce((a, m) => a + m.monto, 0)
  const totalCargadoHist = histMovs.filter(m => m.tipo === 'cargo').reduce((a, m) => a + m.monto, 0)

  const OVERLAY: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
  const PANEL = (w = 480): React.CSSProperties => ({ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, width: '100%', maxWidth: w, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' })

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: 24, color: C.text }}>
      <style>{`
        .cl-row:hover { background: rgba(255,255,255,0.03) !important; }
        .cl-row td { border-bottom: 1px solid ${C.border}; }
        .cbtn:hover { opacity: 0.8; } .cbtn:active { opacity: 0.6; }
        .cinp:focus { border-color: ${C.accent} !important; outline: none; }
        .cinp::placeholder { color: ${C.dim}; }
        select.cinp option { background: #1a1a1a; color: ${C.text}; }
        .hist-row:hover { background: rgba(255,255,255,0.03) !important; }
        .hist-row td { border-bottom: 1px solid ${C.border}; }
      `}</style>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12, marginBottom: 24 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total clientes</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.text }}>{clientes.length}</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Con saldo pendiente</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.amber }}>{conSaldo}</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', borderLeft: saldoTotal > 0 ? `3px solid ${C.amber}` : `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Saldo total cuentas corrientes</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: saldoTotal > 0 ? C.amber : saldoTotal < 0 ? C.red : C.text }}>
            ${saldoTotal.toLocaleString('es-AR')}
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Clientes</h1>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{filtrados.length} clientes</div>
        </div>
        <button className="cbtn" style={btn('accent', { padding: '6px 14px', fontSize: 13 })} onClick={abrirNuevo}>+ Nuevo cliente</button>
      </div>

      {/* Search */}
      <input
        className="cinp"
        style={{ ...INP, marginBottom: 14 }}
        placeholder="Buscar por nombre, CUIT, razón social, teléfono..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
      />

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
              {['Cliente', 'CUIT', 'Contacto', 'Tipo', 'Saldo', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px 0', color: C.dim }}>Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px 0', color: C.dim }}>No hay clientes todavía</td></tr>
            ) : filtrados.map(c => (
              <tr key={c.id} className="cl-row" style={{ background: 'transparent' }}>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ fontWeight: 600, color: C.text }}>{c.nombre} {c.apellido || ''}</div>
                  {c.razon_social && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{c.razon_social}</div>}
                </td>
                <td style={{ padding: '11px 14px', color: C.muted, fontSize: 12 }}>{c.cuit || '—'}</td>
                <td style={{ padding: '11px 14px', color: C.muted, fontSize: 12 }}>
                  {c.telefono && <div>{c.telefono}</div>}
                  {c.email && <div style={{ color: C.dim }}>{c.email}</div>}
                </td>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(122,173,255,0.1)', color: '#7AADFF', border: '1px solid rgba(122,173,255,0.25)' }}>
                    {TIPOS.find(t => t.value === c.tipo)?.label || c.tipo}
                  </span>
                </td>
                <td style={{ padding: '11px 14px', fontWeight: 700 }}>
                  <span style={{ color: c.saldo > 0 ? C.amber : c.saldo < 0 ? C.red : C.dim }}>
                    ${c.saldo.toLocaleString('es-AR')}
                  </span>
                </td>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button className="cbtn" style={btn('default', { padding: '4px 8px', fontSize: 11 })} onClick={() => abrirEditar(c)}>Editar</button>
                    <button className="cbtn" style={btn('default', { padding: '4px 8px', fontSize: 11 })} onClick={() => abrirHistorial(c)}>Historial</button>
                    {c.saldo > 0 && <>
                      <button className="cbtn" style={btn('green', { padding: '4px 8px', fontSize: 11, color: C.green })} onClick={() => abrirCobro(c)}>Cobrar</button>
                      <button className="cbtn" style={btn('default', { padding: '4px 8px', fontSize: 11 })} onClick={() => copiarMensajeWhatsApp(c)}>WA</button>
                    </>}
                    <button className="cbtn" style={btn('danger', { padding: '4px 8px', fontSize: 11 })} onClick={() => eliminar(c.id!)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modal edición cliente ─────────────────────────────────────────── */}
      {modal && (
        <div style={OVERLAY} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={PANEL(500)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>{editId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button className="cbtn" style={btn('ghost', { padding: '2px 8px', fontSize: 18, color: C.dim })} onClick={() => setModal(false)}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><Label>Nombre *</Label><input className="cinp" style={INP} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></div>
              <div><Label>Apellido</Label><input className="cinp" style={INP} value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} /></div>
              <div style={{ gridColumn: '1/-1' }}><Label>Razón social</Label><input className="cinp" style={INP} value={form.razon_social} onChange={e => setForm(f => ({ ...f, razon_social: e.target.value }))} /></div>
              <div><Label>CUIT</Label><input className="cinp" style={INP} value={form.cuit} onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))} placeholder="20-12345678-9" /></div>
              <div><Label>Tipo</Label>
                <select className="cinp" style={INP} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as Cliente['tipo'] }))}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div><Label>Teléfono</Label><input className="cinp" style={INP} value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} /></div>
              <div><Label>Email</Label><input className="cinp" style={INP} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div style={{ gridColumn: '1/-1' }}><Label>Dirección</Label><input className="cinp" style={INP} value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} /></div>
              <div><Label>Saldo cta. corriente ($)</Label><input type="number" className="cinp" style={INP} value={form.saldo} onChange={e => setForm(f => ({ ...f, saldo: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label>Límite de crédito ($)</Label><input type="number" className="cinp" style={INP} value={form.limite_credito} onChange={e => setForm(f => ({ ...f, limite_credito: parseFloat(e.target.value) || 0 }))} /></div>
              <div style={{ gridColumn: '1/-1' }}><Label>Notas</Label><textarea className="cinp" style={{ ...INP, height: 68, resize: 'none' }} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <button className="cbtn" style={btn('default')} onClick={() => setModal(false)}>Cancelar</button>
              <button className="cbtn" style={btn('accent', { padding: '6px 18px', fontSize: 13, fontWeight: 600 })} onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal cobro ──────────────────────────────────────────────────── */}
      {cobroModal && cobroCliente && (
        <div style={OVERLAY} onClick={e => e.target === e.currentTarget && setCobroModal(false)}>
          <div style={PANEL(380)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Registrar cobro</h2>
              <button className="cbtn" style={btn('ghost', { padding: '2px 8px', fontSize: 18, color: C.dim })} onClick={() => setCobroModal(false)}>×</button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>
              {cobroCliente.razon_social || `${cobroCliente.nombre} ${cobroCliente.apellido || ''}`.trim()}
              {' — '}
              <span style={{ fontWeight: 700, color: C.amber }}>Saldo: ${cobroCliente.saldo.toLocaleString('es-AR')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><Label>Monto a cobrar ($) *</Label>
                <input type="number" min="0" className="cinp" style={INP} value={cobroMonto || ''} onChange={e => setCobroMonto(parseFloat(e.target.value) || 0)} placeholder="0" autoFocus />
              </div>
              <div><Label>Concepto</Label><input className="cinp" style={INP} value={cobroConcepto} onChange={e => setCobroConcepto(e.target.value)} /></div>
              <div><Label>Fecha</Label><input type="date" className="cinp" style={INP} value={cobroFecha} onChange={e => setCobroFecha(e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <button className="cbtn" style={btn('default')} onClick={() => setCobroModal(false)}>Cancelar</button>
              <button className="cbtn" style={btn('green', { padding: '6px 18px', fontSize: 13, fontWeight: 600, color: C.green })} onClick={guardarCobro}>Registrar cobro</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal historial ──────────────────────────────────────────────── */}
      {histModal && histCliente && (
        <div style={{ ...OVERLAY, alignItems: 'flex-start', overflowY: 'auto', paddingTop: 24 }} onClick={e => e.target === e.currentTarget && setHistModal(false)}>
          <div style={{ ...PANEL(680), maxHeight: 'none' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>
                  Historial — {histCliente.razon_social || `${histCliente.nombre} ${histCliente.apellido || ''}`.trim()}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Saldo actual:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: histCliente.saldo > 0 ? C.amber : histCliente.saldo < 0 ? C.green : C.dim }}>
                    ${histCliente.saldo.toLocaleString('es-AR')}
                  </span>
                  {histCliente.saldo > 0 && (
                    <span style={{ fontSize: 10, background: 'rgba(212,130,10,0.15)', color: C.amber, border: '1px solid rgba(212,130,10,0.3)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                      Deuda pendiente
                    </span>
                  )}
                </div>
              </div>
              <button className="cbtn" style={btn('ghost', { padding: '2px 8px', fontSize: 18, color: C.dim })} onClick={() => setHistModal(false)}>×</button>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
              <div><Label>Desde</Label><input type="date" className="cinp" style={{ ...INP, width: 150 }} value={histDesde} onChange={e => setHistDesde(e.target.value)} /></div>
              <div><Label>Hasta</Label><input type="date" className="cinp" style={{ ...INP, width: 150 }} value={histHasta} onChange={e => setHistHasta(e.target.value)} /></div>
              <button className="cbtn" style={btn('default', { padding: '6px 14px' })} onClick={() => fetchHistorial(histCliente.id!, histDesde, histHasta)}>Filtrar</button>
              <button className="cbtn" style={btn('ghost', { fontSize: 12, color: C.dim })} onClick={() => { setHistDesde(''); const h = new Date().toISOString().split('T')[0]; setHistHasta(h); fetchHistorial(histCliente.id!, '', h) }}>Ver todo</button>
            </div>

            {/* Resumen */}
            {histMovs.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Total cargado', value: totalCargadoHist, color: C.red, bg: 'rgba(224,85,85,0.08)', border: 'rgba(224,85,85,0.2)' },
                  { label: 'Total cobrado', value: totalCobradoHist, color: C.green, bg: 'rgba(76,175,125,0.08)', border: 'rgba(76,175,125,0.2)' },
                  { label: 'Neto período', value: totalCargadoHist - totalCobradoHist, color: totalCargadoHist - totalCobradoHist > 0 ? C.amber : C.dim, bg: 'rgba(212,130,10,0.07)', border: 'rgba(212,130,10,0.2)' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>${s.value.toLocaleString('es-AR')}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tabla movimientos */}
            {histCargando ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: C.dim }}>Cargando...</div>
            ) : histMovs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: C.dim }}>No hay movimientos en este período</div>
            ) : (
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                      {['Fecha', 'Tipo', 'Concepto', 'Monto', 'Saldo'].map(h => (
                        <th key={h} style={{ textAlign: h === 'Monto' || h === 'Saldo' ? 'right' : 'left', padding: '8px 12px', fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {histMovs.map(m => {
                      const esCobro = m.tipo === 'cobro' || m.tipo === 'pago'
                      return (
                        <tr key={m.id} className="hist-row" style={{ background: 'transparent' }}>
                          <td style={{ padding: '9px 12px', color: C.muted, fontSize: 11 }}>{new Date(m.created_at).toLocaleDateString('es-AR')}</td>
                          <td style={{ padding: '9px 12px' }}>
                            <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: esCobro ? 'rgba(76,175,125,0.15)' : 'rgba(224,85,85,0.12)', color: esCobro ? C.green : C.red, border: `1px solid ${esCobro ? 'rgba(76,175,125,0.3)' : 'rgba(224,85,85,0.3)'}` }}>
                              {esCobro ? 'Cobro' : 'Cargo'}
                            </span>
                          </td>
                          <td style={{ padding: '9px 12px', color: C.text }}>{m.concepto}</td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600, color: esCobro ? C.green : C.red }}>
                            {esCobro ? '-' : '+'}${m.monto.toLocaleString('es-AR')}
                          </td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', color: C.muted, fontSize: 11 }}>
                            {m.saldo_nuevo !== undefined ? `$${m.saldo_nuevo.toLocaleString('es-AR')}` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 100 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
