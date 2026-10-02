'use client'
import { useState } from 'react'
import { onOverlayMouseDown, onOverlayClick } from '@/lib/overlayClose'

// Botón 🚚 del encabezado: cuánto cobra Andreani por un envío (código postal
// + botellas) con la tarifa actual de la cuenta. Ver src/lib/andreani-cotizador.ts.

const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', text: '#1A1210',
  muted: '#6B5D55', dim: '#A89888', red: '#C03030', amber: '#A07010', amberBg: 'rgba(160,112,16,0.07)',
}

interface Tarifa { servicio: string; precio: number; gratis: boolean }
interface Resultado { cp: string; botellas: number; valorDeclarado: number; tarifas: Tarifa[] }

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')

export default function CotizadorEnvio({ color }: { color: string }) {
  const [abierto, setAbierto] = useState(false)
  const [cp, setCp] = useState('')
  const [botellas, setBotellas] = useState('6')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [res, setRes] = useState<Resultado | null>(null)

  async function cotizar() {
    setError(''); setRes(null); setCargando(true)
    try {
      const r = await fetch(`/api/andreani/cotizar?cp=${encodeURIComponent(cp)}&botellas=${encodeURIComponent(botellas)}`, { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) setError(j.error || 'No se pudo cotizar')
      else setRes(j)
    } catch { setError('No se pudo cotizar') }
    setCargando(false)
  }

  const input = { border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 14, fontFamily: 'inherit', color: T.text, background: T.surface, width: '100%', boxSizing: 'border-box' as const }
  const cant = Number(botellas) || 0

  return (
    <>
      <button className="top-btn" onClick={() => setAbierto(true)} title="Cotizar envío Andreani"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>
        🚚
      </button>

      {abierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onMouseDown={onOverlayMouseDown} onClick={e => onOverlayClick(e, () => setAbierto(false))}>
          <div style={{ background: T.surface, borderRadius: 14, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(26,18,16,0.22)' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Cotizar envío Andreani</h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: T.muted }}>Con la tarifa actual de la cuenta, desde Mar del Plata</p>
              </div>
              <button onClick={() => setAbierto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={e => { e.preventDefault(); cotizar() }} style={{ padding: '18px 22px', display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ fontSize: 12, color: T.muted, display: 'grid', gap: 5 }}>
                  Código postal destino
                  <input value={cp} onChange={e => setCp(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="7300" inputMode="numeric" autoFocus style={input} />
                </label>
                <label style={{ fontSize: 12, color: T.muted, display: 'grid', gap: 5 }}>
                  Botellas
                  <input value={botellas} onChange={e => setBotellas(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" style={input} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[1, 3, 6, 12, 24, 36, 42].map(n => (
                  <button key={n} type="button" onClick={() => setBotellas(String(n))}
                    style={{ border: `1px solid ${cant === n ? color : T.border}`, background: cant === n ? color : T.surface, color: cant === n ? '#fff' : T.muted, borderRadius: 999, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {n % 6 === 0 && n >= 6 ? `${n / 6} caja${n > 6 ? 's' : ''}` : `${n} bot.`}
                  </button>
                ))}
              </div>
              <button type="submit" disabled={cargando || cp.length !== 4 || cant < 1}
                style={{ background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: cargando || cp.length !== 4 || cant < 1 ? 0.5 : 1 }}>
                {cargando ? 'Cotizando… (unos segundos)' : 'Cotizar'}
              </button>
            </form>

            {(error || res) && (
              <div style={{ padding: '0 22px 20px' }}>
                {error && <div style={{ color: T.red, fontSize: 13 }}>{error}</div>}
                {res && (
                  <>
                    {res.tarifas.length === 0 ? (
                      <div style={{ fontSize: 13, color: T.muted }}>Andreani no devolvió tarifas para el CP {res.cp}.</div>
                    ) : (
                      <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                        {res.tarifas.map(t => (
                          <div key={t.servicio} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
                            <span style={{ color: T.text, textTransform: 'capitalize' }}>{t.servicio}</span>
                            <strong style={{ color: t.gratis ? T.amber : T.text }}>{t.gratis ? 'Gratis (?)' : fmt(t.precio)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                    {res.tarifas.some(t => t.gratis) && (
                      <div style={{ marginTop: 10, background: T.amberBg, color: T.amber, fontSize: 12, padding: '8px 10px', borderRadius: 8 }}>
                        El envío gratis de la web está activo para este monto, así que Andreani no muestra el costo real.
                      </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 11, color: T.dim }}>
                      {res.botellas} botellas de 1,3 kg a CP {res.cp}, valor declarado {fmt(res.valorDeclarado)} (incluye el seguro de Andreani). Es el mismo precio que muestra la web.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
