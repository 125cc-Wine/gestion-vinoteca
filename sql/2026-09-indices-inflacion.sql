-- Serie de inflación mensual (INDEC), usada por /financiero para medir el
-- costo de oportunidad de la plata inmovilizada en cta. cte. y cheques
-- recibidos: cuánto poder de compra pierde un peso que se cobra tarde.
--
-- Se sincroniza automáticamente desde api.argentinadatos.com (fuente
-- pública, gratuita, sin API key — ver /api/inflacion/sync), que replica los
-- valores oficiales de INDEC. El mes en curso (que INDEC todavía no publicó)
-- se puede cargar a mano como estimación provisoria (fuente='manual') y
-- luego, cuando /api/inflacion/sync corre de nuevo y INDEC ya lo publicó, el
-- valor real lo pisa automáticamente.
CREATE TABLE IF NOT EXISTS indices_inflacion (
  mes DATE PRIMARY KEY,                  -- primer día del mes, ej '2026-08-01'
  valor_mensual DECIMAL(6,3) NOT NULL,   -- % de inflación mensual, ej 1.7
  fuente TEXT NOT NULL DEFAULT 'indec' CHECK (fuente IN ('indec', 'manual')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_indices_inflacion_mes ON indices_inflacion(mes);
