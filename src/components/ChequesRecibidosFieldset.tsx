'use client'

// Uno o varios cheques "recibidos" (de un cliente) que cubren un cobro —
// versión con lista de ChequeCobroFields.tsx, para cuando un mismo cobro se
// cubre con varios cheques a fechas distintas (ej. 3 cheques a 30/60/90
// días). Cada fila tiene su propio monto; la suma de todas las filas es el
// monto real cubierto por "Cheque" en ese cobro — la lógica de qué hacer con
// esos valores (crear un cheque "recibido" por fila vía /api/cheques después
// del cobro) vive en cada llamador. Estilos neutros, no depende del theme
// particular de cada página.

export interface ChequeRecibido {
  numero: string
  banco: string
  librador: string
  monto: number
  fecha: string
}

export function nuevoChequeRecibido(librador = ''): ChequeRecibido {
  return { numero: '', banco: '', librador, monto: 0, fecha: '' }
}

export function sumaCheques(cheques: ChequeRecibido[]): number {
  return parseFloat(cheques.reduce((s, c) => s + (c.monto || 0), 0).toFixed(2))
}

export function chequesCompletos(cheques: ChequeRecibido[]): boolean {
  return cheques.length > 0 && cheques.every(c => c.numero && c.fecha && c.monto > 0)
}

export function ChequesRecibidosFieldset({ cheques, onChange }: {
  cheques: ChequeRecibido[]
  onChange: (cheques: ChequeRecibido[]) => void
}) {
  const inp: React.CSSProperties = {
    flex: 1, padding: '8px 10px', borderRadius: 7,
    border: '1px solid #C8BAA8', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
  }

  function editar(i: number, patch: Partial<ChequeRecibido>) {
    onChange(cheques.map((c, idx) => idx === i ? { ...c, ...patch } : c))
  }
  function agregar() {
    onChange([...cheques, nuevoChequeRecibido(cheques[0]?.librador || '')])
  }
  function quitar(i: number) {
    onChange(cheques.filter((_, idx) => idx !== i))
  }

  return (
    <div style={{ background: '#F5F1EC', border: '1px solid #DDD0C0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B5D55', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {cheques.length > 1 ? `${cheques.length} cheques` : 'Datos del cheque'}
      </div>
      {cheques.map((ch, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: cheques.length > 1 ? 8 : 0, borderBottom: cheques.length > 1 && i < cheques.length - 1 ? '1px dashed #DDD0C0' : 'none' }}>
          {cheques.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#A89888' }}>Cheque {i + 1}</span>
              <button type="button" onClick={() => quitar(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A89888', fontSize: 12 }}>Quitar</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="N° de cheque" value={ch.numero} onChange={e => editar(i, { numero: e.target.value })} style={inp} />
            <input placeholder="Banco" value={ch.banco} onChange={e => editar(i, { banco: e.target.value })} style={inp} />
          </div>
          <input placeholder="Librador (quién lo firmó)" value={ch.librador} onChange={e => editar(i, { librador: e.target.value })} style={{ ...inp, width: '100%' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10.5, color: '#A89888', display: 'block', marginBottom: 4 }}>Monto</label>
              <input type="number" step="any" min={0} value={ch.monto || ''} onChange={e => editar(i, { monto: parseFloat(e.target.value) || 0 })} style={{ ...inp, width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10.5, color: '#A89888', display: 'block', marginBottom: 4 }}>Fecha de cobro</label>
              <input type="date" value={ch.fecha} onChange={e => editar(i, { fecha: e.target.value })} style={{ ...inp, width: '100%' }} />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={agregar} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', color: '#800000', fontSize: 12, fontWeight: 600, padding: 0 }}>
        + Agregar otro cheque
      </button>
    </div>
  )
}
