export type Empresa = 'aroma' | 'lavid'

export interface Producto {
  id?: string
  empresa: Empresa
  nombre: string
  bodega: string
  varietal: string
  categoria: 'Tinto' | 'Blanco' | 'Rosado' | 'Espumante' | 'Otro'
  añada?: string
  region?: string
  sku?: string
  precio_venta: number
  precio_costo?: number
  stock: number
  stock_minimo: number
  woo_product_id?: number
  activo: boolean
  created_at?: string
  updated_at?: string
}

export interface Cliente {
  id?: string
  empresa: Empresa
  nombre: string
  apellido?: string
  razon_social?: string
  cuit?: string
  email?: string
  telefono?: string
  direccion?: string
  tipo: 'consumidor_final' | 'revendedor' | 'mayorista'
  saldo: number
  limite_credito?: number
  notas?: string
  activo: boolean
  created_at?: string
}

export interface Proveedor {
  id?: string
  empresa: Empresa
  nombre: string
  razon_social?: string
  cuit?: string
  email?: string
  telefono?: string
  direccion?: string
  contacto?: string
  saldo: number
  notas?: string
  activo: boolean
  created_at?: string
}

export interface Venta {
  id?: string
  empresa: Empresa
  numero?: string
  tipo: 'presupuesto' | 'remito' | 'factura'
  cliente_id?: string
  cliente_nombre: string
  items: VentaItem[]
  subtotal: number
  descuento: number
  total: number
  estado: 'borrador' | 'emitido' | 'pagado' | 'cancelado'
  notas?: string
  created_at?: string
}

export interface VentaItem {
  producto_id?: string
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface MovimientoCaja {
  id?: string
  empresa: Empresa
  tipo: 'ingreso' | 'egreso'
  concepto: string
  monto: number
  fecha: string
  categoria?: string
  referencia_id?: string
  created_at?: string
}
