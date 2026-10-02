'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// Cobros que anotaron los vendedores de calle en el portal y clientes que
// dieron de alta. Confirmar un cobro lo aplica a la cuenta corriente igual
// que un cobro de Aging (y registra los cheques); rechazar no toca nada.

interface Cobro {
  id: string; vendedor_nombre: string | null; cliente_id: string; cliente_nombre: string | null; empresa: string
  monto: number; medio: string; cheques: { numero: string; banco: string; fecha: string; monto: number }[] | null
  notas: string | null; estado: string; motivo_rechazo: string | null; created_at: string; resuelto_at: string | null
}
interface Alta { id: string; empresa: string; nombre: string; razon_social: string | null; cuit: string | null; telefono: string | null; direccion: string | null; created_at: string; vendedores: { nombre: string } | null }

const T = { bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8', text: '#1A1210', muted: '#6B5D55', dim: '#A89888', wine: '#800000', green: '#2D7A4F', red: '#C03030' }
const BTN: React.CSSProperties = { borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${T.border2}`, background: T.surface, color: T.text, whiteSpace: 'nowrap' }
const pesos = (n: number) => '$ ' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 })
const fecha = (s: string | null) => s ? new Date(s).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
const emp = (e: string) => e === 'lavid' ? 'La Vid' : 'Aroma'

export default function CobrosVendedor() {
  const [d, setD] = useState<{ pendientes: Cobro[]; recientes: Cobro[]; altas: Alta[] } | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')

  async function cargar() { setD(await fetch('/api/cobros-vendedor').then(r => r.json())) }
  useEffect(() => { cargar() }, [])

  async function accion(body: object, id: string, ok: string) {
    setOcupado(id); setAviso('')
    const r = await fetch('/api/cobros-vendedor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(x => x.json()).catch(() => ({ error: 'Sin conexión' }))
    setOcupado(null)
    if (r.error) { setAviso('Error: ' + r.error); return null }
    setAviso(ok); cargar(); return r
  }

  async function confirmar(c: Cobro) {
    if (!confirm(`¿Confirmar el cobro de ${pesos(c.monto)} (${c.medio}) a ${c.cliente_nombre}? Se aplica a su cuenta corriente.`)) return
    const w = window.open('', '_blank', 'width=650,height=850')
    const r = await accion({ id: c.id, accion: 'confirmar' }, c.id, 'Cobro confirmado y aplicado a la cuenta')
    if (r?.ids?.length && w) w.location.href = `/api/print/recibo?ids=${r.ids.join(',')}&empresa=${c.empresa}&medio=${encodeURIComponent(c.medio)}`
    else w?.close()
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px', color: T.text }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Cobros de vendedores</h1>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>Lo que anotan los vendedores de calle en el portal. Recién al confirmar se aplica a la cuenta corriente (y se registran los cheques).</div>
      {aviso && <div style={{ background: T.bg, borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>{aviso}</div>}
      {!d ? <div style={{ color: T.dim }}>Cargando…</div> : <>
        <Seccion titulo={`Pendientes de confirmar (${d.pendientes.length})`}>
          {d.pendientes.length === 0 && <Vacio>No hay cobros pendientes.</Vacio>}
          {d.pendientes.map(c => (
            <Fila key={c.id} c={c}>
              <button style={{ ...BTN, background: T.green, color: '#fff', border: 'none' }} disabled={!!ocupado} onClick={() => confirmar(c)}>{ocupado === c.id ? '…' : 'Confirmar'}</button>
              <button style={BTN} disabled={!!ocupado} onClick={() => { const m = prompt('Motivo del rechazo (se le muestra al vendedor como rechazado):'); if (m !== null) accion({ id: c.id, accion: 'rechazar', motivo: m }, c.id, 'Cobro rechazado') }}>Rechazar</button>
            </Fila>
          ))}
        </Seccion>

        <Seccion titulo={`Clientes nuevos cargados en la calle (${d.altas.length})`}>
          {d.altas.length === 0 && <Vacio>No hay altas para revisar.</Vacio>}
          {d.altas.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ fontWeight: 600 }}>{a.razon_social || a.nombre} <span style={{ color: T.dim, fontWeight: 400, fontSize: 12 }}>· {emp(a.empresa)} · por {a.vendedores?.nombre ?? 'vendedor'} · {fecha(a.created_at)}</span></div>
                <div style={{ fontSize: 12.5, color: T.muted }}>{[a.cuit ? `CUIT ${a.cuit}` : 'Sin CUIT', a.telefono, a.direccion].filter(Boolean).join(' · ')}</div>
              </div>
              <Link href={`/clientes/${a.id}`} style={{ ...BTN, textDecoration: 'none' }}>Ver ficha</Link>
              <button style={BTN} disabled={!!ocupado} onClick={() => accion({ cliente_id: a.id, accion: 'alta_revisada' }, a.id, 'Marcado como revisado')}>Revisado ✓</button>
            </div>
          ))}
        </Seccion>

        <Seccion titulo="Últimos resueltos">
          {d.recientes.length === 0 && <Vacio>Todavía no hay cobros resueltos.</Vacio>}
          {d.recientes.map(c => (
            <Fila key={c.id} c={c}>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.estado === 'confirmado' ? T.green : T.red }}>
                {c.estado === 'confirmado' ? 'Confirmado' : `Rechazado${c.motivo_rechazo ? `: ${c.motivo_rechazo}` : ''}`} · {fecha(c.resuelto_at)}
              </span>
            </Fila>
          ))}
        </Seccion>
      </>}
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14, borderBottom: `1px solid ${T.border}`, background: T.bg }}>{titulo}</div>
      {children}
    </div>
  )
}
const Vacio = ({ children }: { children: React.ReactNode }) => <div style={{ padding: 16, fontSize: 13, color: T.dim }}>{children}</div>

function Fila({ c, children }: { c: Cobro; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ flex: '1 1 320px' }}>
        <div style={{ fontWeight: 600 }}>{c.cliente_nombre} <span style={{ color: T.dim, fontWeight: 400, fontSize: 12 }}>· {emp(c.empresa)}</span></div>
        <div style={{ fontSize: 12.5, color: T.muted }}>
          {c.vendedor_nombre} · {fecha(c.created_at)} · {c.medio}
          {c.cheques?.length ? ` · ${c.cheques.map(x => `N° ${x.numero}${x.banco ? ` ${x.banco}` : ''} al ${new Date(x.fecha + 'T12:00:00').toLocaleDateString('es-AR')} (${pesos(x.monto)})`).join(', ')}` : ''}
        </div>
        {c.notas && <div style={{ fontSize: 12.5, color: T.muted }}>“{c.notas}”</div>}
      </div>
      <b style={{ fontSize: 16, minWidth: 110, textAlign: 'right' }}>{pesos(c.monto)}</b>
      {children}
    </div>
  )
}
