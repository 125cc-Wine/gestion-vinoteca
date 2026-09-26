import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Cliente de Supabase SOLO del lado servidor. La clave nunca llega al
// navegador (no es NEXT_PUBLIC_): toda consulta pasa por este servidor, que
// filtra por el cliente logueado y devuelve solo datos de venta.
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_KEY
if (!url || !key) throw new Error('Faltan SUPABASE_URL / SUPABASE_KEY')

export const db = createClient(url, key, {
  auth: { persistSession: false },
  global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) },
})
