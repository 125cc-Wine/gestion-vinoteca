import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { vendedorActual } from '@/lib/session'
import Ingreso from '../../../Ingreso'
import CobroForm from './CobroForm'

export const dynamic = 'force-dynamic'

const pesos = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR')

export default async function Cobro({ params }: { params: { id: string } }) {
  const vendedor = await vendedorActual()
  if (!vendedor) return <Ingreso />
  const { data: c } = await db.from('clientes').select('id, nombre, apellido, razon_social, saldo')
    .eq('id', params.id).eq('vendedor_id', vendedor.id).maybeSingle()
  if (!c) redirect('/vendedor')
  const nombre = c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()
  const saldo = Number(c.saldo) || 0

  return (
    <main className="wrap">
      <div style={{ padding: '14px 0' }}><Link href="/vendedor" className="volver">← Mis clientes</Link></div>
      <section className="hero"><div className="kicker">Anotar cobro</div><h1>{nombre}</h1>
        <p>{saldo > 0.5 ? <>Saldo a cobrar: <b>{pesos(saldo)}</b></> : 'No tiene saldo pendiente.'}</p>
      </section>
      <CobroForm clienteId={c.id} saldo={saldo} />
    </main>
  )
}
