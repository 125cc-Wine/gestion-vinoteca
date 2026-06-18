'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

// Sidebar: oscuro vino · Contenido: crema cálida
const S = {
  bg:     '#1A0E0B',
  border: '#2E1A14',
  text:   '#F0E2D8',
  muted:  '#8A6858',
  dim:    '#4A3028',
  hover:  'rgba(255,255,255,0.06)',
  active: 'rgba(165,32,53,0.22)',
  pill:   '#C84055',
}
const L = {
  bg:      '#F4EEE6',
  surface: '#FFFFFF',
  card:    '#FFFFFF',
  border:  '#E8DDD0',
  border2: '#D4C4B0',
  text:    '#1C1410',
  muted:   '#7A6858',
  dim:     '#B0A090',
  accent:  '#8B1A2A',
  accentL: '#C84055',
  gold:    '#B08020',
}

const NAV = [
  { href: '/dashboard',   label: 'Inicio',       icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { href: '/ventas',      label: 'Ventas',        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { href: '/productos',   label: 'Productos',     icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/clientes',    label: 'Clientes',      icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm8 0a3 3 0 11-6 0' },
  { href: '/proveedores', label: 'Proveedores',   icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a1 1 0 01-1 1h-1m-5 0a2 2 0 100 4 2 2 0 000-4m5 0a2 2 0 100 4 2 2 0 000-4' },
  { href: '/compras',     label: 'Compras',       icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { href: '/bodegas',     label: 'Bodegas',       icon: 'M3 21V5a2 2 0 012-2h14a2 2 0 012 2v16M9 21V9h6v12' },
  { href: '/vendedores',  label: 'Vendedores',    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { href: '/movimientos', label: 'Movimientos',   icon: 'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4' },
  { href: '/caja',        label: 'Caja',          icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { href: '/reportes',    label: 'Reportes',      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

const TIPO_ICON: Record<string, string> = { venta: '🧾', cliente: '👤', producto: '🍷' }
const TIPO_COLOR: Record<string, string> = { venta: '#3070A8', cliente: '#B08020', producto: '#2E8B57' }

interface SearchResult { tipo: string; id: string; titulo: string; subtitulo: string; href: string }

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

  function goToResult(r: SearchResult) {
    router.push(r.href); setSearchOpen(false); setSearchQ(''); setSearchResults([])
  }

  function onSearchKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchSel(s => Math.min(s + 1, searchResults.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSearchSel(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && searchResults[searchSel]) goToResult(searchResults[searchSel])
    if (e.key === 'Escape') setSearchOpen(false)
  }

  if (!empresa) return null
  const esAroma = empresa === 'aroma'
  const currentNav = NAV.find(n => pathname.startsWith(n.href))

  return (
    <div style={{ minHeight: '100vh', background: L.bg, display: 'flex' }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${L.border2}; border-radius: 2px; }
        .nav-item { transition: background 0.12s, color 0.12s; }
        .nav-item:hover { background: ${S.hover} !important; color: ${S.text} !important; }
        .nav-item.active { background: ${S.active} !important; color: ${S.text} !important; }
        .sres { transition: background 0.1s; }
        .sres:hover, .sres.sel { background: ${L.bg} !important; }
        .search-btn:hover { border-color: ${L.border2} !important; background: ${L.bg} !important; }
        .cambiar-btn:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 220, flexShrink: 0, background: S.bg,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* Brand */}
        <div style={{ padding: '22px 18px 16px' }}>
          <Image
            src={esAroma ? '/logos/aroma.jpg' : '/logos/lavid.png'}
            alt={esAroma ? 'Aroma de Vid' : 'La Vid Consultora'}
            width={120} height={36}
            style={{ objectFit: 'contain', height: 36, width: 'auto', maxWidth: '100%' }}
          />
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: esAroma ? '#E06070' : '#7AADFF',
              boxShadow: `0 0 8px ${esAroma ? '#E06070' : '#7AADFF'}`,
            }} />
            <span style={{ fontSize: 11, color: S.muted, fontWeight: 500 }}>
              {esAroma ? 'Aroma de Vid' : 'La Vid Consultora'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: S.border, margin: '0 12px 8px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 8px' }}>
          {NAV.map(n => {
            const active = pathname.startsWith(n.href)
            return (
              <Link key={n.href} href={n.href}
                className={`nav-item${active ? ' active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7px 10px', borderRadius: 7, marginBottom: 1,
                  color: active ? S.text : S.muted,
                  textDecoration: 'none', fontSize: 13, fontWeight: active ? 600 : 400,
                  position: 'relative',
                }}>
                {active && (
                  <div style={{
                    position: 'absolute', left: 0, top: '18%', bottom: '18%',
                    width: 3, borderRadius: '0 2px 2px 0',
                    background: `linear-gradient(180deg, ${S.pill}, #8B1A2A)`,
                  }} />
                )}
                <NavIcon d={n.icon} />
                {n.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding: '10px 12px 16px', borderTop: `1px solid ${S.border}` }}>
          <button className="cambiar-btn"
            onClick={() => { localStorage.removeItem('empresa'); router.push('/') }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: 'none',
              borderRadius: 7, padding: '7px 10px', cursor: 'pointer',
              color: S.dim, fontSize: 12, transition: 'background 0.12s', textAlign: 'left',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Cambiar empresa
          </button>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          height: 52, background: L.surface,
          borderBottom: `1px solid ${L.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 40,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          {/* Page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {currentNav && (
              <>
                <span style={{ color: L.dim, display: 'flex' }}><NavIcon d={currentNav.icon} /></span>
                <span style={{ fontSize: 14, fontWeight: 600, color: L.text }}>{currentNav.label}</span>
              </>
            )}
          </div>

          {/* Right: search + badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="search-btn" onClick={() => setSearchOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: L.bg, border: `1px solid ${L.border}`,
                borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                color: L.muted, fontSize: 12, transition: 'all 0.12s',
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span>Buscar</span>
              <kbd style={{ fontSize: 10, color: L.dim, background: L.border, borderRadius: 4, padding: '1px 5px', lineHeight: 1.6, border: 'none' }}>⌘K</kbd>
            </button>

            <div style={{
              fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 99,
              background: esAroma ? 'rgba(139,26,42,0.1)' : 'rgba(48,112,168,0.1)',
              color: esAroma ? '#8B1A2A' : '#3070A8',
              border: `1px solid ${esAroma ? 'rgba(139,26,42,0.25)' : 'rgba(48,112,168,0.25)'}`,
              letterSpacing: '0.05em', textTransform: 'uppercase' as const,
            }}>
              {esAroma ? 'Retail' : 'Distribución'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: 0, minWidth: 0 }}>
          {children}
        </main>
      </div>

      {/* ── Búsqueda global ────────────────────────────────────────────────── */}
      {searchOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,20,16,0.55)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh' }}
          onClick={e => e.target === e.currentTarget && setSearchOpen(false)}>
          <div style={{ background: L.surface, border: `1px solid ${L.border2}`, borderRadius: 14, width: '100%', maxWidth: 560, boxShadow: '0 24px 60px rgba(28,20,16,0.2)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: searchResults.length > 0 || searchLoading ? `1px solid ${L.border}` : 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={L.muted} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input ref={searchRef} value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={onSearchKey}
                placeholder="Buscar ventas, clientes, productos..."
                style={{ background: 'transparent', border: 'none', color: L.text, fontSize: 15, outline: 'none', flex: 1 }} />
              {searchLoading && <div style={{ fontSize: 12, color: L.dim }}>...</div>}
              <kbd style={{ fontSize: 10, color: L.dim, background: L.bg, border: `1px solid ${L.border}`, borderRadius: 4, padding: '2px 5px' }}>Esc</kbd>
            </div>

            {searchResults.length > 0 && (
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {searchResults.map((r, i) => (
                  <div key={r.id + r.tipo} className={`sres${searchSel === i ? ' sel' : ''}`}
                    style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < searchResults.length - 1 ? `1px solid ${L.border}` : 'none' }}
                    onClick={() => goToResult(r)} onMouseEnter={() => setSearchSel(i)}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${TIPO_COLOR[r.tipo]}15`, border: `1px solid ${TIPO_COLOR[r.tipo]}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                      {TIPO_ICON[r.tipo]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: L.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titulo}</div>
                      <div style={{ fontSize: 11, color: L.muted, marginTop: 1 }}>{r.subtitulo}</div>
                    </div>
                    <span style={{ fontSize: 10, color: TIPO_COLOR[r.tipo], background: `${TIPO_COLOR[r.tipo]}15`, padding: '2px 7px', borderRadius: 5, flexShrink: 0, fontWeight: 700 }}>{r.tipo}</span>
                  </div>
                ))}
              </div>
            )}
            {searchQ.length >= 2 && !searchLoading && searchResults.length === 0 && (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: L.dim, fontSize: 13 }}>Sin resultados para &ldquo;{searchQ}&rdquo;</div>
            )}
            {!searchQ && (
              <div style={{ padding: '14px 16px', color: L.dim, fontSize: 12, lineHeight: 1.6 }}>
                Escribí para buscar · <span style={{ color: L.muted }}>↑↓ navegar · Enter para ir</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
