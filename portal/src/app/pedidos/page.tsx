import { clienteActual } from '@/lib/session'
import { db } from '@/lib/db'
import Header from '../Header'
import Ingreso from '../Ingreso'

export const dynamic = 'force-dynamic'

const ESTADO: Record<string, string> = { pendiente: 'Recibido', entregado: 'Entregado', cancelado: 'Cancelado' }
const pesos = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR')

interface Linea { nombre: string; cantidad: number; precio_unitario: number }

export default async function MisPedidos() {
  const cliente = await clienteActual()
  if (!cliente) return <Ingreso />

  const { data } = cliente.id
    ? await db.from('pedidos').select('numero, created_at, estado, total, items, fecha_entrega')
      .eq('cliente_id', cliente.id).order('created_at', { ascending: false }).limit(30)
    : { data: [] }
  const pedidos = data ?? []

  return (
    <div data-empresa={cliente.empresa}>
      <Header empresa={cliente.empresa} activo="pedidos" admin={cliente.admin} preview={cliente.preview} cliente={cliente.nombre} vendedor={cliente.vendedor?.nombre} />
      <main className="wrap">
        <section className="hero">
          <div className="kicker">{cliente.nombre}</div>
          <h1>Mis pedidos</h1>
        </section>
        {pedidos.length === 0 && <div className="vacio">Todavía no hiciste pedidos.</div>}
        {pedidos.map(p => {
          const items = (p.items as Linea[]) ?? []
          return (
            <article className="ped" key={p.numero}>
              <div className="ped-h"><b>{p.numero}</b><strong>{pesos(Number(p.total) || 0)}</strong></div>
              <div className="ped-sub">
                <span className={`estado estado-${p.estado}`}>{ESTADO[p.estado] ?? p.estado}</span>
                <span>{new Date(p.created_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })} hs</span>
                {p.fecha_entrega && <span>Entrega: {new Date(p.fecha_entrega + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' })}</span>}
              </div>
              <ul>
                {items.map((i, k) => <li key={k}><span>{i.cantidad} × {i.nombre}</span><span>{pesos(i.cantidad * i.precio_unitario)}</span></li>)}
              </ul>
            </article>
          )
        })}
      </main>
    </div>
  )
}
