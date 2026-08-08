-- Permite trackear cobros parciales sobre deudas cargadas a mano ("Cargar deuda"
-- en la ficha de cliente), para que entren al mismo reparto FIFO cronológico
-- que ya usan los remitos/presupuestos al cobrar un monto (Aging / Registrar cobro).
--
-- Los cargos YA EXISTENTES se dan por saldados (monto_pagado = monto) porque no
-- hay forma confiable de saber retroactivamente si ya fueron cubiertos por algún
-- cobro anterior — antes esos cobros los absorbían "en silencio" sin dejar
-- ningún rastro sobre el cargo puntual. De acá en más, los cargos nuevos van a
-- quedar bien trackeados (arrancan en monto_pagado = 0, pendientes de verdad).

ALTER TABLE movimientos_cta_cte ADD COLUMN IF NOT EXISTS monto_pagado NUMERIC(12,2) DEFAULT 0;

UPDATE movimientos_cta_cte SET monto_pagado = monto WHERE tipo = 'cargo';
