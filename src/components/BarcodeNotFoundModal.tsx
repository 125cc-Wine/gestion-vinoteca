'use client'
import { useEffect, useRef, useState } from 'react'
import type { Producto } from '@/types'

interface Props {
  code: string
  empresa: string
  onSelect: (product: Producto, saveBarcode: boolean) => void
  onClose: () => void
}

const INP: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 12px', fontSize: 13,
  border: '1px solid #DDD0C0', borderRadius: 8,
  fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#1A1210',
}

export default function BarcodeNotFoundModal({ code, empresa, onSelect, onClose }: Props) {
  const [mode, setMode] = useState<'buscar' | 'crear'>('buscar')

  // ── Modo buscar ──
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [saveBarcode, setSaveBarcode] = useState(true)
  const [selected, setSelected] = useState<Producto | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Modo crear ──
  const [nombre, setNombre] = useState('')
  const [bodega, setBodega] = useState('')
  const [varietal, setVarietal] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [precioCosto, setPrecioCosto] = useState('')
  const [stock, setStock] = useState('0')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [bodegas, setBodegas] = useState<{ id: string; nombre: string }[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`/api/productos?empresa=${empresa}`).then(r => r.json()),
      fetch(`/api/bodegas?empresa=${empresa}`).then(r => r.json()),
    ]).then(([prods, bods]) => {
      setProductos(Array.isArray(prods) ? prods : [])
      setBodegas(Array.isArray(bods) ? bods : [])
    })
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [empresa])

  useEffect(() => {
    if (mode === 'buscar') setTimeout(() => inputRef.current?.focus(), 80)
  }, [mode])

  const filtrados = busqueda.trim().length < 2
    ? []
    : productos.filter(p =>
        `${p.nombre} ${p.bodega ?? ''} ${p.varietal ?? ''}`.toLowerCase().includes(busqueda.toLowerCase())
      ).slice(0, 12)

  async function crearProducto() {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!precioVenta || isNaN(Number(precioVenta))) { setError('El precio de venta es obligatorio'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa,
        nombre: nombre.trim(),
        bodega: bodega.trim() || null,
        varietal: varietal.trim() || null,
        precio_venta: Number(precioVenta),
        precio_costo: precioCosto ? Number(precioCosto) : null,
        stock: Number(stock) || 0,
        activo: true,
        codigo_barras: code,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { setError(data.error); return }
    onSelect(data, false) // barcode ya está guardado en el producto nuevo
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.55)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460,
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: '#FFF8F0', borderBottom: '1px solid #DDD0C0', padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#A07010', marginBottom: 2 }}>
            Código no encontrado
          </div>
          <div style={{ fontSize: 12, color: '#6B5D55', fontFamily: 'monospace' }}>{code}</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #DDD0C0' }}>
          {(['buscar', 'crear'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '10px 0', fontSize: 13, fontWeight: mode === m ? 700 : 400,
              color: mode === m ? '#800000' : '#6B5D55',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              borderBottom: mode === m ? '2px solid #800000' : '2px solid transparent',
              transition: 'all 0.12s',
            }}>
              {m === 'buscar' ? 'Asignar a existente' : '+ Crear nuevo vino'}
            </button>
          ))}
        </div>

        {mode === 'buscar' ? (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: '#6B5D55', marginBottom: 6, fontWeight: 600 }}>
              Buscá el producto para asignarlo
            </div>
            <input
              ref={inputRef}
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setSelected(null) }}
              placeholder="Nombre, bodega, varietal..."
              style={INP}
            />
            {filtrados.length > 0 && (
              <div style={{ marginTop: 6, border: '1px solid #DDD0C0', borderRadius: 8, maxHeight: 220, overflowY: 'auto' }}>
                {filtrados.map(p => (
                  <div key={p.id} onClick={() => setSelected(p)} style={{
                    padding: '9px 12px', cursor: 'pointer', fontSize: 13,
                    borderBottom: '1px solid #F0E8DC',
                    background: selected?.id === p.id ? 'rgba(128,0,0,0.07)' : 'transparent',
                    color: '#1A1210',
                  }}>
                    <div style={{ fontWeight: selected?.id === p.id ? 600 : 400 }}>{p.nombre}</div>
                    {p.bodega && <div style={{ fontSize: 11, color: '#A89888' }}>{p.bodega}</div>}
                  </div>
                ))}
              </div>
            )}
            {busqueda.trim().length >= 2 && filtrados.length === 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#A89888', textAlign: 'center' }}>
                Sin resultados —{' '}
                <button onClick={() => setMode('crear')} style={{ background: 'none', border: 'none', color: '#800000', cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'inherit', textDecoration: 'underline' }}>
                  crear nuevo vino
                </button>
              </div>
            )}
            {selected && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, cursor: 'pointer', fontSize: 12, color: '#6B5D55' }}>
                <input type="checkbox" checked={saveBarcode} onChange={e => setSaveBarcode(e.target.checked)} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                Guardar código <strong style={{ fontFamily: 'monospace' }}>{code}</strong> en "{selected.nombre}"
              </label>
            )}
          </div>
        ) : (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B5D55', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Nombre *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Malbec Reserva 750ml" style={INP} autoFocus />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B5D55', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Bodega</label>
                <input list="bod-dl-barcode" value={bodega} onChange={e => setBodega(e.target.value)} placeholder="Ej: Catena Zapata" style={INP} />
                <datalist id="bod-dl-barcode">{bodegas.map(b => <option key={b.id} value={b.nombre} />)}</datalist>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B5D55', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Varietal</label>
                <input value={varietal} onChange={e => setVarietal(e.target.value)} placeholder="Ej: Malbec" style={INP} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B5D55', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Precio venta *</label>
                <input type="number" value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} placeholder="0" style={INP} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B5D55', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Precio costo</label>
                <input type="number" value={precioCosto} onChange={e => setPrecioCosto(e.target.value)} placeholder="0" style={INP} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B5D55', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Stock inicial</label>
                <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" style={INP} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B5D55', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Cód. de barras</label>
                <input value={code} disabled style={{ ...INP, background: '#F5F1EC', color: '#A89888', fontFamily: 'monospace', cursor: 'not-allowed' }} />
              </div>
            </div>
            {error && <div style={{ fontSize: 12, color: '#C03030', fontWeight: 600 }}>{error}</div>}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #DDD0C0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, borderRadius: 7, border: '1px solid #DDD0C0', background: 'transparent', color: '#6B5D55', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          {mode === 'buscar' ? (
            <button disabled={!selected} onClick={() => selected && onSelect(selected, saveBarcode)} style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 7, border: 'none', background: selected ? '#800000' : '#DDD0C0', color: '#fff', cursor: selected ? 'pointer' : 'default', fontFamily: 'inherit' }}>
              Asignar y continuar
            </button>
          ) : (
            <button disabled={saving} onClick={crearProducto} style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 7, border: 'none', background: saving ? '#DDD0C0' : '#800000', color: '#fff', cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Guardando...' : 'Crear y agregar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
