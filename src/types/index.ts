export type Empresa = 'aroma' | 'lavid'

export interface Producto {
  id?: string
  empresa: Empresa
  nombre: string
  bodega: string
  varietal: string
  categoria: 'Tinto' | 'Blanco' | 'Rosado' | 'Espumante' | 'Otro'
  region?: string
  sku?: string
  precio_venta: number
  precio_mayorista?: number
  precio_costo?: number
  stock: number
  stock_minimo: number
  woo_product_id?: number
  unidad_medida?: 'botella' | 'caja6' | 'caja12'
  activo: boolean
  created_at?: string
  updated_at?: string
}

export interface Vendedor {
  id?: string
  empresa: Empresa
  nombre: string
  activo: boolean
  created_at?: string
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
  tipo: 'consumidor_final' | 'revendedor' | 'mayorista' | 'gastronomia' | 'otro'
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

export interface VentaItem {
  producto_id?: string
  nombre: string
  cantidad: number
  precio_unitario: number
  descuento?: number
  subtotal: number
}

export interface Venta {
  id?: string
  empresa: Empresa
  numero?: string
  tipo: 'presupuesto' | 'remito' | 'factura'
  cliente_id?: string
  cliente_nombre: string
  vendedor_nombre?: string
  items: VentaItem[]
  subtotal: number
  descuento: number
  total: number
  estado: 'borrador' | 'emitido' | 'pagado' | 'cancelado'
  estado_pago?: 'pagado' | 'pendiente' | 'cuenta_corriente'
  notas?: string
  condicion_venta?: string
  created_at?: string
}

export interface Pedido {
  id?: string
  empresa: Empresa
  numero?: string
  cliente_id?: string
  cliente_nombre: string
  vendedor_nombre?: string
  items: VentaItem[]
  subtotal: number
  descuento: number
  total: number
  estado: 'pendiente' | 'confirmado' | 'entregado' | 'cancelado'
  notas?: string
  condicion_venta?: string
  venta_id?: string
  created_at?: string
}

export type MedioPago =
  | 'Efectivo'
  | 'Tarjeta Débito'
  | 'Tarjeta Crédito'
  | 'QR'
  | 'MercadoPago'
  | 'Transferencia'
  | 'Cta.Cte.'

export interface MovimientoCaja {
  id?: string
  empresa: Empresa
  tipo: 'ingreso' | 'egreso'
  concepto: string
  monto: number
  fecha: string
  categoria?: string
  medio_pago?: MedioPago
  referencia_id?: string
  created_at?: string
}

export interface MovimientoCtaCte {
  id?: string
  empresa: Empresa
  cliente_id: string
  cliente_nombre?: string
  tipo: 'cobro' | 'cargo'
  concepto: string
  monto: number
  fecha: string
  created_at?: string
}
