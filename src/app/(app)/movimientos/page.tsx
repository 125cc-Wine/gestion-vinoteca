'use client'
import { useEffect, useState } from 'react'

interface Movimiento {
  id: string; fecha: string; tipo: 'egreso' | 'entrada' | 'ajuste'
  concepto: string; comprobante: string; comprobante_tipo: string
  cliente: string; producto: string; producto_id: string | null; cantidad: number
}

const C = {
  bg: '#0F0F0F', surface: '#141414', card: '#1A1A1A', border: '#2A2A2A',
  accent: '#8B1A2A', text: '#E8E8E8', muted: '#888888', dim: '#555555',
  green: '#4CAF7D', amber: '#D4820A', red: '#E05555',
}

const INP: React.CSSProperties = {
  background: '#111', border: `1px solid ${C.border}`, borderRadius: 6,
  color: C.text, padding: '6px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

export default function MovimientosPage() {
  const [empresa, setEmpresa] = useState('aroma')
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [desde, setDesde] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
  })
  const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0])
  const [ajusteModal, setAjusteModal] = useState(false)
  const [ajusteProducto, setAjusteProducto] = useState('')
  const [ajusteCantidad, setAjusteCantidad] = useState('')
  const [ajusteMotivo, setAjusteMotivo] = useState('')
  const [ajusteGuardando, setAjusteGuardando] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e); cargar(e, desde, hasta)
  }, [])

  async function cargar(emp: string, d: string, h: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/movimientos?empresa=${emp}&desde=${d}&hasta=${h}`)
      const data = await res.json()
      setMovimientos(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function guardarAjuste() {
    if (!ajusteProducto.trim() || !ajusteCantidad) return
    setAjusteGuardando(true)
    const res = await fetch('/api/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa, producto_nombre: ajusteProducto,
        producto_id: null, cantidad: Number(ajusteCantidad), motivo: ajusteMotivo,
      }),
    })
    const data = await res.json()
    setAjusteGuardando(false)
    if (data.error) { showToast('Error: ' + data.error); return }
    setAjusteModal(false); setAjusteProducto(''); setAjusteCantidad(''); setAjusteMotivo('')
    cargar(empresa, desde, hasta)
    showToast('Ajuste registrado')
  }

  const filtrados = movimientos.filter(m => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return m.producto.toLowerCase().includes(q) || m.cliente.toLowerCase().includes(q) || m.comprobante.toLowerCase().includes(q)
  })

  const totalEgresos = filtrados.filter(m => m.tipo === 'egreso').reduce((a, m) => a + m.cantidad, 0)
  const totalEntradas = filtrados.filter(m => m.tipo === 'entrada').reduce((a, m) => a + m.cantidad, 0)

  return (
    <div style={{ padding: 28, background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`
        .mrow:hover { background: rgba(255,255,255,0.025) !important; }
        .minp:focus { border-color: #555 !important; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Movimientos de stock</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>
            {empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'}
          </p>
        </div>
        <button
          onClick={() => setAjusteModal(true)}
          style={{ background: '#222', border: `1px solid ${C.border}`, color: C.text, borderRadius: 7, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}
        >
          + Ajuste manual
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input className="minp" style={{ ...INP, flex: '1 1 220px' }} placeholder="Buscar producto, cliente, comprobante..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <input className="minp" type="date" style={INP} value={desde} onChange={e => { setDesde(e.target.value); cargar(empresa, e.target.value, hasta) }} />
        <input className="minp" type="date" style={INP} value={hasta} onChange={e => { setHasta(e.target.value); cargar(empresa, desde, e.target.value) }} />
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Movimientos', value: filtrados.length, color: C.text },
          { label: 'Unidades vendidas', value: totalEgresos, color: C.red },
          { label: 'Unidades ingresadas', value: totalEntradas, color: C.green },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
              {['Fecha', 'Tipo', 'Comprobante', 'Producto', 'Cliente', 'Cant.'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Cant.' ? 'right' : 'left', fontSize: 11, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: C.dim }}>Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: C.dim }}>Sin movimientos en el período</td></tr>
            ) : filtrados.map(m => (
              <tr key={m.id} className="mrow" style={{ borderBottom: `1px solid rgba(42,42,42,0.6)` }}>
                <td style={{ padding: '10px 14px', color: C.muted, fontSize: 12 }}>
                  {new Date(m.fecha).toLocaleDateString('es-AR')}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                    background: m.tipo === 'egreso' ? 'rgba(224,85,85,0.12)' : m.tipo === 'entrada' ? 'rgba(76,175,125,0.12)' : 'rgba(212,130,10,0.12)',
                    color: m.tipo === 'egreso' ? C.red : m.tipo === 'entrada' ? C.green : C.amber,
                    border: `1px solid ${m.tipo === 'egreso' ? 'rgba(224,85,85,0.3)' : m.tipo === 'entrada' ? 'rgba(76,175,125,0.3)' : 'rgba(212,130,10,0.3)'}`,
                  }}>
                    {m.tipo === 'egreso' ? 'Venta' : m.tipo === 'entrada' ? 'Entrada' : 'Ajuste'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: C.muted }}>{m.comprobante}</td>
                <td style={{ padding: '10px 14px', color: C.text, fontWeight: 500 }}>{m.producto}</td>
                <td style={{ padding: '10px 14px', color: C.muted, fontSize: 12 }}>{m.cliente || '—'}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: m.tipo === 'egreso' ? C.red : C.green }}>
                  {m.tipo === 'egreso' ? '-' : '+'}{m.cantidad}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal ajuste */}
      {ajusteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setAjusteModal(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: '100%', maxWidth: 420 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: C.text }}>Ajuste manual de stock</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 500, marginBottom: 5 }}>Producto</div>
                <input className="minp" style={{ ...INP, width: '100%' }} placeholder="Nombre del producto" value={ajusteProducto} onChange={e => setAjusteProducto(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 500, marginBottom: 5 }}>Cantidad (+/-)</div>
                <input className="minp" type="number" style={{ ...INP, width: '100%' }} placeholder="Ej: 12 para sumar, -3 para restar" value={ajusteCantidad} onChange={e => setAjusteCantidad(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 500, marginBottom: 5 }}>Motivo</div>
                <input className="minp" style={{ ...INP, width: '100%' }} placeholder="Recepción de mercadería, pérdida, etc." value={ajusteMotivo} onChange={e => setAjusteMotivo(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={() => setAjusteModal(false)} style={{ background: '#222', border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={guardarAjuste} disabled={ajusteGuardando || !ajusteProducto || !ajusteCantidad}
                style={{ background: C.accent, border: 'none', color: C.text, borderRadius: 6, padding: '7px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !ajusteProducto || !ajusteCantidad ? 0.5 : 1 }}>
                {ajusteGuardando ? 'Guardando...' : 'Registrar ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 100 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
