'use client'
import { useState } from 'react'

const TIPOS: [string, string][] = [['gastronomia', 'Gastronomía'], ['revendedor', 'Vinoteca / revendedor'], ['mayorista', 'Mayorista'], ['consumidor_final', 'Consumidor final'], ['otro', 'Otro']]

export default function NuevoForm() {
  const [f, setF] = useState({ empresa: '', nombre: '', razon_social: '', cuit: '', telefono: '', email: '', direccion: '', tipo: 'gastronomia', notas: '' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const set = (k: keyof typeof f, v: string) => setF(x => ({ ...x, [k]: v }))

  async function guardar(e: React.FormEvent, pedido: boolean) {
    e.preventDefault()
    setEnviando(true); setError('')
    try {
      const r = await fetch('/api/vendedor/cliente', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error || 'No se pudo guardar'); return }
      if (pedido) {
        await fetch('/api/vendedor/atender', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cliente_id: d.id }) })
        window.location.href = '/'
      } else window.location.href = '/vendedor'
    } catch { setError('Sin conexión. No se guardó; probá de nuevo.') } finally { setEnviando(false) }
  }

  return (
    <form className="datos" onSubmit={e => guardar(e, true)}>
      <div className="datos-bloque">
        <div className="datos-tit">Para qué empresa</div>
        <div className="dias">
          {[['aroma', 'Aroma de Vid'], ['lavid', 'La Vid']].map(([k, l]) => (
            <button type="button" key={k} className={f.empresa === k ? 'dia on' : 'dia'} onClick={() => set('empresa', k)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="datos-grid">
        <label>Nombre del comercio<input value={f.nombre} onChange={e => set('nombre', e.target.value)} required /></label>
        <label><span>Razón social <span className="opc">(si es otra)</span></span><input value={f.razon_social} onChange={e => set('razon_social', e.target.value)} /></label>
        <label><span>CUIT <span className="opc">(si lo tiene)</span></span><input inputMode="numeric" value={f.cuit} onChange={e => set('cuit', e.target.value)} placeholder="20-12345678-9" /></label>
        <label>Teléfono / WhatsApp<input inputMode="tel" value={f.telefono} onChange={e => set('telefono', e.target.value)} required /></label>
        <label><span>Email <span className="opc">(opcional)</span></span><input type="email" value={f.email} onChange={e => set('email', e.target.value)} /></label>
        <label>Tipo
          <select value={f.tipo} onChange={e => set('tipo', e.target.value)}>{TIPOS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </label>
        <label className="ancho">Dirección<input value={f.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Calle, número, localidad" /></label>
      </div>
      <label className="ancho"><span>Notas <span className="opc">(opcional)</span></span>
        <textarea rows={2} value={f.notas} onChange={e => set('notas', e.target.value)} placeholder="Horario, quién atiende, cómo paga…" />
      </label>
      <button className="btn btn-ac btn-lg" disabled={enviando || !f.empresa}>{enviando ? 'Guardando…' : 'Guardar y tomar pedido'}</button>
      <button type="button" className="btn btn-lg" disabled={enviando || !f.empresa} onClick={e => guardar(e, false)}>Solo guardar</button>
      {error && <div className="error">{error}</div>}
    </form>
  )
}
