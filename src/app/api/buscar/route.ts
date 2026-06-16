export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa')
  const q       = req.nextUrl.searchParams.get('q')?.trim()

  if (!empresa || !q || q.length < 2) return NextResponse.json([])

  const like = `%${q}%`

  const [vRes, cRes, pRes] = await Promise.all([
    supabase.from('ventas').select('id, numero, tipo, cliente_nombre, total, created_at')
      .eq('empresa', empresa).neq('estado', 'cancelado')
      .or(`numero.ilike.${like},cliente_nombre.ilike.${like}`)
      .order('created_at', { ascending: false }).limit(6),
    supabase.from('clientes').select('id, nombre, apellido, razon_social, telefono')
      .eq('empresa', empresa).neq('activo', false)
      .or(`nombre.ilike.${like},apellido.ilike.${like},razon_social.ilike.${like}`)
      .limit(5),
    supabase.from('productos').select('id, nombre, bodega, stock, precio_venta')
      .eq('empresa', empresa).neq('activo', false)
      .or(`nombre.ilike.${like},bodega.ilike.${like}`)
      .limit(5),
  ])

  const results: { tipo: string; id: string; titulo: string; subtitulo: string; href: string }[] = []

  for (const v of vRes.data || []) {
    results.push({
      tipo: 'venta', id: v.id,
      titulo: `${v.tipo === 'presupuesto' ? 'Presupuesto' : 'Remito'} ${v.numero}`,
      subtitulo: `${v.cliente_nombre} — $${v.total?.toLocaleString('es-AR')}`,
      href: '/ventas',
    })
  }
  for (const c of cRes.data || []) {
    const nombre = c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()
    results.push({
      tipo: 'cliente', id: c.id,
      titulo: nombre,
      subtitulo: c.telefono || 'Cliente',
      href: '/clientes',
    })
  }
  for (const p of pRes.data || []) {
    results.push({
      tipo: 'producto', id: p.id,
      titulo: p.nombre,
      subtitulo: `${p.bodega || ''} — Stock: ${p.stock} — $${p.precio_venta?.toLocaleString('es-AR')}`,
      href: '/productos',
    })
  }

  return NextResponse.json(results)
}
