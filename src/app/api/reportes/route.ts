export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  const desde   = req.nextUrl.searchParams.get('desde')
  const hasta   = req.nextUrl.searchParams.get('hasta')
  const limitParam = req.nextUrl.searchParams.get('limit')
  const sortParam  = req.nextUrl.searchParams.get('sort') // 'total' | 'cantidad'

  if (!empresa) return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })

  // "ambas" agrega Aroma + La Vid en un solo reporte — no filtra por empresa.
  const ambas = empresa === 'ambas'

  // Paginado por las dudas — Supabase corta en 1000 filas por default, y un
  // rango de fechas amplio (o "ambas" empresas) puede superarlo con el
  // tiempo, cortando ventas en silencio y desviando todos los KPIs.
  const ventas: { id: string; numero: string; tipo: string; total: number; monto_pagado: number | null; created_at: string; cliente_nombre: string; vendedor_nombre: string | null; items: unknown; estado_pago: string | null; condicion_venta: string | null }[] = []
  {
    const PAGE = 1000
    let from = 0
    while (true) {
      let q = supabase
        .from('ventas')
        .select('id, numero, tipo, total, monto_pagado, created_at, cliente_nombre, vendedor_nombre, items, estado_pago, condicion_venta')
        .neq('estado', 'cancelado')
        .order('created_at', { ascending: true })
        .range(from, from + PAGE - 1)

      if (!ambas) q = q.eq('empresa', empresa)
      if (desde) q = q.gte('created_at', desde)
      if (hasta) q = q.lte('created_at', hasta + 'T23:59:59')

      const { data, error } = await q
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!data || data.length === 0) break
      ventas.push(...data)
      if (data.length < PAGE) break
      from += PAGE
    }
  }

  // Las devoluciones no son ventas — si se incluyen acá, la mercadería
  // devuelta se contaba dos veces: como venta original y como "venta" de
  // la propia devolución (con total y cantidades positivas).
  const list = (ventas || []).filter(v => v.tipo !== 'devolucion')

  // Costo por producto, para calcular margen en el ranking (join en JS
  // porque "items" guarda una copia del producto al momento de la venta,
  // no el costo actual — y de última el costo actual es lo que interesa
  // para saber qué tan rentable es el producto HOY).
  // Se traen los productos de LAS DOS empresas siempre (no solo la del
  // reporte): algunos ítems de venta quedaron con un producto_id de la otra
  // empresa (bug viejo del selector) — si acá solo buscábamos en la empresa
  // del reporte, esos ítems no encontraban costo y su margen se perdía en
  // silencio (el total y las unidades sí sumaban bien, quedaba un número
  // a medias, muy difícil de notar). Además de por id, se guarda un mapa por
  // NOMBRE como respaldo — mismo criterio que ya usamos para compartir listas
  // de precio entre empresas — para cubrir cualquier producto_id que ya no
  // matchee ningún producto (borrado, o de la otra empresa).
  // Paginado porque Supabase corta en 1000 filas por default y hay >1000
  // productos por empresa (>2700 en total).
  const productosCosto: { id: string; nombre: string; bodega: string | null; precio_costo: number | null }[] = []
  {
    const PAGE = 1000
    let from = 0
    while (true) {
      const { data, error: errCosto } = await supabase
        .from('productos').select('id, nombre, bodega, precio_costo').range(from, from + PAGE - 1)
      if (errCosto || !data || data.length === 0) break
      productosCosto.push(...data)
      if (data.length < PAGE) break
      from += PAGE
    }
  }
  const costoPorId = new Map(productosCosto.map(p => [p.id, p.precio_costo || 0]))
  const costoPorNombre = new Map(productosCosto.map(p => [p.nombre.trim().toLowerCase(), p.precio_costo || 0]))
  // Nombre CANÓNICO actual de cada producto (nombre + bodega), para agrupar
  // el ranking por producto real en vez de por el texto que quedó congelado
  // en cada venta — un mismo producto puede tener el ítem guardado como
  // "Nombre" en una venta vieja (bodega vacía en ese momento) y como
  // "Nombre - Bodega" en una más nueva (bodega cargada después), y quedaban
  // como dos filas separadas en vez de sumarse. Caso real: "Serbal Cabernet
  // Franc Atamisque" (producto 124b5f1a…) con 2 ventas sin sufijo de bodega
  // y 1 con "- Atamisque".
  const nombrePorId = new Map(productosCosto.map(p => [p.id, `${p.nombre}${p.bodega ? ' - ' + p.bodega : ''}`]))

  // 1. Ventas por día
  const porDia: Record<string, number> = {}
  for (const v of list) {
    const dia = v.created_at.split('T')[0]
    porDia[dia] = (porDia[dia] || 0) + v.total
  }
  const ventasPorDia = Object.entries(porDia).map(([fecha, total]) => ({ fecha, total }))

  // 2. Ranking productos (con margen estimado al costo actual)
  const prodMap: Record<string, { nombre: string; cantidad: number; total: number; margen: number }> = {}
  for (const v of list) {
    for (const item of (v.items as { nombre: string; cantidad: number; subtotal: number; producto_id?: string }[] || [])) {
      // Agrupar por producto_id cuando resuelve a un producto real — el
      // nombre congelado en el ítem puede variar entre ventas del mismo
      // producto (ver comentario de nombrePorId arriba). Si el id no
      // resuelve (producto borrado, o id de la otra empresa — bug viejo del
      // selector), se cae al nombre crudo del ítem, igual que antes.
      const nombreCanonico = item.producto_id ? nombrePorId.get(item.producto_id) : undefined
      const key = item.producto_id && nombreCanonico ? item.producto_id : item.nombre
      if (!prodMap[key]) prodMap[key] = { nombre: nombreCanonico || item.nombre, cantidad: 0, total: 0, margen: 0 }
      prodMap[key].cantidad += item.cantidad
      prodMap[key].total   += item.subtotal || 0
      // Primero por id (más preciso); si no matchea ningún producto (id de
      // la otra empresa, o producto borrado), se cae a buscar por nombre —
      // el ítem se guarda como "Nombre - Bodega", así que se recorta antes
      // de buscar (ver comentario arriba de costoPorNombre).
      let costo = item.producto_id ? costoPorId.get(item.producto_id) : undefined
      if (costo == null) {
        const nombreBase = item.nombre.split(' - ')[0].trim().toLowerCase()
        costo = costoPorNombre.get(nombreBase)
      }
      if (costo != null) prodMap[key].margen += (item.subtotal || 0) - costo * item.cantidad
    }
  }
  // limit=0 (o "all") devuelve el ranking completo, sin techo.
  const limit = limitParam === 'all' || limitParam === '0' ? undefined : Number(limitParam) || 20
  const sortKey = sortParam === 'cantidad' ? 'cantidad' : 'total'
  const rankingCompleto = Object.values(prodMap).sort((a, b) => b[sortKey] - a[sortKey])
  const rankingProductos = limit ? rankingCompleto.slice(0, limit) : rankingCompleto
  // Total de botellas vendidas en el período — sobre TODOS los productos,
  // no solo los que entran en el ranking recortado por "limit".
  const unidadesTotales = Object.values(prodMap).reduce((a, p) => a + p.cantidad, 0)

  // 3. Ventas por vendedor
  const vendMap: Record<string, { nombre: string; ventas: number; total: number }> = {}
  for (const v of list) {
    const key = v.vendedor_nombre || 'Sin asignar'
    if (!vendMap[key]) vendMap[key] = { nombre: key, ventas: 0, total: 0 }
    vendMap[key].ventas += 1
    vendMap[key].total  += v.total
  }
  const porVendedor = Object.values(vendMap).sort((a, b) => b.total - a.total)

  // 4. Resumen por condición de pago
  const condMap: Record<string, { condicion: string; ventas: number; total: number }> = {}
  for (const v of list) {
    const key = v.estado_pago === 'cuenta_corriente' ? 'Cta. Corriente'
              : v.estado_pago === 'pendiente'         ? 'Pendiente'
              : v.condicion_venta || 'Contado'
    if (!condMap[key]) condMap[key] = { condicion: key, ventas: 0, total: 0 }
    condMap[key].ventas += 1
    condMap[key].total  += v.total
  }
  const porCondicion = Object.values(condMap).sort((a, b) => b.total - a.total)

  // KPIs
  const totalVentas   = list.reduce((a, v) => a + v.total, 0)
  const cantVentas    = list.length
  const ticketPromedio = cantVentas ? totalVentas / cantVentas : 0
  // Facturado vs. efectivamente cobrado en el período — antes el reporte
  // solo mostraba lo facturado, sin distinguir cuánto de eso ya se cobró.
  // "cobrado" sumaba el total ENTERO de las ventas con estado_pago='pagado'
  // y nada más — una venta en cuenta_corriente/pendiente con pago PARCIAL
  // (monto_pagado > 0 pero no cubre el total) no restaba nada, así que
  // "Pendiente de cobro" contaba su total bruto como si no se hubiera
  // cobrado ni un peso. Mismo bug que ya se había corregido en el KPI
  // "Cuentas corrientes" del Dashboard (commit 9beecf6), nunca aplicado acá.
  // Verificado: Aroma jun-ago mostraba $1.013.478 pendiente; lo real, sumando
  // total - monto_pagado de cada venta abierta, es $439.248 — coincide exacto
  // con lo que ya muestra Cuentas Corrientes.
  const cobrado         = list.reduce((a, v) => a + (v.monto_pagado || 0), 0)
  const pendienteCobro   = list.filter(v => v.estado_pago !== 'pagado').reduce((a, v) => a + (v.total - (v.monto_pagado || 0)), 0)
  const margenTotal     = Object.values(prodMap).reduce((a, p) => a + p.margen, 0)

  return NextResponse.json({
    kpis: { totalVentas, cantVentas, ticketPromedio, cobrado, pendienteCobro, margenTotal, unidadesTotales },
    ventasPorDia,
    rankingProductos,
    porVendedor,
    porCondicion,
  })
}
