'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { connectPrinter, disconnectPrinter, printCanvas, testPrint, PRINTER_WIDTH_DOTS, type LabelPrinterPort } from '@/lib/labelPrinter'

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
  const bases = {
    default: { background: T.surface, border: `1px solid ${T.border}`, color: T.muted },
    accent:  { background: T.wine, border: `1px solid ${T.wine}`, color: '#FFFFFF' },
    ghost:   { background: 'transparent', border: '1px solid transparent', color: T.muted },
    danger:  { background: T.redBg, border: `1px solid ${T.redBd}`, color: T.red },
    green:   { background: T.greenBg, border: `1px solid ${T.greenBd}`, color: T.green },
  }
  return { ...bases[v], borderRadius: 7, padding: '7px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s', ...ex }
}

const INP: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
  color: T.text, padding: '8px 11px', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', width: '100%',
}

interface Producto {
  id: string; nombre: string; bodega: string; varietal: string
  categoria: string; precio_venta: number; precio_mayorista?: number; sku?: string; region?: string
}

// ── Label canvas renderer ──────────────────────────────────────────────────
const LABEL_W = PRINTER_WIDTH_DOTS   // 384px = 50mm
const LABEL_H = 240                  // height in dots (~30mm) — adjust if needed

function renderLabel(canvas: HTMLCanvasElement, data: LabelData) {
  const ctx = canvas.getContext('2d')!
  canvas.width  = LABEL_W
  canvas.height = LABEL_H

  // White background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, LABEL_W, LABEL_H)

  const pad = 12

  // ── Nombre del vino ──
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'left'
  const nombre = data.nombre || 'Nombre del vino'
  // wrap if long
  const words = nombre.split(' ')
  let line = ''; const lines: string[] = []
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > LABEL_W - pad * 2) { lines.push(line); line = w }
    else line = test
  }
  lines.push(line)
  lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, pad, 36 + i * 32))

  // ── Bodega ──
  const yBodega = lines.length > 1 ? 106 : 76
  ctx.font = '20px Arial'
  ctx.fillStyle = '#333333'
  ctx.fillText(data.bodega || '', pad, yBodega)

  // ── Varietal / Region ──
  const sub = [data.varietal, data.region].filter(Boolean).join(' · ')
  ctx.font = '16px Arial'
  ctx.fillStyle = '#666666'
  ctx.fillText(sub, pad, yBodega + 24)

  // ── Línea separadora ──
  ctx.strokeStyle = '#CCCCCC'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad, LABEL_H - 56)
  ctx.lineTo(LABEL_W - pad, LABEL_H - 56)
  ctx.stroke()

  // ── Precio ──
  if (data.precio) {
    ctx.font = 'bold 36px Arial'
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'right'
    ctx.fillText(`$${Number(data.precio).toLocaleString('es-AR')}`, LABEL_W - pad, LABEL_H - 16)
  }

  // ── SKU / Categoría ──
  ctx.font = '14px Arial'
  ctx.fillStyle = '#999999'
  ctx.textAlign = 'left'
  const meta = [data.categoria, data.sku ? `SKU: ${data.sku}` : ''].filter(Boolean).join('  ·  ')
  ctx.fillText(meta, pad, LABEL_H - 16)
}

interface LabelData {
  nombre: string; bodega: string; varietal: string; region: string
  categoria: string; precio: string; sku: string
}

const LABEL_EMPTY: LabelData = { nombre: '', bodega: '', varietal: '', region: '', categoria: '', precio: '', sku: '' }

export default function EtiquetasPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [sugsOpen, setSugsOpen] = useState(false)
  const [labelData, setLabelData] = useState<LabelData>({ ...LABEL_EMPTY })
  const [copias, setCopias] = useState(1)
  const [port, setPort] = useState<LabelPrinterPort | null>(null)
  const [printing, setPrinting] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'ok'|'err'>('ok')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const busqRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e)
    fetch(`/api/productos?empresa=${e}`)
      .then(r => r.json()).then(d => setProductos(Array.isArray(d) ? d : []))
  }, [])

  // Re-render label whenever data changes
  useEffect(() => {
    if (canvasRef.current) renderLabel(canvasRef.current, labelData)
  }, [labelData])

  function showToast(msg: string, type: 'ok'|'err' = 'ok') {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(''), 3500)
  }

  function selProducto(p: Producto) {
    setLabelData({
      nombre: p.nombre,
      bodega: p.bodega || '',
      varietal: p.varietal || '',
      region: p.region || '',
      categoria: p.categoria || '',
      precio: String(p.precio_venta || ''),
      sku: p.sku || '',
    })
    setBusqueda(p.nombre)
    setSugsOpen(false)
  }

  const filtrados = productos.filter(p =>
    `${p.nombre} ${p.bodega} ${p.varietal}`.toLowerCase().includes(busqueda.toLowerCase())
  ).slice(0, 12)

  async function conectar() {
    try {
      const p = await connectPrinter()
      setPort(p)
      showToast('Impresora conectada ✓', 'ok')
    } catch (e) {
      showToast('Error al conectar: ' + (e as Error).message, 'err')
    }
  }

  async function desconectar() {
    if (port) { await disconnectPrinter(port); setPort(null); showToast('Desconectada') }
  }

  async function testear() {
    if (!port) { showToast('Conectá la impresora primero', 'err'); return }
    try {
      await testPrint(port)
      showToast('Test enviado — si no imprimió, probá el otro COM', 'ok')
    } catch (e) {
      showToast('Error: ' + (e as Error).message, 'err')
    }
  }

  async function imprimir() {
    if (!port) { showToast('Conectá la impresora primero', 'err'); return }
    if (!canvasRef.current) return
    setPrinting(true)
    try {
      for (let i = 0; i < copias; i++) {
        await printCanvas(port, canvasRef.current)
        if (i < copias - 1) await new Promise(r => setTimeout(r, 600))
      }
      showToast(`${copias} etiqueta${copias > 1 ? 's' : ''} enviada${copias > 1 ? 's' : ''} ✓`, 'ok')
    } catch (e) {
      showToast('Error al imprimir: ' + (e as Error).message, 'err')
    } finally {
      setPrinting(false)
    }
  }

  const field = (key: keyof LabelData, label: string) => (
    <div key={key}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <input style={INP} value={labelData[key]} onChange={e => setLabelData(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  )

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
      <style>{`
        .ebtn:hover{opacity:.85} .einp:focus{border-color:#C8BAA8!important;box-shadow:0 0 0 3px rgba(128,0,0,.08)!important}
        .esugg:hover{background:rgba(128,0,0,.05)!important}
      `}</style>

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Etiquetas</div>
          <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>Impresora Bluetooth P1 — 50mm</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {port ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.green, fontWeight: 600 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green }} />
                Conectada
              </div>
              <button className="ebtn" style={btn('default', { fontSize: 12 })} onClick={testear}>Test</button>
              <button className="ebtn" style={btn('danger', { fontSize: 12 })} onClick={desconectar}>Desconectar</button>
            </>
          ) : (
            <button className="ebtn" style={btn('accent')} onClick={conectar}>
              🔵 Conectar impresora
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── LEFT: controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Buscar producto */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Cargar desde productos</div>
            <div style={{ position: 'relative' }}>
              <input
                ref={busqRef}
                className="einp"
                style={{ ...INP, paddingLeft: 34 }}
                placeholder="Buscar vino, bodega..."
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setSugsOpen(true) }}
                onFocus={() => setSugsOpen(true)}
                onBlur={() => setTimeout(() => setSugsOpen(false), 160)}
              />
              <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.dim, fontSize: 14 }}>🔍</div>
              {sugsOpen && busqueda.length > 0 && filtrados.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(26,18,16,0.1)', maxHeight: 260, overflowY: 'auto', marginTop: 4 }}>
                  {filtrados.map(p => (
                    <div key={p.id} className="esugg" onMouseDown={() => selProducto(p)}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{p.nombre}</div>
                      <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{p.bodega} · {p.varietal} — ${p.precio_venta?.toLocaleString('es-AR')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editar campos */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>Contenido de la etiqueta</div>
            {field('nombre', 'Nombre del vino')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {field('bodega', 'Bodega')}
              {field('varietal', 'Varietal')}
              {field('region', 'Región')}
              {field('categoria', 'Categoría')}
              {field('precio', 'Precio ($)')}
              {field('sku', 'SKU')}
            </div>
          </div>

          {/* Imprimir */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Imprimir</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Copias:</div>
              <button className="ebtn" style={btn('default', { padding: '4px 10px', fontSize: 16 })} onClick={() => setCopias(c => Math.max(1, c - 1))}>−</button>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, minWidth: 28, textAlign: 'center' }}>{copias}</div>
              <button className="ebtn" style={btn('default', { padding: '4px 10px', fontSize: 16 })} onClick={() => setCopias(c => Math.min(99, c + 1))}>+</button>
            </div>
            {!port && (
              <div style={{ fontSize: 12, color: T.amber, background: T.amberBg, border: `1px solid ${T.amberBd}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                Conectá la impresora primero con el botón de arriba.<br />
                Cuando aparezca el selector de puerto, elegí el COM más alto (ej. COM5 antes que COM4).
              </div>
            )}
            <button
              className="ebtn"
              style={btn('accent', { width: '100%', padding: '10px', fontSize: 14, fontWeight: 700, opacity: printing ? 0.6 : 1 })}
              onClick={imprimir}
              disabled={printing}
            >
              {printing ? 'Enviando...' : `🖨️  Imprimir ${copias > 1 ? `${copias} etiquetas` : 'etiqueta'}`}
            </button>
          </div>

          {/* Instrucciones COM */}
          <div style={{ background: T.goldBg, border: `1px solid ${T.goldBd}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 8 }}>¿Cuál COM elegir?</div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
              Windows crea 2 COM para BT. El correcto suele ser el de <strong>número más alto</strong>.<br />
              Si no imprime, desconectá y conectá de vuelta eligiendo el otro COM.<br />
              Podés usar el botón <strong>Test</strong> para verificar sin diseñar la etiqueta.
            </div>
          </div>
        </div>

        {/* ── RIGHT: preview ── */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Vista previa</div>
          <div style={{ background: '#f0f0f0', border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Scale the canvas to fit nicely in the UI */}
            <div style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', borderRadius: 4 }}>
              <canvas
                ref={canvasRef}
                style={{ display: 'block', width: '100%', maxWidth: 480, height: 'auto', imageRendering: 'pixelated' }}
              />
            </div>
            <div style={{ fontSize: 11, color: T.dim }}>
              {PRINTER_WIDTH_DOTS}px × 240px · 50mm × ~30mm a 203 DPI
            </div>
          </div>

          {/* Ajustes avanzados */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Ajustes si la etiqueta no escala bien</div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7 }}>
              • Si el texto aparece <strong>cortado a la derecha</strong>: el ancho real es menor. Probá cambiando <code>PRINTER_WIDTH_DOTS = 384</code> a <code>320</code> en <code>src/lib/labelPrinter.ts</code><br />
              • Si aparece <strong>muy angosto</strong>: probá <code>576</code> (para rollo 72mm)<br />
              • Si imprime <strong>solo texto sin gráfico</strong>: el printer no soporta raster mode. Avisá y hacemos versión solo texto (ESC/POS texto plano)<br />
              • Baud rate alternativo: si no responde en 9600, cambiá a <code>115200</code> en <code>connectPrinter()</code>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          background: toastType === 'err' ? T.redBg : T.surface,
          border: `1px solid ${toastType === 'err' ? T.redBd : T.border}`,
          color: toastType === 'err' ? T.red : T.text,
          borderRadius: 10, padding: '12px 20px', fontSize: 13,
          boxShadow: '0 4px 20px rgba(26,18,16,0.12)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
