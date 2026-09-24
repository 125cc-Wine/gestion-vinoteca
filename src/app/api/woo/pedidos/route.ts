export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { importarPedidosWeb, armarPedidoWeb, simularPedidoWeb } from '@/lib/woo-pedidos'

// Pedidos de la tienda web — ver src/lib/woo-pedidos.ts.
//
// GET  /api/woo/pedidos?simular=<id> cómo quedaría un pedido (sin escribir).
// GET  /api/woo/pedidos            importa lo nuevo (como mucho cada 2 min) y
//                                  devuelve los pedidos web sin levantar (para
//                                  el aviso / ícono de la app).
// POST /api/woo/pedidos            importa ya ("Traer ventas web").
// PUT  /api/woo/pedidos {id, accion: 'levantar' | 'armar'}

async function pendientes() {
  const { data } = await supabase
    .from('pedidos')
    .select('id, numero, cliente_nombre, total, pago, created_at')
    .eq('origen', 'web').eq('estado', 'pendiente')
    .order('created_at')
  return data ?? []
}

export async function GET(req: NextRequest) {
  const simular = req.nextUrl.searchParams.get('simular')
  if (simular) return NextResponse.json(await simularPedidoWeb(Number(simular)))
  const importacion = await importarPedidosWeb(false)
  return NextResponse.json({ importacion, pendientes: await pendientes() })
}

export async function POST() {
  const importacion = await importarPedidosWeb(true)
  return NextResponse.json({ importacion, pendientes: await pendientes() })
}

export async function PUT(req: NextRequest) {
  const { id, accion } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  if (accion === 'levantar') {
    const { data, error } = await supabase.from('pedidos')
      .update({ estado: 'preparando', levantado_at: new Date().toISOString() })
      .eq('id', id).eq('origen', 'web').eq('estado', 'pendiente')
      .select('id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data?.length) return NextResponse.json({ error: 'El pedido ya fue levantado o no está pendiente' }, { status: 409 })
    return NextResponse.json({ ok: true })
  }

  if (accion === 'armar') {
    const r = await armarPedidoWeb(id)
    if (r.error) return NextResponse.json({ error: r.error }, { status: 409 })
    return NextResponse.json(r)
  }

  return NextResponse.json({ error: 'accion inválida' }, { status: 400 })
}
