import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_SESION, leerSesion } from '@/lib/sesion'

// Todo gestión (pantallas y /api) pide estar logueado. Quedan afuera solo el
// login, la activación por invitación, los archivos estáticos y
// /api/pedidos/125cc (lo llama el servidor de 125cc, se autoriza con su
// propio token CARTA_125CC_TOKEN).
const PUBLICAS = ['/login', '/acceso/', '/api/sesion', '/api/pedidos/125cc']

// Además de la firma de la cookie, se confirma que el usuario siga habilitado
// (si se lo deshabilita en Usuarios, pierde el acceso en ~1 minuto). Se
// cachea por instancia para no consultar la base en cada pedido.
const cacheActivo = new Map<string, { ok: boolean; t: number }>()
async function sigueActivo(id: string) {
  const c = cacheActivo.get(id)
  if (c && Date.now() - c.t < 60_000) return c.ok
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY!
  try {
    const headers: Record<string, string> = { apikey: key }
    if (!key.startsWith('sb_')) headers.Authorization = `Bearer ${key}`
    const r = await fetch(`${url}/rest/v1/usuarios_gestion?id=eq.${encodeURIComponent(id)}&select=activo`, { headers, cache: 'no-store' })
    if (!r.ok) return true            // si la base no responde, alcanza con la firma
    const filas = await r.json() as { activo: boolean }[]
    const ok = !!filas[0]?.activo
    cacheActivo.set(id, { ok, t: Date.now() })
    return ok
  } catch { return true }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  // Transición: el login lee la tabla de usuarios, que solo es accesible con
  // la clave secreta de Supabase. Hasta que esté cargada en Vercel no se exige.
  if (!process.env.SUPABASE_SECRET_KEY) return NextResponse.next()
  if (PUBLICAS.some(p => pathname === p || pathname.startsWith(p.endsWith('/') ? p : `${p}/`))) return NextResponse.next()

  const s = await leerSesion(req.cookies.get(COOKIE_SESION)?.value)
  if (s && await sigueActivo(s.u)) return NextResponse.next()

  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = pathname === '/' ? '' : `?volver=${encodeURIComponent(pathname + search)}`
  const res = NextResponse.redirect(url)
  if (s) res.cookies.set(COOKIE_SESION, '', { path: '/', maxAge: 0 })
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|logos/|.*\\.(?:png|jpe?g|svg|webp|gif|ico|woff2?|txt)$).*)'],
}
