import { getTA } from './wsaa'
import { soapPost } from './soapClient'

const WSFE_URL = {
  homo: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
  prod: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
}

function env() { return (process.env.AFIP_ENV || 'homo') as 'homo' | 'prod' }

// AFIP valida que la fecha del comprobante no sea "futura" respecto a su
// reloj. Si el servidor calcula el día en UTC (Vercel, cualquier hosting),
// entre las 21:00 y las 00:00 hora Argentina "hoy" ya es el día siguiente en
// UTC, y el comprobante sale con fecha de mañana -> error 10016. Siempre hay
// que calcular la fecha en el huso horario de Argentina, nunca en UTC.
function fechaHoyArgentina(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  return fmt.format(new Date()).replace(/-/g, '')
}

function cuit(empresa: string) {
  const key = empresa === 'aroma' ? 'AFIP_CUIT_AROMA' : 'AFIP_CUIT_LAVID'
  const v = process.env[key]
  if (!v) throw new Error(`Falta ${key} en .env`)
  return v.replace(/-/g, '')
}

function ptoVta(empresa: string): number {
  const key = empresa === 'aroma' ? 'AFIP_PTO_VTA_AROMA' : 'AFIP_PTO_VTA_LAVID'
  return parseInt(process.env[key] || '1')
}

async function callSOAP(empresa: string, action: string, innerXml: string): Promise<string> {
  const url = WSFE_URL[env()]
  const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soap:Body>${innerXml}</soap:Body>
</soap:Envelope>`
  return soapPost(url, `http://ar.gov.afip.dif.FEV1/${action}`, body)
}

export async function ultimoNroAutorizado(empresa: string, cbteTipo: number): Promise<number> {
  const { token, sign } = await getTA(empresa)
  const xml = await callSOAP(empresa, 'FECompUltimoAutorizado', `
    <ar:FECompUltimoAutorizado>
      <ar:Auth>
        <ar:Token>${token}</ar:Token>
        <ar:Sign>${sign}</ar:Sign>
        <ar:Cuit>${cuit(empresa)}</ar:Cuit>
      </ar:Auth>
      <ar:PtoVta>${ptoVta(empresa)}</ar:PtoVta>
      <ar:CbteTipo>${cbteTipo}</ar:CbteTipo>
    </ar:FECompUltimoAutorizado>`)

  const nro = xml.match(/<CbteNro>(\d+)<\/CbteNro>/)?.[1]
  return parseInt(nro || '0')
}

export interface FacturaInput {
  empresa: string
  cbteTipo: number      // 1=Fact.A, 6=Fact.B
  docTipo: number       // 80=CUIT, 96=DNI, 99=CF sin doc
  docNro: string        // CUIT/DNI del cliente (o '0' para CF)
  importeNeto: number
  importeIVA: number
  importeTotal: number
  alicuotaIVA?: number  // 21 (default) o 10.5
  // Obligatorio desde RG 5616 (AFIP rechaza sin esto a partir del 01/09/2026).
  // 1=RI, 4=Exento, 5=Consumidor Final, 6=Monotributista, etc.
  condicionIVAReceptorId?: number
  // Para Notas de Crédito/Débito: referencia al comprobante que anulan/ajustan.
  comprobanteAsociado?: { tipo: number; ptoVta: number; nro: number }
}

export interface FacturaResult {
  cae: string
  caeVto: string
  nroFactura: number
  ptoVta: number
  cbteTipo: number
}

export async function solicitarCAE(input: FacturaInput): Promise<FacturaResult> {
  const { empresa, cbteTipo, docTipo, docNro, importeNeto, importeIVA, importeTotal } = input
  const alicId = (input.alicuotaIVA ?? 21) === 10.5 ? 4 : 5  // 4=10.5%, 5=21%
  // Sin dato explícito: docTipo 99 (CF sin doc) => Consumidor Final (5).
  // Con CUIT/DNI informado asumimos Responsable Inscripto (1) salvo que se pase explícito.
  const condIVA = input.condicionIVAReceptorId ?? (docTipo === 99 ? 5 : 1)

  const { token, sign } = await getTA(empresa)
  const pta = ptoVta(empresa)
  const nroSig = (await ultimoNroAutorizado(empresa, cbteTipo)) + 1
  const hoy = fechaHoyArgentina()

  // Factura B a CF: IVA va incluido en neto, sin discriminar
  // Factura A: IVA discriminado obligatorio
  const ivaXml = cbteTipo !== 11 ? `
      <ar:Iva>
        <ar:AlicIva>
          <ar:Id>${alicId}</ar:Id>
          <ar:BaseImp>${importeNeto.toFixed(2)}</ar:BaseImp>
          <ar:Importe>${importeIVA.toFixed(2)}</ar:Importe>
        </ar:AlicIva>
      </ar:Iva>` : ''

  const asoc = input.comprobanteAsociado
  const asocXml = asoc ? `
      <ar:CbtesAsoc>
        <ar:CbteAsoc>
          <ar:Tipo>${asoc.tipo}</ar:Tipo>
          <ar:PtoVta>${asoc.ptoVta}</ar:PtoVta>
          <ar:Nro>${asoc.nro}</ar:Nro>
        </ar:CbteAsoc>
      </ar:CbtesAsoc>` : ''

  const xml = await callSOAP(empresa, 'FECAESolicitar', `
    <ar:FECAESolicitar>
      <ar:Auth>
        <ar:Token>${token}</ar:Token>
        <ar:Sign>${sign}</ar:Sign>
        <ar:Cuit>${cuit(empresa)}</ar:Cuit>
      </ar:Auth>
      <ar:FeCAEReq>
        <ar:FeCabReq>
          <ar:CantReg>1</ar:CantReg>
          <ar:PtoVta>${pta}</ar:PtoVta>
          <ar:CbteTipo>${cbteTipo}</ar:CbteTipo>
        </ar:FeCabReq>
        <ar:FeDetReq>
          <ar:FECAEDetRequest>
            <ar:Concepto>1</ar:Concepto>
            <ar:DocTipo>${docTipo}</ar:DocTipo>
            <ar:DocNro>${docNro}</ar:DocNro>
            <ar:CbteDesde>${nroSig}</ar:CbteDesde>
            <ar:CbteHasta>${nroSig}</ar:CbteHasta>
            <ar:CbteFch>${hoy}</ar:CbteFch>
            <ar:ImpTotal>${importeTotal.toFixed(2)}</ar:ImpTotal>
            <ar:ImpTotConc>0.00</ar:ImpTotConc>
            <ar:ImpNeto>${importeNeto.toFixed(2)}</ar:ImpNeto>
            <ar:ImpOpEx>0.00</ar:ImpOpEx>
            <ar:ImpIVA>${importeIVA.toFixed(2)}</ar:ImpIVA>
            <ar:ImpTrib>0.00</ar:ImpTrib>
            <ar:MonId>PES</ar:MonId>
            <ar:MonCotiz>1</ar:MonCotiz>
            <ar:CondicionIVAReceptorId>${condIVA}</ar:CondicionIVAReceptorId>
            ${asocXml}
            ${ivaXml}
          </ar:FECAEDetRequest>
        </ar:FeDetReq>
      </ar:FeCAEReq>
    </ar:FECAESolicitar>`)

  const cae    = xml.match(/<CAE>([\s\S]*?)<\/CAE>/)?.[1]?.trim() || ''
  const caeVto = xml.match(/<CAEFchVto>([\s\S]*?)<\/CAEFchVto>/)?.[1]?.trim() || ''
  const errMsg = xml.match(/<Msg>([\s\S]*?)<\/Msg>/)?.[1]?.trim()

  if (!cae) throw new Error(errMsg || 'WSFE no devolvió CAE. Respuesta: ' + xml.slice(0, 600))

  return { cae, caeVto, nroFactura: nroSig, ptoVta: pta, cbteTipo }
}
