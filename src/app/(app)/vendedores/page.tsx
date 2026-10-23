'use client'
import AccesoPortal from './AccesoPortal'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { onOverlayMouseDown, onOverlayClick } from '@/lib/overlayClose'

interface Vendedor {
  id: string
  nombre: string
  activo: boolean | null
  telefono: string | null
  email: string | null
  zona: string | null
  notas: string | null
  porcentaje_comision: number | null
  clientes: number
  portal_url: string | null
  portal_ultimo_acceso: string | null
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
  green:   '#2D7A4F',
  greenBg: 'rgba(45,122,79,0.08)',
  greenBd: 'rgba(45,122,79,0.22)',
  amber:   '#9A6B12',
  amberBg: 'rgba(196,140,30,0.10)',
  amberBd: 'rgba(196,140,30,0.28)',
  red:     '#C03030',
  redBg:   'rgba(192,48,48,0.08)',
  redBd:   'rgba(192,48,48,0.22)',
}

const INP: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
  color: T.text, padding: '9px 12px', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
}
const LBL: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }
const BTN: React.CSSProperties = { background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, borderRadius: 6, padding: '5px 11px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }

type Form = { nombre: string; telefono: string; email: string; zona: string; porcentaje_comision: string; notas: string }
const EMPTY: Form = { nombre: '', telefono: '', email: '', zona: '', porcentaje_comision: '5', notas: '' }

function Badge({ v }: { v: Vendedor }) {
  const [txt, c, bg, bd] = !v.portal_url
    ? ['Sin acceso', T.dim, T.bg, T.border]
    : v.portal_ultimo_acceso
      ? [`Activo · entró ${new Date(v.portal_ultimo_acceso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}`, T.green, T.greenBg, T.greenBd]
      : ['Link enviado · sin entrar', T.amber, T.amberBg, T.amberBd]
  return <span style={{ fontSize: 11, fontWeight: 700, color: c, background: bg, border: `1px solid ${bd}`, borderRadius: 99, padding: '3px 9px', whiteSpace: 'nowrap' }}>{txt}</span>
}

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ficha, setFicha] = useState<Vendedor | 'nuevo' | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    setError('')
    try {
      const data = await fetch('/api/vendedores?todos=1').then(r => r.json())
      if (data.error) { setError(data.error); setVendedores([]) }
      else {
        setVendedores(Array.isArray(data) ? data : [])
        // Mantener la ficha abierta al día (ej. después de generar el acceso)
        setFicha(f => (f && f !== 'nuevo' ? (data as Vendedor[]).find(v => v.id === f.id) ?? f : f))
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function abrir(v: Vendedor | 'nuevo') {
    setFicha(v)
    setForm(v === 'nuevo' ? { ...EMPTY } : {
      nombre: v.nombre, telefono: v.telefono ?? '', email: v.email ?? '', zona: v.zona ?? '',
      porcentaje_comision: String(v.porcentaje_comision ?? 5), notas: v.notas ?? '',
    })
  }

  async function guardar() {
    if (!form.nombre.trim() || !ficha) return
    setGuardando(true)
    try {
      const body = { ...form, porcentaje_comision: Number(form.porcentaje_comision.replace(',', '.')) || 0 }
      const data = await fetch('/api/vendedores', {
        method: ficha === 'nuevo' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ficha === 'nuevo' ? body : { id: ficha.id, ...body }),
      }).then(r => r.json())
      if (data.error) { showToast('Error: ' + data.error); return }
      showToast(ficha === 'nuevo' ? 'Vendedor creado' : 'Datos guardados')
      // Un vendedor nuevo queda con la ficha abierta para darle acceso al portal
      if (ficha === 'nuevo') setFicha({ ...data, clientes: 0, portal_url: null, portal_ultimo_acceso: null })
      await cargar()
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarActivo(v: Vendedor, activo: boolean) {
    if (!activo && !confirm(`¿Desactivar a ${v.nombre}? Deja de aparecer para elegir en ventas y pedidos.`)) return
    const data = activo
      ? await fetch('/api/vendedores', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: v.id, activo: true }) }).then(r => r.json())
      : await fetch(`/api/vendedores?id=${v.id}`, { method: 'DELETE' }).then(r => r.json())
    if (data.error) { showToast('Error: ' + data.error); return }
    setFicha(null)
    cargar()
    showToast(activo ? 'Vendedor reactivado' : 'Vendedor desactivado')
  }

  const activos = vendedores.filter(v => v.activo !== false)
  const inactivos = vendedores.filter(v => v.activo === false)
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  const actual = ficha && ficha !== 'nuevo' ? ficha : null
  const cambiado = actual ? (
    form.nombre !== actual.nombre || form.telefono !== (actual.telefono ?? '') || form.email !== (actual.email ?? '') ||
    form.zona !== (actual.zona ?? '') || form.notas !== (actual.notas ?? '') || form.porcentaje_comision !== String(actual.porcentaje_comision ?? 5)
  ) : true

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        .tr:hover { background: #FDFAF6 !important; }
        .vinp:focus { border-color: ${T.border2} !important; }
        .btn-act:hover { opacity: 0.85; }
        .vgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 640px) { .vgrid { grid-template-columns: 1fr; } .vcol-opt { display: none; } }
      `}</style>

      {/* Page header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Vendedores</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: '3px 0 0' }}>
            {activos.length} activos · cada uno con su acceso al portal para ver sus clientes, tomar pedidos y anotar cobros
          </p>
        </div>
        <button className="btn-act" onClick={() => abrir('nuevo')}
          style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          + Nuevo vendedor
        </button>
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 1080 }}>
        {error && (
          <div style={{ background: T.redBg, border: `1px solid ${T.redBd}`, borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: T.red }}>
            <strong>No se pudieron cargar los vendedores:</strong> {error}
          </div>
        )}

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflowX: 'auto', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {[['Vendedor', ''], ['Teléfono', 'vcol-opt'], ['Comisión', 'vcol-opt'], ['Clientes', ''], ['Portal', ''], ['', '']].map(([h, cls], i) => (
                  <th key={i} className={cls} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && vendedores.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: T.dim, fontSize: 13 }}>Cargando...</td></tr>
              ) : activos.length === 0 && !error ? (
                <tr><td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: T.dim, fontSize: 13 }}>No hay vendedores. Creá el primero con el botón de arriba.</td></tr>
              ) : activos.map(v => (
                <tr key={v.id} className="tr" onClick={() => abrir(v)} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>{v.nombre}</div>
                    {v.zona && <div style={{ fontSize: 12, color: T.dim }}>{v.zona}</div>}
                  </td>
                  <td className="vcol-opt" style={{ padding: '12px 16px', fontSize: 13, color: v.telefono ? T.text : T.dim }}>{v.telefono || '— sin cargar'}</td>
                  <td className="vcol-opt" style={{ padding: '12px 16px', fontSize: 13, color: T.text }}>{v.porcentaje_comision ?? 5}%</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: T.text }}>{v.clientes}</td>
                  <td style={{ padding: '12px 16px' }}><Badge v={v} /></td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button style={BTN} onClick={e => { e.stopPropagation(); abrir(v) }}>Abrir ficha</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {inactivos.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Inactivos ({inactivos.length})</div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', opacity: 0.75 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {inactivos.map(v => (
                    <tr key={v.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: T.muted }}>{v.nombre}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <button onClick={() => cambiarActivo(v, true)}
                          style={{ ...BTN, background: T.greenBg, border: `1px solid ${T.greenBd}`, color: T.green }}>Reactivar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Ficha del vendedor */}
      {ficha && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}
          onMouseDown={onOverlayMouseDown} onClick={e => onOverlayClick(e, () => setFicha(null))}
        >
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 600, boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.text }}>
                {actual ? actual.nombre : 'Nuevo vendedor'}
              </h2>
              <button onClick={() => setFicha(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            {/* Datos */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>Datos</div>
              <div className="vgrid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LBL}>Nombre</label>
                  <input className="vinp" style={INP} value={form.nombre} onChange={set('nombre')} placeholder="Nombre y apellido" autoFocus={ficha === 'nuevo'} />
                </div>
                <div>
                  <label style={LBL}>Teléfono (WhatsApp)</label>
                  <input className="vinp" style={INP} value={form.telefono} onChange={set('telefono')} placeholder="11 2345 6789" inputMode="tel" />
                </div>
                <div>
                  <label style={LBL}>Email</label>
                  <input className="vinp" style={INP} value={form.email} onChange={set('email')} placeholder="opcional" inputMode="email" />
                </div>
                <div>
                  <label style={LBL}>Zona</label>
                  <input className="vinp" style={INP} value={form.zona} onChange={set('zona')} placeholder="Ej: Zona Norte, CABA" />
                </div>
                <div>
                  <label style={LBL}>Comisión %</label>
                  <input className="vinp" style={INP} value={form.porcentaje_comision} onChange={set('porcentaje_comision')} inputMode="decimal" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LBL}>Notas</label>
                  <textarea className="vinp" style={{ ...INP, minHeight: 64, resize: 'vertical' }} value={form.notas} onChange={set('notas')} placeholder="Condiciones, días de visita, lo que haga falta recordar" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                <button onClick={guardar} disabled={guardando || !form.nombre.trim() || !cambiado}
                  style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: guardando || !form.nombre.trim() || !cambiado ? 0.5 : 1 }}>
                  {guardando ? 'Guardando...' : ficha === 'nuevo' ? 'Crear vendedor' : cambiado ? 'Guardar cambios' : 'Guardado'}
                </button>
              </div>
            </div>

            {/* Portal */}
            {actual && (
              <div style={{ padding: '18px 24px', borderTop: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Acceso al portal</div>
                  <Badge v={actual} />
                </div>
                <AccesoPortal key={actual.id} vendedor={actual} onCambio={cargar} />
                <div style={{ fontSize: 12, color: T.muted, marginTop: 12 }}>
                  En el portal ve <b>{actual.clientes} {actual.clientes === 1 ? 'cliente' : 'clientes'}</b>: los que tienen a {actual.nombre} como vendedor en su ficha.{' '}
                  <Link href="/clientes" style={{ color: T.wine }}>Asignar clientes →</Link>
                </div>
              </div>
            )}

            {actual && (
              <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-start' }}>
                <button onClick={() => cambiarActivo(actual, false)} style={{ ...BTN, background: T.redBg, border: `1px solid ${T.redBd}`, color: T.red }}>Desactivar vendedor</button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 13, padding: '12px 20px', borderRadius: 10, boxShadow: '0 4px 16px rgba(26,18,16,0.12)', zIndex: 200 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
