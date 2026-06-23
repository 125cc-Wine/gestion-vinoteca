'use client'
import { useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

interface Props {
  onDetect: (code: string) => void
  onClose: () => void
  titulo?: string
}

export default function BarcodeScanner({ onDetect, onClose, titulo = 'Escanear código de barras' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'processing' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('processing')
    setErrorMsg('')

    const url = URL.createObjectURL(file)
    try {
      const reader = new BrowserMultiFormatReader()
      const result = await reader.decodeFromImageUrl(url)
      URL.revokeObjectURL(url)
      onDetect(result.getText())
    } catch {
      URL.revokeObjectURL(url)
      setStatus('error')
      setErrorMsg('No se detectó ningún código. Intentá de nuevo con mejor luz o más cerca.')
      // Reset input para permitir nueva foto
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 360,
        overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ background: '#1A1210', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{titulo}</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}>
            Cancelar
          </button>
        </div>

        <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          {/* Icono de código de barras */}
          <div style={{ width: 80, height: 80, background: 'rgba(128,0,0,0.07)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#800000" strokeWidth="1.5">
              <path d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4M21 9V5a2 2 0 00-2-2h-4M21 15v4a2 2 0 01-2 2h-4" strokeLinecap="round"/>
              <line x1="7" y1="8" x2="7" y2="16" strokeLinecap="round"/>
              <line x1="10" y1="8" x2="10" y2="16" strokeLinecap="round"/>
              <line x1="13" y1="8" x2="13" y2="16" strokeLinecap="round"/>
              <line x1="16" y1="8" x2="16" y2="12" strokeLinecap="round"/>
            </svg>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1210', marginBottom: 6 }}>
              {status === 'processing' ? 'Leyendo código...' : 'Fotografiá el código de barras'}
            </div>
            <div style={{ fontSize: 13, color: '#6B5D55', lineHeight: 1.5 }}>
              {status === 'processing'
                ? 'Procesando imagen...'
                : 'Abrí la cámara, enfocá el código\ny sacá la foto'}
            </div>
          </div>

          {status === 'error' && (
            <div style={{
              background: 'rgba(192,48,48,0.08)', border: '1px solid rgba(192,48,48,0.22)',
              borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C03030',
              textAlign: 'center', lineHeight: 1.5, width: '100%',
            }}>
              {errorMsg}
            </div>
          )}

          {/* Input file oculto */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handlePhoto}
          />

          {/* Botón principal */}
          <button
            disabled={status === 'processing'}
            onClick={() => inputRef.current?.click()}
            style={{
              width: '100%', padding: '14px', fontSize: 15, fontWeight: 700,
              background: status === 'processing' ? '#DDD0C0' : '#800000',
              color: '#fff', border: 'none', borderRadius: 12,
              cursor: status === 'processing' ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'inherit',
            }}
          >
            {status === 'processing' ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/>
                </svg>
                Procesando...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="4" strokeLinecap="round"/>
                </svg>
                {status === 'error' ? 'Intentar de nuevo' : 'Abrir cámara'}
              </>
            )}
          </button>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </div>
  )
}
