import { EMPRESAS } from '@/lib/empresas'
import LoginForm from './LoginForm'

// Pantalla de ingreso cuando no hay sesión: sirve para las dos empresas
// (cada cliente entra a la suya según con qué datos se identifica).
export default function Ingreso() {
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
        <p>Entrá con tu CUIT, email o teléfono y el PIN que te mandamos por WhatsApp.</p>
        <LoginForm />
        <div className="ayuda">¿No tenés PIN o lo perdiste? Pedíselo a tu vendedor.</div>
      </div>
    </main>
  )
}
