import { redirect } from 'next/navigation'
import { EMPRESAS } from '@/lib/empresas'
import { vendedorActual } from '@/lib/session'
import LoginForm from './LoginForm'

// Pantalla de ingreso cuando no hay sesión: sirve para las dos empresas
// (cada cliente entra a la suya según con qué datos se identifica).
export default async function Ingreso() {
  // Un vendedor sin cliente elegido va a su lista de clientes.
  if (await vendedorActual()) redirect('/vendedor')
  return (
    <main className="acceso">
      <div className="acceso-card">
        <div className="acceso-logos">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={EMPRESAS.aroma.logo} alt={EMPRESAS.aroma.nombre} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={EMPRESAS.lavid.logo} alt={EMPRESAS.lavid.nombre} />
        </div>
        <h1>Tu lista de precios</h1>
        <p>Entrá con el CUIT con el que te facturamos.</p>
        <LoginForm />
        <div className="ayuda"><b>Versión de prueba:</b> precios y disponibilidad se confirman al tomar tu pedido.</div>
        <div className="ayuda">¿No te reconoce el CUIT? Escribile a tu vendedor y te damos de alta.</div>
      </div>
    </main>
  )
}
