export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Pedidos que entran solos y esperan que alguien los procese, de las dos
// empresas: del portal (cliente o vendedor de calle) y de la tienda web. Los
// consulta el aviso del encabezado (número rojo en "Pedidos" + aviso).
export async function GET() {
  const { data, error } = await supabase.from('pedidos')
    .select('id, numero, empresa, cliente_nombre, vendedor_nombre, origen, total, items, created_at')
    .in('origen', ['portal', 'vendedor', 'web', '125cc']).eq('estado', 'pendiente')
    .order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    pendientes: (data || []).map(p => ({
      id: p.id, numero: p.numero, empresa: p.empresa, cliente: p.cliente_nombre, origen: p.origen,
      vendedor: p.origen === 'vendedor' ? p.vendedor_nombre : p.origen === 'web' ? 'Tienda web' : p.origen === '125cc' ? 'Carta 125cc' : null, total: Number(p.total) || 0,
      productos: Array.isArray(p.items) ? p.items.length : 0, created_at: p.created_at,
    })),
  })
}
