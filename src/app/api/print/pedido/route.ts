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

  const itemsRows = items.map((it, i) => `
    <tr>
      <td style="text-align:center;color:#6B5D55;">${i + 1}</td>
      <td>${it.nombre ?? ''}</td>
      <td style="text-align:center;">${it.cantidad}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pedido ${pedido.numero ?? ''}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4; margin: 15mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1A1210; background: #FFFFFF; margin: 0; padding: 0; }
    .page { max-width: 720px; margin: 0 auto; padding: 32px 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #800000; padding-bottom: 20px; margin-bottom: 24px; }
    .empresa-nombre { font-size: 20px; font-weight: 700; color: #800000; margin: 4px 0 2px; }
    .empresa-sub { font-size: 11px; color: #6B5D55; line-height: 1.5; }
    .doc-info { text-align: right; }
    .doc-tipo { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6B5D55; }
    .doc-num { font-size: 22px; font-weight: 700; color: #800000; margin: 2px 0; }
    .doc-fecha { font-size: 12px; color: #6B5D55; }
    .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #A89888; margin: 20px 0 6px; }
    .cliente-box { background: #F5F1EC; border: 1px solid #DDD0C0; border-radius: 6px; padding: 12px 16px; font-size: 13px; display: flex; flex-wrap: wrap; gap: 8px 24px; }
    .cliente-field label { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #A89888; margin-bottom: 2px; }
    .cliente-field span { color: #1A1210; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    thead th { background: #800000; color: #FFFFFF; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; }
    thead th:first-child { border-radius: 4px 0 0 0; }
    thead th:last-child { border-radius: 0 4px 0 0; }
    tbody td { padding: 7px 12px; border-bottom: 1px solid #DDD0C0; font-size: 12px; vertical-align: middle; }
    tbody tr:nth-child(even) td { background: #F5F1EC; }
    .estado-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; background: rgba(212,130,10,0.12); color: #A07010; border: 1px solid rgba(212,130,10,0.3); }
    .toolbar { position: fixed; top: 12px; right: 16px; display: flex; gap: 8px; z-index: 100; }
    .toolbar button { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-family: inherit; font-weight: 600; }
    .btn-print { background: #800000; color: #FFF; }
    .btn-close { background: #F5F1EC; border: 1px solid #DDD0C0 !important; color: #6B5D55; }
    .footer { margin-top: 32px; border-top: 1px solid #DDD0C0; padding-top: 12px; text-align: center; font-size: 10px; color: #A89888; }
    @media print { .toolbar { display: none !important; } }
  </style>
</head>
<body>

<div class="toolbar">
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
  <button class="btn-close" onclick="window.close()">✕ Cerrar</button>
</div>

<div class="page">

  <div class="header">
    <div>
      <div style="font-size:28px;line-height:1;">🍷</div>
      <div class="empresa-nombre">${empresa.nombre}</div>
      <div class="empresa-sub">${empresa.domicilio}<br>Tel: ${empresa.telefono} &nbsp;·&nbsp; CUIT: ${empresa.cuit}</div>
    </div>
    <div class="doc-info">
      <div class="doc-tipo">Pedido</div>
      <div class="doc-num">${pedido.numero ?? ''}</div>
      <div class="doc-fecha">Fecha: ${fecha}</div>
      ${fechaEntrega ? `<div class="doc-fecha" style="margin-top:4px;">Entrega: <strong>${fechaEntrega}</strong></div>` : ''}
      <div style="margin-top:8px;"><span class="estado-badge">${pedido.estado ?? ''}</span></div>
    </div>
  </div>

  <div class="section-title">Datos del pedido</div>
  <div class="cliente-box">
    <div class="cliente-field"><label>Cliente</label><span>${pedido.cliente_nombre || 'Consumidor Final'}</span></div>
    ${cliente?.cuit ? `<div class="cliente-field"><label>CUIT</label><span style="font-family:monospace;">${cliente.cuit}</span></div>` : ''}
    ${cliente?.direccion ? `<div class="cliente-field"><label>Dirección</label><span>${cliente.direccion}</span></div>` : ''}
    ${cliente?.telefono ? `<div class="cliente-field"><label>Teléfono</label><span>${cliente.telefono}</span></div>` : ''}
    ${cliente?.email ? `<div class="cliente-field"><label>Email</label><span>${cliente.email}</span></div>` : ''}
    ${pedido.vendedor_nombre ? `<div class="cliente-field"><label>Vendedor</label><span>${pedido.vendedor_nombre}</span></div>` : ''}
    ${pedido.notas ? `<div class="cliente-field" style="flex-basis:100%;"><label>Notas</label><span>${pedido.notas}</span></div>` : ''}
  </div>

  <div class="section-title">Detalle</div>
  <table>
    <thead>
      <tr>
        <th style="width:28px;text-align:center;">#</th>
        <th>Descripción</th>
        <th style="width:80px;text-align:center;">Cant.</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows || '<tr><td colspan="3" style="text-align:center;color:#A89888;padding:20px;">Sin ítems</td></tr>'}
    </tbody>
  </table>

  <div class="footer">${empresa.nombre} &nbsp;·&nbsp; ${empresa.domicilio} &nbsp;·&nbsp; CUIT: ${empresa.cuit}</div>

</div>
</body>
</html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
