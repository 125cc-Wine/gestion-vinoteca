export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  const proveedorId = req.nextUrl.searchParams.get('proveedor_id')

  let q = supabase.from('compras').select('*').eq('empresa', empresa).order('created_at', { ascending: false })
  if (proveedorId) q = q.eq('proveedor_id', proveedorId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { empresa, proveedor_id, proveedor_nombre, items, notas, fecha_esperada,
    deuda_directa, concepto, nro_factura, fecha_factura, condicion_pago,
    fecha_vencimiento, estado_pago, monto_pagado, total_manual } = body

  if (!empresa || !proveedor_nombre) {
    return NextResponse.json({ error: 'faltan campos' }, { status: 400 })
  }

  if (deuda_directa) {
    // Deuda directa: número DEU-, estado recibido, factura ya cargada
    const { count } = await supabase
      .from('compras').select('*', { count: 'exact', head: true })
      .eq('empresa', empresa).like('numero', 'DEU-%')
    const numero = `DEU-${String((count || 0) + 1).padStart(5, '0')}`
    const deudaTotal = total_manual > 0 ? total_manual : (items ?? []).reduce((a: number, i: { subtotal: number }) => a + (i.subtotal || 0), 0)
    const { data, error } = await supabase.from('compras').insert([{
      empresa, numero, proveedor_id: proveedor_id || null, proveedor_nombre,
      items: items ?? [], total: deudaTotal, notas: notas || '',
      fecha_esperada: null, estado: 'recibido',
      nro_factura: nro_factura || null, fecha_factura: fecha_factura || null,
      condicion_pago: condicion_pago || 'contado',
      fecha_vencimiento: fecha_vencimiento || null,
      estado_pago: estado_pago || 'pendiente',
      monto_pagado: monto_pagado || null,
    }]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Actualizar stock igual que al recibir una OC
    for (const item of (items ?? []) as { producto_id?: string; nombre: string; cantidad: number }[]) {
      if (!item.producto_id) continue
      const { data: prod } = await supabase.from('productos').select('id, stock, nombre, empresa').eq('id', item.producto_id).single()
      if (!prod) continue
      const nuevoStock = (prod.stock || 0) + item.cantidad
      await supabase.from('productos').update({ stock: nuevoStock }).eq('id', prod.id)
      const otra = prod.empresa === 'aroma' ? 'lavid' : 'aroma'
      const { data: contra } = await supabase.from('productos').select('id').eq('nombre', prod.nombre).eq('empresa', otra).single()
      if (contra) await supabase.from('productos').update({ stock: nuevoStock }).eq('id', contra.id)
    }
    return NextResponse.json(data)
  }

  if (!items?.length) {
    return NextResponse.json({ error: 'faltan campos' }, { status: 400 })
  }

  const { count } = await supabase
    .from('compras').select('*', { count: 'exact', head: true })
    .eq('empresa', empresa).not('numero', 'like', 'DEU-%')

  const numero = `OC-${String((count || 0) + 1).padStart(5, '0')}`
  const total = items.reduce((a: number, i: { subtotal: number }) => a + (i.subtotal || 0), 0)

  const { data, error } = await supabase.from('compras').insert([{
    empresa, numero, proveedor_id: proveedor_id || null, proveedor_nombre,
    items, total, notas: notas || '', fecha_esperada: fecha_esperada || null,
    estado: 'pendiente',
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, estado, items: itemsRecibidos, ...rest } = body

  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('compras').update({ estado, items: itemsRecibidos, ...rest }).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Al marcar como recibido: incrementar stock de productos
  if (estado === 'recibido' && itemsRecibidos?.length) {
    for (const item of itemsRecibidos as { producto_id?: string; nombre: string; cantidad: number }[]) {
      if (!item.producto_id) continue
      const { data: prod } = await supabase
        .from('productos').select('id, stock, nombre, empresa').eq('id', item.producto_id).single()
      if (!prod) continue

      const nuevoStock = (prod.stock || 0) + item.cantidad
      await supabase.from('productos').update({ stock: nuevoStock }).eq('id', prod.id)

      // Sync contraparte
      const otra = prod.empresa === 'aroma' ? 'lavid' : 'aroma'
      const { data: contra } = await supabase
        .from('productos').select('id, stock').eq('nombre', prod.nombre).eq('empresa', otra).single()
      if (contra) {
        await supabase.from('productos').update({ stock: nuevoStock }).eq('id', contra.id)
      }
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const hard = req.nextUrl.searchParams.get('hard') === 'true'
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  if (hard) {
    const { error } = await supabase.from('compras').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase.from('compras').update({ estado: 'cancelado' }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
