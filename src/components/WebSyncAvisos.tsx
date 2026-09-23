'use client'
import { useEffect, useRef, useState } from 'react'

// Cartelitos globales cuando el stock de un producto se actualiza en la web.
//
// El envío a WooCommerce pasa en el servidor DESPUÉS de que la app responde
// el guardado (ver src/lib/woo-stock-cola.ts), así que la pantalla no se
// entera sola: acá se consulta cada pocos segundos qué se terminó de
// procesar desde la última vez y se muestra un aviso por producto (o uno
// resumido si llegan muchos juntos, ej. una carga masiva).

interface ItemCola {
  id: number
  woo_product_id: number
  delta: number
  estado: 'ok' | 'error' | 'conflicto'
  error: string | null
  stock_web_antes: number | null
  stock_web_despues: number | null
  procesado_at: string
  productos: { nombre: string } | null
}

interface Aviso { key: string; tipo: 'ok' | 'error'; titulo: string; detalle: string }

const INTERVALO_MS = 6000
const DURACION_OK_MS = 6000
const DURACION_ERROR_MS = 15000
const MAX_INDIVIDUALES = 3 // más que esto en una misma consulta -> un aviso resumido

const C = {
  surface: '#FFFFFF', border: '#DDD0C0', text: '#1A1210', muted: '#6B5D55',
  green: '#2D7A4F', red: '#C03030', amber: '#A07010',
}

function armarAvisos(items: ItemCola[]): Aviso[] {
  // Varias filas de la cola del mismo producto web se procesan juntas y
  // comparten el antes/después: un solo aviso por producto y momento.
  const vistos = new Set<string>()
  const unicos = items.filter(i => {
    if (i.estado === 'ok' && i.stock_web_despues == null) return false // diferencias que se cancelaron
    const k = `${i.woo_product_id}|${i.procesado_at}`
    if (vistos.has(k)) return false
    vistos.add(k)
    return true
  })
  const oks = unicos.filter(i => i.estado === 'ok')
  const fallas = unicos.filter(i => i.estado !== 'ok')
  const avisos: Aviso[] = []

  if (oks.length > MAX_INDIVIDUALES) {
    avisos.push({
      key: `ok-${oks[0].id}`, tipo: 'ok',
      titulo: `${oks.length} productos actualizados en la web`,
      detalle: oks.slice(0, 3).map(i => i.productos?.nombre ?? `#${i.woo_product_id}`).join(', ') + (oks.length > 3 ? '…' : ''),
    })
  } else {
    for (const i of oks) {
      avisos.push({
        key: `ok-${i.id}`, tipo: 'ok',
        titulo: 'Stock actualizado en la web',
        detalle: `${i.productos?.nombre ?? `#${i.woo_product_id}`}: ${i.stock_web_antes} → ${i.stock_web_despues}`,
      })
    }
  }

  for (const i of fallas) {
    avisos.push({
      key: `err-${i.id}`, tipo: 'error',
      titulo: i.estado === 'conflicto' ? 'No se actualizó en la web (conflicto)' : 'No se pudo actualizar en la web',
      detalle: `${i.productos?.nombre ?? `#${i.woo_product_id}`}: ${i.error ?? 'error desconocido'}`,
    })
  }
  return avisos
}

export default function WebSyncAvisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const cursor = useRef<string | null>(null)

  useEffect(() => {
    let cancelado = false

    async function consultar() {
      if (document.visibilityState !== 'visible') return
      try {
        const res = await fetch(`/api/woo/stock-cola?desde=${encodeURIComponent(cursor.current ?? 'inicio')}`, { cache: 'no-store' })
        if (!res.ok) return
        const d: { cursor: string; items: ItemCola[] } = await res.json()
        if (cancelado) return
        const primera = cursor.current === null
        cursor.current = d.cursor
        if (primera || !d.items?.length) return
        const nuevos = armarAvisos(d.items)
        setAvisos(prev => [...prev, ...nuevos])
        for (const a of nuevos) {
          setTimeout(() => setAvisos(prev => prev.filter(x => x.key !== a.key)),
            a.tipo === 'ok' ? DURACION_OK_MS : DURACION_ERROR_MS)
        }
      } catch { /* sin red: se reintenta en la próxima vuelta */ }
    }

    consultar()
    const t = setInterval(consultar, INTERVALO_MS)
    return () => { cancelado = true; clearInterval(t) }
  }, [])

  if (avisos.length === 0) return null

  return (
    <div style={{ position: 'fixed', top: 68, right: 16, zIndex: 400, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 'calc(100vw - 32px)', width: 340, pointerEvents: 'none' }}>
      <style>{`@keyframes webAvisoIn { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: none } }`}</style>
      {avisos.map(a => (
        <div key={a.key} role="status" style={{
          pointerEvents: 'auto', background: C.surface, border: `1px solid ${C.border}`,
          borderLeft: `4px solid ${a.tipo === 'ok' ? C.green : C.red}`, borderRadius: 10,
          padding: '10px 12px 10px 14px', boxShadow: '0 8px 24px rgba(26,18,16,0.12)',
          animation: 'webAvisoIn 180ms ease-out', display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span aria-hidden style={{ fontSize: 16, lineHeight: '18px' }}>{a.tipo === 'ok' ? '🌐' : '⚠️'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: a.tipo === 'ok' ? C.green : C.red }}>{a.titulo}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2, overflowWrap: 'anywhere' }}>{a.detalle}</div>
          </div>
          <button onClick={() => setAvisos(prev => prev.filter(x => x.key !== a.key))} aria-label="Cerrar"
            style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2, fontFamily: 'inherit' }}>×</button>
        </div>
      ))}
    </div>
  )
}
