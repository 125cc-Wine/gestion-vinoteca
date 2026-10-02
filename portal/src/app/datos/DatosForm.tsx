'use client'
import { useState } from 'react'
import { DIAS, type DatosEntrega } from '@/lib/datos'

export default function DatosForm({ inicial, primeraVez, nombre }: { inicial: DatosEntrega; primeraVez: boolean; nombre: string }) {
  const [d, setD] = useState<DatosEntrega>(inicial)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)
  const set = <K extends keyof DatosEntrega>(k: K, v: DatosEntrega[K]) => { setD(x => ({ ...x, [k]: v })); setListo(false) }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true); setError('')
    try {
      const r = await fetch('/api/datos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
      const res = await r.json().catch(() => ({}))
      if (!r.ok) { setError(res.error || 'No se pudo guardar'); return }
      if (primeraVez) { window.location.href = '/'; return }
      setListo(true)
    } catch { setError('Sin conexión. Probá de nuevo.') } finally { setEnviando(false) }
  }

  return (
    <form className="datos" onSubmit={guardar}>
      <h1>{primeraVez ? `¡Hola, ${nombre}!` : 'Tus datos de entrega'}</h1>
      <p className="datos-sub">
        {primeraVez
          ? 'Antes de ver la lista, confirmá a quién contactamos y cuándo podés recibir los pedidos. Lo hacés una sola vez.'
          : 'Si algo cambió, actualizalo acá y lo vemos en tu próximo pedido.'}
      </p>

      <div className="datos-grid">
        <label>Quién recibe / contacto
          <input value={d.contacto} onChange={e => set('contacto', e.target.value)} autoComplete="name" required />
        </label>
        <label>Teléfono o WhatsApp
          <input value={d.telefono} onChange={e => set('telefono', e.target.value)} inputMode="tel" autoComplete="tel" required />
        </label>
        <label><span>Email <span className="opc">(opcional)</span></span>
          <input type="email" value={d.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
        </label>
        <label className="ancho">Dirección de entrega
          <input value={d.direccion} onChange={e => set('direccion', e.target.value)} autoComplete="street-address" placeholder="Calle, número, localidad" required />
        </label>
      </div>

      <div className="datos-bloque">
        <div className="datos-tit">Días en que podés recibir</div>
        <div className="dias">
          {DIAS.map(dia => {
            const on = d.dias.includes(dia)
            return (
              <button type="button" key={dia} className={on ? 'dia on' : 'dia'} aria-pressed={on}
                onClick={() => set('dias', on ? d.dias.filter(x => x !== dia) : DIAS.filter(x => x === dia || d.dias.includes(x)))}>
                {dia}
              </button>
            )
          })}
        </div>
      </div>

      <div className="datos-bloque">
        <div className="datos-tit">Horario</div>
        <div className="horario">
          <label>Desde<input type="time" value={d.desde} onChange={e => set('desde', e.target.value)} required /></label>
          <label>Hasta<input type="time" value={d.hasta} onChange={e => set('hasta', e.target.value)} required /></label>
        </div>
      </div>

      <label className="ancho"><span>Indicaciones para la entrega <span className="opc">(opcional)</span></span>
        <textarea rows={2} value={d.notas} onChange={e => set('notas', e.target.value)} placeholder="Ej: entrar por el depósito, preguntar por Juan, no los lunes feriados…" />
      </label>

      <button className="btn btn-ac btn-lg" disabled={enviando}>{enviando ? 'Guardando…' : primeraVez ? 'Confirmar y ver la lista' : 'Guardar cambios'}</button>
      {listo && <div className="ok-msg">Listo, guardamos tus datos.</div>}
      {error && <div className="error">{error}</div>}
    </form>
  )
}
