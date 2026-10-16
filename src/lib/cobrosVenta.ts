import 'server-only'
import { supabase } from '@/lib/supabase'
import type { CobroVenta } from '@/lib/cobrosResumen'

export type { CobroVenta }

// "Cómo se cobró" una venta, leído de la caja (movimientos_caja), que es
// donde queda el medio de pago real de cada cobro. La condición de venta dice
// cómo se vendió (ej. Cta. Cte.); esto dice con qué plata se saldó.
//
// Un ingreso de caja queda atado a la venta de dos formas:
//  - referencia_id = id de la venta (venta de contado, o cobro desde
//    /api/ventas/cobrar o del reparto FIFO de /api/cta-cte)
//  - referencia_id = id de un cargo de cta. cte. de esa venta (el reparto
//    FIFO también aplica contra cargos, ej. los "ajuste al editar")
//
// Se descartan los ingresos con medio "Cta.Cte." que no son cobros: es el
// registro que se hace al vender a crédito (o una venta de contado guardada
// con esa condición), y no entró plata. Los cobros viejos con medio
// "Cta.Cte." sí se muestran, como "Medio no registrado": antes el cobro
// tomaba el medio de la condición de venta en vez de preguntarlo.


export async function cobrosDeVentas(ventaIds: string[]): Promise<Record<string, CobroVenta[]>> {
  const out: Record<string, CobroVenta[]> = {}
  const ids = Array.from(new Set(ventaIds.filter(Boolean)))
  if (ids.length === 0) return out

  const refAVenta = new Map<string, string>(ids.map(id => [id, id]))
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabase
      .from('movimientos_cta_cte')
      .select('id, referencia_id')
      .eq('tipo', 'cargo')
      .in('referencia_id', ids.slice(i, i + 200))
    for (const m of data ?? []) if (m.referencia_id) refAVenta.set(m.id, m.referencia_id)
  }

  const refs = Array.from(refAVenta.keys())
  for (let i = 0; i < refs.length; i += 200) {
    const { data } = await supabase
      .from('movimientos_caja')
      .select('referencia_id, fecha, monto, medio_pago, categoria, created_at')
      .eq('tipo', 'ingreso')
      .in('referencia_id', refs.slice(i, i + 200))
      .order('created_at')
    for (const m of data ?? []) {
      const esCobro = m.categoria === 'Ventas - Cobro'
      const sinPlata = (m.medio_pago || '') === 'Cta.Cte.'
      if (sinPlata && !esCobro) continue
      const ventaId = refAVenta.get(m.referencia_id)
      if (!ventaId) continue
      ;(out[ventaId] ??= []).push({
        fecha: m.fecha || String(m.created_at).slice(0, 10),
        monto: Number(m.monto) || 0,
        medio: sinPlata ? 'Medio no registrado' : (m.medio_pago || 'Efectivo'),
      })
    }
  }
  return out
}
