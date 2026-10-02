'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { ClienteCartera } from '@/lib/vendedor'

const pesos = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR')
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Lista de clientes del vendedor con buscador. "Pedido" y "Cuenta" eligen al
// cliente (cookie) y abren el catálogo o su cuenta como si fuera él.
export default function Cartera({ clientes }: { clientes: ClienteCartera[] }) {
  const [q, setQ] = useState('')
  const [abriendo, setAbriendo] = useState<string | null>(null)
  const [error, setError] = useState('')
  const lista = clientes.filter(c => !q.trim() || norm(`${c.nombre} ${c.direccion ?? ''}`).includes(norm(q.trim())))

  async function atender(id: string, destino: string) {
    setAbriendo(id + destino); setError('')
    const r = await fetch('/api/vendedor/atender', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cliente_id: id }) })
    if (r.ok) { window.location.href = destino; return }
    const d = await r.json().catch(() => ({}))
    setError(d.error || 'No se pudo abrir'); setAbriendo(null)
  }

  return (
    <section className="grupo">
      <div className="grupo-h"><h2>Clientes</h2><small>{clientes.length}</small></div>
      <div className="buscar" style={{ margin: '4px 0 10px' }}>
        <input type="search" placeholder="Buscar cliente o dirección" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {error && <div className="error">{error}</div>}
      {lista.length === 0 && <div className="vacio">{clientes.length ? 'Ningún cliente coincide.' : 'Todavía no tenés clientes asignados.'}</div>}
      {lista.map(c => (
        <div key={c.id} className="cli">
          <div className="cli-info">
            <div className="fila-nom">{c.nombre}{c.nuevo && <span className="tag-nuevo">nuevo</span>}</div>
            <div className="fila-sub">
              <span>{c.empresa === 'lavid' ? 'La Vid' : 'Aroma'}</span>
              {c.direccion && <span>{c.direccion}</span>}
              {c.ultimaCompra && <span>última compra {new Date(c.ultimaCompra).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>}
            </div>
            <div className="fila-sub">
              {c.saldo > 0.5 ? <span className="disp disp-no">Debe {pesos(c.saldo)}</span> : <span className="disp disp-ok">Al día</span>}
              {c.vencido > 0.5 && <span className="venc-tag">Vencido {pesos(c.vencido)}</span>}
            </div>
          </div>
          <div className="cli-acc">
            <button className="btn btn-ac" disabled={!!abriendo} onClick={() => atender(c.id, '/')}>{abriendo === c.id + '/' ? '…' : 'Pedido'}</button>
            <Link className="btn" href={`/vendedor/cobro/${c.id}`}>Cobrar</Link>
            <button className="btn" disabled={!!abriendo} onClick={() => atender(c.id, '/cuenta')}>{abriendo === c.id + '/cuenta' ? '…' : 'Cuenta'}</button>
            {c.telefono && <a className="btn" href={`https://wa.me/549${c.telefono.replace(/\D/g, '').replace(/^(54)?9?0?/, '')}`} target="_blank" rel="noreferrer">WhatsApp</a>}
          </div>
        </div>
      ))}
    </section>
  )
}
