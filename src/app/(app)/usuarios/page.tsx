'use client'
import { useEffect, useState } from 'react'

// Quién puede entrar a gestión. Para sumar a alguien (o resetearle la
// contraseña) se genera un link de invitación y se le manda por WhatsApp.

interface Usuario { id: string; email: string; nombre: string | null; activo: boolean; ultimo_acceso: string | null; invitacion_expira: string | null; con_clave: boolean }

const T = { bg: '#F5F1EC', surface: '#FFFFFF', border: '#DDD0C0', border2: '#C8BAA8', text: '#1A1210', muted: '#6B5D55', dim: '#A89888', wine: '#800000', green: '#2D7A4F' }
const INP: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border2}`, fontSize: 13, fontFamily: 'inherit', background: T.surface }
const BTN: React.CSSProperties = { borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${T.border2}`, background: T.surface, color: T.text, whiteSpace: 'nowrap' }
const fecha = (s: string | null) => s ? new Date(s).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

export default function Usuarios() {
  const [lista, setLista] = useState<Usuario[]>([])
  const [yo, setYo] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [link, setLink] = useState<{ email: string; link: string } | null>(null)
  const [aviso, setAviso] = useState('')

  async function cargar() {
    const d = await fetch('/api/usuarios').then(r => r.json())
    if (d.error) { setAviso(d.error); return }
    setLista(d.usuarios); setYo(d.yo)
  }
  useEffect(() => { cargar() }, [])

  async function post(body: object) {
    const d = await fetch('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json())
    if (d.error) { setAviso(d.error); return null }
    setAviso(''); return d
  }

  async function invitar(mail: string, nom?: string | null) {
    const d = await post({ accion: 'invitar', email: mail, nombre: nom })
    if (!d) return
    setLink({ email: mail, link: d.link }); setEmail(''); setNombre(''); cargar()
  }

  const texto = link ? `Te paso el acceso a gestión de Aroma de Vid / La Vid. Entrá a este link y creá tu contraseña (vale 7 días, es personal):\n\n${link.link}` : ''

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', color: T.text }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Usuarios</h1>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: 18 }}>Quiénes pueden entrar a gestión. Cada persona entra con su email y su contraseña.</div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Sumar a alguien</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input style={{ ...INP, flex: '1 1 220px' }} type="email" placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input style={{ ...INP, flex: '1 1 160px' }} placeholder="nombre (opcional)" value={nombre} onChange={e => setNombre(e.target.value)} />
          <button style={{ ...BTN, background: T.wine, color: '#fff', border: 'none' }} disabled={!email.includes('@')} onClick={() => invitar(email, nombre)}>Generar invitación</button>
        </div>
        {link && (
          <div style={{ marginTop: 12, background: T.bg, borderRadius: 10, padding: 12, fontSize: 13 }}>
            Link para <b>{link.email}</b> (se muestra solo ahora):
            <div style={{ wordBreak: 'break-all', margin: '6px 0 10px', fontFamily: 'monospace', fontSize: 12 }}>{link.link}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a style={{ ...BTN, textDecoration: 'none', background: '#25D366', color: '#fff', border: 'none' }} href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer">Mandar por WhatsApp</a>
              <button style={BTN} onClick={() => navigator.clipboard.writeText(link.link).then(() => setAviso('Link copiado'))}>Copiar link</button>
            </div>
          </div>
        )}
        {aviso && <div style={{ marginTop: 10, fontSize: 13, color: T.muted }}>{aviso}</div>}
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {lista.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap', opacity: u.activo ? 1 : 0.5 }}>
            <div style={{ flex: '1 1 220px' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{u.nombre || u.email}{u.id === yo && <span style={{ color: T.dim, fontWeight: 400 }}> (vos)</span>}</div>
              <div style={{ fontSize: 12, color: T.dim }}>{u.email}</div>
            </div>
            <div style={{ fontSize: 12, color: T.muted, minWidth: 160 }}>
              {!u.activo ? 'Deshabilitado' : u.con_clave ? `Último ingreso: ${fecha(u.ultimo_acceso)}` : 'Invitado, todavía no entró'}
            </div>
            <button style={BTN} onClick={() => invitar(u.email, u.nombre)}>{u.con_clave ? 'Resetear contraseña' : 'Nuevo link'}</button>
            {u.id !== yo && <button style={BTN} onClick={async () => { if (await post({ accion: 'activo', id: u.id, activo: !u.activo })) cargar() }}>{u.activo ? 'Deshabilitar' : 'Habilitar'}</button>}
          </div>
        ))}
        {!lista.length && <div style={{ padding: 16, fontSize: 13, color: T.dim }}>Sin usuarios todavía.</div>}
      </div>
    </div>
  )
}
