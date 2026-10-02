import { redirect } from 'next/navigation'
import { clienteActual } from '@/lib/session'
import { catalogoDe } from '@/lib/catalogo'
import { recomendacionesDe } from '@/lib/recomendaciones'
import Header from './Header'
import SinSesion from './SinSesion'
import Ingreso from './Ingreso'
import Catalogo from './Catalogo'

export const dynamic = 'force-dynamic'

export default async function Inicio({ searchParams }: { searchParams: { pase?: string } }) {
  const cliente = await clienteActual()
  if (!cliente && searchParams.pase === 'vencido') return <SinSesion titulo="Acceso vencido" texto="Ese acceso de administración ya se usó o venció (duran 5 minutos). Generá otro desde Gestión > Clientes > Ver portal como este cliente." />
  if (!cliente) return <Ingreso />

  // Primer ingreso: confirmar contacto y horarios de entrega antes del catálogo.
  if (!cliente.datosConfirmados) redirect('/datos')

  const catalogo = await catalogoDe(cliente)
  const recomendaciones = cliente.id ? await recomendacionesDe(cliente.id, catalogo.items) : undefined
  const hoy = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })

  return (
    <div data-empresa={cliente.empresa}>
      <Header empresa={cliente.empresa} activo="catalogo" admin={cliente.admin} preview={cliente.preview} cliente={cliente.nombre} vendedor={cliente.vendedor?.nombre} />
      <main className="wrap">
        <Catalogo
          clienteId={cliente.id ?? `preview-${cliente.empresa}`}
          clienteNombre={cliente.nombre}
          preview={cliente.preview}
          actualizado={hoy}
          items={catalogo.items}
          marcas={catalogo.marcas}
          recomendaciones={recomendaciones}
        />
      </main>
    </div>
  )
}
