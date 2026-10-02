import { clienteActual } from '@/lib/session'
import { cuentaDe } from '@/lib/cuenta'
import { EMPRESAS } from '@/lib/empresas'
import Header from '../Header'
import Ingreso from '../Ingreso'

export const dynamic = 'force-dynamic'

const pesos = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR')
const dia = (s: string) => new Date(s.length === 10 ? s + 'T12:00:00' : s).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })

export default async function MiCuenta() {
  const cliente = await clienteActual()
  if (!cliente || !cliente.id) return <Ingreso />

  const header = <Header empresa={cliente.empresa} activo="cuenta" admin={cliente.admin} preview={cliente.preview} cliente={cliente.nombre} />

  // Con solo el CUIT no se muestra la cuenta: hace falta el link personal + PIN.
  if (!cliente.verificado) return (
    <div data-empresa={cliente.empresa}>
      {header}
      <main className="wrap">
        <div className="cuenta-lock">
          <div className="lock-ico">🔒</div>
          <h1>Tu cuenta es privada</h1>
          <p>Para ver tu saldo, movimientos y comprobantes, entrá una vez con el <b>link personal y el PIN</b> que te manda tu vendedor por WhatsApp. Después queda guardado en este dispositivo.</p>
          <p className="ayuda">¿No lo tenés? Pedíselo a tu vendedor de {EMPRESAS[cliente.empresa].nombre}.</p>
        </div>
      </main>
    </div>
  )

  const c = await cuentaDe(cliente.id)
  const pendientes = c.comprobantes.filter(x => x.estado === 'pendiente')
  const vencidos = pendientes.filter(x => x.vence && new Date(x.vence + 'T23:59:59') < new Date())

  return (
    <div data-empresa={cliente.empresa}>
      {header}
      <main className="wrap">
        <section className="hero"><div className="kicker">{cliente.nombre}</div><h1>Mi cuenta</h1></section>

        <div className="cuenta-res">
          <div className={`saldo ${c.saldo > 0.5 ? 'debe' : 'ok'}`}>
            <small>{c.saldo > 0.5 ? 'Saldo a pagar' : c.saldo < -0.5 ? 'Saldo a tu favor' : 'Tu cuenta'}</small>
            <strong>{Math.abs(c.saldo) > 0.5 ? pesos(Math.abs(c.saldo)) : 'Al día ✓'}</strong>
          </div>
          <div className="saldo-info">
            <div><b>{pendientes.length}</b> {pendientes.length === 1 ? 'comprobante pendiente' : 'comprobantes pendientes'}</div>
            {vencidos.length > 0 && <div className="venc">{vencidos.length} {vencidos.length === 1 ? 'vencido' : 'vencidos'}</div>}
          </div>
        </div>

        <section className="grupo">
          <div className="grupo-h"><h2>Comprobantes</h2><small>tocá uno para ver el detalle</small></div>
          {c.comprobantes.length === 0 && <div className="vacio">Todavía no hay compras registradas.</div>}
          {c.comprobantes.map(x => (
            <details key={x.id} className="cbte">
              <summary>
                <div>
                  <div className="fila-nom">{x.factura ?? `Compra ${x.numero}`}</div>
                  <div className="fila-sub">
                    <span>{dia(x.fecha)}</span>
                    {x.factura && <span>{x.numero}</span>}
                    {x.estado === 'pagado'
                      ? <span className="disp disp-ok">Pagado</span>
                      : <span className="disp disp-no">Debe {pesos(x.pendiente)}{x.vence ? ` · vence ${dia(x.vence)}` : ''}</span>}
                  </div>
                </div>
                <b className="cbte-total">{pesos(x.total)}</b>
              </summary>
              <div className="cbte-items">
                {x.items.map((i, k) => (
                  <div key={k} className="cbte-item"><span>{i.cantidad} × {i.nombre}</span><span>{pesos(i.subtotal || i.cantidad * i.precio)}</span></div>
                ))}
              </div>
            </details>
          ))}
        </section>

        <section className="grupo">
          <div className="grupo-h"><h2>Movimientos de cuenta corriente</h2><small>últimos {c.movimientos.length}</small></div>
          {c.movimientos.length === 0 && <div className="vacio">Sin movimientos de cuenta corriente.</div>}
          {c.movimientos.map(m => (
            <div key={m.id} className="mov">
              <div>
                <div className="fila-nom">{m.concepto}</div>
                <div className="fila-sub"><span>{dia(m.fecha)}</span><span>Saldo {pesos(m.saldo)}</span></div>
              </div>
              <b className={m.tipo === 'cobro' ? 'mov-pago' : ''}>{m.tipo === 'cobro' ? '−' : '+'} {pesos(m.monto)}</b>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
