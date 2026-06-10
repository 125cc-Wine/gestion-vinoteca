'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface DashData {
  alertas: { sinStock: {nombre:string;bodega:string}[]; stockBajo: {nombre:string;bodega:string;stock:number;stock_minimo:number}[]; vencidos: {id:string;numero:string;cliente_nombre:string;total:number;created_at:string}[]; pedidosPendientes: number }
  ventasHoy: { total: number; cantidad: number }
  ventasMes: { total: number; cantidad: number }
  caja: { ingresos: number; egresos: number; saldo: number }
  vendedores: { nombre: string; total: number; cantidad: number }[]
  cuentasCorrientes: { cantidad: number; total: number }
  topProductos: { nombre: string; cantidad: number; total: number }[]
}

export default function DashboardPage() {
  const [empresa, setEmpresa] = useState<string>('aroma')
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e)
    cargar(e)
    const interval = setInterval(() => cargar(e), 60000) // refresh cada 1 min
    return () => clearInterval(interval)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    const res = await fetch(`/api/dashboard?empresa=${emp}`)
    const d = await res.json()
    setData(d)
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Cargando dashboard...</div>
    </div>
  )

  if (!data) return null

  const totalAlertas = data.alertas.sinStock.length + data.alertas.stockBajo.length
  const cristian = data.vendedores.find(v => v.nombre === 'Cristian')
  const locales = data.vendedores.filter(v => v.nombre !== 'Cristian')

  return (
    <div className="space-y-6">
      {/* Alertas destacadas */}
      {totalAlertas > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <h2 className="font-medium text-amber-800">Alertas de stock ({totalAlertas})</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {data.alertas.sinStock.length > 0 && (
              <div>
                <div className="text-xs font-medium text-red-600 mb-2">Sin stock ({data.alertas.sinStock.length})</div>
                <div className="space-y-1">
                  {data.alertas.sinStock.map((p, i) => (
                    <div key={i} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-400 rounded-full inline-block"></span>
                      {p.nombre}{p.bodega ? ` · ${p.bodega}` : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.alertas.stockBajo.length > 0 && (
              <div>
                <div className="text-xs font-medium text-yellow-600 mb-2">Stock bajo ({data.alertas.stockBajo.length})</div>
                <div className="space-y-1">
                  {data.alertas.stockBajo.map((p, i) => (
                    <div key={i} className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"></span>
                      {p.nombre}{p.bodega ? ` · ${p.bodega}` : ''} — {p.stock} u.
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => router.push('/productos')} className="mt-3 text-xs text-amber-700 underline">Ver todos los productos →</button>
        </div>
      )}

      {/* Alertas de vencimiento */}
      {data.alertas.vencidos.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔴</span>
            <h2 className="font-medium text-red-800">Comprobantes vencidos +30 días sin pago ({data.alertas.vencidos.length})</h2>
          </div>
          <div className="space-y-1">
            {data.alertas.vencidos.map((v,i) => (
              <div key={i} className="text-xs bg-red-100 text-red-700 px-3 py-2 rounded-lg flex justify-between">
                <span><strong>{v.numero}</strong> — {v.cliente_nombre}</span>
                <span className="font-medium">${v.total.toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/ventas')} className="mt-3 text-xs text-red-700 underline">Ver en ventas →</button>
        </div>
      )}

      {data.alertas.pedidosPendientes > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>📦</span>
            <span className="text-sm text-blue-800">{data.alertas.pedidosPendientes} pedido{data.alertas.pedidosPendientes>1?'s':''} pendiente{data.alertas.pedidosPendientes>1?'s':''} de entrega</span>
          </div>
          <button onClick={() => router.push('/pedidos')} className="text-xs text-blue-700 underline">Ver pedidos →</button>
        </div>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <div className="text-xs text-gray-400 mb-1">Ventas hoy</div>
          <div className="text-2xl font-medium text-gray-800">${data.ventasHoy.total.toLocaleString('es-AR')}</div>
          <div className="text-xs text-gray-400 mt-1">{data.ventasHoy.cantidad} comprobantes</div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-400 mb-1">Ventas del mes</div>
          <div className="text-2xl font-medium text-gray-800">${data.ventasMes.total.toLocaleString('es-AR')}</div>
          <div className="text-xs text-gray-400 mt-1">{data.ventasMes.cantidad} comprobantes</div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-400 mb-1">Caja hoy</div>
          <div className={`text-2xl font-medium ${data.caja.saldo >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            ${data.caja.saldo.toLocaleString('es-AR')}
          </div>
          <div className="text-xs text-gray-400 mt-1">+${data.caja.ingresos.toLocaleString('es-AR')} / -${data.caja.egresos.toLocaleString('es-AR')}</div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-400 mb-1">Cuentas corrientes</div>
          <div className="text-2xl font-medium text-blue-600">${data.cuentasCorrientes.total.toLocaleString('es-AR')}</div>
          <div className="text-xs text-gray-400 mt-1">{data.cuentasCorrientes.cantidad} clientes con saldo</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Vendedores locales */}
        <div className="card col-span-1">
          <h3 className="text-sm font-medium text-gray-700 mb-3">📊 Vendedores — mes actual</h3>
          {locales.length === 0
            ? <div className="text-xs text-gray-400">Sin ventas registradas</div>
            : <div className="space-y-2">
              {locales.map((v, i) => {
                const max = locales[0]?.total || 1
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{v.nombre}</span>
                      <span className="text-gray-500">${v.total.toLocaleString('es-AR')} · {v.cantidad} ventas</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-gray-600 h-1.5 rounded-full" style={{ width: `${(v.total / max) * 100}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          }
        </div>

        {/* Cristian - vendedor de calle */}
        <div className="card col-span-1">
          <h3 className="text-sm font-medium text-gray-700 mb-3">🚗 Cristian — vendedor de calle</h3>
          {cristian ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-400 mb-1">Total mes</div>
                <div className="text-2xl font-medium text-gray-800">${cristian.total.toLocaleString('es-AR')}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Comprobantes</div>
                <div className="text-xl font-medium text-gray-700">{cristian.cantidad}</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400">Sin ventas este mes</div>
          )}
        </div>

        {/* Top productos */}
        <div className="card col-span-1">
          <h3 className="text-sm font-medium text-gray-700 mb-3">🍷 Top productos — mes</h3>
          {data.topProductos.length === 0
            ? <div className="text-xs text-gray-400">Sin datos</div>
            : <div className="space-y-2">
              {data.topProductos.map((p, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-4">{i + 1}.</span>
                    <span className="text-gray-700 truncate max-w-32">{p.nombre}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600 font-medium">${p.total.toLocaleString('es-AR')}</div>
                    <div className="text-gray-400">{p.cantidad} u.</div>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Nuevo presupuesto', icon: '📋', href: '/ventas' },
          { label: 'Nuevo remito', icon: '📦', href: '/ventas' },
          { label: 'Agregar producto', icon: '🍷', href: '/productos' },
          { label: 'Abrir caja', icon: '💰', href: '/caja' },
          { label: 'Ver clientes', icon: '👥', href: '/clientes' },
        ].map(a => (
          <button key={a.href + a.label} onClick={() => router.push(a.href)}
            className="card text-center cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="text-2xl mb-1">{a.icon}</div>
            <div className="text-xs text-gray-600">{a.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
