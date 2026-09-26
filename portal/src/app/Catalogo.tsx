'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface Item {
  id: string; nombre: string; bodega: string; varietal: string; categoria: string
  precio_lista: number; precio: number; disponible: boolean
}

const ORDEN_TIPO = ['Espumante', 'Blanco', 'Rosado', 'Tinto', 'Dulce']
const PLURAL: Record<string, string> = { Espumante: 'Espumantes', Blanco: 'Blancos', Rosado: 'Rosados', Tinto: 'Tintos', Dulce: 'Dulces' }
const pesos = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR')
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function Catalogo({ clienteId, clienteNombre, lista, descuento, actualizado, items, preview = false }: {
  clienteId: string; clienteNombre: string; lista: string; descuento: number; actualizado: string; items: Item[]; preview?: boolean
}) {
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState('')
  const [bodega, setBodega] = useState('')
  const [soloDisp, setSoloDisp] = useState(false)
  const [carrito, setCarrito] = useState<Record<string, number>>({})
  const [abierto, setAbierto] = useState(false)
  const [notas, setNotas] = useState('')
  const [fecha, setFecha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [hecho, setHecho] = useState<{ numero: string; total: number } | null>(null)

  // El carrito sobrevive a recargar la página (por cliente, en este navegador).
  const clave = `carrito:${clienteId}`
  useEffect(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(clave) || '{}')
      const validos = new Set(items.map(i => i.id))
      setCarrito(Object.fromEntries(Object.entries(guardado).filter(([id, n]) => validos.has(id) && Number(n) > 0)) as Record<string, number>)
    } catch {}
  }, [clave, items])
  useEffect(() => { try { localStorage.setItem(clave, JSON.stringify(carrito)) } catch {} }, [clave, carrito])

  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [abierto])

  const porId = useMemo(() => new Map(items.map(i => [i.id, i])), [items])
  const tipos = useMemo(() => {
    const t = Array.from(new Set(items.map(i => i.categoria).filter(Boolean)))
    const orden = (x: string) => { const k = ORDEN_TIPO.indexOf(x); return k === -1 ? ORDEN_TIPO.length : k }
    return t.sort((a, b) => orden(a) - orden(b) || a.localeCompare(b))
  }, [items])
  const bodegas = useMemo(() => Array.from(new Set(items.map(i => i.bodega || i.varietal).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')), [items])

  const filtrados = useMemo(() => {
    const t = norm(q.trim())
    return items.filter(i =>
      (!tipo || i.categoria === tipo) &&
      (!bodega || (i.bodega || i.varietal) === bodega) &&
      (!soloDisp || i.disponible) &&
      (!t || norm(`${i.nombre} ${i.bodega} ${i.varietal}`).includes(t)))
  }, [items, q, tipo, bodega, soloDisp])

  const grupos = useMemo(() => {
    const m = new Map<string, Item[]>()
    for (const i of filtrados) {
      const k = i.bodega || i.varietal || 'Otros'
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(i)
    }
    return Array.from(m.entries())
  }, [filtrados])

  const lineas = Object.entries(carrito).map(([id, n]) => ({ item: porId.get(id)!, n })).filter(l => l.item)
  const botellas = lineas.reduce((s, l) => s + l.n, 0)
  const total = lineas.reduce((s, l) => s + l.n * l.item.precio, 0)
  const aConfirmar = lineas.filter(l => !l.item.disponible).length

  function poner(id: string, n: number) {
    setCarrito(c => {
      const x = { ...c }
      const v = Math.max(0, Math.min(999, Math.floor(n) || 0))
      if (v === 0) delete x[id]; else x[id] = v
      return x
    })
  }

  async function enviar() {
    setEnviando(true); setError('')
    try {
      const r = await fetch('/api/pedido', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lineas.map(l => ({ id: l.item.id, cantidad: l.n })), notas, fecha_entrega: fecha || null }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error || 'No se pudo enviar el pedido.'); return }
      setHecho({ numero: d.numero, total: d.total })
      setCarrito({}); setNotas(''); setFecha('')
    } catch {
      setError('Sin conexión. Tu pedido no se envió; probá de nuevo.')
    } finally { setEnviando(false) }
  }

  const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  return (
    <>
      <section className="hero">
        <div className="kicker">{preview ? 'Vista previa' : `Hola, ${clienteNombre}`}</div>
        <h1>{lista}</h1>
        <p>
          {descuento > 0 && <span className="tag">{descuento}% de descuento ya aplicado</span>}{' '}
          Precios y disponibilidad actualizados al {actualizado}. {items.length} etiquetas.
        </p>
      </section>

      <div className="filtros">
        <div className="buscar">
          <input type="search" placeholder="Buscar vino, bodega o varietal" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar" />
          <select value={bodega} onChange={e => setBodega(e.target.value)} aria-label="Bodega">
            <option value="">Todas las bodegas</option>
            {bodegas.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="chips">
          <button className="chip" aria-pressed={!tipo} onClick={() => setTipo('')}>Todos</button>
          {tipos.map(t => (
            <button key={t} className="chip" aria-pressed={tipo === t} onClick={() => setTipo(tipo === t ? '' : t)}>
              <span className={`dot dot-${t}`} />{PLURAL[t] ?? t}
            </button>
          ))}
          <button className="chip" aria-pressed={soloDisp} onClick={() => setSoloDisp(v => !v)}>Solo disponibles</button>
        </div>
      </div>

      {grupos.length === 0 && <div className="vacio">No hay productos con esos filtros.</div>}
      {grupos.map(([g, its]) => (
        <section className="grupo" key={g}>
          <div className="grupo-h"><h2>{g}</h2><small>{its.length} {its.length === 1 ? 'etiqueta' : 'etiquetas'}</small></div>
          {its.map(i => {
            const n = carrito[i.id] || 0
            return (
              <div key={i.id} className={`fila${i.disponible ? '' : ' agotado'}`}>
                <div>
                  <div className="fila-nom">{i.nombre}</div>
                  <div className="fila-sub">
                    {(i.categoria || i.varietal) && (
                      <span>{i.categoria && <span className={`dot dot-${i.categoria}`} />}{[i.varietal, i.categoria].filter((x, k, a) => x && a.indexOf(x) === k).join(' · ')}</span>
                    )}
                    <span className={`disp ${i.disponible ? 'disp-ok' : 'disp-no'}`}>{i.disponible ? 'Disponible' : 'A confirmar'}</span>
                  </div>
                </div>
                <div className="fila-der">
                  <div className="precio">
                    {descuento > 0 && <s>{pesos(i.precio_lista)}</s>}
                    <b>{pesos(i.precio)}</b>
                  </div>
                  {n === 0
                    ? <button className="agregar" onClick={() => poner(i.id, 1)} aria-label={`Agregar ${i.nombre}`}>Agregar</button>
                    : <Stepper n={n} onChange={v => poner(i.id, v)} nombre={i.nombre} />}
                </div>
              </div>
            )
          })}
        </section>
      ))}

      {botellas > 0 && !abierto && (
        <div className="barra">
          <div className="barra-in">
            <div><small>{botellas} {botellas === 1 ? 'botella' : 'botellas'} · {lineas.length} {lineas.length === 1 ? 'producto' : 'productos'}</small><strong>{pesos(total)}</strong></div>
            <button className="btn btn-ac" style={{ height: 46, borderRadius: 12 }} onClick={() => { setHecho(null); setAbierto(true) }}>Ver pedido</button>
          </div>
        </div>
      )}

      {abierto && (
        <div className="velo" onClick={e => { if (e.target === e.currentTarget && !enviando) setAbierto(false) }}>
          <aside className="panel" role="dialog" aria-label="Tu pedido">
            <div className="panel-h">
              <h2>{hecho ? 'Pedido enviado' : 'Tu pedido'}</h2>
              <button className="cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar" disabled={enviando}>✕</button>
            </div>
            {hecho ? (
              <div className="panel-b">
                <div className="ok">
                  <div className="ok-ico">✓</div>
                  <h2>¡Gracias!</h2>
                  <p>Recibimos tu pedido <b>{hecho.numero}</b> por {pesos(hecho.total)}.<br />Te vamos a contactar para confirmar la entrega.</p>
                  <button className="btn btn-ac btn-lg" onClick={() => setAbierto(false)}>Seguir viendo la lista</button>
                  <p style={{ marginTop: 16 }}><Link href="/pedidos">Ver mis pedidos</Link></p>
                </div>
              </div>
            ) : lineas.length === 0 ? (
              <div className="panel-b"><div className="vacio">Tu pedido está vacío.</div></div>
            ) : (
              <>
                <div className="panel-b">
                  {lineas.map(({ item, n }) => (
                    <div className="linea" key={item.id}>
                      <div>
                        <div className="fila-nom">{item.nombre}</div>
                        <div className="fila-sub">
                          <span>{pesos(item.precio)} c/u</span>
                          {!item.disponible && <span className="disp disp-no">A confirmar</span>}
                        </div>
                      </div>
                      <div className="linea-der">
                        <b>{pesos(item.precio * n)}</b>
                        <Stepper n={n} onChange={v => poner(item.id, v)} nombre={item.nombre} />
                      </div>
                    </div>
                  ))}
                  {aConfirmar > 0 && (
                    <div className="aviso">
                      {aConfirmar === 1 ? 'Un producto no tiene' : `${aConfirmar} productos no tienen`} stock inmediato. Igual lo tomamos en el pedido y te confirmamos si se puede conseguir.
                    </div>
                  )}
                  <label className="campo">
                    <span>Fecha de entrega deseada (opcional)</span>
                    <input type="date" min={manana} value={fecha} onChange={e => setFecha(e.target.value)} />
                  </label>
                  <label className="campo">
                    <span>Notas para el pedido (opcional)</span>
                    <textarea value={notas} maxLength={1000} onChange={e => setNotas(e.target.value)} placeholder="Horario de entrega, dirección, lo que necesites aclarar…" />
                  </label>
                </div>
                <div className="panel-f">
                  <div className="total"><span>{botellas} {botellas === 1 ? 'botella' : 'botellas'}</span><strong>{pesos(total)}</strong></div>
                  <button className="btn btn-ac btn-lg" onClick={enviar} disabled={enviando || preview}>{preview ? 'Vista previa: no se envían pedidos' : enviando ? 'Enviando…' : 'Enviar pedido'}</button>
                  {error && <div className="error">{error}</div>}
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  )
}

function Stepper({ n, onChange, nombre }: { n: number; onChange: (v: number) => void; nombre: string }) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(n - 1)} aria-label={`Quitar uno de ${nombre}`}>−</button>
      <input value={n} inputMode="numeric" aria-label={`Cantidad de ${nombre}`}
        onChange={e => onChange(parseInt(e.target.value.replace(/\D/g, '')) || 0)} onFocus={e => e.target.select()} />
      <button onClick={() => onChange(n + 1)} aria-label={`Sumar uno de ${nombre}`}>+</button>
    </div>
  )
}
