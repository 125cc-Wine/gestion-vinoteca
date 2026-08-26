'use client'

// Campos que se muestran cuando el medio de pago elegido en un cobro es
// "Cheque" — se repite en varios flujos de cobro (Ventas, Aging, Clientes),
// cada uno con su propio estado, así que este componente solo pinta los 4
// inputs controlados; la lógica de qué hacer con esos valores (crear el
// cheque "recibido" vía /api/cheques después del cobro) vive en cada
// llamador. Estilos neutros, no depende del theme particular de cada página.
export function ChequeCobroFields({
  numero, banco, librador, fecha,
  onNumero, onBanco, onLibrador, onFecha,
}: {
  numero: string; banco: string; librador: string; fecha: string
  onNumero: (v: string) => void; onBanco: (v: string) => void
  onLibrador: (v: string) => void; onFecha: (v: string) => void
}) {
  const inp: React.CSSProperties = {
    flex: 1, padding: '8px 10px', borderRadius: 7,
    border: '1px solid #C8BAA8', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
  }
  return (
    <div style={{ background: '#F5F1EC', border: '1px solid #DDD0C0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B5D55', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Datos del cheque
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input placeholder="N° de cheque" value={numero} onChange={e => onNumero(e.target.value)} style={inp} />
        <input placeholder="Banco" value={banco} onChange={e => onBanco(e.target.value)} style={inp} />
      </div>
      <input placeholder="Librador (quién lo firmó)" value={librador} onChange={e => onLibrador(e.target.value)} style={{ ...inp, width: '100%' }} />
      <div>
        <label style={{ fontSize: 10.5, color: '#A89888', display: 'block', marginBottom: 4 }}>Fecha de cobro</label>
        <input type="date" value={fecha} onChange={e => onFecha(e.target.value)} style={{ ...inp, width: '100%' }} />
      </div>
    </div>
  )
}
