import https from 'https'

// Los web services de AFIP (WSAA y WSFEv1) todavía negocian TLS con
// parámetros Diffie-Hellman de tamaño chico. OpenSSL moderno (el que usa
// Node 18+) los rechaza por defecto ("dh key too small" / Logjam) — el
// fetch global de Next.js falla directo con ese comprobante, aunque el
// servidor esté perfectamente accesible (curl lo prueba). Bajamos el nivel
// de seguridad TLS SOLO para este agente, no para el resto de la app
// (Supabase, WooCommerce siguen con la configuración normal).
const legacyAgent = new https.Agent({ ciphers: 'DEFAULT@SECLEVEL=1' })

export function soapPost(url: string, soapAction: string, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      agent: legacyAgent,
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        SOAPAction: soapAction,
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = ''
      res.setEncoding('utf8')
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}
