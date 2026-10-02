export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { esc } from '@/lib/html'
import { comprobanteVentaHtml, errorHtml } from '@/lib/comprobanteVentaHtml'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const empresaKey = req.nextUrl.searchParams.get('empresa') || 'aroma'
  // Antes se abría siempre con window.print() disparado solo — bien para
  // "Imprimir" recién hecha la venta, mal para los botones "Ver comprobante"
  // (Aging, Clientes, Cuenta corriente) que solo quieren mostrarlo: el
  // usuario tenía que cerrar el diálogo de impresión cada vez que quería
  // simplemente mirar un comprobante viejo. Ahora el auto-print es opt-in.
  const autoprint = req.nextUrl.searchParams.get('autoprint') === '1'

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
    return new Response(errorHtml(`No se encontró la venta con id ${esc(id)}.`), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // Fetch client data if linked
  let cliente: { cuit?: string; direccion?: string; telefono?: string; email?: string; saldo?: number } | null = null
  if (venta.cliente_id) {
    const { data: cl } = await supabase
      .from('clientes')
      .select('cuit, direccion, telefono, email, saldo')
      .eq('id', venta.cliente_id)
      .single()
    if (cl) cliente = cl
  }

  const html = await comprobanteVentaHtml(venta, cliente, empresaKey, autoprint)

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
