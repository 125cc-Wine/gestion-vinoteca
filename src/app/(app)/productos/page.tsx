'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Producto } from '@/types'
import BarcodeScanner from '@/components/BarcodeScanner'
import BarcodeNotFoundModal from '@/components/BarcodeNotFoundModal'
import * as XLSX from 'xlsx'
import { useBarcodeInput } from '@/hooks/useBarcodeInput'

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

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
  unidad_medida: 'botella' as 'botella' | 'caja4' | 'caja6' | 'caja12',
  woo_product_id: undefined as number | undefined,
}

interface WooPreview {
  woo_product_id: number; nombre: string; sku: string
  bodega: string; varietal: string; region: string
  categoria: string; precio_venta: number; stock: number; ya_importado: boolean
}

interface HistorialPrecio {
  id: string
  producto_id: string
  empresa: string
  precio_venta_anterior: number | null
  precio_venta_nuevo: number | null
  precio_costo_anterior: number | null
  precio_costo_nuevo: number | null
  created_at: string
  usuario?: string | null
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
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

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
  const [reactivando, setReactivando] = useState(false)
  const [syncMenu, setSyncMenu]     = useState(false)
  const [syncConfirm, setSyncConfirm] = useState<'stock'|'precio'|'ambos'|null>(null)
  const [vinculando, setVinculando] = useState(false)
  // Preview de la vinculación por nombre (productos ya cargados sin woo_product_id).
  // Guarda el resumen + la lista de pares propuestos y los conflictos, para
  // poder elegir a mano cuáles vincular.
  interface VincPar { supabaseId: string; nombre: string; wooId: number; wooNombre: string }
  const [vincModal, setVincModal] = useState(false)
  const [vincResumen, setVincResumen] = useState<null | {
    se_pueden_vincular: number; conflictos: number; sin_match_en_web: number; productos_sin_vincular: number
  }>(null)
  const [vincPares, setVincPares] = useState<VincPar[]>([])
  const [vincConflictos, setVincConflictos] = useState<{ nombre: string; motivo: string }[]>([])
  const [vincSel, setVincSel] = useState<Set<string>>(new Set())
  // Modo manual: asignar a mano el par de cada producto sin match.
  const [vincTab, setVincTab] = useState<'auto' | 'manual'>('auto')
  const [vincSinMatch, setVincSinMatch] = useState<{ supabaseId: string; nombre: string }[]>([])
  const [vincWooLibres, setVincWooLibres] = useState<{ wooId: number; nombre: string }[]>([])
  // Producto del sistema seleccionado para asignarle par, y filtros de búsqueda.
  const [manualSel, setManualSel] = useState<{ supabaseId: string; nombre: string } | null>(null)
  const [manualFiltroSis, setManualFiltroSis] = useState('')
  const [manualFiltroWeb, setManualFiltroWeb] = useState('')

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
  const [masivCampo, setMasivCampo]         = useState<'precio_venta'|'precio_costo'>('precio_venta')
  const [masivBodega, setMasivBodega]       = useState('')
  const [masivCat, setMasivCat]             = useState('')
  const [masivTipo, setMasivTipo]           = useState<'pct'|'fijo'>('pct')
  const [masivValor, setMasivValor]         = useState('')
  const [masivDir, setMasivDir]             = useState<'subir'|'bajar'>('subir')
  const [masivCostoModo, setMasivCostoModo] = useState<'pct_venta'|'variacion'|'fijo'>('pct_venta')
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

    if (masivCampo === 'precio_costo') {
      // Costo: Supabase directo en batches de 20 en paralelo (sin WooCommerce)
      const updates = masivAfectados.map(p => {
        let nuevo: number
        if (masivCostoModo === 'pct_venta') {
          nuevo = Math.round((p.precio_venta || 0) * (val / 100))
        } else if (masivCostoModo === 'variacion') {
          const base = p.precio_costo || 0
          nuevo = masivDir === 'subir'
            ? Math.round(base * (1 + val / 100))
            : Math.max(0, Math.round(base * (1 - val / 100)))
        } else {
          nuevo = Math.round(val)
        }
        return { id: p.id, nuevo }
      })
      const BATCH = 20
      let ok = 0
      for (let i = 0; i < updates.length; i += BATCH) {
        const chunk = updates.slice(i, i + BATCH)
        const results = await Promise.all(
          chunk.map(({ id, nuevo }) =>
            supabase.from('productos').update({ precio_costo: nuevo }).eq('id', id)
          )
        )
        ok += results.filter(r => !r.error).length
      }
      setMasivGuardando(false)
      setMasivModal(false)
      await cargar(empresa)
      toast_(`${ok} productos actualizados`)
      return
    }

    // precio_venta: API con WooCommerce sync
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

  // Tabs
  const [activeTab, setActiveTab] = useState<'catalogo' | 'rentabilidad'>('catalogo')

  // Catálogo sort
  const [sortCampo, setSortCampo] = useState<'nombre' | 'precio_venta' | 'precio_costo' | 'stock' | ''>('')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc')

  // Rentabilidad sort
  const [rentSort, setRentSort]     = useState<'margen_pct' | 'margen_abs' | 'precio_venta' | 'nombre'>('margen_pct')
  const [rentDir, setRentDir]       = useState<'asc' | 'desc'>('desc')
  const [rentBodega, setRentBodega] = useState('')

  // WooCommerce import modal
  const [importModal, setImportModal]       = useState(false)
  const [importLoading, setImportLoading]   = useState(false)
  const [wooList, setWooList]               = useState<WooPreview[]>([])
  const [wooSel, setWooSel]                 = useState<Set<number>>(new Set())
  const [soloNuevos, setSoloNuevos]         = useState(true)
  const [importando, setImportando]         = useState(false)

  // Historial de precios modal
  const [historialModal, setHistorialModal]       = useState(false)
  const [historialProducto, setHistorialProducto] = useState<{ id: string; nombre: string } | null>(null)
  const [historialData, setHistorialData]         = useState<HistorialPrecio[]>([])
  const [historialLoading, setHistorialLoading]   = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)

  // ── Computed (declared before effects so closures capture them) ───────────
  const filtrados = (() => {
    const base = productos.filter(p => {
      const q = normalize(busqueda)
      if (q && !normalize(`${p.nombre}${p.bodega}${p.varietal}`).includes(q)) return false
      if (filtroCategoria && p.categoria !== filtroCategoria) return false
      if (filtroBodega && p.bodega !== filtroBodega) return false
      if (filtroSinPrecio && (p.precio_venta || 0) > 0) return false
      return true
    })
    if (!sortCampo) return base
    return [...base].sort((a, b) => {
      let va: number | string = sortCampo === 'nombre' ? (a.nombre ?? '') : (a[sortCampo] ?? 0)
      let vb: number | string = sortCampo === 'nombre' ? (b.nombre ?? '') : (b[sortCampo] ?? 0)
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
  })()
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
    // Solo al montar: cargar() se reusa en handlers con el empresa/args del momento;
    // ponerla en deps la re-dispararia en cada render (cambia de identidad).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function cargar(emp: string, incluirInactivos = mostrarInactivos) {
    setLoading(true)
    const [pRes, bRes] = await Promise.all([
      fetch(`/api/productos?empresa=${emp}&activo=${incluirInactivos ? 'false' : 'true'}`),
      fetch('/api/bodegas'),
    ])
    setProductos(await pRes.json().catch(() => []))
    setBodegas(await bRes.json().catch(() => []))
    setLoading(false)
  }

  async function reactivarUno(id: string) {
    const res = await fetch('/api/productos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, activo: true }) })
    if (!res.ok) { toast_('Error al reactivar'); return }
    cargar(empresa); toast_('Producto reactivado')
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

  async function reactivarProductos() {
    if (!confirm('¿Reactivar todos los productos inactivos?')) return
    setReactivando(true)
    const res = await fetch('/api/admin/reactivar-productos', { method: 'POST' })
    const data = await res.json()
    setReactivando(false)
    if (data.error) { toast_('Error: ' + data.error); return }
    toast_(data.mensaje)
    cargar(empresa)
  }

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
      const res = await fetch('/api/productos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: prod.id, codigo_barras: code }) })
      if (!res.ok) { toast_('Error al guardar el código de barras'); return }
      toast_(`Código ${code} guardado en "${prod.nombre}"`)
    }
    // Agrega el producto al estado si no estaba (ej: era inactivo cuando cargó la página)
    setProductos(prev => {
      const idx = prev.findIndex(p => p.id === prod.id)
      if (idx >= 0) return prev.map(p => p.id === prod.id ? { ...p, codigo_barras: code } : p)
      return [...prev, { ...prod, codigo_barras: code }]
    })
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
      unidad_medida: (p.unidad_medida || 'botella') as 'botella'|'caja4'|'caja6'|'caja12',
      woo_product_id: p.woo_product_id })
    setActiveRow(p.id!)
  }

  function openNew() {
    setNewForm({ ...EMPTY_EDIT, empresa })
    setNewModal(true)
  }

  // Incrementa el número final del SKU (ej: "MR003" -> "MR004", "11921" -> "11922"),
  // saltando SKUs ya usados. Si el SKU no termina en números, no hay forma de
  // calcular un "siguiente" — se deja en blanco para que lo asignen a mano.
  function siguienteSku(sku: string, existentes: Set<string>): string {
    const m = sku.match(/^(.*?)(\d+)$/)
    if (!m) return ''
    const [, prefix, digits] = m
    let n = parseInt(digits, 10) + 1
    let candidato = prefix + String(n).padStart(digits.length, '0')
    let guard = 0
    while (existentes.has(candidato) && guard < 500) {
      n++
      candidato = prefix + String(n).padStart(digits.length, '0')
      guard++
    }
    return candidato
  }

  function duplicarProducto(p: Producto) {
    const existentes = new Set(productos.map(x => x.sku).filter(Boolean) as string[])
    const nuevoSku = p.sku ? siguienteSku(p.sku, existentes) : ''
    setNewForm({
      nombre: p.nombre, bodega: p.bodega, varietal: p.varietal, categoria: p.categoria,
      region: p.region || '', sku: nuevoSku, codigo_barras: '',
      precio_venta: p.precio_venta || 0, precio_mayorista: p.precio_mayorista || 0,
      precio_costo: p.precio_costo || 0, stock: 0, stock_minimo: p.stock_minimo,
      unidad_medida: (p.unidad_medida || 'botella') as 'botella' | 'caja4' | 'caja6' | 'caja12',
      woo_product_id: undefined,
      empresa,
    })
    setNewModal(true)
    toast_(nuevoSku ? `Duplicado — SKU sugerido: ${nuevoSku}` : 'Duplicado — asigná un SKU')
  }

  function openFullEdit(p: Producto) {
    setFullForm({
      nombre: p.nombre, bodega: p.bodega, varietal: p.varietal, categoria: p.categoria,
      region: p.region||'', sku: p.sku||'', codigo_barras: p.codigo_barras||'',
      precio_venta: p.precio_venta||0, precio_mayorista: p.precio_mayorista||0,
      precio_costo: p.precio_costo||0, stock: p.stock, stock_minimo: p.stock_minimo,
      unidad_medida: (p.unidad_medida||'botella') as 'botella'|'caja4'|'caja6'|'caja12',
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
    if (!confirm('¿Desactivar este producto en ambas empresas? No se borra — deja de aparecer en el catálogo y en las alertas de stock/precio, y podés reactivarlo cuando quieras desde "Ver desactivados".')) return
    await fetch(`/api/productos?id=${id}`, { method: 'DELETE' })
    cargar(empresa); toast_('Desactivado')
  }

  async function eliminarSel() {
    if (!confirm(`¿Desactivar ${seleccionados.size} producto${seleccionados.size!==1?'s':''} en ambas empresas? No se borran, podés reactivarlos después.`)) return
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

  async function openHistorial(p: Producto) {
    setHistorialProducto({ id: p.id!, nombre: p.nombre })
    setHistorialData([])
    setHistorialLoading(true)
    setHistorialModal(true)
    const { data } = await supabase
      .from('historial_precios')
      .select('*')
      .eq('producto_id', p.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setHistorialData((data as HistorialPrecio[]) || [])
    setHistorialLoading(false)
  }

  async function syncWoo(mode: 'stock' | 'precio' | 'ambos') {
    setSyncConfirm(null)
    setSyncing(true)
    const res = await fetch('/api/woo/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
    const d = await res.json()
    setSyncing(false)
    if (!res.ok || d.error) { toast_('Error de sync: ' + (d.error ?? `HTTP ${res.status}`)); return }
    toast_(`Sync ${mode}: ${d.ok} ok${d.errors ? `, ${d.errors} errores` : ''}`)
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

  // Paso 1: trae los pares propuestos (sistema -> web) y los conflictos.
  // No modifica nada. Abre el modal con todo preseleccionado.
  async function previewVincular() {
    setVinculando(true)
    try {
      const res = await fetch('/api/woo/vincular')
      const d = await res.json()
      if (!res.ok || d.error) { toast_('Error: ' + (d.error ?? `HTTP ${res.status}`)); setVinculando(false); return }
      const pares: VincPar[] = d.vincular ?? []
      setVincResumen(d.resumen)
      setVincPares(pares)
      setVincConflictos(d.conflictos ?? [])
      setVincSel(new Set(pares.map(p => p.supabaseId)))
      setVincSinMatch(d.sinMatch ?? [])
      setVincWooLibres(d.wooLibres ?? [])
      setVincTab(pares.length > 0 ? 'auto' : 'manual')
      setManualSel(null); setManualFiltroSis(''); setManualFiltroWeb('')
      setVincModal(true)
    } catch { toast_('Error de red') }
    setVinculando(false)
  }

  // Asigna a mano un producto del sistema a un producto de la web.
  async function asignarManual(supabaseId: string, nombre: string, wooId: number) {
    setVinculando(true)
    try {
      const res = await fetch('/api/woo/vincular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: [{ supabaseId, wooId }] }),
      })
      const d = await res.json()
      if (!res.ok || d.error || !d.vinculados) { toast_('Error: ' + (d.error ?? 'no se pudo vincular')); setVinculando(false); return }
      // Sacar el producto de la lista de sin-match y el par de web-libres.
      setVincSinMatch(l => l.filter(p => p.supabaseId !== supabaseId))
      setVincWooLibres(l => l.filter(w => w.wooId !== wooId))
      setManualSel(null); setManualFiltroWeb('')
      cargar(empresa)
      toast_(`Vinculado: ${nombre}`)
    } catch { toast_('Error de red') }
    setVinculando(false)
  }

  // Paso 2: aplica solo los pares seleccionados (setea woo_product_id).
  async function aplicarVincular() {
    const ids = vincPares.filter(p => vincSel.has(p.supabaseId)).map(p => p.supabaseId)
    if (!ids.length) { toast_('Nada seleccionado'); return }
    setVinculando(true)
    try {
      const res = await fetch('/api/woo/vincular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const d = await res.json()
      if (!res.ok || d.error) { toast_('Error: ' + (d.error ?? `HTTP ${res.status}`)); setVinculando(false); return }
      setVincModal(false)
      cargar(empresa)
      toast_(`${d.vinculados} productos vinculados${d.errores?.length ? ` · ${d.errores.length} errores` : ''}`)
    } catch { toast_('Error de red') }
    setVinculando(false)
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

  // ── Rentabilidad computed ─────────────────────────────────────────────────
  const rentConCosto   = productos.filter(p => (p.precio_costo ?? 0) > 0 && (p.precio_venta ?? 0) > 0)
  const rentSinCosto   = productos.filter(p => !p.precio_costo || p.precio_costo === 0)
  const rentMargenPcts = rentConCosto.map(p => (p.precio_venta - p.precio_costo!) / p.precio_costo! * 100)
  const rentAvgMargen  = rentMargenPcts.length ? rentMargenPcts.reduce((a, v) => a + v, 0) / rentMargenPcts.length : 0
  const rentTopProd    = rentConCosto.length ? rentConCosto.reduce((best, p) => {
    const m  = (p.precio_venta - p.precio_costo!) / p.precio_costo! * 100
    const bm = (best.precio_venta - best.precio_costo!) / best.precio_costo! * 100
    return m > bm ? p : best
  }) : null
  const rentFiltered = productos.filter(p => !rentBodega || p.bodega === rentBodega)
  const rentSorted   = [...rentFiltered].sort((a, b) => {
    const hasCostoA = (a.precio_costo ?? 0) > 0
    const hasCostoB = (b.precio_costo ?? 0) > 0
    if (!hasCostoA && hasCostoB) return 1
    if (hasCostoA && !hasCostoB) return -1
    function gAbs(p: Producto) { return (p.precio_venta || 0) - (p.precio_costo || 0) }
    function gPct(p: Producto) { return (!p.precio_costo || p.precio_costo === 0) ? -Infinity : (p.precio_venta - p.precio_costo) / p.precio_costo * 100 }
    let va = 0, vb = 0
    if (rentSort === 'margen_pct')    { va = gPct(a);            vb = gPct(b) }
    else if (rentSort === 'margen_abs') { va = gAbs(a);          vb = gAbs(b) }
    else if (rentSort === 'precio_venta') { va = a.precio_venta || 0; vb = b.precio_venta || 0 }
    else { return rentDir === 'asc' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre) }
    return rentDir === 'asc' ? va - vb : vb - va
  })
  function rentThClick(field: 'margen_pct' | 'margen_abs' | 'precio_venta' | 'nombre') {
    if (rentSort === field) setRentDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setRentSort(field); setRentDir('desc') }
  }
  function rentMargenBadge(pct: number): React.CSSProperties {
    if (pct >= 30) return { background: T.greenBg, color: T.green, border: `1px solid ${T.greenBd}` }
    if (pct >= 15) return { background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBd}` }
    return { background: T.redBg, color: T.red, border: `1px solid ${T.redBd}` }
  }

  // ── Bulk popover config ───────────────────────────────────────────────────
  const BULK_ACTIONS = [
    { key: 'bodega',          label: 'Bodega',    kind: 'select' as const },
    { key: 'varietal',        label: 'Varietal',  kind: 'text'   as const },
    { key: 'aumento_precio',  label: '+ %',       kind: 'number' as const, placeholder: 'Ej: 10' },
    { key: 'precio_fijo',     label: 'Precio $',  kind: 'number' as const, placeholder: 'Ej: 15000' },
    { key: 'costo_fijo',      label: 'Costo $',   kind: 'number' as const, placeholder: 'Ej: 8000' },
    { key: 'costo_pct_venta', label: 'Costo %',   kind: 'number' as const, placeholder: 'Ej: 50' },
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
            <button onClick={previewVincular} disabled={vinculando} className="btn-row" title="Vincula productos ya cargados que no tienen woo_product_id, matcheando por nombre con la web" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: vinculando ? 'default' : 'pointer', fontFamily: 'inherit', opacity: vinculando ? 0.6 : 1 }}>{vinculando ? '…' : 'Vincular web'}</button>
            <div style={{ position: 'relative' }}>
              <button
                disabled={syncing}
                onClick={() => setSyncMenu(v => !v)}
                className="btn-row"
                style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: syncing ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, opacity: syncing ? 0.6 : 1 }}>
                {syncing ? '…' : 'Sync Woo'} <span style={{ fontSize: 10 }}>▾</span>
              </button>
              {syncMenu && !syncing && (
                <div
                  onMouseLeave={() => setSyncMenu(false)}
                  style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 200, minWidth: 180, overflow: 'hidden' }}>
                  {([
                    ['stock',  '📦 Sync Stock',         'Actualiza el stock en WooCommerce'],
                    ['precio', '💰 Sync Precio',         'Actualiza los precios en WooCommerce'],
                    ['ambos',  '🔄 Sync Stock + Precio', 'Actualiza stock y precios'],
                  ] as const).map(([mode, label, desc]) => (
                    <button key={mode} onClick={() => { setSyncMenu(false); setSyncConfirm(mode) }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer', fontFamily: 'inherit' }}
                      onMouseEnter={e => (e.currentTarget.style.background = T.bg)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{label}</div>
                      <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>{desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>}
          <button onClick={calcularCostos} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }} title="Calcula precio_costo = 50% precio_venta para los que no tienen costo">Calc. costos</button>
          <button onClick={exportarExcel} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Exportar Excel</button>
          <button onClick={() => { setMasivBodega(''); setMasivCat(''); setMasivValor(''); setMasivDir('subir'); setMasivModal(true) }} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Actualiz. masiva</button>
          <button onClick={abrirListaModal} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Lista precios</button>
          <button onClick={reactivarProductos} disabled={reactivando} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: reactivando ? 'default' : 'pointer', fontFamily: 'inherit', opacity: reactivando ? 0.6 : 1 }}>{reactivando ? '...' : '↺ Reactivar'}</button>
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

      {/* ── Tab nav ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
        {([['catalogo', 'Catálogo'], ['rentabilidad', 'Rentabilidad']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', padding: '8px 18px 10px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', color: activeTab === tab ? T.wine : T.muted,
              borderBottom: activeTab === tab ? `2px solid ${T.wine}` : '2px solid transparent',
              marginBottom: -1, transition: 'color 0.12s, border-color 0.12s',
            }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: activeTab === 'catalogo' ? undefined : 'none' }}>

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
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.muted, cursor: 'pointer', flexShrink: 0 }}
          title="Productos desactivados — no aparecen en el catálogo ni en las alertas de stock/precio">
          <input type="checkbox" checked={mostrarInactivos}
            onChange={e => { setMostrarInactivos(e.target.checked); cargar(empresa, e.target.checked) }} />
          Ver desactivados
        </label>
        <select style={{ ...INP, width: 'auto', minWidth: 160 }}
          value={sortCampo ? `${sortCampo}_${sortDir}` : ''}
          onChange={e => {
            const v = e.target.value
            if (!v) { setSortCampo(''); return }
            const OPTS: Record<string, { campo: typeof sortCampo; dir: typeof sortDir }> = {
              'nombre_asc':        { campo: 'nombre',        dir: 'asc'  },
              'nombre_desc':       { campo: 'nombre',        dir: 'desc' },
              'precio_venta_asc':  { campo: 'precio_venta',  dir: 'asc'  },
              'precio_venta_desc': { campo: 'precio_venta',  dir: 'desc' },
              'precio_costo_asc':  { campo: 'precio_costo',  dir: 'asc'  },
              'precio_costo_desc': { campo: 'precio_costo',  dir: 'desc' },
              'stock_asc':         { campo: 'stock',         dir: 'asc'  },
              'stock_desc':        { campo: 'stock',         dir: 'desc' },
            }
            const o = OPTS[v]; if (o) { setSortCampo(o.campo); setSortDir(o.dir) }
          }}>
          <option value="">Ordenar por...</option>
          <option value="nombre_asc">Nombre A → Z</option>
          <option value="nombre_desc">Nombre Z → A</option>
          <option value="precio_venta_asc">Precio ↑</option>
          <option value="precio_venta_desc">Precio ↓</option>
          <option value="precio_costo_asc">Costo ↑</option>
          <option value="precio_costo_desc">Costo ↓</option>
          <option value="stock_asc">Stock ↑</option>
          <option value="stock_desc">Stock ↓</option>
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
                    {a.key === 'aumento_precio' ? 'Aumentar precio (%)' : a.key === 'precio_fijo' ? 'Precio de venta fijo ($)' : a.key === 'costo_fijo' ? 'Precio de costo fijo ($)' : a.key === 'costo_pct_venta' ? 'Costo = X% del precio de venta' : `Asignar ${a.label}`}
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
                      <input type="number" step="any" style={INP_SM}
                        value={editForm.precio_venta || ''} onChange={e => { const pv = parseFloat(e.target.value) || 0; setEditForm(f => ({ ...f, precio_venta: pv, precio_costo: f.precio_costo || Math.round(pv * 0.5) })) }}
                        placeholder="$ venta"
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }} />
                      <input type="number" step="any" style={INP_SM}
                        value={editForm.precio_costo || ''} onChange={e => setEditForm(f => ({ ...f, precio_costo: parseFloat(e.target.value) || 0 }))}
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
                      <select style={INP_SM} value={editForm.unidad_medida || 'botella'} onChange={e => setEditForm(f => ({ ...f, unidad_medida: e.target.value as 'botella' | 'caja4' | 'caja6' | 'caja12' }))}>
                        <option value="botella">Botella</option>
                        <option value="caja4">Caja ×4</option>
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
                      {mostrarInactivos ? (
                        <button onClick={() => reactivarUno(p.id!)} className="btn-row" style={{ background: T.greenBg, border: `1px solid rgba(45,122,79,0.28)`, color: T.green, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} title="Reactivar — vuelve a aparecer en el catálogo y en las alertas">↺ Reactivar</button>
                      ) : (
                        <>
                          <button onClick={() => openHistorial(p)} className="btn-row" style={{ background: 'none', border: `1px solid transparent`, color: T.green, borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: 0.8, transition: 'opacity 0.1s' }} title="Historial de precios" onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}>📈</button>
                          <button onClick={() => openEdit(p)} className="btn-row" style={{ background: 'none', border: `1px solid transparent`, color: T.dim, borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }} title="Editar (E)">✏</button>
                          <button onClick={() => duplicarProducto(p)} style={{ background: 'none', border: `1px solid transparent`, color: T.blue, borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: 0.85 }} title="Duplicar producto">⧉</button>
                          <button onClick={() => { localStorage.setItem('etiqueta_prefill', JSON.stringify(p)); window.location.href = '/etiquetas' }} style={{ background: 'none', border: `1px solid transparent`, color: T.gold, borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: 0.85 }} title="Imprimir etiqueta">🏷️</button>
                          <button onClick={() => eliminarUno(p.id!)} style={{ background: 'none', border: `1px solid transparent`, color: T.red, borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: 0.7, transition: 'opacity 0.1s' }} title="Desactivar — deja de aparecer en catálogo, stock y alertas, pero no se borra. Podés reactivarlo con 'Ver desactivados'" onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}>✕</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      </div>{/* end catalogo tab */}

      <div style={{ display: activeTab === 'rentabilidad' ? undefined : 'none' }}>
        {/* KPIs rentabilidad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(26,18,16,0.04)' }}>
            <div style={{ fontSize: 10, color: T.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Margen promedio</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: rentAvgMargen >= 30 ? T.green : rentAvgMargen >= 15 ? T.amber : T.red }}>
              {rentConCosto.length ? rentAvgMargen.toFixed(1) + '%' : '—'}
            </div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>sobre {rentConCosto.length} prods. con costo</div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(26,18,16,0.04)' }}>
            <div style={{ fontSize: 10, color: T.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Mayor margen</div>
            {rentTopProd ? <>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.green }}>
                {((rentTopProd.precio_venta - rentTopProd.precio_costo!) / rentTopProd.precio_costo! * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rentTopProd.nombre}</div>
            </> : <div style={{ fontSize: 15, color: T.dim }}>—</div>}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(26,18,16,0.04)' }}>
            <div style={{ fontSize: 10, color: T.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Sin precio costo</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: rentSinCosto.length > 0 ? T.amber : T.green }}>{rentSinCosto.length}</div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>sin costo cargado</div>
          </div>
        </div>

        {/* Filtro bodega rentabilidad */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <select style={{ ...INP, width: 'auto', minWidth: 180 }} value={rentBodega} onChange={e => setRentBodega(e.target.value)}>
            <option value="">Todas las bodegas</option>
            {bodegasUnicas.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <span style={{ fontSize: 12, color: T.dim }}>{rentSorted.length} producto{rentSorted.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Tabla rentabilidad */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(26,18,16,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                <th onClick={() => rentThClick('nombre')} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: rentSort === 'nombre' ? T.wine : T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', userSelect: 'none' }}>
                  Nombre{rentSort === 'nombre' ? (rentDir === 'desc' ? ' ↓' : ' ↑') : ''}
                </th>
                <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>Bodega</th>
                <th onClick={() => rentThClick('precio_venta')} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: rentSort === 'precio_venta' ? T.wine : T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', userSelect: 'none' }}>
                  Precio venta{rentSort === 'precio_venta' ? (rentDir === 'desc' ? ' ↓' : ' ↑') : ''}
                </th>
                <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}` }}>Precio costo</th>
                <th onClick={() => rentThClick('margen_abs')} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: rentSort === 'margen_abs' ? T.wine : T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', userSelect: 'none' }}>
                  Margen ${rentSort === 'margen_abs' ? (rentDir === 'desc' ? ' ↓' : ' ↑') : ''}
                </th>
                <th onClick={() => rentThClick('margen_pct')} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: rentSort === 'margen_pct' ? T.wine : T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', userSelect: 'none' }}>
                  Margen %{rentSort === 'margen_pct' ? (rentDir === 'desc' ? ' ↓' : ' ↑') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '56px 0', color: T.dim }}>Cargando...</td></tr>
              ) : rentSorted.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '56px 0', color: T.dim }}>Sin productos</td></tr>
              ) : rentSorted.map(p => {
                const hasCosto  = (p.precio_costo ?? 0) > 0
                const margenAbs = hasCosto ? (p.precio_venta || 0) - (p.precio_costo ?? 0) : null
                const margenPct = hasCosto ? ((p.precio_venta || 0) - (p.precio_costo ?? 0)) / (p.precio_costo ?? 1) * 100 : null
                return (
                  <tr key={p.id} className="tr" style={{ borderBottom: `1px solid ${T.border}`, opacity: hasCosto ? 1 : 0.7 }}>
                    <td style={{ padding: '11px 16px', maxWidth: 280 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                      {p.sku && <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>{p.sku}</div>}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: T.muted }}>{p.bodega || <span style={{ color: T.dim }}>—</span>}</td>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: T.text }}>
                      {p.precio_venta ? `$${p.precio_venta.toLocaleString('es-AR')}` : <span style={{ color: T.dim }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: T.muted }}>
                      {hasCosto
                        ? `$${(p.precio_costo ?? 0).toLocaleString('es-AR')}`
                        : <span style={{ ...BADGE_BASE, background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBd}`, fontSize: 10 }}>Sin costo</span>}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: margenAbs !== null && margenAbs >= 0 ? T.green : T.red }}>
                      {margenAbs !== null ? `$${margenAbs.toLocaleString('es-AR')}` : <span style={{ color: T.dim }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      {margenPct !== null
                        ? <span style={{ ...BADGE_BASE, ...rentMargenBadge(margenPct) }}>{margenPct.toFixed(1)}%</span>
                        : <span style={{ color: T.dim, fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>{/* end rentabilidad tab */}

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
                    <input type="number" min="0" style={INP} placeholder="0"
                      value={(fullForm as Record<string, unknown>)[k] as number || ''}
                      onChange={e => setFullForm(f => ({ ...f, [k]: +e.target.value || 0 }))} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Unidad de medida</label>
                  <select style={INP} value={fullForm.unidad_medida || 'botella'} onChange={e => setFullForm(f => ({ ...f, unidad_medida: e.target.value as 'botella' | 'caja4' | 'caja6' | 'caja12' }))}>
                    <option value="botella">Botella (×1)</option>
                    <option value="caja4">Caja ×4</option>
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
                    <input type="number" min="0" style={INP} placeholder="0"
                      value={((newForm as Record<string, unknown>)[k] as number) || ''}
                      onChange={e => setNewForm(f => ({ ...f, [k]: +e.target.value || 0 }))} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Unidad de medida</label>
                  <select style={INP} value={newForm.unidad_medida || 'botella'} onChange={e => setNewForm(f => ({ ...f, unidad_medida: e.target.value as 'botella' | 'caja4' | 'caja6' | 'caja12' }))}>
                    <option value="botella">Botella (×1)</option>
                    <option value="caja4">Caja ×4</option>
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

      {/* ── Modal vincular por nombre (lista de pares + seleccion manual) ── */}
      {vincModal && vincResumen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && !vinculando && setVincModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, width: '100%', maxWidth: 720, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            {/* header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: `1px solid ${T.border}` }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>🔗 Vincular productos con la web</h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: T.muted }}>
                  <span style={{ color: T.green, fontWeight: 600 }}>{vincPares.length} pares por nombre</span>
                  {vincResumen.conflictos > 0 && <> · <span style={{ color: T.dim }}>{vincResumen.conflictos} conflictos</span></>}
                  {' '}· {vincResumen.sin_match_en_web} sin match
                </p>
              </div>
              <button onClick={() => setVincModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 20 }}>×</button>
            </div>

            {/* pestañas Auto / Manual */}
            <div style={{ display: 'flex', gap: 4, padding: '10px 24px 0', borderBottom: `1px solid ${T.border}` }}>
              {([['auto', `Automático (${vincPares.length})`], ['manual', `Manual (${vincSinMatch.length})`]] as const).map(([id, label]) => (
                <button key={id} onClick={() => setVincTab(id)} style={{ background: 'none', border: 'none', borderBottom: `2px solid ${vincTab === id ? T.wine : 'transparent'}`, color: vincTab === id ? T.text : T.muted, fontWeight: vincTab === id ? 700 : 500, fontSize: 13, padding: '6px 10px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
              ))}
            </div>

            {/* ── TAB AUTOMÁTICO ── */}
            {vincTab === 'auto' && (vincPares.length === 0 && vincConflictos.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 14 }}>
                No hay pares automáticos. Probá el modo <strong>Manual</strong> para asignarlos vos. 🔗
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 24px', borderBottom: `1px solid ${T.border}` }}>
                  <button onClick={() => setVincSel(new Set(vincPares.map(p => p.supabaseId)))} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Sel. todos</button>
                  <button onClick={() => setVincSel(new Set())} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: T.dim, cursor: 'pointer', fontFamily: 'inherit' }}>Limpiar</button>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: T.muted }}>{vincSel.size} seleccionados</span>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, background: T.surface }}>
                        <th style={{ padding: '8px 12px 8px 24px', width: 36 }}></th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>En el sistema</th>
                        <th style={{ padding: '8px 12px', width: 24 }}></th>
                        <th style={{ padding: '8px 24px 8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>En la web</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vincPares.map(p => (
                        <tr key={p.supabaseId} className="tr" style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}
                          onClick={() => setVincSel(s => { const n = new Set(s); n.has(p.supabaseId) ? n.delete(p.supabaseId) : n.add(p.supabaseId); return n })}>
                          <td style={{ padding: '8px 12px 8px 24px' }}>
                            <input type="checkbox" checked={vincSel.has(p.supabaseId)} onChange={() => {}} style={{ accentColor: T.wine, pointerEvents: 'none' }} />
                          </td>
                          <td style={{ padding: '8px 12px', color: T.text }}>{p.nombre}</td>
                          <td style={{ padding: '8px 12px', color: T.dim, textAlign: 'center' }}>→</td>
                          <td style={{ padding: '8px 24px 8px 12px', color: T.muted }}>{p.wooNombre} <span style={{ color: T.dim, fontSize: 11 }}>#{p.wooId}</span></td>
                        </tr>
                      ))}
                      {vincConflictos.map((c, i) => (
                        <tr key={'c' + i} style={{ borderBottom: `1px solid ${T.border}`, opacity: 0.6 }}>
                          <td style={{ padding: '8px 12px 8px 24px', textAlign: 'center' }}>⚠️</td>
                          <td style={{ padding: '8px 12px', color: T.text }}>{c.nombre}</td>
                          <td></td>
                          <td style={{ padding: '8px 24px 8px 12px', color: T.dim, fontSize: 12, fontStyle: 'italic' }}>{c.motivo} — revisar a mano</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderTop: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.dim }}>Solo rellena el ID vacío. No pisa datos ni crea duplicados.</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setVincModal(false)} disabled={vinculando} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                    <button onClick={aplicarVincular} disabled={vinculando || vincSel.size === 0} className="btn-wine" style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (vinculando || vincSel.size === 0) ? 0.5 : 1 }}>
                      {vinculando ? 'Vinculando…' : `Vincular ${vincSel.size}`}
                    </button>
                  </div>
                </div>
              </>
            ))}

            {/* ── TAB MANUAL ── */}
            {vincTab === 'manual' && (
              <div style={{ display: 'flex', flex: 1, minHeight: 320, overflow: 'hidden' }}>
                {/* Columna izquierda: productos del sistema sin vincular */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${T.border}` }}>
                  <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}>
                    <input value={manualFiltroSis} onChange={e => setManualFiltroSis(e.target.value)} placeholder="Buscar producto del sistema…"
                      style={{ width: '100%', padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit', background: T.surface, color: T.text }} />
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {vincSinMatch.filter(p => p.nombre.toLowerCase().includes(manualFiltroSis.toLowerCase())).slice(0, 300).map(p => (
                      <div key={p.supabaseId} onClick={() => { setManualSel(p); setManualFiltroWeb('') }}
                        style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer', borderBottom: `1px solid ${T.border}`, background: manualSel?.supabaseId === p.supabaseId ? T.bg : 'transparent', color: manualSel?.supabaseId === p.supabaseId ? T.wine : T.text, fontWeight: manualSel?.supabaseId === p.supabaseId ? 600 : 400 }}>
                        {p.nombre}
                      </div>
                    ))}
                    {vincSinMatch.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: T.dim, fontSize: 13 }}>No quedan productos sin vincular 🎉</div>}
                  </div>
                </div>

                {/* Columna derecha: candidatos de la web */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {!manualSel ? (
                    <div style={{ padding: 32, textAlign: 'center', color: T.dim, fontSize: 13, margin: 'auto' }}>
                      ← Elegí un producto del sistema para asignarle su par en la web.
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Par para: <strong style={{ color: T.wine }}>{manualSel.nombre}</strong></div>
                        <input value={manualFiltroWeb} onChange={e => setManualFiltroWeb(e.target.value)} placeholder="Buscar producto de la web…" autoFocus
                          style={{ width: '100%', padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit', background: T.surface, color: T.text }} />
                      </div>
                      <div style={{ overflowY: 'auto', flex: 1 }}>
                        {vincWooLibres.filter(w => w.nombre.toLowerCase().includes(manualFiltroWeb.toLowerCase())).slice(0, 300).map(w => (
                          <div key={w.wooId} onClick={() => !vinculando && asignarManual(manualSel.supabaseId, manualSel.nombre, w.wooId)}
                            style={{ padding: '8px 16px', fontSize: 13, cursor: vinculando ? 'default' : 'pointer', borderBottom: `1px solid ${T.border}`, color: T.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            className="lista-sug">
                            <span>{w.nombre} <span style={{ color: T.dim, fontSize: 11 }}>#{w.wooId}</span></span>
                            <span style={{ color: T.green, fontSize: 12, fontWeight: 600 }}>Vincular</span>
                          </div>
                        ))}
                        {vincWooLibres.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: T.dim, fontSize: 13 }}>No hay productos de la web disponibles.</div>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── WooCommerce import modal ───────────────────────────────── */}
      {/* ── Modal confirmación sync WooCommerce ── */}
      {syncConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.45)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setSyncConfirm(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>
              {syncConfirm === 'stock' ? '📦' : syncConfirm === 'precio' ? '💰' : '🔄'}
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: T.text }}>
              Confirmar sync — {syncConfirm === 'stock' ? 'Stock' : syncConfirm === 'precio' ? 'Precio' : 'Stock + Precio'}
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
              {syncConfirm === 'stock' && 'Se actualizará el stock de todos los productos vinculados a WooCommerce con los valores actuales de Supabase.'}
              {syncConfirm === 'precio' && 'Se actualizarán los precios de todos los productos vinculados a WooCommerce con los valores actuales de Supabase.'}
              {syncConfirm === 'ambos' && 'Se actualizarán el stock y los precios de todos los productos vinculados a WooCommerce con los valores actuales de Supabase.'}
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 12, color: T.dim, background: T.bg, borderRadius: 8, padding: '8px 12px' }}>
              Solo afecta productos con <strong>WooCommerce ID</strong> asignado. No modifica nada en Supabase.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setSyncConfirm(null)}
                style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button onClick={() => syncWoo(syncConfirm)}
                style={{ background: T.wine, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Confirmar sync
              </button>
            </div>
          </div>
        </div>
      )}

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
                      normalize(`${p.nombre} ${p.bodega} ${p.varietal}`).includes(normalize(listaQuery)))
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
                    normalize(`${p.nombre} ${p.bodega} ${p.varietal}`).includes(normalize(listaQuery))).length === 0 && (
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

      {/* ── Actualización masiva de precios / costos ─────────────── */}
      {masivModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,16,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setMasivModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(26,18,16,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Actualización masiva</h2>
              <button onClick={() => setMasivModal(false)} style={{ background: 'none', border: 'none', color: T.dim, fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>

            {/* Toggle campo */}
            <div style={{ display: 'flex', background: T.bg, borderRadius: 9, padding: 3, marginBottom: 20, gap: 3 }}>
              {([['precio_venta', 'Precio de venta'], ['precio_costo', 'Precio de costo']] as const).map(([v, l]) => (
                <button key={v} onClick={() => { setMasivCampo(v); setMasivValor('') }}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all 0.12s',
                    background: masivCampo === v ? T.wine : 'transparent',
                    color: masivCampo === v ? '#fff' : T.muted }}>
                  {l}
                </button>
              ))}
            </div>

            {/* Filtros — comunes a ambos campos */}
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

            {/* Controles PRECIO VENTA */}
            {masivCampo === 'precio_venta' && (
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
            )}

            {/* Controles PRECIO COSTO */}
            {masivCampo === 'precio_costo' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: T.dim, marginBottom: 6, fontWeight: 600 }}>MODO DE CÁLCULO</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {([
                    ['pct_venta',  '% del precio de venta', 'Ej: 50% → costo = precio_venta × 0.50'],
                    ['variacion',  'Variación % sobre costo actual', 'Subir o bajar el costo existente'],
                    ['fijo',       'Valor fijo $', 'Establecer un monto exacto'],
                  ] as const).map(([v, l, desc]) => (
                    <label key={v} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '9px 12px', borderRadius: 8,
                      background: masivCostoModo === v ? T.wineBg : T.bg,
                      border: `1px solid ${masivCostoModo === v ? T.wineBd : T.border}` }}>
                      <input type="radio" name="costoModo" value={v} checked={masivCostoModo === v}
                        onChange={() => { setMasivCostoModo(v); setMasivValor('') }}
                        style={{ marginTop: 2, accentColor: T.wine }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{l}</div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: masivCostoModo === 'variacion' ? '1fr 1fr' : '1fr', gap: 10 }}>
                  {masivCostoModo === 'variacion' && (
                    <div>
                      <div style={{ fontSize: 11, color: T.dim, marginBottom: 4, fontWeight: 600 }}>OPERACIÓN</div>
                      <select value={masivDir} onChange={e => setMasivDir(e.target.value as 'subir'|'bajar')}
                        style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, background: T.surface }}>
                        <option value="subir">Subir</option>
                        <option value="bajar">Bajar</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 11, color: T.dim, marginBottom: 4, fontWeight: 600 }}>
                      {masivCostoModo === 'pct_venta' ? 'PORCENTAJE DEL PRECIO DE VENTA' : masivCostoModo === 'variacion' ? 'PORCENTAJE' : 'MONTO FIJO $'}
                    </div>
                    <input type="number" min={0} max={masivCostoModo === 'pct_venta' ? 100 : undefined}
                      value={masivValor} onChange={e => setMasivValor(e.target.value)}
                      placeholder={masivCostoModo === 'fijo' ? '5000' : '50'}
                      style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, background: T.surface, boxSizing: 'border-box' }} />
                  </div>
                </div>
                {masivCostoModo === 'pct_venta' && masivValor && (
                  <div style={{ marginTop: 8, fontSize: 12, color: T.muted }}>
                    Ejemplo: producto $10.000 → costo ${Math.round(10000 * parseFloat(masivValor) / 100).toLocaleString('es-AR')}
                  </div>
                )}
              </div>
            )}

            <div style={{ background: masivAfectados.length > 0 ? T.greenBg : T.redBg, border: `1px solid ${masivAfectados.length > 0 ? 'rgba(45,122,79,0.25)' : 'rgba(192,48,48,0.25)'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13 }}>
              <strong style={{ color: masivAfectados.length > 0 ? T.green : T.red }}>{masivAfectados.length} productos</strong>
              <span style={{ color: T.muted }}> se van a actualizar</span>
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

      {/* ── Historial de precios modal ────────────────────────────── */}
      {historialModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setHistorialModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14, width: '100%', maxWidth: 780, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(26,18,16,0.22)' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Historial de precios</h2>
                {historialProducto && (
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 560 }}>
                    {historialProducto.nombre}
                  </p>
                )}
              </div>
              <button onClick={() => setHistorialModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 22, lineHeight: 1, flexShrink: 0, marginLeft: 16 }}>×</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
              {historialLoading ? (
                <div style={{ padding: '56px 0', textAlign: 'center', color: T.dim, fontSize: 14 }}>Cargando historial...</div>
              ) : historialData.length === 0 ? (
                <div style={{ padding: '56px 0', textAlign: 'center', color: T.dim, fontSize: 14 }}>Sin historial de cambios</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ position: 'sticky', top: 0, background: T.bg, zIndex: 1 }}>
                    <tr>
                      {['Fecha', 'P. Venta anterior', 'P. Venta nuevo', 'Var. venta', 'P. Costo anterior', 'P. Costo nuevo', 'Var. costo'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Fecha' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historialData.map(h => {
                      const ventaAnterior = h.precio_venta_anterior ?? null
                      const ventaNuevo    = h.precio_venta_nuevo ?? null
                      const costoAnterior = h.precio_costo_anterior ?? null
                      const costoNuevo    = h.precio_costo_nuevo ?? null

                      const diffVenta = (ventaAnterior !== null && ventaNuevo !== null) ? ventaNuevo - ventaAnterior : null
                      const diffCosto = (costoAnterior !== null && costoNuevo !== null) ? costoNuevo - costoAnterior : null

                      function arrowCell(diff: number | null) {
                        if (diff === null) return <span style={{ color: T.dim }}>—</span>
                        if (diff > 0) return <span style={{ color: T.green, fontWeight: 700 }}>▲ ${diff.toLocaleString('es-AR')}</span>
                        if (diff < 0) return <span style={{ color: T.red, fontWeight: 700 }}>▼ ${Math.abs(diff).toLocaleString('es-AR')}</span>
                        return <span style={{ color: T.dim }}>= sin cambio</span>
                      }

                      return (
                        <tr key={h.id} className="tr" style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '11px 14px', color: T.muted, whiteSpace: 'nowrap' }}>
                            {new Date(h.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: T.dim }}>
                            {ventaAnterior !== null ? `$${ventaAnterior.toLocaleString('es-AR')}` : <span style={{ color: T.dim }}>—</span>}
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 600, color: T.text }}>
                            {ventaNuevo !== null ? `$${ventaNuevo.toLocaleString('es-AR')}` : <span style={{ color: T.dim }}>—</span>}
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>{arrowCell(diffVenta)}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', color: T.dim }}>
                            {costoAnterior !== null ? `$${costoAnterior.toLocaleString('es-AR')}` : <span style={{ color: T.dim }}>—</span>}
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 600, color: T.text }}>
                            {costoNuevo !== null ? `$${costoNuevo.toLocaleString('es-AR')}` : <span style={{ color: T.dim }}>—</span>}
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>{arrowCell(diffCosto)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: T.dim }}>
                {historialData.length > 0 ? `${historialData.length} registro${historialData.length !== 1 ? 's' : ''}` : ''}
              </span>
              <button onClick={() => setHistorialModal(false)} className="btn-row" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 20px', fontSize: 13, color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar</button>
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
