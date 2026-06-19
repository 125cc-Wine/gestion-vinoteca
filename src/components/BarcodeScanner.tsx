'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  onDetect: (code: string) => void
  onClose: () => void
  titulo?: string
}

declare global {
  interface Window {
    BarcodeDetector: new (opts: { formats: string[] }) => {
      detect(src: HTMLVideoElement): Promise<{ rawValue: string; format: string }[]>
    }
  }
}

export default function BarcodeScanner({ onDetect, onClose, titulo = 'Escanear código de barras' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')
  const [hint, setHint] = useState('Apuntá la cámara al código de barras')
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const detectedRef = useRef(false)

  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setError('Escáner no disponible. Usá Chrome en Android.')
      return
    }

    let stopped = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        })
        streamRef.current = stream
        if (!videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        })

        const loop = async () => {
          if (stopped || detectedRef.current || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0 && !detectedRef.current) {
              detectedRef.current = true
              setHint('✓ Código detectado')
              onDetect(codes[0].rawValue)
              return
            }
          } catch { /* frame not ready */ }
          rafRef.current = requestAnimationFrame(loop)
        }
        rafRef.current = requestAnimationFrame(loop)
      } catch {
        setError('No se pudo acceder a la cámara. Verificá los permisos en Chrome.')
      }
    }

    start()

    return () => {
      stopped = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [onDetect])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000', zIndex: 300,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
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
            <div style={{ fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>{error}</div>
            <button onClick={onClose} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, cursor: 'pointer', fontWeight: 600 }}>
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <video ref={videoRef} playsInline muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

          {/* Viewfinder overlay */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ position: 'relative' }}>
              {/* Dark mask */}
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
              {/* Scan window */}
              <div style={{
                position: 'relative', width: 280, height: 140,
                background: 'transparent',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                borderRadius: 6,
              }}>
                {/* Corner marks */}
                {[
                  { top: 0, left: 0, borderTop: '3px solid #fff', borderLeft: '3px solid #fff' },
                  { top: 0, right: 0, borderTop: '3px solid #fff', borderRight: '3px solid #fff' },
                  { bottom: 0, left: 0, borderBottom: '3px solid #fff', borderLeft: '3px solid #fff' },
                  { bottom: 0, right: 0, borderBottom: '3px solid #fff', borderRight: '3px solid #fff' },
                ].map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 20, height: 20, borderRadius: 2, ...s }} />
                ))}
                {/* Scan line */}
                <div style={{
                  position: 'absolute', left: 0, right: 0, top: '50%',
                  height: 2, background: 'rgba(128,0,0,0.8)',
                  boxShadow: '0 0 8px rgba(128,0,0,0.6)',
                }} />
              </div>
            </div>
          </div>

          {/* Hint */}
          <div style={{
            position: 'absolute', bottom: 40, left: 0, right: 0,
            textAlign: 'center', color: '#fff', fontSize: 14,
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>
            {hint}
          </div>
        </div>
      )}
    </div>
  )
}
