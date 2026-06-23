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

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// ── iOS: captura foto con cámara nativa ──────────────────────────────────────
function IOSScanner({ onDetect, onClose, titulo }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<'idle' | 'procesando' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEstado('procesando')
    const url = URL.createObjectURL(file)
    try {
      const img = await loadImage(url)
      const reader = new BrowserMultiFormatReader(HINTS)
      const result = await reader.decodeFromImageElement(img)
      URL.revokeObjectURL(url)
      onDetect(result.getText())
    } catch {
      URL.revokeObjectURL(url)
      setEstado('error')
      setErrorMsg('No se pudo leer el código.\nAcercá más la cámara al código de barras.')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{ display: 'none' }} />

      <div style={{ background: '#1a1a1a', borderRadius: 20, padding: 32, width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{titulo}</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
        </div>

        {estado === 'idle' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📷</div>
            <p style={{ color: '#bbb', fontSize: 13, lineHeight: 1.6, margin: '0 0 24px' }}>
              Tomá una foto del código de barras.<br />Acercá bien para que el código ocupe la mayor parte de la imagen.
            </p>
            <button onClick={() => inputRef.current?.click()} style={{ background: '#800000', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              Abrir cámara
            </button>
          </>
        )}

        {estado === 'procesando' && (
          <>
            <div style={{ fontSize: 44, marginBottom: 16 }}>⏳</div>
            <p style={{ color: '#bbb', fontSize: 13 }}>Leyendo código de barras...</p>
          </>
        )}

        {estado === 'error' && (
          <>
            <div style={{ fontSize: 44, marginBottom: 12 }}>❌</div>
            <p style={{ color: '#f88', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px', whiteSpace: 'pre-line' }}>{errorMsg}</p>
            <button onClick={() => { setEstado('idle'); inputRef.current?.click() }} style={{ background: '#800000', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              Intentar de nuevo
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── No-iOS: video stream continuo (rápido) ───────────────────────────────────
function VideoScanner({ onDetect, onClose, titulo }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const detectedRef = useRef(false)
  const onDetectRef = useRef(onDetect)
  onDetectRef.current = onDetect

  const [error, setError] = useState('')
  const [hint, setHint]   = useState('Apuntá la cámara al código de barras')

  useEffect(() => {
    if (!videoRef.current) return
    const reader = new BrowserMultiFormatReader(HINTS)

    reader.decodeFromConstraints(
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } } },
      videoRef.current,
      (result) => {
        if (detectedRef.current || !result) return
        detectedRef.current = true
        setHint('✓ Código detectado')
        onDetectRef.current(result.getText())
      }
    )
      .then(controls => { controlsRef.current = controls })
      .catch(e => {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('NotAllowed') || msg.includes('Permission')) {
          setError('Permiso de cámara denegado.\nHabilitalo en Ajustes del navegador.')
        } else if (msg.includes('NotFound') || msg.includes('Devices')) {
          setError('No se encontró ninguna cámara en el dispositivo.')
        } else {
          setError('No se pudo iniciar la cámara: ' + msg)
        }
      })

    return () => { try { controlsRef.current?.stop() } catch { /* ignore */ } }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(0,0,0,0.8)', zIndex: 1 }}>
        <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{titulo}</span>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
      </div>

      {error ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📷</div>
            <div style={{ fontSize: 15, marginBottom: 24, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{error}</div>
            <button onClick={onClose} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, cursor: 'pointer', fontWeight: 600 }}>Cerrar</button>
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

          <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 14, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {hint}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Componente público: elige automáticamente según dispositivo ───────────────
export default function BarcodeScanner(props: Props) {
  const [ios] = useState(() => isIOS())
  return ios ? <IOSScanner {...props} /> : <VideoScanner {...props} />
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}
