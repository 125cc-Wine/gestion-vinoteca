export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

interface ProductoJSON {
  nombre: string
  categoria: string
  bodega?: string
  varietal?: string
  precio_venta: number
  precio_costo?: number
}

const EMPRESAS = ['aroma', 'lavid'] as const
const BATCH = 50

function categoriaNormalizada(c: string): 'Tinto' | 'Blanco' | 'Rosado' | 'Espumante' | 'Otro' {
  const valid = ['Tinto', 'Blanco', 'Rosado', 'Espumante', 'Otro']
  return valid.includes(c) ? c as 'Tinto' | 'Blanco' | 'Rosado' | 'Espumante' | 'Otro' : 'Otro'
}

export async function GET() {
  const filePath = path.join(process.cwd(), 'productos_con_precio.json')
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Archivo no encontrado: productos_con_precio.json' }, { status: 404 })
  }

  const raw: ProductoJSON[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const resultados = { insertados: 0, actualizados: 0, errores: 0, errores_detalle: [] as string[] }

  for (const empresa of EMPRESAS) {
    // Traer nombres existentes para esta empresa
    const { data: existentes, error: errExist } = await supabase
      .from('productos')
      .select('id, nombre')
      .eq('empresa', empresa)

    if (errExist) {
      resultados.errores_detalle.push(`[${empresa}] No se pudo leer tabla: ${errExist.message}`)
      continue
    }

    const mapaId = new Map<string, string>(
      (existentes ?? []).map(p => [p.nombre.toLowerCase().trim(), p.id])
    )

    const nuevos: object[] = []
    const updates: { id: string; payload: object }[] = []

    for (const p of raw) {
      const key = p.nombre.toLowerCase().trim()
      const updatePayload = {
        precio_venta: p.precio_venta ?? 0,
        precio_costo: p.precio_costo ?? 0,
        varietal: p.varietal ?? '',
      }

      if (mapaId.has(key)) {
        updates.push({ id: mapaId.get(key)!, payload: updatePayload })
      } else {
        nuevos.push({
          empresa,
          nombre: p.nombre,
          bodega: p.bodega ?? '',
          varietal: p.varietal ?? '',
          categoria: categoriaNormalizada(p.categoria),
          sku: '',
          region: '',
          precio_venta: p.precio_venta ?? 0,
          precio_mayorista: 0,
          precio_costo: p.precio_costo ?? 0,
          stock: 0,
          stock_minimo: 3,
          activo: true,
        })
      }
    }

    // ── Insertar nuevos en lotes de BATCH ──
    for (let i = 0; i < nuevos.length; i += BATCH) {
      const lote = nuevos.slice(i, i + BATCH)
      const { error } = await supabase.from('productos').insert(lote)
      if (error) {
        resultados.errores += lote.length
        resultados.errores_detalle.push(`[${empresa}] insert lote ${i}: ${error.message}`)
      } else {
        resultados.insertados += lote.length
      }
    }

    // ── Actualizar existentes en lotes paralelos de BATCH ──
    for (let i = 0; i < updates.length; i += BATCH) {
      const lote = updates.slice(i, i + BATCH)
      const resultLote = await Promise.all(
        lote.map(({ id, payload }) =>
          supabase.from('productos').update(payload).eq('id', id)
        )
      )
      for (const { error } of resultLote) {
        if (error) {
          resultados.errores++
          resultados.errores_detalle.push(`[${empresa}] update: ${error.message}`)
        } else {
          resultados.actualizados++
        }
      }
    }
  }

  return NextResponse.json({
    insertados: resultados.insertados,
    actualizados: resultados.actualizados,
    errores: resultados.errores,
    total_procesados: raw.length * 2,
    errores_detalle: resultados.errores_detalle.slice(0, 20),
    mensaje: `✓ ${resultados.insertados} insertados, ${resultados.actualizados} actualizados, ${resultados.errores} errores de ${raw.length * 2} registros totales.`,
  })
}
