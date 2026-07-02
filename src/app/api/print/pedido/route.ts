export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

const EMPRESAS_DATA: Record<string, { nombre: string; cuit: string; domicilio: string; telefono: string }> = {
  aroma: { nombre: 'Aroma de Vid', cuit: '20-26600984-5', domicilio: 'Roca 2787, Mar del Plata', telefono: '(0223) 491-1705' },
  lavid: { nombre: 'MDP La Vid Consultora S.R.L.', cuit: '30-71762144-8', domicilio: 'Roca 2787, Mar del Plata', telefono: '(0223) 685-0870' },
}

function errorHtml(msg: string) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Error</title>
<style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#F5F1EC;}
.box{background:#fff;border:1px solid #DDD0C0;border-radius:8px;padding:40px;text-align:center;max-width:400px;}
h2{color:#800000;margin:0 0 12px;}p{color:#6B5D55;font-size:14px;}</style></head>
<body><div class="box"><h2>Error</h2><p>${msg}</p></div></body></html>`
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const empresaKey = req.nextUrl.searchParams.get('empresa') || 'aroma'

  if (!id) return new Response(errorHtml('Falta el parámetro id.'), { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  const { data: pedido, error } = await supabase.from('pedidos').select('*').eq('id', id).single()
  if (error || !pedido) return new Response(errorHtml(`No se encontró el pedido con id ${id}.`), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  let cliente: { cuit?: string; direccion?: string; telefono?: string; email?: string } | null = null
  if (pedido.cliente_id) {
    const { data: cl } = await supabase.from('clientes').select('cuit, direccion, telefono, email').eq('id', pedido.cliente_id).single()
    if (cl) cliente = cl
  }

  const empresa = EMPRESAS_DATA[empresaKey] ?? EMPRESAS_DATA['aroma']

  let items: Array<{ nombre: string; cantidad: number; precio_unitario?: number }> = []
  try { items = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : (pedido.items ?? []) } catch { items = [] }

  const fecha = pedido.created_at ? new Date(pedido.created_at).toLocaleDateString('es-AR') : ''
  const fechaEntrega = pedido.fecha_entrega ? new Date(pedido.fecha_entrega + 'T12:00:00').toLocaleDateString('es-AR') : null

  const totalBot = items.reduce((s, it) => s + (it.cantidad ?? 0), 0)
  const cajasTotal = Math.floor(totalBot / 6)
  const restoTotal = totalBot % 6
  const resumenUnidades = totalBot === 0 ? '' : cajasTotal === 0
    ? `${totalBot} botella${totalBot !== 1 ? 's' : ''}`
    : restoTotal === 0
      ? `${totalBot} botellas · ${cajasTotal} caja${cajasTotal !== 1 ? 's' : ''} de 6`
      : `${totalBot} botellas · ${cajasTotal} caja${cajasTotal !== 1 ? 's' : ''} de 6 + ${restoTotal} bot`

  const ESTADO_COLOR: Record<string, string> = {
    pendiente:  'background:rgba(160,112,16,0.13);color:#A07010;border:1px solid rgba(160,112,16,0.3)',
    confirmado: 'background:rgba(43,94,160,0.12);color:#2B5EA0;border:1px solid rgba(43,94,160,0.3)',
    entregado:  'background:rgba(45,122,79,0.12);color:#2D7A4F;border:1px solid rgba(45,122,79,0.3)',
    cancelado:  'background:rgba(160,60,60,0.10);color:#8A3030;border:1px solid rgba(160,60,60,0.25)',
  }
  const estadoStyle = ESTADO_COLOR[pedido.estado] ?? ESTADO_COLOR['pendiente']

  const itemsRows = items.map((it, i) => `
    <tr>
      <td style="text-align:center;color:#6B5D55;">${i + 1}</td>
      <td>${it.nombre ?? ''}</td>
      <td style="text-align:center;font-weight:600;">${it.cantidad}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pedido ${pedido.numero ?? ''}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4 portrait; margin: 16mm 18mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1A1210; background: #fff; margin: 0; padding: 0; font-size: 13px; line-height: 1.4; }
    .page { width: 100%; }

    /* toolbar */
    .toolbar { position: fixed; top: 12px; right: 16px; display: flex; gap: 8px; z-index: 100; }
    .toolbar button { padding: 8px 18px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-family: inherit; font-weight: 600; }
    .btn-print { background: #800000; color: #fff; }
    .btn-close  { background: #F5F1EC; border: 1px solid #DDD0C0 !important; color: #6B5D55; }

    /* header */
    .header { display: grid; grid-template-columns: 1fr auto; align-items: stretch; border: 2px solid #800000; border-radius: 6px; overflow: hidden; margin-bottom: 14px; }
    .header-empresa { padding: 14px 18px; border-right: 2px solid #800000; }
    .empresa-nombre { font-size: 18px; font-weight: 700; color: #800000; margin: 0 0 3px; }
    .empresa-sub { font-size: 10.5px; color: #6B5D55; line-height: 1.6; }
    .header-doc { background: #800000; color: #fff; padding: 14px 22px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 160px; }
    .doc-tipo { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.85; margin-bottom: 4px; }
    .doc-num  { font-size: 20px; font-weight: 700; letter-spacing: 0.02em; margin-bottom: 4px; }
    .doc-fecha { font-size: 11px; opacity: 0.9; }
    .estado-badge { display: inline-block; margin-top: 6px; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; ${estadoStyle}; }

    /* info grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
    .info-box { border: 1px solid #DDD0C0; border-radius: 5px; overflow: hidden; }
    .info-box-title { background: #F0EBE5; border-bottom: 1px solid #DDD0C0; padding: 4px 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8A7068; }
    .info-box-body { padding: 8px 12px; font-size: 12px; }
    .info-row { margin-bottom: 3px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { font-size: 9.5px; color: #8A7068; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-val { color: #1A1210; }

    /* table */
    table { width: 100%; border-collapse: collapse; }
    thead th { background: #800000; color: #fff; padding: 7px 10px; font-size: 10.5px; font-weight: 600; text-align: left; }
    thead th:first-child { border-radius: 3px 0 0 0; }
    thead th:last-child  { border-radius: 0 3px 0 0; }
    tbody td { padding: 6px 10px; border-bottom: 1px solid #E8E0D8; font-size: 12px; vertical-align: middle; }
    tbody tr:nth-child(even) td { background: #FAF7F4; }
    tbody tr:last-child td { border-bottom: none; }
    .resumen-unidades { font-size: 10.5px; color: #6B5D55; text-align: right; margin-top: 5px; padding-right: 4px; }

    /* firmas */
    .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 40px; }
    .firma-box { text-align: center; }
    .firma-linea { border-top: 1px solid #6B5D55; margin-bottom: 5px; }
    .firma-label { font-size: 10px; color: #6B5D55; }

    /* footer */
    .footer { margin-top: 24px; border-top: 1px solid #DDD0C0; padding-top: 8px; text-align: center; font-size: 9.5px; color: #A89888; }

    @media print { .toolbar { display: none !important; } body { background: #fff; } }
  </style>
</head>
<body>

<div class="toolbar">
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
  <button class="btn-close" onclick="window.close()">✕ Cerrar</button>
</div>

<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-empresa">
      <div class="empresa-nombre">${empresa.nombre}</div>
      <div class="empresa-sub">
        ${empresa.domicilio}<br>
        Tel: ${empresa.telefono} &nbsp;·&nbsp; CUIT: ${empresa.cuit}
      </div>
    </div>
    <div class="header-doc">
      <div class="doc-tipo">Pedido</div>
      <div class="doc-num">${pedido.numero ?? ''}</div>
      <div class="doc-fecha">${fecha}</div>
      <span class="estado-badge">${pedido.estado ?? ''}</span>
    </div>
  </div>

  <!-- INFO GRID -->
  <div class="info-grid">
    <div class="info-box">
      <div class="info-box-title">Cliente</div>
      <div class="info-box-body">
        <div class="info-row"><span class="info-val" style="font-weight:600;font-size:13px;">${pedido.cliente_nombre || 'Consumidor Final'}</span></div>
        ${cliente?.cuit ? `<div class="info-row"><span class="info-label">CUIT: </span><span class="info-val" style="font-family:monospace;">${cliente.cuit}</span></div>` : ''}
        ${cliente?.direccion ? `<div class="info-row"><span class="info-label">Dirección: </span><span class="info-val">${cliente.direccion}</span></div>` : ''}
        ${cliente?.telefono ? `<div class="info-row"><span class="info-label">Tel: </span><span class="info-val">${cliente.telefono}</span></div>` : ''}
        ${cliente?.email ? `<div class="info-row"><span class="info-val">${cliente.email}</span></div>` : ''}
      </div>
    </div>
    <div class="info-box">
      <div class="info-box-title">Datos del pedido</div>
      <div class="info-box-body">
        ${fechaEntrega ? `<div class="info-row"><span class="info-label">Entrega: </span><span class="info-val" style="font-weight:600;">${fechaEntrega}</span></div>` : ''}
        ${pedido.vendedor_nombre ? `<div class="info-row"><span class="info-label">Vendedor: </span><span class="info-val">${pedido.vendedor_nombre}</span></div>` : ''}
        ${pedido.notas ? `<div class="info-row"><span class="info-label">Obs.: </span><span class="info-val">${pedido.notas}</span></div>` : '<div class="info-row" style="color:#A89888;font-size:11px;font-style:italic;">Sin observaciones</div>'}
      </div>
    </div>
  </div>

  <!-- TABLA -->
  <table>
    <thead>
      <tr>
        <th style="width:26px;text-align:center;">#</th>
        <th>Descripción</th>
        <th style="width:80px;text-align:center;">Cant.</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows || '<tr><td colspan="3" style="text-align:center;color:#A89888;padding:20px;">Sin ítems</td></tr>'}
    </tbody>
  </table>
  ${resumenUnidades ? `<div class="resumen-unidades">Total: <strong>${resumenUnidades}</strong></div>` : ''}

  <!-- FIRMAS -->
  <div class="firmas">
    <div class="firma-box">
      <div class="firma-linea"></div>
      <div class="firma-label">Firma y aclaración del cliente</div>
    </div>
    <div class="firma-box">
      <div class="firma-linea"></div>
      <div class="firma-label">Firma y sello empresa</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    ${empresa.nombre} &nbsp;·&nbsp; ${empresa.domicilio} &nbsp;·&nbsp; CUIT: ${empresa.cuit} &nbsp;·&nbsp; Tel: ${empresa.telefono}
  </div>

</div>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
