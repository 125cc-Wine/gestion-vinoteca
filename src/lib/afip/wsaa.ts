import forge from 'node-forge'
import { supabase } from '@/lib/supabase'
import { soapPost } from './soapClient'

const WSAA_URL = {
  homo: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
  prod: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
}

function buildTRA(): string {
  const now = new Date()
  // Margen de 10 min hacia atrás en generationTime: WSAA es estricto con el
  // reloj y un pequeño desfase (el nuestro levemente adelantado respecto al
  // de AFIP, latencia de red) alcanza para que rechace el TRA como "en el
  // futuro". Es la defensa estándar contra ese desfase, no afecta la validez
  // real del ticket (igual expira a las 10hs de expirationTime).
  const gen = new Date(now.getTime() - 10 * 60 * 1000)
  const exp = new Date(now.getTime() + 10 * 60 * 60 * 1000)
  const fmt = (d: Date) => {
    const s = new Date(d.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 19)
    return s + '-03:00'
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Math.floor(Date.now() / 1000)}</uniqueId>
    <generationTime>${fmt(gen)}</generationTime>
    <expirationTime>${fmt(exp)}</expirationTime>
  </header>
  <service>wsfe</service>
</loginTicketRequest>`
}

function signTRA(tra: string, certPem: string, keyPem: string): string {
  const p7 = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(tra, 'utf8')
  p7.addCertificate(certPem)
  p7.addSigner({
    key: forge.pki.privateKeyFromPem(keyPem),
    certificate: forge.pki.certificateFromPem(certPem),
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [],
  })
  p7.sign({ detached: false })
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes()
  return Buffer.from(der, 'binary').toString('base64')
}

export async function getTA(empresa: string): Promise<{ token: string; sign: string }> {
  // Intentar leer token cacheado — si la tabla no existe, continuar igual
  try {
    const { data: cached } = await supabase
      .from('afip_tokens')
      .select('token, sign, expiration')
      .eq('empresa', empresa)
      .single()

    if (cached?.token && new Date(cached.expiration) > new Date(Date.now() + 5 * 60 * 1000)) {
      return { token: cached.token, sign: cached.sign }
    }
  } catch {
    // tabla no existe o error de conexión — generar TA de todas formas
  }

  const suffix = empresa === 'aroma' ? 'AROMA' : 'LAVID'
  const certPem = (process.env[`AFIP_CERT_${suffix}`] || '').replace(/\\n/g, '\n')
  const keyPem  = (process.env[`AFIP_KEY_${suffix}`]  || '').replace(/\\n/g, '\n')

  if (!certPem || !keyPem) throw new Error(`Faltan credenciales AFIP para ${empresa} (AFIP_CERT_${suffix} / AFIP_KEY_${suffix})`)

  const tra = buildTRA()
  const cms = signTRA(tra, certPem, keyPem)
  const env = (process.env.AFIP_ENV || 'homo') as 'homo' | 'prod'

  const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:log="http://wsaa.view.sua.dvadac.desein.afip.gov">
  <soapenv:Body>
    <log:loginCms><log:in0>${cms}</log:in0></log:loginCms>
  </soapenv:Body>
</soapenv:Envelope>`

  const raw = await soapPost(WSAA_URL[env], '', soapBody)
  // El loginTicketResponse viaja como XML "escapado" (&lt;token&gt;...&lt;/token&gt;)
  // dentro de <loginCmsReturn>, no como XML anidado literal. Sin desescapar,
  // el regex nunca matchea aunque el login haya sido exitoso.
  const xml = raw
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

  const token = xml.match(/<token>([\s\S]*?)<\/token>/)?.[1]?.trim() || ''
  const sign  = xml.match(/<sign>([\s\S]*?)<\/sign>/)?.[1]?.trim()  || ''

  if (!token) throw new Error('WSAA error: ' + xml.slice(0, 500))

  // Cachear — ignorar error si la tabla todavía no existe
  try {
    // Ojo: reemplazar el sufijo "-03:00" por "Z" a lo bruto NO convierte la
    // hora (dejaba el timestamp cacheado 3hs adelantado respecto al real).
    // new Date() ya interpreta el offset ISO-8601 correctamente solo.
    const expirStr = tra.match(/<expirationTime>(.*?)<\/expirationTime>/)?.[1] || ''
    const expirDate = new Date(expirStr).toISOString()
    await supabase.from('afip_tokens').upsert(
      { empresa, token, sign, expiration: expirDate, updated_at: new Date().toISOString() },
      { onConflict: 'empresa' }
    )
  } catch {
    // sin caché, se pedirá un TA nuevo en cada llamada — aceptable
  }

  return { token, sign }
}
