'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import BarcodeScanner from '@/components/BarcodeScanner'
import BarcodeNotFoundModal from '@/components/BarcodeNotFoundModal'
import { useBarcodeInput } from '@/hooks/useBarcodeInput'
import { supabase } from '@/lib/supabase'

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8',
  wine: '#800000', wineDark: '#6A0000', wineBg: 'rgba(128,0,0,0.07)',
  text: '#1A1210', muted: '#6B5D55', dim: '#A89888',
  green: '#2D7A4F', greenBg: 'rgba(45,122,79,0.08)', greenBd: 'rgba(45,122,79,0.22)',
  red: '#C03030', redBg: 'rgba(192,48,48,0.08)',
  amber: '#A07010', amberBg: 'rgba(160,112,16,0.07)', amberBd: 'rgba(160,112,16,0.22)',
  blue: '#2B5EA0', blueBg: 'rgba(43,94,160,0.08)',
}

const MULT: Record<string, number> = { botella: 1, caja4: 4, caja6: 6, caja12: 12 }
type Unidad = 'botella' | 'caja4' | 'caja6' | 'caja12'
type Modo = 'agregar' | 'establecer'
type Tab = 'consultar' | 'cargar' | 'historial' | 'bodegas' | 'anadas'

interface Producto {
  id: string; nombre: string; bodega?: string; varietal?: string
  stock: number; stock_minimo?: number; precio_venta: number; codigo_barras?: string; sku?: string
  categoria?: string; anada?: string
}

interface StockItem {
  id: string; nombre: string; stockActual: number; qty: number; unit: Unidad
}

interface StockLog {
  id: string; nombre: string; delta: number; nuevoStock: number
  modo: Modo; timestamp: string; empresa: string
}

async function addLog(log: Omit<StockLog, 'id' | 'timestamp'>): Promise<boolean> {
  const { error } = await supabase.from('movimientos_stock').insert([{
    empresa:     log.empresa,
    nombre:      log.nombre,
    delta:       log.delta,
    nuevo_stock: log.nuevoStock,
    modo:        log.modo,
  }])
  if (error) console.error('addLog error:', error.message)
  return !error
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ── Consultar tab ──────────────────────────────────────────────────────────────
function ConsultarTab({ empresa }: { empresa: string }) {
  const [producto, setProducto] = useState<Producto | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [barcodeNotFound, setBarcodeNotFound] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [resultados, setResultados] = useState<Producto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [editStock, setEditStock] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const lookupBarcode = useCallback(async (code: string) => {
    setScannerOpen(false)
    setNotFound(false)
    setSearch('')
    setResultados([])
    const res = await fetch(`/api/productos?empresa=${empresa}&barcode=${encodeURIComponent(code)}`)
    const prod = await res.json()
    if (!prod?.id) { setBarcodeNotFound(code); return }
    setProducto(prod)
    setEditStock(prod.stock)
  }, [empresa])

  useBarcodeInput(lookupBarcode, !scannerOpen)

  useEffect(() => {
    if (search.length < 2) { setResultados([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      const res = await fetch(`/api/productos?empresa=${empresa}`)
      const all: Producto[] = await res.json()
      const q = normalize(search)
      setResultados(all.filter(p => normalize(`${p.nombre} ${p.bodega || ''} ${p.varietal || ''}`).includes(q)).slice(0, 10))
      setBuscando(false)
    }, 250)
  }, [search, empresa])

  async function guardarStock() {
    if (!producto || editStock === null) return
    setGuardando(true)
    const res = await fetch('/api/productos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: producto.id, stock: editStock }),
    })
    if (res.ok) {
      const logged = await addLog({ nombre: producto.nombre, delta: editStock - producto.stock, nuevoStock: editStock, modo: 'establecer', empresa })
      setProducto({ ...producto, stock: editStock })
      const minimo = producto.stock_minimo ?? 0
      const msg = logged ? `Stock actualizado: ${editStock} bot` : `Stock actualizado (error en historial)`
      showToast(minimo > 0 && editStock < minimo ? `Stock bajo mínimo (${editStock}/${minimo})` : msg, !(minimo > 0 && editStock < minimo))
    } else {
      showToast('Error al guardar', false)
    }
    setGuardando(false)
  }

  const cambioStock = editStock !== null && producto ? editStock - producto.stock : 0

  return (
    <div style={{ padding: 16 }}>
      {/* Search + scan */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={searchRef}
            value={search}
            onChange={e => { setSearch(e.target.value); setProducto(null); setNotFound(false) }}
            placeholder="Buscar por nombre..."
            style={{
              width: '100%', padding: '12px 14px', border: `1.5px solid ${T.border}`,
              borderRadius: 10, fontSize: 15, background: T.surface, color: T.text,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {buscando && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: T.dim, fontSize: 12 }}>...</span>}
        </div>
        <button onClick={() => setScannerOpen(true)} style={{
          padding: '0 16px', borderRadius: 10, border: `1.5px solid ${T.border}`,
          background: T.wine, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#fff',
        }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3M15 5h3a1 1 0 011 1v3M15 19h3a1 1 0 001-1v-3" />
            <line x1="7" y1="12" x2="17" y2="12" />
          </svg>
        </button>
      </div>

      {/* Search results */}
      {resultados.length > 0 && !producto && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          {resultados.map(p => (
            <button key={p.id} onClick={() => { setProducto(p); setEditStock(p.stock); setSearch(''); setResultados([]) }}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: `1px solid ${T.border}`, textAlign: 'left' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{p.nombre}</div>
                <div style={{ fontSize: 12, color: T.dim }}>{p.bodega || ''}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: p.stock <= 0 ? T.red : p.stock <= 5 ? T.amber : T.green }}>
                {p.stock}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!producto && !notFound && resultados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: T.dim }}>
          <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} style={{ marginBottom: 14, opacity: 0.3 }}>
            <path d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3M15 5h3a1 1 0 011 1v3M15 19h3a1 1 0 001-1v-3M7 12h10" />
          </svg>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Escaneá o buscá un producto</p>
          <p style={{ margin: 0, fontSize: 13 }}>La pistola también funciona automáticamente</p>
        </div>
      )}

      {/* Not found */}
      {notFound && (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: T.redBg, borderRadius: 12, color: T.red }}>
          Código no encontrado en el sistema
        </div>
      )}

      {/* Product card */}
      {producto && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '18px 18px 14px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>{producto.nombre}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: T.muted }}>
              {producto.bodega && <span>{producto.bodega}</span>}
              {producto.varietal && <span>· {producto.varietal}</span>}
              {producto.categoria && <span>· {producto.categoria}</span>}
            </div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{fmt(producto.precio_venta)}</div>
          </div>

          {/* Stock control */}
          <div style={{ padding: '20px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Stock actual</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, justifyContent: 'center', marginBottom: 16, border: `1.5px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', maxWidth: 240, margin: '0 auto 16px' }}>
              <button onClick={() => setEditStock(s => Math.max(0, (s ?? 0) - 1))} style={{
                width: 52, height: 56, border: 'none', background: T.bg, cursor: 'pointer',
                fontSize: 22, color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>−</button>
              <input
                type="number" min={0}
                placeholder="0"
                value={editStock || ''}
                onChange={e => setEditStock(parseInt(e.target.value) || 0)}
                style={{ flex: 1, height: 56, border: 'none', textAlign: 'center', fontSize: 28, fontWeight: 800, color: T.text, background: T.surface, outline: 'none', minWidth: 0 }}
              />
              <button onClick={() => setEditStock(s => (s ?? 0) + 1)} style={{
                width: 52, height: 56, border: 'none', background: T.bg, cursor: 'pointer',
                fontSize: 22, color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>+</button>
            </div>

            {cambioStock !== 0 && (
              <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 13, fontWeight: 600, color: cambioStock > 0 ? T.green : T.red }}>
                {cambioStock > 0 ? '+' : ''}{cambioStock} desde el stock registrado ({producto.stock})
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setProducto(null); setEditStock(null); setSearch('') }}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardarStock} disabled={guardando || editStock === producto.stock}
                style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: editStock === producto.stock ? T.dim : T.wine, color: '#fff', fontSize: 14, fontWeight: 700, cursor: editStock === producto.stock ? 'default' : 'pointer' }}>
                {guardando ? 'Guardando...' : 'Guardar stock'}
              </button>
            </div>
          </div>

          {/* Stock badge */}
          <div style={{ padding: '10px 18px', background: T.bg, borderTop: `1px solid ${T.border}`, display: 'flex', gap: 12, fontSize: 12, color: T.muted }}>
            <span>SKU: <strong style={{ color: T.text }}>{producto.sku || '—'}</strong></span>
            <span>Barcode: <strong style={{ color: T.text }}>{producto.codigo_barras || '—'}</strong></span>
          </div>
        </div>
      )}

      {scannerOpen && <BarcodeScanner onDetect={lookupBarcode} onClose={() => setScannerOpen(false)} titulo="Escanear producto" />}
      {barcodeNotFound && (
        <BarcodeNotFoundModal
          code={barcodeNotFound}
          empresa={empresa}
          onSelect={(prod, save) => {
            setBarcodeNotFound(null)
            if (!prod.id) return
            if (save) fetch('/api/productos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: prod.id, codigo_barras: barcodeNotFound }) })
            fetch(`/api/productos?empresa=${empresa}&barcode=${encodeURIComponent(barcodeNotFound!)}`).then(r => r.json()).then(p => { if (p?.id) { setProducto(p); setEditStock(p.stock) } })
          }}
          onClose={() => setBarcodeNotFound(null)}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? T.green : T.red, color: '#fff', padding: '10px 20px', borderRadius: 30, fontSize: 14, fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ── Cargar tab ─────────────────────────────────────────────────────────────────
function CargarTab({ empresa }: { empresa: string }) {
  const [modo, setModo] = useState<Modo>('agregar')
  const [items, setItems] = useState<StockItem[]>([])
  const [search, setSearch] = useState('')
  const [resultados, setResultados] = useState<Producto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [barcodeNotFound, setBarcodeNotFound] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (search.length < 2) { setResultados([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      const res = await fetch(`/api/productos?empresa=${empresa}`)
      const all: Producto[] = await res.json()
      const q = normalize(search)
      setResultados(all.filter(p => normalize(`${p.nombre} ${p.bodega || ''} ${p.varietal || ''}`).includes(q)).slice(0, 10))
      setBuscando(false)
    }, 250)
  }, [search, empresa])

  function addItem(p: Producto) {
    setSearch(''); setResultados([])
    searchRef.current?.focus()
    setItems(prev => prev.find(i => i.id === p.id) ? prev : [...prev, { id: p.id, nombre: p.nombre, stockActual: p.stock ?? 0, qty: 1, unit: 'botella' }])
  }

  const handleScan = useCallback(async (code: string) => {
    setScannerOpen(false)
    const res = await fetch(`/api/productos?empresa=${empresa}&barcode=${encodeURIComponent(code)}`)
    const prod = await res.json()
    if (!prod?.id) { setBarcodeNotFound(code); return }
    addItem(prod)
    showToast(prod.nombre)
  }, [empresa])

  useBarcodeInput(handleScan, !scannerOpen)

  function totalUnidades(item: StockItem) { return item.qty * MULT[item.unit] }

  async function confirmar() {
    if (!items.length) return
    setGuardando(true)
    let ok = 0; let err = 0; let logErr = 0
    for (const item of items) {
      const delta = totalUnidades(item)
      const nuevoStock = modo === 'establecer' ? delta : item.stockActual + delta
      const res = await fetch('/api/productos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, stock: nuevoStock }) })
      if (res.ok) {
        const logged = await addLog({ nombre: item.nombre, delta: modo === 'agregar' ? delta : nuevoStock - item.stockActual, nuevoStock, modo, empresa })
        if (!logged) logErr++
        ok++
      } else err++
    }
    setGuardando(false)
    if (err === 0 && logErr === 0) { showToast(`${ok} producto${ok !== 1 ? 's' : ''} actualizado${ok !== 1 ? 's' : ''}`); setItems([]) }
    else if (err === 0) { showToast(`Stock OK pero error en historial (${logErr})`, false); setItems([]) }
    else showToast(`${ok} OK, ${err} con error`, false)
  }

  const totalBot = items.reduce((s, i) => s + totalUnidades(i), 0)

  return (
    <div style={{ padding: 16 }}>
      {/* Modo */}
      <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}`, marginBottom: 14, background: T.bg }}>
        {(['agregar', 'establecer'] as Modo[]).map(m => (
          <button key={m} onClick={() => setModo(m)} style={{ flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: modo === m ? T.wine : 'transparent', color: modo === m ? '#fff' : T.muted }}>
            {m === 'agregar' ? '+ Sumar' : '= Establecer'}
          </button>
        ))}
      </div>

      {/* Search + scan */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..."
            style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${T.border}`, borderRadius: 10, fontSize: 15, background: T.surface, color: T.text, outline: 'none', boxSizing: 'border-box' }} />
          {buscando && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: T.dim, fontSize: 12 }}>...</span>}
        </div>
        <button onClick={() => setScannerOpen(true)} style={{ padding: '0 16px', borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', color: T.muted }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3M15 5h3a1 1 0 011 1v3M15 19h3a1 1 0 001-1v-3" />
            <line x1="7" y1="12" x2="17" y2="12" />
          </svg>
        </button>
      </div>

      {/* Search results */}
      {resultados.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          {resultados.map(p => (
            <button key={p.id} onClick={() => addItem(p)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: `1px solid ${T.border}`, textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{p.nombre}</div>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.wine} strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
            </button>
          ))}
        </div>
      )}

      {/* Empty */}
      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: T.dim, border: `2px dashed ${T.border}`, borderRadius: 14, marginTop: 8 }}>
          <p style={{ margin: 0, fontSize: 14 }}>Escaneá o buscá para agregar productos</p>
        </div>
      )}

      {/* Items */}
      <div style={{ contain: 'layout', overflow: 'hidden' }}>
        {items.map(item => {
          const total = totalUnidades(item)
          const nuevoStock = modo === 'establecer' ? total : item.stockActual + total
          return (
            <div key={item.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{item.nombre}</div>
                  <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>Stock actual: {item.stockActual} bot.</div>
                </div>
                <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} style={{ padding: 6, border: 'none', background: T.redBg, borderRadius: 8, cursor: 'pointer', color: T.red, marginLeft: 10 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', border: `1.5px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => setItems(p => p.map(i => i.id === item.id ? { ...i, qty: Math.max(0, i.qty - 1) } : i))} style={{ width: 36, height: 40, border: 'none', background: T.bg, cursor: 'pointer', fontSize: 18, color: T.muted }}>−</button>
                  <input type="number" value={item.qty || ''} min={0} placeholder="0"
                    onChange={e => setItems(p => p.map(i => i.id === item.id ? { ...i, qty: parseInt(e.target.value) || 0 } : i))}
                    style={{ width: 52, height: 40, border: 'none', textAlign: 'center', fontSize: 16, fontWeight: 700, color: T.text, background: T.surface, outline: 'none' }} />
                  <button onClick={() => setItems(p => p.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i))} style={{ width: 36, height: 40, border: 'none', background: T.bg, cursor: 'pointer', fontSize: 18, color: T.muted }}>+</button>
                </div>
                <select value={item.unit} onChange={e => setItems(p => p.map(i => i.id === item.id ? { ...i, unit: e.target.value as Unidad } : i))}
                  style={{ flex: 1, height: 40, padding: '0 10px', border: `1.5px solid ${T.border}`, borderRadius: 8, fontSize: 14, color: T.text, background: T.surface, cursor: 'pointer', outline: 'none' }}>
                  <option value="botella">Botella ×1</option>
                  <option value="caja4">Caja ×4</option>
                  <option value="caja6">Caja ×6</option>
                  <option value="caja12">Caja ×12</option>
                </select>
                <div style={{ padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: modo === 'establecer' ? T.blueBg : T.greenBg, color: modo === 'establecer' ? T.blue : T.green, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {modo === 'agregar' ? '+' : '='}{total}
                </div>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: T.muted }}>
                {modo === 'agregar'
                  ? <>{item.stockActual} + {total} = <strong style={{ color: T.green }}>{nuevoStock} bot</strong></>
                  : <>Stock final: <strong style={{ color: T.blue }}>{nuevoStock} bot</strong></>}
              </div>
            </div>
          )
        })}
      </div>

      {items.length > 0 && (
        <div style={{ position: 'sticky', bottom: 80, paddingTop: 8 }}>
          <button onClick={confirmar} disabled={guardando} style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: guardando ? T.dim : T.wine, color: '#fff', fontSize: 16, fontWeight: 700, cursor: guardando ? 'default' : 'pointer' }}>
            {guardando ? 'Guardando...' : `Confirmar — ${items.length} prod, ${totalBot} bot`}
          </button>
        </div>
      )}

      {scannerOpen && <BarcodeScanner onDetect={handleScan} onClose={() => setScannerOpen(false)} />}
      {barcodeNotFound && (
        <BarcodeNotFoundModal code={barcodeNotFound} empresa={empresa}
          onSelect={(prod, save) => {
            setBarcodeNotFound(null)
            if (!prod.id) return
            if (save) fetch('/api/productos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: prod.id, codigo_barras: barcodeNotFound }) })
            fetch(`/api/productos?empresa=${empresa}`).then(r => r.json()).then((all: Producto[]) => { const p = all.find(x => x.id === prod.id); if (p) addItem(p) })
          }}
          onClose={() => setBarcodeNotFound(null)}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? T.green : T.red, color: '#fff', padding: '10px 20px', borderRadius: 30, fontSize: 14, fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ── Bodegas tab ───────────────────────────────────────────────────────────────
function BodegasTab({ empresa }: { empresa: string }) {
  const [rows, setRows] = useState<{ bodega: string; productos: number; stock: number; valor: number }[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch(`/api/productos?empresa=${empresa}`)
      .then(r => r.json())
      .then((prods: Producto[]) => {
        const map: Record<string, { productos: number; stock: number; valor: number }> = {}
        for (const p of prods) {
          const b = p.bodega || '(Sin bodega)'
          if (!map[b]) map[b] = { productos: 0, stock: 0, valor: 0 }
          map[b].productos++
          map[b].stock  += p.stock ?? 0
          map[b].valor  += (p.stock ?? 0) * (p.precio_venta ?? 0)
        }
        setRows(Object.entries(map).map(([bodega, d]) => ({ bodega, ...d })).sort((a, b) => b.valor - a.valor))
        setCargando(false)
      })
  }, [empresa])

  const totalStock = rows.reduce((s, r) => s + r.stock, 0)
  const totalValor = rows.reduce((s, r) => s + r.valor, 0)

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: T.dim, fontSize: 14 }}>Cargando...</div>

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 0 }}>
          <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: T.dim, borderBottom: `1px solid ${T.border}`, background: T.bg }}>BODEGA</div>
          <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: T.dim, borderBottom: `1px solid ${T.border}`, background: T.bg, textAlign: 'right' }}>PRODS</div>
          <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: T.dim, borderBottom: `1px solid ${T.border}`, background: T.bg, textAlign: 'right' }}>STOCK</div>
          <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: T.dim, borderBottom: `1px solid ${T.border}`, background: T.bg, textAlign: 'right' }}>VALOR</div>
          {rows.map((r, i) => (
            <>
              <div key={`n${i}`} style={{ padding: '12px 14px', fontSize: 14, fontWeight: 600, color: T.text, borderBottom: `1px solid ${T.border}` }}>{r.bodega}</div>
              <div key={`p${i}`} style={{ padding: '12px 14px', fontSize: 13, color: T.muted, borderBottom: `1px solid ${T.border}`, textAlign: 'right' }}>{r.productos}</div>
              <div key={`s${i}`} style={{ padding: '12px 14px', fontSize: 13, color: r.stock > 0 ? T.text : T.dim, borderBottom: `1px solid ${T.border}`, textAlign: 'right', fontWeight: r.stock > 0 ? 600 : 400 }}>{r.stock} bot</div>
              <div key={`v${i}`} style={{ padding: '12px 14px', fontSize: 13, color: T.green, borderBottom: `1px solid ${T.border}`, textAlign: 'right', fontWeight: 600 }}>
                {fmt(r.valor)}
              </div>
            </>
          ))}
          <div style={{ padding: '12px 14px', fontSize: 14, fontWeight: 700, color: T.text }}>TOTAL</div>
          <div style={{ padding: '12px 14px', textAlign: 'right' }} />
          <div style={{ padding: '12px 14px', fontSize: 14, fontWeight: 700, color: T.text, textAlign: 'right' }}>{totalStock} bot</div>
          <div style={{ padding: '12px 14px', fontSize: 14, fontWeight: 700, color: T.green, textAlign: 'right' }}>{fmt(totalValor)}</div>
        </div>
      </div>
    </div>
  )
}

// ── Añadas tab ────────────────────────────────────────────────────────────────
interface AnadaItem {
  id: string
  anada_id: string
  producto_id?: string
  producto_nombre: string
  bodega?: string
  varietal?: string
  stock: number
  precio: number
}
interface AnadaConItems {
  id: string
  anio: string
  descripcion?: string
  activo: boolean
  anada_items: AnadaItem[]
}
const INP_A: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: `1.5px solid ${T.border}`,
  borderRadius: 9, fontSize: 14, background: '#fff', color: T.text, outline: 'none', boxSizing: 'border-box' as const,
}
const LBL_A: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: T.muted,
  textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4,
}

function fmtPrecio(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

// ── Registrar sub-view ────────────────────────────────────────────────────────
function RegistrarAnadaView({ empresa, onGuardado }: { empresa: string; onGuardado: () => void }) {
  const [search, setSearch] = useState('')
  const [resultados, setResultados] = useState<Producto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [wine, setWine] = useState<Producto | null>(null)
  const [anio, setAnio] = useState('')
  const [anioCustom, setAnioCustom] = useState(false)
  const [stock, setStock] = useState(1)
  const [precio, setPrecio] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [ultimo, setUltimo] = useState<string | null>(null)
  // Creación rápida de producto
  const [nuevoVino, setNuevoVino] = useState<{ nombre: string; bodega: string; varietal: string } | null>(null)
  const [creando, setCreando] = useState(false)
  const [errorCrear, setErrorCrear] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const anioActual = new Date().getFullYear()
  const anios = Array.from({ length: 9 }, (_, i) => String(anioActual - i))

  useEffect(() => {
    if (search.length < 2) { setResultados([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      const res = await fetch(`/api/productos?empresa=${empresa}`)
      const all: Producto[] = await res.json().catch(() => [])
      const q = normalize(search)
      setResultados(all.filter(p => normalize(`${p.nombre} ${p.bodega || ''} ${p.varietal || ''}`).includes(q)).slice(0, 8))
      setBuscando(false)
    }, 250)
  }, [search, empresa])

  async function crearYSeleccionar() {
    if (!nuevoVino || !nuevoVino.nombre.trim()) return
    setCreando(true)
    setErrorCrear(null)
    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa,
          nombre: nuevoVino.nombre.trim(),
          bodega: nuevoVino.bodega.trim() || null,
          varietal: nuevoVino.varietal.trim() || null,
          activo: true,
          stock: 0,
          precio_venta: 0,
        }),
      })
      const data = await res.json()
      if (data.error || !data.id) {
        setErrorCrear(data.error ?? 'No se pudo crear el producto')
        return
      }
      setWine(data as Producto)
      setNuevoVino(null)
      setErrorCrear(null)
      setSearch('')
      setResultados([])
    } catch {
      setErrorCrear('Error de conexión, intentá de nuevo')
    } finally {
      setCreando(false)
    }
  }

  async function confirmar() {
    if (!wine || !anio || stock <= 0) return
    setGuardando(true)
    const res = await fetch('/api/anadas/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anio, producto_id: wine.id, producto_nombre: wine.nombre, bodega: wine.bodega, varietal: wine.varietal, stock, precio }),
    })
    const data = await res.json()
    setGuardando(false)
    if (data.error) return
    setUltimo(`${wine.nombre} → Añada ${anio} (${stock} bot${precio ? ', ' + fmtPrecio(precio) + ' c/u' : ''})`)
    setWine(null); setSearch(''); setAnio(''); setStock(1); setPrecio(0); setAnioCustom(false)
    onGuardado()
    setTimeout(() => searchRef.current?.focus(), 80)
  }

  const listo = !!wine && !!anio && stock > 0

  return (
    <div style={{ padding: 16 }}>
      {ultimo && (
        <div style={{ background: T.greenBg, border: `1px solid ${T.greenBd}`, borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: T.green, fontWeight: 600 }}>
          ✓ {ultimo}
        </div>
      )}

      {/* Paso 1: Vino */}
      <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', background: T.bg, borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
          1 · Seleccioná el vino
        </div>
        <div style={{ padding: 12 }}>
          {!wine ? (
            nuevoVino ? (
              /* ── Formulario creación rápida ── */
              <div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>
                  Nuevo vino — completá los datos y continuá
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={LBL_A}>Nombre *</label>
                    <input style={INP_A} autoFocus value={nuevoVino.nombre}
                      onChange={e => setNuevoVino(v => v && ({ ...v, nombre: e.target.value }))}
                      placeholder="Ej: Reserva Malbec 750ml" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={LBL_A}>Bodega</label>
                      <input style={INP_A} value={nuevoVino.bodega}
                        onChange={e => setNuevoVino(v => v && ({ ...v, bodega: e.target.value }))}
                        placeholder="Ej: Zuccardi" />
                    </div>
                    <div>
                      <label style={LBL_A}>Varietal</label>
                      <input style={INP_A} value={nuevoVino.varietal}
                        onChange={e => setNuevoVino(v => v && ({ ...v, varietal: e.target.value }))}
                        placeholder="Ej: Malbec" />
                    </div>
                  </div>
                  {errorCrear && (
                    <div style={{ background: T.redBg, border: `1px solid rgba(192,48,48,0.22)`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: T.red, fontWeight: 600 }}>
                      {errorCrear}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <button onClick={() => { setNuevoVino(null); setErrorCrear(null); setTimeout(() => searchRef.current?.focus(), 50) }}
                      style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: `1px solid ${T.border}`, background: T.bg, color: T.muted, fontSize: 13, cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <button onClick={crearYSeleccionar} disabled={creando || !nuevoVino.nombre.trim()}
                      style={{ flex: 2, padding: '9px 0', borderRadius: 9, border: 'none', background: nuevoVino.nombre.trim() ? T.wine : T.dim, color: '#fff', fontSize: 13, fontWeight: 700, cursor: nuevoVino.nombre.trim() && !creando ? 'pointer' : 'default' }}>
                      {creando ? 'Creando...' : 'Crear y seleccionar'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Búsqueda normal ── */
              <div style={{ position: 'relative' }}>
                <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, bodega, varietal..." autoFocus
                  style={{ ...INP_A, paddingRight: buscando ? 36 : undefined }} />
                {buscando && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: T.dim, fontSize: 12 }}>...</span>}
                {search.length >= 2 && !buscando && (
                  <div style={{ border: `1px solid ${T.border}`, borderRadius: 9, overflow: 'hidden', marginTop: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    {resultados.map(p => (
                      <button key={p.id} onClick={() => { setWine(p); setSearch(''); setResultados([]) }}
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', padding: '10px 12px', border: 'none', borderBottom: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{p.nombre}</span>
                        <span style={{ fontSize: 12, color: T.muted }}>{[p.bodega, p.varietal].filter(Boolean).join(' · ')}</span>
                      </button>
                    ))}
                    {/* Opción crear nuevo — siempre visible cuando hay texto */}
                    <button onClick={() => setNuevoVino({ nombre: search, bodega: '', varietal: '' })}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: 'none', background: T.bg, cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ width: 20, height: 20, borderRadius: 6, background: T.wine, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>+</span>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.wine }}>Crear "{search}"</span>
                        <span style={{ fontSize: 11, color: T.muted, display: 'block' }}>Nuevo vino · no está en el catálogo</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{wine.nombre}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{[wine.bodega, wine.varietal].filter(Boolean).join(' · ')}</div>
              </div>
              <button onClick={() => { setWine(null); setTimeout(() => searchRef.current?.focus(), 50) }}
                style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${T.border}`, background: 'transparent', color: T.muted, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                Cambiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Paso 2: Año */}
      <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 10, overflow: 'hidden', opacity: wine ? 1 : 0.45 }}>
        <div style={{ padding: '9px 14px', background: T.bg, borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
          2 · Año de la añada
        </div>
        <div style={{ padding: '12px 12px 10px' }}>
          {!anioCustom ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {anios.map(y => (
                <button key={y} onClick={() => wine && setAnio(prev => prev === y ? '' : y)} style={{
                  padding: '7px 14px', borderRadius: 8,
                  border: `1.5px solid ${anio === y ? T.wine : T.border}`,
                  background: anio === y ? T.wine : '#fff',
                  color: anio === y ? '#fff' : T.text,
                  fontSize: 14, fontWeight: 700, cursor: wine ? 'pointer' : 'default',
                }}>{y}</button>
              ))}
              <button onClick={() => wine && (setAnioCustom(true), setAnio(''))} style={{
                padding: '7px 12px', borderRadius: 8, border: `1.5px dashed ${T.border}`,
                background: 'transparent', color: T.muted, fontSize: 13, cursor: wine ? 'pointer' : 'default',
              }}>Otro...</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...INP_A, flex: 1 }} type="number" autoFocus placeholder={`Ej: ${anioActual - 10}`}
                value={anio} onChange={e => setAnio(e.target.value)} min="1900" max={anioActual} />
              <button onClick={() => { setAnioCustom(false); setAnio('') }}
                style={{ padding: '10px 12px', borderRadius: 9, border: `1px solid ${T.border}`, background: T.bg, color: T.muted, cursor: 'pointer' }}>✕</button>
            </div>
          )}
        </div>
      </div>

      {/* Paso 3: Cantidad y precio */}
      <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 14, overflow: 'hidden', opacity: wine && anio ? 1 : 0.45 }}>
        <div style={{ padding: '9px 14px', background: T.bg, borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
          3 · Cantidad y precio
        </div>
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={LBL_A}>Botellas</label>
            <div style={{ display: 'flex', border: `1.5px solid ${T.border}`, borderRadius: 9, overflow: 'hidden', maxWidth: 180 }}>
              <button onClick={() => setStock(s => Math.max(0, s - 1))} style={{ width: 44, height: 46, border: 'none', background: T.bg, cursor: 'pointer', fontSize: 22, color: T.muted }}>−</button>
              <input type="number" min={0} placeholder="0" value={stock || ''} onChange={e => setStock(parseInt(e.target.value) || 0)}
                style={{ flex: 1, height: 46, border: 'none', textAlign: 'center', fontSize: 20, fontWeight: 800, color: T.text, background: '#fff', outline: 'none' }} />
              <button onClick={() => setStock(s => s + 1)} style={{ width: 44, height: 46, border: 'none', background: T.bg, cursor: 'pointer', fontSize: 22, color: T.muted }}>+</button>
            </div>
          </div>
          <div>
            <label style={LBL_A}>Precio por botella</label>
            <input style={INP_A} type="number" min={0} step={100} value={precio || ''} placeholder="$ 0"
              onChange={e => setPrecio(parseFloat(e.target.value) || 0)} />
            {stock > 0 && precio > 0 && (
              <div style={{ fontSize: 12, color: T.muted, marginTop: 5 }}>
                Total: <strong style={{ color: T.green }}>{fmtPrecio(stock * precio)}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      <button onClick={confirmar} disabled={!listo || guardando} style={{
        width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
        background: listo ? T.wine : T.dim, color: '#fff',
        fontSize: 15, fontWeight: 700, cursor: listo && !guardando ? 'pointer' : 'default',
      }}>
        {guardando ? 'Guardando...' : listo ? `✓ Registrar — Añada ${anio} · ${stock} bot` : 'Completá los campos para continuar'}
      </button>
    </div>
  )
}

// ── Inventario sub-view ───────────────────────────────────────────────────────
function InventarioAnadasView({ empresa, reloadKey }: { empresa: string; reloadKey: number }) {
  const [anadas, setAnadas] = useState<AnadaConItems[]>([])
  const [cargando, setCargando] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')
  const [editItem, setEditItem] = useState<AnadaItem | null>(null)
  const [editStock, setEditStock] = useState(0)
  const [editPrecio, setEditPrecio] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { cargar() }, [reloadKey])

  async function cargar() {
    setCargando(true)
    const res = await fetch('/api/anadas')
    setAnadas(await res.json().catch(() => []))
    setCargando(false)
  }

  async function eliminarItem(itemId: string) {
    await fetch(`/api/anadas/items?id=${itemId}`, { method: 'DELETE' })
    cargar(); showToast('Vino eliminado')
  }

  async function eliminarAnada(id: string) {
    if (!confirm('¿Eliminar esta añada y todos sus vinos?')) return
    await fetch(`/api/anadas?id=${id}`, { method: 'DELETE' })
    cargar(); showToast('Añada eliminada')
  }

  function abrirEdicion(item: AnadaItem) {
    setEditItem(item)
    setEditStock(item.stock)
    setEditPrecio(item.precio)
  }

  async function guardarEdicion() {
    if (!editItem) return
    setGuardando(true)
    const res = await fetch('/api/anadas/items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editItem.id, stock: editStock, precio: editPrecio }),
    })
    setGuardando(false)
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error, false); return }
    setEditItem(null)
    cargar()
    showToast('Ítem actualizado')
  }

  const anioActual = new Date().getFullYear()

  const anadasFiltradas = filtro.trim()
    ? anadas.filter(a => {
        const q = filtro.toLowerCase()
        return a.anio.includes(q) ||
          (a.anada_items ?? []).some(i =>
            `${i.producto_nombre} ${i.bodega || ''} ${i.varietal || ''}`.toLowerCase().includes(q)
          )
      })
    : anadas

  const totalGStock = anadasFiltradas.reduce((s, a) => s + (a.anada_items ?? []).reduce((ss, i) => ss + i.stock, 0), 0)
  const totalGValor = anadasFiltradas.reduce((s, a) => s + (a.anada_items ?? []).reduce((ss, i) => ss + i.stock * i.precio, 0), 0)

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: T.dim, fontSize: 14 }}>Cargando...</div>

  return (
    <div style={{ padding: 16 }}>
      {anadas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: T.dim, border: `2px dashed ${T.border}`, borderRadius: 14 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Sin añadas registradas</p>
          <p style={{ margin: '4px 0 0', fontSize: 13 }}>Usá "Registrar" para agregar vinos a una añada</p>
        </div>
      ) : (
        <>
          {/* Buscador */}
          <input
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            placeholder="Buscar por año, vino, bodega..."
            style={{ ...INP_A, marginBottom: 12 }}
          />

          {/* Totales */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div style={{ background: T.greenBg, border: `1px solid ${T.greenBd}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock total</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginTop: 2 }}>{totalGStock} <span style={{ fontSize: 13, fontWeight: 400, color: T.muted }}>bot</span></div>
            </div>
            <div style={{ background: T.amberBg, border: `1px solid ${T.amberBd}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor total</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginTop: 2 }}>{fmtPrecio(totalGValor)}</div>
            </div>
          </div>

          {anadasFiltradas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: T.dim, fontSize: 13 }}>
              Sin resultados para "{filtro}"
            </div>
          )}

          {anadasFiltradas.map(a => {
            const items = a.anada_items ?? []
            const stockTotal = items.reduce((s, i) => s + i.stock, 0)
            const valorTotal = items.reduce((s, i) => s + i.stock * i.precio, 0)
            const diff = anioActual - parseInt(a.anio)
            const badge = diff <= 2
              ? { label: 'Joven',    color: T.green, bg: T.greenBg, bd: T.greenBd }
              : diff <= 6
              ? { label: 'En punto', color: T.wine,  bg: 'rgba(128,0,0,0.07)', bd: 'rgba(128,0,0,0.18)' }
              : { label: 'Reserva',  color: T.amber, bg: T.amberBg, bd: T.amberBd }
            const expandido = expandedId === a.id
            return (
              <div key={a.id} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
                <div onClick={() => setExpandedId(expandido ? null : a.id)}
                  style={{ padding: '14px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{a.anio}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: badge.bg, border: `1px solid ${badge.bd}`, color: badge.color }}>{badge.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: T.muted }}>
                      <span>{items.length} vino{items.length !== 1 ? 's' : ''}</span>
                      <span style={{ color: T.text, fontWeight: 600 }}>{stockTotal} bot</span>
                      <span style={{ color: T.green, fontWeight: 600 }}>{fmtPrecio(valorTotal)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={e => { e.stopPropagation(); eliminarAnada(a.id) }}
                      style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid rgba(192,48,48,0.22)`, background: T.redBg, color: T.red, fontSize: 11, cursor: 'pointer' }}>×</button>
                    <span style={{ color: T.dim, fontSize: 13 }}>{expandido ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expandido && (
                  <div style={{ borderTop: `1px solid ${T.border}`, background: '#FDFAF6' }}>
                    {items.length === 0 ? (
                      <div style={{ padding: '20px 14px', textAlign: 'center', color: T.dim, fontSize: 13 }}>Sin vinos registrados</div>
                    ) : items.map(item => (
                      <div key={item.id} style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.producto_nombre}</div>
                          <div style={{ fontSize: 11, color: T.muted }}>{[item.bodega, item.varietal].filter(Boolean).join(' · ')}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.stock} bot</div>
                          <div style={{ fontSize: 11, color: T.green }}>{fmtPrecio(item.stock * item.precio)}</div>
                        </div>
                        <button onClick={() => abrirEdicion(item)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.muted, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>✎</button>
                        <button onClick={() => eliminarItem(item.id)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid rgba(192,48,48,0.22)`, background: T.redBg, color: T.red, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {/* Modal edición de ítem */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.5)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setEditItem(null)}>
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 480, padding: '20px 20px 32px', boxShadow: '0 -8px 32px rgba(26,18,16,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{editItem.producto_nombre}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{[editItem.bodega, editItem.varietal].filter(Boolean).join(' · ')}</div>
              </div>
              <button onClick={() => setEditItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={LBL_A}>Botellas</label>
                <div style={{ display: 'flex', border: `1.5px solid ${T.border}`, borderRadius: 9, overflow: 'hidden' }}>
                  <button onClick={() => setEditStock(s => Math.max(0, s - 1))} style={{ width: 40, height: 44, border: 'none', background: T.bg, cursor: 'pointer', fontSize: 20, color: T.muted }}>−</button>
                  <input type="number" min={0} placeholder="0" value={editStock || ''} onChange={e => setEditStock(parseInt(e.target.value) || 0)}
                    style={{ flex: 1, height: 44, border: 'none', textAlign: 'center', fontSize: 18, fontWeight: 800, color: T.text, background: '#fff', outline: 'none' }} />
                  <button onClick={() => setEditStock(s => s + 1)} style={{ width: 40, height: 44, border: 'none', background: T.bg, cursor: 'pointer', fontSize: 20, color: T.muted }}>+</button>
                </div>
              </div>
              <div>
                <label style={LBL_A}>Precio / bot</label>
                <input style={{ ...INP_A, height: 44, fontSize: 16 }} type="number" min={0} step={100}
                  value={editPrecio || ''} placeholder="$ 0"
                  onChange={e => setEditPrecio(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            {editStock > 0 && editPrecio > 0 && (
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 14, textAlign: 'center' }}>
                Total: <strong style={{ color: T.green }}>{fmtPrecio(editStock * editPrecio)}</strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditItem(null)} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.muted, fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardarEdicion} disabled={guardando} style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: T.wine, color: '#fff', fontSize: 14, fontWeight: 700, cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? T.green : T.red, color: '#fff', padding: '10px 20px', borderRadius: 30, fontSize: 14, fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ── AnadasTab wrapper ──────────────────────────────────────────────────────────
function AnadasTab({ empresa }: { empresa: string }) {
  const [subView, setSubView] = useState<'registrar' | 'inventario'>('registrar')
  const [inventarioKey, setInventarioKey] = useState(0)

  return (
    <div>
      <div style={{ display: 'flex', background: '#fff', borderBottom: `1px solid ${T.border}` }}>
        {([['registrar', '+ Registrar'], ['inventario', '≡ Inventario']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setSubView(key)}
            style={{
              flex: 1, padding: '12px 8px', border: 'none', background: 'transparent',
              borderBottom: `2.5px solid ${subView === key ? T.wine : 'transparent'}`,
              color: subView === key ? T.wine : T.muted,
              fontSize: 14, fontWeight: subView === key ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit',
            }}>
            {label}
          </button>
        ))}
      </div>
      {subView === 'registrar' && (
        <RegistrarAnadaView empresa={empresa} onGuardado={() => setInventarioKey(k => k + 1)} />
      )}
      {subView === 'inventario' && (
        <InventarioAnadasView empresa={empresa} reloadKey={inventarioKey} />
      )}
    </div>
  )
}

// ── Historial tab ──────────────────────────────────────────────────────────────
function HistorialTab({ empresa }: { empresa: string }) {
  const [logs, setLogs] = useState<StockLog[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setCargando(true)
    supabase
      .from('movimientos_stock')
      .select('*')
      .eq('empresa', empresa)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLogs((data ?? []).map(d => ({
          id: d.id, nombre: d.nombre, delta: d.delta,
          nuevoStock: d.nuevo_stock, modo: d.modo as Modo,
          timestamp: d.created_at, empresa: d.empresa,
        })))
        setCargando(false)
      })
  }, [empresa])

  async function limpiar() {
    await supabase.from('movimientos_stock').delete().eq('empresa', empresa)
    setLogs([])
  }

  if (cargando) {
    return <div style={{ padding: 40, textAlign: 'center', color: T.dim, fontSize: 14 }}>Cargando...</div>
  }

  if (logs.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center', paddingTop: 60, color: T.dim }}>
        <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} style={{ marginBottom: 12, opacity: 0.3 }}>
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Sin movimientos registrados</p>
        <p style={{ margin: '4px 0 0', fontSize: 13 }}>Los cambios de stock desde Depósito aparecen acá</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: T.muted }}>{logs.length} movimiento{logs.length !== 1 ? 's' : ''}</div>
        <button onClick={limpiar} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.red, cursor: 'pointer' }}>
          Limpiar historial
        </button>
      </div>
      <div style={{ contain: 'layout', overflow: 'hidden' }}>
        {logs.map(log => {
          const positivo = log.delta >= 0
          return (
            <div key={log.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: positivo ? T.greenBg : T.redBg, border: `1px solid ${positivo ? T.greenBd : 'rgba(192,48,48,0.22)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 800, color: positivo ? T.green : T.red }}>
                {positivo ? '+' : '−'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.nombre}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                  {log.modo === 'agregar'
                    ? <>{positivo ? '+' : ''}{log.delta} bot → <strong style={{ color: T.text }}>{log.nuevoStock} total</strong></>
                    : <>Establecido en <strong style={{ color: T.text }}>{log.nuevoStock} bot</strong></>
                  }
                  <span style={{ color: T.dim }}> · {fmtDate(log.timestamp)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function DepositoPage() {
  const [empresa, setEmpresa] = useState('')
  const [tab, setTab] = useState<Tab>('consultar')

  useEffect(() => {
    setEmpresa(localStorage.getItem('empresa') || 'aroma')
  }, [])

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'consultar', label: 'Consultar',  icon: 'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z' },
    { key: 'cargar',    label: 'Cargar',     icon: 'M12 5v14M5 12h14' },
    { key: 'bodegas',   label: 'Por bodega', icon: 'M3 21V5a2 2 0 012-2h14a2 2 0 012 2v16M9 21V9h6v12M3 5l9-3 9 3' },
    { key: 'anadas',    label: 'Añadas',     icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { key: 'historial', label: 'Historial',  icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Header */}
      <div style={{ background: T.wine, padding: '18px 16px 0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -0.3 }}>🏭 Depósito</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '2px 0 0' }}>Gestión de inventario</p>
          </div>
          <select value={empresa} onChange={e => { setEmpresa(e.target.value); localStorage.setItem('empresa', e.target.value) }}
            style={{ fontSize: 12, padding: '6px 10px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, background: 'rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer' }}>
            <option value="aroma">Aroma de Vid</option>
            <option value="lavid">La Vid Consultora</option>
          </select>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '10px 4px 12px', border: 'none', cursor: 'pointer', background: 'transparent',
              borderBottom: `3px solid ${tab === t.key ? '#fff' : 'transparent'}`,
              color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 13, fontWeight: tab === t.key ? 700 : 400, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === t.key ? 2.25 : 1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {empresa && tab === 'consultar'  && <ConsultarTab  key={empresa} empresa={empresa} />}
      {empresa && tab === 'cargar'     && <CargarTab     key={empresa} empresa={empresa} />}
      {empresa && tab === 'bodegas'    && <BodegasTab    key={empresa} empresa={empresa} />}
      {empresa && tab === 'anadas'     && <AnadasTab empresa={empresa} />}
      {empresa && tab === 'historial'  && <HistorialTab  key={empresa} empresa={empresa} />}
    </div>
  )
}
