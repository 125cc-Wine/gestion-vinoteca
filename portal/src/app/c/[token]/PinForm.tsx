'use client'
import { useRef, useState } from 'react'

const LARGO = 6

export default function PinForm({ token }: { token: string }) {
  const [digitos, setDigitos] = useState<string[]>(Array(LARGO).fill(''))
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  async function enviar(pin: string) {
    setEnviando(true); setError('')
    try {
      const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, pin }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok) { window.location.href = '/'; return }
      setError(d.error || 'No se pudo entrar. Probá de nuevo.')
      cambiar(Array(LARGO).fill(''))
    } catch {
      setError('Sin conexión. Probá de nuevo.')
    } finally {
      setEnviando(false)
      // Las casillas estaban deshabilitadas mientras se enviaba: enfocar recién después.
      setTimeout(() => refs.current[0]?.focus(), 0)
    }
  }

  // Se trabaja sobre una copia en ref (no sobre el estado del último render):
  // si los dígitos llegan muy rápido (tipeo rápido, autocompletado del
  // teclado), cada tecla ve lo que escribió la anterior.
  const actual = useRef<string[]>(Array(LARGO).fill(''))
  function cambiar(nuevos: string[]) { actual.current = nuevos; setDigitos(nuevos) }

  function poner(i: number, valor: string) {
    const solo = valor.replace(/\D/g, '')
    const nuevos = [...actual.current]
    if (!solo) { nuevos[i] = ''; cambiar(nuevos); return }
    // Pegar el PIN completo en cualquier casilla también funciona.
    for (let k = 0; k < solo.length && i + k < LARGO; k++) nuevos[i + k] = solo[k]
    cambiar(nuevos)
    refs.current[Math.min(i + solo.length, LARGO - 1)]?.focus()
    if (nuevos.every(Boolean)) enviar(nuevos.join(''))
  }

  return (
    <form onSubmit={e => { e.preventDefault(); if (digitos.every(Boolean)) enviar(digitos.join('')) }}>
      <div className="pin">
        {digitos.map((d, i) => (
          <input key={i} ref={el => { refs.current[i] = el }} value={d} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Dígito ${i + 1} del PIN`} maxLength={LARGO} autoFocus={i === 0} disabled={enviando}
            onChange={e => { const v = e.target.value; poner(i, d && v.length === 2 ? v.replace(d, '') : v) }}
            onKeyDown={e => { if (e.key === 'Backspace' && !actual.current[i] && i > 0) refs.current[i - 1]?.focus() }} />
        ))}
      </div>
      <button className="btn btn-ac btn-lg" disabled={enviando || !digitos.every(Boolean)}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      {error && <div className="error">{error}</div>}
    </form>
  )
}
