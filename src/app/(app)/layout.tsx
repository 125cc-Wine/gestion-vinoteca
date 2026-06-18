'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  // Sidebar
  wine:      '#800000',
  wineDark:  '#6A0000',
  wineLight: '#9A1010',
  // Content
  bg:        '#F5F1EC',
  surface:   '#FFFFFF',
  border:    '#DDD0C0',
  border2:   '#C8BAA8',
  // Brand colors
  brown:     '#633A2C',
  gold:      '#B88A2C',
  goldAlt:   '#B8860B',
  // Text
  text:      '#1A1210',
  muted:     '#6B5D55',
  dim:       '#A89888',
  // Semantic
  green:     '#2D7A4F',
  greenBg:   'rgba(45,122,79,0.08)',
  red:       '#C03030',
  redBg:     'rgba(192,48,48,0.08)',
  blue:      '#2B5EA0',
  blueBg:    'rgba(43,94,160,0.08)',
  amber:     '#A07010',
  amberBg:   'rgba(160,112,16,0.08)',
}

// Sidebar tokens
const S = {
  text:      'rgba(255,255,255,0.88)',
  muted:     'rgba(255,255,255,0.45)',
  group:     'rgba(255,255,255,0.30)',
  hover:     'rgba(255,255,255,0.09)',
  active:    'rgba(255,255,255,0.16)',
  border:    'rgba(255,255,255,0.10)',
  gold:      '#DABF6A',
}

const NAV_GROUPS = [
  {
    label: 'Operaciones',
    items: [
      { href: '/dashboard', label: 'Inicio',  icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
      { href: '/ventas',    label: 'Ventas',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { href: '/pedidos',        label: 'Pedidos',        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      { href: '/consignaciones', label: 'Consignaciones', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M10 12l1 5m3-5l-1 5' },
    ]
  },
  {
    label: 'Catálogo',
    items: [
      { href: '/productos',   label: 'Productos',   icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
      { href: '/bodegas',     label: 'Bodegas',     icon: 'M3 21V5a2 2 0 012-2h14a2 2 0 012 2v16M9 21V9h6v12' },
    ]
  },
  {
    label: 'Contactos',
    items: [
      { href: '/clientes',    label: 'Clientes',    icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm8 0a3 3 0 11-6 0' },
      { href: '/proveedores', label: 'Proveedores', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a1 1 0 01-1 1h-1m-5 0a2 2 0 100 4 2 2 0 000-4m5 0a2 2 0 100 4 2 2 0 000-4' },
      { href: '/vendedores',  label: 'Vendedores',  icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      { href: '/crm',         label: 'CRM',         icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    ]
  },
  {
    label: 'Administración',
    items: [
      { href: '/compras',     label: 'Compras',     icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
      { href: '/movimientos', label: 'Movimientos', icon: 'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4' },
      { href: '/caja',        label: 'Caja',        icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
      { href: '/reportes',    label: 'Reportes',    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    ]
  },
]

const TIPO_ICON: Record<string, string> = { venta: '🧾', cliente: '👤', producto: '🍷' }
const TIPO_COLOR: Record<string, string> = { venta: T.wine, cliente: T.brown, producto: T.green }
interface SearchResult { tipo: string; id: string; titulo: string; subtitulo: string; href: string }

function NavIcon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [empresa, setEmpresa] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchSel, setSearchSel] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const e = localStorage.getItem('empresa')
    if (!e) router.push('/')
    else setEmpresa(e)
  }, [router])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(o => !o); setSearchQ(''); setSearchResults([]) }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [searchOpen])

  useEffect(() => {
    if (!searchQ || searchQ.length < 2) { setSearchResults([]); return }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/buscar?empresa=${empresa}&q=${encodeURIComponent(searchQ)}`)
        setSearchResults(await res.json().catch(() => []))
        setSearchSel(0)
      } finally { setSearchLoading(false) }
    }, 280)
  }, [searchQ, empresa])

  function goToResult(r: SearchResult) { router.push(r.href); setSearchOpen(false); setSearchQ(''); setSearchResults([]) }
  function onSearchKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchSel(s => Math.min(s + 1, searchResults.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSearchSel(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && searchResults[searchSel]) goToResult(searchResults[searchSel])
    if (e.key === 'Escape') setSearchOpen(false)
  }

  if (!empresa) return null
  const esAroma = empresa === 'aroma'
  const allNav = NAV_GROUPS.flatMap(g => g.items)
  const currentNav = allNav.find(n => pathname.startsWith(n.href))

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border2}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${T.muted}; }
        .nav-link { transition: background 0.12s; text-decoration: none !important; }
        .nav-link:hover { background: ${S.hover} !important; }
        .nav-link.active { background: ${S.active} !important; }
        .s-btn:hover { background: rgba(0,0,0,0.05) !important; border-color: ${T.border2} !important; }
        .s-res:hover, .s-res.sel { background: ${T.bg} !important; }
        .top-btn:hover { background: ${T.bg} !important; border-color: ${T.border2} !important; }
        .cambiar:hover { background: rgba(255,255,255,0.1) !important; }
        a { text-decoration: none; }
        button { font-family: inherit; }
        input { font-family: inherit; }
      `}</style>

      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: T.wine,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto', overflowX: 'hidden',
        zIndex: 50,
      }}>

        {/* Brand */}
        <div style={{ padding: '20px 16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              🍷
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
                {esAroma ? 'Aroma de Vid' : 'La Vid Consultora'}
              </div>
              <div style={{ fontSize: 10, color: S.gold, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>
                {esAroma ? 'Retail' : 'Distribución'}
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: S.border, marginTop: 4 }} />
        </div>

        {/* Búsqueda rápida lateral */}
        <div style={{ padding: '0 10px 10px' }}>
          <button onClick={() => setSearchOpen(true)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 7, padding: '7px 10px', cursor: 'pointer', color: S.muted, fontSize: 12,
            transition: 'background 0.12s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span style={{ flex: 1, textAlign: 'left' }}>Buscar...</span>
            <kbd style={{ fontSize: 9, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, padding: '1px 5px', color: S.muted, letterSpacing: '0.03em' }}>⌘K</kbd>
          </button>
        </div>

        {/* Nav grupos */}
        <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto' }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: S.group, textTransform: 'uppercase', letterSpacing: '0.09em', padding: '6px 10px 4px', userSelect: 'none' }}>
                {group.label}
              </div>
              {group.items.map(n => {
                const active = pathname.startsWith(n.href)
                return (
                  <Link key={n.href} href={n.href}
                    className={`nav-link${active ? ' active' : ''}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '7px 10px', borderRadius: 7, marginBottom: 1,
                      color: active ? '#FFFFFF' : S.text,
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      position: 'relative',
                    }}>
                    {active && (
                      <div style={{
                        position: 'absolute', left: 0, top: '15%', bottom: '15%',
                        width: 3, borderRadius: '0 3px 3px 0', background: S.gold,
                      }} />
                    )}
                    <span style={{ display: 'flex', flexShrink: 0 }}><NavIcon d={n.icon} /></span>
                    {n.label}
                  </Link>
                )
              })}
              {gi < NAV_GROUPS.length - 1 && (
                <div style={{ height: 1, background: S.border, margin: '8px 4px 4px' }} />
              )}
            </div>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding: '10px 10px 16px', borderTop: `1px solid ${S.border}` }}>
          {/* Logo empresa */}
          <div style={{ marginBottom: 8, padding: '0 4px' }}>
            <Image
              src={esAroma ? '/logos/aroma.jpg' : '/logos/lavid.png'}
              alt={esAroma ? 'Aroma de Vid' : 'La Vid Consultora'}
              width={100} height={28}
              style={{ objectFit: 'contain', height: 28, width: 'auto', maxWidth: '100%', opacity: 0.75 }}
            />
          </div>
          <button className="cambiar"
            onClick={() => { localStorage.removeItem('empresa'); router.push('/') }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: 'none',
              borderRadius: 7, padding: '7px 10px', cursor: 'pointer',
              color: S.muted, fontSize: 12, transition: 'background 0.12s', textAlign: 'left',
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Cambiar empresa
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          height: 56, background: T.surface,
          borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 40,
          boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
        }}>
          {/* Título de página */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {currentNav && (
              <>
                <span style={{ color: T.dim }}><NavIcon d={currentNav.icon} /></span>
                <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{currentNav.label}</span>
              </>
            )}
          </div>

          {/* Acciones topbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Búsqueda */}
            <button className="top-btn" onClick={() => setSearchOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: T.bg, border: `1px solid ${T.border}`,
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                color: T.muted, fontSize: 12, transition: 'all 0.12s', minWidth: 200,
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span style={{ flex: 1, textAlign: 'left' }}>Buscar...</span>
              <kbd style={{ fontSize: 10, color: T.dim, background: T.border, borderRadius: 4, padding: '1px 5px', lineHeight: 1.5 }}>⌘K</kbd>
            </button>

            {/* CTA Nueva venta */}
            <button
              onClick={() => router.push('/ventas')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: T.wine, color: '#FFFFFF',
                border: 'none', borderRadius: 8, padding: '7px 16px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.12s', boxShadow: '0 1px 3px rgba(128,0,0,0.35)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = T.wineDark)}
              onMouseLeave={e => (e.currentTarget.style.background = T.wine)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Nueva venta
            </button>

            {/* Badge empresa */}
            <div style={{
              fontSize: 11, fontWeight: 700, padding: '5px 11px', borderRadius: 99,
              background: esAroma ? 'rgba(128,0,0,0.08)' : 'rgba(43,94,160,0.08)',
              color: esAroma ? T.wine : T.blue,
              border: `1px solid ${esAroma ? 'rgba(128,0,0,0.2)' : 'rgba(43,94,160,0.2)'}`,
              letterSpacing: '0.05em', textTransform: 'uppercase' as const,
            }}>
              {esAroma ? 'Aroma' : 'La Vid'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, minWidth: 0, background: T.bg }}>
          {children}
        </main>
      </div>

      {/* ── BÚSQUEDA GLOBAL ────────────────────────────────────────────────── */}
      {searchOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.4)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh' }}
          onClick={e => e.target === e.currentTarget && setSearchOpen(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, width: '100%', maxWidth: 580, boxShadow: '0 20px 60px rgba(26,18,16,0.18)', overflow: 'hidden' }}>
            {/* Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: searchResults.length > 0 || searchLoading ? `1px solid ${T.border}` : 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input ref={searchRef} value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={onSearchKey}
                placeholder="Buscar ventas, clientes, productos..."
                style={{ background: 'transparent', border: 'none', color: T.text, fontSize: 15, outline: 'none', flex: 1 }} />
              {searchLoading && <div style={{ fontSize: 12, color: T.dim }}>Buscando...</div>}
              <kbd style={{ fontSize: 10, color: T.dim, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>Esc</kbd>
            </div>

            {/* Resultados */}
            {searchResults.length > 0 && (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {searchResults.map((r, i) => (
                  <div key={r.id + r.tipo} className={`s-res${searchSel === i ? ' sel' : ''}`}
                    style={{ padding: '10px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < searchResults.length - 1 ? `1px solid ${T.border}` : 'none', transition: 'background 0.1s' }}
                    onClick={() => goToResult(r)} onMouseEnter={() => setSearchSel(i)}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${TIPO_COLOR[r.tipo]}12`, border: `1px solid ${TIPO_COLOR[r.tipo]}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {TIPO_ICON[r.tipo]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titulo}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{r.subtitulo}</div>
                    </div>
                    <span style={{ fontSize: 10, color: TIPO_COLOR[r.tipo], background: `${TIPO_COLOR[r.tipo]}12`, padding: '2px 8px', borderRadius: 5, flexShrink: 0, fontWeight: 700 }}>{r.tipo}</span>
                  </div>
                ))}
              </div>
            )}

            {searchQ.length >= 2 && !searchLoading && searchResults.length === 0 && (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: T.dim, fontSize: 13 }}>
                Sin resultados para <strong style={{ color: T.muted }}>&ldquo;{searchQ}&rdquo;</strong>
              </div>
            )}

            {!searchQ && (
              <div style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: 11, color: T.dim, marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Accesos rápidos</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Ventas', href: '/ventas' },
                    { label: 'Clientes', href: '/clientes' },
                    { label: 'Productos', href: '/productos' },
                    { label: 'Caja', href: '/caja' },
                  ].map(l => (
                    <button key={l.href} onClick={() => { router.push(l.href); setSearchOpen(false) }}
                      style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {l.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: T.dim, marginTop: 12 }}>↑↓ navegar · Enter ir · Esc cerrar</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
