'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Producto, Cliente, Venta, VentaItem } from '@/types'
import BarcodeScanner from '@/components/BarcodeScanner'
import * as XLSX from 'xlsx'
import BarcodeNotFoundModal from '@/components/BarcodeNotFoundModal'
import { useBarcodeInput } from '@/hooks/useBarcodeInput'
import {
  connectPrinter, disconnectPrinter, initPrinter, printCanvas, testPrint, renderCava, feedNextLabel,
  type LabelPrinterPort, type LabelData,
} from '@/lib/labelPrinter'
import wooUrls from '@/data/wooUrls.json'

function _normStr(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}
function lookupWooUrl(nombre: string): string {
  const n = _normStr(nombre)
  if (!n) return ''
  const list = wooUrls as { title: string; url: string }[]
  return (
    list.find(w => _normStr(w.title) === n) ||
    list.find(w => _normStr(w.title).startsWith(n) || n.startsWith(_normStr(w.title))) ||
    list.find(w => _normStr(w.title).includes(n) || n.includes(_normStr(w.title)))
  )?.url || ''
}

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
  bg:      '#F5F1EC',
  surface: '#FFFFFF',
  card:    '#FFFFFF',
  border:  '#DDD0C0',
  border2: '#C8BAA8',
  accent:  '#800000',
  text:    '#1A1210',
  muted:   '#6B5D55',
  dim:     '#A89888',
  green:   '#2D7A4F',
  greenBg: 'rgba(45,122,79,0.08)',
  amber:   '#A07010',
  amberBg: 'rgba(160,112,16,0.07)',
  red:     '#C03030',
  redBg:   'rgba(192,48,48,0.08)',
  blue:    '#2B5EA0',
  blueBg:  'rgba(43,94,160,0.08)',
  dangerBg:     'rgba(192,48,48,0.08)',
  dangerBorder: 'rgba(192,48,48,0.35)',
}

const INP: React.CSSProperties = {
  background: '#FFFFFF', border: `1px solid #DDD0C0`, borderRadius: 6,
  color: '#1A1210', padding: '7px 10px', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.12s',
}

function btn(v: 'default' | 'accent' | 'ghost' | 'danger' | 'green' = 'default', ex: React.CSSProperties = {}): React.CSSProperties {
  const bases = {
    default: { background: '#FFFFFF', border: `1px solid #DDD0C0`, color: '#6B5D55' },
    accent:  { background: '#800000', border: `1px solid #800000`, color: '#FFFFFF' },
    ghost:   { background: 'transparent', border: '1px solid transparent', color: '#6B5D55' },
    danger:  { background: 'rgba(192,48,48,0.08)', border: `1px solid rgba(192,48,48,0.35)`, color: '#C03030' },
    green:   { background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.3)', color: '#2D7A4F' },
  }
  return { ...bases[v], borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s', ...ex }
}

function filtrarProductos(productos: Producto[], q: string) {
  if (!q) return productos.slice(0, 50)
  return productos.filter(p =>
    _normStr(`${p.nombre} ${p.bodega || ''} ${p.varietal || ''}`).includes(_normStr(q))
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
      zIndex: 9999, background: '#FFFFFF', border: '1px solid #C8BAA8',
      borderRadius: 8, boxShadow: '0 16px 40px rgba(26,18,16,0.18)',
      maxHeight: 320, overflowY: 'auto',
    }}>
      {filtered.length === 0
        ? <div style={{ padding: '16px 12px', fontSize: 12, color: '#A89888', textAlign: 'center' }}>
            {query ? `Sin resultados para "${query}"` : 'Escribí para buscar'}
          </div>
        : filtered.map((p, i) => {
          const precio = esMay && (p.precio_mayorista ?? 0) > 0 ? p.precio_mayorista! : p.precio_venta
          const stockBajo = p.stock > 0 && p.stock <= (p.stock_minimo || 0)
          const stockColor = p.stock <= 0 ? '#C03030' : stockBajo ? '#A07010' : '#2D7A4F'
          return (
            <div key={p.id}
              onMouseDown={e => { e.preventDefault(); onSelect(p); setOpen(false) }}
              onMouseEnter={() => setHi(i)}
              style={{
                padding: '9px 14px', cursor: 'pointer',
                background: i === hi ? 'rgba(128,0,0,0.07)' : 'transparent',
                borderBottom: '1px solid #EEE6D8',
                borderLeft: `3px solid ${i === hi ? '#800000' : 'transparent'}`,
                transition: 'background 0.1s',
              }}>
              <div style={{ fontSize: 13, color: '#1A1210', fontWeight: 500 }}>{p.nombre}</div>
              <div style={{ fontSize: 11, marginTop: 3, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {p.bodega && <span style={{ color: '#6B5D55' }}>{p.bodega}</span>}
                {p.varietal && <span style={{ color: '#A89888' }}>{p.varietal}</span>}
                <span style={{ color: stockColor, fontWeight: 600 }}>
                  {p.stock <= 0 ? 'Sin stock' : stockBajo ? `Stock bajo: ${p.stock}` : `Stock: ${p.stock}`}
                </span>
                <span style={{ color: '#6B5D55', marginLeft: 'auto' }}>${precio.toLocaleString('es-AR')}</span>
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
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300, background: '#FFFFFF', border: '1px solid #C8BAA8', borderRadius: 8, boxShadow: '0 12px 32px rgba(26,18,16,0.16)', maxHeight: 300, overflowY: 'auto' }}>
          <div className="cliente-opt" onMouseDown={() => { onSelect(null); setOpen(false); setQuery('') }}
            style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #EEE6D8' }}>
            <div style={{ fontSize: 12, color: '#A89888', fontStyle: 'italic' }}>Consumidor Final</div>
          </div>
          {filtered.length === 0 && query
            ? <div style={{ padding: '16px 14px', fontSize: 12, color: '#A89888', textAlign: 'center' }}>Sin resultados</div>
            : filtered.map(c => {
              const name = c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()
              const esMay = c.tipo === 'mayorista' || c.tipo === 'revendedor'
              return (
                <div key={c.id} className="cliente-opt"
                  onMouseDown={() => { onSelect(c); setOpen(false); setQuery('') }}
                  style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #EEE6D8' }}>
                  <div style={{ fontSize: 13, color: '#1A1210', fontWeight: 500 }}>{name}</div>
                  <div style={{ fontSize: 11, color: '#A89888', marginTop: 2, display: 'flex', gap: 12 }}>
                    {c.cuit && <span>CUIT: {c.cuit}</span>}
                    {c.tipo && <span style={{ color: esMay ? '#A07010' : '#A89888', fontWeight: esMay ? 600 : 400 }}>{c.tipo}</span>}
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

  // ── Modal selector de comprobante para devolución
  const [devSelectorModal, setDevSelectorModal] = useState(false)
  const [devSearch, setDevSearch] = useState('')
  const [devVentaSel, setDevVentaSel] = useState<Venta | null>(null)
  const [devItemsSel, setDevItemsSel] = useState<{ checked: boolean; cantidad: number; max: number; nombre: string; producto_id: string; precio_unitario: number; subtotal: number }[]>([])

  // ── Venta modal state
  const [modal, setModal] = useState(false)
  const [tipo, setTipo] = useState<'presupuesto' | 'remito' | 'devolucion'>('presupuesto')
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
  const [listaPrecios, setListaPrecios] = useState<'minorista' | 'mayorista' | 'distribuidor'>('minorista')
  const [pctMayorista, setPctMayorista] = useState(35)
  const [pctDistrib, setPctDistrib] = useState(15)
  const [ventaParaImprimir, setVentaParaImprimir] = useState<Venta | null>(null)
  const [previewVenta, setPreviewVenta] = useState<Venta | null>(null)
  const [previewFactura, setPreviewFactura] = useState<{ venta: Venta; tipo: 1 | 6 } | null>(null)

  // ── Facturación AFIP
  const [factModal, setFactModal] = useState(false)
  const [factVenta, setFactVenta] = useState<Venta | null>(null)
  const [factTipo, setFactTipo] = useState<1 | 6>(6)
  const [factDocTipo, setFactDocTipo] = useState(99)
  const [factDocNro, setFactDocNro] = useState('')
  const [factLoading, setFactLoading] = useState(false)
  const [factError, setFactError] = useState('')

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
  const [scannerOpen, setScannerOpen] = useState(false)
  const [barcodeNotFound, setBarcodeNotFound] = useState<string | null>(null)
  const [confirmClose, setConfirmClose] = useState<null | 'venta' | 'pedido'>(null)

  const dirtyVenta  = items.some(i => i.producto_id !== '') || clienteId !== ''
  const dirtyPedido = pItems.some(i => i.producto_id !== '') || pClienteId !== ''

  function tryCloseVenta() {
    if (dirtyVenta) { setConfirmClose('venta'); return }
    setModal(false)
  }
  function tryClosePedido() {
    if (dirtyPedido) { setConfirmClose('pedido'); return }
    setPedidoModal(false)
  }

  // ── Modal etiquetas desde venta ──
  const [etiquetaVenta, setEtiquetaVenta] = useState<Venta | null>(null)
  const [etiquetaPort, setEtiquetaPort] = useState<LabelPrinterPort | null>(null)
  const [etiquetaQtys, setEtiquetaQtys] = useState<Record<number, number>>({})
  const [etiquetaPrinting, setEtiquetaPrinting] = useState(false)
  const [etiquetaPrintIdx, setEtiquetaPrintIdx] = useState(-1)
  const etiquetaCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const e = (localStorage.getItem('empresa') || 'aroma') as 'aroma' | 'lavid'
    setEmpresa(e); cargarTodo(e)
  }, [])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if ((modal && dirtyVenta) || (pedidoModal && dirtyPedido)) {
        e.preventDefault(); e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [modal, pedidoModal, dirtyVenta, dirtyPedido])

  // Repreciar items cuando cambia la lista o cualquier % de descuento
  useEffect(() => {
    if (!modal || !productos.length) return
    setItems(prev => prev.map(item => {
      if (!item.producto_id) return item
      const prod = productos.find(p => p.id === item.producto_id)
      if (!prod) return item
      const pm = prod.precio_mayorista ?? 0
      let precio: number
      if (listaPrecios === 'mayorista') {
        precio = pm > 0 ? pm : Math.round(prod.precio_venta * (1 - pctMayorista / 100))
      } else if (listaPrecios === 'distribuidor') {
        const base = pm > 0 ? pm : prod.precio_venta
        precio = Math.round(base * (1 - pctDistrib / 100))
      } else {
        precio = prod.precio_venta
      }
      const updated = { ...item, precio_unitario: precio }
      const base2 = updated.cantidad * precio
      return { ...updated, subtotal: base2 - base2 * ((updated.descuento || 0) / 100) }
    }))
  }, [listaPrecios, pctMayorista, pctDistrib]) // eslint-disable-line react-hooks/exhaustive-deps

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

  async function handleBarcodeDetect(code: string) {
    setScannerOpen(false)
    const res = await fetch(`/api/productos?empresa=${empresa}&barcode=${encodeURIComponent(code)}`)
    const prod: Producto | null = await res.json()
    if (!prod || !prod.id) { setBarcodeNotFound(code); return }
    addProductoToItems(prod)
  }

  function addProductoToItems(prod: Producto) {
    setItems(prev => {
      const ni = [...prev]
      const emptyIdx = ni.findIndex(i => !i.producto_id)
      const precio = precioSegunLista(prod, listaPrecios, pctMayorista, pctDistrib)
      const newItem = { producto_id: prod.id!, nombre: `${prod.nombre}${prod.bodega ? ' - ' + prod.bodega : ''}`, precio_unitario: precio, cantidad: 1, descuento: 0, subtotal: precio }
      if (emptyIdx >= 0) ni[emptyIdx] = newItem
      else ni.push(newItem)
      if (ni[ni.length - 1].producto_id) ni.push({ ...ITEM_EMPTY })
      return ni
    })
    showToast(`✓ ${prod.nombre} agregado`)
  }

  async function handleBarcodeNotFound(prod: Producto, saveBarcode: boolean) {
    const code = barcodeNotFound!
    setBarcodeNotFound(null)
    if (saveBarcode) {
      const res = await fetch('/api/productos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: prod.id, codigo_barras: code }) })
      if (res.ok) {
        setProductos(prev => {
          const idx = prev.findIndex(p => p.id === prod.id)
          if (idx >= 0) return prev.map(p => p.id === prod.id ? { ...p, codigo_barras: code } : p)
          return [...prev, { ...prod, codigo_barras: code }]
        })
      } else {
        showToast('Error al guardar el código de barras')
      }
    }
    addProductoToItems(prod)
  }

  // Pistola lectora (USB/Bluetooth) — solo activa cuando el modal de venta está abierto
  useBarcodeInput(handleBarcodeDetect, !!modal && !scannerOpen)

  useEffect(() => {
    if (!etiquetaVenta) return
    const qtys: Record<number, number> = {}
    ;(etiquetaVenta.items as VentaItem[]).forEach((item, i) => { qtys[i] = item.cantidad })
    setEtiquetaQtys(qtys)
  }, [etiquetaVenta])

  function buildLabelData(item: VentaItem, prod: Producto | undefined): LabelData {
    return {
      nombre: item.nombre,
      bodega: prod?.bodega || '',
      varietal: prod?.varietal || '',
      region: prod?.region || '',
      categoria: prod?.categoria || '',
      precio: String(item.precio_unitario),
      sku: prod?.sku || '',
      wooUrl: lookupWooUrl(item.nombre) || (prod?.woo_product_id ? `https://aromadevid.com.ar/?p=${prod.woo_product_id}` : ''),
    }
  }

  async function printOneEtiqueta(item: VentaItem, prod: Producto | undefined, copies: number) {
    if (!etiquetaPort || !etiquetaCanvasRef.current) return
    const d = buildLabelData(item, prod)
    await renderCava(etiquetaCanvasRef.current, d)
    for (let c = 0; c < copies; c++) {
      await printCanvas(etiquetaPort, etiquetaCanvasRef.current)
    }
  }

  async function printAllEtiquetas() {
    if (!etiquetaPort || !etiquetaVenta) return
    setEtiquetaPrinting(true)
    const items = etiquetaVenta.items as VentaItem[]
    try {
      await initPrinter(etiquetaPort)
      for (let i = 0; i < items.length; i++) {
        setEtiquetaPrintIdx(i)
        const prod = productos.find(p => p.id === items[i].producto_id)
        await printOneEtiqueta(items[i], prod, etiquetaQtys[i] ?? items[i].cantidad)
      }
      showToast('Etiquetas impresas ✓')
    } catch (e) {
      showToast('Error al imprimir: ' + (e as Error).message)
    } finally {
      setEtiquetaPrinting(false)
      setEtiquetaPrintIdx(-1)
    }
  }

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
    if (!c) {
      setClienteId(''); setClienteNombre('Consumidor Final'); setClienteData(null); setClienteTipo(''); setAplicarMayorista(false)
      cambiarLista('minorista')
      return
    }
    setClienteId(c.id!); setClienteNombre(c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()); setClienteData(c); setClienteTipo(c.tipo)
    const esMay = c.tipo === 'mayorista' || c.tipo === 'revendedor'
    setAplicarMayorista(esMay)
    cambiarLista(esMay ? 'mayorista' : 'minorista')
  }

  function toggleAplicarMayorista(val: boolean) {
    setAplicarMayorista(val)
    const ni = items.map(item => {
      if (!item.producto_id) return item
      const prod = productos.find(p => p.id === item.producto_id)
      if (!prod) return item
      const precio = val && (prod.precio_mayorista ?? 0) > 0 ? prod.precio_mayorista! : prod.precio_venta
      const updated = { ...item, precio_unitario: precio }
      return { ...updated, subtotal: calcSub(updated) }
    })
    setItems(ni)
  }

  function precioSegunLista(prod: Producto, lista: typeof listaPrecios, pctMay: number, pctDist: number): number {
    const pm = prod.precio_mayorista ?? 0
    if (lista === 'mayorista') {
      return pm > 0 ? pm : Math.round(prod.precio_venta * (1 - pctMay / 100))
    }
    if (lista === 'distribuidor') {
      const base = pm > 0 ? pm : prod.precio_venta
      return Math.round(base * (1 - pctDist / 100))
    }
    return prod.precio_venta
  }

  function cambiarLista(lista: typeof listaPrecios, pct?: number) {
    setListaPrecios(lista)
    setAplicarMayorista(lista === 'mayorista' || lista === 'distribuidor')
    if (pct !== undefined) setPctDistrib(pct)
  }

  function selProducto(idx: number, prod: Producto | null) {
    const ni = [...items]
    if (!prod) { ni[idx] = { ...ITEM_EMPTY }; setItems(ni); return }
    const precio = precioSegunLista(prod, listaPrecios, pctMayorista, pctDistrib)
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

  async function guardar(imprimir = true) {
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
      descontarStock: tipo === 'remito' && !editVentaId,
      devolverStock: tipo === 'devolucion' && !editVentaId,
    }
    const res = editVentaId
      ? await fetch('/api/ventas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editVentaId, ...ventaData }) })
      : await fetch('/api/ventas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ventaData) })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false)
    await cargarTodo(empresa)
    const tipoLabel = tipo === 'presupuesto' ? 'Presupuesto' : tipo === 'devolucion' ? 'Devolución' : 'Remito'
    showToast(editVentaId ? 'Comprobante actualizado' : `${tipoLabel} ${data.numero} generado`)
    if (!editVentaId && imprimir) setTimeout(() => { setVentaParaImprimir(data); setTimeout(imprimirDoc, 400) }, 200)
  }

  async function eliminarVenta(id: string) {
    if (!confirm('¿Eliminar este comprobante?')) return
    await fetch(`/api/ventas?id=${id}`, { method: 'DELETE' })
    cargarTodo(empresa); showToast('Comprobante eliminado')
  }

  function abrirFacturar(v: Venta) {
    const c = clientes.find(cl => cl.id === v.cliente_id)
    const esRI = c?.tipo === 'responsable_inscripto'
    const tieneCuit = !!(c?.cuit && c.cuit.replace(/-/g, '').length === 11)
    const usarFactA = esRI || tieneCuit
    setFactVenta(v)
    setFactTipo(usarFactA ? 1 : 6)
    setFactDocTipo(usarFactA ? 80 : 99)
    setFactDocNro(tieneCuit ? c!.cuit!.replace(/-/g, '') : '')
    setFactError('')
    setFactModal(true)
  }

  async function emitirFactura() {
    if (!factVenta) return
    if (factTipo === 1 && factDocNro.length !== 11) { setFactError('El CUIT debe tener 11 dígitos'); return }
    if (factTipo === 6 && factDocTipo !== 99 && !factDocNro) { setFactError('Ingresá el número de documento'); return }
    setFactLoading(true); setFactError('')
    try {
      const res = await fetch('/api/afip/factura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventaId: factVenta.id,
          empresa,
          cbteTipo: factTipo,
          docTipo: factDocTipo,
          docNro: factDocNro || '0',
          total: factVenta.total,
        }),
      })
      const data = await res.json()
      if (data.error) { setFactError(data.error); return }
      setFactModal(false)
      await cargarTodo(empresa)
      showToast(`Factura emitida — CAE ${data.cae}`)
    } catch {
      setFactError('Error de conexión con AFIP')
    } finally {
      setFactLoading(false)
    }
  }

  function editarVenta(v: Venta) {
    setEditVentaId(v.id!); setTipo(v.tipo as 'presupuesto' | 'remito' | 'devolucion')
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
    setEditVentaId(null); setTipo(v.tipo as 'presupuesto' | 'remito' | 'devolucion')
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

  function abrirSelectorDevolucion() {
    setDevSearch(''); setDevVentaSel(null); setDevItemsSel([])
    setDevSelectorModal(true)
  }

  function seleccionarComprobante(v: Venta) {
    setDevVentaSel(v)
    const its = (v.items as (VentaItem & { descuento?: number })[]).map(i => ({
      checked: true,
      cantidad: i.cantidad,
      max: i.cantidad,
      nombre: i.nombre,
      producto_id: i.producto_id || '',
      precio_unitario: i.precio_unitario,
      subtotal: i.subtotal,
    }))
    setDevItemsSel(its)
  }

  function confirmarDevolucion() {
    const v = devVentaSel!
    const selItems = devItemsSel.filter(i => i.checked && i.cantidad > 0).map(i => ({
      producto_id: i.producto_id,
      nombre: i.nombre,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
      descuento: 0,
      subtotal: Math.round(i.precio_unitario * i.cantidad),
    }))
    if (!selItems.length) { alert('Seleccioná al menos un ítem'); return }
    setDevSelectorModal(false)
    abrirDevolucion({ ...v, items: selItems })
  }

  function abrirDevolucion(v: Venta) {
    setEditVentaId(null); setTipo('devolucion')
    setClienteId(v.cliente_id || ''); setClienteNombre(v.cliente_nombre)
    const c = clientes.find(cl => cl.id === v.cliente_id)
    setClienteData(c || null); setClienteTipo(c?.tipo || '')
    setAplicarMayorista(false)
    setVendedorNombre((v as Venta & { vendedor_nombre?: string }).vendedor_nombre || '')
    const vi = (v.items as (VentaItem & { descuento?: number })[]).map(i => ({
      producto_id: i.producto_id || '', nombre: i.nombre, cantidad: i.cantidad,
      precio_unitario: i.precio_unitario, descuento: 0, subtotal: i.subtotal,
    }))
    setItems(vi); setDescuentoGlobal(0); setNotas(`Devolución de ${v.numero}`)
    setCondVenta('Contado'); setEstadoPago(v.estado_pago || 'pagado'); setModal(true)
  }

  function abrirNuevo(t: 'presupuesto' | 'remito' | 'devolucion') {
    setEditVentaId(null); setTipo(t)
    setClienteId(''); setClienteNombre('Consumidor Final'); setClienteData(null); setClienteTipo('')
    setVendedorNombre(''); setItems([{ ...ITEM_EMPTY }])
    setDescuentoGlobal(0); setNotas(''); setCondVenta('Contado')
    setEstadoPago(empresa === 'lavid' && t === 'presupuesto' ? 'cuenta_corriente' : 'pagado')
    setAplicarMayorista(false)
    setListaPrecios('minorista'); setPctMayorista(35)
    setPctDistrib(15)
    setModal(true)
  }

  function exportarVentas() {
    const rows = ventasFiltradas.map(v => ({
      Número: v.numero, Tipo: v.tipo, Cliente: v.cliente_nombre,
      Vendedor: v.vendedor_nombre ?? '', Total: v.total,
      'Estado pago': v.estado_pago ?? '', Estado: v.estado ?? '',
      Fecha: new Date(v.created_at!).toLocaleDateString('es-AR'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas')
    XLSX.writeFile(wb, `ventas_${empresa}_${new Date().toISOString().slice(0,10)}.xlsx`)
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function imprimirVenta(venta: Venta, _empresaNombre: string) {
    window.open(`/api/print/venta?id=${venta.id}&empresa=${empresa}`, '_blank')
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
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .venta-row:hover { background: #FDFAF6 !important; }
        .pedido-row:hover { background: #FDFAF6 !important; }
        .vbtn:hover { opacity: 0.85; } .vbtn:active { opacity: 0.65; }
        .vinp:focus { border-color: #C8BAA8 !important; box-shadow: 0 0 0 3px rgba(128,0,0,0.08) !important; }
        .vinp::placeholder { color: #A89888; }
        .item-row td { border-bottom: 1px solid #DDD0C0; }
        .cliente-opt:hover { background: rgba(128,0,0,0.05) !important; }
        .tab-active { background: #800000 !important; color: #fff !important; }
        .tab-inactive { background: transparent !important; color: #6B5D55 !important; }
        .tab-inactive:hover { background: rgba(128,0,0,0.06) !important; }
        @media (max-width: 767px) {
          .v-header { flex-direction: column !important; align-items: stretch !important; padding: 12px 16px !important; gap: 10px !important; }
          .v-header-tabs { width: 100% !important; justify-content: stretch !important; }
          .v-header-tabs button { flex: 1 !important; }
          .v-header-btns { display: grid !important; grid-template-columns: 1fr 1fr 1fr !important; }
          .v-header-btns button { text-align: center !important; }
          .v-content { padding: 16px !important; }
          .v-stats-grid { grid-template-columns: repeat(3,1fr) !important; gap: 8px !important; }
          .v-stats-grid > div { padding: 12px !important; }
          .v-stats-grid .stat-val { font-size: 18px !important; }
          .v-filter-grid { grid-template-columns: 1fr 1fr !important; }
          .v-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .v-modal-grid { grid-template-columns: 1fr !important; }
          .v-modal-footer-row { flex-direction: column !important; }
          .v-modal-footer-row > div:last-child { width: auto !important; }
          .v-modal-actions { flex-wrap: wrap !important; }
          .v-modal-actions button { flex: 1 !important; min-width: 0 !important; }
        }
      `}</style>

      {/* Page header */}
      <div className="v-header" style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="v-header-tabs" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, background: C.bg, borderRadius: 9, padding: 3, border: `1px solid ${C.border}`, flex: 1 }}>
            {(['comprobantes', 'pedidos'] as const).map(t => (
              <button key={t} className={`vbtn ${tab === t ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab(t)}
                style={{ padding: '6px 18px', fontSize: 13, borderRadius: 7, border: 'none', fontWeight: tab === t ? 600 : 400, cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit' }}>
                {t === 'comprobantes' ? `Comprobantes (${ventas.length})` : `Pedidos (${pedidosPend} pend.)`}
              </button>
            ))}
          </div>
        </div>
        <div className="v-header-btns" style={{ display: 'flex', gap: 8 }}>
          {tab === 'comprobantes' && <>
            <button className="vbtn" style={btn('default', { padding: '7px 12px', fontSize: 13 })} onClick={exportarVentas}>↓ Excel</button>
            <button className="vbtn" style={btn('default', { padding: '7px 16px', fontSize: 13 })} onClick={() => abrirNuevo('presupuesto')}>+ Presupuesto</button>
            <button className="vbtn" style={btn('default', { padding: '7px 16px', fontSize: 13, color: C.blue })} onClick={abrirSelectorDevolucion}>+ Devolución</button>
            <button className="vbtn" style={btn('accent', { padding: '7px 16px', fontSize: 13, fontWeight: 600 })} onClick={() => abrirNuevo('remito')}>+ Remito</button>
          </>}
          {tab === 'pedidos' && (
            <button className="vbtn" style={btn('accent', { padding: '7px 16px', fontSize: 13, fontWeight: 600 })} onClick={abrirNuevoPedido}>+ Nuevo pedido</button>
          )}
        </div>
      </div>

      <div className="v-content" style={{ padding: '24px 28px', color: C.text }}>

      {/* ══ COMPROBANTES ══ */}
      {tab === 'comprobantes' && (
        <>
          <div className="v-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total comprobantes', value: String(ventas.length), color: C.text },
              { label: 'Presupuestos', value: String(ventas.filter(v => v.tipo === 'presupuesto').length), color: C.muted },
              { label: 'Total remitos', value: `$${totalRemitos.toLocaleString('es-AR')}`, color: C.green },
            ].map(s => (
              <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
                <div className="stat-val" style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
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
            <div className="v-filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
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

          <div className="v-table-wrap" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', contain: 'layout' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
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
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                            background: v.tipo === 'presupuesto' ? 'rgba(128,0,0,0.08)' : v.tipo === 'devolucion' ? 'rgba(43,94,160,0.08)' : 'rgba(45,122,79,0.1)',
                            color: v.tipo === 'presupuesto' ? '#800000' : v.tipo === 'devolucion' ? C.blue : C.green,
                            border: `1px solid ${v.tipo === 'presupuesto' ? 'rgba(128,0,0,0.25)' : v.tipo === 'devolucion' ? 'rgba(43,94,160,0.25)' : 'rgba(45,122,79,0.3)'}` }}>
                            {v.tipo === 'presupuesto' ? 'Presupuesto' : v.tipo === 'devolucion' ? 'Devolución' : 'Remito'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', color: C.text }}>{v.cliente_nombre}</td>
                        <td style={{ padding: '11px 14px', color: C.muted, fontSize: 12 }}>{(v as Venta & { vendedor_nombre?: string }).vendedor_nombre || '—'}</td>
                        <td style={{ padding: '11px 14px', color: C.muted, fontSize: 12 }}>{new Date(v.created_at!).toLocaleDateString('es-AR')}</td>
                        <td style={{ padding: '11px 14px' }}>
                          {v.estado_pago === 'pagado' && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(76,175,125,0.15)', color: C.green, border: '1px solid rgba(76,175,125,0.3)' }}>Pagado</span>}
                          {v.estado_pago === 'pendiente' && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(212,130,10,0.15)', color: C.amber, border: '1px solid rgba(212,130,10,0.3)' }}>Pendiente</span>}
                          {v.estado_pago === 'cuenta_corriente' && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(43,94,160,0.08)', color: '#2B5EA0', border: '1px solid rgba(43,94,160,0.25)' }}>Cta. Cte.</span>}
                          {!v.estado_pago && <span style={{ color: C.dim }}>—</span>}
                        </td>
                        <td style={{ padding: '11px 14px', fontWeight: 700, color: C.text }}>${v.total.toLocaleString('es-AR')}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="vbtn" style={btn('default', { padding: '4px 8px', fontSize: 11 })} onClick={() => setPreviewVenta(v)}>Ver</button>
                            <button className="vbtn" style={btn('default', { padding: '4px 8px', fontSize: 11 })} onClick={() => { setVentaParaImprimir(v); setTimeout(imprimirDoc, 400) }}>Imprimir</button>
                            <button className="vbtn" style={btn('green', { padding: '4px 8px', fontSize: 11, color: C.green })} onClick={() => whatsappVenta(v)}>WA</button>
                            <button className="vbtn" style={btn('default', { padding: '4px 8px', fontSize: 11 })} onClick={() => editarVenta(v)}>Editar</button>
                            <button className="vbtn" style={btn('default', { padding: '4px 8px', fontSize: 11, color: C.amber })} onClick={() => duplicarVenta(v)}>Dupl.</button>
                            {v.tipo === 'remito' && <button className="vbtn" style={btn('default', { padding: '4px 8px', fontSize: 11, color: C.blue })} onClick={() => abrirDevolucion(v)}>Dev.</button>}
                            <button className="vbtn" style={btn('default', { padding: '4px 8px', fontSize: 11, color: C.amber })} title="Generar etiquetas" onClick={() => setEtiquetaVenta(v)}>🏷️</button>
                            {v.facturado
                              ? <span style={{ fontSize: 10, fontWeight: 700, color: C.green, padding: '4px 6px', border: `1px solid ${C.green}44`, borderRadius: 4 }}>CAE ✓</span>
                              : <button className="vbtn" style={btn('accent', { padding: '4px 8px', fontSize: 11 })} onClick={() => abrirFacturar(v)}>Facturar</button>
                            }
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
          <div className="v-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Pendientes', value: String(pedidos.filter(p => p.estado === 'pendiente').length), color: C.amber },
              { label: 'Entregados', value: String(pedidos.filter(p => p.estado === 'entregado').length), color: C.green },
              { label: 'Total pedidos', value: String(pedidos.length), color: C.text },
            ].map(s => (
              <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
                <div className="stat-val" style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
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

          <div className="v-table-wrap" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', contain: 'layout' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
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

      </div>{/* end content wrapper */}

      {/* ══ SCANNER CÓDIGO DE BARRAS ══ */}
      {scannerOpen && (
        <BarcodeScanner
          titulo="Escanear botella"
          onClose={() => setScannerOpen(false)}
          onDetect={handleBarcodeDetect}
        />
      )}
      {barcodeNotFound && (
        <BarcodeNotFoundModal
          code={barcodeNotFound}
          empresa={empresa}
          onSelect={handleBarcodeNotFound}
          onClose={() => setBarcodeNotFound(null)}
        />
      )}

      {/* ══ MODAL SELECTOR DEVOLUCIÓN ══ */}
      {devSelectorModal && (() => {
        const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        const q = normalize(devSearch)
        const candidatos = ventas.filter(v =>
          v.tipo !== 'devolucion' &&
          (!q || normalize(v.numero || '').includes(q) || normalize(v.cliente_nombre || '').includes(q))
        ).slice(0, 30)
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => e.target === e.currentTarget && setDevSelectorModal(false)}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, width: '100%', maxWidth: 660, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 48px rgba(26,18,16,0.18)' }}>

              {/* Header */}
              <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Nueva devolución</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Buscá el comprobante original y elegí los ítems a devolver</div>
                </div>
                <button onClick={() => setDevSelectorModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: C.dim, cursor: 'pointer', fontFamily: 'inherit' }}>×</button>
              </div>

              {!devVentaSel ? (
                <>
                  {/* Búsqueda */}
                  <div style={{ padding: '14px 22px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                    <input autoFocus style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                      placeholder="Buscar por número (REM-001) o cliente..."
                      value={devSearch} onChange={e => setDevSearch(e.target.value)} />
                  </div>

                  {/* Lista de comprobantes */}
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {candidatos.length === 0 ? (
                      <div style={{ padding: 32, textAlign: 'center', color: C.dim, fontSize: 13 }}>Sin resultados</div>
                    ) : candidatos.map(v => (
                      <button key={v.id} onClick={() => seleccionarComprobante(v)}
                        style={{ display: 'flex', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: `1px solid ${C.border}`, padding: '12px 22px', cursor: 'pointer', fontFamily: 'inherit', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: C.accent, minWidth: 90 }}>{v.numero}</span>
                        <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{v.cliente_nombre}</span>
                        <span style={{ fontSize: 11, color: C.muted }}>{new Date(v.created_at!).toLocaleDateString('es-AR')}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>${v.total.toLocaleString('es-AR')}</span>
                        <span style={{ fontSize: 11, color: C.blue }}>Seleccionar →</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Comprobante seleccionado — elegir ítems */}
                  <div style={{ padding: '12px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: C.accent }}>{devVentaSel.numero}</span>
                    <span style={{ fontSize: 13, color: C.text }}>{devVentaSel.cliente_nombre}</span>
                    <button onClick={() => setDevVentaSel(null)} style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, color: C.muted, cursor: 'pointer', fontFamily: 'inherit' }}>← Cambiar</button>
                  </div>

                  <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
                    {devItemsSel.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px', borderBottom: `1px solid ${C.border}` }}>
                        <input type="checkbox" checked={it.checked}
                          onChange={e => setDevItemsSel(prev => prev.map((x, i) => i === idx ? { ...x, checked: e.target.checked } : x))}
                          style={{ width: 16, height: 16, accentColor: C.accent, cursor: 'pointer', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, color: it.checked ? C.text : C.dim }}>{it.nombre}</span>
                        <span style={{ fontSize: 11, color: C.muted, minWidth: 60 }}>${it.precio_unitario.toLocaleString('es-AR')} c/u</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={() => setDevItemsSel(prev => prev.map((x, i) => i === idx && x.cantidad > 1 ? { ...x, cantidad: x.cantidad - 1, subtotal: Math.round(x.precio_unitario * (x.cantidad - 1)) } : x))}
                            disabled={!it.checked || it.cantidad <= 1}
                            style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer', fontSize: 14, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!it.checked || it.cantidad <= 1) ? 0.3 : 1 }}>−</button>
                          <span style={{ minWidth: 28, textAlign: 'center', fontSize: 14, fontWeight: 600, color: it.checked ? C.text : C.dim }}>{it.cantidad}</span>
                          <button onClick={() => setDevItemsSel(prev => prev.map((x, i) => i === idx && x.cantidad < x.max ? { ...x, cantidad: x.cantidad + 1, subtotal: Math.round(x.precio_unitario * (x.cantidad + 1)) } : x))}
                            disabled={!it.checked || it.cantidad >= it.max}
                            style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer', fontSize: 14, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!it.checked || it.cantidad >= it.max) ? 0.3 : 1 }}>+</button>
                        </div>
                        <span style={{ minWidth: 80, textAlign: 'right', fontSize: 13, fontWeight: 600, color: it.checked ? C.accent : C.dim }}>
                          ${Math.round(it.precio_unitario * it.cantidad).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer con total y confirmar */}
                  <div style={{ padding: '14px 22px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                      Total a devolver: <span style={{ color: C.accent }}>
                        ${devItemsSel.filter(i => i.checked).reduce((a, i) => a + Math.round(i.precio_unitario * i.cantidad), 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setDevSelectorModal(false)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: C.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                      <button onClick={confirmarDevolucion} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Continuar →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })()}

      {/* ══ MODAL VENTA ══ */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}
          onClick={e => e.target === e.currentTarget && tryCloseVenta()}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, width: '100%', maxWidth: 760, margin: '16px auto', boxShadow: '0 8px 40px rgba(26,18,16,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>{editVentaId ? 'Editar' : 'Nuevo'} {tipo === 'presupuesto' ? 'presupuesto' : tipo === 'devolucion' ? 'comprobante de devolución' : 'remito'}</h2>
                {tipo === 'remito' && !editVentaId && <div style={{ fontSize: 11, color: C.green, marginTop: 3 }}>Descuenta stock automáticamente al guardar</div>}
                {tipo === 'devolucion' && !editVentaId && <div style={{ fontSize: 11, color: C.blue, marginTop: 3 }}>Devuelve stock automáticamente al guardar</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', background: C.surface, borderRadius: 7, padding: 3, border: `1px solid ${C.border}` }}>
                  {(['presupuesto', 'remito', 'devolucion'] as const).map(t => (
                    <button key={t} className="vbtn" onClick={() => setTipo(t)}
                      style={{ ...btn(tipo === t ? 'accent' : 'ghost', { padding: '4px 12px', fontSize: 12, borderRadius: 5 }), border: 'none' }}>
                      {t === 'presupuesto' ? 'Presupuesto' : t === 'devolucion' ? 'Devolución' : 'Remito'}
                    </button>
                  ))}
                </div>
                <button className="vbtn" style={{ ...btn('ghost', { padding: '4px 8px', fontSize: 18, lineHeight: 1 }), color: C.dim }} onClick={() => tryCloseVenta()}>×</button>
              </div>
            </div>

            <div className="v-modal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
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
              </div>
            )}

            {/* ── Selector lista de precios ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lista:</span>
              <button className="vbtn" onClick={() => cambiarLista('minorista')}
                style={btn(listaPrecios === 'minorista' ? 'accent' : 'default', { padding: '4px 12px', fontSize: 12 })}>
                Minorista
              </button>
              <button className="vbtn" onClick={() => cambiarLista('mayorista')}
                style={{ ...btn(listaPrecios === 'mayorista' ? 'green' : 'default', { padding: '4px 12px', fontSize: 12 }),
                  ...(listaPrecios === 'mayorista' ? { background: C.amber, borderColor: C.amber, color: '#fff' } : {}) }}>
                Mayorista
              </button>
              {listaPrecios === 'mayorista' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: C.dim }}>−</span>
                  <input type="number" min={1} max={99} value={pctMayorista}
                    onChange={e => setPctMayorista(Number(e.target.value))}
                    style={{ ...INP, width: 52, padding: '3px 6px', fontSize: 12 }} />
                  <span style={{ fontSize: 11, color: C.dim }}>%</span>
                </div>
              )}
              <button className="vbtn" onClick={() => cambiarLista('distribuidor')}
                style={btn(listaPrecios === 'distribuidor' ? 'green' : 'default', { padding: '4px 12px', fontSize: 12 })}>
                Distribuidor
              </button>
              {listaPrecios === 'distribuidor' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: C.dim }}>−</span>
                  <input type="number" min={1} max={99} value={pctDistrib}
                    onChange={e => setPctDistrib(Number(e.target.value))}
                    style={{ ...INP, width: 52, padding: '3px 6px', fontSize: 12 }} />
                  <span style={{ fontSize: 11, color: C.dim }}>%</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Productos</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="vbtn" title="Escanear código de barras" onClick={() => setScannerOpen(true)}
                    style={{ ...btn('default', { padding: '3px 10px', fontSize: 16 }) }}>📷</button>
                  <button className="vbtn" style={{ ...btn('ghost', { padding: '3px 8px', fontSize: 12 }), color: C.accent }}
                    onClick={() => setItems([...items, { ...ITEM_EMPTY }])}>+ agregar línea</button>
                </div>
              </div>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.surface }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bg }}>
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

            <div className="v-modal-footer-row" style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
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
                  {(() => {
                    const total = calcTotal()
                    const neto = parseFloat((total / 1.21).toFixed(2))
                    const iva  = parseFloat((total - neto).toFixed(2))
                    const totalBot = items.reduce((s, it) => s + (it.cantidad || 0), 0)
                    const cajas = Math.floor(totalBot / 6)
                    const resto = totalBot % 6
                    const resumen = cajas === 0
                      ? `${totalBot} bot`
                      : resto === 0
                        ? `${totalBot} bot · ${cajas} caj×6`
                        : `${totalBot} bot · ${cajas} caj×6 + ${resto}`
                    return <>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Neto: ${neto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>IVA 21%: ${iva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginTop: 4 }}>TOTAL: ${total.toLocaleString('es-AR')}</div>
                      <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{resumen}</div>
                    </>
                  })()}
                </div>
              </div>
            </div>

            <div className="v-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <button className="vbtn" style={btn('default')} onClick={() => setModal(false)}>Cancelar</button>
              {!editVentaId && (
                <button className="vbtn" onClick={() => guardar(false)}
                  style={btn('default', {
                    padding: '7px 14px', fontSize: 13, fontWeight: 600,
                    ...(tipo !== 'devolucion' && { background: '#C03030', border: '1px solid #C03030', color: '#fff' }),
                  })}>
                  {tipo !== 'devolucion' ? 'Generar' : 'Solo registrar'}
                </button>
              )}
              <button className="vbtn" onClick={() => guardar(true)}
                style={btn('accent', {
                  padding: '7px 18px', fontSize: 13, fontWeight: 600,
                  ...(tipo !== 'devolucion' && !editVentaId && { background: C.blue, border: `1px solid ${C.blue}`, color: '#fff' }),
                })}>
                {editVentaId ? 'Guardar cambios' : (
                  tipo !== 'devolucion' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                        <rect x="6" y="14" width="12" height="8" rx="1" />
                      </svg>
                      Generar e Imprimir
                    </span>
                  ) : 'Generar e imprimir'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL PEDIDO ══ */}
      {pedidoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}
          onClick={e => e.target === e.currentTarget && tryClosePedido()}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, width: '100%', maxWidth: 680, margin: '16px auto', boxShadow: '0 8px 40px rgba(26,18,16,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Nuevo pedido</h2>
              <button className="vbtn" style={{ ...btn('ghost', { padding: '4px 8px', fontSize: 18, lineHeight: 1 }), color: C.dim }} onClick={() => tryClosePedido()}>×</button>
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
                    <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bg }}>
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
                <button className="vbtn" style={btn('default')} onClick={() => tryClosePedido()}>Cancelar</button>
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
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 8px 40px rgba(26,18,16,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Pedido {detallePedido.numero}</h2>
              <button className="vbtn" style={{ ...btn('ghost'), color: C.dim, fontSize: 18 }} onClick={() => setDetallePedido(null)}>×</button>
            </div>
            {(() => {
              const cp = clientes.find(c => c.id === detallePedido.cliente_id)
              return (
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div><strong style={{ color: C.text }}>Cliente:</strong> {detallePedido.cliente_nombre}</div>
                  {cp?.cuit && <div><strong style={{ color: C.text }}>CUIT:</strong> <span style={{ fontFamily: 'monospace' }}>{cp.cuit}</span></div>}
                  {cp?.direccion && <div><strong style={{ color: C.text }}>Dirección:</strong> {cp.direccion}</div>}
                  {cp?.telefono && <div><strong style={{ color: C.text }}>Teléfono:</strong> {cp.telefono}</div>}
                  {cp?.email && <div><strong style={{ color: C.text }}>Email:</strong> {cp.email}</div>}
                  {detallePedido.vendedor_nombre && <div><strong style={{ color: C.text }}>Vendedor:</strong> {detallePedido.vendedor_nombre}</div>}
                  {detallePedido.fecha_entrega && <div><strong style={{ color: C.text }}>Entrega:</strong> {new Date(detallePedido.fecha_entrega + 'T12:00:00').toLocaleDateString('es-AR')}</div>}
                  {detallePedido.notas && <div><strong style={{ color: C.text }}>Notas:</strong> {detallePedido.notas}</div>}
                </div>
              )
            })()}
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
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => window.open(`/api/print/pedido?id=${detallePedido.id}&empresa=${empresa}`, '_blank')}
                style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                🖨️ Imprimir
              </button>
              <button className="vbtn" style={btn('default')} onClick={() => setDetallePedido(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal vista previa ──────────────────────────────────────────────── */}
      {previewVenta && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}
          onClick={e => e.target === e.currentTarget && setPreviewVenta(null)}>
          <div style={{ width: '100%', maxWidth: 820 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Vista previa — {previewVenta.numero}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => imprimirVenta(previewVenta, emp.nombre)}
                  style={{ background: 'rgba(128,0,0,0.07)', border: '1px solid rgba(128,0,0,0.18)', color: '#800000', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  🖨️ Imprimir
                </button>
                <button
                  onClick={() => { setVentaParaImprimir(previewVenta); setTimeout(imprimirDoc, 400) }}
                  style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Imprimir (clásico)
                </button>
                <button
                  onClick={() => setPreviewVenta(null)}
                  style={{ background: '#333', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 13, cursor: 'pointer' }}>
                  Cerrar
                </button>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, padding: '32px 40px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
              <PrintDoc venta={previewVenta} empresa={emp} cliente={clientes.find(c => c.id === previewVenta.cliente_id)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal facturación AFIP ──────────────────────────────────────────── */}
      {factModal && factVenta && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && !factLoading && setFactModal(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 440 }}>
            <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Emitir factura AFIP</h2>
            <p style={{ color: C.muted, fontSize: 13, margin: '0 0 18px' }}>
              {factVenta.cliente_nombre} · #{factVenta.numero}
            </p>

            {/* Tipo de comprobante */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>TIPO DE COMPROBANTE</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {([
                  { val: 1 as const, label: 'Factura A', sub: 'Resp. Inscripto — IVA discriminado' },
                  { val: 6 as const, label: 'Factura B', sub: 'Consumidor Final / Monotributo' },
                ]).map(opt => (
                  <button key={opt.val}
                    onClick={() => { setFactTipo(opt.val); if (opt.val === 6) { setFactDocTipo(99); setFactDocNro('') } else setFactDocTipo(80) }}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', border: `1px solid ${factTipo === opt.val ? C.accent : C.border}`, background: factTipo === opt.val ? `${C.accent}22` : 'transparent' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: factTipo === opt.val ? C.text : C.muted }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Documento cliente — Fact A */}
            {factTipo === 1 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>CUIT DEL CLIENTE *</div>
                <input style={INP} value={factDocNro} maxLength={11}
                  onChange={e => setFactDocNro(e.target.value.replace(/\D/g, ''))}
                  placeholder="20123456789 (11 dígitos, sin guiones)" />
              </div>
            )}

            {/* Documento cliente — Fact B */}
            {factTipo === 6 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>DOCUMENTO DEL CLIENTE</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select style={{ ...INP, width: 160, flexShrink: 0 }} value={factDocTipo}
                    onChange={e => { setFactDocTipo(parseInt(e.target.value)); setFactDocNro('') }}>
                    <option value={99}>Consumidor Final</option>
                    <option value={96}>DNI</option>
                    <option value={80}>CUIT</option>
                  </select>
                  {factDocTipo !== 99 && (
                    <input style={INP} value={factDocNro}
                      onChange={e => setFactDocNro(e.target.value.replace(/\D/g, ''))}
                      placeholder={factDocTipo === 96 ? 'DNI sin puntos' : 'CUIT sin guiones'} />
                  )}
                </div>
              </div>
            )}

            {/* Resumen montos */}
            <div style={{ background: C.surface, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: C.dim, marginBottom: 4 }}>
                <span>Neto gravado (21%):</span>
                <span>${(factVenta.total / 1.21).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: C.dim, marginBottom: 4 }}>
                <span>IVA 21%:</span>
                <span>${(factVenta.total - factVenta.total / 1.21).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: C.text, fontWeight: 700, borderTop: `1px solid ${C.border}`, paddingTop: 4 }}>
                <span>Total:</span>
                <span>${factVenta.total.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {factError && (
              <div style={{ background: `${C.red}18`, border: `1px solid ${C.red}55`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: C.red }}>
                {factError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button style={btn('default')} onClick={() => { setPreviewFactura({ venta: factVenta!, tipo: factTipo }); setFactModal(false) }}>
                Previsualizar
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btn('default')} onClick={() => setFactModal(false)} disabled={factLoading}>Cancelar</button>
                <button style={btn('accent', { opacity: factLoading ? 0.6 : 1 })} onClick={emitirFactura} disabled={factLoading}>
                  {factLoading ? 'Emitiendo...' : 'Emitir factura'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal preview Factura A/B ───────────────────────────────────────── */}
      {previewFactura && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 70, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}
          onClick={e => e.target === e.currentTarget && setPreviewFactura(null)}>
          <div style={{ width: '100%', maxWidth: 820 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                Vista previa — {previewFactura.tipo === 1 ? 'Factura A' : 'Factura B'} (con CAE de ejemplo)
              </span>
              <button onClick={() => setPreviewFactura(null)}
                style={{ background: '#333', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 13, cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, padding: '32px 40px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
              <PrintFactura venta={previewFactura.venta} tipo={previewFactura.tipo} empresa={emp} />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal etiquetas de cava ── */}
      {etiquetaVenta && (() => {
        const items = etiquetaVenta.items as VentaItem[]
        const totalEtiquetas = items.reduce((s, item, i) => s + (etiquetaQtys[i] ?? item.cantidad), 0)
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => e.target === e.currentTarget && !etiquetaPrinting && setEtiquetaVenta(null)}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, width: '100%', maxWidth: 520, boxShadow: '0 8px 40px rgba(26,18,16,0.15)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px 14px', borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Etiquetas de cava</div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{etiquetaVenta.numero} · {etiquetaVenta.cliente_nombre}</div>
                </div>
                <button className="vbtn" style={btn('ghost', { padding: '4px 10px', fontSize: 20, color: C.dim })}
                  onClick={() => !etiquetaPrinting && setEtiquetaVenta(null)}>×</button>
              </div>

              {/* Barra impresora */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
                <span style={{ fontSize: 12, color: etiquetaPort ? C.green : C.dim, fontWeight: 600 }}>
                  {etiquetaPort ? '● Conectada' : '○ Sin impresora'}
                </span>
                {!etiquetaPort
                  ? <button className="vbtn" style={btn('default', { fontSize: 12, padding: '4px 12px' })}
                      onClick={async () => { try { setEtiquetaPort(await connectPrinter()) } catch(e) { showToast('Error: ' + (e as Error).message) } }}>
                      Conectar
                    </button>
                  : <>
                      <button className="vbtn" style={btn('ghost', { fontSize: 12, padding: '4px 10px' })}
                        onClick={async () => { await disconnectPrinter(etiquetaPort); setEtiquetaPort(null) }}>
                        Desconectar
                      </button>
                      <button className="vbtn" style={btn('ghost', { fontSize: 12, padding: '4px 10px' })}
                        onClick={() => testPrint(etiquetaPort).catch(e => showToast(e.message))}>
                        Test
                      </button>
                      <button className="vbtn" style={btn('ghost', { fontSize: 12, padding: '4px 10px' })}
                        title="Avanza el papel hasta el inicio de la siguiente etiqueta"
                        onClick={() => feedNextLabel(etiquetaPort).catch(e => showToast(e.message))}>
                        ↓ Papel
                      </button>
                    </>
                }
              </div>

              {/* Lista de items */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item, i) => {
                  const prod = productos.find(p => p.id === item.producto_id)
                  const hasQr = !!(lookupWooUrl(item.nombre) || prod?.woo_product_id)
                  const qty = etiquetaQtys[i] ?? item.cantidad
                  const isPrinting = etiquetaPrinting && etiquetaPrintIdx === i
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: isPrinting ? C.greenBg : C.bg, border: `1px solid ${isPrinting ? C.green : C.border}`, borderRadius: 9, transition: 'all 0.15s' }}>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</div>
                        <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
                          ${item.precio_unitario.toLocaleString('es-AR')}
                          {hasQr ? <span style={{ color: C.green, marginLeft: 6 }}>● QR</span> : <span style={{ color: C.dim, marginLeft: 6 }}>○ sin QR</span>}
                        </div>
                      </div>
                      {/* Spinner de cantidad */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <button className="vbtn" style={btn('ghost', { padding: '2px 8px', fontSize: 16, lineHeight: 1 })}
                          onClick={() => setEtiquetaQtys(q => ({ ...q, [i]: Math.max(1, (q[i] ?? item.cantidad) - 1) }))}>−</button>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text, minWidth: 22, textAlign: 'center' }}>{qty}</span>
                        <button className="vbtn" style={btn('ghost', { padding: '2px 8px', fontSize: 16, lineHeight: 1 })}
                          onClick={() => setEtiquetaQtys(q => ({ ...q, [i]: (q[i] ?? item.cantidad) + 1 }))}>+</button>
                      </div>
                      {/* Botón imprimir uno */}
                      <button className="vbtn"
                        disabled={!etiquetaPort || etiquetaPrinting}
                        style={btn('default', { fontSize: 12, padding: '5px 10px', opacity: (!etiquetaPort || etiquetaPrinting) ? 0.4 : 1 })}
                        onClick={async () => {
                          setEtiquetaPrinting(true); setEtiquetaPrintIdx(i)
                          try { await initPrinter(etiquetaPort!); await printOneEtiqueta(item, prod, qty); showToast(`${qty} etiqueta${qty > 1 ? 's' : ''} ✓`) }
                          catch(e) { showToast('Error: ' + (e as Error).message) }
                          finally { setEtiquetaPrinting(false); setEtiquetaPrintIdx(-1) }
                        }}>
                        {isPrinting ? '…' : '🖨️'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Footer — imprimir todas */}
              <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}` }}>
                <button className="vbtn"
                  disabled={!etiquetaPort || etiquetaPrinting}
                  style={btn('accent', { width: '100%', padding: '11px', fontSize: 14, opacity: (!etiquetaPort || etiquetaPrinting) ? 0.5 : 1 })}
                  onClick={printAllEtiquetas}>
                  {etiquetaPrinting
                    ? `Imprimiendo ${etiquetaPrintIdx + 1}/${items.length}…`
                    : `Imprimir todas — ${totalEtiquetas} etiqueta${totalEtiquetas !== 1 ? 's' : ''}`}
                </button>
                {!etiquetaPort && (
                  <div style={{ fontSize: 11, color: C.dim, textAlign: 'center', marginTop: 8 }}>
                    Conectá la impresora primero (Chrome/Edge con Bluetooth activo)
                  </div>
                )}
              </div>

            </div>
          </div>
        )
      })()}

      {/* Canvas oculto para renderizar etiquetas antes de imprimir */}
      <canvas ref={etiquetaCanvasRef} style={{ display: 'none' }} />

      <div id="print-area" style={{ display: 'none' }}>
        {ventaParaImprimir && <PrintDoc venta={ventaParaImprimir} empresa={emp} cliente={clientes.find(c => c.id === ventaParaImprimir.cliente_id)} />}
      </div>

      {/* ══ ALERTA SALIR SIN GUARDAR ══ */}
      {confirmClose && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, maxWidth: 360, width: '100%', boxShadow: '0 8px 40px rgba(26,18,16,0.25)', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(192,48,48,0.1)', border: '2px solid rgba(192,48,48,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C03030" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
              {confirmClose === 'venta' ? 'Salir del presupuesto?' : 'Salir del pedido?'}
            </h3>
            <p style={{ fontSize: 13, color: C.dim, margin: '0 0 24px', lineHeight: 1.5 }}>
              {confirmClose === 'venta'
                ? 'Tenés productos cargados que no se guardaron. Si salís se pierden.'
                : 'El pedido no está guardado. Si salís se pierden los datos.'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="vbtn" style={{ ...btn('default'), flex: 1, fontWeight: 600 }}
                onClick={() => setConfirmClose(null)}>
                Volver
              </button>
              <button className="vbtn" style={{ ...btn('danger'), flex: 1, fontWeight: 600 }}
                onClick={() => {
                  if (confirmClose === 'venta') setModal(false)
                  else setPedidoModal(false)
                  setConfirmClose(null)
                }}>
                Salir igual
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, padding: '12px 20px', borderRadius: 10, boxShadow: '0 4px 20px rgba(26,18,16,0.12)', zIndex: 100 }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function fmtCantBot(qty: number) {
  const cajas = Math.floor(qty / 6)
  const resto = qty % 6
  if (cajas === 0) return <>{qty} bot</>
  const det = resto === 0 ? `${cajas} caj×6` : `${cajas} caj×6 + ${resto} bot`
  return <>{qty} bot<br /><span style={{ fontSize: 9, color: '#888' }}>{det}</span></>
}

function PrintDoc({ venta, empresa, cliente }: {
  venta: Venta
  empresa: { nombre: string; cuit: string; domicilio: string; telefono: string; logoPath: string }
  cliente?: { cuit?: string; direccion?: string; telefono?: string; email?: string } | null
}) {
  const items = venta.items as (VentaItem & { descuento?: number })[]
  const fecha = new Date(venta.created_at!).toLocaleDateString('es-AR')
  const condVenta = (venta as unknown as Record<string, unknown>).condicion_venta as string || 'Contado'
  const esCuentaCorriente = venta.estado_pago === 'cuenta_corriente'
  const esPendiente = venta.estado_pago === 'pendiente'
  const docLabel = venta.tipo === 'presupuesto' ? 'PRESUPUESTO' : 'REMITO'
  const netoGravado = parseFloat((venta.total / 1.21).toFixed(2))
  const importeIVA  = parseFloat((venta.total - netoGravado).toFixed(2))

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
          {cliente?.cuit && <div style={{ marginTop: '3px' }}><strong>CUIT:</strong>&nbsp;&nbsp;<span style={{ fontFamily: 'monospace' }}>{cliente.cuit}</span></div>}
          {cliente?.direccion && <div style={{ marginTop: '3px' }}><strong>Dirección:</strong>&nbsp;&nbsp;{cliente.direccion}</div>}
          {cliente?.telefono && <div style={{ marginTop: '3px' }}><strong>Teléfono:</strong>&nbsp;&nbsp;{cliente.telefono}</div>}
          {cliente?.email && <div style={{ marginTop: '3px' }}><strong>Email:</strong>&nbsp;&nbsp;{cliente.email}</div>}
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

      {/* Resumen unidades */}
      {(() => {
        const totalBot = items.reduce((s, it) => s + it.cantidad, 0)
        const cajas = Math.floor(totalBot / 6)
        const resto = totalBot % 6
        const resumen = cajas === 0
          ? `${totalBot} botella${totalBot !== 1 ? 's' : ''}`
          : resto === 0
            ? `${totalBot} botellas · ${cajas} caja${cajas !== 1 ? 's' : ''} de 6`
            : `${totalBot} botellas · ${cajas} caja${cajas !== 1 ? 's' : ''} de 6 + ${resto} bot`
        return (
          <div style={{ fontSize: '10px', color: '#555', textAlign: 'right', marginBottom: 8, marginTop: -4 }}>
            Total: <strong>{resumen}</strong>
          </div>
        )
      })()}

      {/* Totales */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <table style={{ fontSize: '11px', borderCollapse: 'collapse', minWidth: 240 }}>
          <tbody>
            <tr>
              <td style={{ padding: '3px 10px', color: '#555' }}>Subtotal:</td>
              <td style={{ padding: '3px 10px', textAlign: 'right' }}>${venta.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
            </tr>
            {venta.descuento > 0 && (
              <tr>
                <td style={{ padding: '3px 10px', color: '#555' }}>Descuento ({venta.descuento}%):</td>
                <td style={{ padding: '3px 10px', textAlign: 'right', color: '#888' }}>
                  -${((venta.subtotal * venta.descuento) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding: '3px 10px', color: '#555' }}>Neto gravado:</td>
              <td style={{ padding: '3px 10px', textAlign: 'right' }}>${netoGravado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 10px', color: '#555' }}>IVA 21%:</td>
              <td style={{ padding: '3px 10px', textAlign: 'right' }}>${importeIVA.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
            </tr>
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

      {/* CAE — solo aparece si la venta fue facturada electrónicamente */}
      {venta.cae && (
        <div style={{ marginTop: '16px', padding: '10px 14px', border: '1px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#555', marginBottom: 4 }}>
              Comprobante Electrónico — {venta.cbte_tipo === 1 ? 'FACTURA A' : 'FACTURA B'}
            </div>
            {venta.nro_cbte_afip && (
              <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: 2 }}>N°: {venta.nro_cbte_afip}</div>
            )}
            <div style={{ fontSize: '10px' }}>CAE: <strong>{venta.cae}</strong></div>
            {venta.cae_vto && (
              <div style={{ fontSize: '10px' }}>
                Vto. CAE: {venta.cae_vto.slice(0,4)}/{venta.cae_vto.slice(4,6)}/{venta.cae_vto.slice(6,8)}
              </div>
            )}
          </div>
          <div style={{ fontSize: '9px', color: '#555', textAlign: 'right' }}>
            Factura electrónica<br />según RG AFIP 2485
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px', paddingTop: '10px', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#999' }}>
        <span>{empresa.nombre} — {empresa.cuit}</span>
        <span>Emitido: {fecha}</span>
      </div>
    </div>
  )
}

// ─── PrintFactura — formato oficial AFIP Factura A / B ────────────────────────
function PrintFactura({ venta, tipo, empresa }: {
  venta: Venta
  tipo: 1 | 6
  empresa: { nombre: string; cuit: string; domicilio: string; telefono: string; logoPath: string }
}) {
  const items   = venta.items as (VentaItem & { descuento?: number })[]
  const letra   = tipo === 1 ? 'A' : 'B'
  const ptoVta  = venta.nro_cbte_afip?.split('-')[1] || '00001'
  const nroCbte = venta.nro_cbte_afip?.split('-')[2] || '00000001'
  const fecha   = new Date(venta.created_at || Date.now()).toLocaleDateString('es-AR')

  // Si es preview sin CAE real, mostrar placeholder
  const cae    = venta.cae    || '75XXXXXXXXXXXXXX'
  const caeVto = venta.cae_vto || '20261231'
  const caeVtoFmt = `${caeVto.slice(6,8)}/${caeVto.slice(4,6)}/${caeVto.slice(0,4)}`

  // Cálculo IVA
  const neto       = parseFloat((venta.total / 1.21).toFixed(2))
  const iva21      = parseFloat((venta.total - neto).toFixed(2))

  const TD: React.CSSProperties = { padding: '2px 4px', verticalAlign: 'top' }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#000', maxWidth: '780px', margin: '0 auto' }}>

      {/* ── Encabezado: 3 columnas ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', border: '1px solid #000' }}>
        <tbody>
          <tr>
            {/* Col izquierda — datos emisor */}
            <td style={{ ...TD, width: '42%', padding: '10px 14px', borderRight: '1px solid #000' }}>
              <img src={empresa.logoPath} alt={empresa.nombre} style={{ height: 48, objectFit: 'contain', marginBottom: 6 }} />
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: 4 }}>{empresa.nombre}</div>
              <div>Domicilio Comercial: {empresa.domicilio}</div>
              <div style={{ marginTop: 2 }}>Condición frente al IVA: <strong>Responsable Inscripto</strong></div>
            </td>

            {/* Col central — letra */}
            <td style={{ width: '16%', textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #000', padding: '8px' }}>
              <div style={{ border: '2px solid #000', display: 'inline-block', width: 54, height: 54, lineHeight: '54px', fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>
                {letra}
              </div>
              <div style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.05em' }}>FACTURA</div>
              <div style={{ fontSize: '8px', color: '#555', marginTop: 2 }}>COD. 00{tipo}</div>
            </td>

            {/* Col derecha — número y fechas */}
            <td style={{ ...TD, width: '42%', padding: '10px 14px' }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: '9px', color: '#555' }}>N° de Comprobante</span><br />
                <strong style={{ fontSize: '14px' }}>{ptoVta} - {nroCbte}</strong>
              </div>
              <div style={{ marginBottom: 2 }}><strong>Fecha de emisión:</strong> {fecha}</div>
              <div style={{ marginBottom: 2 }}><strong>C.U.I.T.:</strong> {empresa.cuit}</div>
              <div style={{ marginBottom: 2 }}><strong>Ingresos Brutos:</strong> {empresa.cuit}</div>
              <div><strong>Inicio de Actividades:</strong> 01/01/2010</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Datos cliente ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', border: '1px solid #000' }}>
        <tbody>
          <tr>
            <td style={{ ...TD, padding: '8px 14px', width: '60%', borderRight: '1px solid #000' }}>
              <div><strong>Apellido y Nombre / Razón Social:</strong> {venta.cliente_nombre}</div>
              <div style={{ marginTop: 3 }}><strong>Condición frente al IVA:</strong> {tipo === 1 ? 'Responsable Inscripto' : 'Consumidor Final'}</div>
              {venta.notas && <div style={{ marginTop: 3 }}><strong>Notas:</strong> {venta.notas}</div>}
            </td>
            <td style={{ ...TD, padding: '8px 14px', width: '40%' }}>
              <div><strong>Condición de venta:</strong> {(venta as unknown as Record<string,unknown>).condicion_venta as string || 'Contado'}</div>
              {tipo === 1 && <div style={{ marginTop: 3 }}><strong>C.U.I.T.:</strong> ___________________________</div>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Tabla de productos ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#f0f0f0', border: '1px solid #000' }}>
            <th style={{ padding: '5px 8px', textAlign: 'center', width: 50, borderRight: '1px solid #ccc' }}>Cant.</th>
            <th style={{ padding: '5px 8px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Descripción</th>
            <th style={{ padding: '5px 8px', textAlign: 'center', width: 50, borderRight: '1px solid #ccc' }}>U.Med.</th>
            <th style={{ padding: '5px 8px', textAlign: 'right', width: 110, borderRight: '1px solid #ccc' }}>Precio Unit.</th>
            {tipo === 1 && <th style={{ padding: '5px 8px', textAlign: 'center', width: 60, borderRight: '1px solid #ccc' }}>% Bonif.</th>}
            <th style={{ padding: '5px 8px', textAlign: 'right', width: 110 }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '5px 8px', textAlign: 'center', borderRight: '1px solid #eee' }}>{item.cantidad}</td>
              <td style={{ padding: '5px 8px', borderRight: '1px solid #eee' }}>{item.nombre}</td>
              <td style={{ padding: '5px 8px', textAlign: 'center', borderRight: '1px solid #eee' }}>un.</td>
              <td style={{ padding: '5px 8px', textAlign: 'right', borderRight: '1px solid #eee' }}>
                {(item.precio_unitario / 1.21).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </td>
              {tipo === 1 && <td style={{ padding: '5px 8px', textAlign: 'center', borderRight: '1px solid #eee' }}>{item.descuento ? `${item.descuento}%` : '—'}</td>}
              <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                {(item.subtotal / 1.21).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
          {/* filas vacías para dar espacio */}
          {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
            <tr key={`e${i}`} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td colSpan={tipo === 1 ? 6 : 5} style={{ padding: '5px 8px' }}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Resumen unidades */}
      {(() => {
        const totalBot = items.reduce((s, it) => s + it.cantidad, 0)
        const cajas = Math.floor(totalBot / 6)
        const resto = totalBot % 6
        const resumen = cajas === 0
          ? `${totalBot} botella${totalBot !== 1 ? 's' : ''}`
          : resto === 0
            ? `${totalBot} botellas · ${cajas} caja${cajas !== 1 ? 's' : ''} de 6`
            : `${totalBot} botellas · ${cajas} caja${cajas !== 1 ? 's' : ''} de 6 + ${resto} bot`
        return (
          <div style={{ fontSize: '10px', color: '#555', textAlign: 'right', marginBottom: 8, marginTop: -8 }}>
            Total: <strong>{resumen}</strong>
          </div>
        )
      })()}

      {/* ── Totales + IVA ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '11px', minWidth: 260, border: '1px solid #000' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '4px 12px', color: '#555' }}>Subtotal (neto gravado):</td>
              <td style={{ padding: '4px 12px', textAlign: 'right' }}>${neto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
            </tr>
            {venta.descuento > 0 && (
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '4px 12px', color: '#555' }}>Descuento ({venta.descuento}%):</td>
                <td style={{ padding: '4px 12px', textAlign: 'right', color: '#888' }}>-</td>
              </tr>
            )}
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '4px 12px', color: '#555' }}>IVA 21%:</td>
              <td style={{ padding: '4px 12px', textAlign: 'right' }}>${iva21.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style={{ background: '#f0f0f0' }}>
              <td style={{ padding: '6px 12px', fontWeight: 'bold', fontSize: '13px' }}>TOTAL:</td>
              <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                ${venta.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── CAE ── */}
      <div style={{ border: '1px solid #000', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
            Comprobante Electrónico — CAE
          </div>
          <div style={{ fontSize: '11px' }}>CAE N°: <strong>{cae}</strong></div>
          <div style={{ fontSize: '11px', marginTop: 2 }}>Fecha de Vto. de CAE: <strong>{caeVtoFmt}</strong></div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '9px', color: '#777' }}>
          {!venta.cae && <div style={{ color: '#e07030', fontWeight: 'bold', marginBottom: 4 }}>⚠ VISTA PREVIA — CAE de ejemplo</div>}
          <div>Factura electrónica</div>
          <div>RG AFIP 2485</div>
        </div>
      </div>
    </div>
  )
}
