'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import BarcodeScanner from '@/components/BarcodeScanner'
import { useBarcodeInput } from '@/hooks/useBarcodeInput'

const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8',
  wine: '#800000', wineDark: '#6A0000',
  text: '#1A1210', muted: '#6B5D55', dim: '#A89888',
  green: '#2D7A4F', greenBg: 'rgba(45,122,79,0.08)',
  red: '#C03030', redBg: 'rgba(192,48,48,0.08)',
  amber: '#A07010', amberBg: 'rgba(160,112,16,0.08)',
  blue: '#2B5EA0', blueBg: 'rgba(43,94,160,0.08)',
  gold: '#B88A2C',
}

const MULT = { botella: 1, caja6: 6, caja12: 12 }

type Unidad = 'botella' | 'caja6' | 'caja12'
type Modo = 'establecer' | 'agregar'

interface StockItem {
  id: string
  nombre: string
  stockActual: number
  qty: number
  unit: Unidad
}

interface ProductoRaw {
  id: string
  nombre: string
  stock: number
  codigo_barras?: string
  sku?: string
}

export default function StockPage() {
  const [empresa, setEmpresa] = useState<string>('')
  const [modo, setModo] = useState<Modo>('agregar')
  const [items, setItems] = useState<StockItem[]>([])
  const [search, setSearch] = useState('')
  const [resultados, setResultados] = useState<ProductoRaw[]>([])
  const [buscando, setBuscando] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e)
  }, [])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // Search products
  useEffect(() => {
    if (!empresa) return
    if (search.length < 2) { setResultados([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      const res = await fetch(`/api/productos?empresa=${empresa}`)
      const all: ProductoRaw[] = await res.json()
      const q = search.toLowerCase()
      setResultados(all.filter(p => p.nombre.toLowerCase().includes(q)).slice(0, 12))
      setBuscando(false)
    }, 250)
  }, [search, empresa])

  function addItem(p: ProductoRaw) {
    setSearch('')
    setResultados([])
    searchRef.current?.focus()
    setItems(prev => {
      if (prev.find(i => i.id === p.id)) return prev
      return [...prev, { id: p.id, nombre: p.nombre, stockActual: p.stock ?? 0, qty: 1, unit: 'botella' }]
    })
  }

  const handleBarcodeScan = useCallback(async (code: string) => {
    if (!empresa) return
    setScannerOpen(false)
    const res = await fetch(`/api/productos?empresa=${empresa}&barcode=${encodeURIComponent(code)}`)
    if (!res.ok) { showToast('Código no encontrado: ' + code, false); return }
    const prod: ProductoRaw | null = await res.json()
    if (!prod?.id) { showToast('Código no encontrado: ' + code, false); return }
    addItem(prod)
    showToast(prod.nombre)
  }, [empresa])

  useBarcodeInput(handleBarcodeScan, !scannerOpen)

  function updateQty(id: string, qty: number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, qty) } : i))
  }

  function updateUnit(id: string, unit: Unidad) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, unit } : i))
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function totalUnidades(item: StockItem) {
    return item.qty * MULT[item.unit]
  }

  async function confirmar() {
    if (!items.length) return
    setGuardando(true)
    let ok = 0
    let err = 0
    for (const item of items) {
      const delta = totalUnidades(item)
      const nuevoStock = modo === 'establecer' ? delta : item.stockActual + delta
      const res = await fetch('/api/productos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, stock: nuevoStock }),
      })
      if (res.ok) ok++ ; else err++
    }
    setGuardando(false)
    if (err === 0) {
      showToast(`Stock actualizado (${ok} producto${ok !== 1 ? 's' : ''})`)
      setItems([])
    } else {
      showToast(`${ok} OK, ${err} con error`, false)
    }
  }

  const totalItems = items.reduce((s, i) => s + totalUnidades(i), 0)

  return (
    <div style={{ padding: '16px', maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Carga de Stock</h1>
        <p style={{ fontSize: 13, color: T.muted, margin: '4px 0 0' }}>
          Depositá los productos escaneando o buscando
        </p>
      </div>

      {/* Modo toggle */}
      <div style={{
        display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden',
        border: `1px solid ${T.border}`, marginBottom: 16, background: T.bg,
      }}>
        {(['agregar', 'establecer'] as Modo[]).map(m => (
          <button key={m} onClick={() => setModo(m)} style={{
            flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontWeight: 600,
            fontSize: 14, transition: 'background 0.15s, color 0.15s',
            background: modo === m ? T.wine : 'transparent',
            color: modo === m ? '#fff' : T.muted,
          }}>
            {m === 'agregar' ? '+ Sumar al stock' : '= Establecer stock'}
          </button>
        ))}
      </div>

      {/* Search + scan */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            style={{
              width: '100%', padding: '11px 14px', border: `1.5px solid ${T.border}`,
              borderRadius: 10, fontSize: 15, background: T.surface, color: T.text,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {buscando && (
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: T.dim }}>
              ...
            </span>
          )}
        </div>
        <button onClick={() => setScannerOpen(true)} style={{
          padding: '0 16px', borderRadius: 10, border: `1.5px solid ${T.border}`,
          background: T.surface, cursor: 'pointer', display: 'flex', alignItems: 'center',
          color: T.muted,
        }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3M15 5h3a1 1 0 011 1v3M15 19h3a1 1 0 001-1v-3" />
            <line x1="7" y1="12" x2="17" y2="12" />
          </svg>
        </button>
      </div>

      {/* Search results */}
      {resultados.length > 0 && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
          marginBottom: 12, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          {resultados.map(p => (
            <button key={p.id} onClick={() => addItem(p)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
              borderBottom: `1px solid ${T.border}`, textAlign: 'left',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{p.nombre}</div>
                <div style={{ fontSize: 12, color: T.dim }}>Stock: {p.stock ?? 0} bot.</div>
              </div>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.wine} strokeWidth={2}>
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 20px', color: T.dim,
          border: `2px dashed ${T.border}`, borderRadius: 14, marginTop: 8,
        }}>
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} style={{ marginBottom: 12, opacity: 0.4 }}>
            <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM4 7l8-4 8 4" />
          </svg>
          <p style={{ margin: 0, fontSize: 14 }}>Escaneá o buscá para agregar productos</p>
        </div>
      )}

      {/* Items list */}
      {items.length > 0 && (
        <div style={{ contain: 'layout', overflow: 'hidden' }}>
          {items.map(item => {
            const total = totalUnidades(item)
            const nuevoStock = modo === 'establecer' ? total : item.stockActual + total
            return (
              <div key={item.id} style={{
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
                padding: '14px', marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{item.nombre}</div>
                    <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>
                      Stock actual: {item.stockActual} bot.
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)} style={{
                    marginLeft: 10, padding: 6, border: 'none', background: T.redBg,
                    borderRadius: 8, cursor: 'pointer', color: T.red, flexShrink: 0,
                  }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* Qty */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: `1.5px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <button onClick={() => updateQty(item.id, item.qty - 1)} style={{
                      width: 36, height: 40, border: 'none', background: T.bg, cursor: 'pointer',
                      fontSize: 18, color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>−</button>
                    <input
                      type="number"
                      value={item.qty}
                      min={0}
                      onChange={e => updateQty(item.id, parseInt(e.target.value) || 0)}
                      style={{
                        width: 52, height: 40, border: 'none', textAlign: 'center',
                        fontSize: 16, fontWeight: 700, color: T.text, background: T.surface, outline: 'none',
                      }}
                    />
                    <button onClick={() => updateQty(item.id, item.qty + 1)} style={{
                      width: 36, height: 40, border: 'none', background: T.bg, cursor: 'pointer',
                      fontSize: 18, color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>+</button>
                  </div>

                  {/* Unit selector */}
                  <select
                    value={item.unit}
                    onChange={e => updateUnit(item.id, e.target.value as Unidad)}
                    style={{
                      flex: 1, height: 40, padding: '0 10px', border: `1.5px solid ${T.border}`,
                      borderRadius: 8, fontSize: 14, color: T.text, background: T.surface,
                      cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <option value="botella">Botella (×1)</option>
                    <option value="caja6">Caja ×6</option>
                    <option value="caja12">Caja ×12</option>
                  </select>

                  {/* Result badge */}
                  <div style={{
                    padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: modo === 'establecer' ? T.blueBg : T.greenBg,
                    color: modo === 'establecer' ? T.blue : T.green,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {modo === 'agregar' ? '+' : '='}{total} bot
                  </div>
                </div>

                {/* Resultado final */}
                <div style={{ marginTop: 8, fontSize: 12, color: T.muted }}>
                  {modo === 'agregar'
                    ? <>{item.stockActual} + {total} = <strong style={{ color: T.green }}>{nuevoStock} bot</strong></>
                    : <>Stock final: <strong style={{ color: T.blue }}>{nuevoStock} bot</strong></>
                  }
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm button */}
      {items.length > 0 && (
        <div style={{
          position: 'sticky', bottom: 16, marginTop: 16,
          background: T.bg, paddingTop: 8,
        }}>
          <button onClick={confirmar} disabled={guardando} style={{
            width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
            background: guardando ? T.dim : T.wine, color: '#fff', fontSize: 16, fontWeight: 700,
            cursor: guardando ? 'default' : 'pointer', letterSpacing: 0.3,
          }}>
            {guardando
              ? 'Guardando...'
              : `Confirmar carga — ${items.length} producto${items.length !== 1 ? 's' : ''}, ${totalItems} bot`}
          </button>
        </div>
      )}

      {/* Scanner */}
      {scannerOpen && (
        <BarcodeScanner
          onDetect={handleBarcodeScan}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: toast.ok ? T.green : T.red, color: '#fff',
          padding: '10px 20px', borderRadius: 30, fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 9999, whiteSpace: 'nowrap',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
