export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

const EMPRESAS_DATA: Record<string, { nombre: string; cuit: string; domicilio: string; telefono: string }> = {
  aroma: { nombre: 'Aroma de Vid', cuit: '20-26600984-5', domicilio: 'Roca 2787, Mar del Plata', telefono: '(0223) 491-1705' },
  lavid: { nombre: 'MDP La Vid Consultora S.R.L.', cuit: '30-71762144-8', domicilio: 'Roca 2787, Mar del Plata', telefono: '(0223) 685-0870' },
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  enviado:   'Enviado',
  recibido:  'Recibido',
  cancelado: 'Cancelado',
}

const CONDICION_LABEL: Record<string, string> = {
  contado:  'Contado',
  '30_dias': '30 días',
  '60_dias': '60 días',
  '90_dias': '90 días',
}

const ESTADO_PAGO_LABEL: Record<string, string> = {
  pagado:      'Pagado',
  pendiente:   'Pago pendiente',
  sin_factura: 'Sin factura',
}

const ESTADO_COLOR: Record<string, string> = {
  pendiente: 'background:rgba(160,112,16,0.13);color:#A07010;border:1px solid rgba(160,112,16,0.3)',
  enviado:   'background:rgba(43,94,160,0.12);color:#2B5EA0;border:1px solid rgba(43,94,160,0.3)',
  recibido:  'background:rgba(45,122,79,0.12);color:#2D7A4F;border:1px solid rgba(45,122,79,0.3)',
  cancelado: 'background:rgba(160,60,60,0.10);color:#8A3030;border:1px solid rgba(160,60,60,0.25)',
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

  const { data: compra, error } = await supabase.from('compras').select('*').eq('id', id).single()
  if (error || !compra) return new Response(errorHtml(`No se encontró la compra con id ${id}.`), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  const empresa = EMPRESAS_DATA[empresaKey] ?? EMPRESAS_DATA['aroma']

  let items: Array<{ nombre: string; cantidad: number; precio_unitario?: number; subtotal?: number; cajas?: number; unidades_por_caja?: number }> = []
  try { items = typeof compra.items === 'string' ? JSON.parse(compra.items) : (compra.items ?? []) } catch { items = [] }

  const moneda = (n: number) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fecha = compra.created_at ? new Date(compra.created_at).toLocaleDateString('es-AR') : ''
  const fechaEsperada = compra.fecha_esperada ? new Date(compra.fecha_esperada + 'T12:00:00').toLocaleDateString('es-AR') : null
  const fechaFactura = compra.fecha_factura ? new Date(compra.fecha_factura + 'T12:00:00').toLocaleDateString('es-AR') : null
  const fechaVencimiento = compra.fecha_vencimiento ? new Date(compra.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-AR') : null
  const fechaPago = compra.fecha_pago ? new Date(compra.fecha_pago + 'T12:00:00').toLocaleDateString('es-AR') : null

  const estadoStyle = ESTADO_COLOR[compra.estado] ?? ESTADO_COLOR['pendiente']
  const esDeuda = (compra.numero as string).startsWith('DEU-')
  const tipoLabel = esDeuda ? 'Deuda / Factura a pagar' : 'Orden de Compra'

  const totalBot = items.reduce((s, it) => s + (it.cantidad ?? 0), 0)
  const cajasTotal = Math.floor(totalBot / 6)
  const restoTotal = totalBot % 6
  const resumenUnidades = totalBot === 0 ? '' : cajasTotal === 0
    ? `${totalBot} botella${totalBot !== 1 ? 's' : ''}`
    : restoTotal === 0
      ? `${totalBot} botellas · ${cajasTotal} caja${cajasTotal !== 1 ? 's' : ''} de 6`
      : `${totalBot} botellas · ${cajasTotal} caja${cajasTotal !== 1 ? 's' : ''} de 6 + ${restoTotal} bot`

  const itemsRows = items.map((it, i) => `
    <tr>
      <td style="text-align:center;color:#6B5D55;">${i + 1}</td>
      <td>${it.nombre ?? ''}</td>
      <td style="text-align:center;font-weight:600;">${it.cajas && it.cajas > 1 ? `${it.cajas} caj.` : it.cantidad}</td>
      <td style="text-align:center;">${it.unidades_por_caja && it.unidades_por_caja > 1 ? it.cantidad : '—'}</td>
      <td style="text-align:right;">${it.precio_unitario != null ? moneda(it.precio_unitario) : '—'}</td>
      <td style="text-align:right;font-weight:600;">${it.subtotal != null ? moneda(it.subtotal) : '—'}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${tipoLabel} ${compra.numero ?? ''}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4 portrait; margin: 16mm 18mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1A1210; background: #fff; margin: 0; padding: 0; font-size: 13px; line-height: 1.4; }
    .page { width: 100%; }

    .toolbar { position: fixed; top: 12px; right: 16px; display: flex; gap: 8px; z-index: 100; }
    .toolbar button { padding: 8px 18px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-family: inherit; font-weight: 600; }
    .btn-print { background: #800000; color: #fff; }
    .btn-close  { background: #F5F1EC; border: 1px solid #DDD0C0 !important; color: #6B5D55; }

    .header { display: grid; grid-template-columns: 1fr auto; align-items: stretch; border: 2px solid #800000; border-radius: 6px; overflow: hidden; margin-bottom: 14px; }
    .header-empresa { padding: 14px 18px; border-right: 2px solid #800000; }
    .empresa-nombre { font-size: 18px; font-weight: 700; color: #800000; margin: 0 0 3px; }
    .empresa-sub { font-size: 10.5px; color: #6B5D55; line-height: 1.6; }
    .header-doc { background: #800000; color: #fff; padding: 14px 22px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 170px; }
    .doc-tipo  { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.85; margin-bottom: 4px; }
    .doc-num   { font-size: 20px; font-weight: 700; letter-spacing: 0.02em; margin-bottom: 4px; }
    .doc-fecha { font-size: 11px; opacity: 0.9; }
    .estado-badge { display: inline-block; margin-top: 6px; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; ${estadoStyle}; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
    .info-box { border: 1px solid #DDD0C0; border-radius: 5px; overflow: hidden; }
    .info-box-title { background: #F0EBE5; border-bottom: 1px solid #DDD0C0; padding: 4px 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8A7068; }
    .info-box-body { padding: 8px 12px; font-size: 12px; }
    .info-row { margin-bottom: 3px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { font-size: 9.5px; color: #8A7068; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-val { color: #1A1210; }

    table { width: 100%; border-collapse: collapse; }
    thead th { background: #800000; color: #fff; padding: 7px 10px; font-size: 10.5px; font-weight: 600; text-align: left; }
    thead th:first-child { border-radius: 3px 0 0 0; }
    thead th:last-child  { border-radius: 0 3px 0 0; }
    tbody td { padding: 6px 10px; border-bottom: 1px solid #E8E0D8; font-size: 12px; vertical-align: middle; }
    tbody tr:nth-child(even) td { background: #FAF7F4; }
    tbody tr:last-child td { border-bottom: none; }
    .resumen-unidades { font-size: 10.5px; color: #6B5D55; text-align: right; margin-top: 5px; padding-right: 4px; }

    .bottom-grid { display: grid; grid-template-columns: 1fr auto; gap: 16px; margin-top: 10px; align-items: start; }
    .factura-box { border: 1px solid #DDD0C0; border-radius: 5px; overflow: hidden; }
    .totales-box { border: 1px solid #DDD0C0; border-radius: 5px; overflow: hidden; min-width: 200px; }
    .totales-row { display: flex; justify-content: space-between; padding: 5px 12px; font-size: 12px; border-bottom: 1px solid #E8E0D8; }
    .totales-row:last-child { border-bottom: none; }
    .totales-row.total-final { background: #800000; color: #fff; font-size: 14px; font-weight: 700; padding: 8px 12px; }

    .notas-box { background: #FAF7F4; border: 1px solid #DDD0C0; border-left: 3px solid #C0A898; border-radius: 4px; padding: 8px 12px; font-size: 11.5px; color: #6B5D55; margin-top: 10px; }

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
      <div class="doc-tipo">${tipoLabel}</div>
      <div class="doc-num">${compra.numero ?? ''}</div>
      <div class="doc-fecha">${fecha}</div>
      <span class="estado-badge">${ESTADO_LABEL[compra.estado] ?? compra.estado}</span>
    </div>
  </div>

  <!-- INFO GRID -->
  <div class="info-grid">
    <div class="info-box">
      <div class="info-box-title">Proveedor</div>
      <div class="info-box-body">
        <div class="info-row"><span class="info-val" style="font-weight:600;font-size:13px;">${compra.proveedor_nombre}</span></div>
      </div>
    </div>
    <div class="info-box">
      <div class="info-box-title">Datos de la orden</div>
      <div class="info-box-body">
        <div class="info-row"><span class="info-label">Fecha emisión: </span><span class="info-val">${fecha}</span></div>
        ${fechaEsperada ? `<div class="info-row"><span class="info-label">Entrega esperada: </span><span class="info-val" style="font-weight:600;">${fechaEsperada}</span></div>` : ''}
        ${compra.notas ? `<div class="info-row"><span class="info-label">Obs.: </span><span class="info-val">${compra.notas}</span></div>` : ''}
      </div>
    </div>
  </div>

  <!-- TABLA ÍTEMS -->
  <table>
    <thead>
      <tr>
        <th style="width:26px;text-align:center;">#</th>
        <th>Descripción</th>
        <th style="width:70px;text-align:center;">Cajas</th>
        <th style="width:70px;text-align:center;">Unidades</th>
        <th style="width:110px;text-align:right;">Precio unit.</th>
        <th style="width:110px;text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows || '<tr><td colspan="6" style="text-align:center;color:#A89888;padding:16px;">Sin ítems</td></tr>'}
    </tbody>
  </table>
  ${resumenUnidades ? `<div class="resumen-unidades">Total: <strong>${resumenUnidades}</strong></div>` : ''}

  <!-- TOTALES + FACTURA -->
  <div class="bottom-grid">
    ${compra.nro_factura || compra.condicion_pago || compra.estado_pago ? `
    <div class="factura-box">
      <div class="info-box-title">Datos de factura y pago</div>
      <div class="info-box-body">
        ${compra.nro_factura ? `<div class="info-row"><span class="info-label">Nro. factura: </span><span class="info-val" style="font-family:monospace;">${compra.nro_factura}</span></div>` : ''}
        ${fechaFactura ? `<div class="info-row"><span class="info-label">Fecha factura: </span><span class="info-val">${fechaFactura}</span></div>` : ''}
        ${compra.condicion_pago ? `<div class="info-row"><span class="info-label">Condición: </span><span class="info-val">${CONDICION_LABEL[compra.condicion_pago] ?? compra.condicion_pago}</span></div>` : ''}
        ${fechaVencimiento ? `<div class="info-row"><span class="info-label">Vencimiento: </span><span class="info-val" style="font-weight:600;">${fechaVencimiento}</span></div>` : ''}
        ${compra.estado_pago ? `<div class="info-row"><span class="info-label">Estado pago: </span><span class="info-val">${ESTADO_PAGO_LABEL[compra.estado_pago] ?? compra.estado_pago}</span></div>` : ''}
        ${compra.estado_pago === 'pagado' && compra.monto_pagado ? `<div class="info-row"><span class="info-label">Monto pagado: </span><span class="info-val" style="font-weight:600;">${moneda(compra.monto_pagado)}</span></div>` : ''}
        ${fechaPago ? `<div class="info-row"><span class="info-label">Fecha pago: </span><span class="info-val">${fechaPago}</span></div>` : ''}
        ${compra.notas_pago ? `<div class="info-row"><span class="info-label">Notas pago: </span><span class="info-val">${compra.notas_pago}</span></div>` : ''}
      </div>
    </div>` : '<div></div>'}
    <div class="totales-box">
      <div class="totales-row total-final"><span>TOTAL</span><span>${moneda(compra.total ?? 0)}</span></div>
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
