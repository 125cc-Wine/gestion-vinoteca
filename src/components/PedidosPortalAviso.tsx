'use client'
import { useEffect, useRef, useState } from 'react'

// Aviso GRANDE de pedidos del portal (del cliente o del vendedor de calle):
// - cartel en el centro de la pantalla + sonido cuando entra uno nuevo,
// - franja fija arriba mientras haya pedidos del portal sin procesar,
// - el título de la pestaña muestra cuántos hay.
// Lo ya visto (cartel cerrado) se recuerda en este navegador; la franja sigue
// hasta que el pedido se procesa o se cancela en Pedidos.

interface PedidoPortal { id: string; numero: string; empresa: string; cliente: string; origen: string; vendedor: string | null; total: number; productos: number; created_at: string }

const INTERVALO_MS = 30_000
const CLAVE = 'pedidos_portal_vistos'
const pesos = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR')
const emp = (e: string) => e === 'lavid' ? 'La Vid' : 'Aroma'

function leerVistos(): Set<string> { try { return new Set(JSON.parse(localStorage.getItem(CLAVE) || '[]')) } catch { return new Set() } }
function guardarVistos(v: Set<string>) { try { localStorage.setItem(CLAVE, JSON.stringify(Array.from(v).slice(-300))) } catch { /* sin storage */ } }

// "Ding" corto con Web Audio (sin archivos). Si el navegador no deja sonar
// sin interacción previa, no pasa nada.
function sonar() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    ;[0, 0.18].forEach((t, k) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'sine'; o.frequency.value = k ? 1320 : 880
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.35)
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.4)
    })
  } catch { /* sin audio */ }
}

export default function PedidosPortalAviso({ color }: { color: string }) {
  const [pend, setPend] = useState<PedidoPortal[]>([])
  const [nuevos, setNuevos] = useState<PedidoPortal[]>([])
  const consultando = useRef(false)
  const tituloBase = useRef('')

  useEffect(() => {
    let cancelado = false
    async function consultar() {
      if (consultando.current) return
      consultando.current = true
      try {
        const r = await fetch('/api/pedidos/portal-pendientes', { cache: 'no-store' })
        if (!r.ok) return
        const d: { pendientes: PedidoPortal[] } = await r.json()
        if (cancelado) return
        const lista = d.pendientes ?? []
        setPend(lista)
        const vistos = leerVistos()
        const sinVer = lista.filter(p => !vistos.has(p.id))
        setNuevos(prev => {
          if (sinVer.some(p => !prev.find(x => x.id === p.id))) sonar()
          return sinVer
        })
      } catch { /* sin red: próxima vuelta */ } finally { consultando.current = false }
    }
    consultar()
    const t = setInterval(consultar, INTERVALO_MS)
    const vis = () => { if (document.visibilityState === 'visible') consultar() }
    document.addEventListener('visibilitychange', vis)
    const cambio = () => consultar()
    window.addEventListener('pedidos-portal-cambio', cambio)
    return () => { cancelado = true; clearInterval(t); document.removeEventListener('visibilitychange', vis); window.removeEventListener('pedidos-portal-cambio', cambio) }
  }, [])

  // Título de la pestaña: "(2) Pedido nuevo · …"
  useEffect(() => {
    if (!tituloBase.current) tituloBase.current = document.title.replace(/^\(\d+\) Pedido(s)? nuevo(s)? · /, '')
    document.title = pend.length ? `(${pend.length}) ${pend.length === 1 ? 'Pedido nuevo' : 'Pedidos nuevos'} · ${tituloBase.current}` : tituloBase.current
  }, [pend])

  function marcarVistos(lista: PedidoPortal[]) {
    const v = leerVistos(); lista.forEach(p => v.add(p.id)); guardarVistos(v); setNuevos([])
  }
  function abrir(p: PedidoPortal) {
    marcarVistos(nuevos)
    try { localStorage.setItem('empresa', p.empresa) } catch { /* sin storage */ }
    // Recarga completa: así Pedidos toma la empresa del pedido aunque ya estuviera abierto.
    window.location.href = `/pedidos?ver=${p.id}`
  }

  if (!pend.length) return null
  const total = pend.reduce((s, p) => s + p.total, 0)

  return (
    <>
      {/* Franja fija mientras haya pedidos sin procesar */}
      <div onClick={() => abrir(pend[pend.length - 1])} role="button"
        style={{ position: 'sticky', top: 56, zIndex: 39, background: color, color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', fontSize: 15, fontWeight: 700, boxShadow: '0 4px 14px rgba(0,0,0,.18)', flexWrap: 'wrap', textAlign: 'center' }}>
        <span style={{ fontSize: 20 }}>🛎</span>
        {pend.length === 1 ? '1 pedido del portal sin procesar' : `${pend.length} pedidos del portal sin procesar`}
        <span style={{ fontWeight: 500, opacity: .9 }}>· {pesos(total)}</span>
        <span style={{ background: '#fff', color, borderRadius: 999, padding: '4px 14px', fontSize: 13 }}>Ver y procesar →</span>
      </div>

      {/* Cartel grande al entrar uno nuevo */}
      {nuevos.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(26,18,16,.55)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div style={{ width: 'min(520px, 100%)', background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.35)', fontFamily: 'inherit' }}>
            <div style={{ background: color, color: '#fff', padding: '22px 26px', textAlign: 'center' }}>
              <div style={{ fontSize: 44, lineHeight: 1 }}>🛎</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{nuevos.length === 1 ? '¡Pedido nuevo del portal!' : `¡${nuevos.length} pedidos nuevos del portal!`}</div>
            </div>
            <div style={{ padding: '14px 22px', maxHeight: '45vh', overflowY: 'auto' }}>
              {nuevos.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F0E8DE' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1210' }}>{p.cliente}</div>
                    <div style={{ fontSize: 13, color: '#6B5D55', marginTop: 2 }}>
                      {p.numero} · {emp(p.empresa)} · {p.productos} {p.productos === 1 ? 'producto' : 'productos'} · {p.vendedor ? `🚶 tomado por ${p.vendedor}` : '👤 lo hizo el cliente'} · {new Date(p.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1210', whiteSpace: 'nowrap' }}>{pesos(p.total)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '16px 22px 22px' }}>
              <button onClick={() => abrir(nuevos[nuevos.length - 1])}
                style={{ flex: 1, background: color, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 16px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Procesar ahora</button>
              <button onClick={() => marcarVistos(nuevos)}
                style={{ background: '#fff', border: '1px solid #C8BAA8', borderRadius: 12, padding: '14px 18px', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', color: '#1A1210' }}>Después</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
