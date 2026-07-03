'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Cliente, Venta } from '@/types'

const TIPOS = [
  { value: 'consumidor_final',    label: 'Consumidor final' },
  { value: 'responsable_inscripto', label: 'Resp. Inscripto' },
  { value: 'revendedor',          label: 'Revendedor' },
  { value: 'mayorista',           label: 'Mayorista' },
  { value: 'gastronomia',         label: 'Gastronomía' },
  { value: 'otro',                label: 'Otro' },
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
  brown:   '#633A2C',
  brownBg: 'rgba(99,58,44,0.08)',
  brownBd: 'rgba(99,58,44,0.22)',
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

function Badge({ color, bg, border, children }: { color: string; bg: string; border: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color, background: bg, border: `1px solid ${border}` }}>
      {children}
    </span>
  )
}

function tipoBadge(tipo: string) {
  const label = TIPOS.find(t => t.value === tipo)?.label || tipo
  if (tipo === 'consumidor_final')     return <Badge color={T.amber}  bg={T.amberBg}  border={T.amberBd}>{label}</Badge>
  if (tipo === 'responsable_inscripto') return <Badge color={T.blue}   bg={T.blueBg}   border={T.blueBd}>{label}</Badge>
  if (tipo === 'revendedor')           return <Badge color={T.wine}   bg={T.wineBg}   border={T.wineBd}>{label}</Badge>
  if (tipo === 'mayorista')            return <Badge color={T.brown}  bg={T.brownBg}  border={T.brownBd}>{label}</Badge>
  if (tipo === 'gastronomia')          return <Badge color={T.green}  bg={T.greenBg}  border={T.greenBd}>{label}</Badge>
  return <Badge color={T.dim} bg="rgba(168,152,136,0.10)" border="rgba(168,152,136,0.28)">{label}</Badge>
}

function BadgePago({ estado }: { estado: string }) {
  if (estado === 'pagado')          return <Badge color={T.green} bg={T.greenBg} border={T.greenBd}>Pagado</Badge>
  if (estado === 'pendiente')       return <Badge color={T.amber} bg={T.amberBg} border={T.amberBd}>Pendiente</Badge>
  if (estado === 'cuenta_corriente') return <Badge color={T.blue}  bg={T.blueBg}  border={T.blueBd}>Cta. Cte.</Badge>
  return <span style={{ color: T.dim }}>—</span>
}

const INP: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
  color: T.text, padding: '8px 11px', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function ClientesPage() {
  const router = useRouter()
  const [empresa, setEmpresa] = useState('aroma')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtrTipo, setFiltrTipo] = useState('')

  // Modal edición
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })
  const [editId, setEditId] = useState<string | null>(null)

  // Modal cobro manual
  const [cobroModal, setCobroModal] = useState(false)
  const [cobroCliente, setCobroCliente] = useState<Cliente | null>(null)
  const [cobroMonto, setCobroMonto] = useState(0)
  const [cobroConcepto, setCobroConcepto] = useState('Cobro cuenta corriente')
  const [cobroFecha, setCobroFecha] = useState(new Date().toISOString().split('T')[0])

  // Modal importar CSV
  const [importModal, setImportModal] = useState(false)
  const [importTexto, setImportTexto] = useState('')
  const [importPreview, setImportPreview] = useState<Record<string, string>[]>([])
  const [importando, setImportando] = useState(false)
  const [importMsg, setImportMsg] = useState('')

  // Modal historial (con tabs)
  const [histModal, setHistModal] = useState(false)
  const [histCliente, setHistCliente] = useState<Cliente | null>(null)
  const [histTab, setHistTab] = useState<'ctacte' | 'comprobantes'>('comprobantes')
  const [histMovs, setHistMovs] = useState<MovCtaCte[]>([])
  const [histCargando, setHistCargando] = useState(false)
  const [histDesde, setHistDesde] = useState('')
  const [histHasta, setHistHasta] = useState(new Date().toISOString().split('T')[0])
  const [histVentas, setHistVentas] = useState<Venta[]>([])
  const [histVentasCargando, setHistVentasCargando] = useState(false)

  // Modal pago desde comprobante
  const [pagoModal, setPagoModal] = useState(false)
  const [pagoVenta, setPagoVenta] = useState<Venta | null>(null)
  const [pagoConcepto, setPagoConcepto] = useState('')
  const [pagoFecha, setPagoFecha] = useState(new Date().toISOString().split('T')[0])
  const [pagoGuardando, setPagoGuardando] = useState(false)

  const [busqueda, setBusqueda] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e); cargar(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    const res = await fetch('/api/clientes')
    const data = await res.json()
    setClientes(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  // ── Importar CSV ──────────────────────────────────────────────────────────

  function parsearCSV(texto: string) {
    const lineas = texto.trim().split('\n').filter(l => l.trim())
    if (lineas.length < 2) return []
    const sep = lineas[0].includes('\t') ? '\t' : ','
    const headers = lineas[0].split(sep).map(h => h.trim().toLowerCase())

    const col = (row: string[], names: string[]) => {
      for (const n of names) {
        const i = headers.findIndex(h => h.includes(n))
        if (i >= 0) return (row[i] || '').trim()
      }
      return ''
    }

    const tipoMap: Record<string, string> = {
      'consumidor final': 'consumidor_final',
      'responsable inscripto': 'responsable_inscripto',
      'resp. inscripto': 'responsable_inscripto',
      'resp inscripto': 'responsable_inscripto',
      'monotributo': 'otro',
      'monotributista': 'otro',
      'revendedor': 'revendedor',
      'mayorista': 'mayorista',
      'gastronomia': 'gastronomia',
      'gastronomía': 'gastronomia',
    }

    return lineas.slice(1).map(l => {
      const cols = l.split(sep)
      const razon = col(cols, ['razón social', 'razon social', 'nombre'])
      const cuit = col(cols, ['cuit/cuil', 'cuit'])
      const condFiscal = col(cols, ['cond. fiscal', 'cond fiscal', 'condicion'])
      const tipo = tipoMap[condFiscal.toLowerCase()] || 'consumidor_final'
      const cuitLimpio = cuit && cuit !== '0' && cuit !== '1' ? cuit : ''
      return {
        razon_social: razon,
        nombre: razon,
        cuit: cuitLimpio,
        direccion: col(cols, ['domicilio', 'direccion', 'dirección']),
        telefono: col(cols, ['teléfono', 'telefono', 'tel']),
        email: col(cols, ['e-mail', 'email', 'mail']),
        tipo,
      }
    }).filter(r => r.razon_social)
  }

  function onImportTexto(txt: string) {
    setImportTexto(txt)
    setImportPreview(parsearCSV(txt))
    setImportMsg('')
  }

  async function confirmarImport() {
    if (!importPreview.length) return
    setImportando(true)
    const res = await fetch('/api/clientes/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa, clientes: importPreview }),
    })
    const data = await res.json()
    setImportando(false)
    if (data.error) { setImportMsg('Error: ' + data.error); return }
    setImportMsg(`✓ ${data.importados} clientes importados${data.errores ? `, ${data.errores} errores` : ''}`)
    cargar(empresa)
    setTimeout(() => { setImportModal(false); setImportTexto(''); setImportPreview([]); setImportMsg('') }, 2000)
  }

  // ── CRUD cliente ──────────────────────────────────────────────────────────

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

  // ── Cobro manual ──────────────────────────────────────────────────────────

  function abrirCobro(c: Cliente) {
    setCobroCliente(c); setCobroMonto(0)
    setCobroConcepto('Cobro cuenta corriente')
    setCobroFecha(new Date().toISOString().split('T')[0])
    setCobroModal(true)
  }

  async function guardarCobro() {
    if (!cobroCliente || !cobroMonto || cobroMonto <= 0) { showToast('Ingresá un monto válido'); return }
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

  // ── Historial ─────────────────────────────────────────────────────────────

  async function abrirHistorial(c: Cliente, tab: 'ctacte' | 'comprobantes' = 'comprobantes') {
    setHistCliente(c)
    setHistTab(tab)
    setHistDesde('')
    setHistHasta(new Date().toISOString().split('T')[0])
    setHistModal(true)
    if (tab === 'ctacte') {
      fetchMovimientos(c.id!, '', new Date().toISOString().split('T')[0])
    } else {
      fetchVentas(c.id!)
    }
  }

  async function fetchMovimientos(clienteId: string, desde: string, hasta: string) {
    setHistCargando(true)
    let url = `/api/cta-cte?cliente_id=${clienteId}`
    if (desde) url += `&desde=${desde}`
    if (hasta) url += `&hasta=${hasta}`
    const res = await fetch(url)
    const data = await res.json()
    setHistMovs(Array.isArray(data) ? data : [])
    setHistCargando(false)
  }

  async function fetchVentas(clienteId: string) {
    setHistVentasCargando(true)
    const res = await fetch(`/api/ventas?empresa=${empresa}&cliente_id=${clienteId}`)
    const data = await res.json()
    setHistVentas(Array.isArray(data) ? data : [])
    setHistVentasCargando(false)
  }

  function cambiarTab(tab: 'ctacte' | 'comprobantes') {
    setHistTab(tab)
    if (!histCliente) return
    if (tab === 'ctacte' && histMovs.length === 0) fetchMovimientos(histCliente.id!, histDesde, histHasta)
    if (tab === 'comprobantes' && histVentas.length === 0) fetchVentas(histCliente.id!)
  }

  // ── Pago desde comprobante ────────────────────────────────────────────────

  function abrirPagoVenta(v: Venta) {
    setPagoVenta(v)
    setPagoConcepto(`Cobro ${v.tipo === 'presupuesto' ? 'Presupuesto' : 'Remito'} ${v.numero}`)
    setPagoFecha(new Date().toISOString().split('T')[0])
    setPagoModal(true)
  }

  async function confirmarPagoVenta() {
    if (!pagoVenta) return
    setPagoGuardando(true)
    const res = await fetch('/api/ventas/cobrar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venta_id: pagoVenta.id, empresa, concepto: pagoConcepto, fecha: pagoFecha }),
    })
    const data = await res.json()
    setPagoGuardando(false)
    if (data.error) { showToast('Error: ' + data.error); return }
    setPagoModal(false)
    showToast(`${pagoVenta.numero} marcado como pagado`)
    if (histCliente) fetchVentas(histCliente.id!)
    cargar(empresa)
    setHistCliente(prev => prev ? { ...prev, saldo: Math.max(0, prev.saldo - pagoVenta.total) } : prev)
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

  // ── Computed ──────────────────────────────────────────────────────────────

  const filtrados = clientes.filter(c => {
    const q = busqueda.toLowerCase()
    const matchQ = !q || `${c.nombre} ${c.apellido || ''} ${c.razon_social || ''} ${c.cuit || ''} ${c.telefono || ''}`.toLowerCase().includes(q)
    const matchTipo = !filtrTipo || c.tipo === filtrTipo
    return matchQ && matchTipo
  })

  const conSaldo = clientes.filter(c => c.saldo > 0).length
  const saldoTotal = clientes.reduce((a, c) => a + c.saldo, 0)
  const totalCobradoHist = histMovs.filter(m => m.tipo === 'cobro' || m.tipo === 'pago').reduce((a, m) => a + m.monto, 0)
  const totalCargadoHist = histMovs.filter(m => m.tipo === 'cargo').reduce((a, m) => a + m.monto, 0)

  const OVERLAY: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)',
    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  }
  const PANEL = (w = 480): React.CSSProperties => ({
    background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, width: '100%', maxWidth: w,
    boxShadow: '0 20px 60px rgba(26,18,16,0.18)', maxHeight: '90vh', overflowY: 'auto',
  })

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .tr:hover { background: #FDFAF6 !important; }
        .btn-row { transition: all 0.12s; }
        .btn-row:hover { border-color: ${T.border2} !important; color: ${T.muted} !important; }
        .btn-wine { transition: background 0.12s; }
        .btn-wine:hover { background: #6A0000 !important; }
        .btn-green { transition: background 0.12s; }
        .btn-green:hover { background: rgba(45,122,79,0.18) !important; }
        .btn-danger { transition: all 0.12s; }
        .btn-danger:hover { border-color: ${T.red} !important; color: ${T.red} !important; }
        input:focus, select:focus, textarea:focus { border-color: ${T.border2} !important; box-shadow: 0 0 0 3px rgba(128,0,0,0.08) !important; outline: none !important; }
        .hist-tr:hover { background: #FDFAF6 !important; }
        .venta-tr:hover { background: #FDFAF6 !important; }
        .import-tr:hover { background: #FDFAF6 !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Clientes</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: '3px 0 0' }}>{clientes.length} clientes registrados</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setImportModal(true)}>
            Importar CSV
          </button>
          <button className="btn-wine" style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} onClick={abrirNuevo}>
            + Nuevo cliente
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total clientes', value: String(clientes.length), color: T.text, accentColor: '' },
            { label: 'Con saldo pendiente', value: String(conSaldo), color: T.amber, accentColor: T.amber },
            { label: 'Saldo total cuentas corrientes', value: `$${saldoTotal.toLocaleString('es-AR')}`, color: saldoTotal > 0 ? T.amber : T.text, accentColor: saldoTotal > 0 ? T.amber : '' },
          ].map(s => (
            <div key={s.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', ...(s.accentColor ? { borderLeft: `3px solid ${s.accentColor}` } : {}), boxShadow: '0 1px 3px rgba(26,18,16,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            placeholder="Buscar por nombre, CUIT, razón social, teléfono..."
            style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: T.text, outline: 'none', fontFamily: 'inherit' }}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <select
            style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: T.text, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
            value={filtrTipo}
            onChange={e => setFiltrTipo(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Cliente', 'Tipo', 'Email', 'Teléfono', 'CUIT', 'Saldo', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px 0', color: T.dim, fontSize: 13 }}>Cargando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px 0', color: T.dim, fontSize: 13 }}>No hay clientes todavía</td></tr>
              ) : filtrados.map(c => (
                <tr key={c.id} className="tr" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s', cursor: 'pointer' }} onClick={() => router.push('/clientes/' + c.id)}>
                  <td style={{ padding: '11px 16px', fontSize: 13 }}>
                    <div style={{ fontWeight: 600, color: T.text }}>{c.nombre} {c.apellido || ''}</div>
                    {c.razon_social && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{c.razon_social}</div>}
                  </td>
                  <td style={{ padding: '11px 16px' }}>{tipoBadge(c.tipo)}</td>
                  <td style={{ padding: '11px 16px', fontSize: 12, color: T.muted }}>{c.email || '—'}</td>
                  <td style={{ padding: '11px 16px', fontSize: 12, color: T.muted }}>{c.telefono || '—'}</td>
                  <td style={{ padding: '11px 16px', fontSize: 12, color: T.muted, fontFamily: 'monospace' }}>{c.cuit || '—'}</td>
                  <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700 }}>
                    <span style={{ color: c.saldo > 0 ? T.red : c.saldo < 0 ? T.green : T.dim }}>
                      ${c.saldo.toLocaleString('es-AR')}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    {c.activo
                      ? <Badge color={T.green} bg={T.greenBg} border={T.greenBd}>Activo</Badge>
                      : <Badge color={T.dim}   bg="rgba(168,152,136,0.10)" border="rgba(168,152,136,0.28)">Inactivo</Badge>
                    }
                  </td>
                  <td style={{ padding: '11px 16px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', fontSize: 11, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => abrirEditar(c)}>Editar</button>
                      <button className="btn-wine" style={{ background: T.wine, border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 11, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }} onClick={() => abrirHistorial(c, 'comprobantes')}>Comprobantes</button>
                      <button className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', fontSize: 11, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => abrirHistorial(c, 'ctacte')}>Cta. Cte.</button>
                      {c.saldo > 0 && <>
                        <button className="btn-green" style={{ background: T.greenBg, border: `1px solid ${T.greenBd}`, borderRadius: 6, padding: '4px 9px', fontSize: 11, color: T.green, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }} onClick={() => abrirCobro(c)}>Cobrar</button>
                        <button className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', fontSize: 11, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => copiarMensajeWhatsApp(c)}>WA</button>
                      </>}
                      <button className="btn-danger" style={{ background: T.redBg, border: `1px solid ${T.redBd}`, borderRadius: 6, padding: '4px 9px', fontSize: 11, color: T.red, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => eliminar(c.id!)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal edición cliente ─────────────────────────────────────────── */}
      {modal && (
        <div style={OVERLAY} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={PANEL(500)}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: T.surface, zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>{editId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1 }} onClick={() => setModal(false)}>×</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Nombre *</label>
                <input style={INP} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Apellido</label>
                <input style={INP} value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Razón social</label>
                <input style={INP} value={form.razon_social} onChange={e => setForm(f => ({ ...f, razon_social: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>CUIT</label>
                <input style={INP} value={form.cuit} onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))} placeholder="20-12345678-9" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Tipo</label>
                <select style={INP} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as Cliente['tipo'] }))}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Teléfono</label>
                <input style={INP} value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Email</label>
                <input style={INP} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Dirección</label>
                <input style={INP} value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Saldo cta. corriente ($)</label>
                <input type="number" style={INP} value={form.saldo} onChange={e => setForm(f => ({ ...f, saldo: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Límite de crédito ($)</label>
                <input type="number" style={INP} value={form.limite_credito} onChange={e => setForm(f => ({ ...f, limite_credito: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Notas</label>
                <textarea style={{ ...INP, height: 68, resize: 'none' }} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-wine" style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal cobro manual ───────────────────────────────────────────── */}
      {cobroModal && cobroCliente && (
        <div style={OVERLAY} onClick={e => e.target === e.currentTarget && setCobroModal(false)}>
          <div style={PANEL(400)}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: T.surface, zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Registrar cobro</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1 }} onClick={() => setCobroModal(false)}>×</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: T.amberBg, border: `1px solid ${T.amberBd}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: T.text }}>
                <span style={{ fontWeight: 600 }}>{cobroCliente.razon_social || `${cobroCliente.nombre} ${cobroCliente.apellido || ''}`.trim()}</span>
                {' — '}
                <span style={{ fontWeight: 700, color: T.amber }}>Saldo: ${cobroCliente.saldo.toLocaleString('es-AR')}</span>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Monto a cobrar ($) *</label>
                <input type="number" min="0" style={INP} value={cobroMonto || ''} onChange={e => setCobroMonto(parseFloat(e.target.value) || 0)} placeholder="0" autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Concepto</label>
                <input style={INP} value={cobroConcepto} onChange={e => setCobroConcepto(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Fecha</label>
                <input type="date" style={INP} value={cobroFecha} onChange={e => setCobroFecha(e.target.value)} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setCobroModal(false)}>Cancelar</button>
              <button className="btn-green" style={{ background: T.greenBg, border: `1px solid ${T.greenBd}`, borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, color: T.green, cursor: 'pointer', fontFamily: 'inherit' }} onClick={guardarCobro}>Registrar cobro</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal historial + comprobantes ──────────────────────────────── */}
      {histModal && histCliente && (
        <div style={OVERLAY} onClick={e => e.target === e.currentTarget && setHistModal(false)}>
          <div style={{ ...PANEL(760), maxHeight: '92vh' }}>

            {/* Header del modal */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, background: T.surface, zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>
                  {histCliente.razon_social || `${histCliente.nombre} ${histCliente.apellido || ''}`.trim()}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: T.muted }}>Saldo:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: histCliente.saldo > 0 ? T.amber : T.dim }}>
                    ${histCliente.saldo.toLocaleString('es-AR')}
                  </span>
                  {histCliente.saldo > 0 && (
                    <Badge color={T.amber} bg={T.amberBg} border={T.amberBd}>Deuda pendiente</Badge>
                  )}
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1 }} onClick={() => setHistModal(false)}>×</button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 2, background: T.bg, borderRadius: 8, padding: 3, border: `1px solid ${T.border}`, marginBottom: 20, width: 'fit-content' }}>
                {([['comprobantes', 'Comprobantes'], ['ctacte', 'Cuenta corriente']] as const).map(([t, label]) => (
                  <button
                    key={t}
                    onClick={() => cambiarTab(t)}
                    style={{
                      background: histTab === t ? T.wine : 'transparent',
                      color: histTab === t ? '#fff' : T.muted,
                      border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 12, fontWeight: histTab === t ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Tab: Comprobantes ─────────────────────────────────────── */}
              {histTab === 'comprobantes' && (
                <>
                  {histVentasCargando ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: T.dim, fontSize: 13 }}>Cargando...</div>
                  ) : histVentas.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: T.dim, fontSize: 13 }}>No hay comprobantes para este cliente</div>
                  ) : (
                    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: T.bg }}>
                            {['Número', 'Tipo', 'Fecha', 'Total', 'Estado pago', ''].map(h => (
                              <th key={h} style={{ textAlign: h === 'Total' ? 'right' : 'left', padding: '9px 14px', fontSize: 11, color: T.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {histVentas.map(v => (
                            <tr key={v.id} className="venta-tr" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}>
                              <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600, color: T.text, fontSize: 11 }}>{v.numero}</td>
                              <td style={{ padding: '10px 14px' }}>
                                {v.tipo === 'presupuesto'
                                  ? <Badge color={T.wine} bg={T.wineBg} border={T.wineBd}>Presupuesto</Badge>
                                  : <Badge color={T.green} bg={T.greenBg} border={T.greenBd}>Remito</Badge>
                                }
                              </td>
                              <td style={{ padding: '10px 14px', color: T.muted, fontSize: 11 }}>{new Date(v.created_at!).toLocaleDateString('es-AR')}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: T.text }}>${v.total.toLocaleString('es-AR')}</td>
                              <td style={{ padding: '10px 14px' }}><BadgePago estado={v.estado_pago || ''} /></td>
                              <td style={{ padding: '10px 14px' }}>
                                {v.estado_pago !== 'pagado' && (
                                  <button
                                    className="btn-green"
                                    style={{ background: T.greenBg, border: `1px solid ${T.greenBd}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, color: T.green, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                                    onClick={() => abrirPagoVenta(v)}
                                  >
                                    Marcar pagado
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* ── Tab: Cuenta corriente ─────────────────────────────────── */}
              {histTab === 'ctacte' && (
                <>
                  {/* Filtros */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Desde</label>
                      <input type="date" style={{ ...INP, width: 148 }} value={histDesde} onChange={e => setHistDesde(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Hasta</label>
                      <input type="date" style={{ ...INP, width: 148 }} value={histHasta} onChange={e => setHistHasta(e.target.value)} />
                    </div>
                    <button className="btn-wine" style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => fetchMovimientos(histCliente.id!, histDesde, histHasta)}>Filtrar</button>
                    <button className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => { setHistDesde(''); const h = new Date().toISOString().split('T')[0]; setHistHasta(h); fetchMovimientos(histCliente.id!, '', h) }}>Ver todo</button>
                  </div>

                  {/* Resumen */}
                  {histMovs.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                      {[
                        { label: 'Total cargado', value: totalCargadoHist, color: T.red, bg: T.redBg, border: T.redBd },
                        { label: 'Total cobrado', value: totalCobradoHist, color: T.green, bg: T.greenBg, border: T.greenBd },
                        { label: 'Neto período', value: totalCargadoHist - totalCobradoHist, color: totalCargadoHist - totalCobradoHist > 0 ? T.amber : T.dim, bg: T.amberBg, border: T.amberBd },
                      ].map(s => (
                        <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{s.label}</div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: s.color }}>${s.value.toLocaleString('es-AR')}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {histCargando ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: T.dim, fontSize: 13 }}>Cargando...</div>
                  ) : histMovs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: T.dim, fontSize: 13 }}>No hay movimientos en este período</div>
                  ) : (
                    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: T.bg }}>
                            {['Fecha', 'Tipo', 'Concepto', 'Monto', 'Saldo'].map(h => (
                              <th key={h} style={{ textAlign: h === 'Monto' || h === 'Saldo' ? 'right' : 'left', padding: '9px 14px', fontSize: 11, color: T.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {histMovs.map(m => {
                            const esCobro = m.tipo === 'cobro' || m.tipo === 'pago'
                            return (
                              <tr key={m.id} className="hist-tr" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}>
                                <td style={{ padding: '10px 14px', color: T.muted, fontSize: 11 }}>{new Date(m.created_at).toLocaleDateString('es-AR')}</td>
                                <td style={{ padding: '10px 14px' }}>
                                  <Badge color={esCobro ? T.green : T.red} bg={esCobro ? T.greenBg : T.redBg} border={esCobro ? T.greenBd : T.redBd}>
                                    {esCobro ? 'Cobro' : 'Cargo'}
                                  </Badge>
                                </td>
                                <td style={{ padding: '10px 14px', color: T.text, fontSize: 13 }}>{m.concepto}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: esCobro ? T.green : T.red }}>
                                  {esCobro ? '-' : '+'}${m.monto.toLocaleString('es-AR')}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', color: T.muted, fontSize: 11 }}>
                                  {m.saldo_nuevo !== undefined ? `$${m.saldo_nuevo.toLocaleString('es-AR')}` : '—'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmar pago de comprobante ──────────────────────────── */}
      {pagoModal && pagoVenta && (
        <div style={{ ...OVERLAY, zIndex: 110 }} onClick={e => e.target === e.currentTarget && setPagoModal(false)}>
          <div style={PANEL(420)}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: T.surface, zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Confirmar cobro</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1 }} onClick={() => setPagoModal(false)}>×</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Resumen del comprobante */}
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: T.text, fontSize: 13 }}>{pagoVenta.numero}</span>
                  <span style={{ fontSize: 12, color: T.muted }}>{new Date(pagoVenta.created_at!).toLocaleDateString('es-AR')}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.green }}>${pagoVenta.total.toLocaleString('es-AR')}</div>
                {pagoVenta.estado_pago === 'cuenta_corriente' && (
                  <div style={{ fontSize: 11, color: T.amber, marginTop: 6 }}>Se descontará del saldo en cuenta corriente del cliente</div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Concepto</label>
                <input style={INP} value={pagoConcepto} onChange={e => setPagoConcepto(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Fecha de cobro</label>
                <input type="date" style={INP} value={pagoFecha} onChange={e => setPagoFecha(e.target.value)} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setPagoModal(false)}>Cancelar</button>
              <button
                className="btn-green"
                style={{ background: T.greenBg, border: `1px solid ${T.greenBd}`, borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, color: T.green, cursor: 'pointer', fontFamily: 'inherit', opacity: pagoGuardando ? 0.6 : 1 }}
                onClick={confirmarPagoVenta}
                disabled={pagoGuardando}
              >
                {pagoGuardando ? 'Guardando...' : 'Confirmar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal importar CSV ───────────────────────────────────────────── */}
      {importModal && (
        <div style={{ ...OVERLAY, zIndex: 110 }} onClick={e => e.target === e.currentTarget && setImportModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, width: '100%', maxWidth: 760, maxHeight: '90vh', boxShadow: '0 20px 60px rgba(26,18,16,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Importar clientes desde CSV</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1 }} onClick={() => setImportModal(false)}>×</button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 12, color: T.muted, background: T.bg, borderRadius: 8, padding: '10px 14px', border: `1px solid ${T.border}` }}>
                Abrí el CSV en el block de notas, seleccioná todo (<kbd style={{ background: T.border, padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>Ctrl+A</kbd>) y pegalo acá abajo. Compatible con separación por tabs o comas.
              </div>

              <textarea
                style={{ ...INP, height: 140, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }}
                placeholder="Pegá el contenido del CSV acá (incluyendo la línea de encabezados)..."
                value={importTexto}
                onChange={e => onImportTexto(e.target.value)}
              />

              {importPreview.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>
                    Vista previa — <strong style={{ color: T.text }}>{importPreview.length} clientes</strong> detectados
                  </div>
                  <div style={{ maxHeight: 240, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: T.bg }}>
                          {['Razón Social', 'CUIT', 'Teléfono', 'Dirección', 'Tipo'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: T.dim, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 50).map((r, i) => (
                          <tr key={i} className="import-tr" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}>
                            <td style={{ padding: '7px 12px', fontWeight: 500, color: T.text }}>{r.razon_social}</td>
                            <td style={{ padding: '7px 12px', color: T.muted, fontFamily: 'monospace' }}>{r.cuit || '—'}</td>
                            <td style={{ padding: '7px 12px', color: T.muted }}>{r.telefono || '—'}</td>
                            <td style={{ padding: '7px 12px', color: T.muted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.direccion || '—'}</td>
                            <td style={{ padding: '7px 12px', color: T.muted }}>{r.tipo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importPreview.length > 50 && <div style={{ padding: '8px 12px', fontSize: 11, color: T.dim }}>... y {importPreview.length - 50} más</div>}
                  </div>
                </div>
              )}

              {importMsg && (
                <div style={{ fontSize: 13, color: importMsg.startsWith('✓') ? T.green : T.red, fontWeight: 600 }}>{importMsg}</div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setImportModal(false)}>Cancelar</button>
              <button
                className="btn-wine"
                style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: importPreview.length === 0 || importando ? 0.5 : 1 }}
                onClick={confirmarImport}
                disabled={importando || importPreview.length === 0}
              >
                {importando ? 'Importando...' : `Importar ${importPreview.length} clientes`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 13, padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 32px rgba(26,18,16,0.12)', zIndex: 200 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
