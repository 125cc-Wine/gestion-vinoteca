'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  connectPrinter, disconnectPrinter, printCanvas, testPrint,
  renderLabel, PRINTER_W,
  type LabelPrinterPort, type LabelData, type LabelFormat,
} from '@/lib/labelPrinter'

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

  useEffect(() => {
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
          const base = 'https://aromadevid.com.ar/?p='
          setWooBase(base)
          setData({ nombre: p.nombre, bodega: p.bodega || '', varietal: p.varietal || '',
            region: p.region || '', categoria: p.categoria || '',
            precio: String(p.precio_venta || ''), sku: p.sku || '',
            wooUrl: p.woo_product_id ? `${base}${p.woo_product_id}` : '' })
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
    const wooUrl = p.woo_product_id ? `${wooBase}${p.woo_product_id}` : ''
    setData({ nombre: p.nombre, bodega: p.bodega || '', varietal: p.varietal || '',
      region: p.region || '', categoria: p.categoria || '',
      precio: String(p.precio_venta || ''), sku: p.sku || '', wooUrl })
    setBusqueda(p.nombre); setSugsOpen(false)
  }

  const filtrados = productos
    .filter(p => `${p.nombre} ${p.bodega} ${p.varietal}`.toLowerCase().includes(busqueda.toLowerCase()))
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
      for (let i = 0; i < copias; i++) {
        await printCanvas(port, canvasRef.current)
        if (i < copias - 1) await new Promise(r => setTimeout(r, 700))
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
              <button className="ebtn" style={btn('danger', { fontSize: 12 })} onClick={desconectar}>Desconectar</button>
            </>
          ) : (
            <button className="ebtn" style={btn('accent')} onClick={conectar}>🔵 Conectar impresora</button>
          )}
        </div>
      </div>

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
                style={{ display: 'block', width: '100%', maxWidth: 500, height: 'auto', imageRendering: 'pixelated' }} />
            </div>
            <div style={{ fontSize: 11, color: '#888', textAlign: 'center' }}>
              {PRINTER_W}px ancho · 203 DPI · imprime en negro sobre papel térmico
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

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, background: toastErr ? T.redBg : T.surface, border: `1px solid ${toastErr ? T.redBd : T.border}`, color: toastErr ? T.red : T.text, borderRadius: 10, padding: '12px 20px', fontSize: 13, boxShadow: '0 4px 20px rgba(26,18,16,0.1)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
