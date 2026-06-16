'use client'
import { useEffect, useRef, useState } from 'react'
import type { Producto } from '@/types'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#0F0F0F',
  surface:     '#141414',
  card:        '#1A1A1A',
  border:      '#2A2A2A',
  accent:      '#8B1A2A',
  text:        '#E8E8E8',
  muted:       '#888888',
  dim:         '#555555',
  selBg:       'rgba(139,26,42,0.13)',
  selBorder:   '#8B1A2A',
  dangerBg:    '#3A1010',
  dangerBorder:'#8B2020',
  green:       '#4CAF7D',
  amber:       '#D4820A',
  red:         '#E05555',
}

const CATS = ['Tinto','Blanco','Rosado','Espumante','Otro'] as const

const KB = [
  ['E / Enter',  'Editar fila activa'],
  ['↑ / ↓',      'Navegar filas'],
  ['Space',      'Seleccionar fila'],
  ['Ctrl+A',     'Seleccionar todos'],
  ['Ctrl+F',     'Ir al buscador'],
  ['Ctrl+N',     'Nuevo producto'],
  ['Shift+Click','Seleccionar rango'],
  ['Ctrl+Click', 'Suma/resta selección'],
  ['Delete',     'Eliminar seleccionados'],
  ['Escape',     'Cerrar / Deseleccionar'],
  ['?',          'Mostrar atajos'],
]

const EMPTY_EDIT = {
  nombre: '', bodega: '', varietal: '',
  categoria: 'Tinto' as Producto['categoria'],
  region: '', sku: '',
  precio_venta: 0, precio_mayorista: 0, precio_costo: 0,
  stock: 0, stock_minimo: 3,
  unidad_medida: 'botella' as 'botella' | 'caja6' | 'caja12',
  woo_product_id: undefined as number | undefined,
}

interface WooPreview {
  woo_product_id: number; nombre: string; sku: string
  bodega: string; varietal: string; region: string
  categoria: string; precio_venta: number; stock: number; ya_importado: boolean
}

// ─── Tiny style helpers ───────────────────────────────────────────────────────
const INP: React.CSSProperties = {
  background: '#111', border: `1px solid ${C.border}`, borderRadius: 6,
  color: C.text, padding: '5px 8px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
}
function btn(v: 'default'|'accent'|'ghost'|'danger' = 'default', ex: React.CSSProperties = {}): React.CSSProperties {
  const bases = {
    default: { background: '#222', border: `1px solid ${C.border}` },
    accent:  { background: C.accent, border: `1px solid ${C.accent}` },
    ghost:   { background: 'transparent', border: '1px solid transparent' },
    danger:  { background: C.dangerBg, border: `1px solid ${C.dangerBorder}` },
  }
  return { ...bases[v], color: C.text, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', ...ex }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProductosPage() {
  // Data
  const [empresa, setEmpresa]       = useState('aroma')
  const [productos, setProductos]   = useState<Producto[]>([])
  const [bodegas, setBodegas]       = useState<{id:string;nombre:string}[]>([])
  const [loading, setLoading]       = useState(true)

  // Filters
  const [busqueda, setBusqueda]             = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroBodega, setFiltroBodega]     = useState('')
  const [filtroSinPrecio, setFiltroSinPrecio] = useState(false)

  // Selection
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [activeRow, setActiveRow]         = useState<string|null>(null)
  const lastClickedIdx = useRef(-1)

  // Drag-to-select
  const isDragging     = useRef(false)
  const dragAnchorIdx  = useRef(-1)
  const dragInitSel    = useRef<Set<string>>(new Set())

  // Inline editor
  const [editingId, setEditingId] = useState<string|null>(null)
  const [editForm, setEditForm]   = useState<typeof EMPTY_EDIT>({ ...EMPTY_EDIT })
  const editFirstRef              = useRef<HTMLInputElement>(null)

  // UI state
  const [showKb, setShowKb]         = useState(false)
  const [activeBulk, setActiveBulk] = useState<string|null>(null)
  const [bulkVal, setBulkVal]       = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [toast, setToast]           = useState('')
  const [saving, setSaving]         = useState(false)
  const [syncing, setSyncing]       = useState(false)

  // New-product modal
  const [newModal, setNewModal] = useState(false)
  const [newForm, setNewForm]   = useState<typeof EMPTY_EDIT & {empresa:string}>({ ...EMPTY_EDIT, empresa: 'aroma' })

  // Full edit modal
  const [fullEditId, setFullEditId] = useState<string|null>(null)
  const [fullForm, setFullForm]     = useState<typeof EMPTY_EDIT & {empresa:string}>({ ...EMPTY_EDIT, empresa: 'aroma' })

  // Lista de precios modal
  interface ListaItem { id: string; nombre: string; bodega: string; varietal: string; categoria: string; precio_venta: number; precio_mayorista: number }
  const [listaModal, setListaModal] = useState(false)
  const [listaItems, setListaItems] = useState<ListaItem[]>([])
  const [listaQuery, setListaQuery] = useState('')
  const [listaSugsOpen, setListaSugsOpen] = useState(false)

  // WooCommerce import modal
  const [importModal, setImportModal]       = useState(false)
  const [importLoading, setImportLoading]   = useState(false)
  const [wooList, setWooList]               = useState<WooPreview[]>([])
  const [wooSel, setWooSel]                 = useState<Set<number>>(new Set())
  const [soloNuevos, setSoloNuevos]         = useState(true)
  const [importando, setImportando]         = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)

  // ── Computed (declared before effects so closures capture them) ───────────
  const filtrados = productos.filter(p => {
    const q = busqueda.toLowerCase()
    if (q && !`${p.nombre}${p.bodega}${p.varietal}`.toLowerCase().includes(q)) return false
    if (filtroCategoria && p.categoria !== filtroCategoria) return false
    if (filtroBodega && p.bodega !== filtroBodega) return false
    if (filtroSinPrecio && (p.precio_venta || 0) > 0) return false
    return true
  })
  const allCheck      = filtrados.length > 0 && filtrados.every(p => seleccionados.has(p.id!))
  const someCheck     = filtrados.some(p => seleccionados.has(p.id!))
  const totalStock    = productos.reduce((a, p) => a + p.stock, 0)
  const conStock      = productos.filter(p => p.stock > 0).length
  const sinPrecio     = productos.filter(p => !p.precio_venta).length
  const valorStock    = productos.reduce((a, p) => a + p.stock * (p.precio_venta || 0), 0)
  const bodegasUnicas = Array.from(new Set(productos.map(p => p.bodega).filter(Boolean))).sort()

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const e = localStorage.getItem('empresa') || 'aroma'
    setEmpresa(e)
    cargar(e)
  }, [])

  async function cargar(emp: string) {
    setLoading(true)
    const [pRes, bRes] = await Promise.all([
      fetch(`/api/productos?empresa=${emp}`),
      fetch('/api/bodegas'),
    ])
    setProductos(await pRes.json().catch(() => []))
    setBodegas(await bRes.json().catch(() => []))
    setLoading(false)
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      const inInput = tag === 'input' || tag === 'select' || tag === 'textarea'

      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); searchRef.current?.focus(); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !inInput) { e.preventDefault(); setSeleccionados(new Set(filtrados.map(p => p.id!))); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !inInput) { e.preventDefault(); openNew(); return }
      if (e.key === '?' && !inInput) { setShowKb(v => !v); return }
      if (inInput) return

      if (e.key === 'Escape') {
        if (editingId) { setEditingId(null); return }
        if (showKb) { setShowKb(false); return }
        if (activeBulk) { setActiveBulk(null); return }
        setSeleccionados(new Set()); return
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const i = filtrados.findIndex(p => p.id === activeRow)
        const ni = e.key === 'ArrowDown' ? Math.min(i + 1, filtrados.length - 1) : Math.max(i - 1, 0)
        if (filtrados[ni]) setActiveRow(filtrados[ni].id!)
        return
      }
      if (e.key === ' ' && activeRow) { e.preventDefault(); toggleSel(activeRow); return }
      if ((e.key === 'Enter' || e.key.toLowerCase() === 'e') && activeRow && !editingId) {
        const p = filtrados.find(q => q.id === activeRow); if (p) openEdit(p); return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && seleccionados.size > 0) {
        e.preventDefault(); eliminarSel(); return
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrados, activeRow, editingId, seleccionados, showKb, activeBulk])

  // Drag mouseup
  useEffect(() => {
    const up = () => { isDragging.current = false }
    document.addEventListener('mouseup', up)
    return () => document.removeEventListener('mouseup', up)
  }, [])

  // Focus first field on edit open
  useEffect(() => { if (editingId) setTimeout(() => editFirstRef.current?.focus(), 40) }, [editingId])

  // ── Helpers ───────────────────────────────────────────────────────────────
  function toast_(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500) }
  function toggleSel(id: string) {
    setSeleccionados(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function openEdit(p: Producto) {
    setEditingId(p.id!)
    setEditForm({ nombre: p.nombre, bodega: p.bodega, varietal: p.varietal, categoria: p.categoria,
      region: p.region||'', sku: p.sku||'',
      precio_venta: p.precio_venta||0, precio_mayorista: p.precio_mayorista||0,
      precio_costo: p.precio_costo||0, stock: p.stock, stock_minimo: p.stock_minimo,
      unidad_medida: (p.unidad_medida || 'botella') as 'botella'|'caja6'|'caja12',
      woo_product_id: p.woo_product_id })
    setActiveRow(p.id!)
  }

  function openNew() {
    setNewForm({ ...EMPTY_EDIT, empresa })
    setNewModal(true)
  }

  function openFullEdit(p: Producto) {
    setFullForm({
      nombre: p.nombre, bodega: p.bodega, varietal: p.varietal, categoria: p.categoria,
      region: p.region||'', sku: p.sku||'',
      precio_venta: p.precio_venta||0, precio_mayorista: p.precio_mayorista||0,
      precio_costo: p.precio_costo||0, stock: p.stock, stock_minimo: p.stock_minimo,
      unidad_medida: (p.unidad_medida||'botella') as 'botella'|'caja6'|'caja12',
      woo_product_id: p.woo_product_id,
      empresa: p.empresa,
    })
    setFullEditId(p.id!)
  }

  async function saveFullEdit() {
    if (!fullEditId) return
    setSaving(true)
    const res = await fetch('/api/productos', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:fullEditId, ...fullForm }) })
    const d = await res.json(); setSaving(false)
    if (d.error) { toast_('Error: '+d.error); return }
    setFullEditId(null); cargar(empresa); toast_('Guardado')
  }

  function abrirListaModal() {
    setListaItems([]); setListaQuery(''); setListaSugsOpen(false); setListaModal(true)
  }

  function listaAgregarProducto(p: Producto) {
    if (listaItems.find(i => i.id === p.id)) return
    setListaItems(prev => [...prev, {
      id: p.id!, nombre: p.nombre, bodega: p.bodega || '', varietal: p.varietal || '',
      categoria: p.categoria || '', precio_venta: p.precio_venta, precio_mayorista: p.precio_mayorista || 0,
    }])
    setListaQuery(''); setListaSugsOpen(false)
  }

  function imprimirLista() {
    const empNombre = empresa === 'aroma' ? 'Aroma de Vid' : 'La Vid Consultora'
    const fecha = new Date().toLocaleDateString('es-AR')
    const rows = listaItems.map(p => `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:7px 10px;font-size:12px;font-weight:500">${p.nombre}</td>
        <td style="padding:7px 10px;font-size:11px;color:#666">${p.bodega}</td>
        <td style="padding:7px 10px;font-size:11px;color:#666">${p.varietal}</td>
        <td style="padding:7px 10px;font-size:12px;text-align:right;font-weight:700">$${p.precio_venta.toLocaleString('es-AR')}</td>
        <td style="padding:7px 10px;font-size:11px;text-align:right;color:#888">${p.precio_mayorista ? '$' + p.precio_mayorista.toLocaleString('es-AR') : '—'}</td>
      </tr>`).join('')
    const html = `<html><head><title>Lista de Precios — ${empNombre}</title>
      <style>body{font-family:Arial,sans-serif;margin:28px;color:#222}table{width:100%;border-collapse:collapse}@media print{body{margin:14px}}</style>
      </head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #222;padding-bottom:12px;margin-bottom:18px">
        <div><div style="font-size:22px;font-weight:700">${empNombre}</div><div style="font-size:13px;color:#555;margin-top:3px">Lista de precios</div></div>
        <div style="text-align:right;font-size:11px;color:#777"><div>${fecha}</div><div style="margin-top:2px">${listaItems.length} productos</div></div>
      </div>
      <table>
        <thead><tr style="border-bottom:2px solid #222">
          <th style="padding:7px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em">Producto</th>
          <th style="padding:7px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em">Bodega</th>
          <th style="padding:7px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em">Varietal</th>
          <th style="padding:7px 10px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.04em">Precio</th>
          <th style="padding:7px 10px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.04em">Mayorista</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:24px;font-size:10px;color:#bbb;text-align:center">Precios en pesos argentinos · Válidos a la fecha de emisión</div>
      </body></html>`
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 500)
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    const res = await fetch('/api/productos', { method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ id: editingId, ...editForm }) })
    const d = await res.json(); setSaving(false)
    if (d.error) { toast_('Error: ' + d.error); return }
    setEditingId(null); cargar(empresa); toast_('Guardado')
  }

  async function saveNew() {
    if (!newForm.nombre.trim()) { toast_('El nombre es obligatorio'); return }
    setSaving(true)
    const { empresa: emp, ...rest } = newForm
    const res = await fetch('/api/productos', { method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ ...rest, empresa: emp, activo: true }) })
    const d = await res.json(); setSaving(false)
    if (d.error) { toast_('Error: ' + d.error); return }
    setNewModal(false); cargar(empresa); toast_('Producto creado')
  }

  async function eliminarUno(id: string) {
    if (!confirm('¿Eliminar este producto en ambas empresas?')) return
    await fetch(`/api/productos?id=${id}`, { method: 'DELETE' })
    cargar(empresa); toast_('Eliminado')
  }

  async function eliminarSel() {
    if (!confirm(`¿Eliminar ${seleccionados.size} producto${seleccionados.size!==1?'s':''} en ambas empresas?`)) return
    await bulkRequest('eliminar', '')
  }

  async function bulkRequest(accion: string, valor: string|number) {
    setBulkLoading(true)
    const res = await fetch('/api/productos/bulk', { method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ ids: Array.from(seleccionados), accion, valor }) })
    const d = await res.json(); setBulkLoading(false)
    if (d.error) { toast_('Error: ' + d.error); return }
    setActiveBulk(null); setBulkVal(''); setSeleccionados(new Set())
    cargar(empresa); toast_(`${d.afectados} productos actualizados en ambas empresas`)
  }

  async function calcularCostos() {
    if (!confirm('¿Calcular precio costo al 50% del precio lista para todos los productos sin costo? Esto no sobreescribe los que ya tienen costo cargado.')) return
    const res = await fetch('/api/productos/calcular-costos', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ empresa }) })
    const d = await res.json()
    if (d.error) { toast_('Error: ' + d.error); return }
    cargar(empresa); toast_(`${d.actualizados} productos actualizados`)
  }

  async function syncWoo() {
    setSyncing(true)
    const res = await fetch('/api/woo/sync', { method: 'POST' })
    const d = await res.json(); setSyncing(false)
    toast_(`Sync: ${d.ok} ok, ${d.errors} errores`)
  }

  async function openWooImport() {
    setImportModal(true); setImportLoading(true); setWooList([]); setWooSel(new Set())
    try {
      const res = await fetch('/api/woo/sync')
      const text = await res.text()
      let data: {error?:string; productos?:WooPreview[]}
      try { data = JSON.parse(text) } catch { data = { error: `Error ${res.status}` } }
      if (!res.ok || data.error) { toast_('Error: ' + (data.error ?? `HTTP ${res.status}`)); setImportModal(false); return }
      const lista = data.productos || []
      setWooList(lista)
      setWooSel(new Set(lista.filter(p => !p.ya_importado).map(p => p.woo_product_id)))
    } catch { toast_('Error de red'); setImportModal(false) }
    setImportLoading(false)
  }

  async function importarWoo() {
    const aImportar = wooList.filter(p => wooSel.has(p.woo_product_id) && !p.ya_importado)
    if (!aImportar.length) { toast_('Nada seleccionado'); return }
    setImportando(true)
    const res = await fetch('/api/woo/import', { method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ productos: aImportar }) })
    const d = await res.json(); setImportando(false)
    if (d.error) { toast_('Error: ' + d.error); return }
    setImportModal(false); cargar(empresa)
    toast_(`${d.imported} productos importados`)
  }

  // ── Drag-to-select ────────────────────────────────────────────────────────
  function onRowMouseDown(e: React.MouseEvent, idx: number, id: string) {
    if (e.button !== 0) return
    const t = e.target as HTMLElement
    if (t.tagName === 'INPUT' || t.tagName === 'BUTTON' || t.closest('button')) return
    e.preventDefault()
    isDragging.current = true; dragAnchorIdx.current = idx

    if (e.ctrlKey || e.metaKey) {
      dragInitSel.current = new Set(seleccionados)
      toggleSel(id)
    } else if (e.shiftKey && lastClickedIdx.current >= 0) {
      dragInitSel.current = new Set()
      const [a, b] = [Math.min(lastClickedIdx.current, idx), Math.max(lastClickedIdx.current, idx)]
      setSeleccionados(new Set(filtrados.slice(a, b + 1).map(p => p.id!)))
    } else {
      dragInitSel.current = new Set([id])
      setSeleccionados(new Set([id]))
      lastClickedIdx.current = idx
    }
    setActiveRow(id)
  }

  function onRowMouseEnter(idx: number) {
    if (!isDragging.current || dragAnchorIdx.current < 0) return
    const [a, b] = [Math.min(dragAnchorIdx.current, idx), Math.max(dragAnchorIdx.current, idx)]
    setSeleccionados(new Set([...Array.from(dragInitSel.current), ...filtrados.slice(a, b + 1).map(p => p.id!)]))
  }

  // ── Bulk popover config ───────────────────────────────────────────────────
  const BULK_ACTIONS = [
    { key: 'bodega',         label: 'Bodega',     kind: 'select' as const },
    { key: 'varietal',       label: 'Varietal',   kind: 'text'   as const },
    { key: 'aumento_precio', label: '+ %',        kind: 'number' as const, placeholder: 'Ej: 10' },
    { key: 'precio_fijo',    label: 'Precio $',   kind: 'number' as const, placeholder: 'Ej: 15000' },
  ]

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'Inter, system-ui, -apple-system, sans-serif', padding: '0 0 48px' }}>
      <style>{`
        .pr:hover { background: rgba(255,255,255,0.025) !important; }
        .pr.sel  { background: ${C.selBg} !important; }
        .pr.sel td:first-child { border-left: 2px solid ${C.selBorder}; }
        .pr      td:first-child { border-left: 2px solid transparent; }
        .pr.act  { outline: 1px solid #3A3A3A; outline-offset: -1px; }
        .dark-inp:focus { border-color: #555 !important; box-shadow: 0 0 0 2px rgba(139,26,42,0.2); }
        .dark-inp::placeholder { color: ${C.dim}; }
        .lista-sug:hover { background: rgba(255,255,255,0.04) !important; }
        .pill { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: all 100ms; background: transparent; color: ${C.muted}; }
        .pill:hover { border-color: #3A3A3A; color: ${C.text}; }
        .pill.on { background: rgba(139,26,42,0.18); border-color: ${C.accent}; color: ${C.text}; }
        .kbd-tag { display:inline-block; background:#222; border:1px solid #444; border-radius:4px; padding:1px 6px; font-size:11px; font-family:monospace; color:#CCC; }
        .bar-in { animation: barIn 140ms ease; }
        @keyframes barIn { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
        .pop-in { animation: popIn 100ms ease; }
        @keyframes popIn { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#333; border-radius:3px; }
        select option { background:${C.card}; color:${C.text}; }
      `}</style>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { l:'Total',         v: productos.length },
          { l:'Unidades stock',v: totalStock },
          { l:'Con stock',     v: conStock },
          { l:'Sin precio',    v: sinPrecio, warn: sinPrecio > 0 },
        ].map(s => (
          <div key={s.l} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 16px' }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{s.l}</div>
            <div style={{ fontSize:22, fontWeight:700, color:s.warn ? C.red : C.text }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 16px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Valor en stock</div>
          <div style={{ fontSize:20, fontWeight:700 }}>${valorStock.toLocaleString('es-AR')}</div>
        </div>
        <div style={{ fontSize:12, color:C.dim }}>a precio lista</div>
      </div>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <h1 style={{ margin:0, fontSize:18, fontWeight:700, letterSpacing:'-0.02em' }}>Productos</h1>
          <span style={{ fontSize:11, color:C.muted, textTransform:'capitalize' }}>{empresa}</span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => setShowKb(true)} style={btn('ghost',{padding:'5px 10px',fontSize:15})} title="Atajos de teclado">?</button>
          {empresa === 'aroma' && <>
            <button onClick={openWooImport} style={btn()}>⬇ Importar web</button>
            <button onClick={syncWoo} disabled={syncing} style={btn()}>{syncing ? '...' : '↻ Sync Woo'}</button>
          </>}
          <button onClick={calcularCostos} style={btn('default',{padding:'6px 14px',fontSize:13})} title="Calcula precio_costo = 50% precio_venta para los que no tienen costo">Calc. costos</button>
          <button onClick={abrirListaModal} style={btn('default',{padding:'6px 14px',fontSize:13})}>Lista precios</button>
          <button onClick={openNew} style={btn('accent',{padding:'6px 14px',fontSize:13})}>+ Nuevo</button>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:'1 1 200px', maxWidth:340 }}>
          <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:C.dim, fontSize:14, pointerEvents:'none' }}>⌕</span>
          <input ref={searchRef} className="dark-inp" style={{ ...INP, paddingLeft:28 }}
            placeholder="Buscar producto... (Ctrl+F)" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          <button className={`pill${!filtroCategoria?' on':''}`} onClick={() => setFiltroCategoria('')}>Todos</button>
          {CATS.map(c => (
            <button key={c} className={`pill${filtroCategoria===c?' on':''}`} onClick={() => setFiltroCategoria(filtroCategoria===c?'':c)}>{c}</button>
          ))}
        </div>
        <select className="dark-inp" style={{ ...INP, width:'auto', minWidth:150 }} value={filtroBodega} onChange={e => setFiltroBodega(e.target.value)}>
          <option value="">Todas las bodegas</option>
          {bodegasUnicas.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:C.muted, cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}>
          <input type="checkbox" checked={filtroSinPrecio} onChange={e => setFiltroSinPrecio(e.target.checked)} style={{ accentColor:C.accent }} />
          Sin precio
        </label>
      </div>

      {/* Counter */}
      <div style={{ fontSize:12, color:C.dim, marginBottom:8 }}>
        Mostrando <b style={{ color:C.muted }}>{filtrados.length}</b> de {productos.length} productos
        {seleccionados.size > 0 && <span style={{ marginLeft:8, color:C.accent }}>· {seleccionados.size} seleccionado{seleccionados.size!==1?'s':''}</span>}
      </div>

      {/* ── Bulk action bar ───────────────────────────────────────── */}
      {seleccionados.size > 0 && (
        <div className="bar-in" style={{ background:'#161616', border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 12px', marginBottom:8, display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontSize:12, fontWeight:600, color:C.accent, marginRight:4 }}>
            {seleccionados.size} sel.
          </span>
          <button onClick={() => setSeleccionados(new Set())} style={btn('ghost',{padding:'3px 8px',fontSize:11})}>✕</button>
          <div style={{ width:1, height:18, background:C.border, margin:'0 4px' }}/>

          {BULK_ACTIONS.map(a => (
            <div key={a.key} style={{ position:'relative' }}>
              <button
                onClick={() => { setActiveBulk(activeBulk===a.key?null:a.key); setBulkVal('') }}
                style={btn(activeBulk===a.key?'accent':'default')}
              >{a.label}</button>
              {activeBulk === a.key && (
                <div className="pop-in" style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:100, background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:10, minWidth:200, boxShadow:'0 12px 32px rgba(0,0,0,0.7)' }}>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                    {a.key==='aumento_precio'?'Aumentar precio (%)':a.key==='precio_fijo'?'Precio fijo ($)':`Asignar ${a.label}`}
                  </div>
                  {a.kind === 'select' ? (
                    <select className="dark-inp" style={INP} value={bulkVal} onChange={e => setBulkVal(e.target.value)}>
                      <option value="">Elegir bodega...</option>
                      {bodegas.map(b => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
                    </select>
                  ) : (
                    <input autoFocus className="dark-inp" type={a.kind} style={INP}
                      placeholder={a.placeholder || a.label}
                      value={bulkVal} onChange={e => setBulkVal(e.target.value)}
                      onKeyDown={e => { if(e.key==='Enter') bulkRequest(a.key, a.kind==='number'?Number(bulkVal):bulkVal); if(e.key==='Escape') setActiveBulk(null) }}
                    />
                  )}
                  <div style={{ display:'flex', gap:6, marginTop:8 }}>
                    <button disabled={!bulkVal||bulkLoading} onClick={() => bulkRequest(a.key, a.kind==='number'?Number(bulkVal):bulkVal)}
                      style={{ ...btn('accent',{flex:1}), opacity:(!bulkVal||bulkLoading)?0.5:1 }}>
                      {bulkLoading?'...':'Aplicar'}
                    </button>
                    <button onClick={() => setActiveBulk(null)} style={btn()}>✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div style={{ width:1, height:18, background:C.border, margin:'0 4px' }}/>
          <button onClick={eliminarSel} disabled={bulkLoading} style={{ ...btn('danger'), opacity:bulkLoading?.5:1 }}>
            🗑 Eliminar
          </button>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}`, background:C.surface }}>
              <th style={{ width:40, padding:'9px 12px', textAlign:'center' }}>
                <input type="checkbox" checked={allCheck}
                  ref={el => { if(el) el.indeterminate = !allCheck && someCheck }}
                  onChange={() => setSeleccionados(allCheck ? new Set() : new Set(filtrados.map(p => p.id!)))}
                  style={{ accentColor:C.accent, cursor:'pointer' }} />
              </th>
              {['Nombre','Bodega','Varietal','Precio venta','Precio costo','Stock',''].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'9px 12px', fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:'56px 0', color:C.dim }}>Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:'56px 0', color:C.dim }}>Sin resultados</td></tr>
            ) : filtrados.map((p, idx) => {
              const isSel = seleccionados.has(p.id!)
              const isAct = activeRow === p.id
              const isEdit = editingId === p.id

              if (isEdit) return (
                <tr key={p.id + 'e'} style={{ background:'#16161E', borderBottom:`1px solid ${C.border}`, borderLeft:`2px solid ${C.accent}` }}>
                  <td colSpan={8} style={{ padding:'10px 12px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 80px 70px auto', gap:6, alignItems:'center' }}>
                      <input ref={editFirstRef} className="dark-inp" style={INP}
                        value={editForm.nombre} onChange={e => setEditForm(f=>({...f,nombre:e.target.value}))}
                        placeholder="Nombre"
                        onKeyDown={e => { if(e.key==='Enter')saveEdit(); if(e.key==='Escape')setEditingId(null) }} />
                      <input className="dark-inp" style={INP} list="bod-dl"
                        value={editForm.bodega} onChange={e => setEditForm(f=>({...f,bodega:e.target.value}))}
                        placeholder="Bodega"
                        onKeyDown={e => { if(e.key==='Enter')saveEdit(); if(e.key==='Escape')setEditingId(null) }} />
                      <input className="dark-inp" style={INP}
                        value={editForm.varietal} onChange={e => setEditForm(f=>({...f,varietal:e.target.value}))}
                        placeholder="Varietal"
                        onKeyDown={e => { if(e.key==='Enter')saveEdit(); if(e.key==='Escape')setEditingId(null) }} />
                      <input className="dark-inp" type="number" style={INP}
                        value={editForm.precio_venta || ''} onChange={e => { const pv = +e.target.value; setEditForm(f=>({...f, precio_venta: pv, precio_costo: f.precio_costo || Math.round(pv * 0.5) })) }}
                        placeholder="$ venta"
                        onKeyDown={e => { if(e.key==='Enter')saveEdit(); if(e.key==='Escape')setEditingId(null) }} />
                      <input className="dark-inp" type="number" style={INP}
                        value={editForm.precio_costo || ''} onChange={e => setEditForm(f=>({...f,precio_costo:+e.target.value}))}
                        placeholder="$ costo (auto 50%)"
                        onKeyDown={e => { if(e.key==='Enter')saveEdit(); if(e.key==='Escape')setEditingId(null) }} />
                      <input className="dark-inp" type="number" style={INP}
                        value={editForm.stock || ''} onChange={e => setEditForm(f=>({...f,stock:+e.target.value}))}
                        placeholder="Stock"
                        onKeyDown={e => { if(e.key==='Enter')saveEdit(); if(e.key==='Escape')setEditingId(null) }} />
                      <input className="dark-inp" type="number" style={INP}
                        value={editForm.stock_minimo || ''} onChange={e => setEditForm(f=>({...f,stock_minimo:+e.target.value}))}
                        placeholder="Mín."
                        onKeyDown={e => { if(e.key==='Enter')saveEdit(); if(e.key==='Escape')setEditingId(null) }} />
                      <select className="dark-inp" style={{...INP}} value={editForm.unidad_medida || 'botella'} onChange={e => setEditForm(f=>({...f,unidad_medida:e.target.value as 'botella'|'caja6'|'caja12'}))}>
                        <option value="botella">Botella</option>
                        <option value="caja6">Caja ×6</option>
                        <option value="caja12">Caja ×12</option>
                      </select>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={saveEdit} disabled={saving} style={{ ...btn('accent',{padding:'5px 10px'}), opacity:saving?.7:1 }}>✓</button>
                        <button onClick={() => { const p = productos.find(x=>x.id===editingId); if(p) { setEditingId(null); openFullEdit(p) } }} style={btn('default',{padding:'5px 10px',fontSize:11})} title="Ver todos los campos">⋯</button>
                        <button onClick={() => setEditingId(null)} style={btn('default',{padding:'5px 10px'})}>✕</button>
                      </div>
                    </div>
                    <datalist id="bod-dl">{bodegas.map(b => <option key={b.id} value={b.nombre}/>)}</datalist>
                  </td>
                </tr>
              )

              return (
                <tr key={p.id} className={`pr${isSel?' sel':''}${isAct?' act':''}`}
                  style={{ borderBottom:`1px solid ${C.border}`, cursor:'default' }}
                  onMouseDown={e => onRowMouseDown(e, idx, p.id!)}
                  onMouseEnter={() => onRowMouseEnter(idx)}
                  onDoubleClick={() => openEdit(p)}>
                  <td style={{ padding:'7px 12px', textAlign:'center' }} onMouseDown={e => e.stopPropagation()}>
                    <input type="checkbox" checked={isSel} onChange={() => toggleSel(p.id!)} style={{ accentColor:C.accent, cursor:'pointer' }} />
                  </td>
                  <td style={{ padding:'7px 12px', maxWidth:260 }}>
                    <div style={{ fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.nombre}</div>
                    {p.sku && <div style={{ fontSize:11, color:C.dim }}>{p.sku}</div>}
                  </td>
                  <td style={{ padding:'7px 12px', color:C.muted, fontSize:12 }}>{p.bodega || <span style={{color:C.dim}}>—</span>}</td>
                  <td style={{ padding:'7px 12px', color:C.muted, fontSize:12 }}>{p.varietal || <span style={{color:C.dim}}>—</span>}</td>
                  <td style={{ padding:'7px 12px', fontWeight:600 }}>
                    {p.precio_venta ? `$${p.precio_venta.toLocaleString('es-AR')}` : <span style={{color:C.red,fontSize:12}}>Sin precio</span>}
                  </td>
                  <td style={{ padding:'7px 12px', color:C.dim, fontSize:12 }}>
                    {p.precio_costo ? `$${p.precio_costo.toLocaleString('es-AR')}` : '—'}
                  </td>
                  <td style={{ padding:'7px 12px' }}>
                    <span style={{ fontWeight:600, color: p.stock===0 ? C.red : p.stock<=p.stock_minimo ? C.amber : C.green }}>
                      {p.stock}
                    </span>
                  </td>
                  <td style={{ padding:'7px 8px' }} onMouseDown={e => e.stopPropagation()}>
                    <div style={{ display:'flex', gap:2 }}>
                      <button onClick={() => openEdit(p)} style={btn('ghost',{padding:'3px 7px',color:C.muted})} title="Editar (E)">✏</button>
                      <button onClick={() => eliminarUno(p.id!)} style={btn('ghost',{padding:'3px 7px',color:C.red})} title="Eliminar">✕</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Keyboard shortcuts modal ──────────────────────────────── */}
      {showKb && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShowKb(false)}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, minWidth:300, boxShadow:'0 24px 64px rgba(0,0,0,0.9)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Atajos de teclado</h3>
              <button onClick={() => setShowKb(false)} style={btn('ghost',{padding:'2px 8px'})}>✕</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {KB.map(([k, d]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:16 }}>
                  <span className="kbd-tag">{k}</span>
                  <span style={{ fontSize:12, color:C.muted }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Full edit modal ───────────────────────────────────────── */}
      {fullEditId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e => e.target===e.currentTarget && setFullEditId(null)}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.9)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:15, fontWeight:600 }}>Editar producto</h2>
              <button onClick={() => setFullEditId(null)} style={btn('ghost',{padding:'2px 8px'})}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Nombre *</label>
                <input autoFocus className="dark-inp" style={INP} value={fullForm.nombre} onChange={e => setFullForm(f=>({...f,nombre:e.target.value}))} />
              </div>
              {([['bodega','Bodega','edit-bod'],['varietal','Varietal',''],['region','Región',''],['sku','SKU','']] as [string,string,string][]).map(([k,l,dl]) => (
                <div key={k}>
                  <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{l}</label>
                  <input className="dark-inp" style={INP} list={dl||undefined}
                    value={(fullForm as Record<string,unknown>)[k] as string}
                    onChange={e => setFullForm(f=>({...f,[k]:e.target.value}))} />
                  {dl && <datalist id={dl}>{bodegas.map(b=><option key={b.id} value={b.nombre}/>)}</datalist>}
                </div>
              ))}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Categoría</label>
                <select className="dark-inp" style={INP} value={fullForm.categoria} onChange={e => setFullForm(f=>({...f,categoria:e.target.value as Producto['categoria']}))}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {([['precio_venta','Precio venta ($)'],['precio_costo','Precio costo ($)'],['precio_mayorista','Precio mayorista ($)'],['stock','Stock'],['stock_minimo','Stock mínimo']] as [string,string][]).map(([k,l]) => (
                <div key={k}>
                  <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{l}</label>
                  <input className="dark-inp" type="number" min="0" style={INP}
                    value={(fullForm as Record<string,unknown>)[k] as number || ''}
                    onChange={e => setFullForm(f=>({...f,[k]:+e.target.value}))} />
                </div>
              ))}
              <div>
                <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Unidad de medida</label>
                <select className="dark-inp" style={INP} value={fullForm.unidad_medida||'botella'} onChange={e => setFullForm(f=>({...f,unidad_medida:e.target.value as 'botella'|'caja6'|'caja12'}))}>
                  <option value="botella">Botella (×1)</option>
                  <option value="caja6">Caja ×6</option>
                  <option value="caja12">Caja ×12</option>
                </select>
              </div>
              {empresa==='aroma' && (
                <div>
                  <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>WooCommerce ID</label>
                  <input className="dark-inp" type="number" style={INP}
                    value={fullForm.woo_product_id||''}
                    onChange={e => setFullForm(f=>({...f,woo_product_id:+e.target.value||undefined}))}
                    placeholder="Dejar vacío si no aplica" />
                </div>
              )}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:20 }}>
              <button onClick={() => setFullEditId(null)} style={btn()}>Cancelar</button>
              <button onClick={saveFullEdit} disabled={saving} style={{ ...btn('accent',{padding:'6px 16px'}), opacity:saving?.7:1 }}>
                {saving?'Guardando...':'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New product modal ─────────────────────────────────────── */}
      {newModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e => e.target===e.currentTarget && setNewModal(false)}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.9)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:15, fontWeight:600 }}>Nuevo producto</h2>
              <button onClick={() => setNewModal(false)} style={btn('ghost',{padding:'2px 8px'})}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Nombre *</label>
                <input autoFocus className="dark-inp" style={INP} value={newForm.nombre} onChange={e => setNewForm(f=>({...f,nombre:e.target.value}))} placeholder="Ej: Gran Reserva Malbec" />
              </div>
              {([['bodega','Bodega','new-bod'],['varietal','Varietal',''],['region','Región',''],['sku','SKU','']] as [string,string,string][]).map(([k,l,dl]) => (
                <div key={k}>
                  <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{l}</label>
                  <input className="dark-inp" style={INP} list={dl||undefined}
                    value={(newForm as Record<string,unknown>)[k] as string}
                    onChange={e => setNewForm(f=>({...f,[k]:e.target.value}))} />
                  {dl && <datalist id={dl}>{bodegas.map(b=><option key={b.id} value={b.nombre}/>)}</datalist>}
                </div>
              ))}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Categoría</label>
                <select className="dark-inp" style={INP} value={newForm.categoria} onChange={e => setNewForm(f=>({...f,categoria:e.target.value as Producto['categoria']}))}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {([['precio_venta','Precio venta ($)'],['precio_costo','Precio costo ($)'],['precio_mayorista','Precio mayorista ($)'],['stock','Stock'],['stock_minimo','Stock mínimo']] as [string,string][]).map(([k,l]) => (
                <div key={k}>
                  <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{l}</label>
                  <input className="dark-inp" type="number" min="0" style={INP}
                    value={(newForm as Record<string,unknown>)[k] as number}
                    onChange={e => setNewForm(f=>({...f,[k]:+e.target.value}))} />
                </div>
              ))}
              <div>
                <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Unidad de medida</label>
                <select className="dark-inp" style={INP} value={newForm.unidad_medida || 'botella'} onChange={e => setNewForm(f=>({...f,unidad_medida:e.target.value as 'botella'|'caja6'|'caja12'}))}>
                  <option value="botella">Botella (×1)</option>
                  <option value="caja6">Caja ×6</option>
                  <option value="caja12">Caja ×12</option>
                </select>
              </div>
              {empresa==='aroma' && (
                <div>
                  <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>WooCommerce ID</label>
                  <input className="dark-inp" type="number" style={INP}
                    value={newForm.woo_product_id||''} onChange={e => setNewForm(f=>({...f,woo_product_id:+e.target.value||undefined}))}
                    placeholder="Dejar vacío si no aplica" />
                </div>
              )}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:20 }}>
              <button onClick={() => setNewModal(false)} style={btn()}>Cancelar</button>
              <button onClick={saveNew} disabled={saving} style={{ ...btn('accent',{padding:'6px 16px'}), opacity:saving?.7:1 }}>
                {saving?'Guardando...':'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WooCommerce import modal ───────────────────────────────── */}
      {importModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e => e.target===e.currentTarget && setImportModal(false)}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, width:'100%', maxWidth:860, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.9)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexShrink:0 }}>
              <div>
                <h2 style={{ margin:0, fontSize:15, fontWeight:600 }}>Importar desde WooCommerce</h2>
                {!importLoading && <p style={{ margin:'3px 0 0', fontSize:12, color:C.muted }}>
                  {wooList.length} productos · <span style={{color:C.green}}>{wooList.filter(p=>!p.ya_importado).length} nuevos</span>
                </p>}
              </div>
              <button onClick={() => setImportModal(false)} style={btn('ghost',{padding:'2px 8px'})}>✕</button>
            </div>
            {importLoading ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:C.dim }}>Cargando desde la web...</div>
            ) : <>
              <div style={{ display:'flex', gap:12, marginBottom:10, flexShrink:0, alignItems:'center' }}>
                <label style={{ display:'flex', gap:5, fontSize:12, color:C.muted, cursor:'pointer' }}>
                  <input type="checkbox" checked={soloNuevos} onChange={e => setSoloNuevos(e.target.checked)} style={{accentColor:C.accent}} />
                  Solo nuevos
                </label>
                <button onClick={() => setWooSel(new Set(wooList.filter(p=>!p.ya_importado).map(p=>p.woo_product_id)))} style={btn('ghost',{padding:'3px 8px',fontSize:11})}>Sel. todos</button>
                <button onClick={() => setWooSel(new Set())} style={btn('ghost',{padding:'3px 8px',fontSize:11,color:C.dim})}>Limpiar</button>
              </div>
              <div style={{ flex:1, overflowY:'auto', border:`1px solid ${C.border}`, borderRadius:8 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead style={{ position:'sticky', top:0, background:C.surface, borderBottom:`1px solid ${C.border}` }}>
                    <tr>{['','Nombre','Bodega','Varietal','Categoría','Precio','Stock','Estado'].map(h=>(
                      <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:10, color:C.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {wooList.filter(p => !soloNuevos || !p.ya_importado).map(p => (
                      <tr key={p.woo_product_id} style={{ borderBottom:`1px solid ${C.border}`, opacity:p.ya_importado?.5:1 }}>
                        <td style={{ padding:'6px 10px' }}><input type="checkbox" disabled={p.ya_importado} checked={wooSel.has(p.woo_product_id)} onChange={() => setWooSel(s => { const n=new Set(s); n.has(p.woo_product_id)?n.delete(p.woo_product_id):n.add(p.woo_product_id); return n })} style={{accentColor:C.accent}} /></td>
                        <td style={{ padding:'6px 10px', maxWidth:220 }}><div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.nombre}</div></td>
                        <td style={{ padding:'6px 10px', color:C.muted }}>{p.bodega||'—'}</td>
                        <td style={{ padding:'6px 10px', color:C.muted }}>{p.varietal||'—'}</td>
                        <td style={{ padding:'6px 10px', color:C.muted }}>{p.categoria}</td>
                        <td style={{ padding:'6px 10px', fontWeight:600 }}>{p.precio_venta>0?`$${p.precio_venta.toLocaleString('es-AR')}`:'-'}</td>
                        <td style={{ padding:'6px 10px', color:C.muted }}>{p.stock}</td>
                        <td style={{ padding:'6px 10px' }}><span style={{ fontSize:10, padding:'2px 7px', borderRadius:10, background:p.ya_importado?'#222':'rgba(76,175,125,0.15)', color:p.ya_importado?C.dim:C.green, border:`1px solid ${p.ya_importado?C.border:'rgba(76,175,125,0.3)'}` }}>{p.ya_importado?'Importado':'Nuevo'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, flexShrink:0 }}>
                <span style={{ fontSize:12, color:C.muted }}>{wooSel.size} seleccionados</span>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setImportModal(false)} style={btn()}>Cancelar</button>
                  <button onClick={importarWoo} disabled={importando||wooSel.size===0} style={{ ...btn('accent',{padding:'6px 16px'}), opacity:(importando||wooSel.size===0)?.5:1 }}>
                    {importando?'Importando...':`Importar ${wooSel.size}`}
                  </button>
                </div>
              </div>
            </>}
          </div>
        </div>
      )}

      {/* ── Lista de precios modal ────────────────────────────────── */}
      {listaModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:24, overflowY:'auto' }}
          onClick={e => e.target === e.currentTarget && setListaModal(false)}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:28, width:'100%', maxWidth:700, boxShadow:'0 24px 64px rgba(0,0,0,0.6)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:15, fontWeight:700, color:C.text }}>Armar lista de precios</h2>
              <button onClick={() => setListaModal(false)} style={{ background:'none', border:'none', color:C.dim, fontSize:20, cursor:'pointer', lineHeight:1 }}>×</button>
            </div>

            {/* Buscador */}
            <div style={{ position:'relative', marginBottom:16 }}>
              <input
                style={{ ...INP, paddingRight:32 }}
                placeholder="Buscar y agregar producto..."
                value={listaQuery}
                onChange={e => { setListaQuery(e.target.value); setListaSugsOpen(true) }}
                onFocus={() => setListaSugsOpen(true)}
                onBlur={() => setTimeout(() => setListaSugsOpen(false), 150)}
                autoComplete="off"
              />
              {listaSugsOpen && listaQuery && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:10, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.5)', maxHeight:280, overflowY:'auto', marginTop:2 }}>
                  {productos
                    .filter(p => p.precio_venta > 0 && !listaItems.find(i => i.id === p.id) &&
                      `${p.nombre} ${p.bodega} ${p.varietal}`.toLowerCase().includes(listaQuery.toLowerCase()))
                    .slice(0, 20)
                    .map(p => (
                      <div key={p.id} onMouseDown={() => listaAgregarProducto(p)}
                        style={{ padding:'9px 14px', cursor:'pointer', borderBottom:`1px solid rgba(42,42,42,0.5)`, display:'flex', justifyContent:'space-between', alignItems:'center' }}
                        className="lista-sug">
                        <div>
                          <div style={{ fontSize:13, color:C.text, fontWeight:500 }}>{p.nombre}</div>
                          <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{[p.bodega, p.varietal].filter(Boolean).join(' · ')}</div>
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:C.green }}>${p.precio_venta.toLocaleString('es-AR')}</div>
                      </div>
                    ))}
                  {productos.filter(p => p.precio_venta > 0 && !listaItems.find(i => i.id === p.id) &&
                    `${p.nombre} ${p.bodega} ${p.varietal}`.toLowerCase().includes(listaQuery.toLowerCase())).length === 0 && (
                    <div style={{ padding:'14px', fontSize:12, color:C.dim, textAlign:'center' }}>Sin resultados</div>
                  )}
                </div>
              )}
            </div>

            {/* Tabla de items */}
            {listaItems.length === 0 ? (
              <div style={{ padding:'32px', textAlign:'center', color:C.dim, fontSize:13 }}>Buscá productos para armar la lista</div>
            ) : (
              <div style={{ border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', marginBottom:20 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${C.border}`, background:C.surface }}>
                      {['Producto','Bodega','Varietal','Precio','Mayorista',''].map(h => (
                        <th key={h} style={{ padding:'8px 12px', fontSize:10, color:C.dim, fontWeight:600, textAlign: h === 'Precio' || h === 'Mayorista' ? 'right' : 'left', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {listaItems.map((item, i) => (
                      <tr key={item.id} style={{ borderBottom:`1px solid rgba(42,42,42,0.5)` }}>
                        <td style={{ padding:'9px 12px', color:C.text, fontWeight:500 }}>{item.nombre}</td>
                        <td style={{ padding:'9px 12px', color:C.muted, fontSize:12 }}>{item.bodega || '—'}</td>
                        <td style={{ padding:'9px 12px', color:C.muted, fontSize:12 }}>{item.varietal || '—'}</td>
                        <td style={{ padding:'9px 12px', textAlign:'right', fontWeight:700, color:C.green }}>${item.precio_venta.toLocaleString('es-AR')}</td>
                        <td style={{ padding:'9px 12px', textAlign:'right', color:C.muted, fontSize:12 }}>{item.precio_mayorista ? '$' + item.precio_mayorista.toLocaleString('es-AR') : '—'}</td>
                        <td style={{ padding:'9px 8px', textAlign:'right' }}>
                          <button onClick={() => setListaItems(prev => prev.filter((_,j) => j !== i))}
                            style={{ background:'none', border:'none', color:C.dim, cursor:'pointer', fontSize:16, lineHeight:1, padding:'2px 4px' }}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:12, color:C.dim }}>{listaItems.length} producto{listaItems.length !== 1 ? 's' : ''}</span>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setListaModal(false)} style={btn('default', { padding:'7px 16px', fontSize:13 })}>Cancelar</button>
                <button onClick={imprimirLista} disabled={listaItems.length === 0}
                  style={{ ...btn('accent', { padding:'7px 18px', fontSize:13, fontWeight:600 }), opacity: listaItems.length === 0 ? 0.4 : 1 }}>
                  Imprimir lista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#222', border:`1px solid ${C.border}`, color:C.text, fontSize:13, padding:'10px 16px', borderRadius:8, boxShadow:'0 8px 32px rgba(0,0,0,0.7)', zIndex:300, animation:'popIn 150ms ease' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
