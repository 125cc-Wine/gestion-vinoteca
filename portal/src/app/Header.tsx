import Link from 'next/link'
import { EMPRESAS, type EmpresaId } from '@/lib/empresas'

export default function Header({ empresa, activo, admin, preview, cliente }: { empresa: EmpresaId; activo: 'catalogo' | 'pedidos'; admin?: boolean; preview?: boolean; cliente?: string }) {
  const emp = EMPRESAS[empresa]
  return (
    <header className="top">
      {admin && (
        <div className="admin-bar">
          {preview
            ? <>Vista previa de administración · lista <b>{cliente}</b>. Así la ve un cliente; desde acá no se envían pedidos.</>
            : <>Vista de administración · estás viendo el portal como <b>{cliente}</b>. Lo que pidas acá entra como pedido de este cliente.</>}
        </div>
      )}
      <div className="top-in">
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={emp.logo} alt="" />
          <span>{emp.nombre}</span>
        </Link>
        <nav className="top-nav">
          <Link href="/" aria-current={activo === 'catalogo' ? 'page' : undefined}>Catálogo</Link>
          <Link href="/pedidos" aria-current={activo === 'pedidos' ? 'page' : undefined}>Mis pedidos</Link>
          <form action="/api/logout" method="post"><button>Salir</button></form>
        </nav>
      </div>
    </header>
  )
}
