'use client'
import { useEffect, useState, useCallback } from 'react'
import BarcodeScanner from '@/components/BarcodeScanner'
import BarcodeNotFoundModal from '@/components/BarcodeNotFoundModal'
import { useBarcodeInput } from '@/hooks/useBarcodeInput'

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8',
  text: '#1A1210', muted: '#6B5D55', dim: '#A89888',
  wine: '#800000', wineBg: 'rgba(128,0,0,0.07)',
  green: '#2D7A4F', greenBg: 'rgba(45,122,79,0.08)', greenBd: 'rgba(45,122,79,0.22)',
  amber: '#A07010', amberBg: 'rgba(160,112,16,0.07)', amberBd: 'rgba(160,112,16,0.22)',
  red: '#C03030', redBg: 'rgba(192,48,48,0.08)',
  blue: '#2B5EA0', blueBg: 'rgba(43,94,160,0.08)',
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Item {
  producto_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

interface Venta {
  id: string
  empresa: string
  tipo: string
  numero: string
  cliente_nombre: string
  vendedor_nombre: string
  total: number
  estado_pago: string
  created_at: string
  items: Item[]
  entregado_at: string | null
  picking_notas: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}
function formatPeso(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}
function hoy() {
  return new Date().toISOString().slice(0, 10)
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function PickingPage() {
  const [empresa, setEmpresa] = useState<string>('')
  const [fecha, setFecha] = useState<string>(hoy())
  const [tab, setTab] = useState<'pendiente' | 'entregado'>('pendiente')
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // expanded card state
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  // local checkbox state: ventaId -> Set of checked item indices
  const [checks, setChecks] = useState<Record<string, Set<number>>>({})
  // marking in-flight
  const [marking, setMarking] = useState<Set<string>>(new Set())
  // barcode scanner
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanMsg, setScanMsg] = useState<string | null>(null)
  const [barcodeNotFound, setBarcodeNotFound] = useState<string | null>(null)

  useEffect(() => {
    const e = localStorage.getItem('empresa') ?? ''
    setEmpresa(e)
  }, [])

  const fetchData = useCallback(async () => {
    if (!empresa) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/picking?empresa=${empresa}&fecha=${fecha}&estado=${tab}`)
      if (!res.ok) throw new Error('Error al cargar datos')
      const data: Venta[] = await res.json()
      setVentas(data)
      // reset checks when data changes
      setChecks({})
      setExpandidos(new Set())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [empresa, fecha, tab])

  useEffect(() => { fetchData() }, [fetchData])

  function toggleExpand(id: string) {
    setExpandidos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleCheck(ventaId: string, idx: number) {
    setChecks(prev => {
      const set = new Set(prev[ventaId] ?? [])
      if (set.has(idx)) set.delete(idx)
      else set.add(idx)
      return { ...prev, [ventaId]: set }
    })
  }

  async function marcarEntregado(venta: Venta) {
    setMarking(prev => new Set(prev).add(venta.id))
    try {
      const res = await fetch('/api/picking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: venta.id, entregado_at: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      await fetchData()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al marcar como entregado')
    } finally {
      setMarking(prev => { const s = new Set(prev); s.delete(venta.id); return s })
    }
  }

  async function handleBarcodeScan(code: string) {
    setScannerOpen(false)
    setScanMsg(null)
    const res = await fetch(`/api/productos?empresa=${empresa}&barcode=${encodeURIComponent(code)}`)
    const prod = await res.json()
    if (!prod || !prod.id) {
      setBarcodeNotFound(code)
      return
    }
    markProductInPickingById(prod.id, prod.nombre)
  }

  function markProductInPickingById(productoId: string, nombre: string) {
    const pendientes = ventas.filter(v => !v.entregado_at)
    for (const venta of pendientes) {
      const idx = (venta.items ?? []).findIndex(i => i.producto_id === productoId)
      if (idx !== -1) {
        setExpandidos(prev => new Set(prev).add(venta.id))
        setChecks(prev => {
          const set = new Set(prev[venta.id] ?? [])
          set.add(idx)
          return { ...prev, [venta.id]: set }
        })
        setScanMsg(`✓ ${nombre} — marcado en ${venta.numero}`)
        setTimeout(() => setScanMsg(null), 3000)
        return
      }
    }
    setScanMsg(`${nombre} no está en ningún remito pendiente de hoy`)
    setTimeout(() => setScanMsg(null), 3000)
  }

  async function handleBarcodeNotFound(prod: { id?: string; nombre: string; codigo_barras?: string }, saveBarcode: boolean) {
    const code = barcodeNotFound!
    setBarcodeNotFound(null)
    if (saveBarcode && prod.id) {
      await fetch('/api/productos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: prod.id, codigo_barras: code }) })
    }
    if (prod.id) markProductInPickingById(prod.id, prod.nombre)
  }

  // Pistola lectora (USB/Bluetooth) — solo activa en tab pendiente
  useBarcodeInput(handleBarcodeScan, tab === 'pendiente' && !scannerOpen)

  // KPIs
  // We always need counts for both states; fetch summary from current data plus meta
  const totalItems = (v: Venta) => (v.items ?? []).reduce((s, i) => s + i.cantidad, 0)
  const unidadesTotales = ventas.reduce((s, v) => s + totalItems(v), 0)
  // For entregados hoy count we rely on the other tab — approximate from current
  const kpiPendientes = tab === 'pendiente' ? ventas.length : '—'
  const kpiUnidades = tab === 'pendiente' ? unidadesTotales : '—'
  const kpiEntregados = tab === 'entregado' ? ventas.length : '—'

  return (
    <>
      {scannerOpen && (
        <BarcodeScanner
          titulo="Escanear producto"
          onDetect={handleBarcodeScan}
          onClose={() => setScannerOpen(false)}
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

      {scanMsg && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: scanMsg.startsWith('✓') ? T.green : T.amber,
          color: '#fff', padding: '10px 22px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, zIndex: 200,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        }}>
          {scanMsg}
        </div>
      )}

      {/* Print + base styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-family: Arial; font-size: 11px; }
          .card-expandido { display: block !important; }
          .check-col { display: none !important; }
          .firma-row { display: flex !important; }
        }
        .tab-btn { transition: all 0.14s; cursor: pointer; }
        .tab-btn:hover { border-color: ${T.border2} !important; }
        .expand-btn:hover { background: ${T.bg} !important; }
        .card-wrap:hover { box-shadow: 0 2px 8px rgba(26,18,16,0.08) !important; }
        .check-item:hover { background: ${T.bg} !important; }
        .entregar-btn:hover { opacity: 0.88 !important; }
        .print-btn:hover { background: ${T.bg} !important; border-color: ${T.border2} !important; }
        .firma-row { display: none; }
      `}</style>

      <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>📦</span> Orden de Carga
            </h1>
            <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>Picking y preparación de remitos</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Selector empresa */}
            <select
              value={empresa}
              onChange={e => { setEmpresa(e.target.value); localStorage.setItem('empresa', e.target.value) }}
              style={{ fontSize: 12, padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 7, background: T.surface, color: T.text, cursor: 'pointer', fontFamily: 'inherit' }}>
              <option value="aroma">Aroma de Vid</option>
              <option value="lavid">La Vid Consultora</option>
            </select>

            {/* Date picker */}
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              style={{ fontSize: 12, padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 7, background: T.surface, color: T.text, fontFamily: 'inherit', cursor: 'pointer' }}
            />

            {/* Escanear */}
            <button
              onClick={() => setScannerOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px', border: `1px solid ${T.border}`, borderRadius: 7, background: T.surface, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
              📷 Escanear
            </button>

            {/* Imprimir */}
            <button
              className="print-btn"
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px', border: `1px solid ${T.border}`, borderRadius: 7, background: T.surface, color: T.muted, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.14s' }}>
              🖨️ Imprimir lista
            </button>
          </div>
        </div>

        {/* Título print */}
        <div style={{ display: 'none' }} className="print-only">
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Orden de Carga — {fecha}</h2>
          <p style={{ fontSize: 11, color: '#666', margin: '0 0 16px' }}>Empresa: {empresa} · Remitos {tab}</p>
        </div>

        {/* ── Tabs ── */}
        <div className="no-print" style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {([['pendiente', 'Pendientes'], ['entregado', 'Entregados']] as const).map(([val, label]) => (
            <button
              key={val}
              className="tab-btn"
              onClick={() => setTab(val)}
              style={{
                fontSize: 13, fontWeight: tab === val ? 600 : 400,
                padding: '7px 18px', borderRadius: 8, border: `1px solid ${tab === val ? T.border2 : T.border}`,
                background: tab === val ? T.surface : 'transparent',
                color: tab === val ? T.text : T.muted,
                boxShadow: tab === val ? '0 1px 4px rgba(26,18,16,0.07)' : 'none',
                fontFamily: 'inherit',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── KPI strip ── */}
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          <KpiCard label="Remitos pendientes" value={kpiPendientes} color={T.amber} bg={T.amberBg} />
          <KpiCard label="Unidades a preparar" value={kpiUnidades} color={T.wine} bg={T.wineBg} />
          <KpiCard label="Entregados hoy" value={kpiEntregados} color={T.green} bg={T.greenBg} />
        </div>

        {/* ── Estado ── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: T.muted, fontSize: 14 }}>Cargando remitos...</div>
        )}
        {error && (
          <div style={{ padding: '14px 18px', borderRadius: 8, background: T.redBg, border: `1px solid rgba(192,48,48,0.2)`, color: T.red, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* ── Lista de remitos ── */}
        {!loading && !error && ventas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: T.dim, fontSize: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
            No hay remitos {tab === 'pendiente' ? 'pendientes' : 'entregados'} para el {fecha}
          </div>
        )}

        <div style={{ contain: 'layout', overflow: 'hidden' }}>
        {!loading && ventas.map(venta => {
          const items: Item[] = venta.items ?? []
          const expanded = expandidos.has(venta.id)
          const checkedSet = checks[venta.id] ?? new Set<number>()
          const totalUnidades = items.reduce((s, i) => s + i.cantidad, 0)
          const checkedCount = checkedSet.size
          const todosPreparados = items.length > 0 && checkedCount === items.length
          const entregado = !!venta.entregado_at
          const isMarking = marking.has(venta.id)

          return (
            <div
              key={venta.id}
              className="card-wrap"
              style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 10, marginBottom: 12,
                boxShadow: '0 1px 3px rgba(26,18,16,0.05)',
                transition: 'box-shadow 0.14s',
                pageBreakInside: 'avoid',
              }}>

              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
                onClick={() => toggleExpand(venta.id)}>

                {/* Expand btn */}
                <button
                  className="expand-btn no-print"
                  style={{
                    width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.border}`,
                    background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: T.muted, fontSize: 13, flexShrink: 0, transition: 'background 0.12s',
                  }}>
                  {expanded ? '▼' : '▶'}
                </button>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{venta.numero}</span>
                    <span style={{ fontSize: 13, color: T.muted }}>·</span>
                    <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{venta.cliente_nombre}</span>
                    {venta.vendedor_nombre && (
                      <span style={{ fontSize: 11, color: T.dim }}>Vendedor: {venta.vendedor_nombre}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: T.muted }}>{items.length} productos · {totalUnidades} unidades</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{formatPeso(venta.total)}</span>
                    <span style={{ fontSize: 11, color: T.dim }}>🕐 {formatHora(venta.created_at)}</span>
                  </div>
                </div>

                {/* Badge estado */}
                <div style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, flexShrink: 0,
                  background: entregado ? T.greenBg : T.amberBg,
                  color: entregado ? T.green : T.amber,
                  border: `1px solid ${entregado ? T.greenBd : T.amberBd}`,
                }}>
                  {entregado ? `✓ Entregado ${formatHora(venta.entregado_at!)}` : 'Pendiente'}
                </div>
              </div>

              {/* Card body expandido */}
              {(expanded || !expandidos.size) && (
                <div className="card-expandido" style={{ display: expanded ? 'block' : 'none', borderTop: `1px solid ${T.border}`, padding: '0 16px 16px' }}>

                  {/* Tabla de items */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        <th className="check-col" style={{ width: 36, padding: '6px 4px', textAlign: 'center', color: T.dim, fontSize: 11, fontWeight: 600 }}>✓</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', color: T.dim, fontSize: 11, fontWeight: 600 }}>Producto</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', color: T.dim, fontSize: 11, fontWeight: 600, width: 80 }}>Cant.</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', color: T.dim, fontSize: 11, fontWeight: 600, width: 100 }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const checked = checkedSet.has(idx)
                        return (
                          <tr
                            key={idx}
                            className="check-item"
                            onClick={() => !entregado && toggleCheck(venta.id, idx)}
                            style={{
                              borderBottom: `1px solid ${T.border}`,
                              background: checked ? T.greenBg : 'transparent',
                              cursor: entregado ? 'default' : 'pointer',
                              transition: 'background 0.1s',
                            }}>
                            <td className="check-col" style={{ padding: '9px 4px', textAlign: 'center' }}>
                              {!entregado && (
                                <div style={{
                                  width: 18, height: 18, borderRadius: 4,
                                  border: `2px solid ${checked ? T.green : T.border2}`,
                                  background: checked ? T.green : T.surface,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  margin: '0 auto', flexShrink: 0, transition: 'all 0.12s',
                                }}>
                                  {checked && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                                </div>
                              )}
                              {entregado && <span style={{ color: T.green, fontSize: 13 }}>✓</span>}
                            </td>
                            <td style={{ padding: '9px 8px', fontSize: 13, color: T.text, fontWeight: checked ? 500 : 400, textDecoration: checked ? 'line-through' : 'none', textDecorationColor: T.dim }}>
                              {item.nombre}
                            </td>
                            <td style={{ padding: '9px 8px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: T.text }}>
                              {item.cantidad}
                            </td>
                            <td style={{ padding: '9px 8px', textAlign: 'right', fontSize: 12, color: T.muted }}>
                              {formatPeso(item.subtotal)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* Barra de progreso (solo si no entregado) */}
                  {!entregado && items.length > 0 && (
                    <div className="no-print" style={{ marginTop: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: T.muted }}>Items preparados</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: checkedCount === items.length ? T.green : T.muted }}>
                          {checkedCount} / {items.length}
                        </span>
                      </div>
                      <div style={{ height: 5, background: T.border, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          background: checkedCount === items.length ? T.green : T.amber,
                          width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%`,
                          transition: 'width 0.2s, background 0.2s',
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Footer card: botón entregar */}
                  {!entregado && todosPreparados && (
                    <div className="no-print" style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="entregar-btn"
                        disabled={isMarking}
                        onClick={e => { e.stopPropagation(); marcarEntregado(venta) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          fontSize: 13, fontWeight: 600, padding: '9px 20px', borderRadius: 8,
                          background: T.green, color: '#fff', border: 'none',
                          cursor: isMarking ? 'wait' : 'pointer', fontFamily: 'inherit',
                          boxShadow: '0 2px 6px rgba(45,122,79,0.3)', transition: 'opacity 0.14s',
                          opacity: isMarking ? 0.7 : 1,
                        }}>
                        {isMarking ? '⏳ Guardando...' : '✓ Marcar como entregado'}
                      </button>
                    </div>
                  )}

                  {/* Firma (solo print) */}
                  <div className="firma-row" style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #ddd', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ borderTop: '1px solid #333', width: 180, paddingTop: 4, fontSize: 10, color: '#666' }}>Firma receptor</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 10, color: '#666' }}>
                      <div>{venta.numero}</div>
                      <div>{venta.cliente_nombre}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>
    </>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, bg }: { label: string; value: number | string; color: string; bg: string }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: '16px 20px',
      boxShadow: '0 1px 3px rgba(26,18,16,0.04)',
    }}>
      <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, background: bg, borderRadius: 8, padding: '4px 12px', display: 'inline-block', lineHeight: 1.3 }}>
        {value}
      </div>
    </div>
  )
}
