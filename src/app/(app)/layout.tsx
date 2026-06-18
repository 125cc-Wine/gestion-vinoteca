'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

const C = {
  bg:      '#0A0A0A',
  sidebar: '#0F0F0F',
  surface: '#111111',
  card:    '#161616',
  border:  '#1F1F1F',
  border2: '#2A2A2A',
  accent:  '#8B1A2A',
  accentL: '#C0364A',
  text:    '#F0F0F0',
  muted:   '#777777',
  dim:     '#444444',
  green:   '#4CAF7D',
  amber:   '#D4820A',
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
const TIPO_COLOR: Record<string, string> = { venta: '#7AADFF', cliente: '#D4820A', producto: '#4CAF7D' }

interface SearchResult { tipo: string; id: string; titulo: string; subtitulo: string; href: string }

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex' }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border2}; border-radius: 2px; }
        .nav-item { transition: background 0.15s, color 0.15s; }
        .nav-item:hover { background: rgba(255,255,255,0.05) !important; color: ${C.text} !important; }
        .nav-item.active { background: rgba(139,26,42,0.2) !important; color: ${C.text} !important; }
        .sres { transition: background 0.1s; }
        .sres:hover, .sres.sel { background: rgba(255,255,255,0.06) !important; }
        .search-btn:hover { border-color: ${C.border2} !important; background: rgba(255,255,255,0.05) !important; }
      `}</style>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 220, flexShrink: 0, background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* Brand */}
        <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${C.border}` }}>
          <Image
            src={esAroma ? '/logos/aroma.jpg' : '/logos/lavid.png'}
            alt={esAroma ? 'Aroma de Vid' : 'La Vid Consultora'}
            width={120} height={36}
            style={{ objectFit: 'contain', height: 36, width: 'auto', maxWidth: '100%' }}
          />
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: esAroma ? C.accentL : '#7AADFF',
              boxShadow: `0 0 6px ${esAroma ? C.accentL : '#7AADFF'}`,
            }} />
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>
              {esAroma ? 'Aroma de Vid' : 'La Vid Consultora'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px' }}>
          {NAV.map(n => {
            const active = pathname.startsWith(n.href)
            return (
              <Link key={n.href} href={n.href}
                className={`nav-item${active ? ' active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8, marginBottom: 1,
                  color: active ? C.text : C.muted,
                  textDecoration: 'none', fontSize: 13, fontWeight: active ? 600 : 400,
                  position: 'relative',
                }}>
                {active && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: 3, borderRadius: '0 2px 2px 0',
                    background: `linear-gradient(180deg, ${C.accentL}, ${C.accent})`,
                  }} />
                )}
                <NavIcon d={n.icon} />
                {n.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => { localStorage.removeItem('empresa'); router.push('/') }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
              color: C.dim, fontSize: 12, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border2; (e.currentTarget as HTMLElement).style.color = C.muted }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.dim }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
          height: 52, background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', position: 'sticky', top: 0, zIndex: 40,
        }}>
          {/* Page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {currentNav && (
              <>
                <span style={{ color: C.dim, display: 'flex' }}><NavIcon d={currentNav.icon} /></span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{currentNav.label}</span>
              </>
            )}
          </div>

          {/* Right: search + badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="search-btn" onClick={() => setSearchOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                color: C.muted, fontSize: 12, transition: 'all 0.15s',
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span>Buscar</span>
              <kbd style={{ fontSize: 10, color: C.dim, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 5px', lineHeight: 1.6 }}>⌘K</kbd>
            </button>

            <div style={{
              fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
              background: esAroma ? 'rgba(139,26,42,0.15)' : 'rgba(100,140,220,0.12)',
              color: esAroma ? '#D08090' : '#7AADFF',
              border: `1px solid ${esAroma ? 'rgba(139,26,42,0.3)' : 'rgba(100,140,220,0.25)'}`,
              letterSpacing: '0.04em', textTransform: 'uppercase' as const,
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '14vh' }}
          onClick={e => e.target === e.currentTarget && setSearchOpen(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 14, width: '100%', maxWidth: 560, boxShadow: '0 32px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: searchResults.length > 0 || searchLoading ? `1px solid ${C.border}` : 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input ref={searchRef} value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={onSearchKey}
                placeholder="Buscar ventas, clientes, productos..."
                style={{ background: 'transparent', border: 'none', color: C.text, fontSize: 15, outline: 'none', flex: 1 }} />
              {searchLoading && <div style={{ fontSize: 12, color: C.dim }}>...</div>}
              <kbd style={{ fontSize: 10, color: C.dim, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 5px' }}>Esc</kbd>
            </div>

            {searchResults.length > 0 && (
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {searchResults.map((r, i) => (
                  <div key={r.id + r.tipo} className={`sres${searchSel === i ? ' sel' : ''}`}
                    style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < searchResults.length - 1 ? `1px solid rgba(31,31,31,0.8)` : 'none' }}
                    onClick={() => goToResult(r)} onMouseEnter={() => setSearchSel(i)}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${TIPO_COLOR[r.tipo]}12`, border: `1px solid ${TIPO_COLOR[r.tipo]}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                      {TIPO_ICON[r.tipo]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titulo}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{r.subtitulo}</div>
                    </div>
                    <span style={{ fontSize: 10, color: TIPO_COLOR[r.tipo], background: `${TIPO_COLOR[r.tipo]}12`, padding: '2px 7px', borderRadius: 5, flexShrink: 0, fontWeight: 600 }}>{r.tipo}</span>
                  </div>
                ))}
              </div>
            )}
            {searchQ.length >= 2 && !searchLoading && searchResults.length === 0 && (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: C.dim, fontSize: 13 }}>Sin resultados para &ldquo;{searchQ}&rdquo;</div>
            )}
            {!searchQ && (
              <div style={{ padding: '14px 16px', color: C.dim, fontSize: 12, lineHeight: 1.6 }}>
                Escribí para buscar · <span style={{ color: C.muted }}>↑↓ navegar · Enter para ir</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
