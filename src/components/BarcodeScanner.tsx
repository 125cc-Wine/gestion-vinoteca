'use client'
import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

interface Props {
  onDetect: (code: string) => void
  onClose: () => void
  titulo?: string
}

export default function BarcodeScanner({ onDetect, onClose, titulo = 'Escanear código de barras' }: Props) {
  const videoRef     = useRef<HTMLVideoElement>(null)
  const controlsRef  = useRef<{ stop: () => void } | null>(null)
  const detectedRef  = useRef(false)
  const onDetectRef  = useRef(onDetect)
  onDetectRef.current = onDetect

  const [cameraStatus, setCameraStatus] = useState('Iniciando cámara...')
  const [frameCount, setFrameCount]     = useState(0)
  const [lastErr, setLastErr]           = useState('')
  const [detected, setDetected]         = useState('')
  const [fatalError, setFatalError]     = useState('')

  const frameCountRef = useRef(0)

  useEffect(() => {
    if (!videoRef.current) return

    const reader = new BrowserMultiFormatReader()

    async function start() {
      setCameraStatus('Solicitando permiso de cámara...')
      try {
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } } },
          videoRef.current!,
          (result, error) => {
            // Contar cada callback (indica que ZXing está activo)
            frameCountRef.current++
            if (frameCountRef.current % 10 === 0) {
              setFrameCount(frameCountRef.current)
              setCameraStatus('Cámara activa — escaneando...')
            }

            if (result) {
              const text = result.getText()
              setDetected(text)
              if (!detectedRef.current) {
                detectedRef.current = true
                onDetectRef.current(text)
              }
            }

            // Capturar errores que no sean NotFoundException (esas son normales)
            if (error) {
              const msg = error.message || String(error)
              if (!msg.includes('NotFoundException') && !msg.includes('No MultiFormat')) {
                setLastErr(msg)
              }
            }
          }
        )
        controlsRef.current = controls
        setCameraStatus('Cámara iniciada — apuntá al código')
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        setFatalError(msg)
        if (msg.includes('NotAllowed') || msg.includes('Permission')) {
          setCameraStatus('ERROR: Permiso denegado')
        } else if (msg.includes('NotFound') || msg.includes('Devices')) {
          setCameraStatus('ERROR: Cámara no encontrada')
        } else {
          setCameraStatus('ERROR: ' + msg)
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(0,0,0,0.85)', zIndex: 1 }}>
        <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{titulo}</span>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}>
          Cancelar
        </button>
      </div>

      {/* Debug panel */}
      <div style={{ background: 'rgba(0,0,0,0.75)', padding: '8px 14px', fontSize: 11, fontFamily: 'monospace', color: '#0f0', lineHeight: 1.7, zIndex: 1 }}>
        <div>Estado: <span style={{ color: cameraStatus.startsWith('ERROR') ? '#f55' : '#0f0' }}>{cameraStatus}</span></div>
        <div>Frames ZXing: <span style={{ color: frameCount > 0 ? '#0f0' : '#ff0' }}>{frameCount}</span>
          {frameCount === 0 && <span style={{ color: '#ff0' }}> ← si sigue en 0, ZXing no está corriendo</span>}
        </div>
        {lastErr && <div style={{ color: '#f88' }}>Error ZXing: {lastErr}</div>}
        {detected && <div style={{ color: '#0ff' }}>Detectado: <strong>{detected}</strong></div>}
        {fatalError && <div style={{ color: '#f44' }}>Error fatal: {fatalError}</div>}
      </div>

      {/* Video */}
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
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
            <div style={{ position: 'relative', width: 280, height: 140, background: 'transparent', boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)', borderRadius: 6 }}>
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
          {detected ? `✓ ${detected}` : 'Apuntá al código de barras'}
        </div>
      </div>
    </div>
  )
}
