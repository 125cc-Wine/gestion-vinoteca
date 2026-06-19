'use client'
import { useEffect, useRef, useState } from 'react'
import type { Producto } from '@/types'

interface Props {
  code: string
  empresa: string
  onSelect: (product: Producto, saveBarcode: boolean) => void
  onClose: () => void
}

export default function BarcodeNotFoundModal({ code, empresa, onSelect, onClose }: Props) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [saveBarcode, setSaveBarcode] = useState(true)
  const [selected, setSelected] = useState<Producto | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/productos?empresa=${empresa}`)
      .then(r => r.json())
      .then(data => setProductos(Array.isArray(data) ? data : []))
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [empresa])

  const filtrados = busqueda.trim().length < 2
    ? []
    : productos.filter(p =>
        `${p.nombre} ${p.bodega ?? ''} ${p.varietal ?? ''}`.toLowerCase().includes(busqueda.toLowerCase())
      ).slice(0, 12)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.55)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 440,
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: '#FFF8F0', borderBottom: '1px solid #DDD0C0', padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#A07010', marginBottom: 2 }}>
            Código no encontrado
          </div>
          <div style={{ fontSize: 12, color: '#6B5D55', fontFamily: 'monospace' }}>{code}</div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* Search */}
          <div style={{ fontSize: 12, color: '#6B5D55', marginBottom: 6, fontWeight: 600 }}>
            Buscá el producto para asignarlo
          </div>
          <input
            ref={inputRef}
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setSelected(null) }}
            placeholder="Nombre, bodega, varietal..."
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '9px 12px', fontSize: 13,
              border: '1px solid #DDD0C0', borderRadius: 8,
              fontFamily: 'inherit', outline: 'none',
            }}
          />

          {/* Results */}
          {filtrados.length > 0 && (
            <div style={{
              marginTop: 6, border: '1px solid #DDD0C0', borderRadius: 8,
              maxHeight: 220, overflowY: 'auto',
            }}>
              {filtrados.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{
                    padding: '9px 12px', cursor: 'pointer', fontSize: 13,
                    borderBottom: '1px solid #F0E8DC',
                    background: selected?.id === p.id ? 'rgba(128,0,0,0.07)' : 'transparent',
                    color: '#1A1210',
                  }}
                >
                  <div style={{ fontWeight: selected?.id === p.id ? 600 : 400 }}>{p.nombre}</div>
                  {p.bodega && <div style={{ fontSize: 11, color: '#A89888' }}>{p.bodega}</div>}
                </div>
              ))}
            </div>
          )}
          {busqueda.trim().length >= 2 && filtrados.length === 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#A89888', textAlign: 'center' }}>
              Sin resultados
            </div>
          )}

          {/* Save checkbox */}
          {selected && (
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginTop: 14, cursor: 'pointer', fontSize: 12, color: '#6B5D55',
            }}>
              <input
                type="checkbox"
                checked={saveBarcode}
                onChange={e => setSaveBarcode(e.target.checked)}
                style={{ width: 15, height: 15, cursor: 'pointer' }}
              />
              Guardar código <strong style={{ fontFamily: 'monospace' }}>{code}</strong> en "{selected.nombre}"
            </label>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid #DDD0C0',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', fontSize: 13, borderRadius: 7,
              border: '1px solid #DDD0C0', background: 'transparent',
              color: '#6B5D55', cursor: 'pointer', fontFamily: 'inherit',
            }}>
            Cancelar
          </button>
          <button
            disabled={!selected}
            onClick={() => selected && onSelect(selected, saveBarcode)}
            style={{
              padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 7,
              border: 'none', background: selected ? '#800000' : '#DDD0C0',
              color: '#fff', cursor: selected ? 'pointer' : 'default', fontFamily: 'inherit',
            }}>
            Asignar y continuar
          </button>
        </div>
      </div>
    </div>
  )
}
