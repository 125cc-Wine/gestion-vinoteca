'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Producto, Cliente, Venta, VentaItem } from '@/types'

const EMPRESAS_DATA = {
  aroma: { nombre: 'Aroma de Vid', cuit: '20-26600984-5', domicilio: 'Roca 2787, Mar del Plata', telefono: '(0223) 491-1705', logoPath: '/logos/aroma.jpg' },
  lavid: { nombre: 'MDP La Vid Consultora S.R.L.', cuit: '30-71762144-8', domicilio: 'Roca 2787, Mar del Plata', telefono: '(0223) 685-0870', logoPath: '/logos/lavid.png' },
}

const CONDICIONES_VENTA = ['Contado', 'Cta. Cte.', 'Transferencia', 'Cheque', 'Tarjeta Débito', 'Tarjeta Crédito', 'QR', 'Billetera Virtual MercadoPago', 'CtaDni']

interface ItemForm extends VentaItem { producto_id: string; descuento: number }
const ITEM_EMPTY: ItemForm = { producto_id: '', nombre: '', cantidad: 1, precio_unitario: 0, descuento: 0, subtotal: 0 }

interface PedidoItem { producto_id: string; nombre: string; cantidad: number; precio_unitario: number }
interface StockStatus { [key: string]: { disponible: number; pedido: number; ok: boolean } }
interface PedidoRecord {
  id: string; numero: string; empresa: string
  cliente_id?: string; cliente_nombre: string; vendedor_nombre?: string
  items: PedidoItem[]; estado: string; fecha_entrega?: string; notas?: string; created_at: string
}
const PEDIDO_ITEM_EMPTY: PedidoItem = { producto_id: '', nombre: '', cantidad: 1, precio_unitario: 0 }

const C = {
  bg: '#0F0F0F', surface: '#141414', card: '#1A1A1A', border: '#2A2A2A',
  accent: '#8B1A2A', text: '#E8E8E8', muted: '#888888', dim: '#555555',
  green: '#4CAF7D', amber: '#D4820A', red: '#E05555',
  dangerBg: '#3A1010', dangerBorder: '#8B2020',
}

const INP: React.CSSProperties = {
  background: '#111', border: `1px solid ${C.border}`, borderRadius: 6,
  color: C.text, padding: '5px 8px', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

function btn(v: 'default' | 'accent' | 'ghost' | 'danger' | 'green' = 'default', ex: React.CSSProperties = {}): React.CSSProperties {
  const bases = {
    default: { background: '#222', border: `1px solid ${C.border}` },
    accent:  { background: C.accent, border: `1px solid ${C.accent}` },
    ghost:   { background: 'transparent', border: '1px solid transparent' },
    danger:  { background: C.dangerBg, border: `1px solid ${C.dangerBorder}` },
    green:   { background: 'rgba(76,175,125,0.15)', border: '1px solid rgba(76,175,125,0.3)' },
  }
  return { ...bases[v], color: v === 'green' ? C.green : C.text, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', ...ex }
}

function filtrarProductos(productos: Producto[], q: string) {
  if (!q) return productos.slice(0, 50)
  return productos.filter(p =>
    `${p.nombre} ${p.bodega || ''} ${p.varietal || ''}`.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 50)
}

// ─── ProductoSearch ───────────────────────────────────────────────────────────
function ProductoSearch({ productos, productoId, clienteTipo, onSelect }: {
  productos: Producto[]
  productoId: string
  clienteTipo: string
  onSelect: (prod: Producto | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hi, setHi] = useState(0)
  const [pos, setPos] = useState({ top: 0, left: 0, w: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selected = productos.find(p => p.id === productoId)
  const filtered = filtrarProductos(productos, query)
  const esMay = clienteTipo === 'mayorista' || clienteTipo === 'revendedor'

  // Cerrar al click fuera
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const t = e.target as Node
      if (!inputRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Scroll al item destacado
  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.children[hi] as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [hi, open])

  function openDropdown() {
    const rect = inputRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos({ top: rect.bottom + 2, left: rect.left, w: Math.max(rect.width, 400) })
    setOpen(true); setQuery(''); setHi(0)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); openDropdown() }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(h + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[hi]) { onSelect(filtered[hi]); setOpen(false) } }
    else if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'Tab' && filtered[hi]) { onSelect(filtered[hi]); setOpen(false) }
  }

  const display = selected ? `${selected.nombre}${selected.bodega ? ' · ' + selected.bodega : ''}` : ''

  const dropdown = open ? (
    <div ref={listRef} style={{
      position: 'fixed', top: pos.top, left: pos.left, width: pos.w,
      zIndex: 9999, background: '#1A1A1A', border: '1px solid #2A2A2A',
      borderRadius: 8, boxShadow: '0 16px 48px rgba(0,0,0,0.85)',
      maxHeight: 320, overflowY: 'auto',
    }}>
      {filtered.length === 0
        ? <div style={{ padding: '16px 12px', fontSize: 12, color: '#555', textAlign: 'center' }}>
            {query ? `Sin resultados para "${query}"` : 'Escribí para buscar'}
          </div>
        : filtered.map((p, i) => {
          const precio = esMay && p.precio_mayorista ? p.precio_mayorista : p.precio_venta
          const stockOk = p.stock > (p.stock_minimo || 0)
          const stockBajo = p.stock > 0 && p.stock <= (p.stock_minimo || 0)
          const stockColor = p.stock <= 0 ? '#E05555' : stockBajo ? '#D4820A' : '#4CAF7D'
          return (
            <div key={p.id}
              onMouseDown={e => { e.preventDefault(); onSelect(p); setOpen(false) }}
              onMouseEnter={() => setHi(i)}
              style={{
                padding: '9px 14px', cursor: 'pointer',
                background: i === hi ? 'rgba(139,26,42,0.2)' : 'transparent',
                borderBottom: '1px solid rgba(42,42,42,0.6)',
                borderLeft: `3px solid ${i === hi ? '#8B1A2A' : 'transparent'}`,
                transition: 'background 0.1s',
              }}>
              <div style={{ fontSize: 13, color: '#E8E8E8', fontWeight: 500 }}>{p.nombre}</div>
              <div style={{ fontSize: 11, marginTop: 3, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {p.bodega && <span style={{ color: '#888' }}>{p.bodega}</span>}
                {p.varietal && <span style={{ color: '#555' }}>{p.varietal}</span>}
                <span style={{ color: stockColor, fontWeight: 600 }}>
                  {p.stock <= 0 ? 'Sin stock' : stockBajo ? `Stock bajo: ${p.stock}` : `Stock: ${p.stock}`}
                </span>
                <span style={{ color: '#888', marginLeft: 'auto' }}>${precio.toLocaleString('es-AR')}</span>
              </div>
            </div>
          )
        })
      }
    </div>
  ) : null

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          className="vinp"
          style={{ ...INP, fontSize: 12, padding: '5px 8px', paddingRight: productoId ? 28 : 8 }}
          value={open ? query : display}
          placeholder="Buscar producto..."
          onFocus={openDropdown}
          onChange={e => { if (!open) openDropdown(); setQuery(e.target.value); setHi(0) }}
          onKeyDown={handleKey}
          autoComplete="off"
        />
        {productoId && !open && (
          <button onMouseDown={e => { e.preventDefault(); onSelect(null) }}
            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '2px 3px' }}>×</button>
        )}
      </div>
      {typeof document !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
    </div>
  )
}

// ─── ClienteSearch ────────────────────────────────────────────────────────────
function ClienteSearch({ clientes, clienteId, clienteNombre, onSelect }: {
  clientes: Cliente[]
  clienteId: string
  clienteNombre: string
  onSelect: (c: Cliente | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = clientes.filter(c => {
    if (!query) return true
    const name = (c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()).toLowerCase()
    return name.includes(query.toLowerCase()) || (c.cuit || '').includes(query)
  }).slice(0, 30)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          className="vinp"
          style={{ ...INP, paddingRight: clienteId ? 28 : 8 }}
          value={open ? query : (clienteId ? clienteNombre : '')}
          placeholder="Consumidor Final"
          onFocus={() => { setOpen(true); setQuery('') }}
          onChange={e => setQuery(e.target.value)}
        />
        {clienteId && !open && (
          <button
            onMouseDown={e => { e.preventDefault(); onSelect(null) }}
            title="Limpiar"
            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}
          >×</button>
        )}
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.7)', maxHeight: 300, overflowY: 'auto' }}>
          <div className="cliente-opt" onMouseDown={() => { onSelect(null); setOpen(false); setQuery('') }}
            style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>Consumidor Final</div>
          </div>
          {filtered.length === 0 && query
            ? <div style={{ padding: '16px 14px', fontSize: 12, color: C.dim, textAlign: 'center' }}>Sin resultados</div>
            : filtered.map(c => {
              const name = c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()
              const esMay = c.tipo === 'mayorista' || c.tipo === 'revendedor'
              return (
                <div key={c.id} className="cliente-opt"
                  onMouseDown={() => { onSelect(c); setOpen(false); setQuery('') }}
                  style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: `1px solid rgba(42,42,42,0.5)` }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{name}</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 2, display: 'flex', gap: 12 }}>
                    {c.cuit && <span>CUIT: {c.cuit}</span>}
                    {c.tipo && <span style={{ color: esMay ? C.amber : C.dim, fontWeight: esMay ? 600 : 400 }}>{c.tipo}</span>}
                    {c.telefono && <span>{c.telefono}</span>}
                  </div>
                </div>
              )
            })
          }
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function VentasPage() {
  const [empresa, setEmpresa] = useState<'aroma' | 'lavid'>('aroma')
  const [tab, setTab] = useState<'comprobantes' | 'pedidos'>('comprobantes')
  const [ventas, setVentas] = useState<Venta[]>([])
  const [pedidos, setPedidos] = useState<PedidoRecord[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vendedores, setVendedores] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)

  // ── Venta modal state
  const [modal, setModal] = useState(false)
  const [tipo, setTipo] = useState<'presupuesto' | 'remito'>('presupuesto')
  const [editVentaId, setEditVentaId] = useState<string | null>(null)
  const [clienteId, setClienteId] = useState('')
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final')
  const [clienteData, setClienteData] = useState<Cliente | null>(null)
  const [clienteTipo, setClienteTipo] = useState('')
  const [vendedorNombre, setVendedorNombre] = useState('')
  const [items, setItems] = useState<ItemForm[]>([{ ...ITEM_EMPTY }])
  const [descuentoGlobal, setDescuentoGlobal] = useState(0)
  const [notas, setNotas] = useState('')
  const [condVenta, setCondVenta] = useState('Contado')
  const [estadoPago, setEstadoPago] = useState('pagado')
  const [aplicarMayorista, setAplicarMayorista] = useState(false)
  const [ventaParaImprimir, setVentaParaImprimir] = useState<Venta | null>(null)

  // ── Filtros comprobantes
  const [busquedaVentas, setBusquedaVentas] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('')

  // ── Pedido modal state
  const [pedidoModal, setPedidoModal] = useState(false)
  const [pClienteId, setPClienteId] = useState('')
  const [pClienteNombre, setPClienteNombre] = useState('Consumidor Final')
  const [pClienteData, setPClienteData] = useState<Cliente | null>(null)
  const [pClienteTipo, setPClienteTipo] = useState('')
  const [pVendedor, setPVendedor] = useState('')
  const [pItems, setPItems] = useState<PedidoItem[]>([{ ...PEDIDO_ITEM_EMPTY }])
  const [pNotas, setPNotas] = useState('')
  const [pFecha, setPFecha] = useState('')
  const [pStock, setPStock] = useState<StockStatus>({})
  const [pStockChecked, setPStockChecked] = useState(false)
  const [detallePedido, setDetallePedido] = useState<PedidoRecord | null>(null)

  const [toast, setToast] = useState('')

  useEffect(() => {
    const e = (localStorage.getItem('empresa') || 'aroma') as 'aroma' | 'lavid'
    setEmpresa(e); cargarTodo(e)
  }, [])

  async function cargarTodo(emp: string) {
    setLoading(true)
    try {
      const [vRes, pRes, cRes, vendRes, pedRes] = await Promise.all([
        fetch(`/api/ventas?empresa=${emp}`),
        fetch(`/api/productos?empresa=${emp}`),
        fetch(`/api/clientes?empresa=${emp}`),
        fetch(`/api/vendedores?empresa=${emp}`),
        fetch(`/api/pedidos?empresa=${emp}`),
      ])
      const [vData, pData, cData, vendData, pedData] = await Promise.all([
        vRes.json().catch(() => []),
        pRes.json().catch(() => []),
        cRes.json().catch(() => []),
        vendRes.json().catch(() => []),
        pedRes.json().catch(() => []),
      ])
      setVentas(Array.isArray(vData) ? vData : [])
      setProductos(Array.isArray(pData) ? pData : [])
      setClientes(Array.isArray(cData) ? cData : [])
      const vendRaw: { id: string; nombre: string }[] = Array.isArray(vendData) ? vendData : []
      setVendedores(vendRaw.filter((v, i, arr) => arr.findIndex(x => x.nombre === v.nombre) === i))
      setPedidos(Array.isArray(pedData) ? pedData : [])
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // ── Venta helpers
  function calcSub(item: ItemForm) {
    const base = item.cantidad * item.precio_unitario
    return base - base * ((item.descuento || 0) / 100)
  }
  function calcTotal() {
    const sub = items.reduce((a, i) => a + calcSub(i), 0)
    return sub - sub * (descuentoGlobal / 100)
  }

  function selCliente(c: Cliente | null) {
    if (!c) { setClienteId(''); setClienteNombre('Consumidor Final'); setClienteData(null); setClienteTipo(''); setAplicarMayorista(false); return }
    setClienteId(c.id!); setClienteNombre(c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()); setClienteData(c); setClienteTipo(c.tipo)
    setAplicarMayorista(c.tipo === 'mayorista' || c.tipo === 'revendedor')
  }

  function toggleAplicarMayorista(val: boolean) {
    setAplicarMayorista(val)
    const ni = items.map(item => {
      if (!item.producto_id) return item
      const prod = productos.find(p => p.id === item.producto_id)
      if (!prod) return item
      const precio = val && prod.precio_mayorista ? prod.precio_mayorista : prod.precio_venta
      const updated = { ...item, precio_unitario: precio }
      return { ...updated, subtotal: calcSub(updated) }
    })
    setItems(ni)
  }

  function selProducto(idx: number, prod: Producto | null) {
    const ni = [...items]
    if (!prod) { ni[idx] = { ...ITEM_EMPTY }; setItems(ni); return }
    const esMay = aplicarMayorista && (clienteTipo === 'mayorista' || clienteTipo === 'revendedor')
    const precio = esMay && prod.precio_mayorista ? prod.precio_mayorista : prod.precio_venta
    ni[idx] = { ...ni[idx], producto_id: prod.id!, nombre: `${prod.nombre}${prod.bodega ? ' - ' + prod.bodega : ''}`, precio_unitario: precio }
    ni[idx].subtotal = calcSub(ni[idx])
    // Auto-agregar línea vacía si era la última
    if (idx === ni.length - 1) ni.push({ ...ITEM_EMPTY })
    setItems(ni)
  }

  function updateItem(idx: number, field: string, value: number | string) {
    const ni = [...items]
    ;(ni[idx] as unknown as Record<string, number | string>)[field] = value
    ni[idx].subtotal = calcSub(ni[idx])
    setItems(ni)
  }

  async function guardar() {
    if (items.every(i => !i.nombre)) { showToast('Agregá al menos un producto'); return }
    const subtotal = items.reduce((a, i) => a + calcSub(i), 0)
    const ventaData = {
      empresa, tipo, vendedor_nombre: vendedorNombre || null,
      cliente_id: clienteId || null, cliente_nombre: clienteNombre,
      items: items.filter(i => i.nombre).map(i => ({
        producto_id: i.producto_id || null, nombre: i.nombre,
        cantidad: i.cantidad, precio_unitario: i.precio_unitario,
        descuento: i.descuento, subtotal: calcSub(i),
      })),
      subtotal, descuento: descuentoGlobal, total: calcTotal(),
      estado: 'emitido', estado_pago: estadoPago, notas, condicion_venta: condVenta,
      descontarStock: (tipo === 'remito' || tipo === 'presupuesto') && !editVentaId,
    }
    const res = editVentaId
      ? await fetch('/api/ventas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editVentaId, ...ventaData }) })
      : await fetch('/api/ventas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ventaData) })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false)
    await cargarTodo(empresa)
    showToast(editVentaId ? 'Comprobante actualizado' : `${tipo === 'presupuesto' ? 'Presupuesto' : 'Remito'} ${data.numero} generado`)
    if (!editVentaId) setTimeout(() => { setVentaParaImprimir(data); setTimeout(imprimirDoc, 400) }, 200)
  }

  async function eliminarVenta(id: string) {
    if (!confirm('¿Eliminar este comprobante?')) return
    await fetch(`/api/ventas?id=${id}`, { method: 'DELETE' })
    cargarTodo(empresa); showToast('Comprobante eliminado')
  }

  function editarVenta(v: Venta) {
    setEditVentaId(v.id!); setTipo(v.tipo as 'presupuesto' | 'remito')
    setClienteId(v.cliente_id || ''); setClienteNombre(v.cliente_nombre)
    const c = clientes.find(c => c.id === v.cliente_id)
    setClienteData(c || null); setClienteTipo(c?.tipo || '')
    setVendedorNombre((v as Venta & { vendedor_nombre?: string }).vendedor_nombre || '')
    const vi = (v.items as (VentaItem & { descuento?: number })[]).map(i => ({
      producto_id: i.producto_id || '', nombre: i.nombre, cantidad: i.cantidad,
      precio_unitario: i.precio_unitario, descuento: i.descuento || 0, subtotal: i.subtotal,
    }))
    setItems(vi)
    setDescuentoGlobal(v.descuento); setNotas(v.notas || '')
    setCondVenta((v as unknown as Record<string, string>).condicion_venta || 'Contado')
    setEstadoPago(v.estado_pago || 'pagado'); setModal(true)
  }

  function duplicarVenta(v: Venta) {
    setEditVentaId(null); setTipo(v.tipo as 'presupuesto' | 'remito')
    setClienteId(v.cliente_id || ''); setClienteNombre(v.cliente_nombre)
    const c = clientes.find(cl => cl.id === v.cliente_id)
    setClienteData(c || null); setClienteTipo(c?.tipo || '')
    setAplicarMayorista(c?.tipo === 'mayorista' || c?.tipo === 'revendedor')
    setVendedorNombre((v as Venta & { vendedor_nombre?: string }).vendedor_nombre || '')
    const vi = (v.items as (VentaItem & { descuento?: number })[]).map(i => ({
      producto_id: i.producto_id || '', nombre: i.nombre, cantidad: i.cantidad,
      precio_unitario: i.precio_unitario, descuento: i.descuento || 0, subtotal: i.subtotal,
    }))
    setItems(vi); setDescuentoGlobal(v.descuento); setNotas(v.notas || '')
    setCondVenta((v as unknown as Record<string, string>).condicion_venta || 'Contado')
    setEstadoPago(v.estado_pago || 'pagado'); setModal(true)
  }

  function abrirNuevo(t: 'presupuesto' | 'remito') {
    setEditVentaId(null); setTipo(t)
    setClienteId(''); setClienteNombre('Consumidor Final'); setClienteData(null); setClienteTipo('')
    setVendedorNombre(''); setItems([{ ...ITEM_EMPTY }])
    setDescuentoGlobal(0); setNotas(''); setCondVenta('Contado')
    setEstadoPago(empresa === 'lavid' && t === 'presupuesto' ? 'cuenta_corriente' : 'pagado')
    setAplicarMayorista(false)
    setModal(true)
  }

  function whatsappVenta(v: Venta) {
    const vitems = v.items as VentaItem[]
    const fecha = new Date(v.created_at!).toLocaleDateString('es-AR')
    let texto = `*${v.tipo === 'presupuesto' ? 'PRESUPUESTO' : 'REMITO'} ${v.numero}*\n`
    texto += `${emp.nombre} — ${fecha}\n\n`
    texto += `*Cliente:* ${v.cliente_nombre}\n\n`
    texto += `*Detalle:*\n`
    vitems.forEach(i => {
      const sub = i.subtotal || (i.cantidad * i.precio_unitario)
      texto += `• ${i.cantidad}x ${i.nombre} — $${sub.toLocaleString('es-AR')}\n`
    })
    if (v.descuento > 0) texto += `_Descuento global: ${v.descuento}%_\n`
    texto += `\n*TOTAL: $${v.total.toLocaleString('es-AR')}*`
    const cliente = clientes.find(c => c.id === v.cliente_id)
    const tel = cliente?.telefono?.replace(/\D/g, '')
    const url = tel
      ? `https://wa.me/549${tel}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }

  function imprimirDoc() {
    const el = document.getElementById('print-area')
    if (!el) return
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    w.document.write(`<html><head><title>Comprobante</title><style>body{font-family:Arial,sans-serif;font-size:11px;margin:24px}table{width:100%;border-collapse:collapse}th,td{padding:5px 8px}@media print{body{margin:12px}}</style></head><body>${el.innerHTML}</body></html>`)
    w.document.close(); w.focus(); setTimeout(() => w.print(), 500)
  }

  // ── Pedido helpers
  function selClientePedido(c: Cliente | null) {
    if (!c) { setPClienteId(''); setPClienteNombre('Consumidor Final'); setPClienteData(null); setPClienteTipo(''); return }
    setPClienteId(c.id!); setPClienteNombre(c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()); setPClienteData(c); setPClienteTipo(c.tipo)
  }

  function selProductoPedido(idx: number, prod: Producto | null) {
    const ni = [...pItems]
    if (!prod) { ni[idx] = { ...PEDIDO_ITEM_EMPTY }; setPItems(ni); return }
    ni[idx] = { ...ni[idx], producto_id: prod.id!, nombre: `${prod.nombre}${prod.bodega ? ' - ' + prod.bodega : ''}`, precio_unitario: prod.precio_venta }
    // Auto-agregar línea vacía si era la última
    if (idx === ni.length - 1) ni.push({ ...PEDIDO_ITEM_EMPTY })
    setPItems(ni); setPStockChecked(false)
  }

  async function verificarStock() {
    const res = await fetch('/api/pedidos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa, cliente_id: pClienteId || null, cliente_nombre: pClienteNombre,
        vendedor_nombre: pVendedor || null, items: pItems.filter(i => i.producto_id),
        notas: pNotas, fecha_entrega: pFecha || null, estado: 'pendiente',
        verificarStock: true, _dryRun: true,
      }),
    })
    const data = await res.json()
    if (data.stockStatus) { setPStock(data.stockStatus); setPStockChecked(true) }
  }

  async function guardarPedido() {
    if (pItems.every(i => !i.producto_id)) { showToast('Agregá al menos un producto'); return }
    const res = await fetch('/api/pedidos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa, cliente_id: pClienteId || null, cliente_nombre: pClienteNombre,
        vendedor_nombre: pVendedor || null, items: pItems.filter(i => i.producto_id),
        notas: pNotas, fecha_entrega: pFecha || null, estado: 'pendiente',
      }),
    })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setPedidoModal(false); cargarTodo(empresa); showToast(`Pedido ${data.numero} creado`)
  }

  async function cambiarEstadoPedido(id: string, estado: string) {
    await fetch('/api/pedidos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, estado }) })
    cargarTodo(empresa); showToast(`Pedido ${estado}`)
  }

  async function eliminarPedido(id: string) {
    if (!confirm('¿Cancelar este pedido?')) return
    await fetch(`/api/pedidos?id=${id}`, { method: 'DELETE' })
    cargarTodo(empresa); showToast('Pedido cancelado')
  }

  function abrirNuevoPedido() {
    setPClienteId(''); setPClienteNombre('Consumidor Final'); setPClienteData(null); setPClienteTipo('')
    setPVendedor(''); setPItems([{ ...PEDIDO_ITEM_EMPTY }])
    setPNotas(''); setPFecha(''); setPStock({}); setPStockChecked(false)
    setPedidoModal(true)
  }

  // ── Derived
  const emp = EMPRESAS_DATA[empresa]
  const totalRemitos = ventas.filter(v => v.tipo === 'remito' && v.estado !== 'cancelado').reduce((a, v) => a + v.total, 0)
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
  const pedidosPend = pedidos.filter(p => p.estado === 'pendiente').length

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '24px', color: C.text }}>
      <style>{`
        .venta-row:hover { background: rgba(255,255,255,0.03) !important; }
        .venta-row td, .pedido-row td { border-bottom: 1px solid ${C.border}; }
        .pedido-row:hover { background: rgba(255,255,255,0.03) !important; }
        .vbtn:hover { opacity: 0.8; } .vbtn:active { opacity: 0.6; }
        .vinp:focus { border-color: ${C.accent} !important; }
        .vinp::placeholder { color: ${C.dim}; }
        select.vinp option { background: #1a1a1a; color: ${C.text}; }
        .item-row td { border-bottom: 1px solid ${C.border}; }
        .cliente-opt:hover { background: rgba(255,255,255,0.05) !important; }
      `}</style>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: C.surface, borderRadius: 10, padding: 4, border: `1px solid ${C.border}`, width: 'fit-content' }}>
        {(['comprobantes', 'pedidos'] as const).map(t => (
          <button key={t} className="vbtn" onClick={() => setTab(t)}
            style={{ ...btn(tab === t ? 'accent' : 'ghost', { padding: '7px 20px', fontSize: 13, borderRadius: 7 }), border: 'none' }}>
            {t === 'comprobantes' ? `Comprobantes (${ventas.length})` : `Pedidos (${pedidosPend} pend.)`}
          </button>
        ))}
      </div>

      {/* ══ COMPROBANTES ══ */}
      {tab === 'comprobantes' && (
        <>
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

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
              <input className="vinp" style={INP} placeholder="Número, cliente..." value={busquedaVentas} onChange={e => setBusquedaVentas(e.target.value)} />
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
              <input type="date" className="vinp" style={INP} value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="date" className="vinp" style={{ ...INP, flex: 1 }} value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} />
                {hayFiltros && (
                  <button className="vbtn" style={{ ...btn('ghost', { padding: '4px 8px', fontSize: 16 }), color: C.dim, flexShrink: 0 }}
                    onClick={() => { setFiltroDesde(''); setFiltroHasta(''); setFiltroTipo(''); setFiltroEstadoPago(''); setFiltroVendedor(''); setBusquedaVentas('') }}>×</button>
                )}
              </div>
            </div>
            {ventasFiltradas.length !== ventas.length && (
              <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>Mostrando {ventasFiltradas.length} de {ventas.length}</div>
            )}
          </div>

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
                {loading
                  ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px 0', color: C.dim }}>Cargando...</td></tr>
                  : ventasFiltradas.length === 0
                    ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px 0', color: C.dim }}>No hay comprobantes</td></tr>
                    : ventasFiltradas.map(v => (
                      <tr key={v.id} className="venta-row" style={{ background: 'transparent' }}>
                        <td style={{ padding: '11px 14px', fontWeight: 600, color: C.text, fontFamily: 'monospace', fontSize: 12 }}>{v.numero}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: v.tipo === 'presupuesto' ? 'rgba(139,26,42,0.18)' : 'rgba(76,175,125,0.15)', color: v.tipo === 'presupuesto' ? '#D08090' : C.green, border: `1px solid ${v.tipo === 'presupuesto' ? 'rgba(139,26,42,0.4)' : 'rgba(76,175,125,0.3)'}` }}>
                            {v.tipo === 'presupuesto' ? 'Presupuesto' : 'Remito'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', color: C.text }}>{v.cliente_nombre}</td>
                        <td style={{ padding: '11px 14px', color: C.muted, fontSize: 12 }}>{(v as Venta & { vendedor_nombre?: string }).vendedor_nombre || '—'}</td>
                        <td style={{ padding: '11px 14px', color: C.muted, fontSize: 12 }}>{new Date(v.created_at!).toLocaleDateString('es-AR')}</td>
                        <td style={{ padding: '11px 14px' }}>
                          {v.estado_pago === 'pagado' && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(76,175,125,0.15)', color: C.green, border: '1px solid rgba(76,175,125,0.3)' }}>Pagado</span>}
                          {v.estado_pago === 'pendiente' && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(212,130,10,0.15)', color: C.amber, border: '1px solid rgba(212,130,10,0.3)' }}>Pendiente</span>}
                          {v.estado_pago === 'cuenta_corriente' && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(100,140,220,0.15)', color: '#7AADFF', border: '1px solid rgba(100,140,220,0.3)' }}>Cta. Cte.</span>}
                          {!v.estado_pago && <span style={{ color: C.dim }}>—</span>}
                        </td>
                        <td style={{ padding: '11px 14px', fontWeight: 700, color: C.text }}>${v.total.toLocaleString('es-AR')}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="vbtn" style={btn('default', { padding: '4px 8px', fontSize: 11 })} onClick={() => { setVentaParaImprimir(v); setTimeout(imprimirDoc, 400) }}>Imprimir</button>
                            <button className="vbtn" style={btn('green', { padding: '4px 8px', fontSize: 11, color: C.green })} onClick={() => whatsappVenta(v)}>WA</button>
                            <button className="vbtn" style={btn('default', { padding: '4px 8px', fontSize: 11 })} onClick={() => editarVenta(v)}>Editar</button>
                            <button className="vbtn" style={btn('default', { padding: '4px 8px', fontSize: 11, color: C.amber })} onClick={() => duplicarVenta(v)}>Dupl.</button>
                            <button className="vbtn" style={btn('danger', { padding: '4px 8px', fontSize: 11 })} onClick={() => eliminarVenta(v.id!)}>Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══ PEDIDOS ══ */}
      {tab === 'pedidos' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Pendientes', value: String(pedidos.filter(p => p.estado === 'pendiente').length), color: C.amber },
              { label: 'Entregados', value: String(pedidos.filter(p => p.estado === 'entregado').length), color: C.green },
              { label: 'Total pedidos', value: String(pedidos.length), color: C.text },
            ].map(s => (
              <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Pedidos</h1>
              <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{pedidos.length} pedidos</div>
            </div>
            <button className="vbtn" style={btn('accent')} onClick={abrirNuevoPedido}>+ Nuevo pedido</button>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
                  {['Número', 'Cliente', 'Vendedor', 'Items', 'Entrega', 'Estado', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: C.dim }}>Cargando...</td></tr>
                  : pedidos.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: C.dim }}>No hay pedidos</td></tr>
                    : pedidos.map(p => (
                      <tr key={p.id} className="pedido-row" style={{ background: 'transparent' }}>
                        <td style={{ padding: '11px 14px', fontWeight: 600, color: C.text, fontFamily: 'monospace', fontSize: 12 }}>{p.numero}</td>
                        <td style={{ padding: '11px 14px', color: C.text }}>{p.cliente_nombre}</td>
                        <td style={{ padding: '11px 14px', color: C.muted, fontSize: 12 }}>{p.vendedor_nombre || '—'}</td>
                        <td style={{ padding: '11px 14px', color: C.muted, fontSize: 12 }}>{(p.items as PedidoItem[]).length} items</td>
                        <td style={{ padding: '11px 14px', color: C.muted, fontSize: 12 }}>{p.fecha_entrega ? new Date(p.fecha_entrega + 'T12:00:00').toLocaleDateString('es-AR') : '—'}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: p.estado === 'pendiente' ? 'rgba(212,130,10,0.15)' : p.estado === 'entregado' ? 'rgba(76,175,125,0.15)' : 'rgba(85,85,85,0.15)', color: p.estado === 'pendiente' ? C.amber : p.estado === 'entregado' ? C.green : C.dim, border: `1px solid ${p.estado === 'pendiente' ? 'rgba(212,130,10,0.3)' : p.estado === 'entregado' ? 'rgba(76,175,125,0.3)' : 'rgba(85,85,85,0.3)'}` }}>
                            {p.estado}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="vbtn" style={btn('default', { padding: '4px 8px', fontSize: 11 })} onClick={() => setDetallePedido(p)}>Ver</button>
                            {p.estado === 'pendiente' && <button className="vbtn" style={btn('green', { padding: '4px 8px', fontSize: 11 })} onClick={() => cambiarEstadoPedido(p.id, 'entregado')}>Entregar</button>}
                            <button className="vbtn" style={btn('danger', { padding: '4px 8px', fontSize: 11 })} onClick={() => eliminarPedido(p.id)}>Cancelar</button>
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══ MODAL VENTA ══ */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, width: '100%', maxWidth: 760, margin: '16px auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>{editVentaId ? 'Editar' : 'Nuevo'} {tipo === 'presupuesto' ? 'presupuesto' : 'remito'}</h2>
                {tipo === 'remito' && !editVentaId && <div style={{ fontSize: 11, color: C.green, marginTop: 3 }}>Descuenta stock automáticamente al guardar</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', background: C.surface, borderRadius: 7, padding: 3, border: `1px solid ${C.border}` }}>
                  {(['presupuesto', 'remito'] as const).map(t => (
                    <button key={t} className="vbtn" onClick={() => setTipo(t)}
                      style={{ ...btn(tipo === t ? 'accent' : 'ghost', { padding: '4px 12px', fontSize: 12, borderRadius: 5 }), border: 'none' }}>
                      {t === 'presupuesto' ? 'Presupuesto' : 'Remito'}
                    </button>
                  ))}
                </div>
                <button className="vbtn" style={{ ...btn('ghost', { padding: '4px 8px', fontSize: 18, lineHeight: 1 }), color: C.dim }} onClick={() => setModal(false)}>×</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Cliente</div>
                <ClienteSearch clientes={clientes} clienteId={clienteId} clienteNombre={clienteNombre} onSelect={selCliente} />
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

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Estado de pago</div>
              <select className="vinp" style={{ ...INP, maxWidth: 220 }} value={estadoPago} onChange={e => setEstadoPago(e.target.value)}>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
                <option value="cuenta_corriente">Cuenta corriente</option>
              </select>
            </div>

            {clienteData && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: C.muted, alignItems: 'center' }}>
                {clienteData.cuit && <span>CUIT: {clienteData.cuit}</span>}
                {clienteData.direccion && <span>{clienteData.direccion}</span>}
                {clienteData.telefono && <span>{clienteData.telefono}</span>}
                {(clienteTipo === 'mayorista' || clienteTipo === 'revendedor') && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', marginLeft: 'auto' }}>
                    <input type="checkbox" checked={aplicarMayorista} onChange={e => toggleAplicarMayorista(e.target.checked)} style={{ accentColor: C.amber, width: 14, height: 14 }} />
                    <span style={{ color: aplicarMayorista ? C.amber : C.dim, fontWeight: 600 }}>Precio mayorista</span>
                  </label>
                )}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Productos</div>
                <button className="vbtn" style={{ ...btn('ghost', { padding: '3px 8px', fontSize: 12 }), color: C.accent }}
                  onClick={() => setItems([...items, { ...ITEM_EMPTY }])}>+ agregar línea</button>
              </div>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.surface }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#111' }}>
                      <th style={{ textAlign: 'left', padding: '8px 10px', color: C.dim, fontWeight: 500, width: '42%' }}>Producto</th>
                      <th style={{ textAlign: 'center', padding: '8px 6px', color: C.dim, fontWeight: 500, width: 56 }}>Cant.</th>
                      <th style={{ textAlign: 'right', padding: '8px 6px', color: C.dim, fontWeight: 500 }}>P.Unit.</th>
                      <th style={{ textAlign: 'center', padding: '8px 6px', color: C.dim, fontWeight: 500, width: 52 }}>Dto%</th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', color: C.dim, fontWeight: 500 }}>Total</th>
                      <th style={{ width: 24 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="item-row" style={{ background: 'transparent' }}>
                        <td style={{ padding: '6px 8px' }}>
                          <ProductoSearch
                            productos={productos}
                            productoId={item.producto_id}
                            clienteTipo={clienteTipo}
                            onSelect={prod => selProducto(idx, prod)}
                          />
                        </td>
                        <td style={{ padding: '6px 4px' }}>
                          <input type="number" min="1" className="vinp" style={{ ...INP, fontSize: 12, padding: '4px 6px', textAlign: 'center' }} value={item.cantidad || ''} onChange={e => updateItem(idx, 'cantidad', parseInt(e.target.value) || 1)} />
                        </td>
                        <td style={{ padding: '6px 4px' }}>
                          <input type="number" min="0" className="vinp" style={{ ...INP, fontSize: 12, padding: '4px 6px', textAlign: 'right' }} value={item.precio_unitario || ''} onChange={e => updateItem(idx, 'precio_unitario', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td style={{ padding: '6px 4px' }}>
                          <input type="number" min="0" max="100" className="vinp" style={{ ...INP, fontSize: 12, padding: '4px 6px', textAlign: 'center' }} value={item.descuento || ''} onChange={e => updateItem(idx, 'descuento', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>
                          ${calcSub(item).toLocaleString('es-AR')}
                        </td>
                        <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                          {items.length > 1 && (
                            <button className="vbtn" style={{ background: 'transparent', border: 'none', color: C.dim, fontSize: 16, cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}
                              onClick={() => setItems(items.filter((_, i) => i !== idx))}>×</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Notas</div>
                <textarea className="vinp" style={{ ...INP, height: 64, resize: 'none', fontSize: 12 }} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones..." />
              </div>
              <div style={{ width: 200 }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Descuento global (%)</div>
                <input type="number" min="0" max="100" className="vinp" style={INP} value={descuentoGlobal} onChange={e => setDescuentoGlobal(parseFloat(e.target.value) || 0)} />
                <div style={{ marginTop: 10, textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: C.muted }}>Subtotal: ${items.reduce((a, i) => a + calcSub(i), 0).toLocaleString('es-AR')}</div>
                  {descuentoGlobal > 0 && <div style={{ fontSize: 12, color: C.red }}>Dto: -{descuentoGlobal}%</div>}
                  <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginTop: 4 }}>TOTAL: ${calcTotal().toLocaleString('es-AR')}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <button className="vbtn" style={btn('default')} onClick={() => setModal(false)}>Cancelar</button>
              <button className="vbtn" style={btn('accent', { padding: '7px 18px', fontSize: 13, fontWeight: 600 })} onClick={guardar}>
                {editVentaId ? 'Guardar cambios' : `Generar ${tipo === 'presupuesto' ? 'presupuesto' : 'remito'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL PEDIDO ══ */}
      {pedidoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}
          onClick={e => e.target === e.currentTarget && setPedidoModal(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, width: '100%', maxWidth: 680, margin: '16px auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Nuevo pedido</h2>
              <button className="vbtn" style={{ ...btn('ghost', { padding: '4px 8px', fontSize: 18, lineHeight: 1 }), color: C.dim }} onClick={() => setPedidoModal(false)}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Cliente</div>
                <ClienteSearch clientes={clientes} clienteId={pClienteId} clienteNombre={pClienteNombre} onSelect={selClientePedido} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Vendedor</div>
                <select className="vinp" style={INP} value={pVendedor} onChange={e => setPVendedor(e.target.value)}>
                  <option value="">— Sin asignar —</option>
                  {vendedores.map(v => <option key={v.id} value={v.nombre}>{v.nombre}</option>)}
                </select>
              </div>
            </div>

            {pClienteData && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: C.muted, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {pClienteData.cuit && <span>CUIT: {pClienteData.cuit}</span>}
                {pClienteData.telefono && <span>{pClienteData.telefono}</span>}
                {(pClienteTipo === 'mayorista' || pClienteTipo === 'revendedor') && <span style={{ color: C.amber, fontWeight: 600 }}>Mayorista</span>}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Productos</div>
                <button className="vbtn" style={{ ...btn('ghost', { padding: '3px 8px', fontSize: 12 }), color: C.accent }}
                  onClick={() => setPItems([...pItems, { ...PEDIDO_ITEM_EMPTY }])}>+ agregar línea</button>
              </div>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.surface }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#111' }}>
                      <th style={{ textAlign: 'left', padding: '8px 10px', color: C.dim, fontWeight: 500 }}>Producto</th>
                      <th style={{ textAlign: 'center', padding: '8px 6px', color: C.dim, fontWeight: 500, width: 80 }}>Cant.</th>
                      <th style={{ width: 28 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pItems.map((item, idx) => {
                      const st = pStock[item.producto_id]
                      return (
                        <tr key={idx} style={{ background: st ? (st.ok ? 'rgba(76,175,125,0.05)' : 'rgba(224,85,85,0.05)') : 'transparent', borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '6px 8px' }}>
                            <ProductoSearch
                              productos={productos}
                              productoId={item.producto_id}
                              clienteTipo={pClienteTipo}
                              onSelect={prod => selProductoPedido(idx, prod)}
                            />
                            {st && (
                              <div style={{ fontSize: 11, marginTop: 4, fontWeight: 600, color: st.ok ? C.green : C.red }}>
                                {st.ok ? `✓ ${st.disponible} disponibles` : `✗ Solo ${st.disponible} disponibles, pedís ${st.pedido}`}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                            <input type="number" min="1" className="vinp" style={{ ...INP, fontSize: 12, padding: '4px 6px', textAlign: 'center' }}
                              value={item.cantidad} onChange={e => { const ni = [...pItems]; ni[idx] = { ...ni[idx], cantidad: parseInt(e.target.value) || 1 }; setPItems(ni); setPStockChecked(false) }} />
                          </td>
                          <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                            {pItems.length > 1 && (
                              <button className="vbtn" style={{ background: 'transparent', border: 'none', color: C.dim, fontSize: 16, cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}
                                onClick={() => { setPItems(pItems.filter((_, i) => i !== idx)); setPStockChecked(false) }}>×</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Fecha de entrega estimada</div>
                <input type="date" className="vinp" style={INP} value={pFecha} onChange={e => setPFecha(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4, fontWeight: 500 }}>Notas</div>
                <input className="vinp" style={INP} value={pNotas} onChange={e => setPNotas(e.target.value)} placeholder="Observaciones..." />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <button className="vbtn" style={btn(pStockChecked ? 'green' : 'default', { padding: '6px 14px' })} onClick={verificarStock}>
                {pStockChecked ? '✓ Stock verificado' : 'Verificar stock'}
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="vbtn" style={btn('default')} onClick={() => setPedidoModal(false)}>Cancelar</button>
                <button className="vbtn" style={btn('accent', { padding: '7px 18px', fontSize: 13, fontWeight: 600 })} onClick={guardarPedido}>Guardar pedido</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL DETALLE PEDIDO ══ */}
      {detallePedido && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setDetallePedido(null)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Pedido {detallePedido.numero}</h2>
              <button className="vbtn" style={{ ...btn('ghost'), color: C.dim, fontSize: 18 }} onClick={() => setDetallePedido(null)}>×</button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div><strong style={{ color: C.text }}>Cliente:</strong> {detallePedido.cliente_nombre}</div>
              {detallePedido.vendedor_nombre && <div><strong style={{ color: C.text }}>Vendedor:</strong> {detallePedido.vendedor_nombre}</div>}
              {detallePedido.fecha_entrega && <div><strong style={{ color: C.text }}>Entrega:</strong> {new Date(detallePedido.fecha_entrega + 'T12:00:00').toLocaleDateString('es-AR')}</div>}
              {detallePedido.notas && <div><strong style={{ color: C.text }}>Notas:</strong> {detallePedido.notas}</div>}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', fontSize: 11, color: C.dim }}>Producto</th>
                  <th style={{ textAlign: 'center', padding: '6px 0', fontSize: 11, color: C.dim, width: 60 }}>Cant.</th>
                </tr>
              </thead>
              <tbody>
                {(detallePedido.items as PedidoItem[]).map((item, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '8px 0', color: C.text }}>{item.nombre}</td>
                    <td style={{ padding: '8px 0', textAlign: 'center', color: C.muted }}>{item.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="vbtn" style={btn('default')} onClick={() => setDetallePedido(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <div id="print-area" style={{ display: 'none' }}>
        {ventaParaImprimir && <PrintDoc venta={ventaParaImprimir} empresa={emp} />}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 100 }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function PrintDoc({ venta, empresa }: {
  venta: Venta
  empresa: { nombre: string; cuit: string; domicilio: string; telefono: string; logoPath: string }
}) {
  const items = venta.items as (VentaItem & { descuento?: number })[]
  const fecha = new Date(venta.created_at!).toLocaleDateString('es-AR')
  const condVenta = (venta as unknown as Record<string, unknown>).condicion_venta as string || 'Contado'
  const esCuentaCorriente = venta.estado_pago === 'cuenta_corriente'
  const esPendiente = venta.estado_pago === 'pendiente'
  const docLabel = venta.tipo === 'presupuesto' ? 'PRESUPUESTO' : 'REMITO'

  return (
    <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#000', maxWidth: '800px', margin: '0 auto' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #000' }}>
        <img src={empresa.logoPath} alt={empresa.nombre} style={{ height: '60px', objectFit: 'contain' }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '0.05em' }}>{docLabel}</div>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{venta.numero}</div>
          <div style={{ marginTop: '6px', fontSize: '10px', color: '#555' }}>Fecha: {fecha}</div>
        </div>
      </div>

      {/* Datos empresa */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{empresa.nombre}</div>
        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ paddingBottom: '2px' }}><strong>C.U.I.T.</strong> {empresa.cuit}&nbsp;&nbsp;&nbsp;<strong>Resp. Inscripto</strong></td>
              <td style={{ textAlign: 'right' }}><strong>Teléfono</strong>&nbsp;&nbsp;{empresa.telefono}</td>
            </tr>
            <tr>
              <td colSpan={2} style={{ paddingBottom: '2px' }}><strong>Domicilio</strong>&nbsp;&nbsp;{empresa.domicilio}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr style={{ borderColor: '#ccc', marginBottom: '10px' }} />

      {/* Datos cliente */}
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div><strong>Cliente:</strong>&nbsp;&nbsp;{venta.cliente_nombre}</div>
          <div style={{ marginTop: '3px' }}>
            <strong>Condición de venta:</strong>&nbsp;&nbsp;
            {esCuentaCorriente ? 'Cuenta Corriente' : esPendiente ? 'Pendiente de pago' : condVenta}
          </div>
          {venta.vendedor_nombre && (
            <div style={{ marginTop: '3px' }}><strong>Vendedor:</strong>&nbsp;&nbsp;{venta.vendedor_nombre}</div>
          )}
        </div>
        {esCuentaCorriente && (
          <div style={{ border: '2px solid #000', padding: '6px 14px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.04em' }}>
            QUEDA EN<br />CTA. CORRIENTE
          </div>
        )}
        {esPendiente && (
          <div style={{ border: '2px dashed #888', padding: '6px 14px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: '#555' }}>
            PAGO<br />PENDIENTE
          </div>
        )}
      </div>

      <hr style={{ borderColor: '#ccc', marginBottom: '10px' }} />

      {/* Tabla productos */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '11px' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #000', borderTop: '1.5px solid #000' }}>
            <th style={{ padding: '6px 8px', textAlign: 'center', width: '55px' }}>Cant.</th>
            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Descripción</th>
            <th style={{ padding: '6px 8px', textAlign: 'center', width: '55px' }}>Desc.%</th>
            <th style={{ padding: '6px 8px', textAlign: 'right', width: '110px' }}>P. Unitario</th>
            <th style={{ padding: '6px 8px', textAlign: 'right', width: '110px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '0.5px solid #eee' }}>
              <td style={{ padding: '5px 8px', textAlign: 'center' }}>{item.cantidad}</td>
              <td style={{ padding: '5px 8px' }}>{item.nombre}</td>
              <td style={{ padding: '5px 8px', textAlign: 'center' }}>{item.descuento ? `${item.descuento}%` : '—'}</td>
              <td style={{ padding: '5px 8px', textAlign: 'right' }}>{item.precio_unitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
              <td style={{ padding: '5px 8px', textAlign: 'right' }}>{item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <table style={{ fontSize: '11px', borderCollapse: 'collapse', minWidth: 220 }}>
          <tbody>
            {venta.descuento > 0 && (
              <tr>
                <td style={{ padding: '3px 10px', color: '#555' }}>Descuento global:</td>
                <td style={{ padding: '3px 10px', textAlign: 'right' }}>{venta.descuento}%</td>
              </tr>
            )}
            <tr style={{ borderTop: '1.5px solid #000' }}>
              <td style={{ padding: '5px 10px', fontWeight: 'bold', fontSize: '13px' }}>TOTAL:</td>
              <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                ${venta.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {venta.notas && (
        <div style={{ marginTop: '8px', padding: '8px', background: '#f9f9f9', border: '1px solid #eee', fontSize: '10px', color: '#555' }}>
          <strong>Notas:</strong> {venta.notas}
        </div>
      )}

      <div style={{ marginTop: '32px', paddingTop: '10px', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#999' }}>
        <span>{empresa.nombre} — {empresa.cuit}</span>
        <span>Emitido: {fecha}</span>
      </div>
    </div>
  )
}
