'use client'
import type { SupabaseClient } from '@supabase/supabase-js'

// Reemplazo de supabase-js para las pantallas que consultaban la base desde
// el navegador. Arma la misma cadena (from().select().eq()…) pero, en vez de
// ir a Supabase con una clave pública, la manda a /api/db, que la ejecuta en
// el servidor solo si hay una sesión de gestión válida. Así el navegador no
// tiene ninguna clave de la base.

type Paso = { m: string; a: unknown[] }

async function ejecutar(pasos: Paso[]) {
  try {
    const r = await fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pasos }) })
    if (r.status === 401) { window.location.href = '/login'; return { data: null, error: { message: 'Sesión vencida' }, count: null } }
    return await r.json()
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : 'Sin conexión' }, count: null }
  }
}

function cadena(pasos: Paso[]): unknown {
  return new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === 'then') return (ok: (v: unknown) => unknown, mal?: (e: unknown) => unknown) => ejecutar(pasos).then(ok, mal)
      if (typeof prop !== 'string') return undefined
      return (...a: unknown[]) => cadena([...pasos, { m: prop, a }])
    },
  })
}

export const supabase = {
  from: (tabla: string) => cadena([{ m: 'from', a: [tabla] }]),
  rpc: (fn: string, params?: unknown) => cadena([{ m: 'rpc', a: params === undefined ? [fn] : [fn, params] }]),
} as unknown as SupabaseClient
