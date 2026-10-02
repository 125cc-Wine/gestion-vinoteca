export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Lista cerrada de varietales por categoría (tabla varietales). En los vinos
// es la uva o el estilo (Brut, Extra Brut…); en "Otro" es el rubro de la
// bebida (Gin, Aperitivos…), que agrupa y fija descuentos en el portal.
// Los formularios eligen de acá para que no aparezcan variantes escritas a mano.

const CATEGORIAS = ['Tinto', 'Blanco', 'Naranjo', 'Rosado', 'Espumante', 'Dulce', 'Otro']

export async function GET() {
  const { data, error } = await supabase.from('varietales').select('categoria, nombre').order('nombre')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ varietales: data || [] })
}

// POST { categoria, nombre } → agrega uno nuevo a la lista
export async function POST(req: NextRequest) {
  const body = await req.json()
  const categoria = String(body.categoria || '')
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim().replace(/\s+/g, ' ') : ''
  if (!CATEGORIAS.includes(categoria) || !nombre) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  // Si ya existe con otra mayúscula/acento, se usa el existente en vez de duplicarlo.
  const { data: existentes } = await supabase.from('varietales').select('nombre').eq('categoria', categoria)
  const clave = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const igual = (existentes || []).find(v => clave(v.nombre) === clave(nombre))
  if (igual) return NextResponse.json({ ok: true, nombre: igual.nombre })
  const { error } = await supabase.from('varietales').insert({ categoria, nombre })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, nombre })
}
