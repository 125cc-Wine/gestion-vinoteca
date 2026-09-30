'use client'
import { useState } from 'react'

// Marcas destacadas (salen primero en el portal, con tarjeta grande) y logos
// de bodegas/marcas. El logo se achica en el navegador antes de guardarlo.

export interface MarcaPortal { clave: string; destacada: boolean; orden: number; logo: string | null }

const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8',
  text: '#1A1210', muted: '#6B5D55', dim: '#A89888', wine: '#800000', gold: '#B88A2C',
}
const BTN: React.CSSProperties = { borderRadius: 8, padding: '6px 11px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${T.border2}`, background: T.surface, color: T.text, whiteSpace: 'nowrap' }

// Achica la imagen a 256 px de lado máximo. WebP conserva transparencia y
// pesa poco; los SVG se guardan tal cual.
async function achicar(archivo: File): Promise<string> {
  const dataUrl = await new Promise<string>((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = mal; r.readAsDataURL(archivo) })
  if (archivo.type === 'image/svg+xml') return dataUrl
  const img = await new Promise<HTMLImageElement>((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = dataUrl })
  const lado = 256, k = Math.min(1, lado / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  const webp = c.toDataURL('image/webp', 0.9)
  return webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/png')
}

export default function Marcas({ marcas, todas, onCambio, aviso }: {
  marcas: MarcaPortal[]; todas: string[]
  onCambio: (m: MarcaPortal[]) => void; aviso: (m: string) => void
}) {
  const [nueva, setNueva] = useState('')
  const [subiendo, setSubiendo] = useState<string | null>(null)
  // Marcas recién agregadas "solo para logo": se muestran hasta que se sube uno.
  const [extra, setExtra] = useState<string[]>([])

  async function enviar(clave: string, cambios: Partial<MarcaPortal>) {
    const d = await fetch('/api/lista-clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'marca', clave, ...cambios }) }).then(r => r.json())
    if (d.error) { aviso('Error: ' + d.error); return false }
    return true
  }
  function aplicar(base: MarcaPortal[], clave: string, cambios: Partial<MarcaPortal>) {
    const actual = base.find(m => m.clave === clave) || { clave, destacada: false, orden: 0, logo: null }
    const nuevo = { ...actual, ...cambios }
    const resto = base.filter(m => m.clave !== clave)
    return !nuevo.destacada && !nuevo.logo ? resto : [...resto, nuevo]
  }
  async function guardar(clave: string, cambios: Partial<MarcaPortal>) {
    if (!(await enviar(clave, cambios))) return false
    onCambio(aplicar(marcas, clave, cambios))
    setExtra(e => e.filter(x => x !== clave))
    return true
  }

  async function subirLogo(clave: string, archivo: File | undefined) {
    if (!archivo) return
    setSubiendo(clave)
    try {
      const logo = await achicar(archivo)
      if (await guardar(clave, { logo })) aviso(`Logo de ${clave} guardado`)
    } catch { aviso('No se pudo leer la imagen') } finally { setSubiendo(null) }
  }

  // Destacadas primero y en su orden; después las que solo tienen logo.
  const lista = [...marcas, ...extra.filter(c => !marcas.some(m => m.clave === c)).map(clave => ({ clave, destacada: false, orden: 0, logo: null }))].sort((a, b) => Number(b.destacada) - Number(a.destacada) || a.orden - b.orden || a.clave.localeCompare(b.clave, 'es'))
  const destacadas = lista.filter(m => m.destacada)

  async function mover(m: MarcaPortal, dir: -1 | 1) {
    const i = destacadas.findIndex(x => x.clave === m.clave), j = i + dir
    if (j < 0 || j >= destacadas.length) return
    const orden = destacadas.map(x => x.clave); [orden[i], orden[j]] = [orden[j], orden[i]]
    let nuevas = marcas
    for (let k = 0; k < orden.length; k++) {
      if (!(await enviar(orden[k], { orden: k + 1 }))) return
      nuevas = aplicar(nuevas, orden[k], { orden: k + 1 })
    }
    onCambio(nuevas)
  }

  function agregar(destacada: boolean) {
    if (!todas.includes(nueva)) return
    if (destacada) guardar(nueva, { destacada: true, orden: destacadas.length + 1 })
    else setExtra(e => [...e, nueva])
    setNueva('')
  }

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>⭐ Destacadas y logos</div>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 12 }}>
        Las destacadas salen primero en el portal, en tarjeta grande. Cualquier bodega o marca puede tener logo (PNG, JPG, WebP o SVG; se achica solo).
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lista.map(m => (
          <div key={m.clave} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', border: `1px solid ${T.border}`, background: m.destacada ? 'rgba(184,138,44,0.06)' : T.bg, borderRadius: 10, padding: '8px 12px' }}>
            {m.logo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={m.logo} alt="" style={{ width: 48, height: 48, objectFit: 'contain', background: '#fff', borderRadius: 8, border: `1px solid ${T.border}`, padding: 3 }} />
              : <div style={{ width: 48, height: 48, borderRadius: 8, border: `1px dashed ${T.border2}`, display: 'grid', placeItems: 'center', fontSize: 10, color: T.dim, textAlign: 'center' }}>sin logo</div>}
            <b style={{ flex: 1, minWidth: 120, fontSize: 14 }}>{m.destacada && <span style={{ color: T.gold }}>★ </span>}{m.clave}</b>
            <label style={{ ...BTN, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {subiendo === m.clave ? 'Subiendo…' : m.logo ? 'Cambiar logo' : 'Subir logo'}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: 'none' }} onChange={e => { subirLogo(m.clave, e.target.files?.[0]); e.target.value = '' }} />
            </label>
            {m.logo && <button style={BTN} onClick={() => guardar(m.clave, { logo: null })}>Quitar logo</button>}
            <button style={{ ...BTN, color: m.destacada ? T.gold : T.muted }} onClick={() => guardar(m.clave, { destacada: !m.destacada, orden: m.destacada ? 0 : destacadas.length + 1 })}>
              {m.destacada ? '★ Destacada' : '☆ Destacar'}
            </button>
            {m.destacada && (
              <span style={{ display: 'inline-flex', gap: 4 }}>
                <button style={{ ...BTN, padding: '6px 9px' }} title="Subir" onClick={() => mover(m, -1)}>↑</button>
                <button style={{ ...BTN, padding: '6px 9px' }} title="Bajar" onClick={() => mover(m, 1)}>↓</button>
              </span>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <input list="lc-marcas" placeholder="Bodega o marca…" value={nueva} onChange={e => setNueva(e.target.value)}
          style={{ padding: '7px 9px', borderRadius: 7, border: `1px solid ${T.border2}`, fontSize: 13, fontFamily: 'inherit', width: 240 }} />
        <button style={{ ...BTN, opacity: todas.includes(nueva) ? 1 : 0.5 }} disabled={!todas.includes(nueva)} onClick={() => agregar(true)}>★ Destacar</button>
        <button style={{ ...BTN, opacity: todas.includes(nueva) ? 1 : 0.5 }} disabled={!todas.includes(nueva)} onClick={() => agregar(false)}>Solo agregar logo</button>
      </div>
    </div>
  )
}
