'use client'
import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

interface Props {
  onDetect: (code: string) => void
  onClose: () => void
  titulo?: string
}

export default function BarcodeScanner({ onDetect, onClose, titulo = 'Escanear código de barras' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const [error, setError] = useState('')
  const [hint, setHint] = useState('Apuntá la cámara al código de barras')
  const detectedRef = useRef(false)
  const onDetectRef = useRef(onDetect)
  onDetectRef.current = onDetect

  useEffect(() => {
    if (!videoRef.current) return

    const reader = new BrowserMultiFormatReader()

    async function start() {
      try {
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } } },
          videoRef.current!,
          (result) => {
            if (detectedRef.current) return
            if (result) {
              detectedRef.current = true
              setHint('✓ Código detectado')
              onDetectRef.current(result.getText())
            }
          }
        )
        controlsRef.current = controls
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('NotAllowed') || msg.includes('Permission') || msg.includes('ermiso')) {
          setError('Permiso de cámara denegado.\nHabilitalo en Ajustes → Safari → Cámara.')
        } else if (msg.includes('NotFound') || msg.includes('Devices')) {
          setError('No se encontró ninguna cámara en el dispositivo.')
        } else {
          setError('No se pudo iniciar la cámara: ' + msg)
        }
      }
    }

    start()

    return () => {
      try { controlsRef.current?.stop() } catch { /* ignore */ }
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(0,0,0,0.8)', zIndex: 1 }}>
        <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{titulo}</span>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}>
          Cancelar
        </button>
      </div>

      {error ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📷</div>
            <div style={{ fontSize: 15, marginBottom: 24, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{error}</div>
            <button onClick={onClose} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, cursor: 'pointer', fontWeight: 600 }}>
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />

          {/* Viewfinder */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
              <div style={{ position: 'relative', width: 280, height: 140, background: 'transparent', boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)', borderRadius: 6 }}>
                {([
                  { top: 0, left: 0, borderTop: '3px solid #fff', borderLeft: '3px solid #fff' },
                  { top: 0, right: 0, borderTop: '3px solid #fff', borderRight: '3px solid #fff' },
                  { bottom: 0, left: 0, borderBottom: '3px solid #fff', borderLeft: '3px solid #fff' },
                  { bottom: 0, right: 0, borderBottom: '3px solid #fff', borderRight: '3px solid #fff' },
                ] as React.CSSProperties[]).map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 20, height: 20, borderRadius: 2, ...s }} />
                ))}
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: 'rgba(128,0,0,0.8)', boxShadow: '0 0 8px rgba(128,0,0,0.6)' }} />
              </div>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 14, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {hint}
          </div>
        </div>
      )}
    </div>
  )
}
