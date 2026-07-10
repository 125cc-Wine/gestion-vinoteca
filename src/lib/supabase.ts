import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Next.js parchea el fetch global y por defecto cachea pedidos GET, incluso
// los que hace supabase-js por dentro — en producción (Vercel) esto se vio
// devolver datos de "hoy" desactualizados en rutas con `dynamic =
// 'force-dynamic'`, porque esa bandera no siempre alcanza a las fetch de
// librerías de terceros. Forzamos no-store acá para que nunca dependa de eso.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
  },
})
