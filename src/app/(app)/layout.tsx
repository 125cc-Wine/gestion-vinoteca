'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

const C = {
  bg:      '#0F0F0F',
  surface: '#141414',
  card:    '#1A1A1A',
  border:  '#2A2A2A',
  accent:  '#8B1A2A',
  text:    '#E8E8E8',
  muted:   '#888888',
  dim:     '#444444',
}

const NAV = [
  { href: '/dashboard',   label: 'Inicio' },
  { href: '/ventas',      label: 'Ventas' },
  { href: '/productos',   label: 'Productos' },
  { href: '/bodegas',     label: 'Bodegas' },
  { href: '/clientes',    label: 'Clientes' },
  { href: '/proveedores', label: 'Proveedores' },
  { href: '/vendedores',  label: 'Vendedores' },
  { href: '/compras',     label: 'Compras' },
  { href: '/movimientos', label: 'Movimientos' },
  { href: '/reportes',    label: 'Reportes' },
  { href: '/caja',        label: 'Caja' },
]

const TIPO_ICON: Record<string, string> = { venta: '🧾', cliente: '👤', producto: '🍷' }
const TIPO_COLOR: Record<string, string> = { venta: '#7AADFF', cliente: '#D4820A', producto: '#4CAF7D' }

interface SearchResult { tipo: string; id: string; titulo: string; subtitulo: string; href: string }

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [empresa, setEmpresa] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Búsqueda global
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
        const data = await res.json()
        setSearchResults(Array.isArray(data) ? data : [])
        setSearchSel(0)
      } finally { setSearchLoading(false) }
    }, 280)
  }, [searchQ, empresa])

  function goToResult(r: SearchResult) {
    router.push(r.href)
    setSearchOpen(false); setSearchQ(''); setSearchResults([])
  }

  function onSearchKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchSel(s => Math.min(s + 1, searchResults.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSearchSel(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && searchResults[searchSel]) goToResult(searchResults[searchSel])
    if (e.key === 'Escape') setSearchOpen(false)
  }

  if (!empresa) return null
  const esAroma = empresa === 'aroma'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .nav-link { transition: color 0.15s, background 0.15s; }
        .nav-link:hover { color: ${C.text} !important; background: rgba(255,255,255,0.05) !important; }
        .nav-link.active { color: ${C.text} !important; background: rgba(139,26,42,0.18) !important; }
        .nav-link.active::after { content:''; position:absolute; bottom:-1px; left:8px; right:8px; height:2px; background:${C.accent}; border-radius:2px; }
        .nav-link { position: relative; }
        .cambiar-btn:hover { color: ${C.muted} !important; }
        .sres:hover, .sres.sel { background: rgba(255,255,255,0.06) !important; }
      `}</style>

      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 52 }}>
          {/* Logo + badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 160 }}>
            <Image src={esAroma ? '/logos/aroma.jpg' : '/logos/lavid.png'} alt={esAroma ? 'Aroma de Vid' : 'La Vid Consultora'} width={90} height={28} style={{ objectFit: 'contain', height: 28, width: 'auto' }} />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 99, background: esAroma ? 'rgba(139,26,42,0.15)' : 'rgba(100,140,220,0.12)', color: esAroma ? '#D08090' : '#7AADFF', border: `1px solid ${esAroma ? 'rgba(139,26,42,0.35)' : 'rgba(100,140,220,0.3)'}`, textTransform: 'uppercase' }}>
              {esAroma ? 'Retail' : 'Distribución'}
            </span>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'nowrap', overflow: 'hidden' }}>
            {NAV.map(n => {
              const active = pathname.startsWith(n.href)
              return (
                <Link key={n.href} href={n.href} className={`nav-link${active ? ' active' : ''}`}
                  style={{ padding: '5px 9px', borderRadius: 6, fontSize: 11, fontWeight: active ? 600 : 400, color: active ? C.text : C.muted, textDecoration: 'none', display: 'block', whiteSpace: 'nowrap' }}>
                  {n.label}
                </Link>
              )
            })}
          </nav>

          {/* Buscar + cambiar empresa */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160, justifyContent: 'flex-end' }}>
            <button onClick={() => setSearchOpen(true)} title="Buscar (Ctrl+K)"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span style={{ fontSize: 10, opacity: 0.6 }}>⌘K</span>
            </button>
            <button className="cambiar-btn" onClick={() => { localStorage.removeItem('empresa'); router.push('/') }}
              style={{ fontSize: 11, color: C.dim, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s', whiteSpace: 'nowrap' }}>
              cambiar
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 1600, width: '100%', margin: '0 auto', padding: '0 0' }}>
        {children}
      </main>

      {/* Búsqueda global modal */}
      {searchOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}
          onClick={e => e.target === e.currentTarget && setSearchOpen(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, width: '100%', maxWidth: 560, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: searchResults.length > 0 || searchLoading ? `1px solid ${C.border}` : 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input ref={searchRef} value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={onSearchKey}
                placeholder="Buscar ventas, clientes, productos..."
                style={{ background: 'transparent', border: 'none', color: C.text, fontSize: 15, outline: 'none', flex: 1 }} />
              {searchLoading && <div style={{ fontSize: 12, color: C.dim }}>...</div>}
              <kbd style={{ fontSize: 10, color: C.dim, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 5px' }}>Esc</kbd>
            </div>
            {searchResults.length > 0 && (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {searchResults.map((r, i) => (
                  <div key={r.id + r.tipo} className={`sres${searchSel === i ? ' sel' : ''}`}
                    style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < searchResults.length - 1 ? `1px solid rgba(42,42,42,0.5)` : 'none' }}
                    onClick={() => goToResult(r)} onMouseEnter={() => setSearchSel(i)}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${TIPO_COLOR[r.tipo]}15`, border: `1px solid ${TIPO_COLOR[r.tipo]}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                      {TIPO_ICON[r.tipo]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titulo}</div>
                      <div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subtitulo}</div>
                    </div>
                    <span style={{ fontSize: 10, color: TIPO_COLOR[r.tipo], background: `${TIPO_COLOR[r.tipo]}15`, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{r.tipo}</span>
                  </div>
                ))}
              </div>
            )}
            {searchQ.length >= 2 && !searchLoading && searchResults.length === 0 && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: C.dim, fontSize: 13 }}>Sin resultados para "{searchQ}"</div>
            )}
            {!searchQ && (
              <div style={{ padding: '16px', color: C.dim, fontSize: 12 }}>
                Escribí para buscar en ventas, clientes y productos · <span style={{ color: C.muted }}>↑↓ para navegar · Enter para ir</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
