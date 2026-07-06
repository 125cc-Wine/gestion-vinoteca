# gestion-vinoteca2

Next.js 14 + TypeScript + Supabase.

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
