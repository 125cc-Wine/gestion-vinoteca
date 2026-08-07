'use client'
import type { MouseEvent } from 'react'

// Cierra un modal por click "afuera" SOLO si tanto el mousedown como el click
// terminaron sobre el overlay/fondo — antes se usaba nada más `e.target ===
// e.currentTarget` en el click, que también da true cuando el usuario arranca
// un drag adentro del modal (ej. seleccionando texto de un input) y suelta el
// mouse afuera: el navegador dispara el click sobre el ancestro común (el
// overlay), y el modal se cerraba de golpe perdiendo lo que se estaba
// editando. Con este chequeo de a dos pasos, un drag que arranca adentro ya
// no cuenta como "click afuera".
const mouseDownEnOverlay = new WeakSet<Element>()

export function onOverlayMouseDown(e: MouseEvent<HTMLElement>) {
  if (e.target === e.currentTarget) mouseDownEnOverlay.add(e.currentTarget)
  else mouseDownEnOverlay.delete(e.currentTarget)
}

export function onOverlayClick(e: MouseEvent<HTMLElement>, close: () => void) {
  const fueClickLimpio = e.target === e.currentTarget && mouseDownEnOverlay.has(e.currentTarget)
  mouseDownEnOverlay.delete(e.currentTarget)
  if (fueClickLimpio) close()
}
