import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { clienteActual } from '@/lib/session'
import { comprobanteVentaHtml, errorHtml } from '@/lib/comprobanteVentaHtml'

export const dynamic = 'force-dynamic'

// Factura / comprobante del cliente para ver, imprimir o guardar en PDF: el
// mismo que imprime gestión. Solo los propios y con la cuenta habilitada
// (link + PIN), igual que "Mi cuenta". ?imprimir=1 abre el diálogo de impresión.
const html = (cuerpo: string, status = 200) => new Response(cuerpo, {
  status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' },
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const cliente = await clienteActual()
  if (!cliente?.id || !cliente.verificado) return html(errorHtml('Para ver tus comprobantes, entrá con el link personal y el PIN que te mandó tu vendedor.'), 401)

  const { data: venta } = await db.from('ventas').select('*')
    .eq('id', params.id).eq('cliente_id', cliente.id).neq('estado', 'cancelado').maybeSingle()
  if (!venta) return html(errorHtml('No encontramos ese comprobante en tu cuenta.'), 404)

  const { data: datos } = await db.from('clientes').select('cuit, direccion, telefono, email, saldo').eq('id', cliente.id).maybeSingle()
  const empresa = venta.empresa === 'lavid' ? 'lavid' : 'aroma'
  return html(await comprobanteVentaHtml(venta, datos ?? null, empresa, req.nextUrl.searchParams.get('imprimir') === '1'))
}
