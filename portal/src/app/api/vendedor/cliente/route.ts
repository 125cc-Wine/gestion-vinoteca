import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { vendedorActual } from '@/lib/session'

export const dynamic = 'force-dynamic'

const txt = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const TIPOS = ['gastronomia', 'revendedor', 'mayorista', 'consumidor_final', 'responsable_inscripto', 'otro']

// POST → alta de un cliente nuevo desde la calle. Queda asignado al vendedor
// y marcado para revisar en gestión (alta_vendedor_id, alta_revisada_at null).
export async function POST(req: NextRequest) {
  const vendedor = await vendedorActual()
  if (!vendedor) return NextResponse.json({ error: 'Tu sesión venció. Volvé a entrar.' }, { status: 401 })
  const b = await req.json().catch(() => ({}))

  const nombre = txt(b.nombre, 120)
  const cuit = txt(b.cuit, 20).replace(/[^\d-]/g, '')
  const telefono = txt(b.telefono, 40)
  const empresa = b.empresa === 'lavid' ? 'lavid' : b.empresa === 'aroma' ? 'aroma' : null
  if (!empresa) return NextResponse.json({ error: 'Elegí para qué empresa es' }, { status: 400 })
  if (!nombre) return NextResponse.json({ error: 'Falta el nombre del comercio' }, { status: 400 })
  if (telefono.replace(/\D/g, '').length < 8) return NextResponse.json({ error: 'Falta un teléfono de contacto' }, { status: 400 })
  const d = cuit.replace(/\D/g, '')
  if (d && d.length !== 11 && d.length !== 7 && d.length !== 8) return NextResponse.json({ error: 'El CUIT tiene que tener 11 números (o DNI de 7-8)' }, { status: 400 })

  // Evita duplicar un cliente que ya existe con ese CUIT en la misma empresa.
  if (d.length === 11) {
    const { data: ya } = await db.from('clientes').select('id, nombre, razon_social, vendedor_id').eq('empresa', empresa).ilike('cuit', `%${d.slice(2, 10)}%`).limit(5)
    const igual = (ya ?? [])[0]
    if (igual) return NextResponse.json({ error: `Ya existe un cliente con ese CUIT (${igual.razon_social || igual.nombre}). Pedile a la oficina que te lo asigne.` }, { status: 409 })
  }

  const { data, error } = await db.from('clientes').insert({
    empresa, nombre, razon_social: txt(b.razon_social, 120) || nombre, cuit: cuit || null, telefono,
    email: txt(b.email, 120) || null, direccion: txt(b.direccion, 200) || null,
    tipo: TIPOS.includes(b.tipo) ? b.tipo : 'gastronomia',
    notas: [`Alta desde la calle por ${vendedor.nombre}`, txt(b.notas, 400)].filter(Boolean).join(' — '),
    activo: true, saldo: 0, vendedor_id: vendedor.id, alta_vendedor_id: vendedor.id,
  }).select('id').single()
  if (error || !data) return NextResponse.json({ error: 'No se pudo guardar. Probá de nuevo.' }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
