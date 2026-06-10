import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .eq('empresa', empresa)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { descontarStock, ...venta } = body

  // Generar número de comprobante
  const tipo = venta.tipo === 'presupuesto' ? 'PRES' : 'REM'
  const { count } = await supabase
    .from('ventas')
    .select('*', { count: 'exact', head: true })
    .eq('empresa', venta.empresa)
    .eq('tipo', venta.tipo)

  const numero = `${tipo}-${String((count || 0) + 1).padStart(6, '0')}`
  venta.numero = numero

  const { data, error } = await supabase
    .from('ventas')
    .insert([venta])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Descontar stock si se pidió
  if (descontarStock && venta.items) {
    for (const item of venta.items) {
      if (item.producto_id) {
        const { data: prod } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', item.producto_id)
          .single()

        if (prod) {
          const nuevoStock = Math.max(0, (prod.stock || 0) - item.cantidad)
          await supabase
            .from('productos')
            .update({ stock: nuevoStock })
            .eq('id', item.producto_id)
        }
      }
    }
  }

  // Registrar en caja si es remito
  if (venta.tipo === 'remito' && venta.total > 0) {
    await supabase.from('movimientos_caja').insert([{
      empresa: venta.empresa,
      tipo: 'ingreso',
      concepto: `Remito ${numero} - ${venta.cliente_nombre}`,
      monto: venta.total,
      fecha: new Date().toISOString().split('T')[0],
      categoria: 'Ventas',
      referencia_id: data.id,
    }])
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabase
    .from('ventas')
    .update({ estado: 'cancelado' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, descontarStock: _ds, ...rest } = body

  const { data, error } = await supabase
    .from('ventas')
    .update(rest)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
