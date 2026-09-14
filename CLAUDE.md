# gestion-vinoteca2

Next.js 14 + TypeScript + Supabase. Gestión integral (ventas, compras, stock/depósito,
cta cte, cheques, comisiones, CRM, facturación electrónica) para dos empresas de vinos
que comparten la misma base de datos y UI:

- **Aroma de Vid** (`empresa: 'aroma'`) — CUIT 20-26600984-5
- **La Vid Consultora S.R.L.** (`empresa: 'lavid'`) — CUIT 30-71762144-8

El toggle de empresa activa se guarda en `localStorage` (`empresa`) y se lee en casi
todas las páginas de `src/app/(app)/*` para filtrar datos y cambiar tema/logo
(bordó=Aroma, azul=La Vid — ver `src/app/(app)/layout.tsx`).

## Facturación electrónica AFIP

- `src/lib/afip/wsaa.ts` — login/TA (ticket de acceso), firma el TRA con cert+key (p7 CMS).
- `src/lib/afip/wsfe.ts` — pide el CAE (`solicitarCAE`), consulta último comprobante autorizado.
- `src/app/api/afip/factura/route.ts` — endpoint que llama el botón "Facturar".
- `afip-certs/` — CSR/key/crt por empresa (`aroma.*`, `lavid.*`). El `.crt` lo emite AFIP
  a partir del `.csr`; no se genera localmente.
- Env vars por empresa: `AFIP_CERT_{AROMA,LAVID}`, `AFIP_KEY_{AROMA,LAVID}`,
  `AFIP_CUIT_{AROMA,LAVID}`, `AFIP_PTO_VTA_{AROMA,LAVID}`. `AFIP_ENV=prod` (ya en producción,
  no homologación).
- **Estado:** Aroma y La Vid tienen certificado emitido y funcionando en prod (login WSAA
  verificado para ambas). Punto de venta: Aroma=7, La Vid=5 (de los dos habilitados en AFIP
  para La Vid — 4 y 5 — la gestora confirmó que el 5 es el que usa este sistema).

## Financiero (ganancia real / costo de oportunidad)

- `/financiero` (`src/app/(app)/financiero/page.tsx`) + `src/app/api/financiero/route.ts` —
  "ganancia real" = margen nominal (venta - costo actual, igual que Reportes) menos el
  **costo de oportunidad** de la plata que queda inmovilizada mientras se cobra: ventas a
  crédito (cta. cte.) que tardan, y cheques recibidos en cartera hasta su fecha de pago.
- Ese costo se mide con la **inflación mensual (INDEC)** acumulada entre la venta y el
  cobro efectivo (o hoy, si sigue pendiente) — la lógica del índice vive en
  `src/lib/inflacion.ts`.
- La serie de inflación se sincroniza desde `api.argentinadatos.com` (pública, gratis, sin
  key) vía `POST /api/inflacion/sync`, y se guarda en la tabla `indices_inflacion` (crear
  con `sql/2026-09-indices-inflacion.sql`, una sola vez, en Supabase > SQL Editor). El mes
  en curso (que INDEC aún no publicó) se puede cargar a mano (`PUT /api/inflacion`,
  fuente='manual') — al sincronizar de nuevo, el valor real de INDEC lo reemplaza.
- Alcance v1: la erosión de cta. cte. cubre ventas del período con un cargo de cta. cte.
  asociado, no la "deuda cargada a mano" (sin una venta ni fecha de origen limpia detrás)
  — para el saldo completo de esa deuda, Aging/Cobranzas sigue siendo la fuente de verdad.

## Health Stack

- typecheck: tsc --noEmit
- lint: next lint
- test: (sin test runner configurado)

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- "revisá la web", "cómo mejorarla", "hay algo roto" → invoke /investigate (bugs concretos) or /health (dashboard de calidad general)
- Estética/UX/diseño → invoke /design-review
- Probar que un flujo funcione → invoke /qa
- Revisión de código antes de commitear → invoke /review
- Pipeline completo de revisión (CEO + diseño + ingeniería) → invoke /autoplan
- Ideas nuevas / brainstorming de producto → invoke /office-hours
- Ship/deploy → invoke /ship o /land-and-deploy
