export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

const EMPRESAS_DATA: Record<string, { nombre: string; cuit: string; domicilio: string; telefono: string }> = {
  aroma: { nombre: 'Aroma de Vid', cuit: '20-26600984-5', domicilio: 'Roca 2787, Mar del Plata', telefono: '(0223) 491-1705' },
  lavid: { nombre: 'MDP La Vid Consultora S.R.L.', cuit: '30-71762144-8', domicilio: 'Roca 2787, Mar del Plata', telefono: '(0223) 685-0870' },
}

const TIPO_LABEL: Record<string, string> = {
  presupuesto: 'Presupuesto',
  remito: 'Remito',
  factura: 'Factura',
  devolucion: 'Nota de Devolución',
}

const ESTADO_PAGO_LABEL: Record<string, string> = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  cuenta_corriente: 'Cuenta Corriente',
}

function errorHtml(msg: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Error</title>
<style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#F5F1EC;}
.box{background:#fff;border:1px solid #DDD0C0;border-radius:8px;padding:40px;text-align:center;max-width:400px;}
h2{color:#800000;margin:0 0 12px;}p{color:#6B5D55;font-size:14px;}</style></head>
<body><div class="box"><h2>Error</h2><p>${msg}</p></div></body></html>`
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const empresaKey = req.nextUrl.searchParams.get('empresa') || 'aroma'

  if (!id) {
    return new Response(errorHtml('Falta el parámetro id.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const { data: venta, error } = await supabase
    .from('ventas')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !venta) {
    return new Response(errorHtml(`No se encontró la venta con id ${id}.`), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // Fetch client data if linked
  let cliente: { cuit?: string; direccion?: string; telefono?: string; email?: string } | null = null
  if (venta.cliente_id) {
    const { data: cl } = await supabase
      .from('clientes')
      .select('cuit, direccion, telefono, email')
      .eq('id', venta.cliente_id)
      .single()
    if (cl) cliente = cl
  }

  const empresa = EMPRESAS_DATA[empresaKey] ?? EMPRESAS_DATA['aroma']
  const tipoLabel = TIPO_LABEL[venta.tipo] ?? venta.tipo ?? 'Comprobante'

  // items can be stored as JSON string or already parsed
  let items: Array<{ nombre: string; cantidad: number; precio_unitario: number; subtotal: number; descuento?: number }> = []
  try {
    items = typeof venta.items === 'string' ? JSON.parse(venta.items) : (venta.items ?? [])
  } catch {
    items = []
  }

  const fecha = venta.fecha
    ? new Date(venta.fecha).toLocaleDateString('es-AR')
    : venta.created_at
      ? new Date(venta.created_at).toLocaleDateString('es-AR')
      : ''

  const subtotal: number = venta.subtotal ?? 0
  const descuento: number = venta.descuento ?? 0
  const total: number = venta.total ?? 0
  const estadoPago = venta.estado_pago ? (ESTADO_PAGO_LABEL[venta.estado_pago] ?? venta.estado_pago) : null

  // IVA 21% discriminado sobre el total final
  const netoGravado = parseFloat((total / 1.21).toFixed(2))
  const importeIVA  = parseFloat((total - netoGravado).toFixed(2))
  const moneda = (n: number) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // Resumen de unidades al pie de la tabla
  const totalBot = items.reduce((s, it) => s + (it.cantidad ?? 0), 0)
  const cajasTotal = Math.floor(totalBot / 6)
  const restoTotal = totalBot % 6
  const resumenUnidades = cajasTotal === 0
    ? `${totalBot} botella${totalBot !== 1 ? 's' : ''}`
    : restoTotal === 0
      ? `${totalBot} botellas · ${cajasTotal} caja${cajasTotal !== 1 ? 's' : ''} de 6`
      : `${totalBot} botellas · ${cajasTotal} caja${cajasTotal !== 1 ? 's' : ''} de 6 + ${restoTotal} bot`

  const itemsRows = items
    .map(
      (it, i) => `
      <tr>
        <td style="text-align:center;color:#6B5D55;">${i + 1}</td>
        <td>${it.nombre ?? ''}</td>
        <td style="text-align:center;">${it.cantidad}</td>
        <td style="text-align:right;">${moneda(it.precio_unitario ?? 0)}</td>
        ${(it.descuento ?? 0) > 0 ? `<td style="text-align:center;color:#A07010;">${it.descuento}%</td>` : '<td style="text-align:center;color:#A89888;">—</td>'}
        <td style="text-align:right;">${moneda(it.subtotal ?? 0)}</td>
      </tr>`,
    )
    .join('')

  const descuentoRow =
    descuento > 0
      ? `<tr class="total-line">
          <td colspan="4"></td>
          <td style="text-align:right;color:#6B5D55;">Descuento (${descuento}%):</td>
          <td style="text-align:right;color:#6B5D55;">-${moneda((subtotal * descuento) / 100)}</td>
        </tr>`
      : ''

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${tipoLabel} ${venta.numero ?? ''}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    @page { size: A4; margin: 15mm; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #1A1210;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
    }

    .page {
      max-width: 720px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #800000;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .empresa-logo {
      font-size: 28px;
      line-height: 1;
    }
    .empresa-nombre {
      font-size: 20px;
      font-weight: 700;
      color: #800000;
      margin: 4px 0 2px;
    }
    .empresa-sub {
      font-size: 11px;
      color: #6B5D55;
      line-height: 1.5;
    }
    .doc-info {
      text-align: right;
    }
    .doc-tipo {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6B5D55;
    }
    .doc-num {
      font-size: 22px;
      font-weight: 700;
      color: #800000;
      margin: 2px 0;
    }
    .doc-fecha {
      font-size: 12px;
      color: #6B5D55;
    }

    /* ── Section title ── */
    .section-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #A89888;
      margin: 20px 0 6px;
    }

    /* ── Cliente box ── */
    .cliente-box {
      background: #F5F1EC;
      border: 1px solid #DDD0C0;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 13px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px 24px;
    }
    .cliente-field label {
      display: block;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #A89888;
      margin-bottom: 2px;
    }
    .cliente-field span {
      color: #1A1210;
      font-size: 13px;
    }

    /* ── Items table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    thead th {
      background: #800000;
      color: #FFFFFF;
      padding: 8px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
    }
    thead th:first-child { border-radius: 4px 0 0 0; }
    thead th:last-child  { border-radius: 0 4px 0 0; }
    tbody td {
      padding: 7px 12px;
      border-bottom: 1px solid #DDD0C0;
      font-size: 12px;
      vertical-align: middle;
    }
    tbody tr:nth-child(even) td {
      background: #F5F1EC;
    }

    /* ── Totales ── */
    .totales {
      margin-top: 8px;
      display: flex;
      justify-content: flex-end;
    }
    .totales-table {
      min-width: 260px;
    }
    .totales-table td {
      padding: 5px 12px;
      font-size: 12px;
      border: none;
      background: transparent;
    }
    .totales-table .total-final td {
      font-size: 15px;
      font-weight: 700;
      color: #800000;
      border-top: 2px solid #DDD0C0;
      padding-top: 8px;
    }
    .total-line td { background: transparent !important; }

    /* ── Estado ── */
    .estado-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      margin-top: 8px;
    }
    .estado-pagado   { background: rgba(45,122,79,0.12); color: #2D7A4F; }
    .estado-pendiente { background: rgba(160,112,16,0.12); color: #A07010; }
    .estado-cta      { background: rgba(43,94,160,0.12); color: #2B5EA0; }

    /* ── Notas ── */
    .notas-box {
      background: #F5F1EC;
      border-left: 3px solid #DDD0C0;
      padding: 10px 14px;
      font-size: 12px;
      color: #6B5D55;
      border-radius: 0 4px 4px 0;
    }

    /* ── Firma ── */
    .firma-section {
      margin-top: 48px;
      display: flex;
      justify-content: flex-end;
    }
    .firma-box {
      text-align: center;
      width: 200px;
    }
    .firma-linea {
      border-top: 1px dashed #6B5D55;
      margin-bottom: 6px;
    }
    .firma-label {
      font-size: 10px;
      color: #6B5D55;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 32px;
      border-top: 1px solid #DDD0C0;
      padding-top: 12px;
      text-align: center;
      font-size: 10px;
      color: #A89888;
    }

    /* ── Toolbar (screen only) ── */
    .toolbar {
      position: fixed;
      top: 12px;
      right: 16px;
      display: flex;
      gap: 8px;
      z-index: 100;
    }
    .toolbar button {
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
      font-weight: 600;
    }
    .btn-print {
      background: #800000;
      color: #FFFFFF;
    }
    .btn-print:hover { background: #6a0000; }
    .btn-close {
      background: #F5F1EC;
      border: 1px solid #DDD0C0 !important;
      color: #6B5D55;
    }
    .btn-close:hover { background: #EDE8E2; }

    @media print {
      body  { margin: 0; }
      .no-print { display: none !important; }
      .toolbar  { display: none !important; }
    }
  </style>
</head>
<body>

<div class="toolbar no-print">
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
  <button class="btn-close" onclick="window.close()">✕ Cerrar</button>
</div>

<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div>
      <div class="empresa-logo">🍷</div>
      <div class="empresa-nombre">${empresa.nombre}</div>
      <div class="empresa-sub">
        ${empresa.domicilio}<br>
        Tel: ${empresa.telefono} &nbsp;·&nbsp; CUIT: ${empresa.cuit}
      </div>
    </div>
    <div class="doc-info">
      <div class="doc-tipo">${tipoLabel}</div>
      <div class="doc-num">${venta.numero ?? ''}</div>
      <div class="doc-fecha">Fecha: ${fecha}</div>
    </div>
  </div>

  <!-- CLIENTE -->
  <div class="section-title">Datos del comprobante</div>
  <div class="cliente-box">
    <div class="cliente-field">
      <label>Cliente</label>
      <span>${venta.cliente_nombre || 'Consumidor Final'}</span>
    </div>
    ${cliente?.cuit ? `<div class="cliente-field"><label>CUIT</label><span style="font-family:monospace;">${cliente.cuit}</span></div>` : ''}
    ${cliente?.direccion ? `<div class="cliente-field"><label>Dirección</label><span>${cliente.direccion}</span></div>` : ''}
    ${cliente?.telefono ? `<div class="cliente-field"><label>Teléfono</label><span>${cliente.telefono}</span></div>` : ''}
    ${cliente?.email ? `<div class="cliente-field"><label>Email</label><span>${cliente.email}</span></div>` : ''}
    ${venta.condicion_venta ? `<div class="cliente-field"><label>Condición</label><span>${venta.condicion_venta}</span></div>` : ''}
    ${venta.vendedor_nombre ? `<div class="cliente-field"><label>Vendedor</label><span>${venta.vendedor_nombre}</span></div>` : ''}
    ${venta.estado ? `<div class="cliente-field"><label>Estado</label><span>${venta.estado}</span></div>` : ''}
  </div>

  <!-- ITEMS -->
  <div class="section-title">Detalle</div>
  <table>
    <thead>
      <tr>
        <th style="width:28px;text-align:center;">#</th>
        <th>Descripción</th>
        <th style="width:80px;text-align:center;">Cant.</th>
        <th style="width:100px;text-align:right;">Precio unit.</th>
        <th style="width:50px;text-align:center;">Desc.</th>
        <th style="width:100px;text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows || '<tr><td colspan="6" style="text-align:center;color:#A89888;padding:20px;">Sin ítems</td></tr>'}
    </tbody>
  </table>
  <div style="text-align:right;font-size:11px;color:#6B5D55;margin-top:4px;margin-bottom:8px;">
    Total: <strong>${resumenUnidades}</strong>
  </div>

  <!-- TOTALES -->
  <div class="totales">
    <table class="totales-table">
      <tbody>
        <tr class="total-line">
          <td style="color:#6B5D55;">Subtotal:</td>
          <td style="text-align:right;">${moneda(subtotal)}</td>
        </tr>
        ${descuento > 0 ? `<tr class="total-line"><td style="color:#6B5D55;">Descuento (${descuento}%):</td><td style="text-align:right;color:#6B5D55;">-${moneda((subtotal * descuento) / 100)}</td></tr>` : ''}
        <tr class="total-line">
          <td style="color:#6B5D55;">Neto gravado:</td>
          <td style="text-align:right;">${moneda(netoGravado)}</td>
        </tr>
        <tr class="total-line">
          <td style="color:#6B5D55;">IVA 21%:</td>
          <td style="text-align:right;">${moneda(importeIVA)}</td>
        </tr>
        <tr class="total-final">
          <td>TOTAL:</td>
          <td style="text-align:right;">${moneda(total)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${estadoPago ? `
  <div style="margin-top:12px;text-align:right;">
    <span class="estado-badge ${venta.estado_pago === 'pagado' ? 'estado-pagado' : venta.estado_pago === 'cuenta_corriente' ? 'estado-cta' : 'estado-pendiente'}">
      ${estadoPago}
    </span>
  </div>` : ''}

  <!-- NOTAS -->
  ${venta.notas ? `
  <div class="section-title">Notas</div>
  <div class="notas-box">${venta.notas}</div>` : ''}

  <!-- AFIP -->
  ${venta.cae ? `
  <div class="section-title">Datos AFIP</div>
  <div class="cliente-box" style="font-size:11px;gap:16px;">
    <div class="cliente-field"><label>CAE</label><span>${venta.cae}</span></div>
    ${venta.cae_vto ? `<div class="cliente-field"><label>Vto. CAE</label><span>${new Date(venta.cae_vto).toLocaleDateString('es-AR')}</span></div>` : ''}
    ${venta.nro_cbte_afip ? `<div class="cliente-field"><label>Nro. Cbte AFIP</label><span>${venta.nro_cbte_afip}</span></div>` : ''}
  </div>` : ''}

  <!-- FIRMA -->
  <div class="firma-section">
    <div class="firma-box">
      <div class="firma-linea"></div>
      <div class="firma-label">Firma y aclaración</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    ${empresa.nombre} &nbsp;·&nbsp; ${empresa.domicilio} &nbsp;·&nbsp; CUIT ${empresa.cuit}<br>
    Gracias por su confianza
  </div>

</div>

<script>
  window.onload = function() { window.print(); }
</script>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
