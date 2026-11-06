# Candidato M4 — v0.4.0 (REL-04)

Base: `origin/develop` en `0a5439c` tras integrar `LRN-01` (`d001943`), `LRN-02` (`ac380d6`), `LRN-03` (`b74cec8`), `LRN-04` (`b4724e7`, PR #59), `QA-05` (`87e5c6d`, PR #61) y `DEP-01` (`0a5439c`). Rama: `release/0.4.0`.

## Alcance reproducible y estado del proyecto

- **Repositorio:** `https://github.com/Om4r28xz/Dev_Path`
- **Despliegue público:** no exigido (ejecución local reproducible mediante Docker Compose documentada en `docs/SETUP_LOCAL.md` y evaluada en `docs/DEPLOY_OPTIONS.md`).
- **Alcance de M4 (`v0.4.0`):** rutas de aprendizaje deterministas basadas en reglas y plantillas curadas (`packages/catalog/learning-templates.json` `1.0.0`, `generatorVersion: "rules-1"`), sin IA generativa ni promesas de empleo; progreso autodeclarado por paso (`pending`, `in_progress`, `completed`); conservación de actividad instantánea al eliminar proyectos vinculados y estado positivo claro cuando un análisis no tiene brechas.
- **Límites visibles conservados de M3:** `JOBS_PROVIDER_MODE=fixture`, `JOBS_LIVE_ENABLED=false` y `JOBS_LIVE_RETENTION_ALLOWED=false` permanecen por defecto; la autorización contractual de retención `live` sigue documentada como limitación abierta sin bloquear los flujos de M1–M4.

## Puertas técnicas

- [x] Ocho manifiestos privados del monorepo actualizados a `0.4.0`; versiones de OpenAPI (`public.yaml` `1.1.0`, `m2.yaml` `0.1.0`, `m3-proposed.yaml` `0.1.0`, `m4-proposed.yaml` `0.1.0`), catálogo (`1.0.0`), plantillas (`1.0.0`) y snapshots permanecen independientes.
- [x] `CHANGELOG.md` documenta el alcance de `0.4.0`, la publicación previa de `0.3.0` (`dae6c75`) y las limitaciones vigentes.
- [x] Migración real `0000`–`0005` (`v0.3.0`) → `0006` (`v0.4.0`) con preservación íntegra de datos sintéticos M1/M2/M3 y reejecución idempotente mediante `docs/acceptance/probes/m4-release-upgrade.mjs`.
- [x] Lint, formato, contratos (5 OpenAPI / 54 ejemplos), catálogo y plantillas acíclicas (10 tecnologías, 30 casos ES/EN, 10 plantillas y 3 casos de rutas), typecheck, build y suites unitarias/integración con PostgreSQL aislado (37 archivos, 311 pruebas incluyendo privacidad del Skill Engine, idempotencia y aislamiento entre cuentas).
- [x] E2E completo de extremo a extremo (16/16 pruebas Playwright incluyendo `tests/e2e/learning-paths.spec.ts`, `tests/e2e/m4-acceptance.spec.ts` y regresión M1/M2/M3) verificado localmente con PostgreSQL aislado y en CI con PostgreSQL 16.
- [x] Probe Compose (`docs/acceptance/probes/ops-compose.mjs`) ampliado para verificar creación y persistencia tras reinicio de ruta de aprendizaje M4 junto con M1/M2 y recuperación ante caída del Skill Engine en CI (`OPS M1 Compose runtime`).

## Puertas humanas y publicación

- [x] Emanuel (`cocotero64`) completó personalmente las seis verificaciones manuales de M4 con datos sintéticos y confirmó su aprobación sin defectos bloqueantes en `docs/acceptance/M4-results.md` (sin atribuir firmas a otros integrantes).
- [ ] Revisión del PR `release/0.4.0 → main` y comprobación de checks requeridos en GitHub Actions (`CI gate (required)` y `OPS M1 Compose runtime`).
- [ ] Merge commit autorizado de `release/0.4.0 → main`.
- [ ] Creación y push del tag anotado `v0.4.0` sobre el SHA final de `main` y publicación de la GitHub Release `v0.4.0`.
- [ ] Sincronización `main → develop` mediante PR con merge commit.
