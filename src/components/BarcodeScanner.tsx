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
    BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,  BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
  ]],
  [DecodeHintType.TRY_HARDER, true],
])

function hasBarcodeDetector() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window
}

// ── Shell de video compartido ─────────────────────────────────────────────────
function VideoShell({ videoRef, hint, error, titulo, onClose, onPhoto }: {
  videoRef: React.RefObject<HTMLVideoElement>
  hint: string; error: string; titulo: string
  onClose: () => void
  onPhoto?: () => void
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(0,0,0,0.8)', zIndex: 1 }}>
        <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{titulo}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {onPhoto && !error && (
            <button onClick={onPhoto} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
              📷 Foto
            </button>
          )}
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}>
            Cancelar
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📷</div>
            <div style={{ fontSize: 15, marginBottom: 24, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{error}</div>
            {onPhoto && (
              <button onClick={onPhoto} style={{ background: '#800000', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, cursor: 'pointer', fontWeight: 600, marginBottom: 12, width: '100%' }}>
                Usar foto en su lugar
              </button>
            )}
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 28px', fontSize: 14, cursor: 'pointer', width: '100%' }}>
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
          <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 14, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{hint}</div>
        </div>
      )}
    </div>
  )
}

// ── Foto fallback (capture nativo del OS) ─────────────────────────────────────
function PhotoScanner({ onDetect, onClose, titulo }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<'idle' | 'procesando' | 'error'>('idle')

  useEffect(() => {
    // En iOS abrimos la cámara automáticamente al montar
    setTimeout(() => inputRef.current?.click(), 50)
  }, [])

  async function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEstado('procesando')
    const url = URL.createObjectURL(file)
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new window.Image(); i.onload = () => res(i); i.onerror = rej; i.src = url
      })
      const reader = new BrowserMultiFormatReader(HINTS)
      const result = await reader.decodeFromImageElement(img)
      URL.revokeObjectURL(url)
      onDetect(result.getText())
    } catch {
      URL.revokeObjectURL(url)
      setEstado('error')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{ display: 'none' }} />
      <div style={{ background: '#1a1a1a', borderRadius: 20, padding: 32, width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{titulo}</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
        </div>

        {estado === 'idle' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📷</div>
            <p style={{ color: '#bbb', fontSize: 13, lineHeight: 1.6, margin: '0 0 24px' }}>
              Tomá una foto del código de barras.<br />Acercá la cámara para que el código sea bien visible.
            </p>
            <button onClick={() => inputRef.current?.click()} style={{ background: '#800000', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              Abrir cámara
            </button>
          </>
        )}

        {estado === 'procesando' && (
          <>
            <div style={{ fontSize: 44, marginBottom: 16 }}>⏳</div>
            <p style={{ color: '#bbb', fontSize: 13 }}>Leyendo código...</p>
          </>
        )}

        {estado === 'error' && (
          <>
            <div style={{ fontSize: 44, marginBottom: 12 }}>❌</div>
            <p style={{ color: '#f88', fontSize: 13, margin: '0 0 20px' }}>
              No se pudo leer el código. Intentá de nuevo acercando más la cámara y asegurate de que el código esté bien enfocado.
            </p>
            <button onClick={() => { setEstado('idle'); setTimeout(() => inputRef.current?.click(), 50) }}
              style={{ background: '#800000', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              Intentar de nuevo
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── NativeScanner: BarcodeDetector API (Chrome / Android) ─────────────────────
function NativeScanner({ onDetect, onClose, titulo }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const rafRef      = useRef<number>(0)
  const detectedRef = useRef(false)
  const onDetectRef = useRef(onDetect)
  onDetectRef.current = onDetect

  const [error, setError]     = useState('')
  const [hint, setHint]       = useState('Apuntá la cámara al código de barras')
  const [usePhoto, setUsePhoto] = useState(false)

  useEffect(() => {
    if (usePhoto) return
    let active = true

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        })
        streamRef.current = stream
        if (!videoRef.current || !active) { stream.getTracks().forEach(t => t.stop()); return }
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        // @ts-expect-error BarcodeDetector no está en los tipos TS
        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
        })

        const scan = async () => {
          if (!active || detectedRef.current || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0 && !detectedRef.current) {
              detectedRef.current = true
              setHint('✓ Código detectado')
              onDetectRef.current(codes[0].rawValue.trim())
              return
            }
          } catch { /* frame vacío */ }
          rafRef.current = requestAnimationFrame(scan)
        }
        scan()
      } catch (e) {
        if (!active) return
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('NotAllowed') || msg.includes('Permission')) {
          setError('Permiso de cámara denegado.\nHabilitalo en Ajustes del navegador.')
        } else {
          setUsePhoto(true)
        }
      }
    }

    start()
    return () => {
      active = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [usePhoto])

  if (usePhoto) return <PhotoScanner onDetect={onDetect} onClose={onClose} titulo={titulo} />

  return <VideoShell videoRef={videoRef} hint={hint} error={error} titulo={titulo!} onClose={onClose}
    onPhoto={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setUsePhoto(true) }} />
}

// ── LiveScanner: ZXing + getUserMedia (iOS Safari y resto) ────────────────────
// Funciona en iOS 14.3+ Safari sin necesidad de modo foto.
function LiveScanner({ onDetect, onClose, titulo }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const rafRef      = useRef<number>(0)
  const detectedRef = useRef(false)
  const onDetectRef = useRef(onDetect)
  onDetectRef.current = onDetect

  const [error, setError]       = useState('')
  const [hint, setHint]         = useState('Apuntá la cámara al código de barras')
  const [usePhoto, setUsePhoto] = useState(false)

  useEffect(() => {
    if (usePhoto) return
    let active = true
    const reader = new BrowserMultiFormatReader(HINTS)

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        })
        streamRef.current = stream
        if (!videoRef.current || !active) { stream.getTracks().forEach(t => t.stop()); return }
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        const scan = async () => {
          if (!active || detectedRef.current || !videoRef.current) return
          // Esperar a que el video tenga datos
          if (videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(scan)
            return
          }
          try {
            const result = await reader.decodeFromVideoElement(videoRef.current)
            if (!detectedRef.current) {
              detectedRef.current = true
              setHint('✓ Código detectado')
              onDetectRef.current(result.getText().trim())
              return
            }
          } catch { /* frame sin código — continuar */ }
          rafRef.current = requestAnimationFrame(scan)
        }
        rafRef.current = requestAnimationFrame(scan)

      } catch (e) {
        if (!active) return
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('NotAllowed') || msg.includes('Permission')) {
          setError('Permiso de cámara denegado.\nEn iPhone: Ajustes → Safari → Cámara → Permitir.')
        } else {
          // Cualquier otro error: caer al modo foto
          setUsePhoto(true)
        }
      }
    }

    start()
    return () => {
      active = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [usePhoto])

  if (usePhoto) return <PhotoScanner onDetect={onDetect} onClose={onClose} titulo={titulo} />

  return <VideoShell videoRef={videoRef} hint={hint} error={error} titulo={titulo!} onClose={onClose}
    onPhoto={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setUsePhoto(true) }} />
}

// ── Export: Native si hay BarcodeDetector, Live para todo lo demás ────────────
export default function BarcodeScanner(props: Props) {
  if (hasBarcodeDetector()) return <NativeScanner {...props} />
  return <LiveScanner {...props} />
}
