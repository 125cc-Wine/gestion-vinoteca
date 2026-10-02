'use client'
import { useState } from 'react'
import { EMPRESAS, type EmpresaId } from '@/lib/empresas'

// Entrada sin link: solo el CUIT (o DNI). Si figura como cliente de las dos
// empresas, elige con cuál entrar.
export default function LoginForm() {
  const [cuit, setCuit] = useState('')
  const [recordar, setRecordar] = useState(true)
  const [elegir, setElegir] = useState<EmpresaId[] | null>(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const largo = cuit.replace(/\D/g, '').length
  const valido = largo === 11 || largo === 7 || largo === 8

  async function enviar(empresa?: EmpresaId) {
    setEnviando(true); setError('')
    try {
      const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cuit, empresa, recordar }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.elegir) { setElegir(d.elegir); return }
      if (r.ok) { window.location.href = '/'; return }
      setError(d.error || 'No se pudo entrar. Probá de nuevo.')
    } catch {
      setError('Sin conexión. Probá de nuevo.')
    } finally { setEnviando(false) }
  }

  if (elegir) return (
    <div className="login">
      <div className="elegir-tit">¿Con cuál querés entrar?</div>
      {elegir.map(e => (
        <button key={e} type="button" className="btn btn-lg elegir" disabled={enviando} onClick={() => enviar(e)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={EMPRESAS[e].logo} alt="" /> {EMPRESAS[e].nombre}
        </button>
      ))}
      {error && <div className="error">{error}</div>}
    </div>
  )

  return (
    <form className="login" onSubmit={e => { e.preventDefault(); if (valido) enviar() }}>
      <label>CUIT
        <input name="username" autoComplete="username" inputMode="numeric" value={cuit} onChange={e => setCuit(e.target.value)}
          placeholder="Ej: 20-12345678-9" autoFocus disabled={enviando} />
      </label>
      <Recordar valor={recordar} onChange={setRecordar} />
      <button className="btn btn-ac btn-lg" disabled={enviando || !valido}>{enviando ? 'Entrando…' : 'Entrar'}</button>
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
