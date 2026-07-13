export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'

const CBTE_TIPO_POR_LETRA: Record<string, number> = { A: 1, B: 6, C: 11 }

// AFIP devuelve CAEFchVto como YYYYMMDD (ej. "20260723"), no un string que
// Date() pueda parsear — sin este formateo manual se imprimía "Invalid Date".
function formatFechaAfip(yyyymmdd: string): string {
  if (!/^\d{8}$/.test(yyyymmdd)) return yyyymmdd
  return `${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(0, 4)}`
}

// QR obligatorio en comprobantes electrónicos (RG AFIP 4291).
// Formato: https://www.afip.gob.ar/fe/qr/?p=<base64(JSON)>
async function qrAfipDataUri(venta: {
  nro_cbte_afip?: string | null
  cae?: string | null
  fecha?: string | null
  created_at?: string | null
  total?: number | null
}, cuitEmpresa: string, cliente: { cuit?: string } | null): Promise<string | null> {
  if (!venta.cae || !venta.nro_cbte_afip) return null

  const partes = venta.nro_cbte_afip.split('-') // ["FB", "00007", "00000001"]
  const letra = partes[0]?.replace('F', '') || 'B'
  const ptoVta = parseInt(partes[1] || '0')
  const nroCmp = parseInt(partes[2] || '0')
  const fechaBase = venta.fecha || venta.created_at || new Date().toISOString()
  const fechaFmt = new Date(fechaBase).toISOString().slice(0, 10)

  const payload = {
    ver: 1,
    fecha: fechaFmt,
    cuit: parseInt(cuitEmpresa.replace(/-/g, '')),
    ptoVta,
    tipoCmp: CBTE_TIPO_POR_LETRA[letra] || 6,
    nroCmp,
    importe: venta.total ?? 0,
    moneda: 'PES',
    ctz: 1,
    tipoDocRec: cliente?.cuit ? 80 : 99,
    nroDocRec: cliente?.cuit ? parseInt(cliente.cuit.replace(/-/g, '')) : 0,
    tipoCodAut: 'E',
    codAut: parseInt(venta.cae),
  }

  const url = 'https://www.afip.gob.ar/fe/qr/?p=' + Buffer.from(JSON.stringify(payload)).toString('base64')
  return QRCode.toDataURL(url, { margin: 1, width: 140 })
}

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

  const esRemito = venta.tipo === 'remito'
  const qrDataUri = await qrAfipDataUri(venta, empresa.cuit, cliente)

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${tipoLabel} ${venta.numero ?? ''}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    @page { size: A4 portrait; margin: 16mm 18mm; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #1A1210;
      background: #fff;
      margin: 0; padding: 0;
      font-size: 13px;
      line-height: 1.4;
    }

    .page { width: 100%; }

    /* ── Toolbar (pantalla) ── */
    .toolbar {
      position: fixed; top: 12px; right: 16px;
      display: flex; gap: 8px; z-index: 100;
    }
    .toolbar button {
      padding: 8px 18px; border-radius: 6px; border: none;
      cursor: pointer; font-size: 13px; font-family: inherit; font-weight: 600;
    }
    .btn-print { background: #800000; color: #fff; }
    .btn-close  { background: #F5F1EC; border: 1px solid #DDD0C0 !important; color: #6B5D55; }

    /* ── HEADER ── */
    .header {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: stretch;
      border: 2px solid #800000;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 14px;
    }
    .header-empresa {
      padding: 14px 18px;
      border-right: 2px solid #800000;
    }
    .empresa-nombre {
      font-size: 18px; font-weight: 700; color: #800000; margin: 0 0 3px;
    }
    .empresa-sub {
      font-size: 10.5px; color: #6B5D55; line-height: 1.6;
    }
    .header-doc {
      background: #800000;
      color: #fff;
      padding: 14px 22px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 160px;
    }
    .doc-tipo {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.12em; opacity: 0.85; margin-bottom: 4px;
    }
    .doc-num {
      font-size: 20px; font-weight: 700; letter-spacing: 0.02em; margin-bottom: 6px;
    }
    .doc-fecha { font-size: 11px; opacity: 0.9; }
    ${estadoPago ? `.estado-badge-header {
      margin-top: 6px;
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 10px; font-weight: 700;
      background: rgba(255,255,255,0.18);
      border: 1px solid rgba(255,255,255,0.4);
    }` : ''}

    /* ── INFO GRID (cliente + doc meta) ── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }
    .info-box {
      border: 1px solid #DDD0C0;
      border-radius: 5px;
      overflow: hidden;
    }
    .info-box-title {
      background: #F0EBE5;
      border-bottom: 1px solid #DDD0C0;
      padding: 4px 12px;
      font-size: 9px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em; color: #8A7068;
    }
    .info-box-body {
      padding: 8px 12px;
      font-size: 12px;
    }
    .info-row { margin-bottom: 3px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { font-size: 9.5px; color: #8A7068; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-val { color: #1A1210; }

    /* ── TABLA ÍTEMS ── */
    .section-title {
      font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: #A89888; margin: 14px 0 5px;
    }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      background: #800000; color: #fff;
      padding: 7px 10px; font-size: 10.5px; font-weight: 600; text-align: left;
    }
    thead th:first-child { border-radius: 3px 0 0 0; }
    thead th:last-child  { border-radius: 0 3px 0 0; }
    tbody td {
      padding: 6px 10px;
      border-bottom: 1px solid #E8E0D8;
      font-size: 12px; vertical-align: middle;
    }
    tbody tr:nth-child(even) td { background: #FAF7F4; }
    tbody tr:last-child td { border-bottom: none; }
    .resumen-unidades {
      font-size: 10.5px; color: #6B5D55;
      text-align: right; margin-top: 4px; padding-right: 4px;
    }

    /* ── TOTALES ── */
    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      margin-top: 10px;
      align-items: start;
    }
    .notas-box {
      background: #FAF7F4;
      border: 1px solid #DDD0C0;
      border-left: 3px solid #C0A898;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 11.5px; color: #6B5D55;
    }
    .notas-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #A89888; margin-bottom: 4px; }
    .totales-box {
      border: 1px solid #DDD0C0;
      border-radius: 5px;
      overflow: hidden;
      min-width: 220px;
    }
    .totales-row {
      display: flex; justify-content: space-between;
      padding: 5px 12px; font-size: 12px;
      border-bottom: 1px solid #E8E0D8;
    }
    .totales-row:last-child { border-bottom: none; }
    .totales-row.desc { color: #6B5D55; }
    .totales-row.total-final {
      background: #800000; color: #fff;
      font-size: 14px; font-weight: 700;
      padding: 8px 12px;
    }
    .totales-row.iva-row { color: #6B5D55; font-size: 11px; }

    /* ── FIRMAS ── */
    .firmas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 36px;
    }
    .firma-box { text-align: center; }
    .firma-linea { border-top: 1px solid #6B5D55; margin-bottom: 5px; }
    .firma-label { font-size: 10px; color: #6B5D55; }

    /* ── DATOS AFIP ── */
    .afip-box {
      margin-top: 12px;
      border: 1px dashed #C0A898;
      border-radius: 4px;
      padding: 7px 12px;
      font-size: 10.5px; color: #6B5D55;
      display: flex; gap: 24px;
    }

    /* ── FOOTER ── */
    .footer {
      margin-top: 24px;
      border-top: 1px solid #DDD0C0;
      padding-top: 8px;
      text-align: center;
      font-size: 9.5px; color: #A89888;
    }

    /* ── CORTE DUPLICADO (solo remito) ── */
    .corte {
      border-top: 2px dashed #C0A898;
      margin: 28px 0 20px;
      text-align: center;
      position: relative;
    }
    .corte-label {
      position: absolute; top: -8px; left: 50%; transform: translateX(-50%);
      background: #fff; padding: 0 10px;
      font-size: 9px; color: #A89888; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    }

    @media print {
      .toolbar { display: none !important; }
      body { background: #fff; }
    }
  </style>
</head>
<body>

<div class="toolbar no-print">
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
  <button class="btn-close" onclick="window.close()">✕ Cerrar</button>
</div>

<div class="page">

  <!-- ══ HEADER ══ -->
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
      <div class="doc-num">${venta.numero ?? ''}</div>
      <div class="doc-fecha">${fecha}</div>
      ${estadoPago ? `<div class="estado-badge-header">${estadoPago}</div>` : ''}
    </div>
  </div>

  <!-- ══ INFO GRID ══ -->
  <div class="info-grid">
    <div class="info-box">
      <div class="info-box-title">Destinatario</div>
      <div class="info-box-body">
        <div class="info-row"><span class="info-val" style="font-weight:600;font-size:13px;">${venta.cliente_nombre || 'Consumidor Final'}</span></div>
        ${cliente?.cuit ? `<div class="info-row"><span class="info-label">CUIT: </span><span class="info-val" style="font-family:monospace;">${cliente.cuit}</span></div>` : ''}
        ${cliente?.direccion ? `<div class="info-row"><span class="info-label">Dirección: </span><span class="info-val">${cliente.direccion}</span></div>` : ''}
        ${cliente?.telefono ? `<div class="info-row"><span class="info-label">Tel: </span><span class="info-val">${cliente.telefono}</span></div>` : ''}
        ${cliente?.email ? `<div class="info-row"><span class="info-val">${cliente.email}</span></div>` : ''}
      </div>
    </div>
    <div class="info-box">
      <div class="info-box-title">Datos del comprobante</div>
      <div class="info-box-body">
        ${venta.vendedor_nombre ? `<div class="info-row"><span class="info-label">Vendedor: </span><span class="info-val">${venta.vendedor_nombre}</span></div>` : ''}
        ${venta.condicion_venta ? `<div class="info-row"><span class="info-label">Condición: </span><span class="info-val">${venta.condicion_venta}</span></div>` : ''}
        ${venta.estado ? `<div class="info-row"><span class="info-label">Estado: </span><span class="info-val">${venta.estado}</span></div>` : ''}
        ${venta.notas ? '' : '<div class="info-row" style="color:#A89888;font-size:11px;font-style:italic;">Sin observaciones</div>'}
        ${venta.notas ? `<div class="info-row"><span class="info-label">Obs.: </span><span class="info-val">${venta.notas}</span></div>` : ''}
      </div>
    </div>
  </div>

  <!-- ══ ITEMS ══ -->
  <table>
    <thead>
      <tr>
        <th style="width:26px;text-align:center;">#</th>
        <th>Descripción</th>
        <th style="width:64px;text-align:center;">Cant.</th>
        <th style="width:110px;text-align:right;">Precio unit.</th>
        <th style="width:46px;text-align:center;">Desc.</th>
        <th style="width:110px;text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows || '<tr><td colspan="6" style="text-align:center;color:#A89888;padding:16px;">Sin ítems</td></tr>'}
    </tbody>
  </table>
  <div class="resumen-unidades">Total: <strong>${resumenUnidades}</strong></div>

  <!-- ══ TOTALES ══ -->
  <div class="bottom-grid">
    <div><!-- espacio vacío a la izquierda --></div>
    <div class="totales-box">
      ${subtotal !== total || descuento > 0 ? `<div class="totales-row"><span>Subtotal</span><span>${moneda(subtotal)}</span></div>` : ''}
      ${descuento > 0 ? `<div class="totales-row desc"><span>Descuento (${descuento}%)</span><span>-${moneda((subtotal * descuento) / 100)}</span></div>` : ''}
      <div class="totales-row iva-row"><span>Neto gravado</span><span>${moneda(netoGravado)}</span></div>
      <div class="totales-row iva-row"><span>IVA 21%</span><span>${moneda(importeIVA)}</span></div>
      <div class="totales-row total-final"><span>TOTAL</span><span>${moneda(total)}</span></div>
    </div>
  </div>

  <!-- ══ DATOS AFIP ══ -->
  ${venta.cae ? `
  <div class="afip-box" style="align-items:center;">
    ${qrDataUri ? `<img src="${qrDataUri}" alt="QR AFIP" style="width:70px;height:70px;flex-shrink:0;">` : ''}
    <div style="display:flex;flex-direction:column;gap:2px;">
      <span><strong>CAE:</strong> ${venta.cae}</span>
      ${venta.cae_vto ? `<span><strong>Vto. CAE:</strong> ${formatFechaAfip(venta.cae_vto)}</span>` : ''}
      ${venta.nro_cbte_afip ? `<span><strong>Nro. AFIP:</strong> ${venta.nro_cbte_afip}</span>` : ''}
    </div>
  </div>` : ''}

  <!-- ══ FIRMAS ══ -->
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

  <!-- ══ FOOTER ══ -->
  <div class="footer">
    ${empresa.nombre} &nbsp;·&nbsp; ${empresa.domicilio} &nbsp;·&nbsp; CUIT ${empresa.cuit} &nbsp;·&nbsp; Tel: ${empresa.telefono}
  </div>

  <!-- ══ DUPLICADO (solo remito) ══ -->
  ${esRemito ? `
  <div class="corte"><span class="corte-label">✂ &nbsp; Duplicado &nbsp; ✂</span></div>

  <div class="header">
    <div class="header-empresa">
      <div class="empresa-nombre">${empresa.nombre}</div>
      <div class="empresa-sub">${empresa.domicilio} &nbsp;·&nbsp; CUIT: ${empresa.cuit}</div>
    </div>
    <div class="header-doc">
      <div class="doc-tipo">Remito — Duplicado</div>
      <div class="doc-num">${venta.numero ?? ''}</div>
      <div class="doc-fecha">${fecha}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="info-box-title">Destinatario</div>
      <div class="info-box-body">
        <div class="info-row"><span class="info-val" style="font-weight:600;">${venta.cliente_nombre || 'Consumidor Final'}</span></div>
        ${cliente?.direccion ? `<div class="info-row"><span class="info-label">Dirección: </span><span class="info-val">${cliente.direccion}</span></div>` : ''}
      </div>
    </div>
    <div class="info-box">
      <div class="info-box-title">Resumen</div>
      <div class="info-box-body">
        <div class="info-row"><span class="info-label">Total: </span><span class="info-val" style="font-weight:700;">${moneda(total)}</span></div>
        <div class="info-row"><span class="info-label">Unidades: </span><span class="info-val">${resumenUnidades}</span></div>
        ${estadoPago ? `<div class="info-row"><span class="info-label">Pago: </span><span class="info-val">${estadoPago}</span></div>` : ''}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:26px;text-align:center;">#</th>
        <th>Descripción</th>
        <th style="width:64px;text-align:center;">Cant.</th>
        <th style="width:110px;text-align:right;">Precio unit.</th>
        <th style="width:46px;text-align:center;">Desc.</th>
        <th style="width:110px;text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows || '<tr><td colspan="6" style="text-align:center;color:#A89888;padding:16px;">Sin ítems</td></tr>'}
    </tbody>
  </table>
  <div class="resumen-unidades">Total: <strong>${resumenUnidades}</strong></div>

  <div class="firmas" style="margin-top:28px;">
    <div class="firma-box">
      <div class="firma-linea"></div>
      <div class="firma-label">Firma y aclaración del cliente</div>
    </div>
    <div class="firma-box">
      <div class="firma-linea"></div>
      <div class="firma-label">Firma y sello empresa</div>
    </div>
  </div>
  ` : ''}

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
