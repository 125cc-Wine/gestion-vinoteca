'use client'
import { useEffect, useRef, useState } from 'react'
import type { Producto } from '@/types'
import BarcodeScanner from '@/components/BarcodeScanner'
import BarcodeNotFoundModal from '@/components/BarcodeNotFoundModal'
import * as XLSX from 'xlsx'
import { useBarcodeInput } from '@/hooks/useBarcodeInput'

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:      '#F5F1EC',
  surface: '#FFFFFF',
  border:  '#DDD0C0',
  border2: '#C8BAA8',
  text:    '#1A1210',
  muted:   '#6B5D55',
  dim:     '#A89888',
  wine:    '#800000',
  wineBg:  'rgba(128,0,0,0.07)',
  wineBd:  'rgba(128,0,0,0.18)',
  brown:   '#633A2C',
  gold:    '#B88A2C',
  goldBg:  'rgba(184,138,44,0.08)',
  goldBd:  'rgba(184,138,44,0.22)',
  green:   '#2D7A4F',
  greenBg: 'rgba(45,122,79,0.08)',
  greenBd: 'rgba(45,122,79,0.22)',
  red:     '#C03030',
  redBg:   'rgba(192,48,48,0.08)',
  redBd:   'rgba(192,48,48,0.22)',
  blue:    '#2B5EA0',
  blueBg:  'rgba(43,94,160,0.08)',
  blueBd:  'rgba(43,94,160,0.22)',
  amber:   '#A07010',
  amberBg: 'rgba(160,112,16,0.07)',
  amberBd: 'rgba(160,112,16,0.22)',
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
  region: '', sku: '', codigo_barras: '',
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
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
  color: T.text, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
  fontFamily: 'inherit',
}
const INP_SM: React.CSSProperties = {
  ...INP, padding: '6px 10px', fontSize: 13,
}

function catBadge(cat: string): React.CSSProperties {
  if (cat === 'Tinto')    return { background: T.wineBg,  color: T.wine,  border: `1px solid ${T.wineBd}` }
  if (cat === 'Blanco')   return { background: T.blueBg,  color: T.blue,  border: `1px solid ${T.blueBd}` }
  if (cat === 'Rosado')   return { background: T.goldBg,  color: T.gold,  border: `1px solid ${T.goldBd}` }
  if (cat === 'Espumante')return { background: T.greenBg, color: T.green, border: `1px solid ${T.greenBd}` }
  return { background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBd}` }
}

function stockBadge(stock: number, minimo: number): React.CSSProperties {
  if (stock === 0)     return { background: T.redBg,   color: T.red,   border: '1px solid rgba(192,48,48,0.25)' }
  if (stock <= minimo) return { background: T.amberBg, color: T.amber, border: '1px solid rgba(160,112,16,0.25)' }
  return                      { background: T.greenBg, color: T.green, border: '1px solid rgba(45,122,79,0.25)' }
}

const BADGE_BASE: React.CSSProperties = {
  padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
  display: 'inline-block', whiteSpace: 'nowrap',
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

  // Barcode scanner
  const [scanMode, setScanMode] = useState<'buscar' | 'asignar' | null>(null)
  const [barcodeNotFound, setBarcodeNotFound] = useState<string | null>(null)

  // Lista de precios modal
  interface ListaItem { id: string; nombre: string; bodega: string; varietal: string; categoria: string; precio_venta: number; precio_mayorista: number }
  const [listaModal, setListaModal] = useState(false)
  const [listaItems, setListaItems] = useState<ListaItem[]>([])
  const [listaQuery, setListaQuery] = useState('')
  const [listaSugsOpen, setListaSugsOpen] = useState(false)

  // Actualización masiva de precios
  const [masivModal, setMasivModal]         = useState(false)
  const [masivBodega, setMasivBodega]       = useState('')
  const [masivCat, setMasivCat]             = useState('')
  const [masivTipo, setMasivTipo]           = useState<'pct'|'fijo'>('pct')
  const [masivValor, setMasivValor]         = useState('')
  const [masivDir, setMasivDir]             = useState<'subir'|'bajar'>('subir')
  const [masivGuardando, setMasivGuardando] = useState(false)

  const masivAfectados = productos.filter(p => {
    if (masivBodega && p.bodega !== masivBodega) return false
    if (masivCat    && p.categoria !== masivCat) return false
    return true
  })

  function exportarExcel() {
    const rows = filtrados.map(p => ({
      Nombre: p.nombre, Bodega: p.bodega ?? '', Varietal: p.varietal ?? '',
      Categoría: p.categoria ?? '', SKU: p.sku ?? '', 'Código de barras': p.codigo_barras ?? '',
      'Precio venta': p.precio_venta ?? 0, 'Precio costo': p.precio_costo ?? 0,
      Stock: p.stock ?? 0, 'Stock mínimo': p.stock_minimo ?? 0,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')
    XLSX.writeFile(wb, `productos_${empresa}_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  async function aplicarMasivo() {
    const val = parseFloat(masivValor)
    if (!val || masivAfectados.length === 0) return
    setMasivGuardando(true)
    let ok = 0
    for (const p of masivAfectados) {
      let nuevo: number
      if (masivTipo === 'pct') {
        nuevo = masivDir === 'subir'
          ? Math.round(p.precio_venta * (1 + val / 100))
          : Math.round(p.precio_venta * (1 - val / 100))
      } else {
        nuevo = masivDir === 'subir' ? p.precio_venta + val : Math.max(0, p.precio_venta - val)
      }
      const res = await fetch('/api/productos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, precio_venta: nuevo }),
      })
      if (res.ok) ok++
    }
    setMasivGuardando(false)
    setMasivModal(false)
    await cargar(empresa)
    toast_(`${ok} productos actualizados`)
  }

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

  async function handleBarcodeDetect(code: string) {
    setScanMode(null)
    const res = await fetch(`/api/productos?empresa=${empresa}&barcode=${encodeURIComponent(code)}`)
    const prod = await res.json()
    if (prod && prod.id) {
      setBusqueda(prod.nombre)
      toast_(`Encontrado: ${prod.nombre}`)
    } else {
      setBarcodeNotFound(code)
    }
  }

  async function handleBarcodeNotFound(prod: Producto, saveBarcode: boolean) {
    const code = barcodeNotFound!
    setBarcodeNotFound(null)
    if (saveBarcode) {
      await fetch('/api/productos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: prod.id, codigo_barras: code }) })
      setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, codigo_barras: code } : p))
      toast_(`Código ${code} guardado en "${prod.nombre}"`)
    }
    setBusqueda(prod.nombre)
  }

  // Pistola lectora — busca por código cuando no hay modal abierto
  useBarcodeInput(handleBarcodeDetect, !scanMode && !fullEditId)
  function toggleSel(id: string) {
    setSeleccionados(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function openEdit(p: Producto) {
    setEditingId(p.id!)
    setEditForm({ nombre: p.nombre, bodega: p.bodega, varietal: p.varietal, categoria: p.categoria,
      region: p.region||'', sku: p.sku||'', codigo_barras: p.codigo_barras||'',
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
      region: p.region||'', sku: p.sku||'', codigo_barras: p.codigo_barras||'',
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
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: 'Inter, system-ui, -apple-system, sans-serif', padding: '0 0 48px' }}>
      <style>{`
        * { box-sizing: border-box; }
        .tr:hover { background: #FDFAF6 !important; }
        .tr.sel  { background: rgba(128,0,0,0.05) !important; }
        .tr.sel td:first-child { border-left: 2px solid ${T.wine}; }
        .tr      td:first-child { border-left: 2px solid transparent; }
        .tr.act  { outline: 1px solid ${T.border2}; outline-offset: -1px; }
        .btn-row { transition: all 0.12s; }
        .btn-row:hover { border-color: ${T.border2} !important; color: ${T.muted} !important; }
        .btn-wine { transition: background 0.12s; }
        .btn-wine:hover { background: #6A0000 !important; }
        input:focus, select:focus, textarea:focus { border-color: ${T.border2} !important; box-shadow: 0 0 0 3px rgba(128,0,0,0.08) !important; outline: none !important; }
        .lista-sug:hover { background: ${T.bg} !important; }
        .pill { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: all 100ms; background: transparent; color: ${T.muted}; font-family: inherit; }
        .pill:hover { border-color: ${T.border}; color: ${T.text}; }
        .pill.on { background: ${T.wineBg}; border-color: ${T.wineBd}; color: ${T.wine}; }
        .kbd-tag { display:inline-block; background:${T.bg}; border:1px solid ${T.border}; border-radius:4px; padding:1px 6px; font-size:11px; font-family:monospace; color:${T.muted}; }
        .bar-in { animation: barIn 140ms ease; }
        @keyframes barIn { from{opacity:0} to{opacity:1} }
        .pop-in { animation: popIn 100ms ease; }
        @keyframes popIn { from{opacity:0} to{opacity:1} }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:3px; }
        select option { background:${T.surface}; color:${T.text}; }
      `}</style>

      {/* ── Barcode Scanner ──────────────────────────────────────── */}
      {scanMode && (
        <BarcodeScanner
          titulo={scanMode === 'buscar' ? 'Buscar producto por código' : 'Asignar código de barras'}
          onClose={() => setScanMode(null)}
          onDetect={async (code) => {
            if (scanMode === 'buscar') {
              await handleBarcodeDetect(code)
            } else {
              setScanMode(null)
              setFullForm(f => ({ ...f, codigo_barras: code }))
              toast_(`Código ${code} asignado`)
            }
          }}
        />
      )}
      {barcodeNotFound && (
        <BarcodeNotFoundModal
          code={barcodeNotFound}
          empresa={empresa}
          onSelect={handleBarcodeNotFound}
          onClose={() => setBarcodeNotFound(null)}
        />
      )}

      {/* ── Page header ────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Productos</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: '3px 0 0' }}>
            {productos.length} productos · {productos.filter(p => p.stock === 0).length} sin stock
            <span style={{ marginLeft: 8, color: T.dim }}>· {empresa}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setShowKb(true)} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '7px 12px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }} title="Atajos de teclado">?</button>
          {empresa === 'aroma' && <>
            <button onClick={openWooImport} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Importar web</button>
            <button onClick={syncWoo} disabled={syncing} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{syncing ? '...' : 'Sync Woo'}</button>
          </>}
          <button onClick={calcularCostos} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }} title="Calcula precio_costo = 50% precio_venta para los que no tienen costo">Calc. costos</button>
          <button onClick={exportarExcel} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Exportar Excel</button>
          <button onClick={() => { setMasivBodega(''); setMasivCat(''); setMasivValor(''); setMasivDir('subir'); setMasivModal(true) }} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Actualiz. masiva</button>
          <button onClick={abrirListaModal} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Lista precios</button>
          <button onClick={openNew} className="btn-wine" style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Nuevo producto</button>
        </div>
      </div>

      <div style={{ padding: '0 28px' }}>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { l: 'Total productos', v: productos.length, warn: false },
          { l: 'Unidades en stock', v: totalStock, warn: false },
          { l: 'Con stock', v: conStock, warn: false },
          { l: 'Sin precio', v: sinPrecio, warn: sinPrecio > 0 },
        ].map(s => (
          <div key={s.l} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px', boxShadow: '0 1px 3px rgba(26,18,16,0.04)' }}>
            <div style={{ fontSize: 10, color: T.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{s.l}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.warn ? T.red : T.text }}>{s.v}</div>
          </div>
        ))}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px', boxShadow: '0 1px 3px rgba(26,18,16,0.04)' }}>
          <div style={{ fontSize: 10, color: T.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Valor en stock</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>${valorStock.toLocaleString('es-AR')}</div>
          <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>a precio lista</div>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 360 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.dim, fontSize: 14, pointerEvents: 'none' }}>⌕</span>
          <input ref={searchRef} style={{ ...INP, paddingLeft: 30 }}
            placeholder="Buscar producto, bodega, varietal... (Ctrl+F)" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <button onClick={() => setScanMode('buscar')}
          title="Escanear código de barras"
          style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>
          📷
        </button>
        <select style={{ ...INP, width: 'auto', minWidth: 160 }} value={filtroBodega} onChange={e => setFiltroBodega(e.target.value)}>
          <option value="">Todas las bodegas</option>
          {bodegasUnicas.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select style={{ ...INP, width: 'auto', minWidth: 140 }} value={filtroSinPrecio ? 'sinprecio' : ''} onChange={e => setFiltroSinPrecio(e.target.value === 'sinprecio')}>
          <option value="">Todo el stock</option>
          <option value="sinprecio">Sin precio</option>
        </select>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button className={`pill${!filtroCategoria ? ' on' : ''}`} onClick={() => setFiltroCategoria('')}>Todos</button>
          {CATS.map(c => (
            <button key={c} className={`pill${filtroCategoria === c ? ' on' : ''}`} onClick={() => setFiltroCategoria(filtroCategoria === c ? '' : c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Counter */}
      <div style={{ fontSize: 12, color: T.dim, marginBottom: 8 }}>
        Mostrando <b style={{ color: T.muted }}>{filtrados.length}</b> de {productos.length} productos
        {seleccionados.size > 0 && <span style={{ marginLeft: 8, color: T.wine, fontWeight: 600 }}>· {seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''}</span>}
      </div>

      {/* ── Bulk action bar ───────────────────────────────────────── */}
      {seleccionados.size > 0 && (
        <div className="bar-in" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', marginBottom: 10, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(26,18,16,0.06)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.wine, marginRight: 4 }}>
            {seleccionados.size} sel.
          </span>
          <button onClick={() => setSeleccionados(new Set())} className="btn-row" style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
          <div style={{ width: 1, height: 18, background: T.border, margin: '0 4px' }} />

          {BULK_ACTIONS.map(a => (
            <div key={a.key} style={{ position: 'relative' }}>
              <button
                onClick={() => { setActiveBulk(activeBulk === a.key ? null : a.key); setBulkVal('') }}
                style={{
                  background: activeBulk === a.key ? T.wineBg : T.surface,
                  border: `1px solid ${activeBulk === a.key ? T.wineBd : T.border}`,
                  color: activeBulk === a.key ? T.wine : T.muted,
                  borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{a.label}</button>
              {activeBulk === a.key && (
                <div className="pop-in" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, minWidth: 210, boxShadow: '0 12px 32px rgba(26,18,16,0.12)' }}>
                  <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {a.key === 'aumento_precio' ? 'Aumentar precio (%)' : a.key === 'precio_fijo' ? 'Precio fijo ($)' : `Asignar ${a.label}`}
                  </div>
                  {a.kind === 'select' ? (
                    <select style={INP_SM} value={bulkVal} onChange={e => setBulkVal(e.target.value)}>
                      <option value="">Elegir bodega...</option>
                      {bodegas.map(b => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
                    </select>
                  ) : (
                    <input autoFocus type={a.kind} style={INP_SM}
                      placeholder={a.placeholder || a.label}
                      value={bulkVal} onChange={e => setBulkVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') bulkRequest(a.key, a.kind === 'number' ? Number(bulkVal) : bulkVal); if (e.key === 'Escape') setActiveBulk(null) }}
                    />
                  )}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button disabled={!bulkVal || bulkLoading} onClick={() => bulkRequest(a.key, a.kind === 'number' ? Number(bulkVal) : bulkVal)}
                      style={{ flex: 1, background: T.wine, color: '#FFF', border: 'none', borderRadius: 7, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (!bulkVal || bulkLoading) ? 0.5 : 1 }}>
                      {bulkLoading ? '...' : 'Aplicar'}
                    </button>
                    <button onClick={() => setActiveBulk(null)} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: '7px 10px', fontSize: 12, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div style={{ width: 1, height: 18, background: T.border, margin: '0 4px' }} />
          <button onClick={eliminarSel} disabled={bulkLoading} style={{ background: T.redBg, border: `1px solid ${T.redBd}`, color: T.red, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: bulkLoading ? 0.5 : 1 }}>
            Eliminar
          </button>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)', contain: 'layout' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.bg }}>
              <th style={{ width: 40, padding: '10px 12px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                <input type="checkbox" checked={allCheck}
                  ref={el => { if (el) el.indeterminate = !allCheck && someCheck }}
                  onChange={() => setSeleccionados(allCheck ? new Set() : new Set(filtrados.map(p => p.id!)))}
                  style={{ accentColor: T.wine, cursor: 'pointer' }} />
              </th>
              {['Nombre', 'Bodega', 'Varietal', 'Categoría', 'Precio venta', 'Precio costo', 'Stock', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '56px 0', color: T.dim }}>Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '56px 0', color: T.dim }}>Sin resultados</td></tr>
            ) : filtrados.map((p, idx) => {
              const isSel = seleccionados.has(p.id!)
              const isAct = activeRow === p.id
              const isEdit = editingId === p.id

              if (isEdit) return (
                <tr key={p.id + 'e'} style={{ background: T.bg, borderBottom: `1px solid ${T.border}`, borderLeft: `2px solid ${T.wine}` }}>
                  <td colSpan={9} style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px 70px auto', gap: 8, alignItems: 'center' }}>
                      <input ref={editFirstRef} style={INP_SM}
                        value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                        placeholder="Nombre"
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }} />
                      <input style={INP_SM} list="bod-dl"
                        value={editForm.bodega} onChange={e => setEditForm(f => ({ ...f, bodega: e.target.value }))}
                        placeholder="Bodega"
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }} />
                      <input style={INP_SM}
                        value={editForm.varietal} onChange={e => setEditForm(f => ({ ...f, varietal: e.target.value }))}
                        placeholder="Varietal"
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }} />
                      <input type="number" style={INP_SM}
                        value={editForm.precio_venta || ''} onChange={e => { const pv = +e.target.value; setEditForm(f => ({ ...f, precio_venta: pv, precio_costo: f.precio_costo || Math.round(pv * 0.5) })) }}
                        placeholder="$ venta"
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }} />
                      <input type="number" style={INP_SM}
                        value={editForm.precio_costo || ''} onChange={e => setEditForm(f => ({ ...f, precio_costo: +e.target.value }))}
                        placeholder="$ costo"
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }} />
                      <input type="number" style={INP_SM}
                        value={editForm.stock || ''} onChange={e => setEditForm(f => ({ ...f, stock: +e.target.value }))}
                        placeholder="Stock"
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }} />
                      <input type="number" style={INP_SM}
                        value={editForm.stock_minimo || ''} onChange={e => setEditForm(f => ({ ...f, stock_minimo: +e.target.value }))}
                        placeholder="Mín."
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }} />
                      <select style={INP_SM} value={editForm.unidad_medida || 'botella'} onChange={e => setEditForm(f => ({ ...f, unidad_medida: e.target.value as 'botella' | 'caja6' | 'caja12' }))}>
                        <option value="botella">Botella</option>
                        <option value="caja6">Caja ×6</option>
                        <option value="caja12">Caja ×12</option>
                      </select>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={saveEdit} disabled={saving} className="btn-wine" style={{ background: T.wine, color: '#FFF', border: 'none', borderRadius: 7, padding: '6px 10px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>✓</button>
                        <button onClick={() => { const px = productos.find(x => x.id === editingId); if (px) { setEditingId(null); openFullEdit(px) } }} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 7, padding: '6px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }} title="Ver todos los campos">⋯</button>
                        <button onClick={() => setEditingId(null)} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 7, padding: '6px 10px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                      </div>
                    </div>
                    <datalist id="bod-dl">{bodegas.map(b => <option key={b.id} value={b.nombre} />)}</datalist>
                  </td>
                </tr>
              )

              return (
                <tr key={p.id} className={`tr${isSel ? ' sel' : ''}${isAct ? ' act' : ''}`}
                  style={{ borderBottom: `1px solid ${T.border}`, cursor: 'default', transition: 'background 0.1s' }}
                  onMouseDown={e => onRowMouseDown(e, idx, p.id!)}
                  onMouseEnter={() => onRowMouseEnter(idx)}
                  onDoubleClick={() => openEdit(p)}>
                  <td style={{ padding: '11px 12px', textAlign: 'center' }} onMouseDown={e => e.stopPropagation()}>
                    <input type="checkbox" checked={isSel} onChange={() => toggleSel(p.id!)} style={{ accentColor: T.wine, cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '11px 16px', maxWidth: 260 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                    {p.sku && <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>{p.sku}</div>}
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: T.muted }}>{p.bodega || <span style={{ color: T.dim }}>—</span>}</td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: T.muted }}>{p.varietal || <span style={{ color: T.dim }}>—</span>}</td>
                  <td style={{ padding: '11px 16px' }}>
                    {p.categoria && (
                      <span style={{ ...BADGE_BASE, ...catBadge(p.categoria) }}>{p.categoria}</span>
                    )}
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: T.text }}>
                    {p.precio_venta ? `$${p.precio_venta.toLocaleString('es-AR')}` : <span style={{ color: T.red, fontSize: 12, fontWeight: 500 }}>Sin precio</span>}
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: T.dim }}>
                    {p.precio_costo ? `$${p.precio_costo.toLocaleString('es-AR')}` : '—'}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ ...BADGE_BASE, ...stockBadge(p.stock, p.stock_minimo) }}>
                      {p.stock === 0 ? 'Sin stock' : p.stock <= p.stock_minimo ? `${p.stock} u. ⚠` : `${p.stock} u.`}
                    </span>
                  </td>
                  <td style={{ padding: '11px 10px' }} onMouseDown={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEdit(p)} className="btn-row" style={{ background: 'none', border: `1px solid transparent`, color: T.dim, borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }} title="Editar (E)">✏</button>
                      <button onClick={() => { localStorage.setItem('etiqueta_prefill', JSON.stringify(p)); window.location.href = '/etiquetas' }} style={{ background: 'none', border: `1px solid transparent`, color: T.gold, borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: 0.85 }} title="Imprimir etiqueta">🏷️</button>
                      <button onClick={() => eliminarUno(p.id!)} style={{ background: 'none', border: `1px solid transparent`, color: T.red, borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: 0.7, transition: 'opacity 0.1s' }} title="Eliminar" onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}>✕</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      </div>{/* end padding wrapper */}

      {/* ── Keyboard shortcuts modal ──────────────────────────────── */}
      {showKb && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowKb(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, padding: 24, minWidth: 320, boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>Atajos de teclado</h3>
              <button onClick={() => setShowKb(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {KB.map(([k, d]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                  <span className="kbd-tag">{k}</span>
                  <span style={{ fontSize: 12, color: T.muted }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Full edit modal ───────────────────────────────────────── */}
      {fullEditId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => e.target === e.currentTarget && setFullEditId(null)}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 600, boxShadow: '0 20px 60px rgba(26,18,16,0.18)', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: T.surface, zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Editar producto</h2>
              <button onClick={() => setFullEditId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20 }}>×</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Nombre *</label>
                <input autoFocus style={INP} value={fullForm.nombre} onChange={e => setFullForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {([['bodega', 'Bodega', 'edit-bod'], ['varietal', 'Varietal', ''], ['region', 'Región', ''], ['sku', 'SKU', '']] as [string, string, string][]).map(([k, l, dl]) => (
                  <div key={k}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>{l}</label>
                    <input style={INP} list={dl || undefined}
                      value={(fullForm as Record<string, unknown>)[k] as string}
                      onChange={e => setFullForm(f => ({ ...f, [k]: e.target.value }))} />
                    {dl && <datalist id={dl}>{bodegas.map(b => <option key={b.id} value={b.nombre} />)}</datalist>}
                  </div>
                ))}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Código de barras (EAN)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...INP, flex: 1 }} value={fullForm.codigo_barras}
                    onChange={e => setFullForm(f => ({ ...f, codigo_barras: e.target.value }))}
                    placeholder="Ej: 7790123456789" />
                  <button type="button" onClick={() => setScanMode('asignar')}
                    style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', cursor: 'pointer', fontSize: 18 }}>
                    📷
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Categoría</label>
                <select style={INP} value={fullForm.categoria} onChange={e => setFullForm(f => ({ ...f, categoria: e.target.value as Producto['categoria'] }))}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {([['precio_venta', 'Precio venta ($)'], ['precio_costo', 'Precio costo ($)'], ['precio_mayorista', 'Precio mayorista ($)'], ['stock', 'Stock'], ['stock_minimo', 'Stock mínimo']] as [string, string][]).map(([k, l]) => (
                  <div key={k}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>{l}</label>
                    <input type="number" min="0" style={INP}
                      value={(fullForm as Record<string, unknown>)[k] as number || ''}
                      onChange={e => setFullForm(f => ({ ...f, [k]: +e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Unidad de medida</label>
                  <select style={INP} value={fullForm.unidad_medida || 'botella'} onChange={e => setFullForm(f => ({ ...f, unidad_medida: e.target.value as 'botella' | 'caja6' | 'caja12' }))}>
                    <option value="botella">Botella (×1)</option>
                    <option value="caja6">Caja ×6</option>
                    <option value="caja12">Caja ×12</option>
                  </select>
                </div>
                {empresa === 'aroma' && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>WooCommerce ID</label>
                    <input type="number" style={INP}
                      value={fullForm.woo_product_id || ''}
                      onChange={e => setFullForm(f => ({ ...f, woo_product_id: +e.target.value || undefined }))}
                      placeholder="Dejar vacío si no aplica" />
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, position: 'sticky', bottom: 0, background: T.surface }}>
              <button onClick={() => setFullEditId(null)} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={saveFullEdit} disabled={saving} className="btn-wine" style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New product modal ─────────────────────────────────────── */}
      {newModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => e.target === e.currentTarget && setNewModal(false)}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border2}`, width: '100%', maxWidth: 600, boxShadow: '0 20px 60px rgba(26,18,16,0.18)', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: T.surface, zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Nuevo producto</h2>
              <button onClick={() => setNewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20 }}>×</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Nombre *</label>
                <input autoFocus style={INP} value={newForm.nombre} onChange={e => setNewForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Gran Reserva Malbec" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {([['bodega', 'Bodega', 'new-bod'], ['varietal', 'Varietal', ''], ['region', 'Región', ''], ['sku', 'SKU', '']] as [string, string, string][]).map(([k, l, dl]) => (
                  <div key={k}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>{l}</label>
                    <input style={INP} list={dl || undefined}
                      value={(newForm as Record<string, unknown>)[k] as string}
                      onChange={e => setNewForm(f => ({ ...f, [k]: e.target.value }))} />
                    {dl && <datalist id={dl}>{bodegas.map(b => <option key={b.id} value={b.nombre} />)}</datalist>}
                  </div>
                ))}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Categoría</label>
                <select style={INP} value={newForm.categoria} onChange={e => setNewForm(f => ({ ...f, categoria: e.target.value as Producto['categoria'] }))}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {([['precio_venta', 'Precio venta ($)'], ['precio_costo', 'Precio costo ($)'], ['precio_mayorista', 'Precio mayorista ($)'], ['stock', 'Stock'], ['stock_minimo', 'Stock mínimo']] as [string, string][]).map(([k, l]) => (
                  <div key={k}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>{l}</label>
                    <input type="number" min="0" style={INP}
                      value={(newForm as Record<string, unknown>)[k] as number}
                      onChange={e => setNewForm(f => ({ ...f, [k]: +e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Unidad de medida</label>
                  <select style={INP} value={newForm.unidad_medida || 'botella'} onChange={e => setNewForm(f => ({ ...f, unidad_medida: e.target.value as 'botella' | 'caja6' | 'caja12' }))}>
                    <option value="botella">Botella (×1)</option>
                    <option value="caja6">Caja ×6</option>
                    <option value="caja12">Caja ×12</option>
                  </select>
                </div>
                {empresa === 'aroma' && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>WooCommerce ID</label>
                    <input type="number" style={INP}
                      value={newForm.woo_product_id || ''} onChange={e => setNewForm(f => ({ ...f, woo_product_id: +e.target.value || undefined }))}
                      placeholder="Dejar vacío si no aplica" />
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, position: 'sticky', bottom: 0, background: T.surface }}>
              <button onClick={() => setNewModal(false)} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={saveNew} disabled={saving} className="btn-wine" style={{ background: T.wine, color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WooCommerce import modal ───────────────────────────────── */}
      {importModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => e.target === e.currentTarget && setImportModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, padding: 24, width: '100%', maxWidth: 900, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexShrink: 0 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Importar desde WooCommerce</h2>
                {!importLoading && <p style={{ margin: '3px 0 0', fontSize: 12, color: T.muted }}>
                  {wooList.length} productos · <span style={{ color: T.green, fontWeight: 600 }}>{wooList.filter(p => !p.ya_importado).length} nuevos</span>
                </p>}
              </div>
              <button onClick={() => setImportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20 }}>×</button>
            </div>
            {importLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.dim }}>Cargando desde la web...</div>
            ) : <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexShrink: 0, alignItems: 'center' }}>
                <label style={{ display: 'flex', gap: 5, fontSize: 12, color: T.muted, cursor: 'pointer', alignItems: 'center' }}>
                  <input type="checkbox" checked={soloNuevos} onChange={e => setSoloNuevos(e.target.checked)} style={{ accentColor: T.wine }} />
                  Solo nuevos
                </label>
                <button onClick={() => setWooSel(new Set(wooList.filter(p => !p.ya_importado).map(p => p.woo_product_id)))} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Sel. todos</button>
                <button onClick={() => setWooSel(new Set())} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: T.dim, cursor: 'pointer', fontFamily: 'inherit' }}>Limpiar</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ position: 'sticky', top: 0, background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                    <tr>{['', 'Nombre', 'Bodega', 'Varietal', 'Categoría', 'Precio', 'Stock', 'Estado'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, color: T.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {wooList.filter(p => !soloNuevos || !p.ya_importado).map(p => (
                      <tr key={p.woo_product_id} className="tr" style={{ borderBottom: `1px solid ${T.border}`, opacity: p.ya_importado ? 0.5 : 1 }}>
                        <td style={{ padding: '8px 12px' }}><input type="checkbox" disabled={p.ya_importado} checked={wooSel.has(p.woo_product_id)} onChange={() => setWooSel(s => { const n = new Set(s); n.has(p.woo_product_id) ? n.delete(p.woo_product_id) : n.add(p.woo_product_id); return n })} style={{ accentColor: T.wine }} /></td>
                        <td style={{ padding: '8px 12px', maxWidth: 220 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, color: T.text }}>{p.nombre}</div></td>
                        <td style={{ padding: '8px 12px', color: T.muted }}>{p.bodega || '—'}</td>
                        <td style={{ padding: '8px 12px', color: T.muted }}>{p.varietal || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>{p.categoria && <span style={{ ...BADGE_BASE, ...catBadge(p.categoria) }}>{p.categoria}</span>}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: T.text }}>{p.precio_venta > 0 ? `$${p.precio_venta.toLocaleString('es-AR')}` : <span style={{ color: T.dim }}>—</span>}</td>
                        <td style={{ padding: '8px 12px', color: T.muted }}>{p.stock}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ ...BADGE_BASE, ...(p.ya_importado ? { background: T.bg, color: T.dim, border: `1px solid ${T.border}` } : { background: T.greenBg, color: T.green, border: `1px solid ${T.greenBd}` }) }}>
                            {p.ya_importado ? 'Importado' : 'Nuevo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: T.muted }}>{wooSel.size} seleccionados</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setImportModal(false)} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                  <button onClick={importarWoo} disabled={importando || wooSel.size === 0} className="btn-wine" style={{ background: T.wine, color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (importando || wooSel.size === 0) ? 0.5 : 1 }}>
                    {importando ? 'Importando...' : `Importar ${wooSel.size}`}
                  </button>
                </div>
              </div>
            </>}
          </div>
        </div>
      )}

      {/* ── Lista de precios modal ────────────────────────────────── */}
      {listaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24, overflowY: 'auto' }}
          onClick={e => e.target === e.currentTarget && setListaModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, padding: 28, width: '100%', maxWidth: 720, boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Armar lista de precios</h2>
              <button onClick={() => setListaModal(false)} style={{ background: 'none', border: 'none', color: T.dim, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* Buscador */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input
                style={{ ...INP, paddingRight: 32 }}
                placeholder="Buscar y agregar producto..."
                value={listaQuery}
                onChange={e => { setListaQuery(e.target.value); setListaSugsOpen(true) }}
                onFocus={() => setListaSugsOpen(true)}
                onBlur={() => setTimeout(() => setListaSugsOpen(false), 150)}
                autoComplete="off"
              />
              {listaSugsOpen && listaQuery && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(26,18,16,0.12)', maxHeight: 280, overflowY: 'auto', marginTop: 4 }}>
                  {productos
                    .filter(p => p.precio_venta > 0 && !listaItems.find(i => i.id === p.id) &&
                      `${p.nombre} ${p.bodega} ${p.varietal}`.toLowerCase().includes(listaQuery.toLowerCase()))
                    .slice(0, 20)
                    .map(p => (
                      <div key={p.id} onMouseDown={() => listaAgregarProducto(p)}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        className="lista-sug">
                        <div>
                          <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{p.nombre}</div>
                          <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{[p.bodega, p.varietal].filter(Boolean).join(' · ')}</div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>${p.precio_venta.toLocaleString('es-AR')}</div>
                      </div>
                    ))}
                  {productos.filter(p => p.precio_venta > 0 && !listaItems.find(i => i.id === p.id) &&
                    `${p.nombre} ${p.bodega} ${p.varietal}`.toLowerCase().includes(listaQuery.toLowerCase())).length === 0 && (
                    <div style={{ padding: '14px', fontSize: 12, color: T.dim, textAlign: 'center' }}>Sin resultados</div>
                  )}
                </div>
              )}
            </div>

            {/* Tabla de items */}
            {listaItems.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: T.dim, fontSize: 13 }}>Buscá productos para armar la lista</div>
            ) : (
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
                      {['Producto', 'Bodega', 'Varietal', 'Precio', 'Mayorista', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', fontSize: 11, color: T.dim, fontWeight: 700, textAlign: h === 'Precio' || h === 'Mayorista' ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {listaItems.map((item, i) => (
                      <tr key={item.id} className="tr" style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 14px', color: T.text, fontWeight: 500 }}>{item.nombre}</td>
                        <td style={{ padding: '10px 14px', color: T.muted, fontSize: 12 }}>{item.bodega || '—'}</td>
                        <td style={{ padding: '10px 14px', color: T.muted, fontSize: 12 }}>{item.varietal || '—'}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: T.green }}>${item.precio_venta.toLocaleString('es-AR')}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: T.muted, fontSize: 12 }}>{item.precio_mayorista ? '$' + item.precio_mayorista.toLocaleString('es-AR') : '—'}</td>
                        <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                          <button onClick={() => setListaItems(prev => prev.filter((_, j) => j !== i))}
                            style={{ background: 'none', border: 'none', color: T.dim, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: T.dim }}>{listaItems.length} producto{listaItems.length !== 1 ? 's' : ''}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setListaModal(false)} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button onClick={imprimirLista} disabled={listaItems.length === 0} className="btn-wine"
                  style={{ background: T.wine, color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: listaItems.length === 0 ? 0.4 : 1 }}>
                  Imprimir lista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Actualización masiva de precios ──────────────────────── */}
      {masivModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setMasivModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Actualización masiva de precios</h2>
              <button onClick={() => setMasivModal(false)} style={{ background: 'none', border: 'none', color: T.dim, fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: T.dim, marginBottom: 4, fontWeight: 600 }}>BODEGA (opcional)</div>
                <select value={masivBodega} onChange={e => setMasivBodega(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, background: T.surface }}>
                  <option value="">Todas las bodegas</option>
                  {bodegasUnicas.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.dim, marginBottom: 4, fontWeight: 600 }}>CATEGORÍA (opcional)</div>
                <select value={masivCat} onChange={e => setMasivCat(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, background: T.surface }}>
                  <option value="">Todas</option>
                  {['Tinto','Blanco','Rosado','Espumante','Otro'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: T.dim, marginBottom: 4, fontWeight: 600 }}>OPERACIÓN</div>
                <select value={masivDir} onChange={e => setMasivDir(e.target.value as 'subir'|'bajar')}
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, background: T.surface }}>
                  <option value="subir">Subir</option>
                  <option value="bajar">Bajar</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.dim, marginBottom: 4, fontWeight: 600 }}>TIPO</div>
                <select value={masivTipo} onChange={e => setMasivTipo(e.target.value as 'pct'|'fijo')}
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, background: T.surface }}>
                  <option value="pct">Porcentaje %</option>
                  <option value="fijo">Monto fijo $</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.dim, marginBottom: 4, fontWeight: 600 }}>{masivTipo === 'pct' ? 'PORCENTAJE' : 'MONTO'}</div>
                <input type="number" min={0} value={masivValor} onChange={e => setMasivValor(e.target.value)}
                  placeholder={masivTipo === 'pct' ? '10' : '1000'}
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, background: T.surface, boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ background: masivAfectados.length > 0 ? T.greenBg : T.redBg, border: `1px solid ${masivAfectados.length > 0 ? 'rgba(45,122,79,0.25)' : 'rgba(192,48,48,0.25)'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13 }}>
              <strong style={{ color: masivAfectados.length > 0 ? T.green : T.red }}>{masivAfectados.length} productos</strong>
              <span style={{ color: T.muted }}> se van a actualizar
                {masivValor ? ` (${masivDir === 'subir' ? '+' : '-'}${masivValor}${masivTipo === 'pct' ? '%' : '$'})` : ''}</span>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setMasivModal(false)} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={aplicarMasivo} disabled={masivGuardando || masivAfectados.length === 0 || !masivValor}
                style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: T.wine, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (masivGuardando || masivAfectados.length === 0 || !masivValor) ? 0.5 : 1 }}>
                {masivGuardando ? 'Actualizando...' : `Aplicar a ${masivAfectados.length} productos`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 13, padding: '10px 18px', borderRadius: 10, boxShadow: '0 8px 24px rgba(26,18,16,0.12)', zIndex: 300, animation: 'popIn 150ms ease' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
