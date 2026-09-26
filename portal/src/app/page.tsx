import { clienteActual } from '@/lib/session'
import { catalogoDe } from '@/lib/catalogo'
import { EMPRESAS } from '@/lib/empresas'
import Header from './Header'
import SinSesion from './SinSesion'
import Catalogo from './Catalogo'

export const dynamic = 'force-dynamic'

export default async function Inicio() {
  const cliente = await clienteActual()
  if (!cliente) return <SinSesion titulo="Entrá con tu link" texto="Para ver tu lista de precios, abrí el link personal que te mandamos por WhatsApp e ingresá tu PIN." />

  const catalogo = await catalogoDe(cliente)
  const emp = EMPRESAS[cliente.empresa]
  const hoy = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })

  return (
    <div data-empresa={cliente.empresa}>
      <Header empresa={cliente.empresa} activo="catalogo" />
      <main className="wrap">
        {!catalogo ? (
          <div className="vacio">
            <h1 className="serif" style={{ fontSize: 30, fontWeight: 600, color: 'var(--ink)' }}>Hola, {cliente.nombre}</h1>
            <p>Todavía no tenés una lista de precios asignada. Avisale a tu vendedor o llamanos al {emp.telefono}.</p>
          </div>
        ) : (
          <Catalogo
            clienteId={cliente.id}
            clienteNombre={cliente.nombre}
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
