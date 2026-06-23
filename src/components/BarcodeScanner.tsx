'use client'
import { useRef, useState } from 'react'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<'idle' | 'procesando' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setEstado('procesando')
    setErrorMsg('')

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
      setErrorMsg('No se pudo leer el código.\nAcercá más la cámara y asegurate que esté bien iluminado.')
      // reset input para permitir reintentar
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function reintentar() {
    setEstado('idle')
    setErrorMsg('')
    inputRef.current?.click()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 300, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 32,
    }}>
      {/* Input oculto — abre cámara en móvil */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        style={{ display: 'none' }}
      />

      <div style={{
        background: '#1a1a1a', borderRadius: 20, padding: 32,
        width: '100%', maxWidth: 380, textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{titulo}</span>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}
          >
            Cancelar
          </button>
        </div>

        {estado === 'idle' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 20 }}>📷</div>
            <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6, marginBottom: 28, margin: '0 0 28px' }}>
              Tomá una foto del código de barras.<br />
              Acercá bien la cámara para que el código ocupe la mayor parte de la imagen.
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              style={{
                background: '#800000', color: '#fff', border: 'none',
                borderRadius: 12, padding: '16px 40px', fontSize: 16,
                fontWeight: 700, cursor: 'pointer', width: '100%',
              }}
            >
              Abrir cámara
            </button>
          </>
        )}

        {estado === 'procesando' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
            <p style={{ color: '#ccc', fontSize: 14 }}>Leyendo código de barras...</p>
          </>
        )}

        {estado === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <p style={{ color: '#f88', fontSize: 14, lineHeight: 1.6, marginBottom: 24, whiteSpace: 'pre-line' }}>
              {errorMsg}
            </p>
            <button
              onClick={reintentar}
              style={{
                background: '#800000', color: '#fff', border: 'none',
                borderRadius: 12, padding: '14px 36px', fontSize: 15,
                fontWeight: 700, cursor: 'pointer', width: '100%',
              }}
            >
              Intentar de nuevo
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}
