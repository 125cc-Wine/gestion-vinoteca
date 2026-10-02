'use client'
import { useEffect, useState } from 'react'

// Desplegable de varietal (o rubro, en categoría "Otro") según la categoría
// del producto, con la lista cerrada de /api/varietales. Se puede sumar uno
// nuevo desde el mismo desplegable ("+ Agregar…"), que queda en la lista.

export interface Varietal { categoria: string; nombre: string }

let cache: Promise<Varietal[]> | null = null
const oyentes = new Set<(v: Varietal[]) => void>()

export function cargarVarietales(): Promise<Varietal[]> {
  if (!cache) cache = fetch('/api/varietales').then(r => r.json()).then(d => d.varietales || []).catch(() => { cache = null; return [] })
  return cache
}

export function useVarietales() {
  const [lista, setLista] = useState<Varietal[] | null>(null)   // null = cargando
  useEffect(() => {
    cargarVarietales().then(setLista)
    oyentes.add(setLista)
    return () => { oyentes.delete(setLista) }
  }, [])
  return lista
}

async function agregar(categoria: string, nombre: string): Promise<string | null> {
  const d = await fetch('/api/varietales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoria, nombre }) }).then(r => r.json()).catch(() => ({ error: 'red' }))
  if (d.error) return null
  const actual = await cargarVarietales()
  if (!actual.some(v => v.categoria === categoria && v.nombre === d.nombre)) {
    const nueva = [...actual, { categoria, nombre: d.nombre }].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    cache = Promise.resolve(nueva)
    oyentes.forEach(f => f(nueva))
  }
  return d.nombre
}

const NUEVO = '__nuevo__'

export default function VarietalSelect({ categoria, value, onChange, style, placeholder }: {
  categoria: string | null | undefined
  value: string | null | undefined
  onChange: (v: string) => void
  style?: React.CSSProperties
  placeholder?: string
}) {
  const lista = useVarietales()
  const [creando, setCreando] = useState(false)
  const [texto, setTexto] = useState('')
  const cat = categoria || ''
  const etiqueta = placeholder || (cat === 'Otro' ? 'Rubro' : 'Varietal')
  const opciones = (lista ?? []).filter(v => v.categoria === cat).map(v => v.nombre)
  // En los vinos, las uvas de las otras categorías de vino también valen (un
  // rosado de Syrah): van aparte y, si se eligen, se suman a esta categoría.
  const otros = cat && cat !== 'Otro'
    ? Array.from(new Set((lista ?? []).filter(v => v.categoria !== 'Otro' && v.categoria !== 'Espumante' && v.categoria !== cat).map(v => v.nombre)))
        .filter(n => !opciones.includes(n)).sort((a, b) => a.localeCompare(b, 'es'))
    : []
  const fuera = !!value && lista !== null && !opciones.includes(value) && !otros.includes(value)
  const cargando = lista === null && !!value

  async function confirmar() {
    const n = texto.trim()
    if (!n) { setCreando(false); return }
    const final = await agregar(cat, n)
    if (final) onChange(final)
    setCreando(false); setTexto('')
  }

  if (creando) return (
    <span style={{ display: 'flex', gap: 4, minWidth: 0 }}>
      <input autoFocus style={{ ...style, flex: 1, minWidth: 0 }} value={texto} placeholder={`Nuevo ${etiqueta.toLowerCase()} para ${cat}`}
        onChange={e => setTexto(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmar() } if (e.key === 'Escape') { e.stopPropagation(); setCreando(false) } }} />
      <button type="button" onClick={confirmar} style={{ ...style, width: 'auto', padding: '0 10px', cursor: 'pointer', fontWeight: 700 }}>OK</button>
    </span>
  )

  return (
    <select style={style} value={value || ''} disabled={!cat}
      title={fuera ? `"${value}" no está en la lista: elegí uno de la lista` : undefined}
      onChange={e => {
        const v = e.target.value
        if (v === NUEVO) { setCreando(true); return }
        if (otros.includes(v)) agregar(cat, v)   // queda en la lista de esta categoría
        onChange(v)
      }}>
      <option value="">{cat ? `— ${etiqueta} —` : 'Elegí categoría'}</option>
      {cargando && <option value={value!}>{value}</option>}
      {fuera && <option value={value!}>⚠ {value} (fuera de lista)</option>}
      {otros.length > 0
        ? <>
            <optgroup label={cat}>{opciones.map(o => <option key={o} value={o}>{o}</option>)}</optgroup>
            <optgroup label="Otros varietales">{otros.map(o => <option key={o} value={o}>{o}</option>)}</optgroup>
          </>
        : opciones.map(o => <option key={o} value={o}>{o}</option>)}
      {cat && <option value={NUEVO}>+ Agregar {etiqueta.toLowerCase()}…</option>}
    </select>
  )
}
