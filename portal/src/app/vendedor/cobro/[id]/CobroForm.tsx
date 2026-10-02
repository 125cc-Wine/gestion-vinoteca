'use client'
import { useState } from 'react'

const MEDIOS = ['Efectivo', 'Transferencia', 'Cheque', 'Otro'] as const
interface Cheque { numero: string; banco: string; fecha: string; monto: string }
const pesos = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR')

export default function CobroForm({ clienteId, saldo }: { clienteId: string; saldo: number }) {
  const [medio, setMedio] = useState<typeof MEDIOS[number]>('Efectivo')
  const [monto, setMonto] = useState('')
  const [cheques, setCheques] = useState<Cheque[]>([{ numero: '', banco: '', fecha: '', monto: '' }])
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [hecho, setHecho] = useState<number | null>(null)

  const totalCheques = cheques.reduce((s, c) => s + (Number(c.monto.replace(',', '.')) || 0), 0)
  const total = medio === 'Cheque' ? totalCheques : Number(monto.replace(',', '.')) || 0
  const setCh = (i: number, k: keyof Cheque, v: string) => setCheques(cs => cs.map((c, j) => j === i ? { ...c, [k]: v } : c))

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!(total > 0)) { setError('Ingresá el monto cobrado'); return }
    setEnviando(true); setError('')
    try {
      const r = await fetch('/api/vendedor/cobro', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: clienteId, medio, monto: total, notas,
          cheques: medio === 'Cheque' ? cheques.map(c => ({ ...c, monto: Number(c.monto.replace(',', '.')) || 0 })) : undefined }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error || 'No se pudo guardar'); return }
      setHecho(d.monto)
    } catch { setError('Sin conexión. El cobro NO se guardó; probá de nuevo.') } finally { setEnviando(false) }
  }

  if (hecho != null) return (
    <div className="ok" style={{ padding: '30px 0' }}>
      <div className="ok-ico">✓</div>
      <h2>Cobro anotado</h2>
      <p>{pesos(hecho)} en {medio.toLowerCase()}. Le avisamos a la oficina; se aplica a la cuenta cuando lo confirman.</p>
      <a className="btn btn-ac btn-lg" href="/vendedor">Volver a mis clientes</a>
    </div>
  )

  return (
    <form className="datos" onSubmit={enviar}>
      <div className="datos-bloque">
        <div className="datos-tit">Medio de pago</div>
        <div className="dias">
          {MEDIOS.map(m => <button type="button" key={m} className={medio === m ? 'dia on' : 'dia'} onClick={() => setMedio(m)}>{m}</button>)}
        </div>
      </div>

      {medio !== 'Cheque' ? (
        <label>Monto cobrado
          <input inputMode="decimal" value={monto} onChange={e => setMonto(e.target.value)} placeholder="$" autoFocus />
          {saldo > 0.5 && <button type="button" className="link-btn" onClick={() => setMonto(String(Math.round(saldo)))}>Cobró todo ({pesos(saldo)})</button>}
        </label>
      ) : (
        <div className="datos-bloque">
          <div className="datos-tit">Cheques</div>
          {cheques.map((c, i) => (
            <div key={i} className="cheque">
              <input placeholder="N° de cheque" value={c.numero} onChange={e => setCh(i, 'numero', e.target.value)} />
              <input placeholder="Banco" value={c.banco} onChange={e => setCh(i, 'banco', e.target.value)} />
              <label>Fecha de cobro<input type="date" value={c.fecha} onChange={e => setCh(i, 'fecha', e.target.value)} /></label>
              <input inputMode="decimal" placeholder="Monto $" value={c.monto} onChange={e => setCh(i, 'monto', e.target.value)} />
              {cheques.length > 1 && <button type="button" className="link-btn" onClick={() => setCheques(cs => cs.filter((_, j) => j !== i))}>Quitar</button>}
            </div>
          ))}
          <button type="button" className="btn" onClick={() => setCheques(cs => [...cs, { numero: '', banco: '', fecha: '', monto: '' }])}>+ Otro cheque</button>
        </div>
      )}

      <label><span>Notas <span className="opc">(opcional)</span></span>
        <textarea rows={2} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ej: a cuenta de la factura de septiembre" />
      </label>

      <button className="btn btn-ac btn-lg" disabled={enviando || !(total > 0)}>{enviando ? 'Guardando…' : `Anotar cobro de ${pesos(total)}`}</button>
      {error && <div className="error">{error}</div>}
    </form>
  )
}
