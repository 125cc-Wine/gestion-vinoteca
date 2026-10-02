import { db } from '@/lib/db'
import { clienteActual } from '@/lib/session'
import type { DatosEntrega } from '@/lib/datos'
import Header from '../Header'
import Ingreso from '../Ingreso'
import DatosForm from './DatosForm'

export const dynamic = 'force-dynamic'

// "Tus datos": contacto y horarios de entrega. La primera vez que el cliente
// entra se le muestra esto antes del catálogo; después, desde el menú.
export default async function Datos() {
  const cliente = await clienteActual()
  if (!cliente) return <Ingreso />
  if (!cliente.id) return <Ingreso />   // la vista previa de admin no tiene datos propios

  const { data } = await db.from('clientes').select('nombre, apellido, telefono, email, direccion, portal_datos').eq('id', cliente.id).maybeSingle()
  const guardado = (data?.portal_datos ?? null) as DatosEntrega | null
  // Precarga con lo que ya tenemos en la ficha, para que solo confirme.
  const inicial: DatosEntrega = guardado ?? {
    contacto: `${data?.nombre ?? ''} ${data?.apellido ?? ''}`.trim(),
    telefono: data?.telefono ?? '', email: data?.email ?? '', direccion: data?.direccion ?? '',
    dias: [], desde: '09:00', hasta: '18:00', notas: '',
  }

  return (
    <div data-empresa={cliente.empresa}>
      <Header empresa={cliente.empresa} activo="datos" admin={cliente.admin} preview={cliente.preview} cliente={cliente.nombre} vendedor={cliente.vendedor?.nombre} />
      <main className="wrap">
        <DatosForm inicial={inicial} primeraVez={!cliente.datosConfirmados} nombre={cliente.nombre} />
      </main>
    </div>
  )
}
