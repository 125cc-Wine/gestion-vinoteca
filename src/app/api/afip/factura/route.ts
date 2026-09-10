export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { solicitarCAE } from '@/lib/afip/wsfe'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { ventaId, empresa, cbteTipo, docTipo, docNro, total } = body

  if (!empresa || !cbteTipo || !total) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Calcular neto e IVA desde el total (para RI productos 21%)
  // Fact A: total = neto + IVA → neto = total / 1.21
  // Fact B a CF: AFIP acepta neto=total, IVA=0 cuando docTipo=99
  //   pero lo correcto es discriminar igual. Usamos 21% en ambos casos.
  const alicuota = 0.21
  const importeNeto  = parseFloat((total / (1 + alicuota)).toFixed(2))
  const importeIVA   = parseFloat((total - importeNeto).toFixed(2))
  const importeTotal = total

  try {
    const result = await solicitarCAE({
      empresa,
      cbteTipo,
      docTipo:  docTipo  || 99,
      docNro:   docNro   || '0',
      importeNeto,
      importeIVA,
      importeTotal,
      alicuotaIVA: 21,
    })

    // Persistir CAE en la venta
    if (ventaId) {
      const letra = cbteTipo === 1 ? 'A' : cbteTipo === 6 ? 'B' : 'C'
      const nroStr = `F${letra}-${String(result.ptoVta).padStart(5, '0')}-${String(result.nroFactura).padStart(8, '0')}`

      // OJO: la tabla `ventas` NO tiene columna `fecha` — un update que la
      // incluya falla completo (42703, "column does not exist") y ninguno de
      // los demás campos (facturado, cae, nro_cbte_afip...) se guarda. Esto
      // pasó en producción: la factura salía bien en AFIP y se imprimía, pero
      // el sistema seguía mostrando "Facturar" porque el update nunca pegaba.
      // Si en el futuro hace falta persistir la fecha real de emisión (ver
      // comentario histórico sobre presupuestos/remitos viejos), agregar la
      // columna a la tabla antes de reintroducir este campo.
      const { error: updateError } = await supabase.from('ventas').update({
        facturado:   true,
        cae:         result.cae,
        cae_vto:     result.caeVto,
        nro_factura: result.nroFactura,
        cbte_tipo:   result.cbteTipo,
        nro_cbte_afip: nroStr,
        doc_tipo:    docTipo || 99,
        doc_nro:     docNro  || '0',
      }).eq('id', ventaId)

      if (updateError) {
        // El CAE ya se obtuvo de AFIP (irreversible) — no podemos fallar la
        // respuesta sin más, pero sí hay que dejar rastro fuerte del error:
        // si esto no se corrige a mano, la venta queda facturada en AFIP y
        // "no facturada" en el sistema, como pasó acá.
        console.error('[AFIP] CAE obtenido pero falló el guardado en la venta', ventaId, updateError)
        return NextResponse.json({
          ...result,
          warning: `Factura emitida en AFIP (CAE ${result.cae}) pero no se pudo guardar en el sistema: ${updateError.message}. Anotá el CAE y avisá para corregirlo a mano.`,
        })
      }
    }

    return NextResponse.json(result)
  } catch (e: unknown) {
    console.error('[AFIP]', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
