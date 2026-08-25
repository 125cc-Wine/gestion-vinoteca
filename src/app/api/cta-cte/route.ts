export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { labelComprobante } from '@/lib/labelComprobante'

export async function GET(req: NextRequest) {
  const clienteId = req.nextUrl.searchParams.get('cliente_id')
  if (!clienteId) return NextResponse.json({ error: 'cliente_id requerido' }, { status: 400 })

  const desde = req.nextUrl.searchParams.get('desde')
  const hasta = req.nextUrl.searchParams.get('hasta')

  let query = supabase
    .from('movimientos_cta_cte')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })

  if (desde) query = query.gte('created_at', desde + 'T00:00:00')
  if (hasta) query = query.lte('created_at', hasta + 'T23:59:59')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

interface Split { monto: number; medio_pago?: string }

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { cliente_id, tipo, concepto, empresa, referencia_id, fecha, medio_pago } = body

  // "pagos" permite cobrar con varios medios de pago en un solo paso (ej.
  // mitad efectivo, mitad transferencia). Si no viene, se usa el "monto" +
  // "medio_pago" sueltos (comportamiento original).
  const splits: Split[] = Array.isArray(body.pagos) && body.pagos.length > 0
    ? body.pagos
    : [{ monto: body.monto, medio_pago }]
  const monto = parseFloat(splits.reduce((a, s) => a + (parseFloat(String(s.monto)) || 0), 0).toFixed(2))

  // Obtener saldo actual del cliente
  const { data: cliente } = await supabase
    .from('clientes')
    .select('saldo')
    .eq('id', cliente_id)
    .single()

  const saldoAnterior = cliente?.saldo || 0
  const saldoNuevo = tipo === 'cargo'
    ? saldoAnterior + monto
    : saldoAnterior - monto

  // Un "cobro" genérico (no atado a una venta puntual, a diferencia de
  // /api/ventas/cobrar) se reparte FIFO contra TODO lo abierto del cliente,
  // en un único orden cronológico: remitos/presupuestos Y deudas cargadas a
  // mano ("Cargar deuda"), mezclados por fecha real — no primero todos los
  // remitos y recién después lo que sobra contra las deudas manuales, que es
  // lo que pasaba antes y podía saltearse una deuda manual más vieja que un
  // remito más nuevo. Lo que sobra tras cubrir todo lo abierto queda como
  // saldo a favor (no rompe nada, el saldo ya lo soporta).
  // Si el cobro viene partido en varios medios de pago, se recorren ambas
  // colas (pendientes y splits de pago) a la vez, así cada movimiento de
  // caja generado queda con el medio de pago que realmente le tocó.
  // Se hace ANTES de insertar el movimiento en cta_cte para poder anotar en
  // el concepto a qué comprobantes se aplicó — si no, el recibo del cliente
  // no decía más que "Cobro cuenta corriente" sin ninguna referencia a qué
  // factura/presupuesto correspondía.
  const detalleAplicado: string[] = []
  let sobrante = 0

  if (tipo === 'cobro' && monto > 0) {
    const { data: ventasAbiertas } = await supabase
      .from('ventas')
      .select('id, numero, tipo, total, monto_pagado, created_at, facturado, nro_cbte_afip')
      .eq('cliente_id', cliente_id)
      .eq('empresa', empresa)
      .in('tipo', ['remito', 'presupuesto'])
      .neq('estado_pago', 'pagado')
      .order('created_at', { ascending: true })

    const { data: cargosAbiertos } = await supabase
      .from('movimientos_cta_cte')
      .select('id, concepto, monto, monto_pagado, created_at')
      .eq('cliente_id', cliente_id)
      .eq('empresa', empresa)
      .eq('tipo', 'cargo')
      .order('created_at', { ascending: true })

    type Pendiente = { kind: 'venta' | 'cargo'; id: string; total: number; monto_pagado: number; created_at: string; label: string }
    const pendientes: Pendiente[] = [
      ...(ventasAbiertas || []).map(v => ({
        kind: 'venta' as const, id: v.id, total: v.total, monto_pagado: v.monto_pagado || 0, created_at: v.created_at,
        label: labelComprobante(v),
      })),
      ...(cargosAbiertos || [])
        .filter(c => parseFloat((c.monto - (c.monto_pagado || 0)).toFixed(2)) > 0.01)
        .map(c => ({
          kind: 'cargo' as const, id: c.id, total: c.monto, monto_pagado: c.monto_pagado || 0, created_at: c.created_at,
          label: c.concepto || 'Deuda cargada',
        })),
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const fechaCobro = fecha || new Date().toISOString().split('T')[0]
    let pIdx = 0
    let faltaActual = pendientes[0] ? parseFloat((pendientes[0].total - pendientes[0].monto_pagado).toFixed(2)) : 0
    let montoPagadoActual = pendientes[0]?.monto_pagado || 0

    for (const s of splits) {
      let restanteSplit = parseFloat(String(s.monto)) || 0
      const medioSplit = s.medio_pago || 'Efectivo'

      while (restanteSplit > 0 && pIdx < pendientes.length) {
        if (faltaActual <= 0) {
          pIdx++
          if (pIdx >= pendientes.length) break
          faltaActual = parseFloat((pendientes[pIdx].total - pendientes[pIdx].monto_pagado).toFixed(2))
          montoPagadoActual = pendientes[pIdx].monto_pagado
          continue
        }
        const item = pendientes[pIdx]
        const aplicar = Math.min(restanteSplit, faltaActual)
        montoPagadoActual = parseFloat((montoPagadoActual + aplicar).toFixed(2))
        faltaActual = parseFloat((faltaActual - aplicar).toFixed(2))
        const cubreTotal = faltaActual <= 0.01

        if (item.kind === 'venta') {
          await supabase.from('ventas').update({
            monto_pagado: montoPagadoActual,
            ...(cubreTotal ? { estado_pago: 'pagado' } : {}),
          }).eq('id', item.id)
        } else {
          await supabase.from('movimientos_cta_cte').update({ monto_pagado: montoPagadoActual }).eq('id', item.id)
        }

        await supabase.from('movimientos_caja').insert([{
          empresa,
          tipo: 'ingreso',
          concepto: `${concepto || 'Cobro cuenta corriente'} (aplicado a ${item.label})`,
          monto: aplicar,
          fecha: fechaCobro,
          categoria: 'Ventas - Cobro',
          medio_pago: medioSplit,
          referencia_id: item.id,
        }])

        detalleAplicado.push(`${item.label}${cubreTotal ? '' : ' (parcial)'}: $${aplicar.toLocaleString('es-AR')}`)
        restanteSplit = parseFloat((restanteSplit - aplicar).toFixed(2))
      }
      if (restanteSplit > 0) sobrante += restanteSplit
    }
  }

  let conceptoFinal = concepto || (tipo === 'cargo' ? 'Cargo' : 'Cobro cuenta corriente')
  if (tipo === 'cobro' && detalleAplicado.length > 0) {
    conceptoFinal += ` — Aplicado a: ${detalleAplicado.join(', ')}`
  } else if (tipo === 'cobro' && sobrante > 0.01) {
    conceptoFinal += ' — Sin comprobantes abiertos, quedó como saldo a favor'
  }

  // Registrar movimiento
  // "fecha" (la que elige el usuario en "Cargar deuda" / "Registrar cobro")
  // se recibía pero nunca se guardaba — el movimiento quedaba con
  // created_at = ahora sin importar qué fecha se hubiera puesto, así que
  // una deuda vieja cargada hoy aparecía como "0 días" en Aging/Cta. Cte. en
  // vez de con su antigüedad real.
  const { data, error } = await supabase
    .from('movimientos_cta_cte')
    .insert([{
      cliente_id, tipo, monto, concepto: conceptoFinal, empresa,
      saldo_anterior: saldoAnterior,
      saldo_nuevo: saldoNuevo,
      referencia_id: referencia_id || null,
      ...(fecha ? { created_at: fecha + 'T12:00:00' } : {}),
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Actualizar saldo del cliente
  await supabase
    .from('clientes')
    .update({ saldo: saldoNuevo })
    .eq('id', cliente_id)

  return NextResponse.json({ ...data, saldo_nuevo: saldoNuevo })
}

const ANULADO_PREFIX = '[ANULADO] '

// PATCH { id, accion: 'editar' | 'anular', monto?, concepto?, fecha? }
// Solo aplica a movimientos tipo 'cargo' ("Cargar deuda") — un cobro/pago ya
// generó un recibo real y mover plata ahí es más delicado, fuera de alcance
// por ahora.
//
// "Anular" no borra la fila (se necesita el rastro de auditoría — cuándo se
// cargó, quién, por qué) sino que la marca con el prefijo [ANULADO] en el
// concepto y descuenta el monto del saldo del cliente, revirtiendo el cargo
// original. Se marca además monto_pagado = monto para que quede "cerrada" y
// el reparto FIFO de /api/cta-cte (cobrosAbiertos) y el residuo de /api/aging
// dejen de contarla como deuda pendiente.
//
// "Editar" ajusta el saldo del cliente por la DIFERENCIA entre el monto
// nuevo y el viejo — no depende de si monto_pagado está bien trackeado
// (migraciones viejas lo dejaron igual al monto en el 100% de los cargos
// existentes), así que funciona igual de bien en cargos históricos que en
// nuevos. Si el cargo tiene un pago PARCIAL registrado (0 < monto_pagado <
// monto, señal de que sí se está trackeando en serio) se bloquea el cambio
// de monto para no romper esa cuenta — ahí solo se puede tocar concepto/
// fecha.
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, accion, monto, concepto, fecha } = body
  if (!id || !accion) return NextResponse.json({ error: 'id y accion requeridos' }, { status: 400 })

  const { data: mov, error: movErr } = await supabase
    .from('movimientos_cta_cte')
    .select('*')
    .eq('id', id)
    .single()
  if (movErr || !mov) return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 })
  if (mov.tipo !== 'cargo') return NextResponse.json({ error: 'Solo se pueden editar/anular cargos cargados a mano ("Cargar deuda")' }, { status: 400 })
  if ((mov.concepto || '').startsWith(ANULADO_PREFIX)) return NextResponse.json({ error: 'Este cargo ya está anulado' }, { status: 400 })

  const { data: cliente } = await supabase
    .from('clientes')
    .select('saldo')
    .eq('id', mov.cliente_id)
    .single()
  const saldoActual = cliente?.saldo || 0

  if (accion === 'anular') {
    const saldoNuevo = saldoActual - mov.monto
    await supabase.from('clientes').update({ saldo: saldoNuevo }).eq('id', mov.cliente_id)

    const { data, error } = await supabase
      .from('movimientos_cta_cte')
      .update({
        concepto: ANULADO_PREFIX + (mov.concepto || ''),
        monto_pagado: mov.monto,
        saldo_nuevo: saldoNuevo,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ...data, saldo_nuevo: saldoNuevo })
  }

  if (accion === 'editar') {
    const montoPagadoActual = mov.monto_pagado || 0
    const nuevoMonto = monto != null ? parseFloat(String(monto)) : mov.monto
    const cambiaMonto = Math.abs(nuevoMonto - mov.monto) > 0.01

    if (cambiaMonto) {
      const esParcial = montoPagadoActual > 0.01 && montoPagadoActual < mov.monto - 0.01
      if (esParcial) {
        return NextResponse.json({ error: 'Este cargo tiene un pago parcial registrado — no se puede cambiar el monto. Anulalo y cargalo de nuevo si el monto está mal.' }, { status: 400 })
      }
    }
    // Si estaba "cerrado" (monto_pagado cubría el total, ya sea por un pago
    // real o por la migración vieja que dejó los cargos históricos así),
    // mantenerlo cerrado con el nuevo monto para no reabrirlo de golpe en el
    // reparto FIFO de cobros.
    const estabaCerrado = montoPagadoActual >= mov.monto - 0.01
    const nuevoMontoPagado = cambiaMonto ? (estabaCerrado ? nuevoMonto : montoPagadoActual) : montoPagadoActual

    const saldoNuevo = cambiaMonto ? saldoActual + (nuevoMonto - mov.monto) : saldoActual
    if (cambiaMonto) {
      await supabase.from('clientes').update({ saldo: saldoNuevo }).eq('id', mov.cliente_id)
    }

    const { data, error } = await supabase
      .from('movimientos_cta_cte')
      .update({
        monto: nuevoMonto,
        monto_pagado: nuevoMontoPagado,
        ...(concepto != null ? { concepto } : {}),
        ...(fecha ? { created_at: fecha + 'T12:00:00' } : {}),
        saldo_nuevo: saldoNuevo,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ...data, saldo_nuevo: saldoNuevo })
  }

  return NextResponse.json({ error: 'accion inválida' }, { status: 400 })
}
