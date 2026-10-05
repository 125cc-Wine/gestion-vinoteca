'use client'
import { useEffect, useRef, useState } from 'react'

// Aviso de pedidos nuevos (portal del cliente, vendedor de calle y tienda web):
// - número rojo sobre "Pedidos" en el menú (lateral y de abajo en celular):
//   cuántos esperan que alguien los procese; desaparece al procesarlos,
// - aviso "Nuevo pedido recibido" en la esquina, con sonido, que no tapa la
//   pantalla (los de la tienda web ya tienen su propio aviso 🛒),
// - franja fina arriba y cantidad en el título de la pestaña.
// Se actualiza solo cada 30 s (y al volver a la pestaña o procesar un pedido).

interface PedidoNuevo { id: string; numero: string; empresa: string; cliente: string; origen: string; vendedor: string | null; total: number; productos: number; created_at: string }

const INTERVALO_MS = 30_000
const CLAVE = 'pedidos_portal_vistos'
export const EVENTO_CONTADOR = 'pedidos-pendientes'
const pesos = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR')
const emp = (e: string) => e === 'lavid' ? 'La Vid' : 'Aroma'

function leerVistos(): Set<string> { try { return new Set(JSON.parse(localStorage.getItem(CLAVE) || '[]')) } catch { return new Set() } }
function guardarVistos(v: Set<string>) { try { localStorage.setItem(CLAVE, JSON.stringify(Array.from(v).slice(-300))) } catch { /* sin storage */ } }

// "Ding" corto con Web Audio (sin archivos). Si el navegador no deja sonar
// sin un clic previo en la página, no suena pero el aviso aparece igual.
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

// Cantidad de pedidos pendientes, para el número rojo del menú.
export function useContadorPedidos() {
  const [n, setN] = useState(0)
  useEffect(() => {
    const f = (e: Event) => setN((e as CustomEvent<number>).detail || 0)
    window.addEventListener(EVENTO_CONTADOR, f)
    return () => window.removeEventListener(EVENTO_CONTADOR, f)
  }, [])
  return n
}

export function BadgePedidos({ n, flotante = false }: { n: number; flotante?: boolean }) {
  if (!n) return null
  return (
    <span aria-label={`${n} pedidos pendientes`} style={{
      minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: '#E02424', color: '#fff',
      fontSize: 11, fontWeight: 800, display: 'inline-grid', placeItems: 'center', lineHeight: 1,
      boxShadow: '0 0 0 2px #fff', ...(flotante ? { position: 'absolute', top: 2, right: 'calc(50% - 20px)' } : { marginLeft: 'auto' }),
    }}>{n > 99 ? '99+' : n}</span>
  )
}

export default function PedidosPortalAviso({ color }: { color: string }) {
  const [pend, setPend] = useState<PedidoNuevo[]>([])
  const [toast, setToast] = useState<PedidoNuevo[]>([])
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
        const d: { pendientes: PedidoNuevo[] } = await r.json()
        if (cancelado) return
        const lista = d.pendientes ?? []
        setPend(lista)
        window.dispatchEvent(new CustomEvent(EVENTO_CONTADOR, { detail: lista.length }))
        // Aviso solo para los del portal (los web tienen el suyo) que no se vieron en esta computadora.
        const vistos = leerVistos()
        const sinVer = lista.filter(p => p.origen !== 'web' && !vistos.has(p.id))
        setToast(prev => {
          if (sinVer.some(p => !prev.find(x => x.id === p.id))) sonar()
          return sinVer
        })
      } catch { /* sin red: próxima vuelta */ } finally { consultando.current = false }
    }
    consultar()
    const t = setInterval(consultar, INTERVALO_MS)
    const vis = () => { if (document.visibilityState === 'visible') consultar() }
    document.addEventListener('visibilitychange', vis)
    window.addEventListener('pedidos-portal-cambio', consultar)
    window.addEventListener('pedidos-web-cambio', consultar)
    return () => {
      cancelado = true; clearInterval(t); document.removeEventListener('visibilitychange', vis)
      window.removeEventListener('pedidos-portal-cambio', consultar); window.removeEventListener('pedidos-web-cambio', consultar)
    }
  }, [])

  // Título de la pestaña: "(2) Pedidos nuevos · …"
  useEffect(() => {
    if (!tituloBase.current) tituloBase.current = document.title.replace(/^\(\d+\) Pedidos? nuevos? · /, '')
    document.title = pend.length ? `(${pend.length}) ${pend.length === 1 ? 'Pedido nuevo' : 'Pedidos nuevos'} · ${tituloBase.current}` : tituloBase.current
  }, [pend])

  function cerrar() { const v = leerVistos(); toast.forEach(p => v.add(p.id)); guardarVistos(v); setToast([]) }
  function abrir(p: PedidoNuevo) {
    cerrar()
    try { localStorage.setItem('empresa', p.empresa) } catch { /* sin storage */ }
    // Recarga completa: así Pedidos toma la empresa del pedido aunque ya estuviera abierto.
    window.location.href = `/pedidos?ver=${p.id}`
  }

  if (!pend.length) return null
  const ultimo = toast[0]

  return (
    <>
      {/* Franja fina mientras haya pedidos sin procesar (no tapa nada) */}
      <div onClick={() => abrir(pend[pend.length - 1])} role="button"
        style={{ position: 'sticky', top: 56, zIndex: 39, background: color, color: '#fff', padding: '7px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, flexWrap: 'wrap', textAlign: 'center' }}>
        <span>🛎 {pend.length === 1 ? '1 pedido nuevo sin procesar' : `${pend.length} pedidos nuevos sin procesar`}</span>
        <span style={{ fontWeight: 500, opacity: .9 }}>· {pesos(pend.reduce((s, p) => s + p.total, 0))}</span>
        <span style={{ textDecoration: 'underline' }}>Ver →</span>
      </div>

      {/* Aviso "Nuevo pedido recibido" en la esquina (arriba de la barra de abajo en celular) */}
      {ultimo && (
        <div role="alert" style={{
          position: 'fixed', right: 16, bottom: 'calc(76px + env(safe-area-inset-bottom))', zIndex: 400,
          width: 'min(380px, calc(100vw - 32px))', background: '#fff', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 18px 50px rgba(26,18,16,.28)', border: `2px solid ${color}`, fontFamily: 'inherit', animation: 'aviso-entra .35s ease-out',
        }}>
          <style>{'@keyframes aviso-entra{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}'}</style>
          <div style={{ background: color, color: '#fff', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15 }}>
            🛎 {toast.length === 1 ? 'Nuevo pedido recibido' : `${toast.length} pedidos nuevos recibidos`}
            <button onClick={cerrar} aria-label="Cerrar" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
              <b style={{ fontSize: 16, color: '#1A1210' }}>{ultimo.cliente}</b>
              <b style={{ fontSize: 16, color: '#1A1210', whiteSpace: 'nowrap' }}>{pesos(ultimo.total)}</b>
            </div>
            <div style={{ fontSize: 12.5, color: '#6B5D55', marginTop: 3 }}>
              {ultimo.numero} · {emp(ultimo.empresa)} · {ultimo.productos} {ultimo.productos === 1 ? 'producto' : 'productos'} · {ultimo.vendedor ? `🚶 ${ultimo.vendedor}` : '👤 lo hizo el cliente'}
            </div>
            {toast.length > 1 && <div style={{ fontSize: 12, color: '#A89888', marginTop: 4 }}>y {toast.length - 1} más</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => abrir(ultimo)} style={{ flex: 1, background: color, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Ver pedido</button>
              <button onClick={cerrar} style={{ background: '#fff', border: '1px solid #C8BAA8', borderRadius: 10, padding: '10px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#1A1210' }}>Después</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
