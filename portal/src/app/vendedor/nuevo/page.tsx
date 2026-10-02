import Link from 'next/link'
import { vendedorActual } from '@/lib/session'
import Ingreso from '../../Ingreso'
import NuevoForm from './NuevoForm'

export const dynamic = 'force-dynamic'

export default async function NuevoCliente() {
  const vendedor = await vendedorActual()
  if (!vendedor) return <Ingreso />
  return (
    <main className="wrap">
      <div style={{ padding: '14px 0' }}><Link href="/vendedor" className="volver">← Mis clientes</Link></div>
      <section className="hero"><div className="kicker">Cliente nuevo</div><h1>Dar de alta</h1>
        <p>Queda en tu cartera y la oficina lo revisa. Ya le podés tomar un pedido.</p></section>
      <NuevoForm />
    </main>
  )
}
