import { useEffect, useRef } from 'react'

// Captures rapid keyboard input from USB/Bluetooth barcode scanners.
// Scanners "type" all chars in < 50ms and end with Enter.
// Ignores input while an <input>, <textarea>, or <select> is focused.
export function useBarcodeInput(onScan: (code: string) => void, active = true) {
  const buffer = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  useEffect(() => {
    if (!active) return

    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'Enter') {
        if (buffer.current.length >= 6) {
          onScanRef.current(buffer.current)
        }
        buffer.current = ''
        if (timer.current) clearTimeout(timer.current)
        return
      }

      if (e.key.length === 1) {
        buffer.current += e.key
        if (timer.current) clearTimeout(timer.current)
        // Scanner finishes in ~100ms; reset buffer if input stops
        timer.current = setTimeout(() => { buffer.current = '' }, 150)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [active])
}
