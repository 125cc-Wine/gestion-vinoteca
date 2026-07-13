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

      await supabase.from('ventas').update({
        facturado:   true,
        cae:         result.cae,
        cae_vto:     result.caeVto,
        nro_factura: result.nroFactura,
        cbte_tipo:   result.cbteTipo,
        nro_cbte_afip: nroStr,
        doc_tipo:    docTipo || 99,
        doc_nro:     docNro  || '0',
      }).eq('id', ventaId)
    }

    return NextResponse.json(result)
  } catch (e: unknown) {
    console.error('[AFIP]', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
