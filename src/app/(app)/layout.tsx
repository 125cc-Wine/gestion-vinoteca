'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Inicio', icon: '📊' },
  { href: '/productos', label: 'Productos', icon: '🍷' },
  { href: '/bodegas', label: 'Bodegas', icon: '🏭' },
  { href: '/clientes', label: 'Clientes', icon: '👥' },
  { href: '/proveedores', label: 'Proveedores', icon: '🚛' },
  { href: '/ventas', label: 'Ventas', icon: '🧾' },
  { href: '/pedidos', label: 'Pedidos', icon: '📦' },
  { href: '/caja', label: 'Caja', icon: '💰' },
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
    <div className="min-h-screen flex flex-col">
      <header className={`${esAroma ? 'bg-white border-b border-gray-100' : 'bg-gray-900 border-b border-gray-700'} sticky top-0 z-50`}>
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <Image
              src={esAroma ? '/logos/aroma.jpg' : '/logos/lavid.png'}
              alt={esAroma ? 'Aroma de Vid' : 'La Vid Consultora'}
              width={100} height={32}
              style={{ objectFit: 'contain', height: '32px', width: 'auto' }}
            />
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              esAroma ? 'text-amber-700 border-amber-200 bg-amber-50' : 'text-cyan-400 border-cyan-800 bg-cyan-950'
            }`}>
              {esAroma ? 'Consumidor final' : 'Reventa'}
            </span>
          </div>

          <nav className="flex gap-1">
            {NAV.map(n => (
              <Link key={n.href} href={n.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  pathname.startsWith(n.href)
                    ? esAroma ? 'bg-gray-100 text-gray-800' : 'bg-gray-700 text-white'
                    : esAroma ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}>
                <span className="mr-1">{n.icon}</span>{n.label}
              </Link>
            ))}
          </nav>

          <button onClick={() => { localStorage.removeItem('empresa'); router.push('/') }}
            className={`text-xs ${esAroma ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-gray-300'}`}>
            cambiar empresa
          </button>
        </div>
      </header>

      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
