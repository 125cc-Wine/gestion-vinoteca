export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { empresa, clientes } = await req.json()
  if (!empresa || !clientes?.length) return NextResponse.json({ error: 'faltan datos' }, { status: 400 })

  const rows = clientes.map((c: Record<string, string>) => ({
    empresa,
    nombre: c.nombre || '',
    razon_social: c.razon_social || '',
    cuit: c.cuit || '',
    direccion: c.direccion || '',
    telefono: c.telefono || '',
    email: c.email || '',
    tipo: c.tipo || 'consumidor_final',
    saldo: 0,
    activo: true,
  }))

  let importados = 0
  let errores = 0
  const BATCH = 100
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase.from('clientes').insert(rows.slice(i, i + BATCH))
    if (error) errores += rows.slice(i, i + BATCH).length
    else importados += rows.slice(i, i + BATCH).length
  }

  return NextResponse.json({ importados, errores })
}
