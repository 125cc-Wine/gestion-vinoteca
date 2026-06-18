'use client'
import { useEffect, useState } from 'react'

interface Movimiento {
  id: string; fecha: string; tipo: 'egreso' | 'entrada' | 'ajuste'
  concepto: string; comprobante: string; comprobante_tipo: string
  cliente: string; producto: string; producto_id: string | null; cantidad: number
}

const T = {
  bg:      '#F5F1EC',
  surface: '#FFFFFF',
  border:  '#DDD0C0',
  border2: '#C8BAA8',
  text:    '#1A1210',
  muted:   '#6B5D55',
  dim:     '#A89888',
  wine:    '#800000',
  wineBg:  'rgba(128,0,0,0.07)',
  wineBd:  'rgba(128,0,0,0.18)',
  green:   '#2D7A4F',
  greenBg: 'rgba(45,122,79,0.08)',
  greenBd: 'rgba(45,122,79,0.22)',
  red:     '#C03030',
  redBg:   'rgba(192,48,48,0.08)',
  redBd:   'rgba(192,48,48,0.22)',
  amber:   '#A07010',
  amberBg: 'rgba(160,112,16,0.07)',
  amberBd: 'rgba(160,112,16,0.22)',
}

const INP: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
  color: T.text, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
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
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        .tr:hover { background: #FDFAF6 !important; }
        .minp:focus { border-color: ${T.border2} !important; }
      `}</style>

      {/* Page header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Movimientos de stock</h1>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 3, margin: '3px 0 0' }}>
            {empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'}
          </p>
        </div>
        <button
          onClick={() => setAjusteModal(true)}
          style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          + Ajuste manual
        </button>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <input className="minp" style={{ ...INP, flex: '1 1 220px' }} placeholder="Buscar producto, cliente, comprobante..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <input className="minp" type="date" style={INP} value={desde} onChange={e => { setDesde(e.target.value); cargar(empresa, e.target.value, hasta) }} />
          <input className="minp" type="date" style={INP} value={hasta} onChange={e => { setHasta(e.target.value); cargar(empresa, desde, e.target.value) }} />
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Movimientos', value: filtrados.length, color: T.text },
            { label: 'Unidades vendidas', value: totalEgresos, color: T.red },
            { label: 'Unidades ingresadas', value: totalEntradas, color: T.green },
          ].map(s => (
            <div key={s.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Fecha', 'Tipo', 'Comprobante', 'Producto', 'Cliente', 'Cant.'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Cant.' ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: T.dim, fontSize: 13 }}>Cargando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: T.dim, fontSize: 13 }}>Sin movimientos en el período</td></tr>
              ) : filtrados.map(m => (
                <tr key={m.id} className="tr" style={{ borderBottom: `1px solid ${T.border}`, cursor: 'default', transition: 'background 0.1s' }}>
                  <td style={{ padding: '10px 14px', color: T.muted, fontSize: 12 }}>
                    {new Date(m.fecha).toLocaleDateString('es-AR')}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                      background: m.tipo === 'egreso' ? T.redBg : m.tipo === 'entrada' ? T.greenBg : T.amberBg,
                      color: m.tipo === 'egreso' ? T.red : m.tipo === 'entrada' ? T.green : T.amber,
                      border: `1px solid ${m.tipo === 'egreso' ? T.redBd : m.tipo === 'entrada' ? T.greenBd : T.amberBd}`,
                    }}>
                      {m.tipo === 'egreso' ? 'Venta' : m.tipo === 'entrada' ? 'Entrada' : 'Ajuste'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: T.muted }}>{m.comprobante}</td>
                  <td style={{ padding: '10px 14px', color: T.text, fontWeight: 500, fontSize: 13 }}>{m.producto}</td>
                  <td style={{ padding: '10px 14px', color: T.muted, fontSize: 12 }}>{m.cliente || '—'}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: m.tipo === 'egreso' ? T.red : T.green, fontSize: 13 }}>
                    {m.tipo === 'egreso' ? '-' : '+'}{m.cantidad}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ajuste */}
      {ajusteModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setAjusteModal(false)}
        >
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Ajuste manual de stock</h2>
              <button onClick={() => setAjusteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            {/* Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Producto</label>
                <input className="minp" style={{ ...INP, width: '100%' }} placeholder="Nombre del producto" value={ajusteProducto} onChange={e => setAjusteProducto(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Cantidad (+/-)</label>
                <input className="minp" type="number" style={{ ...INP, width: '100%' }} placeholder="Ej: 12 para sumar, -3 para restar" value={ajusteCantidad} onChange={e => setAjusteCantidad(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Motivo</label>
                <input className="minp" style={{ ...INP, width: '100%' }} placeholder="Recepción de mercadería, pérdida, etc." value={ajusteMotivo} onChange={e => setAjusteMotivo(e.target.value)} />
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setAjusteModal(false)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer' }}>Cancelar</button>
              <button
                onClick={guardarAjuste}
                disabled={ajusteGuardando || !ajusteProducto || !ajusteCantidad}
                style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !ajusteProducto || !ajusteCantidad ? 0.5 : 1 }}
              >
                {ajusteGuardando ? 'Guardando...' : 'Registrar ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 13, padding: '12px 20px', borderRadius: 10, boxShadow: '0 4px 16px rgba(26,18,16,0.12)', zIndex: 200 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
