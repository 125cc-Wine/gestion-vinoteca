'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
import {
  connectPrinter, disconnectPrinter, initPrinter, printCanvas, testPrint,
  renderLabel, renderCaja, PRINTER_W, PRINTER_H, feedNextLabel,
  type LabelPrinterPort, type LabelData, type LabelFormat, type CajaLabelData,
} from '@/lib/labelPrinter'
import wooUrls from '@/data/wooUrls.json'

function normStr(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}
function lookupWooUrl(nombre: string): string {
  const n = normStr(nombre)
  if (!n) return ''
  const exact = (wooUrls as { title: string; url: string }[]).find(w => normStr(w.title) === n)
  if (exact) return exact.url
  const starts = (wooUrls as { title: string; url: string }[]).find(
    w => normStr(w.title).startsWith(n) || n.startsWith(normStr(w.title))
  )
  if (starts) return starts.url
  const includes = (wooUrls as { title: string; url: string }[]).find(
    w => normStr(w.title).includes(n) || n.includes(normStr(w.title))
  )
  return includes?.url || ''
}

const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8',
  text: '#1A1210', muted: '#6B5D55', dim: '#A89888',
  wine: '#800000', wineBg: 'rgba(128,0,0,0.07)', wineBd: 'rgba(128,0,0,0.18)',
  green: '#2D7A4F', greenBg: 'rgba(45,122,79,0.08)', greenBd: 'rgba(45,122,79,0.22)',
  red: '#C03030', redBg: 'rgba(192,48,48,0.08)', redBd: 'rgba(192,48,48,0.22)',
  gold: '#B88A2C', goldBg: 'rgba(184,138,44,0.08)', goldBd: 'rgba(184,138,44,0.22)',
  amber: '#A07010', amberBg: 'rgba(160,112,16,0.07)', amberBd: 'rgba(160,112,16,0.22)',
}
function btn(v: 'default'|'accent'|'ghost'|'danger'|'green' = 'default', ex: React.CSSProperties = {}): React.CSSProperties {
  const b = {
    default: { background: T.surface, border: `1px solid ${T.border}`, color: T.muted },
    accent:  { background: T.wine,    border: `1px solid ${T.wine}`,   color: '#fff' },
    ghost:   { background: 'transparent', border: '1px solid transparent', color: T.muted },
    danger:  { background: T.redBg,   border: `1px solid ${T.redBd}`,  color: T.red },
    green:   { background: T.greenBg, border: `1px solid ${T.greenBd}`,color: T.green },
  }
  return { ...b[v], borderRadius: 7, padding: '7px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s', ...ex }
}
const INP: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
  color: T.text, padding: '8px 11px', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', width: '100%',
}

interface Producto {
  id: string; nombre: string; bodega: string; varietal: string
  categoria: string; precio_venta: number; sku?: string; region?: string
  woo_product_id?: number
}

interface PedidoItem { producto_id?: string; nombre: string; cantidad: number }
interface Pedido {
  id: string; numero?: string; cliente_nombre: string; tipo?: string
  items: PedidoItem[]; created_at?: string
}
interface Caja { items: { nombre: string; cantidad: number }[] }

const FORMATS: { id: LabelFormat; label: string; desc: string }[] = [
  { id: 'cava',    label: 'Etiqueta cava',   desc: '50×45mm · nombre, bodega, varietal, precio + QR' },
  { id: 'precio',  label: 'Precio rápido',   desc: '50×25mm · precio grande, ideal gondola' },
  { id: 'botella', label: 'Sticker botella', desc: '25×37mm × 2 en tira · para pegar en botella' },
]

const EMPTY: LabelData = { nombre: '', bodega: '', varietal: '', region: '', categoria: '', precio: '', sku: '', wooUrl: '' }

export default function EtiquetasPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [sugsOpen, setSugsOpen] = useState(false)
  const [data, setData] = useState<LabelData>({ ...EMPTY })
  const [format, setFormat] = useState<LabelFormat>('cava')
  const [wooBase, setWooBase] = useState('https://aromadevid.com.ar/?p=')
  const [copias, setCopias] = useState(1)
  const [port, setPort] = useState<LabelPrinterPort | null>(null)
  const [printing, setPrinting] = useState(false)
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ── Tab: Cajas / despacho ──────────────────────────────────────────────
  const [tab, setTab] = useState<'producto' | 'cajas'>('producto')
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [pedidosCargados, setPedidosCargados] = useState(false)
  const [pedidoId, setPedidoId] = useState('')
  const [cajas, setCajas] = useState<Caja[]>([{ items: [] }])
  const [cajaActiva, setCajaActiva] = useState(0)
  const [cantAgregar, setCantAgregar] = useState<Record<string, number>>({})
  const [cajaPreview, setCajaPreview] = useState(0)
  const [cajaFontSize, setCajaFontSize] = useState(19)
  const canvasCajaRef = useRef<HTMLCanvasElement>(null)

  const pedidoSel = pedidos.find(p => p.id === pedidoId) || null

  // En la práctica no se usa el módulo "Pedidos" — lo que arma cada despacho
  // es un Presupuesto (tipo de comprobante en Ventas), así que las cajas se
  // arman a partir de ahí.
  async function cargarPedidos() {
    if (pedidosCargados) return
    const r = await fetch(`/api/ventas?empresa=${empresa}`)
    const d = await r.json()
    const presupuestos = (Array.isArray(d) ? d : []).filter((v: Pedido) => v.tipo === 'presupuesto')
    setPedidos(presupuestos)
    setPedidosCargados(true)
  }

  function elegirPedido(id: string) {
    setPedidoId(id)
    setCajas([{ items: [] }])
    setCajaActiva(0)
    setCajaPreview(0)
    const p = pedidos.find(x => x.id === id)
    if (p) {
      const init: Record<string, number> = {}
      for (const it of p.items) init[it.nombre] = it.cantidad
      setCantAgregar(init)
    }
  }

  function asignadoDe(nombre: string): number {
    return cajas.reduce((a, c) => a + c.items.filter(i => i.nombre === nombre).reduce((s, i) => s + i.cantidad, 0), 0)
  }

  function agregarACaja(nombre: string) {
    const cant = cantAgregar[nombre] || 0
    if (cant <= 0) return
    setCajas(prev => prev.map((c, i) => {
      if (i !== cajaActiva) return c
      const existente = c.items.find(it => it.nombre === nombre)
      if (existente) return { items: c.items.map(it => it.nombre === nombre ? { ...it, cantidad: it.cantidad + cant } : it) }
      return { items: [...c.items, { nombre, cantidad: cant }] }
    }))
  }

  function quitarDeCaja(cajaIdx: number, nombre: string) {
    setCajas(prev => prev.map((c, i) => i !== cajaIdx ? c : { items: c.items.filter(it => it.nombre !== nombre) }))
  }

  function nuevaCaja() {
    setCajas(prev => [...prev, { items: [] }])
    setCajaActiva(cajas.length)
  }

  function ajustarFontSize(n: number) {
    const v = Math.max(12, Math.min(28, n))
    setCajaFontSize(v)
    localStorage.setItem('caja_font_size', String(v))
  }

  function borrarCaja(idx: number) {
    if (cajas.length === 1) { setCajas([{ items: [] }]); return }
    setCajas(prev => prev.filter((_, i) => i !== idx))
    setCajaActiva(a => Math.max(0, a >= idx ? a - 1 : a))
    setCajaPreview(p => Math.max(0, p >= idx ? p - 1 : p))
  }

  async function imprimirCajas() {
    if (!port) { toast$('Conectá la impresora primero', true); return }
    if (!canvasCajaRef.current || !pedidoSel) return
    const cajasConItems = cajas.filter(c => c.items.length > 0)
    if (cajasConItems.length === 0) { toast$('No hay cajas con productos', true); return }
    setPrinting(true)
    try {
      await initPrinter(port)
      const fecha = new Date().toLocaleDateString('es-AR')
      for (let i = 0; i < cajasConItems.length; i++) {
        renderCaja(canvasCajaRef.current, {
          cajaNum: i + 1, cajaTotal: cajasConItems.length,
          pedidoNumero: pedidoSel.numero || pedidoSel.id.slice(0, 8).toUpperCase(),
          clienteNombre: pedidoSel.cliente_nombre, fecha,
          items: cajasConItems[i].items,
          itemFontSize: cajaFontSize,
        })
        // Esperar el próximo frame para que el canvas termine de dibujar antes de leerlo.
        await new Promise(r => requestAnimationFrame(r))
        await printCanvas(port, canvasCajaRef.current)
      }
      toast$(`${cajasConItems.length} etiqueta${cajasConItems.length !== 1 ? 's' : ''} de caja impresa${cajasConItems.length !== 1 ? 's' : ''} ✓`)
    } catch (e) { toast$('Error: ' + (e as Error).message, true) }
    finally { setPrinting(false) }
  }

  useEffect(() => {
    if (tab === 'cajas') cargarPedidos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useEffect(() => {
    if (tab !== 'cajas' || !canvasCajaRef.current) return
    const cajasConItems = cajas.filter(c => c.items.length > 0)
    const c = cajasConItems[cajaPreview] || cajasConItems[0]
    if (!c || !pedidoSel) return
    renderCaja(canvasCajaRef.current, {
      cajaNum: cajaPreview + 1, cajaTotal: cajasConItems.length,
      pedidoNumero: pedidoSel.numero || pedidoSel.id.slice(0, 8).toUpperCase(),
      clienteNombre: pedidoSel.cliente_nombre,
      fecha: new Date().toLocaleDateString('es-AR'),
      items: c.items,
      itemFontSize: cajaFontSize,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, cajas, cajaPreview, pedidoSel, cajaFontSize])

  useEffect(() => {
    const fs = parseInt(localStorage.getItem('caja_font_size') || '')
    if (fs) setCajaFontSize(fs)
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e)
    fetch(`/api/productos?empresa=${e}`).then(r => r.json()).then(d => {
      const prods: Producto[] = Array.isArray(d) ? d : []
      setProductos(prods)
      // Pre-fill from productos page 🏷️ button
      const raw = localStorage.getItem('etiqueta_prefill')
      if (raw) {
        try {
          const p: Producto = JSON.parse(raw)
          localStorage.removeItem('etiqueta_prefill')
          const wooUrl = lookupWooUrl(p.nombre)
            || (p.woo_product_id ? `https://aromadevid.com.ar/?p=${p.woo_product_id}` : '')
          setData({ nombre: p.nombre, bodega: p.bodega || '', varietal: p.varietal || '',
            region: p.region || '', categoria: p.categoria || '',
            precio: String(p.precio_venta || ''), sku: p.sku || '', wooUrl })
          setBusqueda(p.nombre)
        } catch { /**/ }
      }
    })
  }, [])

  const redraw = useCallback(async () => {
    if (canvasRef.current) await renderLabel(canvasRef.current, data, format)
  }, [data, format])

  useEffect(() => { redraw() }, [redraw])

  function toast$(msg: string, err = false) {
    setToast(msg); setToastErr(err); setTimeout(() => setToast(''), 3500)
  }

  function selProducto(p: Producto) {
    const wooUrl = lookupWooUrl(p.nombre)
      || (p.woo_product_id ? `${wooBase}${p.woo_product_id}` : '')
    setData({ nombre: p.nombre, bodega: p.bodega || '', varietal: p.varietal || '',
      region: p.region || '', categoria: p.categoria || '',
      precio: String(p.precio_venta || ''), sku: p.sku || '', wooUrl })
    setBusqueda(p.nombre); setSugsOpen(false)
  }

  const filtrados = productos
    .filter(p => normalize(`${p.nombre} ${p.bodega} ${p.varietal} ${p.sku || ''}`).includes(normalize(busqueda)))
    .slice(0, 14)

  async function conectar() {
    try { const p = await connectPrinter(); setPort(p); toast$('Impresora conectada ✓') }
    catch (e) { toast$('Error: ' + (e as Error).message, true) }
  }
  async function desconectar() {
    if (port) { await disconnectPrinter(port); setPort(null); toast$('Desconectada') }
  }
  async function testear() {
    if (!port) { toast$('Conectá primero', true); return }
    try { await testPrint(port); toast$('Test enviado — si no salió nada, probá el otro COM') }
    catch (e) { toast$((e as Error).message, true) }
  }
  async function imprimir() {
    if (!port) { toast$('Conectá la impresora primero', true); return }
    if (!canvasRef.current) return
    setPrinting(true)
    try {
      await initPrinter(port)
      for (let i = 0; i < copias; i++) {
        await printCanvas(port, canvasRef.current)
      }
      toast$(`${copias} etiqueta${copias !== 1 ? 's' : ''} impresa${copias !== 1 ? 's' : ''} ✓`)
    } catch (e) { toast$('Error: ' + (e as Error).message, true) }
    finally { setPrinting(false) }
  }

  const field = (k: keyof LabelData, lbl: string, half = false) => (
    <div key={k} style={half ? {} : { gridColumn: '1 / -1' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{lbl}</div>
      <input style={INP} value={data[k] || ''} onChange={e => setData(f => ({ ...f, [k]: e.target.value }))} />
    </div>
  )

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
      <style>{`
        .ebtn:hover { opacity:.85 } .einp:focus { border-color:#C8BAA8!important; box-shadow:0 0 0 3px rgba(128,0,0,.08)!important }
        .erow:hover { background:rgba(128,0,0,.04)!important }
      `}</style>

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>Etiquetas</div>
          <div style={{ fontSize: 12, color: T.dim }}>Impresora Bluetooth P1 · 50mm</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {port ? (
            <>
              <span style={{ fontSize: 12, color: T.green, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, display: 'inline-block' }} />Conectada
              </span>
              <button className="ebtn" style={btn('default', { fontSize: 12 })} onClick={testear}>Test</button>
              <button className="ebtn" style={btn('default', { fontSize: 12 })} title="Avanza hasta inicio de la siguiente etiqueta"
                onClick={() => feedNextLabel(port!).catch(e => toast$(e.message, true))}>↓ Papel</button>
              <button className="ebtn" style={btn('danger', { fontSize: 12 })} onClick={desconectar}>Desconectar</button>
            </>
          ) : (
            <button className="ebtn" style={btn('accent')} onClick={conectar}>🔵 Conectar impresora</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 28px', display: 'flex', gap: 4 }}>
        {([['producto', 'Producto'], ['cajas', 'Cajas / Despacho']] as const).map(([id, label]) => (
          <button key={id} className="ebtn" onClick={() => setTab(id)}
            style={{
              background: 'none', border: 'none', borderBottom: `2px solid ${tab === id ? T.wine : 'transparent'}`,
              color: tab === id ? T.wine : T.muted, fontWeight: tab === id ? 700 : 500, fontSize: 13,
              padding: '11px 6px', margin: '0 10px 0 0', cursor: 'pointer', fontFamily: 'inherit',
            }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'producto' && (
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, padding: '24px 28px', alignItems: 'start' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Formato */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Formato</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FORMATS.map(f => (
                <button key={f.id} className="ebtn" onClick={() => setFormat(f.id)}
                  style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 9, border: `1.5px solid ${format === f.id ? T.wine : T.border}`, background: format === f.id ? T.wineBg : T.surface, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: format === f.id ? T.wine : T.text }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* URL base WooCommerce */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>URL base WooCommerce (para QR)</div>
            <input className="einp" style={INP} value={wooBase} onChange={e => setWooBase(e.target.value)} placeholder="https://aromadevid.com.ar/?p=" />
            <div style={{ fontSize: 11, color: T.dim, marginTop: 5 }}>Se concatena con el ID del producto de WooCommerce</div>
          </div>

          {/* Buscar producto */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>Cargar producto</div>
            <div style={{ position: 'relative' }}>
              <input className="einp" style={{ ...INP, paddingLeft: 34 }}
                placeholder="Buscar por nombre, bodega..."
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setSugsOpen(true) }}
                onFocus={() => setSugsOpen(true)}
                onBlur={() => setTimeout(() => setSugsOpen(false), 180)} />
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: T.dim }}>🔍</span>
              {sugsOpen && busqueda.length > 0 && filtrados.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(26,18,16,0.1)', maxHeight: 280, overflowY: 'auto', marginTop: 4 }}>
                  {filtrados.map(p => (
                    <div key={p.id} className="erow" onMouseDown={() => selProducto(p)}
                      style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{p.nombre}</div>
                      <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>
                        {[p.bodega, p.varietal].filter(Boolean).join(' · ')}
                        {p.precio_venta ? ` — $${p.precio_venta.toLocaleString('es-AR')}` : ''}
                        {p.woo_product_id ? ' · 🔗 WooCommerce' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editar contenido */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Contenido de la etiqueta</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {field('nombre', 'Nombre')}
              {field('bodega', 'Bodega', true)}
              {field('varietal', 'Varietal', true)}
              {field('region', 'Región', true)}
              {field('categoria', 'Categoría', true)}
              {field('precio', 'Precio ($)', true)}
              {field('sku', 'SKU', true)}
              {field('wooUrl', 'URL del QR')}
            </div>
          </div>

          {/* Imprimir */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Imprimir</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Copias:</span>
              <button className="ebtn" style={btn('default', { padding: '3px 10px', fontSize: 18 })} onClick={() => setCopias(c => Math.max(1, c-1))}>−</button>
              <span style={{ fontSize: 18, fontWeight: 700, color: T.text, minWidth: 28, textAlign: 'center' }}>{copias}</span>
              <button className="ebtn" style={btn('default', { padding: '3px 10px', fontSize: 18 })} onClick={() => setCopias(c => Math.min(99, c+1))}>+</button>
            </div>
            {!port && (
              <div style={{ fontSize: 12, color: T.amber, background: T.amberBg, border: `1px solid ${T.amberBd}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                Conectá la impresora arriba. Al elegir el puerto COM, probá el de número más alto.
              </div>
            )}
            <button className="ebtn" onClick={imprimir} disabled={printing}
              style={btn('accent', { width: '100%', padding: '10px', fontSize: 14, fontWeight: 700, opacity: printing ? 0.6 : 1 })}>
              {printing ? 'Enviando...' : `🖨️  Imprimir${copias > 1 ? ` ${copias} copias` : ''}`}
            </button>
          </div>
        </div>

        {/* ── RIGHT: Preview ── */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Vista previa · {FORMATS.find(f => f.id === format)?.label}</div>
          <div style={{ background: '#e8e8e8', border: `1px solid ${T.border}`, borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', borderRadius: 4 }}>
              <canvas ref={canvasRef}
                style={{ display: 'block', width: '100%', maxWidth: 500, height: 'auto' }} />
            </div>
            <div style={{ fontSize: 11, color: '#888', textAlign: 'center' }}>
              {PRINTER_W}×{PRINTER_H} dots (50×44mm) · ~203 DPI · negro sobre papel térmico
            </div>
          </div>

          {/* Ayuda */}
          <div style={{ marginTop: 16, background: T.goldBg, border: `1px solid ${T.goldBd}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 8 }}>💡 Calibración</div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7 }}>
              • <strong>Texto cortado</strong>: cambiá <code>PRINTER_W</code> de 384 a 320 en labelPrinter.ts<br/>
              • <strong>Sin respuesta</strong>: desconectá y conectá al otro puerto COM<br/>
              • <strong>QR no genera</strong>: el producto no tiene ID de WooCommerce cargado
            </div>
          </div>
        </div>
      </div>
      )}

      {tab === 'cajas' && (() => {
        const cajasConItems = cajas.filter(c => c.items.length > 0)
        return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 380px', gap: 24, padding: '24px 28px', alignItems: 'start' }}>

          {/* ── Pedido + items ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>Presupuesto a despachar</div>
              <select className="einp" style={INP} value={pedidoId} onChange={e => elegirPedido(e.target.value)}>
                <option value="">— Elegir presupuesto —</option>
                {pedidos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.numero || p.id.slice(0, 8).toUpperCase()} · {p.cliente_nombre}
                    {p.created_at ? ` · ${new Date(p.created_at).toLocaleDateString('es-AR')}` : ''}
                  </option>
                ))}
              </select>
              {pedidos.length === 0 && pedidosCargados && (
                <div style={{ fontSize: 12, color: T.dim, marginTop: 8 }}>No hay presupuestos cargados para esta empresa.</div>
              )}
            </div>

            {pedidoSel && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>
                  Items del presupuesto — agregar a Caja {cajaActiva + 1}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pedidoSel.items.map(it => {
                    const asignado = asignadoDe(it.nombre)
                    const restante = it.cantidad - asignado
                    return (
                      <div key={it.nombre} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: T.bg, borderRadius: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.nombre}</div>
                          <div style={{ fontSize: 11, color: restante > 0 ? T.amber : T.green, marginTop: 2 }}>
                            {restante > 0 ? `Faltan ${restante} de ${it.cantidad}` : `✓ Asignado (${it.cantidad})`}
                          </div>
                        </div>
                        <input type="number" min={0} max={Math.max(0, restante)} style={{ ...INP, width: 54, padding: '5px 6px', textAlign: 'center' }}
                          value={cantAgregar[it.nombre] ?? 0}
                          onChange={e => setCantAgregar(prev => ({ ...prev, [it.nombre]: Math.max(0, parseInt(e.target.value) || 0) }))} />
                        <button className="ebtn" style={btn('default', { padding: '5px 10px', fontSize: 12 })}
                          disabled={restante <= 0 || (cantAgregar[it.nombre] ?? 0) <= 0}
                          onClick={() => agregarACaja(it.nombre)}>+ Agregar</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Cajas armadas ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Cajas</div>
                <button className="ebtn" style={btn('default', { fontSize: 12, padding: '5px 12px' })} onClick={nuevaCaja}>+ Nueva caja</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cajas.map((c, idx) => (
                  <div key={idx}
                    onClick={() => setCajaActiva(idx)}
                    style={{ border: `1.5px solid ${cajaActiva === idx ? T.wine : T.border}`, background: cajaActiva === idx ? T.wineBg : T.bg, borderRadius: 9, padding: '10px 12px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: c.items.length ? 6 : 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: cajaActiva === idx ? T.wine : T.text }}>
                        Caja {idx + 1} {cajaActiva === idx ? '(activa)' : ''}
                      </span>
                      <button className="ebtn" style={btn('ghost', { fontSize: 11, padding: '3px 8px', color: T.red })}
                        onClick={e => { e.stopPropagation(); borrarCaja(idx) }}>Borrar</button>
                    </div>
                    {c.items.map(it => (
                      <div key={it.nombre} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.muted, padding: '2px 0' }}>
                        <span>{it.cantidad} × {it.nombre}</span>
                        <span onClick={e => { e.stopPropagation(); quitarDeCaja(idx, it.nombre) }} style={{ cursor: 'pointer', color: T.dim }}>✕</span>
                      </div>
                    ))}
                    {c.items.length === 0 && <div style={{ fontSize: 11, color: T.dim, fontStyle: 'italic' }}>Vacía</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Preview + imprimir ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Vista previa</div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Tamaño de letra (items)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="ebtn" style={btn('default', { padding: '3px 10px', fontSize: 16 })} onClick={() => ajustarFontSize(cajaFontSize - 1)}>−</button>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.text, minWidth: 22, textAlign: 'center' }}>{cajaFontSize}</span>
                <button className="ebtn" style={btn('default', { padding: '3px 10px', fontSize: 16 })} onClick={() => ajustarFontSize(cajaFontSize + 1)}>+</button>
              </div>
            </div>

            {cajasConItems.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {cajasConItems.map((_, i) => (
                  <button key={i} className="ebtn" onClick={() => setCajaPreview(i)}
                    style={{ ...btn(cajaPreview === i ? 'accent' : 'default', { padding: '4px 10px', fontSize: 12 }) }}>
                    Caja {i + 1}
                  </button>
                ))}
              </div>
            )}
            <div style={{ background: '#e8e8e8', border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', borderRadius: 4 }}>
                <canvas ref={canvasCajaRef} style={{ display: 'block', width: '100%', maxWidth: 340, height: 'auto' }} />
              </div>
              {cajasConItems.length === 0 && (
                <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>Agregá productos a una caja para ver la vista previa</div>
              )}
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
              {!port && (
                <div style={{ fontSize: 12, color: T.amber, background: T.amberBg, border: `1px solid ${T.amberBd}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                  Conectá la impresora arriba para poder imprimir.
                </div>
              )}
              <button className="ebtn" onClick={imprimirCajas} disabled={printing || cajasConItems.length === 0}
                style={btn('accent', { width: '100%', padding: '10px', fontSize: 14, fontWeight: 700, opacity: (printing || cajasConItems.length === 0) ? 0.5 : 1 })}>
                {printing ? 'Imprimiendo...' : `🖨️  Imprimir ${cajasConItems.length} etiqueta${cajasConItems.length !== 1 ? 's' : ''} de caja`}
              </button>
            </div>
          </div>
        </div>
        )
      })()}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, background: toastErr ? T.redBg : T.surface, border: `1px solid ${toastErr ? T.redBd : T.border}`, color: toastErr ? T.red : T.text, borderRadius: 10, padding: '12px 20px', fontSize: 13, boxShadow: '0 4px 20px rgba(26,18,16,0.1)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
