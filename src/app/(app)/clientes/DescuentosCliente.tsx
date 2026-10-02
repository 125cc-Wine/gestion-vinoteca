'use client'
import { useEffect, useState } from 'react'

// Descuentos especiales de UN cliente en el portal: por bodega/marca, por
// tipo de vino o rubro (grupo) o por producto. Pisan las reglas generales de
// Catálogo > Lista para clientes y el descuento base del cliente.

export interface ReglaCliente { nivel: 'grupo' | 'marca' | 'producto'; clave: string; descuento: number }
interface Opciones { marcas: string[]; grupos: string[]; productos: { id: string; nombre: string }[] }

const T = { bg: '#F5F1EC', border: '#DDD0C0', border2: '#C8BAA8', text: '#1A1210', muted: '#6B5D55', dim: '#A89888', wine: '#800000' }
const INP: React.CSSProperties = { padding: '7px 9px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 13, fontFamily: 'inherit', background: '#fff', minWidth: 0 }
const NIVEL: Record<ReglaCliente['nivel'], string> = { marca: 'Bodega / marca', grupo: 'Tipo o rubro', producto: 'Producto' }

const cache = new Map<string, Promise<Opciones>>()
function opcionesDe(empresa: string) {
  if (!cache.has(empresa)) cache.set(empresa, fetch(`/api/clientes/portal?opciones=1&empresa=${empresa}`).then(r => r.json()).then(d => d.error ? { marcas: [], grupos: [], productos: [] } : d))
  return cache.get(empresa)!
}

export default function DescuentosCliente({ clienteId, empresa, reglas, onCambio, aviso }: {
  clienteId: string; empresa: string; reglas: ReglaCliente[]; onCambio: (r: ReglaCliente[]) => void; aviso: (m: string) => void
}) {
  const [op, setOp] = useState<Opciones | null>(null)
  const [nivel, setNivel] = useState<ReglaCliente['nivel']>('marca')
  const [clave, setClave] = useState('')
  const [pct, setPct] = useState('')
  const [ocupado, setOcupado] = useState(false)
  useEffect(() => { opcionesDe(empresa).then(setOp) }, [empresa])

  const nombreProducto = (id: string) => op?.productos.find(p => p.id === id)?.nombre ?? id
  // Para productos se escribe el nombre; se guarda el id.
  const claveReal = nivel === 'producto' ? op?.productos.find(p => p.nombre === clave)?.id ?? '' : clave
  const lista = nivel === 'marca' ? op?.marcas : nivel === 'grupo' ? op?.grupos : op?.productos.map(p => p.nombre)
  const valido = !!claveReal && (nivel === 'producto' || !!lista?.includes(clave)) && pct.trim() !== '' && Number(pct) >= 0 && Number(pct) < 100

  async function guardar(r: { nivel: string; clave: string; descuento: number | null }) {
    setOcupado(true)
    try {
      const d = await fetch('/api/clientes/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'regla_cliente', cliente_id: clienteId, ...r }) }).then(x => x.json())
      if (d.error) { aviso('Error: ' + d.error); return false }
      return true
    } finally { setOcupado(false) }
  }

  async function agregar() {
    const r = { nivel, clave: claveReal, descuento: Number(pct) }
    if (!(await guardar(r))) return
    onCambio([...reglas.filter(x => !(x.nivel === r.nivel && x.clave === r.clave)), r])
    setClave(''); setPct('')
    aviso('Descuento especial guardado')
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>
        Descuentos especiales de este cliente <span style={{ color: T.dim }}>(pisan los generales)</span>
      </div>
      {reglas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          {reglas.map(r => (
            <div key={r.nivel + r.clave} style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.bg, borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
              <span style={{ color: T.dim, fontSize: 11.5, minWidth: 92 }}>{NIVEL[r.nivel]}</span>
              <b style={{ flex: 1, color: T.text, fontWeight: 600 }}>{r.nivel === 'producto' ? nombreProducto(r.clave) : r.clave}</b>
              <b style={{ color: T.wine }}>{r.descuento}%</b>
              <button disabled={ocupado} title="Quitar" style={{ border: 'none', background: 'none', color: T.dim, cursor: 'pointer', fontSize: 15 }}
                onClick={async () => { if (await guardar({ nivel: r.nivel, clave: r.clave, descuento: null })) onCambio(reglas.filter(x => x !== r)) }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 70px auto', gap: 6, alignItems: 'center' }}>
        <select style={INP} value={nivel} onChange={e => { setNivel(e.target.value as ReglaCliente['nivel']); setClave('') }}>
          <option value="marca">Bodega / marca</option>
          <option value="grupo">Tipo o rubro</option>
          <option value="producto">Producto</option>
        </select>
        <input style={INP} list={`dc-${nivel}`} value={clave} onChange={e => setClave(e.target.value)}
          placeholder={op ? (nivel === 'marca' ? 'Ej: Rambla' : nivel === 'grupo' ? 'Ej: Aperitivos, Tinto' : 'Buscar producto…') : 'Cargando…'} />
        <datalist id={`dc-${nivel}`}>{(lista ?? []).map(x => <option key={x} value={x} />)}</datalist>
        <input style={{ ...INP, textAlign: 'right' }} type="number" min={0} max={99} placeholder="%" value={pct} onChange={e => setPct(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && valido) agregar() }} />
        <button disabled={!valido || ocupado} onClick={agregar}
          style={{ ...INP, background: valido ? T.wine : '#fff', color: valido ? '#fff' : T.dim, border: valido ? 'none' : INP.border, fontWeight: 600, cursor: valido ? 'pointer' : 'default' }}>Agregar</button>
      </div>
    </div>
  )
}
