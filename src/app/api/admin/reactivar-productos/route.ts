export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/admin/reactivar-productos
// Pone activo=true en todos los productos que tienen activo=false o null
export async function POST() {
  const { data, error } = await supabase
    .from('productos')
    .update({ activo: true })
    .or('activo.is.null,activo.eq.false')
    .select('id, nombre, empresa')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    reactivados: data?.length ?? 0,
    mensaje: `${data?.length ?? 0} productos reactivados`,
  })
}
