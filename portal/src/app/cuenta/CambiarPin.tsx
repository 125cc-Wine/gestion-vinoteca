'use client'
import { useState } from 'react'

// "Cambiar PIN" en Mi cuenta: el cliente elige uno propio, fácil de recordar.
export default function CambiarPin() {
  const [abierto, setAbierto] = useState(false)
  const [actual, setActual] = useState('')
  const [nuevo, setNuevo] = useState('')
  const [repetir, setRepetir] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const solo = (v: string) => v.replace(/\D/g, '').slice(0, 8)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (nuevo !== repetir) { setError('Los dos PIN nuevos no coinciden'); return }
    setEnviando(true); setError('')
    try {
      const r = await fetch('/api/cuenta/pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actual, nuevo }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error || 'No se pudo cambiar'); return }
      setOk(true); setActual(''); setNuevo(''); setRepetir(''); setAbierto(false)
    } catch { setError('Sin conexión. Probá de nuevo.') } finally { setEnviando(false) }
  }

  if (!abierto) return (
    <div className="pin-box">
      <div>
        <b>PIN de acceso</b>
        <div className="fila-sub"><span>{ok ? '✓ Listo, tu PIN nuevo ya funciona.' : 'Podés cambiarlo por uno tuyo, fácil de recordar.'}</span></div>
      </div>
      <button className="btn" onClick={() => { setAbierto(true); setOk(false) }}>Cambiar PIN</button>
    </div>
  )

  return (
    <form className="datos" onSubmit={guardar} style={{ margin: '16px 0' }}>
      <h2 style={{ margin: 0, fontFamily: 'var(--serif)', fontWeight: 600, fontSize: 24 }}>Cambiar PIN</h2>
      <div className="datos-grid">
        <label className="ancho">PIN actual
          <input type="password" inputMode="numeric" autoComplete="current-password" value={actual} onChange={e => setActual(solo(e.target.value))} autoFocus />
        </label>
        <label>PIN nuevo <span className="opc">(4 a 8 números)</span>
          <input type="password" inputMode="numeric" autoComplete="new-password" value={nuevo} onChange={e => setNuevo(solo(e.target.value))} />
        </label>
        <label>Repetilo
          <input type="password" inputMode="numeric" autoComplete="new-password" value={repetir} onChange={e => setRepetir(solo(e.target.value))} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ac btn-lg" style={{ flex: 1 }} disabled={enviando || actual.length < 4 || nuevo.length < 4 || !repetir}>{enviando ? 'Guardando…' : 'Guardar PIN'}</button>
        <button type="button" className="btn btn-lg" onClick={() => { setAbierto(false); setError('') }}>Cancelar</button>
      </div>
      {error && <div className="error">{error}</div>}
    </form>
  )
}
