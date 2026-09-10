export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { solicitarCAE } from '@/lib/afip/wsfe'
import { supabase } from '@/lib/supabase'

// Fact.A(1)->NC.A(3), Fact.B(6)->NC.B(8), Fact.C(11)->NC.C(13)
const NC_TIPO: Record<number, number> = { 1: 3, 6: 8, 11: 13 }
const LETRA: Record<number, string> = { 3: 'A', 8: 'B', 13: 'C' }

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { ventaId, empresa, monto, motivo } = body

  if (!ventaId || !empresa || !monto) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data: venta, error: ventaError } = await supabase.from('ventas').select('*').eq('id', ventaId).single()
  if (ventaError || !venta) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
  if (!venta.facturado || !venta.cae || !venta.nro_cbte_afip || !venta.cbte_tipo) {
    return NextResponse.json({ error: 'Esta venta no tiene una factura AFIP emitida' }, { status: 400 })
  }
  const ncTipo = NC_TIPO[venta.cbte_tipo]
  if (!ncTipo) {
    return NextResponse.json({ error: `Tipo de comprobante ${venta.cbte_tipo} sin Nota de Crédito equivalente` }, { status: 400 })
  }
  const importeTotal = parseFloat(monto)
  if (!(importeTotal > 0) || importeTotal > venta.total + 0.01) {
    return NextResponse.json({ error: 'El importe a acreditar debe ser mayor a 0 y no puede superar el total de la factura' }, { status: 400 })
  }

  const ptoVta = parseInt(venta.nro_cbte_afip.split('-')[1] || '0')
  const alicuota = 0.21
  const importeNeto = parseFloat((importeTotal / (1 + alicuota)).toFixed(2))
  const importeIVA  = parseFloat((importeTotal - importeNeto).toFixed(2))

  try {
    const result = await solicitarCAE({
      empresa,
      cbteTipo: ncTipo,
      docTipo: venta.doc_tipo || 99,
      docNro:  venta.doc_nro  || '0',
      importeNeto,
      importeIVA,
      importeTotal,
      alicuotaIVA: 21,
      comprobanteAsociado: { tipo: venta.cbte_tipo, ptoVta, nro: venta.nro_factura },
    })

    const letra = LETRA[ncTipo]
    const nroStr = `NC${letra}-${String(result.ptoVta).padStart(5, '0')}-${String(result.nroFactura).padStart(8, '0')}`

    // Prefijo propio ('NC') para no mezclar en el contador de las devoluciones
    // físicas (DEV) — comparten `tipo: 'devolucion'` sólo para que Aging siga
    // neteando esto contra la deuda del cliente, no por ser lo mismo.
    const { count } = await supabase
      .from('ventas')
      .select('*', { count: 'exact', head: true })
      .eq('empresa', empresa)
      .eq('tipo', 'devolucion')
    const numero = `NC-${String((count || 0) + 1).padStart(6, '0')}`

    const { data: nc, error: insertError } = await supabase.from('ventas').insert([{
      empresa,
      tipo: 'devolucion',
      numero,
      cliente_id: venta.cliente_id,
      cliente_nombre: venta.cliente_nombre,
      items: [{
        nombre: `Nota de Crédito ${letra} — anula/ajusta ${venta.nro_cbte_afip}`,
        cantidad: 1, precio_unitario: importeTotal, subtotal: importeTotal,
      }],
      subtotal: importeTotal,
      descuento: 0,
      total: importeTotal,
      estado: 'emitido',
      notas: motivo || `Nota de crédito de ${venta.nro_cbte_afip}`,
      facturado: true,
      cae: result.cae,
      cae_vto: result.caeVto,
      nro_factura: result.nroFactura,
      cbte_tipo: result.cbteTipo,
      nro_cbte_afip: nroStr,
      doc_tipo: venta.doc_tipo || 99,
      doc_nro:  venta.doc_nro  || '0',
    }]).select().single()

    if (insertError) {
      // El CAE de la NC ya salió de AFIP (irreversible) aunque esto falle —
      // no lo tragamos: se lo devolvemos igual para que quede anotado a mano.
      console.error('[AFIP NC] CAE obtenido pero falló el guardado', insertError)
      return NextResponse.json({
        ...result, nroCbteAfip: nroStr,
        warning: `Nota de Crédito emitida en AFIP (CAE ${result.cae}, ${nroStr}) pero no se pudo guardar en el sistema: ${insertError.message}. Anotala a mano.`,
      })
    }

    // Nota trazable en la factura original — no rompe la respuesta si falla.
    const notaOriginal = `Anulada/ajustada parcialmente por Nota de Crédito ${nroStr} (CAE ${result.cae}) el ${new Date().toLocaleDateString('es-AR')}.`
    await supabase.from('ventas').update({
      notas: venta.notas ? `${venta.notas}\n${notaOriginal}` : notaOriginal,
    }).eq('id', ventaId)

    return NextResponse.json({ ...result, nc, nroCbteAfip: nroStr, comprobanteAsociado: venta.nro_cbte_afip })
  } catch (e: unknown) {
    console.error('[AFIP NC]', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
