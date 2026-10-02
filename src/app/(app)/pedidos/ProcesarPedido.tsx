'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Recorrido de un pedido hasta la factura, desde el mismo pedido:
//   1. Generar presupuesto (stock, caja / cuenta corriente: igual que Ventas)
//   2. Imprimir el comprobante
//   3. Facturar en AFIP (abre la factura de Ventas con ese comprobante elegido)

export interface VentaDePedido { id: string; numero: string; tipo: string; facturado: boolean; nro_cbte_afip: string | null; empresa: string }

const CONDICIONES = ['Cta. Cte.', 'Contado', 'Transferencia', 'Cheque', 'Tarjeta Débito', 'Tarjeta Crédito', 'QR', 'Billetera Virtual MercadoPago']
const C = { bg: '#F5F1EC', border: '#DDD0C0', border2: '#C8BAA8', text: '#1A1210', muted: '#6B5D55', dim: '#A89888', wine: '#800000', green: '#2D7A4F', blue: '#2B5EA0' }
const BTN: React.CSSProperties = { borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${C.border2}`, background: '#fff', color: C.text, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }

export default function ProcesarPedido({ pedido, onCambio }: {
  pedido: { id: string; numero: string; estado: string; origen?: string; cliente_id?: string | null; total?: number; venta?: VentaDePedido | null; empresa?: string }
  onCambio: (venta: VentaDePedido) => void
}) {
  const router = useRouter()
  const [cond, setCond] = useState(pedido.cliente_id ? 'Cta. Cte.' : 'Contado')
  const [pago, setPago] = useState<'pagado' | 'pendiente'>('pagado')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const venta = pedido.venta

  const estadoPago = cond === 'Cta. Cte.' ? 'cuenta_corriente' : pago

  async function generar() {
    if (!confirm(`¿Generar el presupuesto del pedido ${pedido.numero}?\n\nSe descuenta el stock${estadoPago === 'cuenta_corriente' ? ' y se carga en la cuenta corriente del cliente' : estadoPago === 'pagado' ? ' y se registra el ingreso en caja' : ''}.`)) return
    setOcupado(true); setError('')
    try {
      const r = await fetch('/api/pedidos/presupuesto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pedido_id: pedido.id, condicion_venta: cond, estado_pago: estadoPago }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || d.error) { setError(d.error || 'No se pudo generar'); return }
      onCambio({ id: d.venta.id, numero: d.venta.numero, tipo: 'presupuesto', facturado: false, nro_cbte_afip: null, empresa: d.venta.empresa })
    } catch { setError('Sin conexión') } finally { setOcupado(false) }
  }

  function facturar(v: VentaDePedido) {
    try { localStorage.setItem('empresa', v.empresa) } catch { /* sin storage */ }
    router.push(`/ventas?facturar=${v.id}`)
  }

  const paso = (n: number, hecho: boolean, titulo: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: hecho ? C.green : C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      <span style={{ width: 20, height: 20, borderRadius: 99, display: 'grid', placeItems: 'center', background: hecho ? C.green : C.bg, color: hecho ? '#fff' : C.muted, fontSize: 11 }}>{hecho ? '✓' : n}</span>{titulo}
    </div>
  )

  if (pedido.origen === 'web') return null
  if (pedido.estado === 'cancelado') return null
  if (pedido.estado === 'entregado' && !venta) return null

  return (
    <div style={{ padding: '14px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 12, background: '#FCFAF7' }}>
      {paso(1, !!venta, 'Presupuesto')}
      {!venta ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={cond} onChange={e => setCond(e.target.value)} style={{ ...BTN, fontWeight: 500 }}>
            {CONDICIONES.map(c => <option key={c}>{c}</option>)}
          </select>
          {cond !== 'Cta. Cte.' && (
            <select value={pago} onChange={e => setPago(e.target.value as 'pagado' | 'pendiente')} style={{ ...BTN, fontWeight: 500 }}>
              <option value="pagado">Ya pagó</option>
              <option value="pendiente">Pendiente de pago</option>
            </select>
          )}
          <button style={{ ...BTN, background: C.wine, color: '#fff', border: 'none' }} disabled={ocupado} onClick={generar}>{ocupado ? 'Generando…' : 'Generar presupuesto'}</button>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: C.text }}>
          {venta.tipo === 'remito' ? 'Remito' : 'Presupuesto'} <b>{venta.numero}</b>
          <a style={{ ...BTN, marginLeft: 10, padding: '5px 10px', fontSize: 12 }} href={`/api/print/venta?id=${venta.id}&empresa=${venta.empresa}&autoprint=1`} target="_blank" rel="noreferrer">🖨 Imprimir</a>
        </div>
      )}
      {venta && <>
        {paso(2, venta.facturado, 'Factura AFIP')}
        {venta.facturado
          ? <div style={{ fontSize: 13 }}>Facturado: <b>{venta.nro_cbte_afip}</b> <a style={{ ...BTN, marginLeft: 10, padding: '5px 10px', fontSize: 12 }} href={`/api/print/venta?id=${venta.id}&empresa=${venta.empresa}&autoprint=1`} target="_blank" rel="noreferrer">🖨 Imprimir factura</a></div>
          : <div><button style={{ ...BTN, background: C.blue, color: '#fff', border: 'none' }} onClick={() => facturar(venta)}>Facturar en AFIP →</button>
              <span style={{ fontSize: 12, color: C.dim, marginLeft: 8 }}>Se abre en Ventas con este comprobante ya elegido</span></div>}
      </>}
      {error && <div style={{ fontSize: 12.5, color: '#C03030' }}>{error}</div>}
    </div>
  )
}
