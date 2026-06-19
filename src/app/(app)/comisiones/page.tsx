'use client'
import { useEffect, useState, useCallback } from 'react'

const T = {
  bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8',
  text: '#1A1210', muted: '#6B5D55', dim: '#A89888',
  wine: '#800000', wineBg: 'rgba(128,0,0,0.07)', wineBd: 'rgba(128,0,0,0.18)',
  green: '#2D7A4F', greenBg: 'rgba(45,122,79,0.08)', greenBd: 'rgba(45,122,79,0.22)',
  red: '#C03030', redBg: 'rgba(192,48,48,0.08)', redBd: 'rgba(192,48,48,0.22)',
  blue: '#2B5EA0', blueBg: 'rgba(43,94,160,0.08)',
  gold: '#B88A2C', goldBg: 'rgba(184,138,44,0.08)', goldBd: 'rgba(184,138,44,0.22)',
  amber: '#C07010', amberBg: 'rgba(192,112,16,0.09)', amberBd: 'rgba(192,112,16,0.25)',
}

interface Comision {
  id: string | null
  vendedor_id: string
  vendedor_nombre: string
  porcentaje_comision: number
  porcentaje: number
  total_ventas: number
  monto_comision: number
  estado: 'pendiente' | 'pagada'
  pagada_at: string | null
  notas: string
}

function fmt(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
}

function getPeriodoActual() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function ComisionesPage() {
  const [empresa, setEmpresa] = useState<'aroma' | 'lavid'>('aroma')
  const [periodo, setPeriodo] = useState(getPeriodoActual())
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState<string | null>(null)

  // % inline edit
  const [editPct, setEditPct] = useState<Record<string, string>>({})
  const [savingPct, setSavingPct] = useState<string | null>(null)

  // modal pagar
  const [modalPagar, setModalPagar] = useState<Comision | null>(null)
  const [notasModal, setNotasModal] = useState('')
  const [pagando, setPagando] = useState(false)

  // toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const [anio, mesIdx] = periodo.split('-').map(Number)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3200)
  }

  const cargar = useCallback(async (emp: string, per: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/comisiones?empresa=${emp}&periodo=${per}`)
      const data = await res.json()
      if (data.error) { showToast(data.error, false); setComisiones([]) }
      else setComisiones(Array.isArray(data) ? data : [])
    } catch {
      showToast('Error de conexión', false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const e = (localStorage.getItem('empresa') || 'aroma') as 'aroma' | 'lavid'
    setEmpresa(e)
    cargar(e, periodo)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function cambiarEmpresa(e: 'aroma' | 'lavid') {
    setEmpresa(e)
    cargar(e, periodo)
  }

  function cambiarAnio(delta: number) {
    const newAnio = anio + delta
    const newPer  = `${newAnio}-${String(mesIdx).padStart(2, '0')}`
    setPeriodo(newPer)
    cargar(empresa, newPer)
  }

  function cambiarMes(m: number) {
    const newPer = `${anio}-${String(m).padStart(2, '0')}`
    setPeriodo(newPer)
    cargar(empresa, newPer)
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalVentas   = comisiones.reduce((a, c) => a + c.total_ventas, 0)
  const totalComision = comisiones.reduce((a, c) => a + c.monto_comision, 0)
  const pagadas       = comisiones.filter(c => c.estado === 'pagada').reduce((a, c) => a + c.monto_comision, 0)
  const pendientes    = comisiones.filter(c => c.estado === 'pendiente').reduce((a, c) => a + c.monto_comision, 0)

  // ── Edición inline de porcentaje ──────────────────────────────────────────
  function iniciarEditPct(c: Comision) {
    setEditPct(prev => ({ ...prev, [c.vendedor_id]: String(c.porcentaje_comision) }))
  }

  async function guardarPct(c: Comision) {
    const val = parseFloat(editPct[c.vendedor_id] ?? '')
    if (isNaN(val) || val < 0 || val > 100) { showToast('Porcentaje inválido (0-100)', false); return }
    setSavingPct(c.vendedor_id)
    try {
      const res = await fetch('/api/comisiones?accion=editar_porcentaje', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendedor_id: c.vendedor_id, porcentaje_comision: val }),
      })
      const data = await res.json()
      if (data.error) { showToast(data.error, false); return }
      showToast(`Porcentaje de ${c.vendedor_nombre} actualizado`)
      setEditPct(prev => { const p = { ...prev }; delete p[c.vendedor_id]; return p })
      cargar(empresa, periodo)
    } catch {
      showToast('Error al guardar', false)
    } finally {
      setSavingPct(null)
    }
  }

  function cancelarEditPct(id: string) {
    setEditPct(prev => { const p = { ...prev }; delete p[id]; return p })
  }

  // ── Marcar como pagada ────────────────────────────────────────────────────
  function abrirModalPagar(c: Comision) {
    setModalPagar(c)
    setNotasModal('')
  }

  async function confirmarPago() {
    if (!modalPagar) return
    setPagando(true)
    try {
      const res = await fetch('/api/comisiones?accion=pagar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa,
          vendedor_nombre: modalPagar.vendedor_nombre,
          periodo,
          notas:           notasModal,
          total_ventas:    modalPagar.total_ventas,
          porcentaje:      modalPagar.porcentaje,
          monto_comision:  modalPagar.monto_comision,
        }),
      })
      const data = await res.json()
      if (data.error) { showToast(data.error, false); return }
      showToast(`Comisión de ${modalPagar.vendedor_nombre} marcada como pagada`)
      setModalPagar(null)
      cargar(empresa, periodo)
    } catch {
      showToast('Error al registrar pago', false)
    } finally {
      setPagando(false)
    }
  }

  // ── Guardar comisión pendiente ─────────────────────────────────────────────
  async function guardarComision(c: Comision) {
    setGuardando(c.vendedor_id)
    try {
      const res = await fetch('/api/comisiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa,
          vendedor_id:    c.vendedor_id,
          vendedor_nombre: c.vendedor_nombre,
          periodo,
          total_ventas:   c.total_ventas,
          porcentaje:     c.porcentaje,
          monto_comision: c.monto_comision,
          estado:         'pendiente',
          notas:          '',
        }),
      })
      const data = await res.json()
      if (data.error) { showToast(data.error, false); return }
      showToast('Comisión guardada')
      cargar(empresa, periodo)
    } catch {
      showToast('Error al guardar', false)
    } finally {
      setGuardando(null)
    }
  }

  const periodoLabel = `${MESES[mesIdx - 1]} ${anio}`

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .btn-hover:hover { opacity: 0.85 !important; }
        .row-hover:hover { background: rgba(0,0,0,0.018) !important; }
        .pct-inp:focus { border-color: ${T.wine} !important; outline: none; }
        .mes-btn:hover { background: ${T.bg} !important; border-color: ${T.border2} !important; }
        .mes-btn.active { background: ${T.wine} !important; color: #fff !important; border-color: ${T.wine} !important; }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>💰 Comisiones</h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 4, marginBottom: 0 }}>
            {periodoLabel} · {empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Selector empresa */}
          <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {(['aroma', 'lavid'] as const).map(e => (
              <button key={e} onClick={() => cambiarEmpresa(e)}
                style={{
                  padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: empresa === e ? T.wine : T.surface,
                  color: empresa === e ? '#fff' : T.muted,
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}>
                {e === 'aroma' ? 'Aroma' : 'La Vid'}
              </button>
            ))}
          </div>

          {/* Selector año */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => cambiarAnio(-1)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: T.muted, fontSize: 13, fontFamily: 'inherit' }}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text, padding: '0 4px', minWidth: 42, textAlign: 'center' }}>{anio}</span>
            <button onClick={() => cambiarAnio(1)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: T.muted, fontSize: 13, fontFamily: 'inherit' }}>›</button>
          </div>
        </div>
      </div>

      {/* Selector de mes */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {MESES.map((m, i) => (
          <button key={m} onClick={() => cambiarMes(i + 1)}
            className={`mes-btn${mesIdx === i + 1 ? ' active' : ''}`}
            style={{
              padding: '5px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              border: `1px solid ${T.border}`, borderRadius: 20,
              background: T.surface, color: T.muted, fontFamily: 'inherit', transition: 'all 0.12s',
            }}>
            {m.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* ── KPI CARDS ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total ventas del período', value: fmt(totalVentas), color: T.blue, bg: T.blueBg, icon: '📊' },
          { label: 'Total comisiones a pagar', value: fmt(totalComision), color: T.wine, bg: T.wineBg, icon: '💰' },
          { label: 'Comisiones pagadas', value: fmt(pagadas), color: T.green, bg: T.greenBg, icon: '✅' },
          { label: 'Pendientes de pago', value: fmt(pendientes), color: T.amber, bg: T.amberBg, icon: '⏳' },
        ].map(card => (
          <div key={card.label} style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
            padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              {card.icon} {card.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ── TABLA ──────────────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Cabecera */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 160px 1.2fr 120px 180px', gap: 0, borderBottom: `1px solid ${T.border}`, background: T.bg }}>
          {['Vendedor', 'Total ventas', '% comisión', 'Monto comisión', 'Estado', 'Acciones'].map(h => (
            <div key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.dim, fontSize: 13 }}>Cargando comisiones...</div>
        ) : comisiones.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.dim, fontSize: 13 }}>
            No hay vendedores activos para mostrar.
          </div>
        ) : (
          comisiones.map((c, idx) => {
            const editando = c.vendedor_id in editPct
            const isPagada = c.estado === 'pagada'

            return (
              <div key={c.vendedor_id} className="row-hover" style={{
                display: 'grid',
                gridTemplateColumns: '1.8fr 1.4fr 160px 1.2fr 120px 180px',
                borderBottom: idx < comisiones.length - 1 ? `1px solid ${T.border}` : 'none',
                alignItems: 'center',
                transition: 'background 0.1s',
              }}>

                {/* Nombre */}
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.vendedor_nombre}</div>
                  {isPagada && c.pagada_at && (
                    <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>
                      Pagada {new Date(c.pagada_at).toLocaleDateString('es-AR')}
                    </div>
                  )}
                </div>

                {/* Total ventas */}
                <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: c.total_ventas > 0 ? T.text : T.dim }}>
                  {c.total_ventas > 0 ? fmt(c.total_ventas) : <span style={{ color: T.dim }}>Sin ventas</span>}
                </div>

                {/* % comisión (editable inline) */}
                <div style={{ padding: '12px 16px' }}>
                  {editando ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <input
                        className="pct-inp"
                        type="number" min="0" max="100" step="0.5"
                        value={editPct[c.vendedor_id]}
                        onChange={e => setEditPct(prev => ({ ...prev, [c.vendedor_id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') guardarPct(c); if (e.key === 'Escape') cancelarEditPct(c.vendedor_id) }}
                        style={{
                          width: 64, padding: '5px 8px', fontSize: 13, border: `1px solid ${T.border2}`,
                          borderRadius: 6, fontFamily: 'inherit', color: T.text, background: T.surface,
                        }}
                        autoFocus
                      />
                      <span style={{ fontSize: 12, color: T.muted }}>%</span>
                      <button onClick={() => guardarPct(c)} disabled={savingPct === c.vendedor_id}
                        style={{
                          background: T.green, color: '#fff', border: 'none', borderRadius: 5,
                          padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                          fontWeight: 600,
                        }}>
                        {savingPct === c.vendedor_id ? '...' : '✓'}
                      </button>
                      <button onClick={() => cancelarEditPct(c.vendedor_id)}
                        style={{
                          background: T.bg, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 5,
                          padding: '4px 7px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => iniciarEditPct(c)}
                      title="Editar porcentaje"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: T.goldBg, border: `1px solid ${T.goldBd}`, borderRadius: 6,
                        padding: '4px 10px', fontSize: 13, fontWeight: 600, color: T.gold,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.12s',
                      }}>
                      {c.porcentaje_comision}%
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  )}
                </div>

                {/* Monto comisión */}
                <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: T.wine }}>
                  {fmt(c.monto_comision)}
                </div>

                {/* Estado badge */}
                <div style={{ padding: '12px 16px' }}>
                  {isPagada ? (
                    <span style={{
                      display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 10px',
                      borderRadius: 20, background: T.greenBg, color: T.green, border: `1px solid ${T.greenBd}`,
                    }}>
                      Pagada
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 10px',
                      borderRadius: 20, background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBd}`,
                    }}>
                      Pendiente
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ padding: '12px 16px', display: 'flex', gap: 6 }}>
                  {!isPagada && (
                    <>
                      {c.monto_comision > 0 && (
                        <button onClick={() => abrirModalPagar(c)}
                          style={{
                            background: T.green, color: '#fff', border: 'none', borderRadius: 7,
                            padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            fontFamily: 'inherit', transition: 'opacity 0.12s', whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '0.83')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                          ✓ Marcar pagada
                        </button>
                      )}
                      {!c.id && c.monto_comision > 0 && (
                        <button onClick={() => guardarComision(c)} disabled={guardando === c.vendedor_id}
                          style={{
                            background: T.bg, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 7,
                            padding: '6px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                          }}>
                          {guardando === c.vendedor_id ? '...' : 'Guardar'}
                        </button>
                      )}
                    </>
                  )}
                  {isPagada && (
                    <span style={{ fontSize: 12, color: T.dim }}>
                      {c.notas ? `"${c.notas.slice(0, 30)}"` : '—'}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Fila totales */}
        {!loading && comisiones.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 160px 1.2fr 120px 180px',
            borderTop: `2px solid ${T.border2}`, background: T.bg,
          }}>
            <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>
              TOTAL ({comisiones.length} vendedores)
            </div>
            <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: T.text }}>
              {fmt(totalVentas)}
            </div>
            <div style={{ padding: '12px 16px' }} />
            <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: T.wine }}>
              {fmt(totalComision)}
            </div>
            <div style={{ padding: '12px 16px', fontSize: 12, color: T.dim }}>
              {comisiones.filter(c => c.estado === 'pagada').length}/{comisiones.length} pagadas
            </div>
            <div style={{ padding: '12px 16px' }} />
          </div>
        )}
      </div>

      {/* ── MODAL PAGAR ────────────────────────────────────────────────────── */}
      {modalPagar && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(5px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setModalPagar(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, width: 420, padding: 28, boxShadow: '0 24px 64px rgba(26,18,16,0.18)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>
              Marcar comisión como pagada
            </h2>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              {modalPagar.vendedor_nombre} · {periodoLabel}
            </p>

            {/* Resumen */}
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: T.muted }}>Total ventas</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{fmt(modalPagar.total_ventas)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: T.muted }}>Porcentaje</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{modalPagar.porcentaje}%</span>
              </div>
              <div style={{ height: 1, background: T.border, margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Monto a pagar</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: T.wine }}>{fmt(modalPagar.monto_comision)}</span>
              </div>
            </div>

            {/* Notas */}
            <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: 'block', marginBottom: 6 }}>
              Notas (opcional)
            </label>
            <textarea
              value={notasModal}
              onChange={e => setNotasModal(e.target.value)}
              placeholder="Ej: Transferencia bancaria ref. 12345"
              rows={3}
              style={{
                width: '100%', padding: '9px 12px', fontSize: 13, border: `1px solid ${T.border}`,
                borderRadius: 8, fontFamily: 'inherit', color: T.text, background: T.surface,
                resize: 'vertical', outline: 'none',
              }}
            />

            {/* Botones */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalPagar(null)}
                style={{
                  background: T.bg, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 8,
                  padding: '9px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                }}>
                Cancelar
              </button>
              <button onClick={confirmarPago} disabled={pagando}
                style={{
                  background: T.green, color: '#fff', border: 'none', borderRadius: 8,
                  padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  opacity: pagando ? 0.7 : 1,
                }}>
                {pagando ? 'Registrando...' : '✓ Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 500,
          background: toast.ok ? T.green : T.red, color: '#fff',
          padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: '0 6px 24px rgba(0,0,0,0.18)', maxWidth: 340,
          animation: 'slideUp 0.22s ease',
        }}>
          <style>{`@keyframes slideUp { from { opacity: 0; } to { opacity: 1; } }`}</style>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
