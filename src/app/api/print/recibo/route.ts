export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { esc } from '@/lib/html'

const EMPRESAS_DATA: Record<string, { nombre: string; cuit: string; domicilio: string; telefono: string; logoPath: string }> = {
  aroma: { nombre: 'Aroma de Vid', cuit: '20-26600984-5', domicilio: 'Roca 2787, Mar del Plata', telefono: '(0223) 491-1705', logoPath: '/logos/aroma.jpg' },
  lavid: { nombre: 'MDP La Vid Consultora S.R.L.', cuit: '30-71762144-8', domicilio: 'Roca 2787, Mar del Plata', telefono: '(0223) 685-0870', logoPath: '/logos/lavid.png' },
}

function errorHtml(msg: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Error</title>
<style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#F5F1EC;}
.box{background:#fff;border:1px solid #DDD0C0;border-radius:8px;padding:40px;text-align:center;max-width:400px;}
h2{color:#800000;margin:0 0 12px;}p{color:#6B5D55;font-size:14px;}</style></head>
<body><div class="box"><h2>Error</h2><p>${msg}</p></div></body></html>`
}

function waLink(telefono: string | null | undefined, texto: string): string | null {
  if (!telefono) return null
  let tel = telefono.replace(/\D/g, '')
  if (!tel) return null
  if (tel.startsWith('0')) tel = tel.slice(1)
  if (!tel.startsWith('54')) tel = '54' + tel
  return `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const empresaKey = req.nextUrl.searchParams.get('empresa') || 'aroma'
  const medio = req.nextUrl.searchParams.get('medio') || ''

  if (!id) {
    return new Response(errorHtml('Falta el parámetro id.'), { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  const { data: mov, error } = await supabase
    .from('movimientos_cta_cte')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !mov) {
    return new Response(errorHtml(`No se encontró el movimiento con id ${esc(id)}.`), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  let cliente: { nombre?: string; apellido?: string; razon_social?: string; cuit?: string; telefono?: string } | null = null
  if (mov.cliente_id) {
    const { data: cl } = await supabase
      .from('clientes')
      .select('nombre, apellido, razon_social, cuit, telefono')
      .eq('id', mov.cliente_id)
      .single()
    if (cl) cliente = cl
  }

  const empresa = EMPRESAS_DATA[empresaKey] ?? EMPRESAS_DATA['aroma']
  const clienteNombre = cliente?.razon_social || `${cliente?.nombre ?? ''} ${cliente?.apellido ?? ''}`.trim() || 'Cliente'
  const fecha = new Date(mov.created_at).toLocaleDateString('es-AR')
  const moneda = (n: number) => '$' + (n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // El concepto puede traer el detalle de a qué comprobantes se aplicó el
  // cobro (ver /api/cta-cte), separado con " — Aplicado a: " — se muestra
  // en una fila aparte para que no quede todo amontonado en una sola línea.
  const [conceptoBase, aplicadoA] = (mov.concepto || '').split(' — Aplicado a: ')

  const textoWa = `Hola ${clienteNombre}, te confirmamos la recepción de tu pago de ${moneda(mov.monto)} el ${fecha} en ${empresa.nombre}.${conceptoBase ? ` Concepto: ${conceptoBase}.` : ''}${aplicadoA ? ` Aplicado a: ${aplicadoA}.` : ''} ¡Gracias!`
  const wa = waLink(cliente?.telefono, textoWa)

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Recibo — ${esc(clienteNombre)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4 portrait; margin: 16mm 18mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1A1210; background: #fff; margin: 0; padding: 0; font-size: 13px; line-height: 1.5; }
    .page { width: 100%; max-width: 620px; margin: 0 auto; }

    .toolbar { position: fixed; top: 12px; right: 16px; display: flex; gap: 8px; z-index: 100; }
    .toolbar button, .toolbar a { padding: 8px 18px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-family: inherit; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; }
    .btn-print { background: #800000; color: #fff; }
    .btn-wa { background: #25D366; color: #fff; }
    .btn-close { background: #F5F1EC; border: 1px solid #DDD0C0 !important; color: #6B5D55; }

    .header { display: flex; align-items: center; gap: 14px; border: 2px solid #800000; border-radius: 6px; padding: 16px 20px; margin-bottom: 18px; }
    .header-logo { height: 50px; max-width: 90px; object-fit: contain; flex-shrink: 0; }
    .empresa-nombre { font-size: 17px; font-weight: 700; color: #800000; margin: 0 0 3px; }
    .empresa-sub { font-size: 10.5px; color: #6B5D55; line-height: 1.6; }

    .titulo { text-align: center; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #800000; margin: 0 0 4px; }
    .fecha-recibo { text-align: center; font-size: 12px; color: #6B5D55; margin-bottom: 22px; }

    .monto-box { background: #FBF3E7; border: 1px solid #E0C89A; border-left: 4px solid #A07010; border-radius: 6px; padding: 16px 20px; text-align: center; margin-bottom: 22px; }
    .monto-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #A07010; margin-bottom: 4px; }
    .monto-valor { font-size: 30px; font-weight: 700; color: #A07010; }

    .detalle { border: 1px solid #DDD0C0; border-radius: 6px; padding: 16px 20px; margin-bottom: 22px; }
    .detalle-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #F0EBE5; font-size: 12.5px; }
    .detalle-row:last-child { border-bottom: none; }
    .detalle-label { color: #6B5D55; }
    .detalle-val { color: #1A1210; font-weight: 600; text-align: right; }

    .firmas { display: flex; justify-content: space-between; gap: 40px; margin-top: 48px; }
    .firma-box { flex: 1; text-align: center; }
    .firma-linea { border-top: 1px solid #A89888; margin-bottom: 6px; }
    .firma-label { font-size: 10.5px; color: #8A7068; }

    .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #A89888; }

    @media print {
      .toolbar { display: none !important; }
      body { background: #fff; }
    }
  </style>
</head>
<body>

<div class="toolbar no-print">
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
  ${wa ? `<a class="btn-wa" href="${wa}" target="_blank" rel="noopener noreferrer">💬 Enviar por WhatsApp</a>` : ''}
  <button class="btn-close" onclick="window.close()">✕ Cerrar</button>
</div>

<div class="page">
  <div class="header">
    <img class="header-logo" src="${empresa.logoPath}" alt="${esc(empresa.nombre)}">
    <div>
      <div class="empresa-nombre">${esc(empresa.nombre)}</div>
      <div class="empresa-sub">${empresa.domicilio}<br>Tel: ${empresa.telefono} &nbsp;·&nbsp; CUIT: ${empresa.cuit}</div>
    </div>
  </div>

  <div class="titulo">Recibo de pago</div>
  <div class="fecha-recibo">${fecha}</div>

  <div class="monto-box">
    <div class="monto-label">Monto recibido</div>
    <div class="monto-valor">${moneda(mov.monto)}</div>
  </div>

  <div class="detalle">
    <div class="detalle-row"><span class="detalle-label">Recibimos de</span><span class="detalle-val">${esc(clienteNombre)}</span></div>
    ${cliente?.cuit ? `<div class="detalle-row"><span class="detalle-label">CUIT</span><span class="detalle-val">${esc(cliente.cuit)}</span></div>` : ''}
    <div class="detalle-row"><span class="detalle-label">En concepto de</span><span class="detalle-val">${esc(conceptoBase || 'Cobro cuenta corriente')}</span></div>
    ${aplicadoA ? `<div class="detalle-row"><span class="detalle-label">Aplicado a</span><span class="detalle-val">${esc(aplicadoA)}</span></div>` : ''}
    ${medio ? `<div class="detalle-row"><span class="detalle-label">Medio de pago</span><span class="detalle-val">${esc(medio)}</span></div>` : ''}
    <div class="detalle-row"><span class="detalle-label">Saldo restante</span><span class="detalle-val">${moneda(mov.saldo_nuevo)}</span></div>
  </div>

  <div class="firmas">
    <div class="firma-box"><div class="firma-linea"></div><div class="firma-label">Firma y aclaración</div></div>
    <div class="firma-box"><div class="firma-linea"></div><div class="firma-label">Recibí conforme</div></div>
  </div>

  <div class="footer">${empresa.nombre} &nbsp;·&nbsp; ${empresa.domicilio} &nbsp;·&nbsp; CUIT ${empresa.cuit}</div>
</div>

</body>
</html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
