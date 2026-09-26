import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { clienteActual } from '@/lib/session'
import { EMPRESAS } from '@/lib/empresas'
import PinForm from './PinForm'

export const dynamic = 'force-dynamic'

// Entrada por el link personal. Si ya hay sesión de este mismo link, pasa
// directo al catálogo; si no, pide el PIN. No se muestra el nombre del
// cliente antes del PIN (el link puede haberse reenviado).
export default async function Acceso({ params }: { params: { token: string } }) {
  const actual = await clienteActual()
  if (actual && actual.portal_token === params.token) redirect('/')

  const { data } = await db.from('clientes').select('empresa, portal_activo')
    .eq('portal_token', params.token).maybeSingle()
  const empresa = data?.empresa === 'lavid' ? 'lavid' : 'aroma'
  const emp = EMPRESAS[empresa]

  return (
    <main className="acceso" data-empresa={empresa}>
      <div className="acceso-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={emp.logo} alt={emp.nombre} />
        {data?.portal_activo ? (
          <>
            <h1>Tu lista de precios</h1>
            <p>Ingresá el PIN que te mandamos junto con este link para ver tus precios y hacer pedidos.</p>
            <PinForm token={params.token} />
          </>
        ) : (
          <>
            <h1>Link no disponible</h1>
            <p>Este link ya no está activo. Pedile uno nuevo a tu vendedor de {emp.nombre} o llamanos al {emp.telefono}.</p>
          </>
        )}
        <div className="pie">{emp.nombre} · {emp.domicilio}</div>
      </div>
    </main>
  )
}
