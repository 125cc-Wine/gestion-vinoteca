'use client'
import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

interface DropPos { top: number; left: number; width: number; maxH: number }
function computeDropPos(el: HTMLElement, desired: number): DropPos {
  const rect = el.getBoundingClientRect()
  const margin = 8
  const spaceBelow = window.innerHeight - rect.bottom - margin
  const spaceAbove = rect.top - margin
  if (spaceBelow >= 160 || spaceBelow >= spaceAbove) {
    return { top: rect.bottom + 2, left: rect.left, width: rect.width, maxH: Math.max(120, Math.min(desired, spaceBelow)) }
  }
  const maxH = Math.max(120, Math.min(desired, spaceAbove))
  return { top: rect.top - maxH - 2, left: rect.left, width: rect.width, maxH }
}

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

const INP: React.CSSProperties = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 7,
  color: T.text,
  padding: '9px 12px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.12s',
}

interface ItemCompra { producto_id: string; nombre: string; cantidad: number; precio_unitario: number; subtotal: number; cajas?: number; unidades_por_caja?: number }
interface Compra {
  id: string; numero: string; empresa: string
  proveedor_id: string | null; proveedor_nombre: string
  items: ItemCompra[]; total: number; notas: string
  fecha_esperada: string | null; estado: 'pendiente' | 'enviado' | 'recibido' | 'cancelado'
  created_at: string
  // Factura y pagos
  nro_factura?: string | null
  fecha_factura?: string | null
  condicion_pago?: string | null
  fecha_vencimiento?: string | null
  estado_pago?: string | null
  monto_pagado?: number | null
  fecha_pago?: string | null
  notas_pago?: string | null
}
interface Proveedor { id: string; nombre: string; razon_social?: string; telefono?: string }
interface Producto { id: string; nombre: string; bodega: string; precio_costo?: number; precio_venta?: number; unidad_medida?: string }

function upkFromUnidad(u?: string) { return u === 'caja12' ? 12 : u === 'caja6' ? 6 : u === 'caja4' ? 4 : 1 }
function upkLabel(upk: number) { return upk > 1 ? `Caja ×${upk}` : 'Botella' }

const ITEM_EMPTY: ItemCompra = { producto_id: '', nombre: '', cantidad: 1, precio_unitario: 0, subtotal: 0, cajas: 1, unidades_por_caja: 1 }
const ESTADO_LABEL: Record<string, string> = { pendiente: 'Pendiente', enviado: 'Enviado', recibido: 'Recibido', cancelado: 'Cancelado' }
const NEXT_ESTADO: Record<string, string> = { pendiente: 'enviado', enviado: 'recibido' }

const ESTADO_STYLE: Record<string, React.CSSProperties> = {
  pendiente: { background: T.amberBg, color: T.amber, border: `1px solid rgba(160,112,16,0.25)` },
  enviado:   { background: T.blueBg,  color: T.blue,  border: `1px solid rgba(43,94,160,0.25)` },
  recibido:  { background: T.greenBg, color: T.green, border: `1px solid rgba(45,122,79,0.25)` },
  cancelado: { background: T.bg,      color: T.dim,   border: `1px solid ${T.border}` },
}

const ESTADO_PAGO_STYLE: Record<string, React.CSSProperties> = {
  sin_factura: { background: T.bg,      color: T.dim,   border: `1px solid ${T.border}` },
  pendiente:   { background: T.amberBg, color: T.amber, border: `1px solid rgba(160,112,16,0.25)` },
  pagado:      { background: T.greenBg, color: T.green, border: `1px solid rgba(45,122,79,0.25)` },
}
const ESTADO_PAGO_LABEL: Record<string, string> = {
  sin_factura: 'Sin factura',
  pendiente:   'Pend. pago',
  pagado:      'Pagado',
}

const CONDICION_LABEL: Record<string, string> = {
  contado: 'Contado',
  '30_dias': '30 días',
  '60_dias': '60 días',
  '90_dias': '90 días',
}

function addDays(dateStr: string, days: number): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function calcVencimiento(condicion: string, fechaFactura: string): string {
  if (!fechaFactura) return ''
  if (condicion === 'contado') return fechaFactura
  if (condicion === '30_dias') return addDays(fechaFactura, 30)
  if (condicion === '60_dias') return addDays(fechaFactura, 60)
  if (condicion === '90_dias') return addDays(fechaFactura, 90)
  return fechaFactura
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10)
}

function vencimientoStyle(vencimiento: string | null | undefined): React.CSSProperties {
  if (!vencimiento) return { color: T.muted }
  const hoyD = new Date(); hoyD.setHours(0,0,0,0)
  const vD = new Date(vencimiento + 'T12:00:00')
  const diff = (vD.getTime() - hoyD.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return { color: T.red, fontWeight: 700 }
  if (diff < 7) return { color: T.amber, fontWeight: 600 }
  return { color: T.green }
}

function vencimientoLabel(vencimiento: string | null | undefined): string {
  if (!vencimiento) return '—'
  const hoyD = new Date(); hoyD.setHours(0,0,0,0)
  const vD = new Date(vencimiento + 'T12:00:00')
  const diff = (vD.getTime() - hoyD.getTime()) / (1000 * 60 * 60 * 24)
  const fechaStr = vD.toLocaleDateString('es-AR')
  if (diff < 0) return `${fechaStr} — VENCIDO`
  return fechaStr
}

export default function ComprasPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [compras, setCompras] = useState<Compra[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [detalle, setDetalle] = useState<Compra | null>(null)

  // Factura modal state
  const [facturaModal, setFacturaModal] = useState<Compra | null>(null)
  const [fNroFactura, setFNroFactura] = useState('')
  const [fFechaFactura, setFFechaFactura] = useState('')
  const [fCondicion, setFCondicion] = useState('contado')
  const [fVencimiento, setFVencimiento] = useState('')
  const [fTotal, setFTotal] = useState<number>(0)

  // Deuda / factura directa modal (comparte items/proveedor/notas con la OC regular)
  const [deudaModal, setDeudaModal] = useState(false)
  const [deudaModo, setDeudaModo] = useState<'factura' | 'deuda'>('factura')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [incluyeIva, setIncluyeIva] = useState(false)
  const [incluyePercIva, setIncluyePercIva] = useState(false)
  const [pctIIBB, setPctIIBB] = useState<number>(0)

  // Pago modal state
  const [pagoModal, setPagoModal] = useState<Compra | null>(null)
  const [pFechaPago, setPFechaPago] = useState('')
  const [pMonto, setPMonto] = useState(0)
  const [pNotas, setPNotas] = useState('')

  const [proveedorId, setProveedorId] = useState('')
  const [proveedorNombre, setProveedorNombre] = useState('')
  const [items, setItems] = useState<ItemCompra[]>([{ ...ITEM_EMPTY }])
  const [notas, setNotas] = useState('')
  const [fechaEsperada, setFechaEsperada] = useState('')
  const [prodSugs, setProdSugs] = useState<number | null>(null)
  const [provSugsOpen, setProvSugsOpen] = useState(false)
  const provRef = useRef<HTMLInputElement>(null)
  const [provPos, setProvPos] = useState<DropPos>({ top: 0, left: 0, width: 0, maxH: 180 })
  const [prodPos, setProdPos] = useState<DropPos>({ top: 0, left: 0, width: 0, maxH: 200 })

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e); cargar(e)
  }, [])

  const dirtyCompra = proveedorNombre !== '' || items.some(i => i.nombre !== '')

  function tryCloseCompra() {
    if (dirtyCompra) { setConfirmClose(true) } else { setModal(false) }
  }

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (modal && dirtyCompra) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [modal, dirtyCompra])

  async function cargar(emp: string) {
    setLoading(true)
    try {
      const [cRes, provRes, prodRes] = await Promise.all([
        fetch(`/api/compras?empresa=${emp}`),
        fetch('/api/proveedores'),
        fetch(`/api/productos?empresa=${emp}`),
      ])
      const [cData, provData, prodData] = await Promise.all([cRes.json(), provRes.json(), prodRes.json()])
      setCompras(Array.isArray(cData) ? cData : [])
      setProveedores(Array.isArray(provData) ? provData : [])
      setProductos(Array.isArray(prodData) ? prodData : [])
    } finally { setLoading(false) }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function abrirNuevo() {
    setProveedorId(''); setProveedorNombre(''); setItems([{ ...ITEM_EMPTY }])
    setNotas(''); setFechaEsperada(''); setModal(true)
  }

  function abrirDeuda() {
    setProveedorId(''); setProveedorNombre(''); setItems([{ ...ITEM_EMPTY }])
    setNotas(''); setFTotal(0)
    setFNroFactura(''); setFFechaFactura(hoy())
    setFCondicion('30_dias'); setFVencimiento('')
    setEditandoId(null); setDeudaModo('deuda')
    setIncluyeIva(false); setIncluyePercIva(false); setPctIIBB(0)
    setDeudaModal(true)
  }

  function abrirFacturaNueva() {
    setProveedorId(''); setProveedorNombre(''); setItems([{ ...ITEM_EMPTY }])
    setNotas(''); setFTotal(0)
    setFNroFactura(''); setFFechaFactura(hoy())
    setFCondicion('contado'); setFVencimiento('')
    setEditandoId(null); setDeudaModo('factura')
    setIncluyeIva(false); setIncluyePercIva(false); setPctIIBB(0)
    setDeudaModal(true)
  }

  async function guardarDeuda() {
    if (!proveedorNombre.trim()) { showToast('Ingresá el proveedor'); return }
    const validItems = items.filter(i => i.nombre)
    if (!validItems.length) { showToast('Agregá al menos un ítem'); return }
    const totalCalculado = validItems.reduce((a, i) => a + (i.subtotal || 0), 0)
    const montoIva = incluyeIva ? Math.round(totalCalculado * 0.21) : 0
    const montoPercIva = incluyePercIva ? Math.round(totalCalculado * 0.03) : 0
    const montoIIBB = pctIIBB > 0 ? Math.round(totalCalculado * pctIIBB / 100 * 100) / 100 : 0
    const totalConImpuestos = totalCalculado + montoIva + montoPercIva + montoIIBB
    const totalFinal = fTotal > 0 ? fTotal : totalConImpuestos
    setSaving(true)
    const esContado = fCondicion === 'contado'
    const payload = {
      empresa, proveedor_id: proveedorId || null, proveedor_nombre: proveedorNombre,
      items: validItems, notas: notas || '',
      nro_factura: fNroFactura || null, fecha_factura: fFechaFactura,
      condicion_pago: fCondicion, fecha_vencimiento: fVencimiento || null,
      estado_pago: esContado ? 'pagado' : 'pendiente',
      monto_pagado: esContado ? totalFinal : null,
      total: totalFinal,
    }
    let res: Response
    if (editandoId) {
      res = await fetch('/api/compras', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editandoId, ...payload }),
      })
    } else {
      res = await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, total_manual: totalFinal, deuda_directa: true }),
      })
    }
    const data = await res.json(); setSaving(false)
    if (data.error) { showToast('Error: ' + data.error); return }
    setDeudaModal(false); setEditandoId(null); cargar(empresa)
    showToast(editandoId ? 'Compra actualizada' : deudaModo === 'factura' ? 'Factura registrada' : 'Deuda registrada')
  }

  async function eliminarCompra(c: Compra) {
    const esDeuda = c.numero.startsWith('DEU-')
    const msg = esDeuda
      ? '¿Eliminar esta deuda permanentemente?'
      : `¿Eliminar "${c.numero}" permanentemente?\n\nAtención: el stock que se sumó al recibirla NO se va a restar automáticamente.`
    if (!confirm(msg)) return
    await fetch(`/api/compras?id=${c.id}&hard=true`, { method: 'DELETE' })
    setDetalle(null); cargar(empresa); showToast('Eliminado')
  }

  function editarCompra(c: Compra) {
    setProveedorId(c.proveedor_id || '')
    setProveedorNombre(c.proveedor_nombre)
    setItems(Array.isArray(c.items) && c.items.length ? c.items : [{ ...ITEM_EMPTY }])
    setNotas(c.notas || '')
    setFTotal(c.total || 0)
    setFNroFactura(c.nro_factura || '')
    setFFechaFactura(c.fecha_factura || hoy())
    setFCondicion(c.condicion_pago || 'contado')
    setFVencimiento(c.fecha_vencimiento || '')
    setEditandoId(c.id)
    setDetalle(null)
    setDeudaModal(true)
  }

  function selProducto(idx: number, prod: Producto) {
    const ni = [...items]
    const upk = upkFromUnidad(prod.unidad_medida)
    const costoBot = prod.precio_costo || Math.round((prod.precio_venta || 0) * 0.5)
    // precio_unitario = precio POR CAJA (lo que aparece en la factura del proveedor)
    const precioCaja = upk > 1 ? costoBot * upk : costoBot
    const cajas = ni[idx].cajas || 1
    ni[idx] = { ...ni[idx], producto_id: prod.id, nombre: prod.nombre + (prod.bodega ? ' - ' + prod.bodega : ''), precio_unitario: precioCaja, unidades_por_caja: upk, cajas, cantidad: cajas * upk }
    ni[idx].subtotal = Math.round(cajas * precioCaja * 100) / 100
    if (idx === ni.length - 1) ni.push({ ...ITEM_EMPTY })
    setItems(ni); setProdSugs(null)
  }

  function updateItem(idx: number, field: keyof ItemCompra, value: string | number) {
    const ni = [...items]
    ;(ni[idx] as unknown as Record<string, string | number>)[field] = value
    const upk = ni[idx].unidades_por_caja || 1
    const cajas = ni[idx].cajas || 1
    ni[idx].cantidad = cajas * upk
    // precio_unitario = precio POR CAJA
    ni[idx].subtotal = Math.round(cajas * ni[idx].precio_unitario * 100) / 100
    setItems(ni)
  }

  const total = items.reduce((a, i) => a + (i.subtotal || 0), 0)

  async function guardar() {
    if (!proveedorNombre.trim()) { showToast('Ingresá el proveedor'); return }
    if (items.every(i => !i.nombre)) { showToast('Agregá al menos un ítem'); return }
    setSaving(true)
    const validItems = items.filter(i => i.nombre)
    const res = await fetch('/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa, proveedor_id: proveedorId || null, proveedor_nombre: proveedorNombre, items: validItems, notas, fecha_esperada: fechaEsperada || null, total }),
    })
    const data = await res.json(); setSaving(false)
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false)
    cargar(empresa)
    // Abrir directamente el modal de WhatsApp con la OC recién creada
    setWaModal(generarMensajeWA(data))
    setDetalle(data)
  }

  async function avanzarEstado(c: Compra) {
    const nuevoEstado = NEXT_ESTADO[c.estado]
    if (!nuevoEstado) return
    if (nuevoEstado === 'recibido' && !confirm('¿Marcar como RECIBIDO e incrementar stock?')) return
    const res = await fetch('/api/compras', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, estado: nuevoEstado, items: c.items }),
    })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    cargar(empresa)
    showToast(nuevoEstado === 'recibido' ? 'Stock actualizado' : 'Estado actualizado')
  }

  async function cancelar(c: Compra) {
    if (!confirm('¿Cancelar esta orden?')) return
    await fetch(`/api/compras?id=${c.id}`, { method: 'DELETE' })
    cargar(empresa); showToast('Cancelada')
  }

  // --- Factura ---
  function abrirFacturaModal(c: Compra) {
    setFNroFactura(c.nro_factura || '')
    setFFechaFactura(c.fecha_factura || hoy())
    const cond = c.condicion_pago || 'contado'
    setFCondicion(cond)
    const fechaBase = c.fecha_factura || hoy()
    setFVencimiento(c.fecha_vencimiento || calcVencimiento(cond, fechaBase))
    setFTotal(c.total || 0)
    setFacturaModal(c)
  }

  async function guardarFactura() {
    if (!facturaModal) return
    setSaving(true)
    const esContado = fCondicion === 'contado'
    const body: Record<string, unknown> = {
      id: facturaModal.id,
      nro_factura: fNroFactura,
      fecha_factura: fFechaFactura,
      condicion_pago: fCondicion,
      fecha_vencimiento: fVencimiento,
      estado_pago: esContado ? 'pagado' : 'pendiente',
      total: fTotal,
    }
    if (esContado) {
      body.fecha_pago = fFechaFactura
      body.monto_pagado = fTotal
    }
    const res = await fetch('/api/compras', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json(); setSaving(false)
    if (data.error) { showToast('Error: ' + data.error); return }
    setFacturaModal(null)
    // update detalle if open
    if (detalle && detalle.id === facturaModal.id) {
      setDetalle({ ...detalle, ...body, nro_factura: fNroFactura, fecha_factura: fFechaFactura, condicion_pago: fCondicion, fecha_vencimiento: fVencimiento, estado_pago: esContado ? 'pagado' : 'pendiente', fecha_pago: esContado ? fFechaFactura : detalle.fecha_pago, monto_pagado: esContado ? fTotal : detalle.monto_pagado, total: fTotal })
    }
    cargar(empresa)
    showToast('Factura cargada')
  }

  // --- Pago ---
  function abrirPagoModal(c: Compra) {
    setPMonto(c.total - (c.monto_pagado || 0))
    setPFechaPago(hoy())
    setPNotas('')
    setPagoModal(c)
  }

  async function registrarPago() {
    if (!pagoModal) return
    setSaving(true)
    const body = {
      id: pagoModal.id,
      estado_pago: 'pagado',
      monto_pagado: pMonto,
      fecha_pago: pFechaPago,
      notas_pago: pNotas,
    }
    const res = await fetch('/api/compras', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json(); setSaving(false)
    if (data.error) { showToast('Error: ' + data.error); return }
    setPagoModal(null)
    if (detalle && detalle.id === pagoModal.id) {
      setDetalle({ ...detalle, estado_pago: 'pagado', monto_pagado: pMonto, fecha_pago: pFechaPago, notas_pago: pNotas })
    }
    cargar(empresa)
    showToast('Pago registrado')
  }

  // --- WhatsApp ---
  const [waModal, setWaModal] = useState<string>('')  // mensaje preview

  function generarMensajeWA(c: Compra): string {
    const empresaNombre = empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'
    const fecha = new Date().toLocaleDateString('es-AR')
    const lineas = [
      `🍷 *ORDEN DE COMPRA — ${empresaNombre}*`,
      `N° ${c.numero} | ${fecha}`,
      ``,
      `*Proveedor:* ${c.proveedor_nombre}`,
      ``,
      `*Productos solicitados:*`,
      ...(c.items || []).map(i => {
        const upk = i.unidades_por_caja || 1
        const cajas = i.cajas || i.cantidad
        if (upk > 1) {
          return `• ${i.nombre} x ${cajas} caja${cajas !== 1 ? 's' : ''} (${cajas * upk} u.)${i.precio_unitario ? ` — $${(i.precio_unitario * upk).toLocaleString('es-AR')} c/caja` : ''}`
        }
        return `• ${i.nombre} x ${i.cantidad} u.${i.precio_unitario ? ` — $${i.precio_unitario.toLocaleString('es-AR')} c/u` : ''}`
      }),
      ``,
      `*Total: $${c.total.toLocaleString('es-AR')}*`,
    ]
    if (c.fecha_esperada) {
      lineas.push(`📅 Entrega esperada: ${new Date(c.fecha_esperada + 'T12:00:00').toLocaleDateString('es-AR')}`)
    }
    if (c.notas) {
      lineas.push(`📝 ${c.notas}`)
    }
    lineas.push(``, `Saludos,`, empresaNombre)
    return lineas.join('\n')
  }

  function abrirWhatsApp(c: Compra) {
    const mensaje = generarMensajeWA(c)
    const prov = proveedores.find(p => p.id === c.proveedor_id)
    const tel = (prov as unknown as { telefono?: string })?.telefono?.replace(/\D/g, '')
    const base = tel ? `https://wa.me/${tel.startsWith('54') ? tel : '54' + tel}` : 'https://wa.me'
    window.open(`${base}?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  // --- Filtrado ---
  const filtradas = (() => {
    if (filtroEstado === 'a_pagar') {
      return compras
        .filter(c => c.estado === 'recibido' && c.estado_pago === 'pendiente')
        .sort((a, b) => {
          const fa = a.fecha_vencimiento || '9999-12-31'
          const fb = b.fecha_vencimiento || '9999-12-31'
          return fa.localeCompare(fb)
        })
    }
    if (filtroEstado === 'deudas') {
      return compras
        .filter(c => c.numero.startsWith('DEU-'))
        .sort((a, b) => {
          const fa = a.fecha_vencimiento || '9999-12-31'
          const fb = b.fecha_vencimiento || '9999-12-31'
          return fa.localeCompare(fb)
        })
    }
    return compras.filter(c => {
      if (c.estado === 'cancelado') return false
      if (c.numero.startsWith('DEU-') && filtroEstado === '') return true
      if (filtroEstado && c.estado !== filtroEstado) return false
      return true
    })
  })()

  // --- KPIs ---
  const facturasPagar = compras.filter(c => c.estado === 'recibido' && c.estado_pago !== 'pagado' && c.estado_pago !== 'sin_factura')
  const deudasPendientes = compras.filter(c => c.numero.startsWith('DEU-') && c.estado_pago === 'pendiente')
  const kpis = {
    pendientes: compras.filter(c => c.estado === 'pendiente' && !c.numero.startsWith('DEU-')).length,
    enviadas: compras.filter(c => c.estado === 'enviado').length,
    facturasPagar: facturasPagar.length,
    totalAPagar: facturasPagar.reduce((a, c) => a + c.total, 0),
    deudas: deudasPendientes.length,
    totalDeudas: deudasPendientes.reduce((a, c) => a + c.total, 0),
  }

  const esVistaPagar = filtroEstado === 'a_pagar' || filtroEstado === 'deudas'

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .tr:hover { background: #FDFAF6 !important; }
        .btn-row:hover { border-color: ${T.border2} !important; color: ${T.muted} !important; }
        .btn-wine:hover { background: #6A0000 !important; }
        .drop-item:hover { background: ${T.bg} !important; }
        input:focus, select:focus, textarea:focus { border-color: ${T.border2} !important; box-shadow: 0 0 0 3px rgba(128,0,0,0.08) !important; }
      `}</style>

      {/* Page header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Órdenes de compra</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: '3px 0 0' }}>{empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={abrirDeuda} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Cargar deuda
          </button>
          <button onClick={abrirFacturaNueva} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nueva factura
          </button>
          <button className="btn-wine" onClick={abrirNuevo} style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.12s', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nueva orden
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* KPIs — 4 tarjetas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Pendientes de envío', value: kpis.pendientes, color: T.amber },
            { label: 'Enviadas',            value: kpis.enviadas,   color: T.blue  },
            { label: 'Facturas a pagar',    value: kpis.facturasPagar, color: T.red },
            { label: 'Total a pagar',       value: `$${kpis.totalAPagar.toLocaleString('es-AR')}`, color: T.text },
            { label: 'Deudas pendientes',   value: kpis.deudas,     color: T.wine },
            { label: 'Total deudas',        value: `$${kpis.totalDeudas.toLocaleString('es-AR')}`, color: T.wine },
          ].map(k => (
            <div key={k.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filtro estado */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {(['', 'pendiente', 'enviado', 'recibido', 'a_pagar', 'deudas'] as const).map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              style={{ background: filtroEstado === e ? T.wine : T.surface, color: filtroEstado === e ? '#fff' : T.muted, border: `1px solid ${filtroEstado === e ? T.wine : T.border}`, borderRadius: 7, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}>
              {e === '' ? 'Todas' : e === 'a_pagar' ? 'A pagar' : e === 'deudas' ? 'Deudas directas' : ESTADO_LABEL[e]}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {esVistaPagar
                  ? ['N°', 'Proveedor', 'Nro. Factura', 'Total', 'Vencimiento', 'Estado pago', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))
                  : ['N°', 'Proveedor', 'Items', 'Total', 'Estado', 'Fecha esp.', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))
                }
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: T.muted, fontSize: 13 }}>Cargando...</td></tr>
              ) : filtradas.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: T.muted, fontSize: 13 }}>Sin órdenes</td></tr>
              ) : filtradas.map(c => esVistaPagar ? (
                <tr key={c.id} className="tr" style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 0.1s' }} onClick={() => setDetalle(c)}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: T.muted }}>{c.numero}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: T.text }}>{c.proveedor_nombre}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: T.muted, fontFamily: 'monospace' }}>{c.nro_factura || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: T.text }}>${c.total.toLocaleString('es-AR')}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, ...vencimientoStyle(c.fecha_vencimiento) }}>{vencimientoLabel(c.fecha_vencimiento)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ ...(ESTADO_PAGO_STYLE[c.estado_pago || 'sin_factura'] || {}), padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'inline-block' }}>
                      {ESTADO_PAGO_LABEL[c.estado_pago || 'sin_factura']}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                    <button className="btn-row" style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 11, color: T.wine, fontWeight: 600, transition: 'all 0.12s', fontFamily: 'inherit' }} onClick={() => abrirPagoModal(c)}>
                      Registrar pago
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={c.id} className="tr" style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 0.1s' }} onClick={() => setDetalle(c)}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: T.muted }}>{c.numero}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: T.text }}>{c.proveedor_nombre}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: T.muted }}>{c.items?.length || 0} ítem{c.items?.length !== 1 ? 's' : ''}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: T.text }}>${c.total.toLocaleString('es-AR')}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ ...(ESTADO_STYLE[c.estado] || {}), padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'inline-block' }}>
                      {ESTADO_LABEL[c.estado]}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: T.muted }}>
                    {c.fecha_esperada ? new Date(c.fecha_esperada + 'T12:00:00').toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {NEXT_ESTADO[c.estado] && (
                        <button className="btn-row" style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 11, color: T.dim, transition: 'all 0.12s', fontFamily: 'inherit' }} onClick={() => avanzarEstado(c)}>
                          → {ESTADO_LABEL[NEXT_ESTADO[c.estado]]}
                        </button>
                      )}
                      {c.estado !== 'recibido' && (
                        <button className="btn-row" style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 11, color: T.red, transition: 'all 0.12s', fontFamily: 'inherit' }} onClick={() => cancelar(c)}>Cancelar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nueva OC */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && tryCloseCompra()}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: T.surface, zIndex: 1, borderRadius: '14px 14px 0 0' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Nueva orden de compra</h2>
              <button onClick={tryCloseCompra} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1/-1', position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Proveedor</label>
                  <input ref={provRef} style={{ ...INP, width: '100%' }}
                    placeholder="Buscar proveedor..." value={proveedorNombre}
                    onFocus={e => { setProvSugsOpen(true); setProvPos(computeDropPos(e.currentTarget, 180)) }}
                    onBlur={() => setTimeout(() => setProvSugsOpen(false), 200)}
                    onChange={e => { setProveedorNombre(e.target.value); setProveedorId(''); setProvSugsOpen(true); setProvPos(computeDropPos(e.currentTarget, 180)) }} />
                  {provSugsOpen && typeof document !== 'undefined' && createPortal(
                    <div style={{ position: 'fixed', top: provPos.top, left: provPos.left, width: provPos.width, background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 8, zIndex: 9999, maxHeight: provPos.maxH, overflowY: 'auto', boxShadow: '0 8px 24px rgba(26,18,16,0.14)' }}>
                      {proveedores.filter(p => !proveedorNombre || normalize(p.nombre).includes(normalize(proveedorNombre)) || normalize(p.razon_social || '').includes(normalize(proveedorNombre))).slice(0, 8).map(p => (
                        <div key={p.id} className="drop-item" style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                          onMouseDown={() => { setProveedorNombre(p.nombre); setProveedorId(p.id); setProvSugsOpen(false) }}>
                          <span style={{ fontWeight: 500, color: T.text }}>{p.nombre}</span>
                          {p.razon_social && p.razon_social !== p.nombre && <span style={{ color: T.muted }}> — {p.razon_social}</span>}
                        </div>
                      ))}
                      {proveedores.filter(p => !proveedorNombre || normalize(p.nombre).includes(normalize(proveedorNombre)) || normalize(p.razon_social || '').includes(normalize(proveedorNombre))).length === 0 && (
                        <div style={{ padding: '8px 12px', fontSize: 12, color: T.dim }}>Sin resultados — se usará el nombre ingresado</div>
                      )}
                    </div>, document.body
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Fecha esperada de entrega</label>
                  <input type="date" style={{ ...INP, width: '100%' }} value={fechaEsperada} onChange={e => setFechaEsperada(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Notas</label>
                  <input style={{ ...INP, width: '100%' }} placeholder="Observaciones..." value={notas} onChange={e => setNotas(e.target.value)} />
                </div>
              </div>

              {/* Ítems */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Productos a pedir</div>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'visible' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                        {['Producto', 'Cajas', 'Precio / caja', 'Unidades', 'Subtotal', ''].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '6px 8px', position: 'relative' }}>
                            <input style={{ ...INP, minWidth: 200 }} placeholder="Buscar producto..."
                              value={item.nombre}
                              onChange={e => { updateItem(idx, 'nombre', e.target.value); updateItem(idx, 'producto_id', ''); setProdSugs(idx); setProdPos(computeDropPos(e.currentTarget, 200)) }}
                              onFocus={e => { setProdSugs(idx); setProdPos(computeDropPos(e.currentTarget, 200)) }} onBlur={() => setTimeout(() => setProdSugs(null), 200)} />
                            {prodSugs === idx && typeof document !== 'undefined' && createPortal(
                              <div style={{ position: 'fixed', top: prodPos.top, left: prodPos.left, width: prodPos.width, background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 8, zIndex: 9999, maxHeight: prodPos.maxH, overflowY: 'auto', boxShadow: '0 8px 24px rgba(26,18,16,0.14)' }}>
                                {(() => {
                                  const porBodega = proveedorNombre
                                    ? productos.filter(p => normalize(p.bodega || '').includes(normalize(proveedorNombre)) || normalize(proveedorNombre).includes(normalize(p.bodega || '')))
                                    : productos
                                  const filtrados = porBodega.filter(p => !item.nombre || normalize(p.nombre).includes(normalize(item.nombre)))
                                  const resultado = filtrados.length > 0 ? filtrados : productos.filter(p => !item.nombre || normalize(p.nombre).includes(normalize(item.nombre)))
                                  return resultado.slice(0, 12).map(p => (
                                    <div key={p.id} className="drop-item" style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }} onMouseDown={() => selProducto(idx, p)}>
                                      <span style={{ fontWeight: 500, color: T.text }}>{p.nombre}</span>
                                      {p.bodega && <span style={{ color: T.muted }}> — {p.bodega}</span>}
                                    </div>
                                  ))
                                })()}
                              </div>, document.body
                            )}
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input type="number" style={{ ...INP, width: 65 }} min={1} value={item.cajas || 1}
                              onChange={e => updateItem(idx, 'cajas', +e.target.value || 1)} />
                            <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{upkLabel(item.unidades_por_caja || 1)}</div>
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input type="number" step="any" style={{ ...INP, width: 95 }} min={0}
                              value={item.precio_unitario || ''}
                              onChange={e => updateItem(idx, 'precio_unitario', parseFloat(e.target.value) || 0)} />
                            {(item.unidades_por_caja || 1) > 1 && item.precio_unitario > 0 && (
                              <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>${parseFloat((item.precio_unitario / (item.unidades_por_caja || 1)).toFixed(2)).toLocaleString('es-AR')} /bot</div>
                            )}
                          </td>
                          <td style={{ padding: '6px 8px', fontSize: 12, color: T.muted, whiteSpace: 'nowrap' }}>
                            {item.cantidad} u.
                          </td>
                          <td style={{ padding: '6px 8px', fontSize: 13, fontWeight: 600, color: T.muted }}>${item.subtotal.toLocaleString('es-AR')}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            {items.length > 1 && (
                              <button style={{ background: 'transparent', border: 'none', color: T.dim, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setItems(items.filter((_, i) => i !== idx))}>×</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-row" onClick={() => setItems([...items, { ...ITEM_EMPTY }])}
                style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, color: T.wine, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.12s' }}>
                + agregar línea
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Total: <span style={{ color: T.green }}>${total.toLocaleString('es-AR')}</span></span>
                <button onClick={tryCloseCompra} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button className="btn-wine" onClick={guardar} disabled={saving} style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Guardando...' : 'Crear orden'}
                </button>
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
            <p style={{ margin: '0 0 20px', fontSize: 13, color: T.muted }}>Tenés datos sin guardar en la orden de compra. Si salís ahora se van a perder.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmClose(false)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Volver</button>
              <button onClick={() => { setConfirmClose(false); setModal(false) }} style={{ background: T.red, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Salir igual</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detalle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setDetalle(null)}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>{detalle.numero}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted }}>{detalle.proveedor_nombre}</p>
              </div>
              <span style={{ ...(ESTADO_STYLE[detalle.estado] || {}), padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'inline-block' }}>
                {ESTADO_LABEL[detalle.estado]}
              </span>
            </div>
            <div style={{ padding: '0 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 0 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Producto', 'Cant.', 'P. Unit.', 'Subtotal'].map(h => (
                      <th key={h} style={{ padding: '10px 8px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(detalle.items || []).map((item, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '9px 8px', color: T.text }}>{item.nombre}</td>
                      <td style={{ padding: '9px 8px', color: T.muted }}>{item.cantidad}</td>
                      <td style={{ padding: '9px 8px', color: T.muted }}>${item.precio_unitario?.toLocaleString('es-AR')}</td>
                      <td style={{ padding: '9px 8px', fontWeight: 600, color: T.text }}>${item.subtotal?.toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: T.muted }}>{detalle.notas}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Total: <span style={{ color: T.green }}>${detalle.total.toLocaleString('es-AR')}</span></div>
            </div>

            {/* Sección factura/pago — solo cuando recibido */}
            {detalle.estado === 'recibido' && (
              <div style={{ padding: '0 24px 16px' }}>
                {(!detalle.estado_pago || detalle.estado_pago === 'sin_factura') && (
                  <div style={{ background: T.amberBg, border: `1px solid ${T.amberBd}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 2 }}>Factura pendiente de carga</div>
                      <div style={{ fontSize: 12, color: T.muted }}>Aún no se cargó la factura del proveedor.</div>
                    </div>
                    <button className="btn-wine" onClick={() => abrirFacturaModal(detalle)} style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', marginLeft: 12 }}>
                      Cargar factura
                    </button>
                  </div>
                )}

                {detalle.estado_pago === 'pendiente' && (
                  <div style={{ background: T.amberBg, border: `1px solid ${T.amberBd}`, borderRadius: 10, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: T.text }}>Factura:</span> {detalle.nro_factura || '—'}
                          {' · '}
                          <span style={{ fontWeight: 600, color: T.text }}>Fecha:</span> {detalle.fecha_factura ? new Date(detalle.fecha_factura + 'T12:00:00').toLocaleDateString('es-AR') : '—'}
                          {' · '}
                          <span style={{ fontWeight: 600, color: T.text }}>Condición:</span> {CONDICION_LABEL[detalle.condicion_pago || ''] || detalle.condicion_pago || '—'}
                        </div>
                        <div style={{ fontSize: 12, ...vencimientoStyle(detalle.fecha_vencimiento) }}>
                          <span style={{ color: T.muted, fontWeight: 400 }}>Vencimiento: </span>
                          {vencimientoLabel(detalle.fecha_vencimiento)}
                        </div>
                      </div>
                      <button className="btn-wine" onClick={() => abrirPagoModal(detalle)} style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', marginLeft: 12 }}>
                        Registrar pago
                      </button>
                    </div>
                  </div>
                )}

                {detalle.estado_pago === 'pagado' && (
                  <div style={{ background: T.greenBg, border: `1px solid ${T.greenBd}`, borderRadius: 10, padding: '14px 18px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.green, marginBottom: 4 }}>
                      ✓ Pagado el {detalle.fecha_pago ? new Date(detalle.fecha_pago + 'T12:00:00').toLocaleDateString('es-AR') : '—'} — ${(detalle.monto_pagado || 0).toLocaleString('es-AR')}
                    </div>
                    <div style={{ fontSize: 12, color: T.muted }}>
                      Factura: {detalle.nro_factura || '—'}
                      {detalle.notas_pago && <span> · {detalle.notas_pago}</span>}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => eliminarCompra(detalle)}
                  style={{ background: T.redBg, border: `1px solid ${T.redBd}`, color: T.red, borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  🗑 Eliminar
                </button>
                <button onClick={() => editarCompra(detalle)}
                  style={{ background: T.surface, border: `1px solid ${T.border2}`, color: T.text, borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✏️ Editar
                </button>
                <button onClick={() => window.open(`/api/print/compra?id=${detalle.id}&empresa=${empresa}`, '_blank')}
                  style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  🖨️ Imprimir
                </button>
                {!detalle.numero.startsWith('DEU-') && (
                  <button onClick={() => setWaModal(generarMensajeWA(detalle))}
                    style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {NEXT_ESTADO[detalle.estado] && !detalle.numero.startsWith('DEU-') && (
                  <button className="btn-wine" style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' }} onClick={() => { avanzarEstado(detalle); setDetalle(null) }}>
                    → {ESTADO_LABEL[NEXT_ESTADO[detalle.estado]]}
                  </button>
                )}
                <button style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setDetalle(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal preview WhatsApp */}
      {waModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.5)', backdropFilter: 'blur(4px)', zIndex: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setWaModal('')}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(26,18,16,0.2)' }}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Mensaje para el proveedor</span>
              </div>
              <button onClick={() => setWaModal('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, fontFamily: 'inherit' }}>×</button>
            </div>
            <div style={{ padding: '16px 24px' }}>
              <textarea
                readOnly
                value={waModal}
                style={{ width: '100%', minHeight: 260, background: '#F0FFF4', border: '1px solid #B2DFDB', borderRadius: 10, padding: '14px', fontSize: 13, color: T.text, fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
              />
              <div style={{ fontSize: 11, color: T.dim, marginTop: 6 }}>Podés editar el mensaje antes de enviarlo</div>
            </div>
            <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { navigator.clipboard.writeText(waModal); showToast('Mensaje copiado') }}
                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
                Copiar texto
              </button>
              <button onClick={async () => {
                  const det = detalle
                  if (det) {
                    abrirWhatsApp(det)
                    // Marcar como enviado si estaba pendiente
                    if (det.estado === 'pendiente') {
                      await fetch('/api/compras', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: det.id, estado: 'enviado' }) })
                      cargar(empresa)
                      setDetalle(null)
                    }
                  }
                  setWaModal('')
                }}
                style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Abrir en WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal deuda directa (mismo flujo que OC + datos de factura) ── */}
      {deudaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setDeudaModal(false)}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 700, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>

            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, background: T.surface, zIndex: 1, borderRadius: '14px 14px 0 0' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>
                  {editandoId ? 'Editar compra' : deudaModo === 'factura' ? 'Nueva factura recibida' : 'Cargar deuda existente'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>
                  {editandoId
                    ? 'Modificá los datos de esta compra'
                    : deudaModo === 'factura'
                      ? 'Registrá lo que compraste, los precios y los datos de la factura — actualiza el stock automáticamente'
                      : 'Cargá una deuda anterior al sistema — se registra como recibido y actualiza el stock'}
                </p>
              </div>
              <button onClick={() => setDeudaModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Proveedor */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Proveedor *</label>
                <input ref={provRef} style={{ ...INP, width: '100%' }} placeholder="Buscar proveedor..."
                  value={proveedorNombre}
                  onFocus={e => { setProvSugsOpen(true); setProvPos(computeDropPos(e.currentTarget, 180)) }}
                  onBlur={() => setTimeout(() => setProvSugsOpen(false), 200)}
                  onChange={e => { setProveedorNombre(e.target.value); setProveedorId(''); setProvSugsOpen(true); setProvPos(computeDropPos(e.currentTarget, 180)) }} />
                {provSugsOpen && typeof document !== 'undefined' && createPortal(
                  <div style={{ position: 'fixed', top: provPos.top, left: provPos.left, width: provPos.width, background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 8, zIndex: 9999, maxHeight: provPos.maxH, overflowY: 'auto', boxShadow: '0 8px 24px rgba(26,18,16,0.14)' }}>
                    {proveedores.filter(p => !proveedorNombre || normalize(p.nombre).includes(normalize(proveedorNombre)) || normalize(p.razon_social || '').includes(normalize(proveedorNombre))).slice(0, 8).map(p => (
                      <div key={p.id} className="drop-item" style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, borderBottom: `1px solid ${T.border}` }}
                        onMouseDown={() => { setProveedorNombre(p.nombre); setProveedorId(p.id); setProvSugsOpen(false) }}>
                        <span style={{ fontWeight: 500, color: T.text }}>{p.nombre}</span>
                        {p.razon_social && p.razon_social !== p.nombre && <span style={{ color: T.muted }}> — {p.razon_social}</span>}
                      </div>
                    ))}
                    {proveedores.filter(p => !proveedorNombre || normalize(p.nombre).includes(normalize(proveedorNombre)) || normalize(p.razon_social || '').includes(normalize(proveedorNombre))).length === 0 && (
                      <div style={{ padding: '8px 12px', fontSize: 12, color: T.dim }}>Sin resultados — se usará el nombre ingresado</div>
                    )}
                  </div>, document.body
                )}
              </div>

              {/* Ítems — misma tabla que OC */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Productos / ítems recibidos</div>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'visible' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                        {['Producto / concepto', 'Cajas', 'Precio / caja', 'Unidades', 'Subtotal', ''].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '6px 8px', position: 'relative' }}>
                            <input style={{ ...INP, minWidth: 200 }} placeholder="Buscar producto o escribir concepto..."
                              value={item.nombre}
                              onChange={e => { updateItem(idx, 'nombre', e.target.value); updateItem(idx, 'producto_id', ''); setProdSugs(idx); setProdPos(computeDropPos(e.currentTarget, 200)) }}
                              onFocus={e => { setProdSugs(idx); setProdPos(computeDropPos(e.currentTarget, 200)) }} onBlur={() => setTimeout(() => setProdSugs(null), 200)} />
                            {prodSugs === idx && typeof document !== 'undefined' && createPortal(
                              <div style={{ position: 'fixed', top: prodPos.top, left: prodPos.left, width: prodPos.width, background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 8, zIndex: 9999, maxHeight: prodPos.maxH, overflowY: 'auto', boxShadow: '0 8px 24px rgba(26,18,16,0.14)' }}>
                                {productos.filter(p => !item.nombre || normalize(p.nombre).includes(normalize(item.nombre))).slice(0, 12).map(p => (
                                  <div key={p.id} className="drop-item" style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, borderBottom: `1px solid ${T.border}` }} onMouseDown={() => selProducto(idx, p)}>
                                    <span style={{ fontWeight: 500, color: T.text }}>{p.nombre}</span>
                                    {p.bodega && <span style={{ color: T.muted }}> — {p.bodega}</span>}
                                  </div>
                                ))}
                              </div>, document.body
                            )}
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input type="number" style={{ ...INP, width: 65 }} min={1} value={item.cajas || 1} onChange={e => updateItem(idx, 'cajas', +e.target.value || 1)} />
                            <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{upkLabel(item.unidades_por_caja || 1)}</div>
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input type="number" step="any" style={{ ...INP, width: 95 }} min={0}
                              value={item.precio_unitario || ''}
                              onChange={e => updateItem(idx, 'precio_unitario', parseFloat(e.target.value) || 0)} />
                            {(item.unidades_por_caja || 1) > 1 && item.precio_unitario > 0 && (
                              <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>${parseFloat((item.precio_unitario / (item.unidades_por_caja || 1)).toFixed(2)).toLocaleString('es-AR')} /bot</div>
                            )}
                          </td>
                          <td style={{ padding: '6px 8px', fontSize: 12, color: T.muted, whiteSpace: 'nowrap' }}>
                            {item.cantidad} u.
                          </td>
                          <td style={{ padding: '6px 8px', fontSize: 13, fontWeight: 600, color: T.muted }}>${item.subtotal.toLocaleString('es-AR')}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            {items.length > 1 && <button style={{ background: 'transparent', border: 'none', color: T.dim, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setItems(items.filter((_, i) => i !== idx))}>×</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn-row" onClick={() => setItems([...items, { ...ITEM_EMPTY }])}
                  style={{ marginTop: 8, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, color: T.wine, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  + agregar línea
                </button>
              </div>

              {/* Separador — datos de factura */}
              <div style={{ borderTop: `2px dashed ${T.border}`, paddingTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Datos de la factura</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Nro. de factura</label>
                    <input style={{ ...INP, width: '100%' }} placeholder="0001-00012345" value={fNroFactura} onChange={e => setFNroFactura(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Fecha factura</label>
                    <input type="date" style={{ ...INP, width: '100%' }} value={fFechaFactura}
                      onChange={e => { setFFechaFactura(e.target.value); setFVencimiento(calcVencimiento(fCondicion, e.target.value)) }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Condición de pago</label>
                    <select style={{ ...INP, width: '100%' }} value={fCondicion}
                      onChange={e => { setFCondicion(e.target.value); setFVencimiento(calcVencimiento(e.target.value, fFechaFactura)) }}>
                      <option value="contado">Contado (ya pagado)</option>
                      <option value="30_dias">30 días</option>
                      <option value="60_dias">60 días</option>
                      <option value="90_dias">90 días</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Vencimiento</label>
                    <input type="date" style={{ ...INP, width: '100%' }} value={fVencimiento} onChange={e => setFVencimiento(e.target.value)} />
                  </div>
                </div>
                {/* Impuestos */}
                <div style={{ marginTop: 14, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: T.bg, padding: '8px 14px', fontSize: 10, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>Impuestos</div>
                  <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={incluyeIva} onChange={e => setIncluyeIva(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: T.wine, cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: T.text, flex: 1 }}>IVA 21%</span>
                      {incluyeIva && (
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.muted, fontFamily: 'monospace' }}>
                          + ${Math.round(items.filter(i=>i.nombre).reduce((a,i)=>a+(i.subtotal||0),0) * 0.21).toLocaleString('es-AR')}
                        </span>
                      )}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={incluyePercIva} onChange={e => setIncluyePercIva(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: T.wine, cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: T.text, flex: 1 }}>Percepción IVA 3%</span>
                      {incluyePercIva && (
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.muted, fontFamily: 'monospace' }}>
                          + ${Math.round(items.filter(i=>i.nombre).reduce((a,i)=>a+(i.subtotal||0),0) * 0.03).toLocaleString('es-AR')}
                        </span>
                      )}
                    </label>
                    {/* IIBB — porcentaje variable */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 16, height: 16, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: T.text, flex: 1 }}>Perc. IIBB</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="number" step="any" min={0} max={100} placeholder="0"
                          style={{ ...INP, width: 64, textAlign: 'right', fontSize: 13 }}
                          value={pctIIBB || ''}
                          onChange={e => setPctIIBB(parseFloat(e.target.value) || 0)} />
                        <span style={{ fontSize: 13, color: T.muted }}>%</span>
                        {pctIIBB > 0 && (
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.muted, fontFamily: 'monospace', minWidth: 80, textAlign: 'right' }}>
                            + ${Math.round(items.filter(i=>i.nombre).reduce((a,i)=>a+(i.subtotal||0),0) * pctIIBB / 100).toLocaleString('es-AR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Resumen totales */}
                  {(incluyeIva || incluyePercIva || pctIIBB > 0) && (() => {
                    const neto = items.filter(i=>i.nombre).reduce((a,i)=>a+(i.subtotal||0),0)
                    const iva = incluyeIva ? Math.round(neto * 0.21) : 0
                    const perc = incluyePercIva ? Math.round(neto * 0.03) : 0
                    const iibb = pctIIBB > 0 ? Math.round(neto * pctIIBB / 100 * 100) / 100 : 0
                    return (
                      <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 14px', background: T.bg }}>
                        {[
                          { label: 'Neto', val: neto },
                          incluyeIva ? { label: 'IVA 21%', val: iva } : null,
                          incluyePercIva ? { label: 'Perc. IVA 3%', val: perc } : null,
                          iibb > 0 ? { label: `Perc. IIBB ${pctIIBB}%`, val: iibb } : null,
                        ].filter(Boolean).map(row => (
                          <div key={row!.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.muted, marginBottom: 3 }}>
                            <span>{row!.label}</span>
                            <span style={{ fontFamily: 'monospace' }}>${row!.val.toLocaleString('es-AR')}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: T.text, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${T.border2}` }}>
                          <span>Total con impuestos</span>
                          <span style={{ color: T.wine, fontFamily: 'monospace' }}>${(neto + iva + perc + iibb).toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                    Total manual
                    <span style={{ fontWeight: 400, color: T.dim, marginLeft: 6 }}>(solo si el total de la factura difiere — dejá vacío para usar el calculado)</span>
                  </label>
                  <input type="number" min={0} step={0.01} style={{ ...INP, width: '100%', fontWeight: 600, fontSize: 15 }}
                    value={fTotal || ''} onChange={e => setFTotal(parseFloat(e.target.value) || 0)} placeholder="0" />
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Notas <span style={{ fontWeight: 400, color: T.dim }}>(opcional)</span></label>
                  <input style={{ ...INP, width: '100%' }} placeholder="Observaciones..." value={notas} onChange={e => setNotas(e.target.value)} />
                </div>
              </div>

            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                Total: <span style={{ color: T.green }}>
                  {(() => {
                    const neto = items.filter(i=>i.nombre).reduce((a,i)=>a+(i.subtotal||0),0)
                    const conImp = neto + (incluyeIva ? Math.round(neto * 0.21) : 0) + (incluyePercIva ? Math.round(neto * 0.03) : 0) + (pctIIBB > 0 ? Math.round(neto * pctIIBB / 100 * 100) / 100 : 0)
                    return '$' + (fTotal > 0 ? fTotal : conImp).toLocaleString('es-AR')
                  })()}
                </span>
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeudaModal(false)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button className="btn-wine" onClick={guardarDeuda} disabled={saving} style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Guardando...' : editandoId ? 'Guardar cambios →' : deudaModo === 'factura' ? 'Registrar factura →' : 'Registrar deuda →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal carga de factura */}
      {facturaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.5)', backdropFilter: 'blur(4px)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setFacturaModal(null)}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(26,18,16,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Cargar factura — {facturaModal.numero}</h2>
              <button onClick={() => setFacturaModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Fila 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Nro. de factura</label>
                  <input style={{ ...INP, width: '100%' }} placeholder="0001-00012345" value={fNroFactura} onChange={e => setFNroFactura(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Fecha factura</label>
                  <input type="date" style={{ ...INP, width: '100%' }} value={fFechaFactura}
                    onChange={e => {
                      setFFechaFactura(e.target.value)
                      setFVencimiento(calcVencimiento(fCondicion, e.target.value))
                    }} />
                </div>
              </div>
              {/* Fila 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Condición de pago</label>
                  <select style={{ ...INP, width: '100%' }} value={fCondicion}
                    onChange={e => {
                      setFCondicion(e.target.value)
                      setFVencimiento(calcVencimiento(e.target.value, fFechaFactura))
                    }}>
                    <option value="contado">Contado</option>
                    <option value="30_dias">30 días</option>
                    <option value="60_dias">60 días</option>
                    <option value="90_dias">90 días</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Vencimiento</label>
                  <input type="date" style={{ ...INP, width: '100%' }} value={fVencimiento} onChange={e => setFVencimiento(e.target.value)} />
                </div>
              </div>
              {/* Fila 3 — Monto final */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                  Monto final de la factura
                  <span style={{ fontWeight: 400, color: T.dim, marginLeft: 6 }}>(estimado: ${(facturaModal?.total ?? 0).toLocaleString('es-AR')})</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  style={{ ...INP, width: '100%', fontWeight: 600, fontSize: 15 }}
                  value={fTotal || ''}
                  onChange={e => setFTotal(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setFacturaModal(null)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button className="btn-wine" onClick={guardarFactura} disabled={saving} style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar factura →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal registro de pago */}
      {pagoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.5)', backdropFilter: 'blur(4px)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setPagoModal(null)}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(26,18,16,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Registrar pago — {pagoModal.nro_factura || pagoModal.numero}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Total factura: ${pagoModal.total.toLocaleString('es-AR')}</p>
              </div>
              <button onClick={() => setPagoModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Monto pagado</label>
                <input type="number" step="any" style={{ ...INP, width: '100%' }} min={0} value={pMonto || ''} onChange={e => setPMonto(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Fecha de pago</label>
                <input type="date" style={{ ...INP, width: '100%' }} value={pFechaPago} onChange={e => setPFechaPago(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Notas <span style={{ fontWeight: 400, color: T.dim }}>(opcional)</span></label>
                <input style={{ ...INP, width: '100%' }} placeholder="Ej: transferencia, cheque..." value={pNotas} onChange={e => setPNotas(e.target.value)} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setPagoModal(null)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button className="btn-wine" onClick={registrarPago} disabled={saving} style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : '✓ Registrar pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 13, padding: '12px 20px', borderRadius: 12, boxShadow: '0 8px 32px rgba(26,18,16,0.12)', zIndex: 200 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
