export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.WOOCOMMERCE_URL
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET

  const info = {
    url_configurada: url ? url.substring(0, 30) + '...' : '❌ NO CONFIGURADA',
    key_configurada: key ? `✓ (empieza con: ${key.substring(0, 8)}...)` : '❌ NO CONFIGURADA',
    secret_configurada: secret ? `✓ (empieza con: ${secret.substring(0, 8)}...)` : '❌ NO CONFIGURADA',
    endpoint_probado: '',
    status_http: 0,
    respuesta: '',
    error: '',
  }

  if (!url || !key || !secret) {
    return NextResponse.json({ ...info, error: 'Faltan variables de entorno' })
  }

  const testUrl = `${url}/wp-json/wc/v3/system_status?consumer_key=${key}&consumer_secret=${secret}`
  info.endpoint_probado = `${url}/wp-json/wc/v3/system_status?consumer_key=${key.substring(0, 8)}...`

  try {
    const res = await fetch(testUrl, { cache: 'no-store' })
    info.status_http = res.status
    const text = await res.text()
    info.respuesta = text.substring(0, 300)
  } catch (e) {
    info.error = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(info)
}
