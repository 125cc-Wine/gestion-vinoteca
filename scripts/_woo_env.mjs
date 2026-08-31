// Helper: carga credenciales WooCommerce desde .env.local (no se commitea el valor, solo se usa en runtime)
import fs from 'fs'
import path from 'path'

export function loadWooEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) {
      const [, key, val] = m
      if (!(key in process.env)) process.env[key] = val.trim()
    }
  }
  const url = process.env.WOOCOMMERCE_URL
  const ck = process.env.WOOCOMMERCE_CONSUMER_KEY
  const cs = process.env.WOOCOMMERCE_CONSUMER_SECRET
  if (!url || !ck || !cs) throw new Error('Faltan credenciales WooCommerce en .env.local')
  const authHeader = 'Basic ' + Buffer.from(`${ck}:${cs}`).toString('base64')
  return { url: url.replace(/\/$/, ''), ck, cs, authHeader }
}
