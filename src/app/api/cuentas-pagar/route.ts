export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function diffDays(from: string): number {
  const now = Date.now()
  const then = new Date(from + (from.length <= 10 ? 'T12:00:00' : '')).getTime()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

// "Cuentas por Pagar" — el espejo de Aging (que muestra lo que te deben los
// clientes) pero para lo que la empresa le debe a sus proveedores. Junta en
// un solo pantallazo: facturas de compra pendientes de pago (agrupadas por
// proveedor, con antigüedad respecto al vencimiento) y cheques emitidos que
// todavía no se acreditaron (para ver la plata comprometida a futuro).
export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  try {
    const comprasQuery = supabase
      .from('compras')
      .select('id, numero, proveedor_id, proveedor_nombre, total, monto_pagado, estado, estado_pago, fecha_factura, fecha_vencimiento, nro_factura, created_at')
      .eq('empresa', empresa)
      .neq('estado', 'cancelado')
      .in('estado_pago', ['pendiente'])

    // compra_id en cheques es una migración nueva (sql/2026-08-cheques-compra-id.sql)
    // — si todavía no se corrió en la base, esta consulta falla sola pero no
    // tiene por qué tumbar el resto de la pantalla (lo esencial, "quién debe
    // qué", no depende de esto). Se degrada a "sin cheques" en ese caso.
    const chequesQuery = supabase
      .from('cheques')
      .select('id, nro_cheque, banco, monto, fecha_pago, beneficiario, proveedor_id, compra_id, concepto')
      .eq('empresa', empresa)
      .eq('estado', 'emitido')
      .order('fecha_pago', { ascending: true })

    const [{ data: compras, error: errCompras }, { data: chequesData, error: errCheques }] = await Promise.all([
      comprasQuery,
      chequesQuery,
    ])
    if (errCompras) return NextResponse.json({ error: errCompras.message }, { status: 500 })
    if (errCheques) console.error('[cuentas-pagar] cheques query falló (¿falta correr sql/2026-08-cheques-compra-id.sql?):', errCheques.message)
    const cheques = errCheques ? [] : (chequesData || [])

    // Traer teléfono de proveedores para el link de WhatsApp, igual que Aging.
    const idsProveedor = Array.from(new Set((compras || []).map(c => c.proveedor_id).filter((id): id is string => !!id)))
    const { data: proveedoresData } = idsProveedor.length > 0
      ? await supabase.from('proveedores').select('id, nombre, razon_social, telefono').in('id', idsProveedor)
      : { data: [] as { id: string; nombre: string; razon_social?: string; telefono?: string }[] }
    const proveedorPorId: Record<string, { nombre: string; razon_social?: string; telefono?: string }> = {}
    for (const p of proveedoresData || []) proveedorPorId[p.id] = p

    // Referencia de comprobantes de compra, para etiquetar los cheques que
    // están linkeados a una factura puntual (compra_id).
    const compraPorId: Record<string, { numero: string; proveedor_nombre: string }> = {}
    for (const c of compras || []) compraPorId[c.id] = { numero: c.numero, proveedor_nombre: c.proveedor_nombre }

    type Item = { total: number; fechaRef: string; dias: number; compra: typeof compras[number] }
    const SIN_PROVEEDOR = '__sin_proveedor__'
    const porProveedor: Record<string, { nombre: string; proveedorId: string | null; items: Item[] }> = {}

    for (const c of compras || []) {
      const pendiente = parseFloat(((c.total || 0) - (c.monto_pagado || 0)).toFixed(2))
      if (pendiente <= 0.01) continue
      const key = c.proveedor_id || SIN_PROVEEDOR
      if (!porProveedor[key]) porProveedor[key] = { nombre: c.proveedor_nombre, proveedorId: c.proveedor_id, items: [] }
      // Antigüedad respecto al vencimiento (lo que importa para pagar) — si no
      // hay fecha de vencimiento cargada, cae a fecha de factura y despues a
      // la fecha de alta de la compra, para que igual entre en algún bucket.
      const fechaRef = c.fecha_vencimiento || c.fecha_factura || c.created_at
      porProveedor[key].items.push({ total: pendiente, fechaRef, dias: diffDays(fechaRef), compra: c })
    }

    const result = Object.entries(porProveedor).map(([key, { nombre, proveedorId, items }]) => {
      // Buckets pensados para pagar, no para cobrar: lo urgente es lo YA
      // vencido (dias > 0), y "por vencer" es lo que se viene en 7 días.
      let vencidoMas30 = 0, vencido = 0, porVencer7 = 0, vigente = 0
      let diasMaxVencido = -9999
      let proximoVencimiento: string | null = null
      let facturaMasVencida: string | null = null

      for (const it of items) {
        if (it.dias > 30) vencidoMas30 += it.total
        else if (it.dias > 0) vencido += it.total
        else if (it.dias >= -7) porVencer7 += it.total
        else vigente += it.total

        if (it.dias > diasMaxVencido) { diasMaxVencido = it.dias; facturaMasVencida = it.compra.numero }
        if (!proximoVencimiento || it.fechaRef < proximoVencimiento) proximoVencimiento = it.fechaRef
      }

      const saldo_total = vencidoMas30 + vencido + porVencer7 + vigente
      if (saldo_total <= 0.01) return null

      const prov = proveedorId ? proveedorPorId[proveedorId] : null
      return {
        proveedor_id: proveedorId,
        proveedor_nombre: prov?.razon_social || prov?.nombre || nombre,
        telefono: prov?.telefono ?? null,
        saldo_total,
        vencido_mas30: vencidoMas30,
        vencido,
        por_vencer_7: porVencer7,
        vigente,
        dias_maximo_vencido: diasMaxVencido,
        proximo_vencimiento: proximoVencimiento,
        factura_mas_vencida: facturaMasVencida,
        cantidad_facturas: items.length,
        facturas: items
          .sort((a, b) => b.dias - a.dias)
          .map(it => ({
            id: it.compra.id,
            numero: it.compra.numero,
            nro_factura: it.compra.nro_factura,
            total: it.compra.total,
            monto_pagado: it.compra.monto_pagado || 0,
            pendiente: it.total,
            fecha_vencimiento: it.compra.fecha_vencimiento,
            fecha_factura: it.compra.fecha_factura,
            dias: it.dias,
          })),
      }
    }).filter(Boolean).sort((a, b) => b!.dias_maximo_vencido - a!.dias_maximo_vencido)

    const chequesPendientes = (cheques || []).map(ch => ({
      id: ch.id,
      nro_cheque: ch.nro_cheque,
      banco: ch.banco,
      monto: ch.monto,
      fecha_pago: ch.fecha_pago,
      dias: diffDays(ch.fecha_pago),
      beneficiario: ch.beneficiario,
      proveedor_id: ch.proveedor_id,
      compra_id: ch.compra_id,
      compra_numero: ch.compra_id ? compraPorId[ch.compra_id]?.numero ?? null : null,
    }))

    return NextResponse.json({ proveedores: result, cheques: chequesPendientes })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error desconocido' }, { status: 500 })
  }
}
