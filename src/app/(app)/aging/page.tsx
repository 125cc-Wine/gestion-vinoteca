'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { onOverlayMouseDown, onOverlayClick } from '@/lib/overlayClose'

const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8',
  text: '#1A1210', muted: '#6B5D55', dim: '#A89888',
  wine: '#800000', wineBg: 'rgba(128,0,0,0.07)',
  green: '#2D7A4F', greenBg: 'rgba(45,122,79,0.08)', greenBd: 'rgba(45,122,79,0.22)',
  red: '#C03030', redBg: 'rgba(192,48,48,0.08)', redBd: 'rgba(192,48,48,0.22)',
  amber: '#A07010', amberBg: 'rgba(160,112,16,0.07)', amberBd: 'rgba(160,112,16,0.22)',
  gold: '#B88A2C', goldBg: 'rgba(184,138,44,0.08)',
}

const MEDIOS_PAGO_COBRO = ['Efectivo', 'Transferencia', 'Tarjeta Débito', 'Tarjeta Crédito', 'QR', 'MercadoPago']

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function buildWaLink(telefono: string | null, nombre: string, monto: number, empresa: string) {
  if (!telefono) return null
  let tel = telefono.replace(/\D/g, '')
  if (tel.startsWith('0')) tel = tel.slice(1)
  const empresaNombre = empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid'
  const text = encodeURIComponent(
    `Hola ${nombre}, te recordamos que tenés un saldo pendiente de ${fmt(monto)} en ${empresaNombre}. ¡Cuando puedas nos coordinamos el pago! 🙏`
  )
  return `https://wa.me/54${tel}?text=${text}`
}

type BucketColor = 'green' | 'amber' | 'gold' | 'red'

function getBucketColor(row: AgingRow): BucketColor {
  if (row.bucket_mas90 > 0) return 'red'
  if (row.bucket_90 > 0) return 'gold'
  if (row.bucket_60 > 0) return 'amber'
  return 'green'
}

const BUCKET_STYLES: Record<BucketColor, { bg: string; bd: string; color: string }> = {
  green: { bg: T.greenBg, bd: T.greenBd, color: T.green },
  amber: { bg: T.amberBg, bd: T.amberBd, color: T.amber },
  gold:  { bg: T.goldBg,  bd: T.amberBd, color: T.gold },
  red:   { bg: T.redBg,   bd: T.redBd,   color: T.red },
}

interface AgingRow {
  cliente_id: string | null
  cliente_nombre: string
  telefono: string | null
  vendedor_id: string | null
  saldo_total: number
  bucket_30: number
  bucket_60: number
  bucket_90: number
  bucket_mas90: number
  dias_maximo: number
  ultima_compra: string | null
}

interface VentaDetalle {
  id: string
  numero?: string
  tipo: string
  total: number
  monto_pagado?: number
  created_at: string
  dias: number
}

function KpiCard({
  label, amount, color, bg, bd,
}: { label: string; amount: number; color: string; bg: string; bd: string }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${bd}`,
      borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 160,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>
        {fmt(amount)}
      </div>
      <div style={{ fontSize: 10, color: T.dim, marginTop: 2, background: bg, borderRadius: 6, padding: '2px 7px', display: 'inline-block' }}>
        {label}
      </div>
    </div>
  )
}

export default function AgingPage() {
  // Lazy initializer: lee localStorage en el primer render, no en un efecto
  // aparte. Con useState('aroma') + un efecto que corrige después, el efecto
  // de carga (deps [empresa]) dispara UN pedido con 'aroma' (valor inicial) y
  // OTRO con la empresa real apenas se corrige — si la respuesta vieja llega
  // después que la nueva (típico en red, nada garantiza el orden), pisaba los
  // datos correctos con los de la otra empresa. Arrancar ya con el valor
  // correcto evita el doble pedido de raíz.
  const [empresa, setEmpresa] = useState<string>(
    () => (typeof window !== 'undefined' && localStorage.getItem('empresa')) || 'aroma'
  )
  const [rows, setRows] = useState<AgingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vendedores, setVendedores] = useState<{ id: string; nombre: string; tipo: string }[]>([])
  const [filtroVendedor, setFiltroVendedor] = useState('')

  // Modal detalle
  const [modalCliente, setModalCliente] = useState<AgingRow | null>(null)
  const [detalleVentas, setDetalleVentas] = useState<VentaDetalle[]>([])
  const [detalleLoading, setDetalleLoading] = useState(false)

  // Cobro de un monto global — se reparte solo, del comprobante más viejo al
  // más nuevo (mismo reparto FIFO que ya usa /api/cta-cte para "Registrar
  // cobro" en la ficha de cliente), en vez de tener que cobrar comprobante
  // por comprobante a mano.
  const [montoGlobal, setMontoGlobal] = useState('')
  const [medioGlobal, setMedioGlobal] = useState('Efectivo')
  const [cobrandoGlobal, setCobrandoGlobal] = useState(false)

  // Modal "marcar pagado" — antes era un window.prompt() que solo pedía el
  // monto y el medio de pago quedaba fijo en "Efectivo" en el recibo aunque
  // se hubiera cobrado con tarjeta/transferencia/etc.
  const [pagoModal, setPagoModal] = useState<VentaDetalle | null>(null)
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoMedioPago, setPagoMedioPago] = useState('Efectivo')
  const [pagando, setPagando] = useState(false)

  // Defensa extra: si por lo que sea hay dos pedidos en vuelo (ej. el usuario
  // cambia de empresa rápido en el selector), ignorar la respuesta que no es
  // de la última empresa pedida.
  const loadIdRef = useRef(0)

  const load = useCallback(async (emp: string) => {
    const id = ++loadIdRef.current
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/aging?empresa=${emp}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar')
      if (id !== loadIdRef.current) return
      setRows(data)
    } catch (e: unknown) {
      if (id !== loadIdRef.current) return
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      if (id === loadIdRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => { load(empresa) }, [empresa, load])

  // Vendedores es una tabla compartida (no depende de la empresa) — se carga
  // una sola vez, para el filtro "por vendedor" y para mostrar de quién es
  // cada cliente.
  useEffect(() => {
    fetch('/api/vendedores')
      .then(r => r.json())
      .then(d => setVendedores(Array.isArray(d) ? d.filter((v: { activo: boolean }) => v.activo) : []))
  }, [])

  function nombreVendedor(id: string | null) {
    if (!id) return null
    return vendedores.find(v => v.id === id)?.nombre || null
  }

  async function cargarVentasPendientes(row: AgingRow) {
    // Ventas de "Consumidor Final" no tienen cliente_id — pedir todas las
    // de la empresa y filtrar acá las que no tengan cliente asignado, en
    // vez de mandar cliente_id=null (nunca matcheaba nada).
    const url = row.cliente_id
      ? `/api/ventas?empresa=${empresa}&cliente_id=${row.cliente_id}`
      : `/api/ventas?empresa=${empresa}`
    const res = await fetch(url)
    const data = await res.json()
    const now = Date.now()
    const raw: { id: string; numero?: string; total: number; monto_pagado?: number; created_at: string; tipo?: string; estado_pago?: string; cliente_id?: string | null }[] =
      Array.isArray(data) ? data : data.ventas ?? []
    const ventas: VentaDetalle[] = raw
      .filter(v => (v.tipo === 'presupuesto' || v.tipo === 'remito' || v.tipo === 'factura') && v.estado_pago === 'cuenta_corriente'
        && (row.cliente_id ? true : !v.cliente_id))
      .map(v => ({
        id: v.id,
        numero: v.numero,
        tipo: v.tipo ?? 'remito',
        total: v.total,
        monto_pagado: v.monto_pagado ?? 0,
        created_at: v.created_at,
        dias: Math.floor((now - new Date(v.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      }))
    // El saldo del cliente puede incluir deuda "cargada a mano" (Cargar
    // deuda, migraciones de sistema anterior) que no está atada a ninguna
    // venta — /api/aging ya la suma al saldo_total de la fila, pero acá solo
    // pedimos ventas. Si sobra saldo sin explicar, se agrega como una línea
    // sintética para que el detalle no quede vacío ni desactualizado.
    const sumaVentas = ventas.reduce((a, v) => a + (v.total - (v.monto_pagado ?? 0)), 0)
    const residual = row.saldo_total - sumaVentas
    if (residual > 0.01) {
      ventas.push({
        id: `cargo-${row.cliente_id ?? 'sin-cliente'}`,
        tipo: 'cargo',
        total: residual,
        monto_pagado: 0,
        created_at: new Date(Date.now() - row.dias_maximo * 24 * 60 * 60 * 1000).toISOString(),
        dias: row.dias_maximo,
      })
    }

    ventas.sort((a, b) => b.dias - a.dias)
    return ventas
  }

  async function openDetalle(row: AgingRow) {
    setModalCliente(row)
    setDetalleLoading(true)
    setDetalleVentas([])
    setMontoGlobal('')
    setMedioGlobal('Efectivo')
    try {
      setDetalleVentas(await cargarVentasPendientes(row))
    } catch {
      setDetalleVentas([])
    } finally {
      setDetalleLoading(false)
    }
  }

  // Cobra un monto global sin elegir comprobante: /api/cta-cte lo reparte
  // FIFO contra las ventas abiertas (remito/presupuesto) del cliente, de la
  // más vieja a la más nueva, igual que "Registrar cobro" en la ficha de
  // cliente. Nota: ese reparto no toca facturas ya emitidas (solo remito/
  // presupuesto) — si el saldo incluye una factura pendiente, esa parte del
  // monto queda como saldo a favor hasta cobrarla aparte.
  async function cobrarMontoGlobal() {
    if (!modalCliente || !modalCliente.cliente_id) return
    const monto = parseFloat(montoGlobal.replace(',', '.'))
    if (!monto || monto <= 0) { alert('Ingresá un monto válido'); return }
    if (monto > modalCliente.saldo_total + 0.01) {
      if (!confirm(`El monto (${fmt(monto)}) es mayor al saldo adeudado (${fmt(modalCliente.saldo_total)}). ¿Igual querés registrarlo? El excedente queda como saldo a favor del cliente.`)) return
    }
    // Se abre acá, antes del primer await, para que el navegador lo reconozca
    // como originado por el clic/Enter del usuario y no lo bloquee como popup.
    const wRecibo = window.open('', '_blank', 'width=650,height=850')
    setCobrandoGlobal(true)
    try {
      const res = await fetch('/api/cta-cte', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa, cliente_id: modalCliente.cliente_id, cliente_nombre: modalCliente.cliente_nombre,
          tipo: 'cobro', concepto: 'Cobro cuenta corriente (Aging)', monto, medio_pago: medioGlobal,
          fecha: new Date().toISOString().split('T')[0],
        }),
      })
      const data = await res.json()
      if (data.error) { alert('Error: ' + data.error); wRecibo?.close(); return }
      setMontoGlobal('')
      setDetalleVentas(await cargarVentasPendientes(modalCliente))
      setModalCliente(prev => prev ? { ...prev, saldo_total: Math.max(0, prev.saldo_total - monto) } : prev)
      load(empresa)
      if (data.id && wRecibo) wRecibo.location.href = `/api/print/recibo?id=${data.id}&empresa=${empresa}&medio=${encodeURIComponent(medioGlobal)}`
      else wRecibo?.close()
    } finally {
      setCobrandoGlobal(false)
    }
  }

  // Abre el modal de pago en vez de cobrar directo — antes esto era un
  // window.prompt() que solo pedía el monto, así que el medio de pago
  // quedaba fijo en "Efectivo" en el recibo sin importar cómo se cobró
  // realmente.
  function marcarPagado(v: VentaDetalle) {
    const restante = parseFloat((v.total - (v.monto_pagado || 0)).toFixed(2))
    setPagoModal(v)
    setPagoMonto(String(restante))
    setPagoMedioPago('Efectivo')
  }

  async function confirmarPago() {
    if (!pagoModal) return
    const v = pagoModal
    const restante = parseFloat((v.total - (v.monto_pagado || 0)).toFixed(2))
    const esCargo = v.tipo === 'cargo'
    const monto = parseFloat(pagoMonto.replace(',', '.'))
    if (!monto || monto <= 0) { alert('Monto inválido'); return }
    if (monto > restante + 0.01) { alert(`No puede ser mayor a lo que falta (${fmt(restante)})`); return }

    // Se abre acá, antes del primer await, para que el navegador lo reconozca
    // como originado por el clic del usuario y no lo bloquee como popup.
    const wRecibo = window.open('', '_blank', 'width=650,height=850')
    setPagando(true)
    try {
      // La fila "Deuda cargada" es sintética (residuo de clientes.saldo que no
      // se explica con ninguna venta — ver cargarVentasPendientes): su id
      // ("cargo-<cliente_id>") no existe en la tabla ventas, así que pagarla
      // vía /api/ventas/cobrar siempre daba 404 "Venta no encontrada" y nunca
      // llegaba a emitir el comprobante. Se cobra en cambio como un cobro
      // genérico de cuenta corriente (mismo endpoint que "Cobrar" del total
      // del cliente), que sí sabe reducir clientes.saldo sin depender de una
      // venta puntual.
      const res = esCargo
        ? await fetch('/api/cta-cte', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              empresa, cliente_id: modalCliente?.cliente_id, cliente_nombre: modalCliente?.cliente_nombre,
              tipo: 'cobro', concepto: 'Cobro deuda cargada', monto, medio_pago: pagoMedioPago,
              fecha: new Date().toISOString().split('T')[0],
            }),
          })
        : await fetch('/api/ventas/cobrar', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ venta_id: v.id, empresa, monto, medio_pago: pagoMedioPago }),
          })
      const data = await res.json()
      if (data.error) { alert('Error: ' + data.error); wRecibo?.close(); return }
      const esParcial = monto < restante - 0.01
      if (esParcial) {
        setDetalleVentas(prev => prev.map(x => x.id === v.id ? { ...x, monto_pagado: (x.monto_pagado || 0) + monto } : x))
      } else {
        setDetalleVentas(prev => prev.filter(x => x.id !== v.id))
      }
      setModalCliente(prev => prev ? { ...prev, saldo_total: Math.max(0, prev.saldo_total - monto) } : prev)
      load(empresa)
      setPagoModal(null)
      const reciboId = esCargo ? data.id : data.movimiento_cta_cte_id
      if (reciboId && wRecibo) wRecibo.location.href = `/api/print/recibo?id=${reciboId}&empresa=${empresa}&medio=${encodeURIComponent(pagoMedioPago)}`
      else wRecibo?.close()
    } finally {
      setPagando(false)
    }
  }

  // Filtro por vendedor — se aplica antes de los KPIs y la tabla, así todo
  // (totales, cantidad de clientes, filas) queda consistente con el filtro.
  const rowsFiltradas = filtroVendedor ? rows.filter(r => r.vendedor_id === filtroVendedor) : rows

  // KPI totals
  const total30 = rowsFiltradas.reduce((s, r) => s + r.bucket_30, 0)
  const total60 = rowsFiltradas.reduce((s, r) => s + r.bucket_60, 0)
  const total90 = rowsFiltradas.reduce((s, r) => s + r.bucket_90, 0)
  const totalMas90 = rowsFiltradas.reduce((s, r) => s + r.bucket_mas90, 0)
  const totalGeneral = rowsFiltradas.reduce((s, r) => s + r.saldo_total, 0)

  // Footer totals
  const footerBucket = {
    b30: total30,
    b60: total60,
    b90: total90,
    bMas90: totalMas90,
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <style>{`
        .aging-tr { transition: background 0.1s; }
        .aging-tr:hover { filter: brightness(0.97); }
        .btn-wa:hover { opacity: 0.85; }
        .btn-ver:hover { background: ${T.wineBg} !important; }
        .sel-empresa { outline: none; }
        .aging-badge { display: inline-block; border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 700; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>
            Aging · Cuenta Corriente
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted }}>
            Solo comprobantes <strong>pendientes de cobro</strong> — ordenado por antigüedad
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: T.muted }}>Empresa:</span>
          <select
            className="sel-empresa"
            value={empresa}
            onChange={e => {
              setEmpresa(e.target.value)
              localStorage.setItem('empresa', e.target.value)
            }}
            style={{
              background: T.surface, border: `1px solid ${T.border2}`,
              borderRadius: 8, padding: '7px 12px', fontSize: 13,
              color: T.text, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <option value="aroma">Aroma de Vid</option>
            <option value="lavid">La Vid Consultora</option>
          </select>
          {vendedores.length > 0 && (
            <select
              className="sel-empresa"
              value={filtroVendedor}
              onChange={e => setFiltroVendedor(e.target.value)}
              style={{
                background: T.surface, border: `1px solid ${T.border2}`,
                borderRadius: 8, padding: '7px 12px', fontSize: 13,
                color: T.text, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <option value="">Todos los vendedores</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}{v.tipo === 'calle' ? ' (calle)' : ''}</option>)}
            </select>
          )}
          <button
            onClick={() => load(empresa)}
            style={{
              background: T.wine, color: '#fff', border: 'none', borderRadius: 8,
              padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="0–30 días" amount={total30} color={T.green} bg={T.greenBg} bd={T.greenBd} />
        <KpiCard label="31–60 días" amount={total60} color={T.amber} bg={T.amberBg} bd={T.amberBd} />
        <KpiCard label="61–90 días" amount={total90} color={T.gold} bg={T.goldBg} bd={T.amberBd} />
        <KpiCard label="+90 días" amount={totalMas90} color={T.red} bg={T.redBg} bd={T.redBd} />
        <div style={{
          background: T.wineBg, border: `1px solid rgba(128,0,0,0.22)`,
          borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 160,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.wine, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 6 }}>
            Total pendiente
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.wine }}>
            {fmt(totalGeneral)}
          </div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
            {rowsFiltradas.length} clientes
          </div>
        </div>
      </div>

      {/* Estado carga / error */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: T.muted, fontSize: 14 }}>
          Cargando aging...
        </div>
      )}
      {!loading && error && (
        <div style={{ background: T.redBg, border: `1px solid ${T.redBd}`, borderRadius: 10, padding: '14px 20px', color: T.red, fontSize: 13 }}>
          Error: {error}
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {rowsFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: T.muted, fontSize: 14 }}>
              {filtroVendedor
                ? 'Ningún cliente de este vendedor tiene saldo pendiente.'
                : `Sin clientes con saldo pendiente en ${empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'}.`}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                    {['Cliente', 'Saldo total', '0–30 d', '31–60 d', '61–90 d', '+90 d', 'Días máx', 'Acciones'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: h === 'Cliente' ? 'left' : 'right',
                        fontSize: 11, fontWeight: 700, color: T.muted,
                        textTransform: 'uppercase' as const, letterSpacing: '0.07em',
                        whiteSpace: 'nowrap',
                        ...(h === 'Acciones' ? { textAlign: 'center' as const } : {}),
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsFiltradas.map((row, i) => {
                    const bColor = getBucketColor(row)
                    const bs = BUCKET_STYLES[bColor]
                    return (
                      <tr
                        key={row.cliente_id ?? 'sin-cliente'}
                        className="aging-tr"
                        style={{
                          borderBottom: i < rowsFiltradas.length - 1 ? `1px solid ${T.border}` : 'none',
                          background: bs.bg,
                        }}
                      >
                        {/* Cliente */}
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ fontWeight: 600, color: T.text }}>{row.cliente_nombre}</div>
                          {nombreVendedor(row.vendedor_id) && (
                            <div style={{ fontSize: 10, color: T.wine, marginTop: 1, fontWeight: 600 }}>
                              Vendedor: {nombreVendedor(row.vendedor_id)}
                            </div>
                          )}
                          {row.telefono && (
                            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{row.telefono}</div>
                          )}
                          {row.ultima_compra && (
                            <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>
                              Última: {fmtDate(row.ultima_compra)}
                            </div>
                          )}
                        </td>
                        {/* Saldo total */}
                        <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: bs.color }}>
                          {fmt(row.saldo_total)}
                        </td>
                        {/* Buckets */}
                        <td style={{ padding: '11px 14px', textAlign: 'right', color: row.bucket_30 > 0 ? T.green : T.dim }}>
                          {row.bucket_30 > 0 ? fmt(row.bucket_30) : '—'}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', color: row.bucket_60 > 0 ? T.amber : T.dim }}>
                          {row.bucket_60 > 0 ? fmt(row.bucket_60) : '—'}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', color: row.bucket_90 > 0 ? T.gold : T.dim }}>
                          {row.bucket_90 > 0 ? fmt(row.bucket_90) : '—'}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', color: row.bucket_mas90 > 0 ? T.red : T.dim, fontWeight: row.bucket_mas90 > 0 ? 700 : 400 }}>
                          {row.bucket_mas90 > 0 ? fmt(row.bucket_mas90) : '—'}
                        </td>
                        {/* Días máx */}
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <span className="aging-badge" style={{ background: bs.bg, color: bs.color, border: `1px solid ${bs.bd}` }}>
                            {row.dias_maximo > 0 ? `${row.dias_maximo}d` : '—'}
                          </span>
                        </td>
                        {/* Acciones */}
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                            {/* WhatsApp */}
                            {row.telefono && buildWaLink(row.telefono, row.cliente_nombre, row.saldo_total, empresa) && (
                              <a
                                href={buildWaLink(row.telefono, row.cliente_nombre, row.saldo_total, empresa)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-wa"
                                title="Enviar recordatorio por WhatsApp"
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  width: 30, height: 30, borderRadius: 8,
                                  background: '#25D366', color: '#fff',
                                  fontSize: 14, textDecoration: 'none',
                                  transition: 'opacity 0.12s',
                                }}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                              </a>
                            )}
                            {/* Ver detalle */}
                            <button
                              className="btn-ver"
                              onClick={() => openDetalle(row)}
                              title="Ver detalle de ventas pendientes"
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                background: 'transparent', border: `1px solid ${T.border2}`,
                                borderRadius: 8, padding: '5px 10px', fontSize: 12,
                                color: T.wine, cursor: 'pointer', fontFamily: 'inherit',
                                fontWeight: 600, transition: 'background 0.12s',
                              }}
                            >
                              Ver
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Footer totales */}
                <tfoot>
                  <tr style={{ background: T.bg, borderTop: `2px solid ${T.border2}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.muted, fontSize: 12 }}>
                      TOTALES ({rowsFiltradas.length})
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: T.text }}>
                      {fmt(totalGeneral)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: T.green }}>
                      {fmt(footerBucket.b30)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: T.amber }}>
                      {fmt(footerBucket.b60)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: T.gold }}>
                      {fmt(footerBucket.b90)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: T.red }}>
                      {fmt(footerBucket.bMas90)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal detalle */}
      {modalCliente && (
        <div
          onMouseDown={onOverlayMouseDown} onClick={e => onOverlayClick(e, () => { setModalCliente(null) })}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.4)',
            backdropFilter: 'blur(6px)', zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div style={{
            background: T.surface, border: `1px solid ${T.border2}`,
            borderRadius: 14, width: '100%', maxWidth: 620,
            boxShadow: '0 20px 60px rgba(26,18,16,0.18)',
            overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '18px 22px', borderBottom: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                  {modalCliente.cliente_nombre}
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                  Comprobantes <strong>pendientes de cobro</strong> · Saldo adeudado:{' '}
                  <span style={{ color: T.wine, fontWeight: 700 }}>{fmt(modalCliente.saldo_total)}</span>
                </div>
              </div>
              <button
                onClick={() => setModalCliente(null)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: T.muted, fontSize: 20, lineHeight: 1, padding: '4px 8px',
                  borderRadius: 6,
                }}
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '4px 0' }}>
              {detalleLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: T.muted, fontSize: 13 }}>
                  Cargando ventas...
                </div>
              ) : detalleVentas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: T.muted, fontSize: 13 }}>
                  No se encontraron ventas pendientes.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      {['Fecha', 'Comprobante', 'Monto', 'Días', 'Antigüedad', ''].map(h => (
                        <th key={h} style={{
                          padding: '8px 16px', textAlign: h === 'Fecha' || h === 'Remito' ? 'left' : 'right',
                          fontSize: 11, fontWeight: 700, color: T.muted,
                          textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                          borderBottom: `1px solid ${T.border}`,
                          ...(h === 'Estado' ? { textAlign: 'center' as const } : {}),
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detalleVentas.map((v, i) => {
                      let diasColor = T.green
                      let diasLabel = '0–30 d'
                      if (v.dias > 90) { diasColor = T.red; diasLabel = '+90 d' }
                      else if (v.dias > 60) { diasColor = T.gold; diasLabel = '61–90 d' }
                      else if (v.dias > 30) { diasColor = T.amber; diasLabel = '31–60 d' }
                      return (
                        <tr key={v.id} style={{
                          borderBottom: i < detalleVentas.length - 1 ? `1px solid ${T.border}` : 'none',
                        }}>
                          <td style={{ padding: '10px 16px', color: T.muted }}>
                            {fmtDate(v.created_at)}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                background: v.tipo === 'factura' ? 'rgba(0,80,180,0.09)' : v.tipo === 'cargo' ? T.amberBg : T.wineBg,
                                color: v.tipo === 'factura' ? '#0050b4' : v.tipo === 'cargo' ? T.amber : T.wine,
                                border: `1px solid ${v.tipo === 'factura' ? 'rgba(0,80,180,0.25)' : v.tipo === 'cargo' ? T.amberBd : 'rgba(128,0,0,0.25)'}`,
                                textTransform: 'uppercase' as const,
                              }}>
                                {v.tipo === 'cargo' ? 'Deuda cargada' : v.tipo}
                              </span>
                              {v.tipo === 'cargo' ? (
                                <span style={{ color: T.dim, fontSize: 11 }}>Cargar deuda / sist. anterior</span>
                              ) : (
                                <span
                                  onClick={() => window.open(`/api/print/venta?id=${v.id}&empresa=${empresa}`, '_blank')}
                                  title="Ver / imprimir comprobante"
                                  style={{ color: T.dim, fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  {v.numero ? `#${v.numero}` : `#${v.id.slice(0, 8).toUpperCase()}`}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: T.text }}>
                            {fmt(v.total)}
                            {(v.monto_pagado || 0) > 0 && (
                              <div style={{ fontSize: 10, fontWeight: 400, color: T.amber, marginTop: 2 }}>
                                Parcial: pagó {fmt(v.monto_pagado || 0)}, falta {fmt(v.total - (v.monto_pagado || 0))}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: diasColor }}>
                            {v.dias}d
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                              background: diasColor === T.red ? T.redBg : diasColor === T.gold ? T.goldBg : diasColor === T.amber ? T.amberBg : T.greenBg,
                              color: diasColor,
                              border: `1px solid ${diasColor}33`,
                            }}>
                              {diasLabel}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                            <button
                              onClick={() => marcarPagado(v)}
                              style={{
                                background: T.greenBg, border: `1px solid ${T.greenBd}`,
                                borderRadius: 6, padding: '4px 10px', fontSize: 11,
                                color: T.green, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Cobrar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: T.bg, borderTop: `2px solid ${T.border2}` }}>
                      <td colSpan={2} style={{ padding: '10px 16px', fontWeight: 700, color: T.muted, fontSize: 12 }}>
                        {detalleVentas.length} comprobante{detalleVentas.length !== 1 ? 's' : ''} pendiente{detalleVentas.length !== 1 ? 's' : ''}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: T.wine }}>
                        {fmt(detalleVentas.reduce((s, v) => s + v.total, 0))}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Cobrar un monto global — se reparte solo del comprobante más viejo al más nuevo */}
            {modalCliente.cliente_id && detalleVentas.length > 0 && (
              <div style={{
                padding: '14px 22px', borderTop: `1px solid ${T.border}`,
                background: T.bg, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              }}>
                <div style={{ fontSize: 12, color: T.muted, flex: '1 1 220px' }}>
                  <strong style={{ color: T.text }}>Cobrar un monto</strong> — se descuenta solo del comprobante más viejo, y sigue con el siguiente si sobra.
                </div>
                <input
                  type="number" min="0" step="0.01" placeholder="Monto"
                  value={montoGlobal} onChange={e => setMontoGlobal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !cobrandoGlobal) cobrarMontoGlobal() }}
                  style={{
                    width: 140, padding: '8px 10px', borderRadius: 8,
                    border: `1px solid ${T.border2}`, fontSize: 13, fontFamily: 'inherit',
                  }}
                />
                <select
                  value={medioGlobal} onChange={e => setMedioGlobal(e.target.value)}
                  style={{
                    padding: '8px 10px', borderRadius: 8,
                    border: `1px solid ${T.border2}`, fontSize: 13, fontFamily: 'inherit', background: '#fff',
                  }}
                >
                  {MEDIOS_PAGO_COBRO.map(mp => <option key={mp}>{mp}</option>)}
                </select>
                <button
                  onClick={cobrarMontoGlobal}
                  disabled={cobrandoGlobal || !montoGlobal}
                  style={{
                    background: T.wine, color: '#fff', border: 'none', borderRadius: 8,
                    padding: '8px 18px', fontSize: 13, fontWeight: 600,
                    cursor: cobrandoGlobal ? 'default' : 'pointer', fontFamily: 'inherit',
                    opacity: cobrandoGlobal || !montoGlobal ? 0.6 : 1,
                  }}
                >
                  {cobrandoGlobal ? 'Aplicando...' : 'Cobrar'}
                </button>
              </div>
            )}

            {/* Modal footer */}
            <div style={{
              padding: '14px 22px', borderTop: `1px solid ${T.border}`,
              display: 'flex', gap: 10, justifyContent: 'flex-end',
            }}>
              {modalCliente.telefono && buildWaLink(modalCliente.telefono, modalCliente.cliente_nombre, modalCliente.saldo_total, empresa) && (
                <a
                  href={buildWaLink(modalCliente.telefono, modalCliente.cliente_nombre, modalCliente.saldo_total, empresa)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: '#25D366', color: '#fff',
                    border: 'none', borderRadius: 8, padding: '8px 16px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Enviar WhatsApp
                </a>
              )}
              <button
                onClick={() => setModalCliente(null)}
                style={{
                  background: T.bg, border: `1px solid ${T.border2}`,
                  borderRadius: 8, padding: '8px 18px', fontSize: 13,
                  color: T.muted, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal marcar pagado (monto + medio de pago) ───────────────────── */}
      {pagoModal && (
        <div
          onMouseDown={onOverlayMouseDown} onClick={e => onOverlayClick(e, () => { if (!pagando) setPagoModal(null) })}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.4)', backdropFilter: 'blur(6px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(26,18,16,0.18)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Registrar cobro</div>
              <button onClick={() => setPagoModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12, color: T.muted }}>
                {pagoModal.tipo === 'cargo' ? 'Deuda cargada' : pagoModal.numero ? `#${pagoModal.numero}` : pagoModal.id.slice(0, 8).toUpperCase()}
                {' — falta '}<strong style={{ color: T.wine }}>{fmt(pagoModal.total - (pagoModal.monto_pagado || 0))}</strong>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Monto cobrado</label>
                <input type="number" autoFocus value={pagoMonto} onChange={e => setPagoMonto(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !pagando) confirmarPago() }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Medio de pago</label>
                <select value={pagoMedioPago} onChange={e => setPagoMedioPago(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 14, fontFamily: 'inherit' }}>
                  {MEDIOS_PAGO_COBRO.map(mp => <option key={mp}>{mp}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setPagoModal(null)} disabled={pagando} style={{ background: T.bg, border: `1px solid ${T.border2}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button disabled={pagando || !pagoMonto} onClick={confirmarPago} style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: pagando ? 'default' : 'pointer', opacity: pagando || !pagoMonto ? 0.6 : 1, fontFamily: 'inherit' }}>
                {pagando ? 'Guardando...' : 'Confirmar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
