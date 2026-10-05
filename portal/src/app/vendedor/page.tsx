import Link from 'next/link'
import { vendedorActual } from '@/lib/session'
import { resumenVendedor } from '@/lib/vendedor'
import Ingreso from '../Ingreso'
import Cartera from './Cartera'
import CambiarPin from '../cuenta/CambiarPin'

export const dynamic = 'force-dynamic'

const pesos = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR')

// Pantalla del vendedor de calle: su cartera, su mes y sus cobros.
export default async function Vendedor() {
  const vendedor = await vendedorActual()
  if (!vendedor) return <Ingreso />
  const r = await resumenVendedor(vendedor.id)
  const comision = r.mes.total * r.mes.comisionPct / 100

  return (
    <div>
      <header className="top">
        <div className="top-in">
          <span className="brand"><span>🚶 {vendedor.nombre}</span></span>
          <nav className="top-nav">
            <Link href="/vendedor" aria-current="page">Mis clientes</Link>
            <Link href="/vendedor/stock">Lista y stock</Link>
            <Link href="/vendedor/nuevo">Nuevo cliente</Link>
            <form action="/api/logout" method="post"><button>Salir</button></form>
          </nav>
        </div>
      </header>
      <main className="wrap">
        <section className="hero"><div className="kicker">Vendedor</div><h1>Mis clientes</h1></section>

        <div className="cuenta-res">
          <div className="saldo ok">
            <small>Pedidos de este mes</small>
            <strong>{pesos(r.mes.total)}</strong>
          </div>
          <div className="saldo-info">
            <div><b>{r.mes.pedidos}</b> {r.mes.pedidos === 1 ? 'pedido' : 'pedidos'}</div>
            {r.mes.comisionPct > 0 && <div>Comisión estimada ({r.mes.comisionPct}%): <b>{pesos(comision)}</b></div>}
          </div>
        </div>

        <Cartera clientes={r.clientes} />

        <CambiarPin endpoint="/api/vendedor/pin" />

        {r.cobros.length > 0 && (
          <section className="grupo">
            <div className="grupo-h"><h2>Mis cobros</h2><small>se aplican cuando los confirma la oficina</small></div>
            {r.cobros.map(c => (
              <div key={c.id} className="mov">
                <div>
                  <div className="fila-nom">{c.cliente}</div>
                  <div className="fila-sub">
                    <span>{new Date(c.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} · {c.medio}</span>
                    <span className={`disp ${c.estado === 'confirmado' ? 'disp-ok' : 'disp-no'}`}>{c.estado === 'pendiente' ? 'Pendiente de confirmar' : c.estado === 'confirmado' ? 'Confirmado' : 'Rechazado'}</span>
                  </div>
                </div>
                <b>{pesos(c.monto)}</b>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
