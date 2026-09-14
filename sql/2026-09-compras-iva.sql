-- IVA discriminado por compra — para que /financiero pueda calcular el
-- crédito fiscal SOLO con datos del sistema, en vez de cargarlo a mano
-- (ver sql/2026-09-iva-credito-manual.sql).
--
-- El formulario de "Cargar deuda / Nueva factura" (compras) ya calculaba
-- IVA 21% y Percepción IVA 3% para armar el total final, pero los tiraba —
-- solo se guardaba el total con todo adentro. Ahora se guardan por separado.
--
-- NULL (no 0) significa "no se sabe" — una compra cargada antes de este
-- cambio, o por el flujo de "cargar factura sobre una OC" (que todavía no
-- tiene el selector de IVA). 0 significa "se cargó con el selector y no
-- tenía IVA discriminado" (ej. proveedor monotributista) — un 0 real SÍ
-- cuenta como "mes cubierto", a diferencia de NULL.
ALTER TABLE compras ADD COLUMN IF NOT EXISTS monto_iva DECIMAL(12,2);
ALTER TABLE compras ADD COLUMN IF NOT EXISTS monto_perc_iva DECIMAL(12,2);
