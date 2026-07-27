// Consulta los puntos de venta habilitados para Web Services (WSFE) de una
// empresa, usando directamente el certificado ya emitido por AFIP — sin
// necesidad de entrar al portal (útil cuando no tenés Clave Fiscal propia
// de la empresa, solo el cert/key que te delegaron/generaron).
//
// Uso: node scripts/afip-check-pto-vta.mjs lavid
//      node scripts/afip-check-pto-vta.mjs aroma

import forge from 'node-forge'
import https from 'https'
import { readFileSync } from 'fs'

const empresa = process.argv[2]
if (!empresa) {
  console.error('Uso: node scripts/afip-check-pto-vta.mjs <aroma|lavid>')
  process.exit(1)
}

const CUIT = { aroma: '20266009845', lavid: '30717621448' }[empresa]
if (!CUIT) {
  console.error(`Empresa desconocida: ${empresa}`)
  process.exit(1)
}

const certPem = readFileSync(`afip-certs/${empresa}.crt`, 'utf8')
const keyPem  = readFileSync(`afip-certs/${empresa}.key`, 'utf8')

const legacyAgent = new https.Agent({ ciphers: 'DEFAULT@SECLEVEL=1' })

function soapPost(url, soapAction, body) {
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
      res.on('data', c => (data += c))
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function buildTRA() {
  const now = new Date()
  const gen = new Date(now.getTime() - 10 * 60 * 1000)
  const exp = new Date(now.getTime() + 10 * 60 * 60 * 1000)
  const fmt = d => new Date(d.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 19) + '-03:00'
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

function signTRA(tra) {
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

async function getTA() {
  const tra = buildTRA()
  const cms = signTRA(tra)
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:log="http://wsaa.view.sua.dvadac.desein.afip.gov">
  <soapenv:Body><log:loginCms><log:in0>${cms}</log:in0></log:loginCms></soapenv:Body>
</soapenv:Envelope>`
  const raw = await soapPost('https://wsaa.afip.gov.ar/ws/services/LoginCms', '', body)
  const xml = raw.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
  const token = xml.match(/<token>([\s\S]*?)<\/token>/)?.[1]?.trim()
  const sign = xml.match(/<sign>([\s\S]*?)<\/sign>/)?.[1]?.trim()
  if (!token) throw new Error('WSAA error: ' + xml.slice(0, 800))
  return { token, sign }
}

async function main() {
  const { token, sign } = await getTA()
  console.log(`✓ TA obtenido para ${empresa} (CUIT ${CUIT})`)

  const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soap:Body>
    <ar:FEParamGetPtosVenta>
      <ar:Auth>
        <ar:Token>${token}</ar:Token>
        <ar:Sign>${sign}</ar:Sign>
        <ar:Cuit>${CUIT}</ar:Cuit>
      </ar:Auth>
    </ar:FEParamGetPtosVenta>
  </soap:Body>
</soap:Envelope>`

  const xml = await soapPost(
    'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
    'http://ar.gov.afip.dif.FEV1/FEParamGetPtosVenta',
    body
  )

  const items = [...xml.matchAll(/<PtoVenta>([\s\S]*?)<\/PtoVenta>/g)].map(m => m[1])
  if (!items.length) {
    console.log('Sin puntos de venta para Web Services, o error. Respuesta cruda:')
    console.log(xml)
    return
  }
  for (const item of items) {
    const nro = item.match(/<Nro>(\d+)<\/Nro>/)?.[1]
    const bloqueado = item.match(/<Bloqueado>(\w+)<\/Bloqueado>/)?.[1]
    const emisionTipo = item.match(/<EmisionTipo>(\w+)<\/EmisionTipo>/)?.[1]
    console.log(`  Pto Vta ${nro} — EmisionTipo: ${emisionTipo} — Bloqueado: ${bloqueado}`)
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1) })
