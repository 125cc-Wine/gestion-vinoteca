'use client'
import { useMemo, useState } from 'react'
import type { ItemCatalogo } from '@/lib/catalogo'

const pesos = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR')
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const TIPOS = ['Tinto', 'Blanco', 'Naranjo', 'Rosado', 'Espumante', 'Dulce', 'Otro']
const ETIQ: Record<string, string> = { Otro: 'Bebidas' }

type Orden = 'nombre' | 'stock' | 'precio'

export default function ListaStock({ items, general, logos }: { items: ItemCatalogo[]; general: number; logos: Record<string, string> }) {
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState('')
  const [soloStock, setSoloStock] = useState(true)
  const [orden, setOrden] = useState<Orden>('nombre')

  const lista = useMemo(() => {
    const t = norm(q.trim())
    const f = items.filter(i =>
      (!soloStock || (i.stock ?? 0) > 0) && (!tipo || i.categoria === tipo) &&
      (!t || t.split(/\s+/).every(p => norm(`${i.nombre} ${i.bodega} ${i.varietal}`).includes(p))))
    const cmp: Record<Orden, (a: ItemCatalogo, b: ItemCatalogo) => number> = {
      nombre: (a, b) => a.bodega.localeCompare(b.bodega, 'es') || a.nombre.localeCompare(b.nombre, 'es'),
      stock: (a, b) => (b.stock ?? 0) - (a.stock ?? 0),
      precio: (a, b) => a.precio - b.precio,
    }
    return f.sort(cmp[orden])
  }, [items, q, tipo, soloStock, orden])

  const conStock = items.filter(i => (i.stock ?? 0) > 0).length

  return (
    <>
      <section className="hero" style={{ paddingBottom: 8 }}>
        <div className="kicker">{conStock} productos con stock · {items.length} en la lista</div>
        <h1>Lista y stock</h1>
        <p>Precio con el descuento general ({general}%). El de cada cliente (con sus descuentos especiales) lo ves al tomarle el pedido.</p>
      </section>

      <div className="filtros" style={{ position: 'sticky', top: 0, zIndex: 5 }}>
        <div className="buscar">
          <input type="search" autoFocus placeholder="Buscar vino, bodega o varietal" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="chips">
          <button className="chip" aria-pressed={!tipo} onClick={() => setTipo('')}>Todos</button>
          {TIPOS.filter(t => items.some(i => i.categoria === t)).map(t => (
            <button key={t} className="chip" aria-pressed={tipo === t} onClick={() => setTipo(tipo === t ? '' : t)}><span className={`dot dot-${t}`} />{ETIQ[t] ?? t}</button>
          ))}
          <button className="chip" aria-pressed={soloStock} onClick={() => setSoloStock(v => !v)}>Solo con stock</button>
          <select className="chip" value={orden} onChange={e => setOrden(e.target.value as Orden)} aria-label="Ordenar">
            <option value="nombre">Por bodega</option>
            <option value="stock">Más stock primero</option>
            <option value="precio">Más baratos primero</option>
          </select>
        </div>
      </div>

      <div className="stock-lista">
        {lista.length === 0 && <div className="vacio">No hay productos con esos filtros.</div>}
        {lista.slice(0, 400).map(i => {
          const s = i.stock ?? 0
          return (
            <div key={i.id} className={`stock-fila${s > 0 ? '' : ' agotado'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logos[i.bodega] ? <img src={logos[i.bodega]} alt="" className="stock-logo" /> : <span className="stock-logo vacio-logo" />}
              <div className="stock-info">
                <div className="fila-nom">{i.nombre}</div>
                <div className="fila-sub">
                  <span>{i.bodega}</span>
                  {(i.varietal || i.categoria) && <span><span className={`dot dot-${i.categoria}`} />{[i.varietal, i.categoria === 'Otro' ? '' : i.categoria].filter(Boolean).join(' · ')}</span>}
                </div>
              </div>
              <div className={`stock-n ${s === 0 ? 'cero' : s <= 6 ? 'poco' : ''}`}>
                <b>{s}</b><small>{s === 1 ? 'unidad' : 'unid.'}</small>
              </div>
              <div className="stock-precio">
                <b>{pesos(i.precio)}</b>
                {i.descuento > 0 && <s>{pesos(i.precio_lista)}</s>}
              </div>
            </div>
          )
        })}
        {lista.length > 400 && <div className="vacio">Mostrando 400 de {lista.length}: buscá para acotar.</div>}
      </div>
    </>
  )
}
