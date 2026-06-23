'use client'
import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { DecodeHintType, BarcodeFormat } from '@zxing/library'

interface Props {
  onDetect: (code: string) => void
  onClose: () => void
  titulo?: string
}

const HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
  ]],
  [DecodeHintType.TRY_HARDER, true],
])

export default function BarcodeScanner({ onDetect, onClose, titulo = 'Escanear código de barras' }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(document.createElement('canvas'))
  const streamRef  = useRef<MediaStream | null>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeRef  = useRef(true)
  const onDetectRef = useRef(onDetect)
  onDetectRef.current = onDetect

  const [error, setError] = useState('')
  const [hint, setHint]   = useState('Apuntá la cámara al código de barras')

  useEffect(() => {
    activeRef.current = true
    const reader = new BrowserMultiFormatReader(HINTS)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width:  { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        streamRef.current = stream

        if (!videoRef.current || !activeRef.current) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        videoRef.current.srcObject = stream
        await videoRef.current.play()

        // Escanear un frame cada 400ms en vez de polling continuo
        timerRef.current = setInterval(async () => {
          if (!activeRef.current) return
          const video = videoRef.current
          if (!video || video.readyState < 2 || !ctx) return
          const w = video.videoWidth
          const h = video.videoHeight
          if (!w || !h) return

          canvas.width  = w
          canvas.height = h
          ctx.drawImage(video, 0, 0, w, h)

          try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
            const result  = await reader.decodeFromImageUrl(dataUrl)
            if (result && activeRef.current) {
              activeRef.current = false
              setHint('✓ Código detectado')
              onDetectRef.current(result.getText())
            }
          } catch {
            // NotFoundException en frames sin código — normal
          }
        }, 400)

      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('NotAllowed') || msg.includes('Permission')) {
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
      activeRef.current = false
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
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
