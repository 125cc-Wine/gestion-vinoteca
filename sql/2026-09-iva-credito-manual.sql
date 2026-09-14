-- IVA crédito fiscal declarado a mano, por empresa y mes — usado por
-- /financiero (pestaña IVA) para calcular el neto (débito - crédito).
--
-- El débito fiscal (IVA de lo que facturamos) SÍ se puede calcular solo con
-- los datos del sistema: toda venta con facturado=true tiene un CAE de AFIP
-- y el 21% ya se le calculó al pedirlo (ver /api/afip/factura). El crédito
-- fiscal (IVA de lo que compramos) NO se puede reconstruir así: el módulo de
-- Compras solo guarda el total final de cada compra, no si esa factura
-- discriminaba IVA ni cuánto — un proveedor monotributista (Factura C) no
-- genera crédito y hoy no queda registrado cuál es cuál. Hasta que Compras
-- trackee esto por comprobante, se carga a mano acá (el número que da el
-- contador/AFIP) para poder mostrar el neto real.
CREATE TABLE IF NOT EXISTS iva_credito_manual (
  empresa TEXT NOT NULL CHECK (empresa IN ('aroma', 'lavid')),
  mes DATE NOT NULL,                     -- primer día del mes, ej '2026-08-01'
  monto DECIMAL(12,2) NOT NULL DEFAULT 0,
  notas TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (empresa, mes)
);
