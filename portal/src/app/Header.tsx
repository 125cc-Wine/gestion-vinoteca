import Link from 'next/link'
import { EMPRESAS, type EmpresaId } from '@/lib/empresas'

export default function Header({ empresa, activo, admin, preview, cliente, vendedor }: { empresa: EmpresaId; activo: 'catalogo' | 'pedidos' | 'datos' | 'cuenta'; admin?: boolean; preview?: boolean; cliente?: string; vendedor?: string | null }) {
  const emp = EMPRESAS[empresa]
  return (
    <header className="top">
      {admin && (
        <div className="admin-bar">
          {preview
            ? <>Vista previa de administración, con el descuento general. Así lo ve un cliente; desde acá no se envían pedidos.</>
            : <>Vista de administración · estás viendo el portal como <b>{cliente}</b>. Lo que pidas acá entra como pedido de este cliente.</>}
        </div>
      )}
      {vendedor && (
        <div className="vend-bar">
          🚶 {vendedor} · atendiendo a <b>{cliente}</b> · <Link href="/vendedor">Cambiar de cliente</Link>
        </div>
      )}
      {!admin && !vendedor && (
        <div className="beta-bar">
          <b>Versión de prueba</b> · Precios y disponibilidad se confirman al tomar tu pedido. Si ves algo raro, avisanos.
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
          {!preview && <Link href="/cuenta" aria-current={activo === 'cuenta' ? 'page' : undefined}>Mi cuenta</Link>}
          {!preview && <Link href="/datos" aria-current={activo === 'datos' ? 'page' : undefined}>Mis datos</Link>}
          <form action="/api/logout" method="post"><button>Salir</button></form>
        </nav>
      </div>
    </header>
  )
}
