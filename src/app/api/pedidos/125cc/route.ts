export const dynamic = 'force-dynamic'
import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { indexarReglas, indexarReglasCliente, precioPortal, type ReglaPortal } from '@/lib/precioPortal'

// Pedidos de la carta de 125cc Wine Bar (repo 125cc, Calendario de Carta).
// Las cajas de cada quincena salen del stock de La Vid: 125cc manda acá los
// vinos y cantidades de una quincena y queda un pedido PENDIENTE (origen
// '125cc') en la bandeja de Pedidos. Recién al procesarlo en gestión se
// decide si sale como venta (presupuesto, igual que los del portal) o como
// consignación (/api/pedidos/consignacion) — y ahí se mueve el stock.
//
// No usa la sesión de gestión (lo llama el servidor de 125cc): se autoriza
// con un token compartido, CARTA_125CC_TOKEN (el mismo valor está en el
// proyecto de 125cc como GESTION_125CC_TOKEN). Está en PUBLICAS del
// middleware por eso.
//
// Precio: el mismo que vería 125cc en el portal (lista con el descuento del
// cliente / reglas del portal, ver precioPortal) — es el "mayorista" real
// de La Vid; precio_mayorista no está cargado en ningún producto.
//
// POST { inicio: 'YYYY-MM-DD', label, items: [{ vino_id, nombre, cantidad }], dry_run? }
//   Un pedido por quincena: si ya hay uno pendiente para ese `inicio`, se
//   reemplazan sus ítems; si ya se procesó, 409. Con dry_run: true solo
//   calcula (ítems, precios, total, omitidos) sin escribir nada.
// GET ?desde=YYYY-MM-DD → estado de los pedidos de 125cc por quincena.

const EMPRESA = 'lavid'
const CLIENTE_NOMBRE = '125cc Wine Bar'
const marca = (inicio: string) => `[carta-125cc:${inicio}]`
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const err = (m: string, status = 400) => NextResponse.json({ error: m }, { status })
const norm = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()

function autorizado(req: NextRequest) {
  const esperado = process.env.CARTA_125CC_TOKEN
  if (!esperado) return false
  const dado = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const a = Buffer.from(dado), b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function cliente125cc(crear: boolean) {
  const { data: existente } = await supabase.from('clientes')
    .select('id, nombre, portal_descuento').eq('empresa', EMPRESA).eq('nombre', CLIENTE_NOMBRE).maybeSingle()
  if (existente) return existente
  if (!crear) return { id: '00000000-0000-0000-0000-000000000000', nombre: CLIENTE_NOMBRE, portal_descuento: null }
  // Se crea solo la primera vez. Datos fiscales (CUIT, razón social, tipo)
  // se completan a mano en Clientes antes de facturarle.
  const { data, error } = await supabase.from('clientes')
    .insert([{ empresa: EMPRESA, nombre: CLIENTE_NOMBRE, notas: 'Creado automáticamente para los pedidos de la carta de 125cc.' }])
    .select('id, nombre, portal_descuento').single()
  if (error) throw new Error(error.message)
  return data
}

interface ProdLaVid { id: string; nombre: string; bodega: string | null; categoria: string | null; varietal: string | null; precio_venta: number; stock: number | null }
const COLS = 'id, nombre, bodega, categoria, varietal, precio_venta, stock, empresa, gemelo_id'

// El Calendario de Carta guarda el id del catálogo (puede ser la fila de
// Aroma o la de La Vid, son gemelas). El pedido va a nombre de La Vid, así
// que se usa siempre la fila de La Vid: la propia, o la gemela.
async function resolverProductos(items: { vino_id: string; nombre: string }[]) {
  const ids = Array.from(new Set(items.map(i => String(i.vino_id)).filter(id => UUID.test(id))))
  const porId = new Map<string, ProdLaVid>()
  if (ids.length) {
    const { data: filas } = await supabase.from('productos').select(COLS).in('id', ids)
    const gemelos: string[] = []
    for (const f of filas || []) {
      if (f.empresa === EMPRESA) porId.set(f.id, f)
      else if (f.gemelo_id) gemelos.push(f.gemelo_id)
    }
    if (gemelos.length) {
      const { data: lv } = await supabase.from('productos').select(COLS).in('id', gemelos).eq('empresa', EMPRESA)
      const porGemelo = new Map((lv || []).map(p => [p.id, p]))
      for (const f of filas || []) if (f.empresa !== EMPRESA && f.gemelo_id && porGemelo.has(f.gemelo_id)) porId.set(f.id, porGemelo.get(f.gemelo_id)!)
    }
  }
  // Sin id que matchee (vino cargado a mano en 125cc, id viejo): por nombre exacto.
  const sinId = items.filter(i => !porId.has(String(i.vino_id)))
  const porNombre = new Map<string, ProdLaVid>()
  if (sinId.length) {
    const { data: lv } = await supabase.from('productos').select(COLS).eq('empresa', EMPRESA).eq('activo', true)
    for (const p of lv || []) porNombre.set(norm(p.nombre), p)
  }
  return (i: { vino_id: string; nombre: string }) => porId.get(String(i.vino_id)) || porNombre.get(norm(i.nombre))
}

async function precios(clienteId: string, descuentoCliente: number | null) {
  const [{ data: reglas }, { data: delCliente }, { data: general }] = await Promise.all([
    supabase.from('portal_reglas').select('nivel, clave, descuento, oculto'),
    supabase.from('portal_reglas_cliente').select('nivel, clave, descuento').eq('cliente_id', clienteId),
    supabase.from('app_config').select('valor').eq('clave', 'portal_descuento_general').maybeSingle(),
  ])
  const idx = indexarReglas((reglas || []) as ReglaPortal[])
  const idxCliente = indexarReglasCliente(delCliente || [])
  const base = descuentoCliente != null ? Number(descuentoCliente) : Number(general?.valor ?? 0)
  return (p: ProdLaVid) => precioPortal({ ...p, precio_venta: Number(p.precio_venta) || 0 }, idx, base, idxCliente).precio
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return err('No autorizado', 401)
  const body = await req.json().catch(() => ({}))
  const inicio = String(body.inicio || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return err('Falta la fecha de inicio de la quincena')
  const label = String(body.label || `Quincena del ${inicio}`).slice(0, 80)
  const entrada = (Array.isArray(body.items) ? body.items : [])
    .map((i: { vino_id?: unknown; nombre?: unknown; cantidad?: unknown }) => ({ vino_id: String(i.vino_id ?? ''), nombre: String(i.nombre ?? '').slice(0, 200), cantidad: Math.floor(Number(i.cantidad)) }))
    .filter((i: { cantidad: number }) => i.cantidad > 0)
  if (!entrada.length) return err('No hay vinos con cajas cargadas')
  const dryRun = body.dry_run === true

  try {
    const cliente = await cliente125cc(!dryRun)
    const resolver = await resolverProductos(entrada)
    const precioDe = await precios(cliente.id, cliente.portal_descuento)

    const items: { producto_id: string; nombre: string; cantidad: number; precio_unitario: number }[] = []
    const omitidos: string[] = []
    for (const i of entrada) {
      const p = resolver(i)
      if (!p) { omitidos.push(i.nombre); continue }
      const ya = items.find(x => x.producto_id === p.id)
      if (ya) { ya.cantidad += i.cantidad; continue }
      items.push({ producto_id: p.id, nombre: p.nombre, cantidad: i.cantidad, precio_unitario: precioDe(p) })
    }
    if (!items.length) return err('Ninguno de los vinos está en el catálogo de La Vid')
    const total = items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)
    if (dryRun) return NextResponse.json({ ok: true, dry_run: true, items, total, omitidos })

    // La entrega va el día antes de que arranque la quincena.
    const d = new Date(`${inicio}T12:00:00`); d.setDate(d.getDate() - 1)
    const fecha_entrega = d.toISOString().slice(0, 10)
    const notas = `Carta 125cc — ${label}${omitidos.length ? `\nSin producto en La Vid: ${omitidos.join(', ')}` : ''}\n${marca(inicio)}`

    const { data: previos } = await supabase.from('pedidos')
      .select('id, numero, estado').eq('empresa', EMPRESA).eq('origen', '125cc').neq('estado', 'cancelado')
      .like('notas', `%${marca(inicio)}%`)
    const previo = previos?.[0]
    if (previo && previo.estado !== 'pendiente') {
      return err(`El pedido ${previo.numero} de esta quincena ya se procesó en gestión (${previo.estado}). Para cambiarlo, hacelo desde gestión.`, 409)
    }

    if (previo) {
      const { data, error } = await supabase.from('pedidos')
        .update({ items, subtotal: total, total, notas, fecha_entrega })
        .eq('id', previo.id).eq('estado', 'pendiente').select('id, numero, estado').single()
      if (error || !data) return err('El pedido cambió de estado mientras se actualizaba; volvé a intentar', 409)
      return NextResponse.json({ ok: true, actualizado: true, pedido: data, items: items.length, total, omitidos })
    }

    // Mismo esquema de numeración que /api/pedidos (PED-000001 por empresa).
    const { count } = await supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('empresa', EMPRESA)
    const numero = `PED-${String((count || 0) + 1).padStart(6, '0')}`
    const { data, error } = await supabase.from('pedidos').insert([{
      empresa: EMPRESA, numero, origen: '125cc', estado: 'pendiente',
      cliente_id: cliente.id, cliente_nombre: cliente.nombre, vendedor_nombre: 'Carta 125cc',
      items, subtotal: total, descuento: 0, total, fecha_entrega, notas,
    }]).select('id, numero, estado').single()
    if (error) return err(error.message, 500)
    return NextResponse.json({ ok: true, actualizado: false, pedido: data, items: items.length, total, omitidos })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Error interno', 500)
  }
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return err('No autorizado', 401)
  const desde = req.nextUrl.searchParams.get('desde') || '2000-01-01'
  const { data, error } = await supabase.from('pedidos')
    .select('numero, estado, notas, total, venta_id, consignacion_id, created_at')
    .eq('empresa', EMPRESA).eq('origen', '125cc').neq('estado', 'cancelado')
    .order('created_at', { ascending: false })
  if (error) return err(error.message, 500)

  const [{ data: vs }, { data: cs }] = await Promise.all([
    supabase.from('ventas').select('id, numero').in('id', (data || []).map(p => p.venta_id).filter(Boolean)),
    supabase.from('consignaciones').select('id, numero').in('id', (data || []).map(p => p.consignacion_id).filter(Boolean)),
  ])
  const venta = new Map((vs || []).map(v => [v.id, v.numero]))
  const cons = new Map((cs || []).map(c => [c.id, c.numero]))

  const porQuincena: Record<string, unknown> = {}
  for (const p of data || []) {
    const m = /\[carta-125cc:(\d{4}-\d{2}-\d{2})\]/.exec(p.notas || '')
    if (!m || m[1] < desde || porQuincena[m[1]]) continue // el más nuevo por quincena
    porQuincena[m[1]] = {
      numero: p.numero, estado: p.estado, total: Number(p.total) || 0,
      como: p.venta_id ? 'venta' : p.consignacion_id ? 'consignacion' : null,
      comprobante: (p.venta_id && venta.get(p.venta_id)) || (p.consignacion_id && cons.get(p.consignacion_id)) || null,
    }
  }
  return NextResponse.json({ pedidos: porQuincena })
}
