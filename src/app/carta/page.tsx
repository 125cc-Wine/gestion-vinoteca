'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo, Suspense } from 'react'
import { supabase } from '@/lib/supabase'

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg:      '#1A0F0A',
  card:    '#241510',
  border:  'rgba(255,255,255,0.08)',
  text:    '#F5EFE6',
  muted:   'rgba(245,239,230,0.6)',
  dim:     'rgba(245,239,230,0.35)',
  gold:    '#DABF6A',
  goldDim: 'rgba(218,191,106,0.2)',
  wine:    '#B04040',
  wineDim: 'rgba(176,64,64,0.15)',
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Producto {
  id: number
  nombre: string
  empresa: string
  bodega: string
  categoria: string
  precio_venta: number
  stock: number
  activo: boolean
  descripcion?: string
  imagen_url?: string
}

const EMPRESAS: Record<string, string> = {
  aroma: 'Aroma de Vid',
  lavid: 'La Vid Consultora',
}

// ─── Format price ─────────────────────────────────────────────────────────
function formatPrecio(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

// ─── Selector de empresa ──────────────────────────────────────────────────
function EmpresaSelector() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
        padding: '40px 24px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🍷</div>
        <h1
          style={{
            color: C.gold,
            fontSize: 28,
            fontWeight: 700,
            margin: 0,
            letterSpacing: '0.04em',
          }}
        >
          Carta de Vinos
        </h1>
        <p style={{ color: C.muted, marginTop: 8, fontSize: 15 }}>
          Seleccioná una empresa para ver su carta
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 320 }}>
        {Object.entries(EMPRESAS).map(([key, label]) => (
          <a
            key={key}
            href={`/carta?empresa=${key}`}
            style={{
              display: 'block',
              padding: '18px 28px',
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              color: C.text,
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: 17,
              fontWeight: 600,
              transition: 'border-color 0.2s, background 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = C.gold
              el.style.background = C.goldDim
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = C.border
              el.style.background = C.card
            }}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}

// ─── Product card ─────────────────────────────────────────────────────────
function ProductoCard({ producto }: { producto: Producto }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(218,191,106,0.35)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = C.border
      }}
    >
      {/* Imagen opcional */}
      {producto.imagen_url && (
        <div
          style={{
            width: '100%',
            height: 160,
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 4,
            background: C.bg,
          }}
        >
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Bodega */}
      <span
        style={{
          color: C.gold,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {producto.bodega}
      </span>

      {/* Nombre */}
      <h3
        style={{
          color: C.text,
          fontSize: 15,
          fontWeight: 600,
          margin: 0,
          lineHeight: 1.35,
        }}
      >
        {producto.nombre}
      </h3>

      {/* Descripcion */}
      {producto.descripcion && (
        <p
          style={{
            color: C.muted,
            fontSize: 13,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {producto.descripcion}
        </p>
      )}

      {/* Precio */}
      {producto.precio_venta > 0 && (
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 8,
            color: C.gold,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {formatPrecio(producto.precio_venta)}
        </div>
      )}
    </div>
  )
}

// ─── Carta content ────────────────────────────────────────────────────────
function CartaContent() {
  const searchParams = useSearchParams()
  const empresaKey = searchParams.get('empresa')?.toLowerCase() ?? ''

  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [bodegaFiltro, setBodegaFiltro] = useState<string>('todas')

  const empresaNombre = EMPRESAS[empresaKey] ?? ''

  // ── Fetch all pages ──────────────────────────────────────────────────
  useEffect(() => {
    if (!empresaKey || !empresaNombre) return

    async function fetchProductos() {
      setLoading(true)
      setError(null)

      const PAGE = 1000
      let all: Producto[] = []
      let from = 0

      while (true) {
        const { data, error: err } = await supabase
          .from('productos')
          .select('*')
          .eq('empresa', empresaKey)
          .eq('activo', true)
          .gt('stock', 0)
          .order('bodega')
          .order('nombre')
          .range(from, from + PAGE - 1)

        if (err) {
          setError('No se pudo cargar la carta. Intente nuevamente.')
          setLoading(false)
          return
        }

        all = [...all, ...(data as Producto[])]
        if ((data as Producto[]).length < PAGE) break
        from += PAGE
      }

      setProductos(all)
      setLoading(false)
    }

    fetchProductos()
  }, [empresaKey, empresaNombre])

  // ── Derived data ─────────────────────────────────────────────────────
  const bodegas = useMemo(
    () => ['todas', ...Array.from(new Set(productos.map(p => p.bodega))).sort()],
    [productos]
  )

  const filtrados = useMemo(() => {
    let lista = productos
    if (bodegaFiltro !== 'todas') lista = lista.filter(p => p.bodega === bodegaFiltro)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      lista = lista.filter(
        p =>
          p.nombre.toLowerCase().includes(q) ||
          p.bodega.toLowerCase().includes(q) ||
          (p.descripcion ?? '').toLowerCase().includes(q)
      )
    }
    return lista
  }, [productos, bodegaFiltro, busqueda])

  // Agrupados por bodega
  const porBodega = useMemo(() => {
    const map: Record<string, Producto[]> = {}
    for (const p of filtrados) {
      if (!map[p.bodega]) map[p.bodega] = []
      map[p.bodega].push(p)
    }
    return map
  }, [filtrados])

  const bodegasEnLista = Object.keys(porBodega).sort()

  // ── No empresa param → selector ──────────────────────────────────────
  if (!empresaKey || !empresaNombre) {
    return <EmpresaSelector />
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      {/* Meta tags */}
      <title>{`Carta de Vinos — ${empresaNombre}`}</title>

      <div
        style={{
          minHeight: '100vh',
          background: C.bg,
          color: C.text,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            borderBottom: `1px solid ${C.border}`,
            padding: '32px 24px 28px',
            textAlign: 'center',
            background: `linear-gradient(180deg, rgba(176,64,64,0.08) 0%, transparent 100%)`,
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 12 }}>🍷</div>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(20px, 5vw, 30px)',
              fontWeight: 700,
              color: C.text,
              letterSpacing: '0.02em',
            }}
          >
            {empresaNombre}
          </h1>
          <p
            style={{
              margin: '6px 0 0',
              color: C.gold,
              fontSize: 'clamp(13px, 3vw, 16px)',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Carta de Vinos
          </p>
        </header>

        {/* ── Controles ── */}
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '24px 16px 0',
          }}
        >
          {/* Buscador */}
          <input
            type="search"
            placeholder="Buscar vino, bodega..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              color: C.text,
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => {
              (e.target as HTMLInputElement).style.borderColor = C.gold
            }}
            onBlur={e => {
              (e.target as HTMLInputElement).style.borderColor = C.border
            }}
          />

          {/* Pills de bodega */}
          {!loading && bodegas.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 4,
                marginTop: 16,
                scrollbarWidth: 'none',
              }}
            >
              {bodegas.map(b => {
                const activo = bodegaFiltro === b
                return (
                  <button
                    key={b}
                    onClick={() => setBodegaFiltro(b)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 20,
                      border: `1px solid ${activo ? C.gold : C.border}`,
                      background: activo ? C.goldDim : 'transparent',
                      color: activo ? C.gold : C.muted,
                      fontSize: 13,
                      fontWeight: activo ? 600 : 400,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                      flexShrink: 0,
                    }}
                  >
                    {b === 'todas' ? 'Todas las bodegas' : b}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Contenido principal ── */}
        <main
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '24px 16px 48px',
          }}
        >
          {loading && (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 0',
                color: C.muted,
                fontSize: 16,
              }}
            >
              Cargando carta...
            </div>
          )}

          {error && (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 0',
                color: C.wine,
                fontSize: 16,
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && filtrados.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 0',
                color: C.muted,
                fontSize: 16,
              }}
            >
              No se encontraron vinos con ese criterio.
            </div>
          )}

          {!loading && !error && bodegasEnLista.map(bodega => (
            <section key={bodega} style={{ marginBottom: 48 }}>
              {/* Heading de bodega */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginBottom: 20,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: C.gold,
                    fontSize: 'clamp(15px, 3vw, 19px)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  {bodega}
                </h2>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: C.border,
                  }}
                />
                <span
                  style={{
                    color: C.dim,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {porBodega[bodega].length}{' '}
                  {porBodega[bodega].length === 1 ? 'vino' : 'vinos'}
                </span>
              </div>

              {/* Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 16,
                }}
              >
                {porBodega[bodega].map(p => (
                  <ProductoCard key={p.id} producto={p} />
                ))}
              </div>
            </section>
          ))}
        </main>

        {/* ── Footer ── */}
        <footer
          style={{
            borderTop: `1px solid ${C.border}`,
            padding: '20px 24px',
            textAlign: 'center',
            color: C.dim,
            fontSize: 13,
          }}
        >
          Precios en pesos argentinos · Sujeto a disponibilidad de stock
        </footer>
      </div>
    </>
  )
}

// ─── Page (wraps in Suspense for useSearchParams) ─────────────────────────
export default function CartaPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: C.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.muted,
            fontSize: 16,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Cargando...
        </div>
      }
    >
      <CartaContent />
    </Suspense>
  )
}
