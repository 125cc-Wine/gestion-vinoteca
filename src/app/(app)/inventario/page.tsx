'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8',
  text: '#1A1210', muted: '#6B5D55', dim: '#A89888',
  wine: '#800000', wineBg: 'rgba(128,0,0,0.07)', wineBd: 'rgba(128,0,0,0.18)',
  gold: '#B88A2C', goldBg: 'rgba(184,138,44,0.08)', goldBd: 'rgba(184,138,44,0.22)',
  green: '#2D7A4F', greenBg: 'rgba(45,122,79,0.08)', greenBd: 'rgba(45,122,79,0.22)',
  red: '#C03030', redBg: 'rgba(192,48,48,0.08)', redBd: 'rgba(192,48,48,0.22)',
  blue: '#2B5EA0', blueBg: 'rgba(43,94,160,0.08)', blueBd: 'rgba(43,94,160,0.22)',
  amber: '#A07010', amberBg: 'rgba(160,112,16,0.07)', amberBd: 'rgba(160,112,16,0.22)',
}

interface Producto {
  id: string
  nombre: string
  bodega: string | null
  stock: number
  activo: boolean
}

type Fase = 'preparacion' | 'conteo' | 'resumen'

interface Resumen {
  subieron: number
  bajaron: number
  sinCambio: number
  total: number
}

export default function InventarioPage() {
  const [empresa, setEmpresa] = useState<string | null>(null)
  const [fase, setFase] = useState<Fase>('preparacion')
  const [productos, setProductos] = useState<Producto[]>([])
  const [conteos, setConteos] = useState<Record<string, string>>({}) // id -> valor string
  const [loading, setLoading] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'err' } | null>(null)
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [filtroBodega, setFiltroBodega] = useState<string>('todas')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const e = localStorage.getItem('empresa')
    if (e) setEmpresa(e)
  }, [])

  function showToast(msg: string, tipo: 'ok' | 'err') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3500)
  }

  async function cargarProductos() {
    if (!empresa) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, bodega, stock, activo')
        .eq('empresa', empresa)
        .eq('activo', true)
        .order('nombre', { ascending: true })

      if (error) throw error
      setProductos(data || [])
      setConteos({})
      setFase('conteo')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar productos'
      showToast(msg, 'err')
    } finally {
      setLoading(false)
    }
  }

  const bodegas = useMemo(() => {
    const set = new Set<string>()
    productos.forEach(p => { if (p.bodega) set.add(p.bodega) })
    return Array.from(set).sort()
  }, [productos])

  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const matchBodega = filtroBodega === 'todas' || p.bodega === filtroBodega
      const matchBusqueda = busqueda.trim() === '' ||
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      return matchBodega && matchBusqueda
    })
  }, [productos, filtroBodega, busqueda])

  const productosConConteo = useMemo(() => {
    return productos.filter(p => conteos[p.id] !== undefined && conteos[p.id] !== '')
  }, [productos, conteos])

  const contadosEnVista = useMemo(() => {
    return productosFiltrados.filter(p => conteos[p.id] !== undefined && conteos[p.id] !== '').length
  }, [productosFiltrados, conteos])

  function getDiferencia(p: Producto): number | null {
    const val = conteos[p.id]
    if (val === undefined || val === '') return null
    return parseInt(val, 10) - p.stock
  }

  function inputBg(p: Producto): string {
    const diff = getDiferencia(p)
    if (diff === null) return T.surface
    if (diff === 0) return T.greenBg
    if (diff > 0) return T.amberBg
    return T.redBg
  }

  async function aplicarAjustes() {
    if (!empresa || productosConConteo.length === 0) return
    setAplicando(true)
    try {
      let subieron = 0, bajaron = 0, sinCambio = 0

      for (const prod of productosConConteo) {
        const contado = parseInt(conteos[prod.id], 10)
        const delta = contado - prod.stock

        if (delta > 0) subieron++
        else if (delta < 0) bajaron++
        else sinCambio++

        const { error: errMov } = await supabase.from('movimientos_stock').insert([{
          empresa,
          nombre: prod.nombre,
          delta,
          nuevo_stock: contado,
          modo: 'establecer',
          producto_id: prod.id,
        }])
        if (errMov) throw new Error(`Error en ${prod.nombre}: ${errMov.message}`)

        const { error: errProd } = await supabase
          .from('productos')
          .update({ stock: contado })
          .eq('id', prod.id)
        if (errProd) throw new Error(`Error actualizando ${prod.nombre}: ${errProd.message}`)
      }

      setResumen({ subieron, bajaron, sinCambio, total: productosConConteo.length })
      setConteos({})
      setFase('resumen')
      showToast(`Inventario aplicado: ${productosConConteo.length} producto(s) ajustados`, 'ok')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al aplicar ajustes'
      showToast(msg, 'err')
    } finally {
      setAplicando(false)
    }
  }

  function reiniciar() {
    setFase('preparacion')
    setProductos([])
    setConteos({})
    setResumen(null)
    setFiltroBodega('todas')
    setBusqueda('')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '24px 20px 48px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.tipo === 'ok' ? T.greenBg : T.redBg,
          color: toast.tipo === 'ok' ? T.green : T.red,
          border: `1px solid ${toast.tipo === 'ok' ? T.greenBd : T.redBd}`,
          padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: '-0.5px' }}>
            Toma de inventario
          </h1>
          {empresa && (
            <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
              Empresa: <strong style={{ color: T.text }}>{empresa}</strong>
            </p>
          )}
        </div>

        {/* ── FASE 1: PREPARACIÓN ── */}
        {fase === 'preparacion' && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 40, textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 12 }}>
              Iniciar toma de inventario
            </h2>
            <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.65, marginBottom: 28 }}>
              En esta sección vas a poder registrar el conteo físico de cada producto
              del depósito. Se va a comparar el stock del sistema con lo que contaste
              y podés aplicar los ajustes necesarios de forma masiva.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 28, textAlign: 'left', display: 'inline-block' }}>
              {[
                'Cargá los productos activos de la empresa',
                'Ingresá el conteo físico de cada uno',
                'Revisá las diferencias antes de aplicar',
                'Aplicá los ajustes al stock del sistema',
              ].map((step, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: 13, color: T.muted }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: T.wineBg, border: `1px solid ${T.wineBd}`, color: T.wine, fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
            <button
              onClick={cargarProductos}
              disabled={loading || !empresa}
              style={{
                background: T.wine, color: '#fff', border: 'none', borderRadius: 8,
                padding: '12px 32px', fontSize: 15, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
                opacity: loading || !empresa ? 0.6 : 1,
              }}
            >
              {loading ? 'Cargando...' : 'Cargar productos'}
            </button>
          </div>
        )}

        {/* ── FASE 2: CONTEO ── */}
        {fase === 'conteo' && (
          <>
            {/* Barra de herramientas */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{
                  flex: '1 1 200px', padding: '9px 14px', borderRadius: 8,
                  border: `1px solid ${T.border}`, background: T.surface,
                  fontSize: 14, color: T.text, outline: 'none',
                }}
              />
              <select
                value={filtroBodega}
                onChange={e => setFiltroBodega(e.target.value)}
                style={{
                  padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`,
                  background: T.surface, fontSize: 14, color: T.text, cursor: 'pointer',
                }}
              >
                <option value="todas">Todas las bodegas</option>
                {bodegas.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <div style={{ fontSize: 13, color: T.muted, whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600, color: T.text }}>{contadosEnVista}</span>
                {' de '}
                <span style={{ fontWeight: 600, color: T.text }}>{productosFiltrados.length}</span>
                {' contados'}
              </div>
            </div>

            {/* Tabla */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                      {['Producto', 'Bodega', 'Stock sistema', 'Contado físico', 'Diferencia'].map(h => (
                        <th key={h} style={{
                          padding: '11px 14px', textAlign: h === 'Producto' || h === 'Bodega' ? 'left' : 'center',
                          fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase',
                          letterSpacing: '0.07em', whiteSpace: 'nowrap',
                          position: h === 'Producto' ? 'sticky' : undefined,
                          top: h === 'Producto' ? 0 : undefined,
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: T.dim, fontSize: 14 }}>
                          No se encontraron productos
                        </td>
                      </tr>
                    ) : productosFiltrados.map((p, i) => {
                      const diff = getDiferencia(p)
                      const hasDiff = diff !== null
                      return (
                        <tr key={p.id} style={{
                          borderBottom: i < productosFiltrados.length - 1 ? `1px solid ${T.border}` : 'none',
                          background: i % 2 === 1 ? 'rgba(245,241,236,0.4)' : T.surface,
                        }}>
                          <td style={{ padding: '10px 14px', fontSize: 14, color: T.text, fontWeight: 500 }}>
                            {p.nombre}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: T.muted }}>
                            {p.bodega || <span style={{ color: T.dim }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 14, color: T.dim, fontWeight: 500 }}>
                            {p.stock}
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min={0}
                              placeholder="—"
                              value={conteos[p.id] ?? ''}
                              onChange={e => setConteos(prev => ({ ...prev, [p.id]: e.target.value }))}
                              style={{
                                width: 90, padding: '6px 10px', textAlign: 'center',
                                borderRadius: 7, border: `1px solid ${T.border2}`,
                                background: inputBg(p),
                                fontSize: 14, color: T.text, outline: 'none',
                                fontWeight: hasDiff ? 600 : 400,
                              }}
                            />
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            {hasDiff ? (
                              <span style={{
                                fontSize: 13, fontWeight: 700,
                                color: diff === 0 ? T.green : diff > 0 ? T.amber : T.red,
                              }}>
                                {diff > 0 ? '+' : ''}{diff}
                              </span>
                            ) : (
                              <span style={{ color: T.dim, fontSize: 13 }}>—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer con botón aplicar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
              <button
                onClick={reiniciar}
                style={{
                  background: 'transparent', border: `1px solid ${T.border2}`,
                  color: T.muted, borderRadius: 8, padding: '9px 20px',
                  fontSize: 14, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              {productosConConteo.length > 0 && (
                <button
                  onClick={aplicarAjustes}
                  disabled={aplicando}
                  style={{
                    background: T.wine, color: '#fff', border: 'none', borderRadius: 8,
                    padding: '10px 28px', fontSize: 14, fontWeight: 600,
                    cursor: aplicando ? 'wait' : 'pointer',
                    opacity: aplicando ? 0.7 : 1,
                  }}
                >
                  {aplicando
                    ? 'Aplicando...'
                    : `Aplicar ajustes (${productosConConteo.length} producto${productosConConteo.length !== 1 ? 's' : ''})`}
                </button>
              )}
            </div>
          </>
        )}

        {/* ── FASE 3: RESUMEN ── */}
        {fase === 'resumen' && resumen && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 40, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 8 }}>
              Inventario aplicado
            </h2>
            <p style={{ fontSize: 14, color: T.muted, marginBottom: 28 }}>
              Se ajustaron <strong style={{ color: T.text }}>{resumen.total}</strong> producto(s) correctamente.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
              <div style={{ background: T.greenBg, border: `1px solid ${T.greenBd}`, borderRadius: 10, padding: '14px 24px', minWidth: 110 }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.green }}>{resumen.subieron}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Subieron</div>
              </div>
              <div style={{ background: T.redBg, border: `1px solid ${T.redBd}`, borderRadius: 10, padding: '14px 24px', minWidth: 110 }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.red }}>{resumen.bajaron}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Bajaron</div>
              </div>
              <div style={{ background: T.goldBg, border: `1px solid ${T.goldBd}`, borderRadius: 10, padding: '14px 24px', minWidth: 110 }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.gold }}>{resumen.sinCambio}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Sin cambio</div>
              </div>
            </div>

            <button
              onClick={reiniciar}
              style={{
                background: T.wine, color: '#fff', border: 'none', borderRadius: 8,
                padding: '11px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Nueva toma de inventario
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
