import Link from 'next/link'
import { descuentoGeneral, vendedorActual } from '@/lib/session'
import { catalogoDe } from '@/lib/catalogo'
import Ingreso from '../../Ingreso'
import ListaStock from './ListaStock'

export const dynamic = 'force-dynamic'

// Lista y stock para el vendedor: todo el catálogo con el stock exacto, el
// precio de lista y el precio con el descuento general, sin elegir cliente.
// (El precio de cada cliente, con sus descuentos especiales, se ve al tomarle
// el pedido.) El stock es compartido entre Aroma y La Vid.
export default async function Stock() {
  const vendedor = await vendedorActual()
  if (!vendedor) return <Ingreso />
  const general = await descuentoGeneral()
  const { items, marcas } = await catalogoDe({
    id: null, empresa: 'aroma', nombre: '', descuento: general, portal_token: null,
    admin: false, preview: true, datosConfirmados: true, verificado: false, vendedor,
  }, { conStock: true })

  return (
    <div>
      <header className="top">
        <div className="top-in">
          <span className="brand"><span>🚶 {vendedor.nombre}</span></span>
          <nav className="top-nav">
            <Link href="/vendedor">Mis clientes</Link>
            <Link href="/vendedor/stock" aria-current="page">Lista y stock</Link>
            <Link href="/vendedor/nuevo">Nuevo cliente</Link>
            <form action="/api/logout" method="post"><button>Salir</button></form>
          </nav>
        </div>
      </header>
      <main className="wrap">
        <ListaStock items={items} general={general} logos={Object.fromEntries(marcas.filter(m => m.logo).map(m => [m.clave, m.logo!]))} />
      </main>
    </div>
  )
}
