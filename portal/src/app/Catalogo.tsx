'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface Item {
  id: string; nombre: string; bodega: string; varietal: string; categoria: string
  precio_lista: number; precio: number; descuento: number; disponible: boolean
}

const ORDEN_TIPO = ['Espumante', 'Blanco', 'Rosado', 'Tinto', 'Dulce']
const PLURAL: Record<string, string> = { Espumante: 'Espumantes', Blanco: 'Blancos', Rosado: 'Rosados', Tinto: 'Tintos', Dulce: 'Dulces', Otro: 'Aperitivos y destilados' }

// Los vinos se agrupan por bodega; el resto (categoría "Otro": vermouths,
// whiskies, gin, sodas…) por su rubro, que en gestión vive en "varietal".
const esBebida = (i: { categoria: string }) => i.categoria === 'Otro'
const grupoDe = (i: { categoria: string; bodega: string; varietal: string }) =>
  esBebida(i) ? (i.varietal || 'Otras bebidas') : (i.bodega || 'Otras bodegas')
const pesos = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR')

export interface MarcaDestacada { clave: string; logo: string | null; destacada: boolean }
type Vista = { tipo: 'bodega' | 'rubro' | 'marca'; clave: string } | null

// Monograma para bodegas sin logo: iniciales sobre un tono tomado del nombre.
const TONOS = ['#7A1022', '#8A5A2B', '#4E6B3A', '#2F5D7C', '#6B4C7A', '#9A6A12', '#5C4033', '#3E6E6A']
function Mono({ nombre, grande = false }: { nombre: string; grande?: boolean }) {
  const ini = nombre.replace(/^(bodegas?|finca|ch[aâ]teau[x]?)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  let h = 0; for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return <span className={`mono${grande ? ' mono-g' : ''}`} style={{ background: TONOS[h % TONOS.length] }}>{ini || '·'}</span>
}
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function Catalogo({ clienteId, clienteNombre, actualizado, items, marcas = [], preview = false }: {
  clienteId: string; clienteNombre: string; actualizado: string; items: Item[]; marcas?: MarcaDestacada[]; preview?: boolean
}) {
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState('')
  const [vista, setVista] = useState<Vista>(null)
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

  function abrirVista(v: Vista) { setVista(v); setQ(''); setTipo(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const porId = useMemo(() => new Map(items.map(i => [i.id, i])), [items])
  const destacada = useMemo(() => new Map(marcas.filter(m => m.destacada).map((m, k) => [m.clave, k])), [marcas])
  const logoDe = (nombre: string) => marcas.find(m => m.clave === nombre)?.logo ?? null
  const tipos = useMemo(() => {
    const t = Array.from(new Set(items.map(i => i.categoria).filter(Boolean)))
    const orden = (x: string) => { const k = ORDEN_TIPO.indexOf(x); return k === -1 ? ORDEN_TIPO.length : k }
    return t.sort((a, b) => orden(a) - orden(b) || a.localeCompare(b))
  }, [items])

  const base = useMemo(() => items.filter(i => !soloDisp || i.disponible), [items, soloDisp])

  // Tarjetas del inicio: destacadas, bodegas (vinos) y rubros (bebidas).
  const tarjetas = useMemo(() => {
    const cuenta = (lista: Item[]) => ({ n: lista.length, disp: lista.filter(i => i.disponible).length, tipos: Array.from(new Set(lista.map(i => i.categoria))) })
    const agrupar = (f: (i: Item) => string | null) => {
      const m = new Map<string, Item[]>()
      for (const i of base) { const k = f(i); if (!k) continue; if (!m.has(k)) m.set(k, []); m.get(k)!.push(i) }
      return m
    }
    const dest = marcas.filter(m => m.destacada).map(m => ({ nombre: m.clave, logo: m.logo, ...cuenta(base.filter(i => i.bodega === m.clave)) })).filter(d => d.n > 0)
    const bod = Array.from(agrupar(i => esBebida(i) ? null : grupoDe(i)).entries())
      .map(([nombre, l]) => ({ nombre, ...cuenta(l) }))
      .sort((a, b) => (a.nombre === 'Otras bodegas' ? 1 : 0) - (b.nombre === 'Otras bodegas' ? 1 : 0) || a.nombre.localeCompare(b.nombre, 'es'))
    const rub = Array.from(agrupar(i => esBebida(i) ? grupoDe(i) : null).entries())
      .map(([nombre, l]) => ({ nombre, ...cuenta(l) }))
      .sort((a, b) => b.n - a.n)
    return { dest, bod, rub }
  }, [base, marcas])

  const buscando = !!q.trim() || !!tipo
  const filtrados = useMemo(() => {
    const t = norm(q.trim())
    return base.filter(i =>
      (!tipo || i.categoria === tipo) &&
      (buscando || !vista || (vista.tipo === 'marca' ? i.bodega === vista.clave : grupoDe(i) === vista.clave && (vista.tipo === 'rubro') === esBebida(i))) &&
      (!t || norm(`${i.nombre} ${i.bodega} ${i.varietal}`).includes(t)))
  }, [base, q, tipo, vista, buscando])

  // En una bodega se separa por tipo de vino; en un rubro o marca, por marca.
  // En resultados de búsqueda, por bodega / rubro con las destacadas primero.
  const grupos = useMemo(() => {
    const clave = (i: Item) => !buscando && vista
      ? (vista.tipo === 'rubro' ? (i.bodega || 'Otras marcas') : esBebida(i) ? (i.varietal || 'Otras bebidas') : (PLURAL[i.categoria] ?? i.categoria))
      : grupoDe(i)
    const m = new Map<string, Item[]>()
    for (const i of filtrados) { const k = clave(i); if (!m.has(k)) m.set(k, []); m.get(k)!.push(i) }
    const ordTipo = (k: string) => { const x = ORDEN_TIPO.findIndex(t => (PLURAL[t] ?? t) === k); return x === -1 ? 99 : x }
    const peso = (k: string, its: Item[]) => {
      if (!buscando && vista && vista.tipo !== 'rubro') return ordTipo(k)
      const d = its.some(i => destacada.has(i.bodega)) ? 0 : 1
      return d * 10 + (esBebida(its[0]) ? 1 : 0)
    }
    for (const its of Array.from(m.values())) its.sort((a, b) => (destacada.has(a.bodega) ? 0 : 1) - (destacada.has(b.bodega) ? 0 : 1))
    return Array.from(m.entries()).sort((a, b) => peso(...a) - peso(...b) || a[0].localeCompare(b[0], 'es'))
  }, [filtrados, buscando, vista, destacada])

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
        <h1>Lista de precios</h1>
        <p>
          {items.some(i => i.descuento > 0) && <span className="tag">Tu descuento ya está aplicado</span>}{' '}
          Precios y disponibilidad actualizados al {actualizado}. {items.length} productos.
        </p>
      </section>

      <div className="filtros">
        <div className="buscar">
          <input type="search" placeholder="Buscar vino, bodega, varietal o bebida" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar" />
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

      {!buscando && !vista ? (
        <>
          {tarjetas.dest.length > 0 && (
            <section className="seccion">
              <h2 className="seccion-t">Destacados</h2>
              <div className="dest-grid">
                {tarjetas.dest.map(d => (
                  <button key={d.nombre} className="dest" onClick={() => abrirVista({ tipo: 'marca', clave: d.nombre })}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {d.logo ? <img src={d.logo} alt={d.nombre} className="dest-logo" /> : <Mono nombre={d.nombre} grande />}
                    <span className="dest-txt">
                      <b>{d.nombre}</b>
                      <small>{d.n} {d.n === 1 ? 'producto' : 'productos'} · {d.disp} disponibles</small>
                    </span>
                    <span className="flecha">→</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <SeccionTarjetas titulo="Bodegas" unidad={['etiqueta', 'etiquetas']} lista={tarjetas.bod} logoDe={logoDe}
            abrir={n => abrirVista({ tipo: 'bodega', clave: n })} />
          {tarjetas.rub.length > 0 && (
            <SeccionTarjetas titulo="Aperitivos y destilados" unidad={['producto', 'productos']} lista={tarjetas.rub} logoDe={() => null}
              abrir={n => abrirVista({ tipo: 'rubro', clave: n })} />
          )}
        </>
      ) : (
        <>
          {!buscando && vista && (
            <div className="vista-h">
              <button className="volver" onClick={() => abrirVista(null)}>← Todas las bodegas</button>
              <div className="vista-id">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {logoDe(vista.clave) ? <img src={logoDe(vista.clave)!} alt={vista.clave} className="dest-logo" /> : <Mono nombre={vista.clave} grande />}
                <div>
                  <h2>{vista.clave}</h2>
                  <small>{filtrados.length} {filtrados.length === 1 ? 'producto' : 'productos'} · {filtrados.filter(i => i.disponible).length} disponibles</small>
                </div>
              </div>
            </div>
          )}
          {buscando && vista && <button className="volver" style={{ marginTop: 16 }} onClick={() => { setQ(''); setTipo('') }}>← Volver a {vista.clave}</button>}
          {grupos.length === 0 && <div className="vacio">No hay productos con esos filtros.</div>}
          {grupos.map(([g, its]) => (
            <section className={`grupo${!buscando && vista ? ' grupo-sub' : ''}`} key={g}>
              <div className="grupo-h"><h2>{g}</h2><small>{its.length} {its.length === 1 ? 'etiqueta' : 'etiquetas'}</small></div>
              {its.map(i => {
                const n = carrito[i.id] || 0
                return (
                  <div key={i.id} className={`fila${i.disponible ? '' : ' agotado'}`}>
                    <div>
                      <div className="fila-nom">{destacada.has(i.bodega) && <span className="estrella" title="Destacado">★</span>}{i.nombre}</div>
                      <div className="fila-sub">
                        {(i.categoria || i.varietal) && (
                          <span>{i.categoria && <span className={`dot dot-${i.categoria}`} />}{[i.varietal, i.categoria === 'Otro' ? '' : i.categoria].filter((x, k, a) => x && a.indexOf(x) === k).join(' · ')}</span>
                        )}
                        <span className={`disp ${i.disponible ? 'disp-ok' : 'disp-no'}`}>{i.disponible ? 'Disponible' : 'A confirmar'}</span>
                      </div>
                    </div>
                    <div className="fila-der">
                      <div className="precio">
                        {i.descuento > 0 && <s>{pesos(i.precio_lista)} <em>−{i.descuento}%</em></s>}
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
        </>
      )}

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
                  <button className="btn btn-ac btn-lg" onClick={() => setAbierto(false)}>Seguir viendo el catálogo</button>
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

interface Tarjeta { nombre: string; n: number; disp: number; tipos: string[] }

// Grilla de bodegas o rubros: primero las que tienen stock (con la cantidad
// en verde) y abajo, plegadas, las que hoy son "a pedido". Los logos siempre a
// todo color: el estado lo marca la etiqueta, no un gris sobre la tarjeta.
function SeccionTarjetas({ titulo, unidad, lista, logoDe, abrir }: {
  titulo: string; unidad: [string, string]; lista: Tarjeta[]
  logoDe: (n: string) => string | null; abrir: (n: string) => void
}) {
  const [verPedido, setVerPedido] = useState(false)
  const conStock = lista.filter(t => t.disp > 0)
  const aPedido = lista.filter(t => t.disp === 0)
  const tarjeta = (t: Tarjeta) => {
    const logo = logoDe(t.nombre)
    return (
      <button key={t.nombre} className="card" onClick={() => abrir(t.nombre)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo ? <img src={logo} alt="" className="card-logo" /> : <Mono nombre={t.nombre} />}
        <span className="card-txt">
          <b>{t.nombre}</b>
          <small>{t.n} {t.n === 1 ? unidad[0] : unidad[1]}</small>
          <span className="card-pie">
            {t.disp > 0
              ? <span className="estado-ok">{t.disp} en stock</span>
              : <span className="estado-pedido">A pedido</span>}
            {t.tipos.length > 0 && <span className="card-dots">{[...t.tipos].sort().map(x => <span key={x} className={`dot dot-${x}`} title={PLURAL[x] ?? x} />)}</span>}
          </span>
        </span>
      </button>
    )
  }
  return (
    <section className="seccion">
      <h2 className="seccion-t">{titulo}
        <small><span className="resumen-ok">{conStock.length} con stock</span>{aPedido.length > 0 && <> · {aPedido.length} a pedido</>}</small>
      </h2>
      {conStock.length > 0 && <div className="cards">{conStock.map(tarjeta)}</div>}
      {aPedido.length > 0 && (
        <div className="pedido">
          <button className="pedido-h" onClick={() => setVerPedido(v => !v)} aria-expanded={verPedido}>
            <span><b>A pedido</b> · {aPedido.length} {titulo === 'Bodegas' ? 'bodegas' : 'rubros'} sin stock inmediato: te confirmamos si se consigue</span>
            <span className="pedido-flecha">{verPedido ? 'Ocultar ▴' : 'Ver ▾'}</span>
          </button>
          {verPedido && <div className="cards">{aPedido.map(tarjeta)}</div>}
        </div>
      )}
    </section>
  )
}
