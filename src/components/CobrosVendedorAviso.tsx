'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Aviso de cobros (y clientes nuevos) cargados por los vendedores de calle
// desde el portal, en el encabezado de toda la app — mismo estilo que el
// aviso de pedidos web. Ícono 💵 con la cantidad pendiente de confirmar y un
// popup cuando entra uno nuevo. Lo visto se recuerda en este navegador.

interface Cobro { id: string; vendedor_nombre: string | null; cliente_nombre: string | null; monto: number; medio: string; created_at: string }
const INTERVALO_MS = 60_000
const CLAVE = 'cobros_vendedor_vistos'
const pesos = (n: number) => '$ ' + Math.round(Number(n)).toLocaleString('es-AR')

function leerVistos(): Set<string> { try { return new Set(JSON.parse(localStorage.getItem(CLAVE) || '[]')) } catch { return new Set() } }
function guardarVistos(v: Set<string>) { try { localStorage.setItem(CLAVE, JSON.stringify(Array.from(v).slice(-300))) } catch { /* sin storage */ } }

export default function CobrosVendedorAviso({ color }: { color: string }) {
  const router = useRouter()
  const [pend, setPend] = useState<Cobro[]>([])
  const [altas, setAltas] = useState(0)
  const [nuevos, setNuevos] = useState<Cobro[]>([])
  const consultando = useRef(false)

  useEffect(() => {
    let cancelado = false
    async function consultar() {
      if (consultando.current || document.visibilityState !== 'visible') return
      consultando.current = true
      try {
        const r = await fetch('/api/cobros-vendedor?resumen=1', { cache: 'no-store' })
        if (!r.ok) return
        const d: { pendientes: Cobro[]; altas: unknown[] } = await r.json()
        if (cancelado) return
        setPend(d.pendientes ?? []); setAltas((d.altas ?? []).length)
        const vistos = leerVistos()
        setNuevos((d.pendientes ?? []).filter(c => !vistos.has(c.id)))
      } catch { /* sin red */ } finally { consultando.current = false }
    }
    consultar()
    const t = setInterval(consultar, INTERVALO_MS)
    const vis = () => { if (document.visibilityState === 'visible') consultar() }
    document.addEventListener('visibilitychange', vis)
    return () => { cancelado = true; clearInterval(t); document.removeEventListener('visibilitychange', vis) }
  }, [])

  function aceptar() {
    const v = leerVistos(); nuevos.forEach(c => v.add(c.id)); guardarVistos(v); setNuevos([])
  }

  const total = pend.length + altas
  if (!total) return null
  return (
    <>
      <button onClick={() => router.push('/cobros-vendedor')} title={`${pend.length} cobro(s) de vendedores sin confirmar${altas ? ` · ${altas} cliente(s) nuevo(s) para revisar` : ''}`}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 6px' }}>
        💵
        <span style={{ position: 'absolute', top: -2, right: -4, background: color, color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, display: 'grid', placeItems: 'center', padding: '0 4px' }}>{total}</span>
      </button>
      {nuevos.length > 0 && (
        <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 300, width: 'min(360px, calc(100vw - 32px))', background: '#fff', border: '1px solid #DDD0C0', borderRadius: 14, boxShadow: '0 16px 40px rgba(26,18,16,.18)', padding: 16, fontFamily: 'inherit' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>💵 {nuevos.length === 1 ? 'Nuevo cobro de vendedor' : `${nuevos.length} cobros nuevos de vendedores`}</div>
          {nuevos.slice(0, 4).map(c => (
            <div key={c.id} style={{ fontSize: 13, color: '#1A1210', padding: '4px 0', borderBottom: '1px solid #F0E8DE' }}>
              <b>{c.vendedor_nombre}</b> cobró <b>{pesos(c.monto)}</b> ({c.medio.toLowerCase()}) a {c.cliente_nombre}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => { aceptar(); router.push('/cobros-vendedor') }} style={{ flex: 1, background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Revisar</button>
            <button onClick={aceptar} style={{ background: '#fff', border: '1px solid #C8BAA8', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Aceptar</button>
          </div>
        </div>
      )}
    </>
  )
}
