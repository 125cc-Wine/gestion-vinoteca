/**
 * Label printer — Web Serial API (Bluetooth COM port) + ESC/POS raster bitmap.
 * Printer: DeTong P1, 50mm wide, 203 DPI → 384 dots = 48 bytes/row.
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
export const PRINTER_W = 384          // dots wide (50mm @ 203dpi)
export const PRINTER_BYTES = PRINTER_W / 8   // 48 bytes/row
// Legacy export name kept for compatibility
export const PRINTER_WIDTH_DOTS = PRINTER_W

// ── ESC/POS commands ──────────────────────────────────────────────────────
const ESC = 0x1b, GS = 0x1d
const CMD_INIT       = new Uint8Array([ESC, 0x40])
const CMD_ALIGN_LEFT = new Uint8Array([ESC, 0x61, 0x00])
const CMD_FEED       = (n: number) => new Uint8Array([ESC, 0x64, n])
const CMD_LF         = new Uint8Array([0x0a])

function cmdRaster(imgData: Uint8Array, wBytes: number, h: number): Uint8Array {
  const hdr = new Uint8Array([GS, 0x76, 0x30, 0x00, wBytes & 0xff, (wBytes >> 8) & 0xff, h & 0xff, (h >> 8) & 0xff])
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
          if (px[i] * 0.299 + px[i+1] * 0.587 + px[i+2] * 0.114 < 128) byte |= 0x80 >> bit
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
  for (let i = 0; i < arrays.length; i++) { out.set(arrays[i], off); off += arrays[i].length }
  return out
}

export async function printCanvas(port: SerialPort, canvas: HTMLCanvasElement) {
  const { data, widthBytes, height } = canvasToBitmap(canvas)
  await write(port, concat(CMD_INIT, CMD_ALIGN_LEFT, cmdRaster(data, widthBytes, height), CMD_FEED(4), CMD_LF))
}

export async function testPrint(port: SerialPort) {
  const enc = new TextEncoder()
  await write(port, concat(CMD_INIT, enc.encode('TEST IMPRESORA P1\n\n\n'), CMD_FEED(3)))
}

// ── QR helper ─────────────────────────────────────────────────────────────
async function makeQR(url: string, size: number): Promise<HTMLCanvasElement> {
  const c = document.createElement('canvas')
  await QRCode.toCanvas(c, url, { width: size, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
  return c
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
  wooUrl?: string   // full URL for QR; omit to skip QR
}

// ─────────────────────────────────────────────────────────────────────────
// FORMAT 1 — CAVA  (gondola shelf label, 50mm × ~45mm, with QR)
// 384 × 344 dots
// ─────────────────────────────────────────────────────────────────────────
export async function renderCava(canvas: HTMLCanvasElement, d: LabelData) {
  const W = PRINTER_W, H = 344
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H)

  const PAD = 14
  const QR_SIZE = 100
  const textW = d.wooUrl ? W - PAD * 2 - QR_SIZE - 8 : W - PAD * 2

  // ── Top accent bar ──
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, 6)

  // ── Nombre ──
  ctx.fillStyle = '#000'
  ctx.font = 'bold 30px Arial'
  ctx.textAlign = 'left'
  const words = d.nombre.split(' ')
  let line = ''; const nameLines: string[] = []
  for (const w of words) {
    const t = line ? line + ' ' + w : w
    if (ctx.measureText(t).width > textW) { nameLines.push(line); line = w } else line = t
  }
  nameLines.push(line)
  nameLines.slice(0, 2).forEach((l, i) => ctx.fillText(l, PAD, 44 + i * 33))

  // ── Bodega ──
  const yAfterNombre = nameLines.length > 1 ? 118 : 86
  ctx.font = 'bold 17px Arial'
  ctx.fillStyle = '#222'
  ctx.fillText((d.bodega || '').toUpperCase(), PAD, yAfterNombre)

  // ── Varietal · Región ──
  const sub = [d.varietal, d.region].filter(Boolean).join('  ·  ')
  ctx.font = '15px Arial'
  ctx.fillStyle = '#555'
  ctx.fillText(sub, PAD, yAfterNombre + 22)

  // ── QR code ──
  if (d.wooUrl) {
    const qr = await makeQR(d.wooUrl, QR_SIZE)
    ctx.drawImage(qr, W - PAD - QR_SIZE, 14, QR_SIZE, QR_SIZE)
    ctx.font = '9px Arial'
    ctx.fillStyle = '#888'
    ctx.textAlign = 'center'
    ctx.fillText('Ver ficha', W - PAD - QR_SIZE / 2, 14 + QR_SIZE + 11)
    ctx.textAlign = 'left'
  }

  // ── Separator line ──
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(PAD, H - 62); ctx.lineTo(W - PAD, H - 62); ctx.stroke()

  // ── Categoría badge ──
  ctx.font = 'bold 13px Arial'
  ctx.fillStyle = '#000'
  const cat = (d.categoria || '').toUpperCase()
  ctx.fillText(cat, PAD, H - 36)

  // ── SKU small ──
  if (d.sku) {
    ctx.font = '11px Arial'
    ctx.fillStyle = '#888'
    ctx.fillText(`SKU ${d.sku}`, PAD, H - 18)
  }

  // ── Price ──
  if (d.precio) {
    const priceStr = `$${Number(d.precio).toLocaleString('es-AR')}`
    ctx.font = 'bold 38px Arial'
    ctx.fillStyle = '#000'
    ctx.textAlign = 'right'
    ctx.fillText(priceStr, W - PAD, H - 14)
  }

  // ── Bottom accent bar ──
  ctx.fillStyle = '#000'
  ctx.fillRect(0, H - 5, W, 5)
}

// ─────────────────────────────────────────────────────────────────────────
// FORMAT 2 — PRECIO RÁPIDO  (price tag, 50mm × ~25mm)
// 384 × 190 dots
// ─────────────────────────────────────────────────────────────────────────
export function renderPrecio(canvas: HTMLCanvasElement, d: LabelData) {
  const W = PRINTER_W, H = 190
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H)
  const PAD = 12

  // Thick top bar
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, 8)

  // Nombre — wrap if needed
  ctx.font = 'bold 24px Arial'
  ctx.fillStyle = '#000'
  ctx.textAlign = 'left'
  const words = d.nombre.split(' ')
  let line = ''; const nameLines: string[] = []
  for (const w of words) {
    const t = line ? line + ' ' + w : w
    if (ctx.measureText(t).width > W - PAD * 2) { nameLines.push(line); line = w } else line = t
  }
  nameLines.push(line)
  nameLines.slice(0, 1).forEach(l => ctx.fillText(l, PAD, 42))

  // Bodega · Varietal
  ctx.font = '14px Arial'
  ctx.fillStyle = '#444'
  ctx.fillText([d.bodega, d.varietal].filter(Boolean).join(' · '), PAD, 62)

  // Divider
  ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, 74); ctx.lineTo(W - PAD, 74); ctx.stroke()

  // Price — big
  if (d.precio) {
    ctx.font = 'bold 52px Arial'
    ctx.fillStyle = '#000'
    ctx.textAlign = 'center'
    ctx.fillText(`$${Number(d.precio).toLocaleString('es-AR')}`, W / 2, H - 16)
  }

  ctx.fillStyle = '#000'
  ctx.fillRect(0, H - 6, W, 6)
}

// ─────────────────────────────────────────────────────────────────────────
// FORMAT 3 — BOTELLA  (bottle sticker, half-width 192px × 300px, prints 2-up)
// We render at full width but split in half visually with a dashed center line
// so the user can cut two stickers from one label.
// ─────────────────────────────────────────────────────────────────────────
export async function renderBottle(canvas: HTMLCanvasElement, d: LabelData) {
  const W = PRINTER_W, H = 300
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H)

  // Draw same label content in left half and right half (2-up)
  for (const xOff of [0, W / 2]) {
    const hw = W / 2   // 192px
    const PAD = 8

    // Border
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5
    ctx.strokeRect(xOff + 2, 2, hw - 4, H - 4)

    // Top bar
    ctx.fillStyle = '#000'
    ctx.fillRect(xOff + 2, 2, hw - 4, 6)

    // Nombre
    ctx.font = 'bold 16px Arial'; ctx.fillStyle = '#000'; ctx.textAlign = 'left'
    const words = d.nombre.split(' ')
    let line = ''; const nl: string[] = []
    for (const w of words) {
      const t = line ? line + ' ' + w : w
      if (ctx.measureText(t).width > hw - PAD * 2 - 4) { nl.push(line); line = w } else line = t
    }
    nl.push(line)
    nl.slice(0, 3).forEach((l, i) => ctx.fillText(l, xOff + PAD + 2, 28 + i * 19))

    const yAfter = 28 + Math.min(nl.length, 3) * 19

    // Bodega
    ctx.font = 'bold 12px Arial'; ctx.fillStyle = '#333'
    ctx.fillText((d.bodega || '').toUpperCase(), xOff + PAD + 2, yAfter + 4)

    // Varietal
    ctx.font = '11px Arial'; ctx.fillStyle = '#666'
    ctx.fillText(d.varietal || '', xOff + PAD + 2, yAfter + 18)

    // QR
    if (d.wooUrl) {
      const qrSize = 72
      const qr = await makeQR(d.wooUrl, qrSize)
      ctx.drawImage(qr, xOff + (hw - qrSize) / 2, yAfter + 26, qrSize, qrSize)
    }

    // Price
    if (d.precio) {
      ctx.font = 'bold 22px Arial'; ctx.fillStyle = '#000'; ctx.textAlign = 'center'
      ctx.fillText(`$${Number(d.precio).toLocaleString('es-AR')}`, xOff + hw / 2, H - 10)
    }
  }

  // Dashed cut line in center
  ctx.setLineDash([4, 3])
  ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
  ctx.setLineDash([])

  // Scissors icon hint
  ctx.font = '12px Arial'; ctx.fillStyle = '#bbb'; ctx.textAlign = 'center'
  ctx.fillText('✂', W / 2, H / 2)
}

// ── Render dispatcher ─────────────────────────────────────────────────────
export type LabelFormat = 'cava' | 'precio' | 'botella'

export async function renderLabel(canvas: HTMLCanvasElement, data: LabelData, format: LabelFormat) {
  if (format === 'cava')    return renderCava(canvas, data)
  if (format === 'precio')  return renderPrecio(canvas, data)
  if (format === 'botella') return renderBottle(canvas, data)
}
