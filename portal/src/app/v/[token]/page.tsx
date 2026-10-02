import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { vendedorActual } from '@/lib/session'
import { EMPRESAS } from '@/lib/empresas'
import PinForm from '../../c/[token]/PinForm'

export const dynamic = 'force-dynamic'

// Entrada del vendedor de calle por su link personal.
export default async function AccesoVendedor({ params }: { params: { token: string } }) {
  const actual = await vendedorActual()
  if (actual) redirect('/vendedor')
  const { data } = await db.from('vendedores').select('nombre, activo').eq('portal_token', params.token).maybeSingle()

  return (
    <main className="acceso">
      <div className="acceso-card">
        <div className="acceso-logos">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={EMPRESAS.aroma.logo} alt={EMPRESAS.aroma.nombre} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={EMPRESAS.lavid.logo} alt={EMPRESAS.lavid.nombre} />
        </div>
        {data?.activo ? (
          <>
            <h1>Hola, {data.nombre}</h1>
            <p>Ingresá tu PIN de vendedor para ver tus clientes, tomar pedidos y anotar cobros.</p>
            <PinForm token={params.token} vendedor />
          </>
        ) : (
          <>
            <h1>Link no disponible</h1>
            <p>Este link de vendedor ya no está activo. Pedí uno nuevo.</p>
          </>
        )}
      </div>
    </main>
  )
}
