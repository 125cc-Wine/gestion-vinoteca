-- Tabla para historial de movimientos de stock desde Depósito
-- Reemplaza el localStorage: visible en cualquier dispositivo

CREATE TABLE IF NOT EXISTS movimientos_stock (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa     text NOT NULL,
  nombre      text NOT NULL,
  delta       integer NOT NULL,
  nuevo_stock integer NOT NULL,
  modo        text NOT NULL CHECK (modo IN ('agregar', 'establecer')),
  producto_id uuid,
  created_at  timestamptz DEFAULT now()
);

-- Sin RLS (igual que el resto de las tablas del proyecto)
ALTER TABLE movimientos_stock DISABLE ROW LEVEL SECURITY;

-- Índice para acelerar las consultas por empresa
CREATE INDEX IF NOT EXISTS movimientos_stock_empresa_idx ON movimientos_stock (empresa, created_at DESC);
