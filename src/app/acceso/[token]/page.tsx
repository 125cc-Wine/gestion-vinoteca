'use client'
import { useEffect, useState } from 'react'
import { FONDO, CARD, LBL, INP, BTN, ERR } from '../../login/estilos'

// Link de invitación a gestión: la persona elige su contraseña y queda logueada.
export default function Activar({ params }: { params: { token: string } }) {
  const [quien, setQuien] = useState<{ email: string; nombre: string | null } | null>(null)
  const [error, setError] = useState('')
  const [clave, setClave] = useState('')
  const [repetir, setRepetir] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    fetch(`/api/sesion/activar?token=${encodeURIComponent(params.token)}`).then(r => r.json())
      .then(d => d.error ? setError(d.error) : setQuien(d)).catch(() => setError('Sin conexión'))
  }, [params.token])

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (clave !== repetir) { setError('Las contraseñas no coinciden'); return }
    setEnviando(true); setError('')
    try {
      const r = await fetch('/api/sesion/activar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: params.token, clave }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok) { window.location.href = '/'; return }
      setError(d.error || 'No se pudo guardar')
    } catch { setError('Sin conexión') } finally { setEnviando(false) }
  }

  return (
    <main style={FONDO}>
      <form onSubmit={guardar} style={CARD}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Crear tu contraseña</h1>
        {quien ? <>
          <p style={{ color: '#6B5D55', fontSize: 14, margin: '0 0 12px' }}>Acceso a gestión para <b>{quien.email}</b>. Mínimo 10 caracteres.</p>
          <input type="email" name="username" autoComplete="username" value={quien.email} readOnly hidden />
          <label style={LBL}>Contraseña
            <input style={INP} type="password" autoComplete="new-password" autoFocus value={clave} onChange={e => setClave(e.target.value)} />
          </label>
          <label style={LBL}>Repetila
            <input style={INP} type="password" autoComplete="new-password" value={repetir} onChange={e => setRepetir(e.target.value)} />
          </label>
          <button style={BTN} disabled={enviando || clave.length < 10 || !repetir}>{enviando ? 'Guardando…' : 'Guardar y entrar'}</button>
        </> : !error && <p style={{ color: '#6B5D55' }}>Cargando…</p>}
        {error && <div style={ERR}>{error}</div>}
      </form>
    </main>
  )
}
