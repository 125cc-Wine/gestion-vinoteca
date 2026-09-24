'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Aviso de pedidos de la tienda web, en el encabezado de toda la app.
//
// - Ícono 🛒 con la cantidad de pedidos web SIN LEVANTAR: queda visible hasta
//   que alguien los levanta en Pedidos (no se va solo).
// - Popup cuando entra un pedido nuevo, con "Ver pedido" / "Aceptar". Lo
//   aceptado se recuerda en este navegador para no repetir el popup; el
//   ícono sigue hasta que se levante el pedido.
//
// Consultar /api/woo/pedidos también dispara la importación desde la web
// (el servidor la limita a una vez cada 2 minutos). Ver src/lib/woo-pedidos.ts.

interface PedidoWeb { id: string; numero: string; cliente_nombre: string; total: number; pago: string | null; created_at: string }

const INTERVALO_MS = 60_000
const CLAVE_VISTOS = 'pedidos_web_vistos'

function leerVistos(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(CLAVE_VISTOS) || '[]')) } catch { return new Set() }
}
function guardarVistos(v: Set<string>) {
  try { localStorage.setItem(CLAVE_VISTOS, JSON.stringify(Array.from(v).slice(-200))) } catch { /* sin storage: el popup puede repetirse */ }
}

export default function PedidosWebAviso({ color }: { color: string }) {
  const router = useRouter()
  const [pendientes, setPendientes] = useState<PedidoWeb[]>([])
  const [nuevos, setNuevos] = useState<PedidoWeb[]>([])
  const consultando = useRef(false)

  useEffect(() => {
    let cancelado = false
    async function consultar() {
      if (consultando.current || document.visibilityState !== 'visible') return
      consultando.current = true
      try {
        const res = await fetch('/api/woo/pedidos', { cache: 'no-store' })
        if (!res.ok) return
        const d: { pendientes: PedidoWeb[] } = await res.json()
        if (cancelado) return
        const lista = d.pendientes ?? []
        setPendientes(lista)
        const vistos = leerVistos()
        setNuevos(lista.filter(p => !vistos.has(p.id)))
      } catch { /* sin red: próxima vuelta */ } finally { consultando.current = false }
    }
    consultar()
    const t = setInterval(consultar, INTERVALO_MS)
    const alCambiar = () => consultar()
    window.addEventListener('pedidos-web-cambio', alCambiar)
    document.addEventListener('visibilitychange', alCambiar)
    return () => { cancelado = true; clearInterval(t); window.removeEventListener('pedidos-web-cambio', alCambiar); document.removeEventListener('visibilitychange', alCambiar) }
  }, [])

  function aceptar() {
    const v = leerVistos(); nuevos.forEach(p => v.add(p.id)); guardarVistos(v)
    setNuevos([])
  }

  const n = pendientes.length

  return (
    <>
      <button onClick={() => router.push('/pedidos')} title={n ? `${n} pedido${n > 1 ? 's' : ''} web sin levantar` : 'Pedidos web'}
        className="top-btn"
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: n ? 'rgba(128,0,0,0.06)' : 'transparent', border: `1px solid ${n ? color : 'transparent'}`,
          borderRadius: 8, padding: '6px 9px', cursor: 'pointer', fontSize: 15, lineHeight: 1,
          opacity: n ? 1 : 0.45, transition: 'all 0.12s',
        }}>
        🛒
        {n > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 99,
            background: color, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '0 5px',
            boxShadow: '0 0 0 2px #fff', animation: 'pedidoWebPulso 1.6s ease-in-out infinite',
          }}>{n}</span>
        )}
      </button>
      <style>{`@keyframes pedidoWebPulso { 0%,100% { transform: scale(1) } 50% { transform: scale(1.15) } }`}</style>

      {nuevos.length > 0 && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(3px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(26,18,16,0.25)', overflow: 'hidden', borderTop: `5px solid ${color}` }}>
            <div style={{ padding: '20px 22px 8px' }}>
              <div style={{ fontSize: 28, lineHeight: 1 }}>🛒</div>
              <h2 style={{ margin: '10px 0 4px', fontSize: 17, fontWeight: 700, color: '#1A1210' }}>
                {nuevos.length === 1 ? 'Nuevo pedido de la web' : `${nuevos.length} pedidos nuevos de la web`}
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: '#6B5D55' }}>Queda en Pedidos hasta que alguien lo levante y lo arme.</p>
            </div>
            <div style={{ padding: '8px 22px 4px', maxHeight: 240, overflowY: 'auto' }}>
              {nuevos.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '9px 0', borderBottom: '1px solid #EFE6DA', fontSize: 13 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#1A1210' }}>{p.numero} · {p.cliente_nombre}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: p.pago === 'pagado' ? '#2D7A4F' : '#A07010' }}>{p.pago === 'pagado' ? '✓ Pagado' : '⏳ Esperando pago'}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#1A1210', whiteSpace: 'nowrap' }}>${Number(p.total).toLocaleString('es-AR')}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '14px 22px 18px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={aceptar} style={{ background: '#fff', border: '1px solid #DDD0C0', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#6B5D55', cursor: 'pointer', fontFamily: 'inherit' }}>Aceptar</button>
              <button onClick={() => { aceptar(); router.push('/pedidos') }} style={{ background: color, border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Ver pedido{nuevos.length > 1 ? 's' : ''}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
