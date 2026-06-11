'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard',   label: 'Inicio',      icon: '📊' },
  { href: '/ventas',      label: 'Ventas',       icon: '🧾' },
  { href: '/pedidos',     label: 'Pedidos',      icon: '📋' },
  { href: '/productos',   label: 'Productos',    icon: '🍷' },
  { href: '/bodegas',     label: 'Bodegas',      icon: '🏭' },
  { href: '/clientes',    label: 'Clientes',     icon: '👥' },
  { href: '/proveedores', label: 'Proveedores',  icon: '🚛' },
  { href: '/caja',        label: 'Caja',         icon: '💰' },
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

  const headerCls = esAroma
    ? 'bg-[#FEFBF6] border-b border-amber-100'
    : 'bg-[#0D1424] border-b border-slate-700'

  const activeCls = esAroma
    ? 'bg-amber-100 text-amber-900 font-semibold'
    : 'bg-slate-700 text-white font-semibold'

  const inactiveCls = esAroma
    ? 'text-gray-500 hover:text-amber-800 hover:bg-amber-50'
    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'

  const badgeCls = esAroma
    ? 'text-amber-800 border-amber-200 bg-amber-50'
    : 'text-cyan-300 border-cyan-700 bg-cyan-950'

  const changeCls = esAroma
    ? 'text-gray-400 hover:text-amber-700'
    : 'text-slate-500 hover:text-slate-300'

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`${headerCls} sticky top-0 z-50 shadow-sm`}>
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <Image
              src={esAroma ? '/logos/aroma.jpg' : '/logos/lavid.png'}
              alt={esAroma ? 'Aroma de Vid' : 'La Vid Consultora'}
              width={100} height={32}
              style={{ objectFit: 'contain', height: '32px', width: 'auto' }}
            />
            <span className={`text-xs px-2 py-0.5 rounded-full border ${badgeCls}`}>
              {esAroma ? 'Consumidor final' : 'Reventa'}
            </span>
          </div>

          <nav className="flex gap-0.5">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  pathname.startsWith(n.href) ? activeCls : inactiveCls
                }`}
              >
                <span className="mr-1">{n.icon}</span>{n.label}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => { localStorage.removeItem('empresa'); router.push('/') }}
            className={`text-xs ${changeCls} transition-colors`}
          >
            cambiar empresa
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-screen-2xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
