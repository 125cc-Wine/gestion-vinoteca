/**
 * Label printer via Web Serial API (Bluetooth COM port).
 * Tested protocol: ESC/POS raster bitmap (common in Chinese thermal printers).
 * Printer: DeTong P1 — 50mm wide label, 203 DPI → 384 dots wide = 48 bytes/row.
 */

// Web Serial API types (not in default TS lib)
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

export const PRINTER_WIDTH_DOTS = 384  // 50mm @ 203dpi (try 576 if labels come out cut)
export const PRINTER_BYTES_PER_ROW = PRINTER_WIDTH_DOTS / 8  // 48

// ── ESC/POS command bytes ──────────────────────────────────────────────────
const ESC = 0x1b
const GS  = 0x1d

const CMD_INIT        = new Uint8Array([ESC, 0x40])
const CMD_ALIGN_LEFT  = new Uint8Array([ESC, 0x61, 0x00])
const CMD_FEED_LINES  = (n: number) => new Uint8Array([ESC, 0x64, n])
const CMD_LINE_FEED   = new Uint8Array([0x0a])

/** GS v 0 — print raster bitmap */
function cmdRasterImage(imgData: Uint8Array, widthBytes: number, heightLines: number): Uint8Array {
  const xL = widthBytes & 0xff
  const xH = (widthBytes >> 8) & 0xff
  const yL = heightLines & 0xff
  const yH = (heightLines >> 8) & 0xff
  const header = new Uint8Array([GS, 0x76, 0x30, 0x00, xL, xH, yL, yH])
  const out = new Uint8Array(header.length + imgData.length)
  out.set(header, 0)
  out.set(imgData, header.length)
  return out
}

// ── Canvas → 1-bit bitmap ─────────────────────────────────────────────────
export function canvasToBitmap(canvas: HTMLCanvasElement): { data: Uint8Array; widthBytes: number; height: number } {
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data

  const widthBytes = Math.ceil(width / 8)
  const bitmap = new Uint8Array(widthBytes * height)

  for (let y = 0; y < height; y++) {
    for (let byteX = 0; byteX < widthBytes; byteX++) {
      let byte = 0
      for (let bit = 0; bit < 8; bit++) {
        const x = byteX * 8 + bit
        if (x < width) {
          const idx = (y * width + x) * 4
          const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2]
          // dark pixel (threshold 128) = print dot
          if ((r * 0.299 + g * 0.587 + b * 0.114) < 128) {
            byte |= (0x80 >> bit)
          }
        }
      }
      bitmap[y * widthBytes + byteX] = byte
    }
  }

  return { data: bitmap, widthBytes, height }
}

// ── Serial port helpers ───────────────────────────────────────────────────
export async function connectPrinter(): Promise<SerialPort> {
  if (!('serial' in navigator)) {
    throw new Error('Web Serial no está disponible. Usá Chrome o Edge.')
  }
  const port = await (navigator as Navigator & { serial: { requestPort: () => Promise<SerialPort> } }).serial.requestPort()
  // Try 9600 first (most BT printers). If no output try 115200.
  await port.open({ baudRate: 9600 })
  return port
}

export async function disconnectPrinter(port: SerialPort) {
  try { await port.close() } catch { /* ignore */ }
}

async function writeToPort(port: SerialPort, data: Uint8Array) {
  const writer = port.writable!.getWriter()
  try {
    await writer.write(data)
  } finally {
    writer.releaseLock()
  }
}

// ── Public print function ─────────────────────────────────────────────────
export async function printCanvas(port: SerialPort, canvas: HTMLCanvasElement) {
  const { data, widthBytes, height } = canvasToBitmap(canvas)

  const chunks = [
    CMD_INIT,
    CMD_ALIGN_LEFT,
    cmdRasterImage(data, widthBytes, height),
    CMD_FEED_LINES(4),
    CMD_LINE_FEED,
  ]

  const totalLen = chunks.reduce((a, c) => a + c.length, 0)
  const payload = new Uint8Array(totalLen)
  let offset = 0
  for (let i = 0; i < chunks.length; i++) {
    payload.set(chunks[i], offset)
    offset += chunks[i].length
  }

  await writeToPort(port, payload)
}

/** Send a plain text test to verify the COM port is the right one */
export async function testPrint(port: SerialPort) {
  const enc = new TextEncoder()
  const text = enc.encode('TEST IMPRESORA P1\n\n\n')
  const chunks = [CMD_INIT, text, CMD_FEED_LINES(3)]
  const totalLen = chunks.reduce((a, c) => a + c.length, 0)
  const payload = new Uint8Array(totalLen)
  let off = 0
  for (let i = 0; i < chunks.length; i++) { payload.set(chunks[i], off); off += chunks[i].length }
  await writeToPort(port, payload)
}
