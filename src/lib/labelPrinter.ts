/**
 * Label printer — Web Serial API (Bluetooth COM port) + ESC/POS raster bitmap.
 * Printer: DeTong P1, 50mm × 44mm label, ~7.68 dots/mm → 384 × 338 dots.
 *
 * Quality technique: render at SCALE=3 (1152×1014) using anti-aliased fonts,
 * then downscale to 384×338 with high-quality smoothing before 1-bit conversion.
 */
import QRCode from 'qrcode'

// ── Web Serial API types ──────────────────────────────────────────────────
interface SerialOptions { baudRate: number }
interface SerialPort {
  open(options: SerialOptions): Promise<void>
  close(): Promise<void>
  readable: ReadableStream | null
  writable: WritableStream<Uint8Array> | null
}
declare global {
  interface Navigator { serial: { requestPort(): Promise<SerialPort> } }
}
export type LabelPrinterPort = SerialPort

// ── Printer constants ─────────────────────────────────────────────────────
export const PRINTER_W    = 384                       // 50mm @ ~7.68 dots/mm
export const PRINTER_H    = 338                       // 44mm @ ~7.68 dots/mm
export const PRINTER_BYTES = PRINTER_W / 8            // 48 bytes/row
export const PRINTER_WIDTH_DOTS = PRINTER_W           // legacy compat

// Supersampling: all renderers draw at SCALE× then printCanvas scales down.
const SCALE = 3

// ── ESC/POS commands ──────────────────────────────────────────────────────
const ESC = 0x1b, GS = 0x1d
const CMD_INIT       = new Uint8Array([ESC, 0x40])
const CMD_ALIGN_LEFT = new Uint8Array([ESC, 0x61, 0x00])
const CMD_FEED       = (n: number) => new Uint8Array([ESC, 0x64, n])
const CMD_LF         = new Uint8Array([0x0a])

function cmdRaster(imgData: Uint8Array, wBytes: number, h: number): Uint8Array {
  const hdr = new Uint8Array([
    GS, 0x76, 0x30, 0x00,
    wBytes & 0xff, (wBytes >> 8) & 0xff,
    h & 0xff, (h >> 8) & 0xff,
  ])
  const out = new Uint8Array(hdr.length + imgData.length)
  out.set(hdr); out.set(imgData, hdr.length)
  return out
}

// ── Canvas → 1-bit bitmap ─────────────────────────────────────────────────
export function canvasToBitmap(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas
  const px = ctx.getImageData(0, 0, width, height).data
  const wb = Math.ceil(width / 8)
  const bmp = new Uint8Array(wb * height)
  for (let y = 0; y < height; y++) {
    for (let bx = 0; bx < wb; bx++) {
      let byte = 0
      for (let bit = 0; bit < 8; bit++) {
        const x = bx * 8 + bit
        if (x < width) {
          const i = (y * width + x) * 4
          if (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114 < 145) byte |= 0x80 >> bit
        }
      }
      bmp[y * wb + bx] = byte
    }
  }
  return { data: bmp, widthBytes: wb, height }
}

// ── Serial helpers ────────────────────────────────────────────────────────
export async function connectPrinter(): Promise<SerialPort> {
  if (!('serial' in navigator)) throw new Error('Web Serial no disponible. Usá Chrome o Edge.')
  const port = await navigator.serial.requestPort()
  await port.open({ baudRate: 9600 })
  return port
}
export async function disconnectPrinter(port: SerialPort) { try { await port.close() } catch { /**/ } }

async function write(port: SerialPort, data: Uint8Array) {
  const w = port.writable!.getWriter()
  try { await w.write(data) } finally { w.releaseLock() }
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((a, c) => a + c.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const arr of arrays) { out.set(arr, off); off += arr.length }
  return out
}

/**
 * Scales the 3× render canvas down to printer dots, then sends as raster bitmap.
 */
export async function printCanvas(port: SerialPort, canvas: HTMLCanvasElement) {
  const ph = Math.round(canvas.height / SCALE)
  const out = document.createElement('canvas')
  out.width = PRINTER_W; out.height = ph
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, PRINTER_W, ph)
  ctx.drawImage(canvas, 0, 0, PRINTER_W, ph)
  const { data, widthBytes, height } = canvasToBitmap(out)
  await write(port, concat(CMD_INIT, CMD_ALIGN_LEFT, cmdRaster(data, widthBytes, height), CMD_FEED(4), CMD_LF))
}

export async function testPrint(port: SerialPort) {
  const enc = new TextEncoder()
  await write(port, concat(CMD_INIT, enc.encode('TEST IMPRESORA P1\n50x44mm OK\n\n\n'), CMD_FEED(3)))
}

// ── QR helper ─────────────────────────────────────────────────────────────
async function makeQR(url: string, size: number): Promise<HTMLCanvasElement> {
  const c = document.createElement('canvas')
  await QRCode.toCanvas(c, url, { width: size, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
  return c
}

// ── Text wrap helper ──────────────────────────────────────────────────────
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const t = line ? line + ' ' + w : w
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w } else line = t
  }
  if (line) lines.push(line)
  return lines
}

// ── Label data type ───────────────────────────────────────────────────────
export interface LabelData {
  nombre: string
  bodega: string
  varietal: string
  region: string
  categoria: string
  precio: string
  sku: string
  wooUrl?: string
}

// ─────────────────────────────────────────────────────────────────────────
// FORMAT 1 — CAVA  (gondola shelf label, full 50×44mm)
// Logical: 384×338 dots  |  Canvas: 1152×1014 px (SCALE=3)
//
// Layout con QR (wooUrl presente):
//   [0..6]     top black bar
//   [8..188]   QR 180×180 centrado (hero element, ~23mm)
//   [196..206] "Escaneá para ver ficha" 8px center
//   [210]      thin separator
//   [218..+]   NOMBRE bold 30px, hasta 2 líneas
//   [+18]      BODEGA bold 13px
//   [+14]      VARIETAL 11px (solo si 1 línea de nombre)
//   [326]      PRECIO 20px right + CATEGORÍA 9px left
//   [332..338] bottom black bar
//
// Layout sin QR:
//   [0..6]    top bar
//   [18..+]   NOMBRE bold 36px, hasta 2 líneas
//   [+22]     BODEGA bold 18px
//   [+16]     VARIETAL·REGION 13px
//   [268]     separator
//   [286]     CATEGORÍA 13px bold
//   [302]     SKU 10px dim
//   [326]     PRECIO 28px right
//   [332..338] bottom bar
// ─────────────────────────────────────────────────────────────────────────
export async function renderCava(canvas: HTMLCanvasElement, d: LabelData) {
  const LW = PRINTER_W, LH = PRINTER_H
  const W = LW * SCALE, H = LH * SCALE
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  const s = (n: number) => Math.round(n * SCALE)

  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H)
  const PAD = 14

  // ── Top bar ──
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, s(6))

  if (d.wooUrl) {
    // ── QR hero ──
    const QR_LOG = 180
    const qrX = Math.round((LW - QR_LOG) / 2)   // 102, centered
    const qrCanvas = await makeQR(d.wooUrl, s(QR_LOG))
    ctx.drawImage(qrCanvas, s(qrX), s(8), s(QR_LOG), s(QR_LOG))

    // "Escaneá" hint
    ctx.font = `${s(8)}px Arial`
    ctx.fillStyle = '#888'
    ctx.textAlign = 'center'
    ctx.fillText('Escaneá para ver la ficha completa', W / 2, s(196))
    ctx.textAlign = 'left'

    // Thin separator
    ctx.strokeStyle = '#ccc'; ctx.lineWidth = s(0.8)
    ctx.beginPath(); ctx.moveTo(s(PAD), s(206)); ctx.lineTo(s(LW - PAD), s(206)); ctx.stroke()

    // ── Nombre (grande) ──
    ctx.font = `bold ${s(30)}px Arial`
    ctx.fillStyle = '#000'
    const nameLines = wrapText(ctx, d.nombre, s(LW - PAD * 2)).slice(0, 2)
    const nameLineH = 34
    const nameBase = 218 + 30   // first baseline = 248
    nameLines.forEach((l, i) => ctx.fillText(l, s(PAD), s(nameBase + i * nameLineH)))
    const nameBottom = nameBase + (nameLines.length - 1) * nameLineH   // 248 or 282

    // ── Bodega ──
    const bodegaY = nameBottom + 18
    ctx.font = `bold ${s(13)}px Arial`
    ctx.fillStyle = '#222'
    ctx.fillText((d.bodega || '').toUpperCase(), s(PAD), s(bodegaY))

    // ── Varietal (solo si hay espacio = 1 línea de nombre) ──
    if (nameLines.length === 1 && d.varietal) {
      const sub = [d.varietal, d.region].filter(Boolean).join(' · ')
      ctx.font = `${s(11)}px Arial`
      ctx.fillStyle = '#666'
      ctx.fillText(sub, s(PAD), s(bodegaY + 14))
    }

    // ── Precio (pequeño, esquina inferior derecha) ──
    if (d.precio) {
      ctx.font = `bold ${s(20)}px Arial`
      ctx.fillStyle = '#000'
      ctx.textAlign = 'right'
      ctx.fillText(`$${Number(d.precio).toLocaleString('es-AR')}`, s(LW - PAD), s(326))
    }

    // ── Categoría + SKU (inferior izquierda, diminuto) ──
    ctx.textAlign = 'left'
    const metaLine = [d.categoria, d.sku ? `SKU ${d.sku}` : ''].filter(Boolean).join('  ·  ')
    if (metaLine) {
      ctx.font = `${s(9)}px Arial`
      ctx.fillStyle = '#999'
      ctx.fillText(metaLine.toUpperCase(), s(PAD), s(326))
    }

  } else {
    // ── Sin QR: nombre muy grande, ocupa la mitad superior ──
    ctx.font = `bold ${s(36)}px Arial`
    ctx.fillStyle = '#000'
    const nameLines = wrapText(ctx, d.nombre, s(LW - PAD * 2)).slice(0, 2)
    const nameLineH = 40
    const nameBase = 50
    nameLines.forEach((l, i) => ctx.fillText(l, s(PAD), s(nameBase + i * nameLineH)))
    const nameBottom = nameBase + (nameLines.length - 1) * nameLineH

    const bodegaY = nameBottom + 22
    ctx.font = `bold ${s(18)}px Arial`
    ctx.fillStyle = '#222'
    ctx.fillText((d.bodega || '').toUpperCase(), s(PAD), s(bodegaY))

    const sub = [d.varietal, d.region].filter(Boolean).join('  ·  ')
    if (sub) {
      ctx.font = `${s(13)}px Arial`; ctx.fillStyle = '#555'
      ctx.fillText(sub, s(PAD), s(bodegaY + 18))
    }

    ctx.strokeStyle = '#111'; ctx.lineWidth = s(1)
    ctx.beginPath(); ctx.moveTo(s(PAD), s(268)); ctx.lineTo(s(LW - PAD), s(268)); ctx.stroke()

    if (d.categoria) {
      ctx.font = `bold ${s(13)}px Arial`; ctx.fillStyle = '#000'
      ctx.fillText(d.categoria.toUpperCase(), s(PAD), s(286))
    }
    if (d.sku) {
      ctx.font = `${s(10)}px Arial`; ctx.fillStyle = '#888'
      ctx.fillText(`SKU ${d.sku}`, s(PAD), s(302))
    }
    if (d.precio) {
      ctx.font = `bold ${s(28)}px Arial`; ctx.fillStyle = '#000'; ctx.textAlign = 'right'
      ctx.fillText(`$${Number(d.precio).toLocaleString('es-AR')}`, s(LW - PAD), s(326))
    }
  }

  // ── Bottom bar ──
  ctx.fillStyle = '#000'
  ctx.fillRect(0, s(332), W, s(6))
}

// ─────────────────────────────────────────────────────────────────────────
// FORMAT 2 — PRECIO RÁPIDO  (full 50×44mm, price-focused)
// Logical: 384×338 dots  |  Canvas: 1152×1014 px
//
//   [0..6]    top black bar
//   [50]      name (bold 24px)
//   [72]      bodega · varietal (13px)
//   [90]      divider
//   [290]     BIG PRICE centered (70px bold)
//   [315]     category small
//   [332..338] bottom bar
// ─────────────────────────────────────────────────────────────────────────
export function renderPrecio(canvas: HTMLCanvasElement, d: LabelData) {
  const LW = PRINTER_W, LH = PRINTER_H
  const W = LW * SCALE, H = LH * SCALE
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  const s = (n: number) => Math.round(n * SCALE)

  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H)
  const PAD = 14

  // Top bar
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, s(6))

  // Name (1 line, truncate with ellipsis if too long)
  ctx.font = `bold ${s(24)}px Arial`
  ctx.fillStyle = '#000'; ctx.textAlign = 'left'
  const maxNW = s(LW - PAD * 2)
  let nombre = d.nombre
  while (nombre.length > 1 && ctx.measureText(nombre + '…').width > maxNW) nombre = nombre.slice(0, -1)
  if (nombre !== d.nombre) nombre += '…'
  ctx.fillText(nombre, s(PAD), s(50))

  // Bodega · varietal
  const sub2 = [d.bodega, d.varietal].filter(Boolean).join(' · ')
  if (sub2) {
    ctx.font = `${s(13)}px Arial`; ctx.fillStyle = '#444'
    ctx.fillText(sub2, s(PAD), s(72))
  }

  // Divider
  ctx.strokeStyle = '#bbb'; ctx.lineWidth = s(1)
  ctx.beginPath(); ctx.moveTo(s(PAD), s(90)); ctx.lineTo(s(LW - PAD), s(90)); ctx.stroke()

  // Big price
  if (d.precio) {
    ctx.font = `bold ${s(70)}px Arial`
    ctx.fillStyle = '#000'; ctx.textAlign = 'center'
    ctx.fillText(`$${Number(d.precio).toLocaleString('es-AR')}`, W / 2, s(290))
  }

  // Category small
  if (d.categoria) {
    ctx.font = `${s(11)}px Arial`; ctx.fillStyle = '#888'; ctx.textAlign = 'center'
    ctx.fillText((d.categoria).toUpperCase(), W / 2, s(315))
  }

  // Bottom bar
  ctx.fillStyle = '#000'; ctx.fillRect(0, s(332), W, s(6))
}

// ─────────────────────────────────────────────────────────────────────────
// FORMAT 3 — BOTELLA  (two 25×44mm stickers side-by-side on one 50×44mm label)
// Logical: 384×338  |  Canvas: 1152×1014 px
// Each half: 192 logical wide. Dashed cut line in center.
// ─────────────────────────────────────────────────────────────────────────
export async function renderBottle(canvas: HTMLCanvasElement, d: LabelData) {
  const LW = PRINTER_W, LH = PRINTER_H
  const W = LW * SCALE, H = LH * SCALE
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  const s = (n: number) => Math.round(n * SCALE)

  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H)

  const HW = LW / 2     // half-width logical = 192
  const PAD = 8
  const BAR = 6

  let qrCanvas: HTMLCanvasElement | null = null
  const QR_LOG = 86     // 86 dots ≈ 11.2mm — decent for close-range scan
  if (d.wooUrl) qrCanvas = await makeQR(d.wooUrl, s(QR_LOG))

  for (const xL of [0, HW]) {   // xL = logical x offset for left / right half
    // Border
    ctx.strokeStyle = '#000'; ctx.lineWidth = s(1.5)
    ctx.strokeRect(s(xL + 2), s(2), s(HW - 4), s(LH - 4))

    // Top bar
    ctx.fillStyle = '#000'
    ctx.fillRect(s(xL + 2), s(2), s(HW - 4), s(BAR))

    // Name
    ctx.font = `bold ${s(13)}px Arial`; ctx.fillStyle = '#000'; ctx.textAlign = 'left'
    const nl = wrapText(ctx, d.nombre, s(HW - PAD * 2 - 4)).slice(0, 3)
    const nlH = 15
    nl.forEach((l, i) => ctx.fillText(l, s(xL + PAD + 2), s(BAR + 4 + 13 + i * nlH)))
    const afterName = BAR + 4 + nl.length * nlH + 4

    // Bodega
    ctx.font = `bold ${s(10)}px Arial`; ctx.fillStyle = '#333'
    ctx.fillText((d.bodega || '').toUpperCase(), s(xL + PAD + 2), s(afterName + 10))

    // Varietal
    if (d.varietal) {
      ctx.font = `${s(9)}px Arial`; ctx.fillStyle = '#666'
      ctx.fillText(d.varietal, s(xL + PAD + 2), s(afterName + 22))
    }

    // QR centered
    if (qrCanvas) {
      const qrX = xL + (HW - QR_LOG) / 2
      const qrY = afterName + 30
      ctx.drawImage(qrCanvas, s(qrX), s(qrY), s(QR_LOG), s(QR_LOG))
    }

    // Price (bottom)
    if (d.precio) {
      ctx.font = `bold ${s(20)}px Arial`; ctx.fillStyle = '#000'; ctx.textAlign = 'center'
      ctx.fillText(`$${Number(d.precio).toLocaleString('es-AR')}`, s(xL + HW / 2), s(LH - 8))
    }
  }

  // Dashed cut line
  ctx.setLineDash([s(4), s(3)])
  ctx.strokeStyle = '#aaa'; ctx.lineWidth = s(0.8)
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
  ctx.setLineDash([])

  // Scissors
  ctx.font = `${s(12)}px Arial`; ctx.fillStyle = '#aaa'; ctx.textAlign = 'center'
  ctx.fillText('✂', W / 2, H / 2 + s(5))
}

// ── Render dispatcher ─────────────────────────────────────────────────────
export type LabelFormat = 'cava' | 'precio' | 'botella'

export async function renderLabel(canvas: HTMLCanvasElement, data: LabelData, format: LabelFormat) {
  if (format === 'cava')    return renderCava(canvas, data)
  if (format === 'precio')  return renderPrecio(canvas, data)
  if (format === 'botella') return renderBottle(canvas, data)
}
