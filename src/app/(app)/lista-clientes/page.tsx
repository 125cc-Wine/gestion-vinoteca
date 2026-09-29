'use client'
import { useEffect, useMemo, useState } from 'react'
import { grupoPrecio, indexarReglas, precioPortal, type ReglaPortal } from '@/lib/precioPortal'

// Catálogo > Lista para clientes: la lista de precios que ven los clientes en
// el portal. Descuento general, descuentos por tipo de vino / rubro de bebida,
// por marca y por producto, y qué no se muestra. Todo se ve con el precio
// final calculado igual que en el portal (src/lib/precioPortal.ts).

const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8',
  text: '#1A1210', muted: '#6B5D55', dim: '#A89888', wine: '#800000', wineBg: 'rgba(128,0,0,0.07)',
  green: '#2D7A4F', red: '#C03030', redBg: 'rgba(192,48,48,0.08)', blue: '#2B5EA0', blueBg: 'rgba(43,94,160,0.08)',
  amber: '#A07010', amberBg: 'rgba(160,112,16,0.08)',
}
const INP: React.CSSProperties = { padding: '7px 9px', borderRadius: 7, border: `1px solid ${T.border2}`, fontSize: 13, fontFamily: 'inherit', background: T.surface, color: T.text, outline: 'none', boxSizing: 'border-box' }
const BTN: React.CSSProperties = { borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${T.border2}`, background: T.surface, color: T.text, whiteSpace: 'nowrap' }
const CARD: React.CSSProperties = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }
const TH: React.CSSProperties = { padding: '9px 12px', textAlign: 'left', fontSize: 11, color: T.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '8px 12px', borderBottom: `1px solid ${T.border}`, fontSize: 13, verticalAlign: 'middle' }
const ORDEN_VINO = ['Espumante', 'Blanco', 'Rosado', 'Tinto', 'Dulce']
const pesos = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

interface Producto { id: string; nombre: string; bodega: string | null; varietal: string | null; categoria: string | null; precio_venta: number; stock: number | null; portal_oculto: boolean }

const ORIGEN: Record<string, { txt: string; color: string; bg: string }> = {
  base: { txt: 'general', color: T.dim, bg: 'transparent' },
  grupo: { txt: 'rubro', color: T.blue, bg: T.blueBg },
  marca: { txt: 'marca', color: T.amber, bg: T.amberBg },
  producto: { txt: 'producto', color: T.wine, bg: T.wineBg },
}

// Input de % que guarda al salir o con Enter. Vacío = hereda.
function Pct({ valor, placeholder, onSave, width = 72 }: { valor: number | null; placeholder: string; onSave: (v: string) => void; width?: number }) {
  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      <input key={String(valor)} type="number" min={0} max={99} defaultValue={valor ?? ''} placeholder={placeholder}
        onBlur={e => { const v = e.target.value.trim(); if ((v === '' ? null : Number(v)) !== valor) onSave(v) }}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        style={{ ...INP, width, textAlign: 'right' }} /> <span style={{ color: T.muted, fontSize: 12 }}>%</span>
    </span>
  )
}

function Ojo({ visible, onClick, titulo }: { visible: boolean; onClick: () => void; titulo: string }) {
  return (
    <button onClick={onClick} title={titulo}
      style={{ ...BTN, padding: '5px 10px', fontSize: 12, background: visible ? T.surface : T.redBg, borderColor: visible ? T.border2 : 'rgba(192,48,48,0.25)', color: visible ? T.green : T.red }}>
      {visible ? '✓ Se muestra' : '✕ Oculto'}
    </button>
  )
}

export default function ListaClientesPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [reglas, setReglas] = useState<ReglaPortal[]>([])
  const [general, setGeneral] = useState(35)
  const [cargando, setCargando] = useState(true)
  const [toast, setToast] = useState('')
  const [q, setQ] = useState('')
  const [grupoSel, setGrupoSel] = useState('')
  const [soloStock, setSoloStock] = useState(false)
  const [verOcultos, setVerOcultos] = useState(true)
  const [limite, setLimite] = useState(150)
  const [marcaNueva, setMarcaNueva] = useState('')

  function aviso(m: string) { setToast(m); setTimeout(() => setToast(''), 3000) }

  async function cargar() {
    const d = await fetch('/api/lista-clientes').then(r => r.json())
    if (d.error) { aviso('Error: ' + d.error); return }
    setProductos(d.productos); setReglas(d.reglas); setGeneral(d.general); setCargando(false)
  }
  useEffect(() => { cargar() }, [])

  const idx = useMemo(() => indexarReglas(reglas), [reglas])
  const regla = (nivel: ReglaPortal['nivel'], clave: string) => idx.get(`${nivel}:${clave}`)

  async function post(url: string, body: object) {
    const d = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json())
    if (d.error) { aviso('Error: ' + d.error); return false }
    return true
  }

  // Actualiza la regla en memoria (sin recargar todo) y la guarda.
  async function guardarRegla(nivel: ReglaPortal['nivel'], clave: string, cambios: { descuento?: string; oculto?: boolean }) {
    const actual = regla(nivel, clave)
    const descuento = cambios.descuento !== undefined ? (cambios.descuento === '' ? null : Number(cambios.descuento)) : (actual?.descuento ?? null)
    const oculto = cambios.oculto !== undefined ? cambios.oculto : (actual?.oculto ?? false)
    if (!(await post('/api/lista-clientes', { accion: 'regla', nivel, clave, descuento, oculto }))) return
    setReglas(prev => {
      const resto = prev.filter(r => !(r.nivel === nivel && r.clave === clave))
      return descuento == null && !oculto ? resto : [...resto, { nivel, clave, descuento, oculto }]
    })
    aviso('Guardado')
  }

  async function guardarGeneral(v: string) {
    if (v === '') return
    if (await post('/api/lista-clientes', { accion: 'general', descuento: v })) { setGeneral(Number(v)); aviso(`Descuento general: ${v}%`) }
  }

  async function ocultarProducto(p: Producto, oculto: boolean) {
    // El oculto por producto vive en productos.portal_oculto (se replica al gemelo).
    if (!(await post('/api/clientes/portal', { accion: 'ocultar', producto_id: p.id, oculto }))) return
    setProductos(prev => prev.map(x => x.id === p.id ? { ...x, portal_oculto: oculto } : x))
  }

  async function cambiarRubro(p: Producto, varietal: string) {
    if (!varietal.trim() || varietal === p.varietal) return
    if (!(await post('/api/lista-clientes', { accion: 'rubro', producto_id: p.id, varietal }))) return
    setProductos(prev => prev.map(x => x.id === p.id ? { ...x, varietal: varietal.trim() } : x))
    aviso(`"${p.nombre}" pasó a ${varietal}`)
  }

  // Grupos (tipo de vino / rubro de bebida) con sus cantidades.
  const grupos = useMemo(() => {
    const m = new Map<string, { nombre: string; bebida: boolean; n: number; stock: number }>()
    // Los ocultos uno por uno (comida, aceites…) no cuentan: si un grupo
    // queda sin productos, no aparece en la tabla de descuentos.
    for (const p of productos) {
      if (p.portal_oculto) continue
      const g = grupoPrecio(p)
      const x = m.get(g) || { nombre: g, bebida: p.categoria === 'Otro', n: 0, stock: 0 }
      x.n++; if ((p.stock ?? 0) > 0) x.stock++
      m.set(g, x)
    }
    const ordVino = (g: string) => { const i = ORDEN_VINO.indexOf(g); return i === -1 ? 99 : i }
    return Array.from(m.values()).sort((a, b) => Number(a.bebida) - Number(b.bebida) || (a.bebida ? b.n - a.n : ordVino(a.nombre) - ordVino(b.nombre)))
  }, [productos])
  const rubros = grupos.filter(g => g.bebida).map(g => g.nombre)
  const marcas = useMemo(() => Array.from(new Set(productos.map(p => p.bodega).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'es')), [productos])
  const reglasMarca = reglas.filter(r => r.nivel === 'marca').sort((a, b) => a.clave.localeCompare(b.clave, 'es'))

  const filas = useMemo(() => {
    const t = norm(q.trim())
    return productos
      .map(p => ({ p, r: precioPortal(p, idx, general) }))
      .filter(({ p, r }) =>
        (!grupoSel || grupoPrecio(p) === grupoSel) &&
        (!soloStock || (p.stock ?? 0) > 0) &&
        (verOcultos || !r.oculto) &&
        (!t || norm(`${p.nombre} ${p.bodega || ''} ${p.varietal || ''}`).includes(t)))
  }, [productos, idx, general, q, grupoSel, soloStock, verOcultos])

  const visiblesTotal = useMemo(() => productos.filter(p => !precioPortal(p, idx, general).oculto).length, [productos, idx, general])

  // La ventana se abre en el clic para que el navegador no la bloquee.
  async function verComoCliente() {
    const w = window.open('about:blank', '_blank')
    const empresa = localStorage.getItem('empresa') || 'aroma'
    const d = await fetch('/api/clientes/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'admin', empresa }) }).then(r => r.json())
    if (d.error || !d.url) { w?.close(); aviso('Error: ' + (d.error || 'no se pudo abrir')); return }
    if (w) w.location.href = d.url; else window.location.href = d.url
  }

  if (cargando) return <div style={{ padding: 40, color: T.dim }}>Cargando…</div>

  return (
    <div style={{ padding: '24px 20px 80px', maxWidth: 1100, margin: '0 auto', color: T.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Lista de precios para clientes</h1>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
            Lo que ven los clientes en el portal: {visiblesTotal} productos a la vista. Un cliente con descuento propio (en Portal clientes) lo usa en lugar del general; las reglas de rubro, marca y producto se le aplican igual.
          </div>
        </div>
        <button style={{ ...BTN, background: T.wine, color: '#FFF', border: 'none' }} onClick={verComoCliente}>👁 Ver como cliente</button>
      </div>

      {/* Descuentos por grupo */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Descuentos</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            General <Pct valor={general} placeholder="35" onSave={guardarGeneral} />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
          {[{ titulo: 'Vinos (por tipo)', lista: grupos.filter(g => !g.bebida) }, { titulo: 'Bebidas (por rubro)', lista: grupos.filter(g => g.bebida) }].map(sec => (
            <div key={sec.titulo} style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: T.bg }}><th style={TH}>{sec.titulo}</th><th style={TH}>Prod.</th><th style={TH}>Descuento</th><th style={TH}></th></tr></thead>
                <tbody>
                  {sec.lista.map(g => {
                    const r = regla('grupo', g.nombre)
                    return (
                      <tr key={g.nombre} style={{ background: grupoSel === g.nombre ? T.wineBg : undefined }}>
                        <td style={TD}>
                          <button onClick={() => { setGrupoSel(grupoSel === g.nombre ? '' : g.nombre); setLimite(150) }} title="Ver estos productos abajo"
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: r?.oculto ? T.dim : T.text, textDecoration: r?.oculto ? 'line-through' : 'none' }}>
                            {g.nombre}
                          </button>
                        </td>
                        <td style={{ ...TD, color: T.muted, fontSize: 12 }}>{g.n} <span style={{ color: T.dim }}>({g.stock} c/stock)</span></td>
                        <td style={TD}><Pct valor={r?.descuento ?? null} placeholder={`${general}`} onSave={v => guardarRegla('grupo', g.nombre, { descuento: v })} /></td>
                        <td style={{ ...TD, textAlign: 'right' }}><Ojo visible={!r?.oculto} titulo={r?.oculto ? 'Mostrar este grupo' : 'Ocultar todo este grupo'} onClick={() => guardarRegla('grupo', g.nombre, { oculto: !r?.oculto })} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Por marca */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Por marca o bodega <span style={{ fontWeight: 400, color: T.muted }}>— manda sobre el rubro (ej. Martini al 25%)</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {reglasMarca.map(r => (
              <span key={r.clave} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${T.border}`, background: T.bg, borderRadius: 10, padding: '5px 8px 5px 12px', fontSize: 13 }}>
                <b style={{ textDecoration: r.oculto ? 'line-through' : 'none', color: r.oculto ? T.dim : T.text }}>{r.clave}</b>
                <Pct valor={r.descuento} placeholder="—" width={60} onSave={v => guardarRegla('marca', r.clave, { descuento: v })} />
                <Ojo visible={!r.oculto} titulo="Ocultar / mostrar esta marca" onClick={() => guardarRegla('marca', r.clave, { oculto: !r.oculto })} />
                <button title="Quitar regla" onClick={() => guardarRegla('marca', r.clave, { descuento: '', oculto: false })} style={{ background: 'none', border: 'none', color: T.dim, cursor: 'pointer', fontSize: 15 }}>×</button>
              </span>
            ))}
            <input list="lc-marcas" placeholder="+ Agregar marca…" value={marcaNueva} onChange={e => setMarcaNueva(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && marcas.includes(marcaNueva)) { guardarRegla('marca', marcaNueva, { descuento: String(general) }); setMarcaNueva('') } }}
              style={{ ...INP, width: 220 }} />
            {marcas.includes(marcaNueva) && <button style={BTN} onClick={() => { guardarRegla('marca', marcaNueva, { descuento: String(general) }); setMarcaNueva('') }}>Agregar</button>}
            <datalist id="lc-marcas">{marcas.map(m => <option key={m} value={m} />)}</datalist>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderBottom: `1px solid ${T.border}` }}>
          <input style={{ ...INP, flex: 1, minWidth: 220 }} placeholder="Buscar producto, bodega o rubro…" value={q} onChange={e => { setQ(e.target.value); setLimite(150) }} />
          <select style={INP} value={grupoSel} onChange={e => { setGrupoSel(e.target.value); setLimite(150) }}>
            <option value="">Todos los tipos y rubros</option>
            {grupos.map(g => <option key={g.nombre} value={g.nombre}>{g.nombre}</option>)}
          </select>
          <label style={{ fontSize: 12.5, color: T.muted, display: 'flex', gap: 5, alignItems: 'center' }}><input type="checkbox" checked={soloStock} onChange={e => setSoloStock(e.target.checked)} /> Solo con stock</label>
          <label style={{ fontSize: 12.5, color: T.muted, display: 'flex', gap: 5, alignItems: 'center' }}><input type="checkbox" checked={verOcultos} onChange={e => setVerOcultos(e.target.checked)} /> Ver ocultos</label>
          <span style={{ fontSize: 12, color: T.dim }}>{filas.length} productos</span>
        </div>
        <datalist id="lc-rubros">{rubros.map(r => <option key={r} value={r} />)}</datalist>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Producto', 'Rubro / tipo', 'Stock', 'Precio lista', 'Desc. propio', 'Aplica', 'Precio cliente', ''].map(h => <th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filas.slice(0, limite).map(({ p, r }) => {
                const rp = regla('producto', p.id)
                const o = ORIGEN[r.origen]
                return (
                  <tr key={p.id} style={{ opacity: r.oculto ? 0.5 : 1 }}>
                    <td style={TD}>
                      <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                      <div style={{ fontSize: 11.5, color: T.dim }}>{p.bodega || 'sin bodega/marca'}</div>
                    </td>
                    <td style={TD}>
                      {p.categoria === 'Otro'
                        ? <input key={p.varietal || ''} list="lc-rubros" defaultValue={p.varietal || ''} placeholder="rubro"
                            onBlur={e => cambiarRubro(p, e.target.value)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                            style={{ ...INP, width: 150, fontSize: 12.5 }} title="Rubro: cambiarlo mueve la bebida de grupo" />
                        : <span style={{ fontSize: 12.5, color: T.muted }}>{p.categoria || '—'}</span>}
                    </td>
                    <td style={{ ...TD, color: (p.stock ?? 0) > 0 ? T.green : T.dim, fontSize: 12.5 }}>{p.stock ?? 0}</td>
                    <td style={{ ...TD, whiteSpace: 'nowrap' }}>{pesos(r.lista)}</td>
                    <td style={TD}><Pct valor={rp?.descuento ?? null} placeholder={`${r.origen === 'producto' ? general : r.descuento}`} width={64} onSave={v => guardarRegla('producto', p.id, { descuento: v })} /></td>
                    <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                      <b>{r.descuento}%</b> <span style={{ fontSize: 10.5, fontWeight: 700, color: o.color, background: o.bg, borderRadius: 5, padding: '1px 5px', marginLeft: 3 }}>{o.txt}</span>
                    </td>
                    <td style={{ ...TD, fontWeight: 700, whiteSpace: 'nowrap' }}>{r.oculto ? <span style={{ color: T.dim, fontWeight: 400 }}>no se muestra</span> : pesos(r.precio)}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      {r.oculto && !p.portal_oculto
                        ? <span style={{ fontSize: 11.5, color: T.dim }} title="Se oculta por la regla de su rubro, tipo o marca">oculto por regla</span>
                        : <Ojo visible={!p.portal_oculto} titulo={p.portal_oculto ? 'Mostrar este producto' : 'Ocultar este producto'} onClick={() => ocultarProducto(p, !p.portal_oculto)} />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filas.length > limite && (
          <button style={{ ...BTN, width: '100%', borderRadius: 0, border: 'none', borderTop: `1px solid ${T.border}` }} onClick={() => setLimite(l => l + 300)}>
            Ver más ({filas.length - limite} restantes)
          </button>
        )}
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: T.text, color: '#FFF', padding: '10px 18px', borderRadius: 10, fontSize: 13, zIndex: 300 }}>{toast}</div>}
    </div>
  )
}
