'use client'
import { useEffect, useState, useRef } from 'react'
import type { Producto, Cliente, Venta, VentaItem } from '@/types'

const EMPRESAS_DATA = {
  aroma: {
    nombre: 'Aroma de Vid',
    cuit: '20-26600984-5',
    domicilio: 'Roca 2787, Mar del Plata',
    telefono: '(0223) 491-1705',
    logoPath: '/logos/aroma.jpg',
  },
  lavid: {
    nombre: 'MDP La Vid Consultora S.R.L.',
    cuit: '30-71762144-8',
    domicilio: 'Roca 2787, Mar del Plata',
    telefono: '(0223) 685-0870',
    logoPath: '/logos/lavid.png',
  },
}

interface ItemForm extends VentaItem {
  producto_id: string
  descuento: number
}

const ITEM_EMPTY: ItemForm = { producto_id: '', nombre: '', cantidad: 1, precio_unitario: 0, descuento: 0, subtotal: 0 }

export default function VentasPage() {
  const [empresa, setEmpresa] = useState<'aroma' | 'lavid'>('aroma')
  const [ventas, setVentas] = useState<Venta[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [tipo, setTipo] = useState<'presupuesto' | 'remito'>('presupuesto')
  const [clienteId, setClienteId] = useState('')
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final')
  const [clienteData, setClienteData] = useState<Cliente | null>(null)
  const [items, setItems] = useState<ItemForm[]>([{ ...ITEM_EMPTY }])
  const [descuentoGlobal, setDescuentoGlobal] = useState(0)
  const [notas, setNotas] = useState('')
  const [condVenta, setCondVenta] = useState('Contado')
  const [ventaParaImprimir, setVentaParaImprimir] = useState<Venta | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const e = (localStorage.getItem('empresa') || 'aroma') as 'aroma' | 'lavid'
    setEmpresa(e)
    cargarTodo(e)
  }, [])

  async function cargarTodo(emp: string) {
    setLoading(true)
    const [vRes, pRes, cRes] = await Promise.all([
      fetch(`/api/ventas?empresa=${emp}`),
      fetch(`/api/productos?empresa=${emp}`),
      fetch(`/api/clientes?empresa=${emp}`),
    ])
    setVentas(await vRes.json().catch(() => []))
    setProductos(await pRes.json().catch(() => []))
    setClientes(await cRes.json().catch(() => []))
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function calcSubtotal(item: ItemForm) {
    const base = item.cantidad * item.precio_unitario
    return base - (base * ((item.descuento || 0) / 100))
  }

  function calcTotal() {
    const sub = items.reduce((a, i) => a + calcSubtotal(i), 0)
    return sub - (sub * (descuentoGlobal / 100))
  }

  function seleccionarProducto(idx: number, prodId: string) {
    const prod = productos.find(p => p.id === prodId)
    if (!prod) return
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], producto_id: prod.id!, nombre: `${prod.nombre}${prod.bodega ? ' - ' + prod.bodega : ''}`, precio_unitario: prod.precio_venta, subtotal: 0 }
    newItems[idx].subtotal = calcSubtotal(newItems[idx])
    setItems(newItems)
  }

  function updateItem(idx: number, field: string, value: number | string) {
    const newItems = [...items]
    ;(newItems[idx] as Record<string, number | string>)[field] = value
    newItems[idx].subtotal = calcSubtotal(newItems[idx])
    setItems(newItems)
  }

  function seleccionarCliente(id: string) {
    setClienteId(id)
    if (!id) { setClienteNombre('Consumidor Final'); setClienteData(null); return }
    const c = clientes.find(c => c.id === id)
    if (c) { setClienteNombre(c.razon_social || `${c.nombre} ${c.apellido || ''}`.trim()); setClienteData(c) }
  }

  async function guardar() {
    if (items.every(i => !i.nombre)) { showToast('Agregá al menos un producto'); return }
    const subtotal = items.reduce((a, i) => a + calcSubtotal(i), 0)
    const total = calcTotal()
    const venta = {
      empresa, tipo,
      cliente_id: clienteId || null,
      cliente_nombre: clienteNombre,
      items: items.filter(i => i.nombre).map(i => ({ producto_id: i.producto_id || null, nombre: i.nombre, cantidad: i.cantidad, precio_unitario: i.precio_unitario, descuento: i.descuento, subtotal: calcSubtotal(i) })),
      subtotal, descuento: descuentoGlobal, total,
      estado: 'emitido', notas,
      condicion_venta: condVenta,
      descontarStock: tipo === 'remito',
    }
    const res = await fetch('/api/ventas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(venta) })
    const data = await res.json()
    if (data.error) { showToast('Error: ' + data.error); return }
    setModal(false)
    await cargarTodo(empresa)
    showToast(`${tipo === 'presupuesto' ? 'Presupuesto' : 'Remito'} ${data.numero} generado`)
    setTimeout(() => { setVentaParaImprimir(data); setTimeout(() => imprimirDoc(), 400) }, 200)
  }

  function imprimirDoc() {
    const el = document.getElementById('print-area')
    if (!el) return
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    w.document.write(`<html><head><title>Comprobante</title><style>body{font-family:Arial,sans-serif;font-size:11px;margin:24px}table{width:100%;border-collapse:collapse}th,td{padding:5px 8px}@media print{body{margin:12px}}</style></head><body>${el.innerHTML}</body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); }, 500)
  }

  function imprimirVenta(v: Venta) {
    setVentaParaImprimir(v)
    setTimeout(() => imprimirDoc(), 400)
  }

  function abrirNuevo(t: 'presupuesto' | 'remito') {
    setTipo(t); setClienteId(''); setClienteNombre('Consumidor Final'); setClienteData(null)
    setItems([{ ...ITEM_EMPTY }]); setDescuentoGlobal(0); setNotas(''); setCondVenta('Contado')
    setModal(true)
  }

  const emp = EMPRESAS_DATA[empresa]
  const totalRemitos = ventas.filter(v => v.tipo === 'remito' && v.estado !== 'cancelado').reduce((a, v) => a + v.total, 0)

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card"><div className="text-xs text-gray-400 mb-1">Total comprobantes</div><div className="text-2xl font-medium text-gray-800">{ventas.length}</div></div>
        <div className="card"><div className="text-xs text-gray-400 mb-1">Presupuestos</div><div className="text-2xl font-medium text-gray-800">{ventas.filter(v => v.tipo === 'presupuesto').length}</div></div>
        <div className="card"><div className="text-xs text-gray-400 mb-1">Total remitos</div><div className="text-2xl font-medium text-green-600">${totalRemitos.toLocaleString('es-AR')}</div></div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium text-gray-800">Ventas y comprobantes</h1>
        <div className="flex gap-2">
          <button onClick={() => abrirNuevo('presupuesto')} className="btn btn-primary">+ Presupuesto</button>
          <button onClick={() => abrirNuevo('remito')} className="btn btn-primary">+ Remito</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">
            {['Número','Tipo','Cliente','Fecha','Productos','Total',''].map(h=>(
              <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">Cargando...</td></tr>
            : ventas.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">No hay comprobantes todavía</td></tr>
            : ventas.map(v => (
              <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{v.numero}</td>
                <td className="px-4 py-3"><span className={`badge ${v.tipo==='presupuesto'?'badge-blue':'badge-green'}`}>{v.tipo==='presupuesto'?'Presupuesto':'Remito'}</span></td>
                <td className="px-4 py-3 text-gray-600">{v.cliente_nombre}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(v.created_at!).toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-3 text-gray-500">{(v.items as VentaItem[]).length} items</td>
                <td className="px-4 py-3 font-medium">${v.total.toLocaleString('es-AR')}</td>
                <td className="px-4 py-3"><button onClick={() => imprimirVenta(v)} className="btn btn-primary text-xs py-1 px-2">🖨️ Imprimir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-3xl my-4">
            <h2 className="text-base font-medium text-gray-800 mb-4">
              Nuevo {tipo==='presupuesto'?'presupuesto':'remito'}
              {tipo==='remito'&&<span className="ml-2 text-xs text-green-600 font-normal">· descuenta stock automáticamente</span>}
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div><label className="label">Cliente</label>
                <select className="input" value={clienteId} onChange={e=>seleccionarCliente(e.target.value)}>
                  <option value="">Consumidor Final</option>
                  {clientes.map(c=><option key={c.id} value={c.id}>{c.razon_social||`${c.nombre} ${c.apellido||''}`.trim()}</option>)}
                </select>
              </div>
              <div><label className="label">Condición de venta</label>
                <select className="input" value={condVenta} onChange={e=>setCondVenta(e.target.value)}>
                  <option>Contado</option><option>Cta. Cte.</option><option>Transferencia</option><option>Cheque</option>
                </select>
              </div>
            </div>
            {clienteData&&<div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs text-gray-500">CUIT: {clienteData.cuit||'—'} · {clienteData.direccion||'—'} · {clienteData.telefono||'—'}</div>}

            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <label className="label mb-0">Productos</label>
                <button onClick={()=>setItems([...items,{...ITEM_EMPTY}])} className="text-xs text-blue-600 hover:underline">+ agregar línea</button>
              </div>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead><tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-2 text-gray-400 w-2/5">Producto</th>
                    <th className="text-center px-2 py-2 text-gray-400 w-14">Cant.</th>
                    <th className="text-right px-2 py-2 text-gray-400">P.Unit.</th>
                    <th className="text-center px-2 py-2 text-gray-400 w-14">Dto%</th>
                    <th className="text-right px-2 py-2 text-gray-400">Total</th>
                    <th className="w-6"></th>
                  </tr></thead>
                  <tbody>
                    {items.map((item,idx)=>(
                      <tr key={idx} className="border-b border-gray-50">
                        <td className="px-2 py-1">
                          <select className="input text-xs py-1" value={item.producto_id} onChange={e=>seleccionarProducto(idx,e.target.value)}>
                            <option value="">— Seleccionar —</option>
                            {productos.map(p=><option key={p.id} value={p.id}>{p.nombre}{p.bodega?` · ${p.bodega}`:''} (Stock:{p.stock})</option>)}
                          </select>
                        </td>
                        <td className="px-1 py-1"><input type="number" min="1" className="input text-xs py-1 text-center" value={item.cantidad} onChange={e=>updateItem(idx,'cantidad',parseInt(e.target.value)||1)}/></td>
                        <td className="px-1 py-1"><input type="number" min="0" className="input text-xs py-1 text-right" value={item.precio_unitario} onChange={e=>updateItem(idx,'precio_unitario',parseFloat(e.target.value)||0)}/></td>
                        <td className="px-1 py-1"><input type="number" min="0" max="100" className="input text-xs py-1 text-center" value={item.descuento} onChange={e=>updateItem(idx,'descuento',parseFloat(e.target.value)||0)}/></td>
                        <td className="px-2 py-1 text-right font-medium">${calcSubtotal(item).toLocaleString('es-AR')}</td>
                        <td className="px-1 py-1">{items.length>1&&<button onClick={()=>setItems(items.filter((_,i)=>i!==idx))} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="flex-1"><label className="label">Notas</label><textarea className="input h-16 resize-none text-xs" value={notas} onChange={e=>setNotas(e.target.value)} placeholder="Observaciones..."/></div>
              <div className="w-48">
                <label className="label">Descuento global (%)</label>
                <input type="number" min="0" max="100" className="input" value={descuentoGlobal} onChange={e=>setDescuentoGlobal(parseFloat(e.target.value)||0)}/>
                <div className="mt-3 text-right">
                  <div className="text-xs text-gray-400">Subtotal: ${items.reduce((a,i)=>a+calcSubtotal(i),0).toLocaleString('es-AR')}</div>
                  {descuentoGlobal>0&&<div className="text-xs text-red-400">Dto: -{descuentoGlobal}%</div>}
                  <div className="text-base font-medium text-gray-800 mt-1">TOTAL: ${calcTotal().toLocaleString('es-AR')}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={()=>setModal(false)} className="btn btn-primary">Cancelar</button>
              <button onClick={guardar} className="px-5 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700">
                Generar {tipo==='presupuesto'?'presupuesto':'remito'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Área de impresión oculta */}
      <div id="print-area" style={{display:'none'}}>
        {ventaParaImprimir && <PrintDoc venta={ventaParaImprimir} empresa={emp} />}
      </div>

      {toast&&<div className="fixed bottom-6 right-6 bg-gray-800 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50">{toast}</div>}
    </div>
  )
}

function PrintDoc({ venta, empresa }: { venta: Venta; empresa: { nombre: string; cuit: string; domicilio: string; telefono: string; logoPath: string } }) {
  const items = venta.items as (VentaItem & { descuento?: number })[]
  const fecha = new Date(venta.created_at!).toLocaleDateString('es-AR')
  const condVenta = (venta as Record<string,unknown>).condicion_venta as string || 'Contado'

  return (
    <div style={{fontFamily:'Arial,sans-serif',fontSize:'11px',color:'#000',maxWidth:'800px',margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px',paddingBottom:'12px',borderBottom:'1px solid #ccc'}}>
        <img src={empresa.logoPath} alt={empresa.nombre} style={{height:'60px',objectFit:'contain'}}/>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:'16px',fontWeight:'bold',marginBottom:'4px'}}>NOTA PEDIDO</div>
          <div style={{fontWeight:'bold'}}>{venta.numero}</div>
        </div>
      </div>
      <div style={{marginBottom:'12px'}}>
        <div style={{fontWeight:'bold',fontSize:'13px',marginBottom:'6px'}}>{empresa.nombre}</div>
        <table style={{width:'100%',fontSize:'11px',borderCollapse:'collapse'}}>
          <tbody>
            <tr>
              <td style={{paddingRight:'16px',paddingBottom:'3px'}}><strong>Responsable Inscripto</strong>&nbsp;&nbsp;<strong>C.U.I.T.</strong> {empresa.cuit}</td>
              <td style={{textAlign:'right'}}><strong>Fecha Movimiento</strong>&nbsp;&nbsp;{fecha}</td>
            </tr>
            <tr>
              <td style={{paddingBottom:'3px'}}><strong>Domicilio</strong>&nbsp;&nbsp;{empresa.domicilio}</td>
              <td style={{textAlign:'right'}}><strong>Fecha Vencimiento</strong>&nbsp;&nbsp;{fecha}</td>
            </tr>
            <tr><td><strong>Teléfono</strong>&nbsp;&nbsp;{empresa.telefono}</td><td></td></tr>
          </tbody>
        </table>
      </div>
      <hr style={{borderColor:'#ccc',marginBottom:'12px'}}/>
      <div style={{marginBottom:'12px'}}>
        <div><strong>Razón Social:</strong>&nbsp;&nbsp;{venta.cliente_nombre}</div>
        <div style={{marginTop:'4px'}}><strong>Cond. Fiscal:</strong> Responsable Inscripto&nbsp;&nbsp;&nbsp;&nbsp;<strong>C. Venta:</strong> {condVenta}</div>
      </div>
      <hr style={{borderColor:'#ccc',marginBottom:'12px'}}/>
      <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'24px',fontSize:'11px'}}>
        <thead>
          <tr style={{borderBottom:'1px solid #000',borderTop:'1px solid #000'}}>
            <th style={{padding:'6px 8px',textAlign:'center',width:'60px'}}>Cant.</th>
            <th style={{padding:'6px 8px',textAlign:'left'}}>Descripción</th>
            <th style={{padding:'6px 8px',textAlign:'center',width:'60px'}}>Des(%)</th>
            <th style={{padding:'6px 8px',textAlign:'right',width:'110px'}}>P.UFin</th>
            <th style={{padding:'6px 8px',textAlign:'right',width:'110px'}}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item,i)=>(
            <tr key={i} style={{borderBottom:'0.5px solid #eee'}}>
              <td style={{padding:'5px 8px',textAlign:'center'}}>{item.cantidad.toFixed(3)}</td>
              <td style={{padding:'5px 8px'}}>{item.nombre}</td>
              <td style={{padding:'5px 8px',textAlign:'center'}}>{item.descuento||0}</td>
              <td style={{padding:'5px 8px',textAlign:'right'}}>{item.precio_unitario.toLocaleString('es-AR',{minimumFractionDigits:2})}</td>
              <td style={{padding:'5px 8px',textAlign:'right'}}>{item.subtotal.toLocaleString('es-AR',{minimumFractionDigits:2})}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{marginTop:'40px',borderTop:'1px solid #ccc',paddingTop:'8px'}}>
        <table style={{width:'100%',fontSize:'11px',borderCollapse:'collapse'}}>
          <tbody>
            <tr>
              <td style={{width:'35%'}}></td>
              <td style={{textAlign:'center',width:'13%'}}><strong>Des(%)</strong></td>
              <td style={{textAlign:'center',width:'13%'}}><strong>Imp. Int.</strong></td>
              <td style={{textAlign:'center',width:'13%'}}><strong>Otros Con.</strong></td>
              <td style={{textAlign:'center',width:'13%'}}><strong>Per. IIBB</strong></td>
              <td style={{textAlign:'right',width:'13%'}}><strong>TOTAL</strong></td>
            </tr>
            <tr>
              <td><strong>Usuario:</strong> {empresa.nombre}</td>
              <td style={{textAlign:'center'}}>{venta.descuento>0?`${venta.descuento}%`:'-'}</td>
              <td style={{textAlign:'center'}}>-</td>
              <td style={{textAlign:'center'}}>-</td>
              <td style={{textAlign:'center'}}>-</td>
              <td style={{textAlign:'right',fontWeight:'bold'}}>{venta.total.toLocaleString('es-AR',{minimumFractionDigits:2})}</td>
            </tr>
            <tr><td colSpan={6} style={{paddingTop:'8px'}}><strong>Peso (kg):</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>C.A.E.</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Vto. C.A.E.</strong></td></tr>
          </tbody>
        </table>
      </div>
      {venta.notas&&<div style={{marginTop:'12px',fontSize:'10px',color:'#666'}}><strong>Notas:</strong> {venta.notas}</div>}
    </div>
  )
}
