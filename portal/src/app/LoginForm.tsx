'use client'
import { useState } from 'react'

// Entrada sin link: CUIT, email o teléfono + PIN. Campos con autocomplete
// de usuario/contraseña para que el navegador ofrezca guardarlos.
export default function LoginForm() {
  const [usuario, setUsuario] = useState('')
  const [pin, setPin] = useState('')
  const [recordar, setRecordar] = useState(true)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!usuario.trim() || pin.length < 4) return
    setEnviando(true); setError('')
    try {
      const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario, pin, recordar }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok) { window.location.href = '/'; return }
      setError(d.error || 'No se pudo entrar. Probá de nuevo.')
      setPin('')
    } catch {
      setError('Sin conexión. Probá de nuevo.')
    } finally { setEnviando(false) }
  }

  return (
    <form className="login" onSubmit={enviar}>
      <label>CUIT, email o teléfono
        <input name="username" autoComplete="username" value={usuario} onChange={e => setUsuario(e.target.value)}
          placeholder="Ej: 20-12345678-9" autoFocus disabled={enviando} />
      </label>
      <label>PIN
        <input name="password" type="password" inputMode="numeric" autoComplete="current-password" maxLength={8}
          value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="••••••" disabled={enviando} />
      </label>
      <Recordar valor={recordar} onChange={setRecordar} />
      <button className="btn btn-ac btn-lg" disabled={enviando || !usuario.trim() || pin.length < 4}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      {error && <div className="error">{error}</div>}
    </form>
  )
}

export function Recordar({ valor, onChange }: { valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="recordar">
      <input type="checkbox" checked={valor} onChange={e => onChange(e.target.checked)} />
      Recordarme en este dispositivo
    </label>
  )
}
