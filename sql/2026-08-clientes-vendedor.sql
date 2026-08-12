-- Permite asignar un vendedor a cada cliente (para poder filtrar/agrupar
-- Cuentas Corrientes por vendedor de calle, entre otros usos).
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES vendedores(id);
