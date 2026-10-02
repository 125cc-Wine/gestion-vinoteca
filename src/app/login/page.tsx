'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FONDO, CARD, LBL, INP, BTN, ERR } from './estilos'

// Ingreso a gestión. Los campos usan autocomplete de usuario/contraseña para
// que el navegador ofrezca recordarlos.
function Formulario() {
  const volver = useSearchParams().get('volver') || '/'
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true); setError('')
    try {
      const r = await fetch('/api/sesion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, clave }) })
      const d = await r.json().catch(() => ({}))
      // Solo rutas internas, para no redirigir afuera con ?volver=
      if (r.ok) { window.location.href = volver.startsWith('/') && !volver.startsWith('//') ? volver : '/'; return }
      setError(d.error || 'No se pudo entrar'); setClave('')
    } catch { setError('Sin conexión') } finally { setEnviando(false) }
  }

  return (
    <form onSubmit={entrar} style={CARD}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Gestión</h1>
      <p style={{ color: '#6B5D55', fontSize: 14, margin: '0 0 20px' }}>Aroma de Vid · La Vid Consultora</p>
      <label style={LBL}>Email
        <input style={INP} type="email" name="username" autoComplete="username" autoFocus value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      <label style={LBL}>Contraseña
        <input style={INP} type="password" name="password" autoComplete="current-password" value={clave} onChange={e => setClave(e.target.value)} />
      </label>
      <button style={BTN} disabled={enviando || !email || !clave}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      {error && <div style={ERR}>{error}</div>}
    </form>
  )
}

export default function Login() {
  return <main style={FONDO}><Suspense><Formulario /></Suspense></main>
}
