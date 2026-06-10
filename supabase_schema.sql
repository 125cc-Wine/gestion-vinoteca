-- =============================================
-- SCHEMA: Sistema de Gestión Vinoteca
-- Ejecutar en Supabase > SQL Editor
-- =============================================

-- Productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa TEXT NOT NULL CHECK (empresa IN ('aroma', 'lavid')),
  nombre TEXT NOT NULL,
  bodega TEXT,
  varietal TEXT,
  categoria TEXT DEFAULT 'Tinto' CHECK (categoria IN ('Tinto', 'Blanco', 'Rosado', 'Espumante', 'Otro')),
  anada TEXT,
  region TEXT,
  sku TEXT,
  precio_venta DECIMAL(12,2) DEFAULT 0,
  precio_costo DECIMAL(12,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 3,
  woo_product_id INTEGER,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa TEXT NOT NULL CHECK (empresa IN ('aroma', 'lavid')),
  nombre TEXT NOT NULL,
  apellido TEXT,
  razon_social TEXT,
  cuit TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  tipo TEXT DEFAULT 'consumidor_final' CHECK (tipo IN ('consumidor_final', 'revendedor', 'mayorista')),
  saldo DECIMAL(12,2) DEFAULT 0,
  limite_credito DECIMAL(12,2) DEFAULT 0,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa TEXT NOT NULL CHECK (empresa IN ('aroma', 'lavid')),
  nombre TEXT NOT NULL,
  razon_social TEXT,
  cuit TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  contacto TEXT,
  saldo DECIMAL(12,2) DEFAULT 0,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ventas / Comprobantes
CREATE TABLE IF NOT EXISTS ventas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa TEXT NOT NULL CHECK (empresa IN ('aroma', 'lavid')),
  numero TEXT,
  tipo TEXT DEFAULT 'presupuesto' CHECK (tipo IN ('presupuesto', 'remito', 'factura')),
  cliente_id UUID REFERENCES clientes(id),
  cliente_nombre TEXT NOT NULL DEFAULT 'Consumidor Final',
  items JSONB DEFAULT '[]',
  subtotal DECIMAL(12,2) DEFAULT 0,
  descuento DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'emitido', 'pagado', 'cancelado')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Caja / Movimientos
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa TEXT NOT NULL CHECK (empresa IN ('aroma', 'lavid')),
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  concepto TEXT NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  fecha DATE DEFAULT CURRENT_DATE,
  categoria TEXT,
  referencia_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para updated_at en productos
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON productos(empresa);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa);
CREATE INDEX IF NOT EXISTS idx_proveedores_empresa ON proveedores(empresa);
CREATE INDEX IF NOT EXISTS idx_ventas_empresa ON ventas(empresa);
CREATE INDEX IF NOT EXISTS idx_caja_empresa ON movimientos_caja(empresa);
CREATE INDEX IF NOT EXISTS idx_caja_fecha ON movimientos_caja(fecha);
