import 'server-only'
import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { db } from './db'

export const COOKIE = 'portal_s'
// "Recordarme" (por defecto): un año en este dispositivo. Sin recordar: la
// cookie se borra al cerrar el navegador y la sesión no pasa de 12 horas.
const DURACION_MS = 365 * 24 * 60 * 60 * 1000
const DURACION_CORTA_MS = 12 * 60 * 60 * 1000

function secreto() {
  const s = process.env.PORTAL_SESSION_SECRET
  if (!s || s.length < 32) throw new Error('Falta PORTAL_SESSION_SECRET')
  return s
}

// Huella del link: si desde gestión se regenera o revoca el acceso, el token
// cambia y todas las sesiones abiertas con el link viejo dejan de valer.
export function huellaToken(token: string) {
  return createHash('sha256').update(token).digest('base64url').slice(0, 16)
}

function firmar(datos: string) {
  return createHmac('sha256', secreto()).update(datos).digest('base64url')
}

// verificado: entró con su link personal + PIN (no solo con el CUIT). Solo
// así ve "Mi cuenta" (saldo, movimientos, comprobantes).
export function crearSesion(clienteId: string, token: string, recordar = true, verificado = false) {
  const dur = recordar ? DURACION_MS : DURACION_CORTA_MS
  const datos = Buffer.from(JSON.stringify({ c: clienteId, t: huellaToken(token), e: Date.now() + dur, ...(verificado ? { v: 1 } : {}) })).toString('base64url')
  return { valor: `${datos}.${firmar(datos)}`, maxAge: recordar ? dur / 1000 : undefined }
}

// Sesión de administración: se entra desde gestión con un pase de un solo
// uso. Puede ser "como un cliente" (c) o "vista previa" de una empresa (p,
// sin cliente: se ve el catálogo con el descuento general pero no se pueden
// enviar pedidos). No depende del link ni del PIN del cliente y dura poco.
const DURACION_ADMIN_MS = 8 * 60 * 60 * 1000
export function crearSesionAdmin(destino: { cliente_id?: string | null; empresa?: string | null }) {
  const datos = Buffer.from(JSON.stringify({
    c: destino.cliente_id || undefined,
    p: destino.cliente_id ? undefined : (destino.empresa === 'lavid' ? 'lavid' : 'aroma'),
    a: 1, e: Date.now() + DURACION_ADMIN_MS,
  })).toString('base64url')
  return { valor: `${datos}.${firmar(datos)}`, maxAge: DURACION_ADMIN_MS / 1000 }
}

// Sesión de vendedor de calle (vd): entra con su link + PIN y atiende a sus
// clientes. El cliente que está atendiendo va en otra cookie (COOKIE_VC) y
// siempre se valida contra la base que sea suyo.
export const COOKIE_VC = 'portal_vc'
export function crearSesionVendedor(vendedorId: string, token: string, recordar = true) {
  const dur = recordar ? DURACION_MS : DURACION_CORTA_MS
  const datos = Buffer.from(JSON.stringify({ vd: vendedorId, t: huellaToken(token), e: Date.now() + dur })).toString('base64url')
  return { valor: `${datos}.${firmar(datos)}`, maxAge: recordar ? dur / 1000 : undefined }
}

interface Sesion { c?: string; p?: string; t?: string; a?: number; v?: number; vd?: string }

function leerSesion(): Sesion | null {
  const v = cookies().get(COOKIE)?.value
  if (!v) return null
  const [datos, firma] = v.split('.')
  if (!datos || !firma) return null
  const a = Buffer.from(firma), b = Buffer.from(firmar(datos))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const s = JSON.parse(Buffer.from(datos, 'base64url').toString())
    if (!(s.e > Date.now())) return null
    if (s.a === 1) return (typeof s.c === 'string' || typeof s.p === 'string') ? s : null
    if (typeof s.vd === 'string') return typeof s.t === 'string' ? s : null
    return typeof s.c === 'string' && typeof s.t === 'string' ? s : null
  } catch { return null }
}

export interface ClientePortal {
  id: string | null          // null = vista previa de admin, sin cliente
  empresa: 'aroma' | 'lavid'
  nombre: string
  descuento: number          // % sobre precio de lista: el del cliente o el general
  portal_token: string | null
  admin: boolean
  preview: boolean
  datosConfirmados: boolean  // ya cargó/confirmó contacto y horarios en el portal
  verificado: boolean        // entró con link + PIN (o es admin): puede ver su cuenta
  vendedor: VendedorPortal | null   // lo está atendiendo un vendedor de calle
}

export interface VendedorPortal { id: string; nombre: string }

// Vendedor logueado (sesión de vendedor válida y con acceso vigente), o null.
export async function vendedorActual(): Promise<VendedorPortal | null> {
  const s = leerSesion()
  if (!s?.vd) return null
  const { data } = await db.from('vendedores').select('id, nombre, activo, portal_token').eq('id', s.vd).maybeSingle()
  if (!data || !data.activo || !data.portal_token || huellaToken(data.portal_token) !== s.t) return null
  return { id: data.id, nombre: data.nombre }
}

// Descuento general del portal (gestión > Portal clientes); 35 si no está cargado.
export async function descuentoGeneral(): Promise<number> {
  const { data } = await db.from('app_config').select('valor').eq('clave', 'portal_descuento_general').maybeSingle()
  const n = Number(data?.valor)
  return Number.isFinite(n) && n >= 0 && n < 100 ? n : 35
}

// Cliente logueado (o vista previa de admin), o null si no hay sesión
// válida / el acceso fue revocado.
export async function clienteActual(): Promise<ClientePortal | null> {
  const s = leerSesion()
  if (!s) return null
  const admin = s.a === 1

  // Vendedor atendiendo a uno de sus clientes.
  if (s.vd) {
    const vendedor = await vendedorActual()
    const elegido = cookies().get(COOKIE_VC)?.value
    if (!vendedor || !elegido) return null
    const { data: c } = await db.from('clientes')
      .select('id, empresa, nombre, apellido, razon_social, portal_descuento, portal_token, activo')
      .eq('id', elegido).eq('vendedor_id', vendedor.id).maybeSingle()
    if (!c || c.activo === false) return null
    const propio = c.portal_descuento == null ? null : Number(c.portal_descuento)
    return {
      id: c.id, empresa: c.empresa === 'lavid' ? 'lavid' : 'aroma',
      nombre: c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim(),
      descuento: propio != null && Number.isFinite(propio) ? propio : await descuentoGeneral(),
      portal_token: c.portal_token, admin: false, preview: false, datosConfirmados: true, verificado: true, vendedor,
    }
  }

  if (admin && !s.c && s.p) {
    return {
      id: null, empresa: s.p === 'lavid' ? 'lavid' : 'aroma', nombre: 'Vista previa',
      descuento: await descuentoGeneral(), portal_token: null, admin: true, preview: true, datosConfirmados: true, verificado: false, vendedor: null,
    }
  }

  const { data } = await db.from('clientes')
    .select('id, empresa, nombre, apellido, razon_social, portal_descuento, portal_token, portal_activo, portal_bloqueado, portal_datos_at, activo')
    .eq('id', s.c!).maybeSingle()
  if (!data) return null
  if (!admin) {
    if (!data.portal_activo || data.portal_bloqueado || data.activo === false || !data.portal_token) return null
    if (huellaToken(data.portal_token) !== s.t) return null
  }
  const propio = data.portal_descuento == null ? null : Number(data.portal_descuento)
  return {
    id: data.id,
    empresa: data.empresa === 'lavid' ? 'lavid' : 'aroma',
    nombre: data.razon_social || `${data.nombre} ${data.apellido || ''}`.trim(),
    descuento: propio != null && Number.isFinite(propio) ? propio : await descuentoGeneral(),
    portal_token: data.portal_token,
    admin,
    preview: false,
    datosConfirmados: admin || !!data.portal_datos_at,
    verificado: admin || s.v === 1,
    vendedor: null,
  }
}
