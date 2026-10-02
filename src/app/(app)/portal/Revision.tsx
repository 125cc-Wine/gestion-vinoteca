'use client'
import { useEffect, useState } from 'react'
import VarietalSelect from '@/components/VarietalSelect'

// Productos con datos dudosos que dejó la auditoría de catálogo para que los
// decida una persona (ver /api/productos/revision). Cada uno: qué pasa, la
// sugerencia si hay, y los tres campos que usa el portal para agrupar.

const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8',
  text: '#1A1210', muted: '#6B5D55', dim: '#A89888', wine: '#800000',
  green: '#2D7A4F', amber: '#A07010', amberBg: 'rgba(160,112,16,0.07)',
}
const INP: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 13, fontFamily: 'inherit', background: T.surface, color: T.text, outline: 'none', boxSizing: 'border-box' }
const BTN: React.CSSProperties = { borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${T.border2}`, background: T.surface, color: T.text, whiteSpace: 'nowrap' }
const CATEGORIAS = ['Tinto', 'Blanco', 'Rosado', 'Espumante', 'Dulce', 'Otro']

const PROBLEMA: Record<string, string> = {
  VINO_SIN_BODEGA: 'Falta la bodega',
  BODEGA_INVALIDA: 'La "bodega" cargada no es una bodega ni una marca',
  BODEGA_UNICA: 'Bodega escrita distinto que otros productos',
  VARIETAL_FALTA_O_MAL: 'Varietal faltante o dudoso',
  CATEGORIA_MAL: 'La categoría puede estar mal',
  NO_ES_VINO: 'Puede no ser vino',
  RUBRO_INCONSISTENTE: 'Rubro dudoso',
}

interface Pendiente {
  id: string; nombre: string; categoria: string | null; bodega: string | null; varietal: string | null; stock: number | null
  problemas: { problema: string; nota: string | null }[]
  propuesta: { categoria: string | null; bodega: string | null; varietal: string | null }
}

export default function Revision({ aviso }: { aviso: (m: string) => void }) {
  const [pend, setPend] = useState<Pendiente[] | null>(null)
  const [bodegas, setBodegas] = useState<string[]>([])
  const [edit, setEdit] = useState<Record<string, { categoria: string; bodega: string; varietal: string }>>({})
  const [verTodos, setVerTodos] = useState(false)
  const [ocupado, setOcupado] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/productos/revision').then(r => r.json()).then(d => {
      if (d.error) { aviso('Error: ' + d.error); return }
      setPend(d.pendientes); setBodegas(d.bodegas)
      // Arranca con lo que tiene hoy, completando con la sugerencia donde falta.
      setEdit(Object.fromEntries((d.pendientes as Pendiente[]).map(p => [p.id, {
        categoria: p.propuesta.categoria || p.categoria || '',
        bodega: p.propuesta.bodega || p.bodega || '',
        varietal: p.propuesta.varietal || p.varietal || '',
      }])))
    })
    // Solo al montar: `aviso` cambia en cada render de la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function resolver(p: Pendiente, accion: 'guardar' | 'ok') {
    setOcupado(p.id)
    try {
      const d = await fetch('/api/productos/revision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id: p.id, accion, ...(accion === 'guardar' ? edit[p.id] : {}) }),
      }).then(r => r.json())
      if (d.error) { aviso('Error: ' + d.error); return }
      setPend(prev => (prev || []).filter(x => x.id !== p.id))
      aviso(accion === 'guardar' ? `"${p.nombre}" corregido` : `"${p.nombre}" queda como está`)
    } finally { setOcupado(null) }
  }

  if (!pend || pend.length === 0) return null
  const visibles = verTodos ? pend : pend.slice(0, 8)
  const set = (id: string, k: 'categoria' | 'bodega' | 'varietal', v: string) => setEdit(e => ({ ...e, [id]: { ...e[id], [k]: v } }))

  return (
    <div id="revision" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>🔎 Productos para revisar</div>
        <span style={{ fontSize: 12, color: T.amber, fontWeight: 600 }}>{pend.length} pendientes · {pend.filter(p => (p.stock ?? 0) > 0).length} con stock</span>
      </div>
      <div style={{ fontSize: 12.5, color: T.muted, margin: '4px 0 14px' }}>
        Datos que no se pudieron completar solos. El portal agrupa los vinos por bodega y el resto por rubro (el campo varietal), así que conviene dejarlos bien. Los cambios se aplican en Aroma y La Vid.
      </div>
      <datalist id="rev-bodegas">{bodegas.map(b => <option key={b} value={b} />)}</datalist>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibles.map(p => {
          const e = edit[p.id] || { categoria: '', bodega: '', varietal: '' }
          const esOtro = e.categoria === 'Otro'
          return (
            <div key={p.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: T.bg }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nombre}</div>
                <span style={{ fontSize: 11.5, color: (p.stock ?? 0) > 0 ? T.green : T.dim }}>{(p.stock ?? 0) > 0 ? `${p.stock} en stock` : 'sin stock'}</span>
              </div>
              <ul style={{ margin: '6px 0 10px', padding: '0 0 0 18px', fontSize: 12.5, color: T.muted }}>
                {p.problemas.map((x, i) => (
                  <li key={i}><b style={{ color: T.amber }}>{PROBLEMA[x.problema] ?? x.problema}</b>{x.nota ? ` — ${x.nota}` : ''}</li>
                ))}
              </ul>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, alignItems: 'end' }}>
                <label style={{ fontSize: 11, color: T.dim }}>Categoría
                  <select style={INP} value={e.categoria} onChange={ev => set(p.id, 'categoria', ev.target.value)}>
                    <option value="">—</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c === 'Otro' ? 'Otro (bebidas)' : c}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 11, color: T.dim }}>{esOtro ? 'Marca' : 'Bodega'}
                  <input style={INP} list="rev-bodegas" value={e.bodega} onChange={ev => set(p.id, 'bodega', ev.target.value)} placeholder={p.bodega || ''} />
                </label>
                <label style={{ fontSize: 11, color: T.dim }}>{esOtro ? 'Rubro (Whiskies, Gin, Aperitivos…)' : 'Varietal'}
                  <VarietalSelect style={INP} categoria={e.categoria || p.categoria} value={e.varietal || p.varietal} onChange={v => set(p.id, 'varietal', v)} />
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ ...BTN, background: T.wine, color: '#FFF', border: 'none' }} disabled={ocupado === p.id} onClick={() => resolver(p, 'guardar')}>Guardar</button>
                  <button style={BTN} disabled={ocupado === p.id} onClick={() => resolver(p, 'ok')} title="Dejarlo como está y sacarlo de la lista">Está bien así</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {pend.length > visibles.length && (
        <button style={{ ...BTN, marginTop: 12, width: '100%' }} onClick={() => setVerTodos(true)}>Ver los {pend.length - visibles.length} restantes</button>
      )}
    </div>
  )
}
