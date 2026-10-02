export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { POST as registrarEnCtaCte } from '@/app/api/cta-cte/route'
import { POST as registrarCheque } from '@/app/api/cheques/route'

// Cobros que anotan los vendedores de calle desde el portal, y clientes que
// dieron de alta. Nada toca la cuenta corriente hasta que se confirma acá.
//
// GET → { pendientes, recientes, altas }  (?resumen=1 → solo cantidades, para el aviso)
// POST { id, accion: 'confirmar' } → se aplica igual que un cobro de Aging:
//      /api/cta-cte (FIFO contra lo adeudado + caja) y, si es cheque, /api/cheques.
// POST { id, accion: 'rechazar', motivo }
// POST { cliente_id, accion: 'alta_revisada' } → saca al cliente nuevo de la lista.
const err = (m: string, status = 500) => NextResponse.json({ error: m }, { status })

export async function GET(req: NextRequest) {
  const [{ data: pend, error }, { data: rec }, { data: altas }] = await Promise.all([
    supabase.from('cobros_vendedor').select('*').eq('estado', 'pendiente').order('created_at'),
    req.nextUrl.searchParams.get('resumen') ? Promise.resolve({ data: [] }) :
      supabase.from('cobros_vendedor').select('*').neq('estado', 'pendiente').order('resuelto_at', { ascending: false }).limit(30),
    supabase.from('clientes').select('id, empresa, nombre, razon_social, cuit, telefono, direccion, created_at, alta_vendedor_id, vendedores:alta_vendedor_id(nombre)')
      .not('alta_vendedor_id', 'is', null).is('alta_revisada_at', null).order('created_at'),
  ])
  if (error) return err(error.message)
  return NextResponse.json({ pendientes: pend || [], recientes: rec || [], altas: altas || [] })
}

// Llama a otra ruta de la app sin pasar por HTTP (misma lógica que usa Aging).
async function llamar(fn: (r: NextRequest) => Promise<Response>, body: unknown) {
  const r = await fn(new NextRequest('http://interno/api', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }))
  return r.json()
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  if (body.accion === 'alta_revisada') {
    if (!body.cliente_id) return err('cliente_id requerido', 400)
    const { error } = await supabase.from('clientes').update({ alta_revisada_at: new Date().toISOString() }).eq('id', body.cliente_id)
    if (error) return err(error.message)
    return NextResponse.json({ ok: true })
  }

  if (!body.id) return err('id requerido', 400)

  if (body.accion === 'rechazar') {
    const { data, error } = await supabase.from('cobros_vendedor')
      .update({ estado: 'rechazado', motivo_rechazo: String(body.motivo || '').slice(0, 300) || null, resuelto_at: new Date().toISOString() })
      .eq('id', body.id).eq('estado', 'pendiente').select('id')
    if (error) return err(error.message)
    if (!data?.length) return err('Ese cobro ya fue resuelto', 409)
    return NextResponse.json({ ok: true })
  }

  if (body.accion === 'confirmar') {
    // Se "toma" el cobro primero (solo si sigue pendiente) para que dos
    // confirmaciones a la vez no lo apliquen dos veces.
    const { data: tomado, error: e1 } = await supabase.from('cobros_vendedor')
      .update({ estado: 'confirmado', resuelto_at: new Date().toISOString() })
      .eq('id', body.id).eq('estado', 'pendiente').select('*')
    if (e1) return err(e1.message)
    const c = tomado?.[0]
    if (!c) return err('Ese cobro ya fue resuelto', 409)

    const hoy = new Date().toISOString().split('T')[0]
    const concepto = `Cobro de ${c.vendedor_nombre || 'vendedor'} (calle)${c.notas ? ` — ${c.notas}` : ''}`
    const res = await llamar(registrarEnCtaCte, {
      empresa: c.empresa, cliente_id: c.cliente_id, cliente_nombre: c.cliente_nombre,
      tipo: 'cobro', concepto, monto: Number(c.monto), medio_pago: c.medio === 'Otro' ? 'Efectivo' : c.medio, fecha: hoy,
    })
    if (res?.error) {
      await supabase.from('cobros_vendedor').update({ estado: 'pendiente', resuelto_at: null }).eq('id', c.id)
      return err('No se pudo aplicar a la cuenta: ' + res.error)
    }
    if (c.medio === 'Cheque') {
      for (const ch of (c.cheques || []) as { numero: string; banco: string; fecha: string; monto: number }[]) {
        await llamar(registrarCheque, {
          empresa: c.empresa, tipo: 'recibido', banco: ch.banco || null, nro_cheque: ch.numero, monto: ch.monto,
          fecha_emision: hoy, fecha_pago: ch.fecha, librador: c.cliente_nombre, concepto, cliente_id: c.cliente_id,
        })
      }
    }
    return NextResponse.json({ ok: true, ids: res?.ids ?? [] })
  }

  return err('accion inválida', 400)
}
