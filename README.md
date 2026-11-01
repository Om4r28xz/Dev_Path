# DevPath

Monorepo local React/Vite + Express + Skill Engine + PostgreSQL. Node 22.23.4 y pnpm 11.22.0.

Consulta [instalación y ejecución en PowerShell](docs/SETUP_LOCAL.md), [matriz de aceptación M1](docs/acceptance/M1-cases.md) y [estado del lote 03](docs/handoffs/lote-03.md).

```powershell
pnpm install --frozen-lockfile
node scripts/setup-local.mjs
```

La guía contiene migraciones/seed, modo desarrollo 5173, demo Compose 8080, configuración de auth y comprobaciones reales. Las pantallas base y health no equivalen a M1 completo. Las contribuciones se revisan por PR a develop; Omar realiza la integración.

Plan: [PLAN_DE_IMPLEMENTACION](docs/PLAN_DE_IMPLEMENTACION.md). Flujo: [FLUJO_GITHUB](docs/FLUJO_GITHUB.md).
