import { clienteActual } from '@/lib/session'
import { catalogoDe } from '@/lib/catalogo'
import { EMPRESAS } from '@/lib/empresas'
import Header from './Header'
import SinSesion from './SinSesion'
import Catalogo from './Catalogo'

export const dynamic = 'force-dynamic'

export default async function Inicio({ searchParams }: { searchParams: { pase?: string } }) {
  const cliente = await clienteActual()
  if (!cliente && searchParams.pase === 'vencido') return <SinSesion titulo="Acceso vencido" texto="Ese acceso de administración ya se usó o venció (duran 5 minutos). Generá otro desde Gestión > Clientes > Ver portal como este cliente." />
  if (!cliente) return <SinSesion titulo="Entrá con tu link" texto="Para ver tu lista de precios, abrí el link personal que te mandamos por WhatsApp e ingresá tu PIN." />

  const catalogo = await catalogoDe(cliente)
  const emp = EMPRESAS[cliente.empresa]
  const hoy = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })

  return (
    <div data-empresa={cliente.empresa}>
      <Header empresa={cliente.empresa} activo="catalogo" admin={cliente.admin} preview={cliente.preview} cliente={cliente.nombre} />
      <main className="wrap">
        {!catalogo ? (
          <div className="vacio">
            <h1 className="serif" style={{ fontSize: 30, fontWeight: 600, color: 'var(--ink)' }}>Hola, {cliente.nombre}</h1>
            <p>Todavía no tenés una lista de precios asignada. Avisale a tu vendedor o llamanos al {emp.telefono}.</p>
          </div>
        ) : (
          <Catalogo
            clienteId={cliente.id ?? `preview-${cliente.lista_precio_id}`}
            clienteNombre={cliente.preview ? 'Vista previa' : cliente.nombre}
            preview={cliente.preview}
            lista={catalogo.lista}
            descuento={catalogo.descuento}
            actualizado={hoy}
            items={catalogo.items}
          />
        )}
      </main>
    </div>
  )
}
