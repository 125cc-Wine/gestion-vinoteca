import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { vendedorActual } from '@/lib/session'

export const dynamic = 'force-dynamic'

const MEDIOS = ['Efectivo', 'Transferencia', 'Cheque', 'Otro']
const n2 = (v: unknown) => Math.round((Number(v) || 0) * 100) / 100

// POST { cliente_id, monto, medio, cheques?, notas? } → cobro anotado por el
// vendedor. NO toca la cuenta corriente: queda pendiente hasta que se
// confirma en gestión (Cobros de vendedores), que es donde se aplica.
export async function POST(req: NextRequest) {
  const vendedor = await vendedorActual()
  if (!vendedor) return NextResponse.json({ error: 'Tu sesión venció. Volvé a entrar.' }, { status: 401 })
  const b = await req.json().catch(() => ({}))

  const { data: c } = await db.from('clientes').select('id, empresa, nombre, apellido, razon_social')
    .eq('id', b.cliente_id).eq('vendedor_id', vendedor.id).maybeSingle()
  if (!c) return NextResponse.json({ error: 'Ese cliente no está en tu cartera' }, { status: 404 })
  if (!MEDIOS.includes(b.medio)) return NextResponse.json({ error: 'Elegí el medio de pago' }, { status: 400 })

  let cheques: { numero: string; banco: string; fecha: string; monto: number }[] | null = null
  let monto = n2(b.monto)
  if (b.medio === 'Cheque') {
    const lista: { numero: string; banco: string; fecha: string; monto: number }[] = (Array.isArray(b.cheques) ? b.cheques : []).map((x: Record<string, unknown>) => ({
      numero: String(x.numero ?? '').trim().slice(0, 30), banco: String(x.banco ?? '').trim().slice(0, 60),
      fecha: /^\d{4}-\d{2}-\d{2}$/.test(String(x.fecha)) ? String(x.fecha) : '', monto: n2(x.monto),
    }))
    cheques = lista
    if (!lista.length || lista.some(x => !x.numero || !x.fecha || x.monto <= 0)) {
      return NextResponse.json({ error: 'Completá número, fecha de cobro y monto de cada cheque' }, { status: 400 })
    }
    monto = n2(lista.reduce((s, x) => s + x.monto, 0))
  }
  if (!(monto > 0) || monto > 100_000_000) return NextResponse.json({ error: 'Ingresá un monto válido' }, { status: 400 })

  const { error } = await db.from('cobros_vendedor').insert({
    vendedor_id: vendedor.id, vendedor_nombre: vendedor.nombre,
    cliente_id: c.id, cliente_nombre: c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim(),
    empresa: c.empresa === 'lavid' ? 'lavid' : 'aroma', monto, medio: b.medio, cheques,
    notas: typeof b.notas === 'string' ? b.notas.trim().slice(0, 500) || null : null,
  })
  if (error) return NextResponse.json({ error: 'No se pudo guardar. Probá de nuevo.' }, { status: 500 })
  return NextResponse.json({ ok: true, monto })
}
