'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

const C = {
  bg:      '#0F0F0F',
  surface: '#141414',
  border:  '#2A2A2A',
  accent:  '#8B1A2A',
  text:    '#E8E8E8',
  muted:   '#888888',
  dim:     '#444444',
}

const NAV = [
  { href: '/dashboard',   label: 'Inicio' },
  { href: '/ventas',      label: 'Ventas' },
  { href: '/pedidos',     label: 'Pedidos' },
  { href: '/productos',   label: 'Productos' },
  { href: '/bodegas',     label: 'Bodegas' },
  { href: '/clientes',    label: 'Clientes' },
  { href: '/proveedores', label: 'Proveedores' },
  { href: '/caja',        label: 'Caja' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [empresa, setEmpresa] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const e = localStorage.getItem('empresa')
    if (!e) router.push('/')
    else setEmpresa(e)
  }, [router])

  if (!empresa) return null

  const esAroma = empresa === 'aroma'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .nav-link { transition: color 0.15s, background 0.15s; }
        .nav-link:hover { color: ${C.text} !important; background: rgba(255,255,255,0.05) !important; }
        .nav-link.active { color: ${C.text} !important; background: rgba(139,26,42,0.18) !important; }
        .nav-link.active::after {
          content: '';
          position: absolute; bottom: -1px; left: 8px; right: 8px;
          height: 2px; background: ${C.accent}; border-radius: 2px;
        }
        .nav-link { position: relative; }
        .cambiar-btn:hover { color: ${C.muted} !important; }
      `}</style>

      <header style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 52 }}>
          {/* Logo + badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 180 }}>
            <Image
              src={esAroma ? '/logos/aroma.jpg' : '/logos/lavid.png'}
              alt={esAroma ? 'Aroma de Vid' : 'La Vid Consultora'}
              width={90} height={28}
              style={{ objectFit: 'contain', height: 28, width: 'auto' }}
            />
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
              padding: '2px 8px', borderRadius: 99,
              background: esAroma ? 'rgba(139,26,42,0.15)' : 'rgba(100,140,220,0.12)',
              color: esAroma ? '#D08090' : '#7AADFF',
              border: `1px solid ${esAroma ? 'rgba(139,26,42,0.35)' : 'rgba(100,140,220,0.3)'}`,
              textTransform: 'uppercase',
            }}>
              {esAroma ? 'Retail' : 'Distribución'}
            </span>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {NAV.map(n => {
              const active = pathname.startsWith(n.href)
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`nav-link${active ? ' active' : ''}`}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    color: active ? C.text : C.muted,
                    textDecoration: 'none',
                    display: 'block',
                  }}
                >
                  {n.label}
                </Link>
              )
            })}
          </nav>

          {/* Cambiar empresa */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 180, justifyContent: 'flex-end' }}>
            <button
              className="cambiar-btn"
              onClick={() => { localStorage.removeItem('empresa'); router.push('/') }}
              style={{ fontSize: 11, color: C.dim, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
            >
              cambiar empresa
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 1600, width: '100%', margin: '0 auto', padding: '0 0' }}>
        {children}
      </main>
    </div>
  )
}
