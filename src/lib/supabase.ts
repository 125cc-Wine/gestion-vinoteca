import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Cliente de la base SOLO para el servidor (rutas /api y server components).
// El navegador nunca habla con Supabase: usa @/lib/supabaseBrowser, que pasa
// por /api/db detrás del login. La clave es la secreta (SUPABASE_SECRET_KEY,
// sin NEXT_PUBLIC_, así no llega nunca al navegador); con RLS activado en
// todas las tablas, la clave pública "anon" ya no sirve para nada.
// Mientras no esté cargada la secreta se sigue usando la anon (transición).
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Next.js parchea el fetch global y por defecto cachea pedidos GET, incluso
// los que hace supabase-js por dentro — en producción (Vercel) esto se vio
// devolver datos de "hoy" desactualizados en rutas con `dynamic =
// 'force-dynamic'`, porque esa bandera no siempre alcanza a las fetch de
// librerías de terceros. Forzamos no-store acá para que nunca dependa de eso.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
  },
})
