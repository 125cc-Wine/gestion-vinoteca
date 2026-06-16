'use client'
import { useEffect, useState } from 'react'
import type { Producto, Cliente, Venta, VentaItem } from '@/types'

const EMPRESAS_DATA = {
  aroma: { nombre: 'Aroma de Vid', cuit: '20-26600984-5', domicilio: 'Roca 2787, Mar del Plata', telefono: '(0223) 491-1705', logoPath: '/logos/aroma.jpg' },
  lavid: { nombre: 'MDP La Vid Consultora S.R.L.', cuit: '30-71762144-8', domicilio: 'Roca 2787, Mar del Plata', telefono: '(0223) 685-0870', logoPath: '/logos/lavid.png' },
}

const CONDICIONES_VENTA = ['Contado', 'Cta. Cte.', 'Transferencia', 'Cheque', 'Tarjeta Débito', 'Tarjeta Crédito', 'QR', 'Billetera Virtual MercadoPago', 'CtaDni']

interface ItemForm extends VentaItem { producto_id: string; descuento: number }
const ITEM_EMPTY: ItemForm = { producto_id: '', nombre: '', cantidad: 1, precio_unitario: 0, descuento: 0, subtotal: 0 }

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:           '#0F0F0F',
  surface:      '#141414',
  card:         '#1A1A1A',
  border:       '#2A2A2A',
  accent:       '#8B1A2A',
  text:         '#E8E8E8',
  muted:        '#888888',
  dim:          '#555555',
  green:        '#4CAF7D',
  amber:        '#D4820A',
  red:          '#E05555',
  dangerBg:     '#3A1010',
  dangerBorder: '#8B2020',
}

const INP: React.CSSProperties = {
  background: '#111', border: `1px solid ${C.border}`, borderRadius: 6,
  color: C.text, padding: '5px 8px', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

function btn(v: 'default' | 'accent' | 'ghost' | 'danger' = 'default', ex: React.CSSProperties = {}): React.CSSProperties {
  const bases = {
    default: { background: '#222', border: `1px solid ${C.border}` },
    accent:  { background: C.accent, border: `1px solid ${C.accent}` },
    ghost:   { background: 'transparent', border: '1px solid transparent' },
    danger:  { background: C.dangerBg, border: `1px solid ${C.dangerBorder}` },
  }
  return { ...bases[v], color: C.text, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', ...ex }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VentasPage() {
  const [empresa, setEmpresa] = useState<'aroma' | 'lavid'>('aroma')
  const [ventas, setVentas] = useState<Venta[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vendedores, setVendedores] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [tipo, setTipo] = useState<'presupuesto' | 'remito'>('presupuesto')
  const [editVentaId, setEditVentaId] = useState<string | null>(null)
  const [clienteId, setClienteId] = useState('')
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final')
  const [clienteData, setClienteData] = useState<Cliente | null>(null)
  const [clienteTipo, setClienteTipo] = useState('')
  const [vendedorNombre, setVendedorNombre] = useState('')
  const [items, setItems] = useState<ItemForm[]>([{ ...ITEM_EMPTY }])
  const [busquedaProducto, setBusquedaProducto] = useState<string[]>([''])
  const [descuentoGlobal, setDescuentoGlobal] = useState(0)
  const [notas, setNotas] = useState('')
  const [condVenta, setCondVenta] = useState('Contado')
  const [estadoPago, setEstadoPago] = useState('pagado')
  const [ventaParaImprimir, setVentaParaImprimir] = useState<Venta | null>(null)
  const [busquedaVentas, setBusquedaVentas] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const e = (localStorage.getItem('empresa') || 'aroma') as 'aroma' | 'lavid'
    setEmpresa(e); cargarTodo(e)
  }, [])

  async function cargarTodo(emp: string) {
    setLoading(true)
    const [vRes, pRes, cRes, vendRes] = await Promise.all([
      fetch(`/api/ventas?empresa=${emp}`),
      fetch(`/api/productos?empresa=${emp}`),
      fetch(`/api/clientes?empresa=${emp}`),
      fetch(`/api/vendedores?empresa=${emp}`),
    ])
    setVentas(await vRes.json().catch(() => []))
    setProductos(await pRes.json().catch(() => []))
    setClientes(await cRes.json().catch(() => []))
    setVendedores(await vendRes.json().catch(() => []))
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function calcSubtotal(item: ItemForm) {
    const base = item.cantidad * item.precio_unitario
    return base - base * ((item.descuento || 0) / 100)
  }

  function calcTotal() {
    const sub = items.reduce((a, i) => a + calcSubtotal(i), 0)
    return sub - sub * (descuentoGlobal / 100)
  }

  function productosFiltrados(idx: number) {
    const q = (busquedaProducto[idx] || '').toLowerCase()
    if (!q) return productos.slice(0, 50)
    return productos.filter(p => `${p.nombre} ${p.bodega || ''} ${p.varietal || ''}`.toLowerCase().includes(q)).slice(0, 50)
  }

  function seleccionarProducto(idx: number, prodId: string) {
    const prod = productos.find(p => p.id === prodId)
    if (!prod) return
    const esMayorista = clienteTipo === 'mayorista' || clienteTipo === 'revendedor'
    const precio = esMayorista && prod.precio_mayorista ? prod.precio_mayorista : prod.precio_venta
    const newItems = [...items]
    newItems[idx] = {
      ...newItems[idx],
      producto_id: prod.id!,
      nombre: `${prod.nombre}${prod.bodega ? ' - ' + prod.bodega : ''}`,
      precio_unitario: precio,
    }
    newItems[idx].subtotal = calcSubtotal(newItems[idx])
    setItems(newItems)
  }

  function updateBusqueda(idx: number, val: string) {
    const arr = [...busquedaProducto]; arr[idx] = val; setBusquedaProducto(arr)
  }

  function updateItem(idx: number, field: string, value: number | string) {
    const newItems = [...items]
    ;(newItems[idx] as unknown as Record<string, number | string>)[field] = value
    newItems[idx].subtotal = calcSubtotal(newItems[idx])
    setItems(newItems)
  }

  function seleccionarCliente(id: string) {
    setClienteId(id)
    if (!id) {
      setClienteNombre('Consumidor Final')
      setClienteData(null)
      setClienteTipo('')
      return
    }
    const c = clientes.find(c => c.id === id)
    if (c) {
      setClienteNombre(c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim())
      setClienteData(c)
      setClienteTipo(c.tipo)
    }
  }

  async function guardar() {
    if (items.every(i => !i.nombre)) { showToast('Agregá al menos un producto'); return }
    const subtotal = items.reduce((a, i) => a + calcSubtotal(i), 0)
    const total = calcTotal()
    const ventaData = {
      empresa, tipo,
      vendedor_nombre: vendedorNombre || null,
      cliente_id: clienteId || null,
      cliente_nombre: clienteNombre,
      items: items.filter(i => i.nombre).map(i => ({
        producto_id: i.producto_id || null,
        nombre: i.nombre,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        descuento: i.descuento,
        subtotal: calcSubtotal(i),
      })),
      subtotal, descuento: descuentoGlobal, total,
      estado: 'emitido', estado_pago: estadoPago, notas, condicion_venta: condVenta,
      descontarStock: tipo === 'remito' && !editVentaId,
    }

    let res
    if (editVentaId) {
      res = await fetch('/api/ventas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editVentaId, ...ventaData }) })
    } else {
      res = await fetch('/api/ventas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ventaData) })
    }
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false)
    await cargarTodo(empresa)
    showToast(editVentaId ? 'Comprobante actualizado' : `${tipo === 'presupuesto' ? 'Presupuesto' : 'Remito'} ${data.numero} generado`)
    if (!editVentaId) setTimeout(() => { setVentaParaImprimir(data); setTimeout(() => imprimirDoc(), 400) }, 200)
  }

  async function eliminarVenta(id: string) {
    if (!confirm('¿Eliminar este comprobante?')) return
    await fetch(`/api/ventas?id=${id}`, { method: 'DELETE' })
    cargarTodo(empresa); showToast('Comprobante eliminado')
  }

  function editarVenta(v: Venta) {
    setEditVentaId(v.id!)
    setTipo(v.tipo as 'presupuesto' | 'remito')
    setClienteId(v.cliente_id || '')
    setClienteNombre(v.cliente_nombre)
    const c = clientes.find(c => c.id === v.cliente_id)
    setClienteData(c || null)
    setClienteTipo(c?.tipo || '')
    setVendedorNombre((v as Venta & { vendedor_nombre?: string }).vendedor_nombre || '')
    const ventaItems = (v.items as (VentaItem & { descuento?: number })[]).map(i => ({
      producto_id: i.producto_id || '', nombre: i.nombre, cantidad: i.cantidad,
      precio_unitario: i.precio_unitario, descuento: i.descuento || 0, subtotal: i.subtotal,
    }))
    setItems(ventaItems)
    setBusquedaProducto(ventaItems.map(() => ''))
    setDescuentoGlobal(v.descuento)
    setNotas(v.notas || '')
    setCondVenta((v as unknown as Record<string, string>).condicion_venta || 'Contado')
    setEstadoPago(v.estado_pago || 'pagado')
    setModal(true)
  }

  function imprimirDoc() {
    const el = document.getElementById('print-area')
    if (!el) return
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    w.document.write(
      `<html><head><title>Comprobante</title><style>body{font-family:Arial,sans-serif;font-size:11px;margin:24px}table{width:100%;border-collapse:collapse}th,td{padding:5px 8px}@media print{body{margin:12px}}</style></head><body>${el.innerHTML}</body></html>`,
    )
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 500)
  }

  function imprimirVenta(v: Venta) {
    setVentaParaImprimir(v)
    setTimeout(imprimirDoc, 400)
  }

  function abrirNuevo(t: 'presupuesto' | 'remito') {
    setEditVentaId(null)
    setTipo(t)
    setClienteId(''); setClienteNombre('Consumidor Final'); setClienteData(null); setClienteTipo('')
    setVendedorNombre('')
    setItems([{ ...ITEM_EMPTY }]); setBusquedaProducto([''])
    setDescuentoGlobal(0); setNotas(''); setCondVenta('Contado'); setEstadoPago('pagado')
    setModal(true)
  }

  const emp = EMPRESAS_DATA[empresa]

  const totalRemitos = ventas
    .filter(v => v.tipo === 'remito' && v.estado !== 'cancelado')
    .reduce((a, v) => a + v.total, 0)

  const ventasFiltradas = ventas.filter(v => {
    const q = busquedaVentas.toLowerCase()
    if (q && !`${v.numero} ${v.cliente_nombre}`.toLowerCase().includes(q)) return false
    if (filtroTipo && v.tipo !== filtroTipo) return false
    if (filtroEstadoPago && v.estado_pago !== filtroEstadoPago) return false
    if (filtroVendedor && (v as Venta & { vendedor_nombre?: string }).vendedor_nombre !== filtroVendedor) return false
    if (filtroDesde && v.created_at && v.created_at < filtroDesde) return false
    if (filtroHasta && v.created_at && v.created_at.split('T')[0] > filtroHasta) return false
    return true
  })

  const hayFiltros = filtroDesde || filtroHasta || filtroTipo || filtroEstadoPago || filtroVendedor || busquedaVentas

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '24px', color: C.text }}>
      <style>{`
        .venta-row:hover { background: rgba(255,255,255,0.03) !important; }
        .venta-row td { border-bottom: 1px solid ${C.border}; }
        .vbtn:hover { opacity: 0.8; }
        .vbtn:active { opacity: 0.6; }
        .vinp:focus { border-color: ${C.accent} !important; }
        .vinp::placeholder { color: ${C.dim}; }
        select.vinp option { background: #1a1a1a; color: ${C.text}; }
        .vrow-item:hover { background: rgba(255,255,255,0.02) !important; }
        .item-row td { border-bottom: 1px solid ${C.border}; }
      `}</style>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total comprobantes', value: String(ventas.length), color: C.text },
          { label: 'Presupuestos', value: String(ventas.filter(v => v.tipo === 'presupuesto').length), color: C.muted },
          { label: 'Total remitos', value: `$${totalRemitos.toLocaleString('es-AR')}`, color: C.green },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Ventas y comprobantes</h1>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{ventasFiltradas.length} comprobantes</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="vbtn" style={btn('default')} onClick={() => abrirNuevo('presupuesto')}>+ Presupuesto</button>
          <button className="vbtn" style={btn('accent')} onClick={() => abrirNuevo('remito')}>+ Remito</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
          <input
            className="vinp"
            style={INP}
            placeholder="Número, cliente..."
            value={busquedaVentas}
            onChange={e => setBusquedaVentas(e.target.value)}
          />
          <select className="vinp" style={INP} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="presupuesto">Presupuesto</option>
            <option value="remito">Remito</option>
          </select>
          <select className="vinp" style={INP} value={filtroEstadoPago} onChange={e => setFiltroEstadoPago(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
            <option value="cuenta_corriente">Cta. Corriente</option>
          </select>
          <select className="vinp" style={INP} value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)}>
            <option value="">Todos los vendedores</option>
            {vendedores.map(v => <option key={v.id} value={v.nombre}>{v.nombre}</option>)}
          </select>
          <input type="date" className="vinp" style={INP} value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} title="Desde" />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="date" className="vinp" style={{ ...INP, flex: 1 }} value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} title="Hasta" />
            {hayFiltros && (
              <button
                className="vbtn"
                style={{ ...btn('ghost', { padding: '4px 8px', fontSize: 16 }), color: C.dim, flexShrink: 0 }}
                onClick={() => { setFiltroDesde(''); setFiltroHasta(''); setFiltroTipo(''); setFiltroEstadoPago(''); setFiltroVendedor(''); setBusquedaVentas('') }}
                title="Limpiar filtros"
              >×</button>
            )}
          </div>
        </div>
        {ventasFiltradas.length !== ventas.length && (
          <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>
            Mostrando {ventasFiltradas.length} de {ventas.length} comprobantes
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
              {['Número', 'Tipo', 'Cliente', 'Vendedor', 'Fecha', 'Estado pago', 'Total', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px 0', color: C.dim }}>Cargando...</td></tr>
            ) : ventasFiltradas.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px 0', color: C.dim }}>No hay comprobantes todavía</td></tr>
            ) : ventasFiltradas.map(v => (
              <tr key={v.id} className="venta-row" style={{ background: 'transparent' }}>
                <td style={{ padding: '11px 14px', fontWeight: 600, color: C.text, fontFamily: 'monospace', fontSize: 12 }}>{v.numero}</td>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: v.tipo === 'presupuesto' ? 'rgba(139,26,42,0.18)' : 'rgba(76,175,125,0.15)',
                    color: v.tipo === 'presupuesto' ? '#D08090' : C.green,
                    border: `1px solid ${v.tipo === 'presupuesto' ? 'rgba(139,26,42,0.4)' : 'rgba(76,175,125,0.3)'}`,
                  }}>
                    {v.tipo === 'presupuesto' ? 'Presupuesto' : 'Remito'}
                  </span>
                </td>
                <td style={{ padding: '11px 14px', color: C.text }}>{v.cliente_nombre}</td>
                <td style={{ padding: '11px 14px', color: C.muted, fontSize: 12 }}>{(v as Venta & { vendedor_nombre?: string }).vendedor_nombre || '—'}</td>
                <td style={{ padding: '11px 14px', color: C.muted, fontSize: 12 }}>
                  {new Date(v.created_at!).toLocaleDateString('es-AR')}
                </td>
                <td style={{ padding: '11px 14px' }}>
                  {v.estado_pago === 'pagado' && (
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(76,175,125,0.15)', color: C.green, border: '1px solid rgba(76,175,125,0.3)' }}>Pagado</span>
                  )}
                  {v.estado_pago === 'pendiente' && (
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(212,130,10,0.15)', color: C.amber, border: '1px solid rgba(212,130,10,0.3)' }}>Pendiente</span>
                  )}
                  {v.estado_pago === 'cuenta_corriente' && (
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(100,140,220,0.15)', color: '#7AADFF', border: '1px solid rgba(100,140,220,0.3)' }}>Cta. Cte.</span>
                  )}
                  {!v.estado_pago && <span style={{ color: C.dim }}>—</span>}
                </td>
                <td style={{ padding: '11px 14px', fontWeight: 700, color: C.text }}>${v.total.toLocaleString('es-AR')}</td>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="vbtn" style={btn('default', { padding: '4px 8px', fontSize: 11 })} onClick={() => imprimirVenta(v)}>Imprimir</button>
                    <button className="vbtn" style={btn('default', { padding: '4px 8px', fontSize: 11 })} onClick={() => editarVenta(v)}>Editar</button>
                    <button className="vbtn" style={btn('danger', { padding: '4px 8px', fontSize: 11 })} onClick={() => eliminarVenta(v.id!)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nueva/editar venta */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}
          onClick={e => e.target === e.currentTarget && setModal(false)}
        >
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, width: '100%', maxWidth: 760, margin: '16px auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>
                  {editVentaId ? 'Editar' : 'Nuevo'} {tipo === 'presupuesto' ? 'presupuesto' : 'remito'}
                </h2>
                {tipo === 'remito' && !editVentaId && (
                  <div style={{ fontSize: 11, color: C.green, marginTop: 3 }}>Descuenta stock automáticamente al guardar</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', background: C.surface, borderRadius: 7, padding: 3, border: `1px solid ${C.border}` }}>
                  {(['presupuesto', 'remito'] as const).map(t => (
                    <button
                      key={t}
                      className="vbtn"
                      onClick={() => setTipo(t)}
                      style={{ ...btn(tipo === t ? 'accent' : 'ghost', { padding: '4px 12px', fontSize: 12, borderRadius: 5 }), border: 'none' }}
                    >
                      {t === 'presupuesto' ? 'Presupuesto' : 'Remito'}
                    </button>
                  ))}
                </div>
                <button className="vbtn" style={{ ...btn('ghost', { padding: '4px 8px', fontSize: 18, lineHeight: 1 }), color: C.dim }} onClick={() => setModal(false)}>×</button>
              </div>
            </div>

            {/* Cliente / Vendedor / Condición */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Cliente</div>
                <select className="vinp" style={INP} value={clienteId} onChange={e => seleccionarCliente(e.target.value)}>
                  <option value="">Consumidor Final</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Vendedor</div>
                <select className="vinp" style={INP} value={vendedorNombre} onChange={e => setVendedorNombre(e.target.value)}>
                  <option value="">— Sin asignar —</option>
                  {vendedores.map(v => <option key={v.id} value={v.nombre}>{v.nombre}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Condición de venta</div>
                <select className="vinp" style={INP} value={condVenta} onChange={e => setCondVenta(e.target.value)}>
                  {CONDICIONES_VENTA.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Estado pago */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Estado de pago</div>
              <select className="vinp" style={{ ...INP, maxWidth: 220 }} value={estadoPago} onChange={e => setEstadoPago(e.target.value)}>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
                <option value="cuenta_corriente">Cuenta corriente</option>
              </select>
            </div>

            {/* Info cliente */}
            {clienteData && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: C.muted }}>
                <span>CUIT: {clienteData.cuit || '—'}</span>
                <span>{clienteData.direccion || '—'}</span>
                <span>{clienteData.telefono || '—'}</span>
                {(clienteTipo === 'mayorista' || clienteTipo === 'revendedor') && (
                  <span style={{ color: C.amber, fontWeight: 600 }}>Precio mayorista activo</span>
                )}
              </div>
            )}

            {/* Items */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Productos</div>
                <button
                  className="vbtn"
                  style={{ ...btn('ghost', { padding: '3px 8px', fontSize: 12 }), color: C.accent }}
                  onClick={() => { setItems([...items, { ...ITEM_EMPTY }]); setBusquedaProducto([...busquedaProducto, '']) }}
                >
                  + agregar línea
                </button>
              </div>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.surface }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#111' }}>
                      <th style={{ textAlign: 'left', padding: '8px 10px', color: C.dim, fontWeight: 500, width: '40%' }}>Buscar producto</th>
                      <th style={{ textAlign: 'center', padding: '8px 6px', color: C.dim, fontWeight: 500, width: 56 }}>Cant.</th>
                      <th style={{ textAlign: 'right', padding: '8px 6px', color: C.dim, fontWeight: 500 }}>P.Unit.</th>
                      <th style={{ textAlign: 'center', padding: '8px 6px', color: C.dim, fontWeight: 500, width: 52 }}>Dto%</th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', color: C.dim, fontWeight: 500 }}>Total</th>
                      <th style={{ width: 24 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="vrow-item item-row" style={{ background: 'transparent' }}>
                        <td style={{ padding: '6px 8px', borderBottom: `1px solid ${C.border}` }}>
                          <input
                            type="text"
                            className="vinp"
                            style={{ ...INP, fontSize: 12, padding: '4px 7px', marginBottom: 4 }}
                            placeholder="Buscar por nombre, bodega..."
                            value={busquedaProducto[idx] || ''}
                            onChange={e => updateBusqueda(idx, e.target.value)}
                          />
                          <select
                            className="vinp"
                            style={{ ...INP, fontSize: 12, padding: '4px 7px' }}
                            value={item.producto_id}
                            onChange={e => seleccionarProducto(idx, e.target.value)}
                          >
                            <option value="">— Seleccionar —</option>
                            {productosFiltrados(idx).map(p => (
                              <option key={p.id} value={p.id}>
                                {p.nombre}{p.bodega ? ` · ${p.bodega}` : ''} (Stock: {p.stock})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '6px 4px', borderBottom: `1px solid ${C.border}` }}>
                          <input type="number" min="1" className="vinp" style={{ ...INP, fontSize: 12, padding: '4px 6px', textAlign: 'center' }} value={item.cantidad} onChange={e => updateItem(idx, 'cantidad', parseInt(e.target.value) || 1)} />
                        </td>
                        <td style={{ padding: '6px 4px', borderBottom: `1px solid ${C.border}` }}>
                          <input type="number" min="0" className="vinp" style={{ ...INP, fontSize: 12, padding: '4px 6px', textAlign: 'right' }} value={item.precio_unitario} onChange={e => updateItem(idx, 'precio_unitario', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td style={{ padding: '6px 4px', borderBottom: `1px solid ${C.border}` }}>
                          <input type="number" min="0" max="100" className="vinp" style={{ ...INP, fontSize: 12, padding: '4px 6px', textAlign: 'center' }} value={item.descuento} onChange={e => updateItem(idx, 'descuento', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: C.text, whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}` }}>
                          ${calcSubtotal(item).toLocaleString('es-AR')}
                        </td>
                        <td style={{ padding: '6px 6px', textAlign: 'center', borderBottom: `1px solid ${C.border}` }}>
                          {items.length > 1 && (
                            <button
                              className="vbtn"
                              style={{ background: 'transparent', border: 'none', color: C.dim, fontSize: 16, cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}
                              onClick={() => { setItems(items.filter((_, i) => i !== idx)); setBusquedaProducto(busquedaProducto.filter((_, i) => i !== idx)) }}
                            >×</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notas + Totales */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Notas</div>
                <textarea
                  className="vinp"
                  style={{ ...INP, height: 64, resize: 'none', fontSize: 12 }}
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Observaciones..."
                />
              </div>
              <div style={{ width: 200 }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Descuento global (%)</div>
                <input
                  type="number" min="0" max="100"
                  className="vinp"
                  style={INP}
                  value={descuentoGlobal}
                  onChange={e => setDescuentoGlobal(parseFloat(e.target.value) || 0)}
                />
                <div style={{ marginTop: 10, textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    Subtotal: ${items.reduce((a, i) => a + calcSubtotal(i), 0).toLocaleString('es-AR')}
                  </div>
                  {descuentoGlobal > 0 && (
                    <div style={{ fontSize: 12, color: C.red }}>Dto: -{descuentoGlobal}%</div>
                  )}
                  <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginTop: 4 }}>
                    TOTAL: ${calcTotal().toLocaleString('es-AR')}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <button className="vbtn" style={btn('default')} onClick={() => setModal(false)}>Cancelar</button>
              <button
                className="vbtn"
                style={btn('accent', { padding: '7px 18px', fontSize: 13, fontWeight: 600 })}
                onClick={guardar}
              >
                {editVentaId ? 'Guardar cambios' : `Generar ${tipo === 'presupuesto' ? 'presupuesto' : 'remito'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Área de impresión oculta */}
      <div id="print-area" style={{ display: 'none' }}>
        {ventaParaImprimir && <PrintDoc venta={ventaParaImprimir} empresa={emp} />}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 100 }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function PrintDoc({
  venta,
  empresa,
}: {
  venta: Venta
  empresa: { nombre: string; cuit: string; domicilio: string; telefono: string; logoPath: string }
}) {
  const items = venta.items as (VentaItem & { descuento?: number })[]
  const fecha = new Date(venta.created_at!).toLocaleDateString('es-AR')
  const condVenta = (venta as unknown as Record<string, unknown>).condicion_venta as string || 'Contado'

  return (
    <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#000', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #ccc' }}>
        <img src={empresa.logoPath} alt={empresa.nombre} style={{ height: '60px', objectFit: 'contain' }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>NOTA PEDIDO</div>
          <div style={{ fontWeight: 'bold' }}>{venta.numero}</div>
        </div>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>{empresa.nombre}</div>
        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ paddingRight: '16px', paddingBottom: '3px' }}><strong>Responsable Inscripto</strong>&nbsp;&nbsp;<strong>C.U.I.T.</strong> {empresa.cuit}</td>
              <td style={{ textAlign: 'right' }}><strong>Fecha Movimiento</strong>&nbsp;&nbsp;{fecha}</td>
            </tr>
            <tr>
              <td style={{ paddingBottom: '3px' }}><strong>Domicilio</strong>&nbsp;&nbsp;{empresa.domicilio}</td>
              <td style={{ textAlign: 'right' }}><strong>Fecha Vencimiento</strong>&nbsp;&nbsp;{fecha}</td>
            </tr>
            <tr><td><strong>Teléfono</strong>&nbsp;&nbsp;{empresa.telefono}</td><td></td></tr>
          </tbody>
        </table>
      </div>
      <hr style={{ borderColor: '#ccc', marginBottom: '12px' }} />
      <div style={{ marginBottom: '12px' }}>
        <div><strong>Razón Social:</strong>&nbsp;&nbsp;{venta.cliente_nombre}</div>
        <div style={{ marginTop: '4px' }}><strong>Cond. Fiscal:</strong> Responsable Inscripto&nbsp;&nbsp;&nbsp;&nbsp;<strong>C. Venta:</strong> {condVenta}</div>
      </div>
      <hr style={{ borderColor: '#ccc', marginBottom: '12px' }} />
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '11px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000' }}>
            <th style={{ padding: '6px 8px', textAlign: 'center', width: '60px' }}>Cant.</th>
            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Descripción</th>
            <th style={{ padding: '6px 8px', textAlign: 'center', width: '60px' }}>Des(%)</th>
            <th style={{ padding: '6px 8px', textAlign: 'right', width: '110px' }}>P.UFin</th>
            <th style={{ padding: '6px 8px', textAlign: 'right', width: '110px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '0.5px solid #eee' }}>
              <td style={{ padding: '5px 8px', textAlign: 'center' }}>{item.cantidad.toFixed(3)}</td>
              <td style={{ padding: '5px 8px' }}>{item.nombre}</td>
              <td style={{ padding: '5px 8px', textAlign: 'center' }}>{item.descuento || 0}</td>
              <td style={{ padding: '5px 8px', textAlign: 'right' }}>{item.precio_unitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
              <td style={{ padding: '5px 8px', textAlign: 'right' }}>{item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '40px', borderTop: '1px solid #ccc', paddingTop: '8px' }}>
        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '35%' }}></td>
              <td style={{ textAlign: 'center', width: '13%' }}><strong>Des(%)</strong></td>
              <td style={{ textAlign: 'center', width: '13%' }}><strong>Imp. Int.</strong></td>
              <td style={{ textAlign: 'center', width: '13%' }}><strong>Otros Con.</strong></td>
              <td style={{ textAlign: 'center', width: '13%' }}><strong>Per. IIBB</strong></td>
              <td style={{ textAlign: 'right', width: '13%' }}><strong>TOTAL</strong></td>
            </tr>
            <tr>
              <td><strong>Usuario:</strong> {empresa.nombre}</td>
              <td style={{ textAlign: 'center' }}>{venta.descuento > 0 ? `${venta.descuento}%` : '-'}</td>
              <td style={{ textAlign: 'center' }}>-</td>
              <td style={{ textAlign: 'center' }}>-</td>
              <td style={{ textAlign: 'center' }}>-</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {venta.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td colSpan={6} style={{ paddingTop: '8px' }}>
                <strong>Peso (kg):</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <strong>C.A.E.</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <strong>Vto. C.A.E.</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {venta.notas && (
        <div style={{ marginTop: '12px', fontSize: '10px', color: '#666' }}>
          <strong>Notas:</strong> {venta.notas}
        </div>
      )}
    </div>
  )
}
