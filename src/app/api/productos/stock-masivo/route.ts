export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/productos/stock-masivo
// body: { empresa, updates: [{ id, stock }] }
// Carga masiva de stock (ej. desde el Excel exportado y editado). Actualiza
// cada fila por id y, como el resto del sistema, sincroniza el stock en la
// contraparte de la otra empresa (mismo nombre), igual que el PUT individual.
const BATCH = 50

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const empresa: string = body.empresa
  const updates: { id: string; stock: number }[] = Array.isArray(body.updates) ? body.updates : []

  if (!empresa || !updates.length) {
    return NextResponse.json({ error: 'empresa y updates son requeridos' }, { status: 400 })
  }

  const ids = updates.map(u => u.id)
  const { data: productos, error: fetchErr } = await supabase
    .from('productos')
    .select('id, nombre, empresa')
    .in('id', ids)

  if (fetchErr || !productos) {
    return NextResponse.json({ error: fetchErr?.message ?? 'No se encontraron productos' }, { status: 500 })
  }

  const stockPorId = new Map(updates.map(u => [u.id, u.stock]))
  const otraEmpresa = empresa === 'aroma' ? 'lavid' : 'aroma'

  // Contraparte por nombre en la otra empresa, para mantener el stock en sync
  // como ya hace el resto del sistema (POST/PUT de /api/productos).
  const nombres = Array.from(new Set(productos.map(p => p.nombre)))
  const { data: contrapartes } = await supabase
    .from('productos')
    .select('id, nombre')
    .eq('empresa', otraEmpresa)
    .in('nombre', nombres)
  const contraparteIdPorNombre = new Map((contrapartes ?? []).map(c => [c.nombre, c.id]))

  let actualizados = 0
  let sincronizados = 0
  const errores: string[] = []

  for (let i = 0; i < productos.length; i += BATCH) {
    const lote = productos.slice(i, i + BATCH)
    const results = await Promise.all(lote.map(async p => {
      const stock = stockPorId.get(p.id)
      if (stock === undefined) return null
      const r1 = await supabase.from('productos').update({ stock }).eq('id', p.id)
      if (r1.error) return { nombre: p.nombre, error: r1.error.message }

      const contraparteId = contraparteIdPorNombre.get(p.nombre)
      if (contraparteId) {
        const r2 = await supabase.from('productos').update({ stock }).eq('id', contraparteId)
        if (!r2.error) sincronizados++
      }
      return { nombre: p.nombre, error: null }
    }))
    for (const r of results) {
      if (!r) continue
      if (r.error) errores.push(`${r.nombre}: ${r.error}`)
      else actualizados++
    }
  }

  return NextResponse.json({ actualizados, sincronizados, errores })
}
