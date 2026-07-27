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
- **Estado:** Aroma tiene certificado emitido y funcionando en prod. La Vid tiene
  `lavid.csr`/`lavid.key` generados pero **sin certificado emitido todavía** — el botón de
  facturar no va a andar para La Vid hasta tramitar el `.crt` en AFIP y cargar
  `AFIP_CERT_LAVID`/`AFIP_CUIT_LAVID`/`AFIP_PTO_VTA_LAVID` en `.env.local` (y en Vercel).

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
