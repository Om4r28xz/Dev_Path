# Handoff lote 10 — estado vigente

Fecha: 5 de noviembre de 2026.

Contratos y versiones consumidos: `packages/contracts/openapi/public.yaml` (`1.1.0`),
`packages/contracts/openapi/m2.yaml` (`0.1.0`), `packages/contracts/openapi/m3-proposed.yaml`
(`0.1.0`), `packages/contracts/openapi/m4-proposed.yaml` (`0.1.0`), catálogo `1.0.0`, contenido de
aprendizaje `1.0.0` y generador `rules-1`. Ocho manifiestos privados del monorepo actualizados a
`0.4.0` en `release/0.4.0`.

| Tarea  | Estado                                                                                                               | Evidencia / siguiente acción                                                                                                                                                                                                                                  |
| ------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LRN-04 | Integrada en `develop` mediante PR #59 (`b4724e7`)                                                                   | Cabeza `9d0dcd0` con todos los checks aprobados (`CI gate (required)`, `M1 E2E (Chromium + PostgreSQL 16)`, `Build`, `Type Check`, `Lint & Format`, `Test`, `Docs check`).                                                                                    |
| QA-05  | Integrada en `develop` mediante PR #61 (`87e5c6d`) y aceptada manualmente por Emanuel                                | Cabeza `eba2740` con CI y `M1 E2E (Chromium + PostgreSQL 16)` aprobados (`127598195279`, `127598740391`). Seis verificaciones manuales de M4 completadas y aprobadas personalmente por Emanuel en `docs/acceptance/M4-results.md` sin atribuir firmas ajenas. |
| REL-04 | Implementada sin merge en `release/0.4.0`; lista para PR hacia `main`, validación de CI/Compose y publicación humana | `CHANGELOG.md`, 8 manifiestos en `0.4.0`, `docs/release/M4-CANDIDATE-CHECKLIST.md`, `M4-PUBLICATION-PLAN.md`, `M4-ROLLBACK-PLAN.md`, `docs/acceptance/probes/m4-release-upgrade.mjs` y `ops-compose.mjs`. Pendiente merge a `main`, tag `v0.4.0` y sync.      |
| DEP-01 | Integrada en `develop` (`0a5439c`) por Zaid (`DEPREMU`); opcional y no bloqueante                                    | `docs/DEPLOY_OPTIONS.md` (`0a5439cb5a0e9f55b227d082d647856118117f68`) recomienda mantener la ejecución local reproducible mediante Docker Compose como opción oficial de costo cero garantizado.                                                              |

## LRN-04 — pantallas de ruta y avance

- Base verificada: `origin/develop` en `e9acc321141b2925f5112086f1c49760cf477451`; integrada en
  `b4724e72946236d84fe27314c0eda9bbc3f55ff4` (PR #59).
- Dependencias integradas: ANL-02, VIS-04, LRN-01, LRN-02 y LRN-03.
- Contrato consumido sin modificaciones:
  - `POST /api/v1/learning-paths` con `Idempotency-Key` UUID.
  - `GET /api/v1/learning-paths` y `GET /api/v1/learning-paths/:id`.
  - `PATCH /api/v1/learning-paths/:id/steps/:stepId`.
- La interfaz no agrega habilidades, no cambia el score y no presenta progreso como probabilidad de
  empleo. El cambio de estado solo se refleja después de una respuesta exitosa del servidor.
- Un proyecto eliminado conserva el texto de la actividad instantánea y se presenta sin enlace roto.
- La ruta sin brechas muestra un estado positivo con cero pasos, sin fabricar un plan.

## QA-05 — aceptación completa y regresión de entregas

- Integrada en `develop` mediante PR #61 (`87e5c6d8db5bef72255e26b7a3f90bff1bf01989`, cabeza
  `eba27404f0e99289d223cf1630f94a4731eb1d00`) con `M1 E2E (Chromium + PostgreSQL 16)` (`127598195279`)
  y `CI gate (required)` (`127598740391`) en verde.
- Emanuel (`cocotero64`) confirmó haber completado personalmente las seis verificaciones manuales de
  M4 con datos sintéticos (recorrido completo M4 + aislamiento entre cuentas, navegación por
  teclado y foco visible, zoom real al 200 %, contraste y legibilidad, utilidad de motivo/actividad y
  proyecto eliminado, y claridad del avance autodeclarado sin certificación ni garantía laboral),
  todas aprobadas sin defectos bloqueantes.
- El registro en `docs/acceptance/M4-results.md` atribuye únicamente la revisión ejecutada por
  Emanuel sin asignar firmas a otras personas (`P1`–`P4` u otros revisores).

## REL-04 — cerrar v0.4.0

- Rama: `release/0.4.0`, creada desde `develop` actualizado (`0a5439cb5a0e9f55b227d082d647856118117f68`).
- Archivos actualizados en `release/0.4.0`:
  - `CHANGELOG.md`
  - `package.json`, `apps/api/package.json`, `apps/skill-engine/package.json`, `apps/web/package.json`,
    `packages/catalog/package.json`, `packages/contracts/package.json`, `packages/db/package.json`,
    `packages/test-support/package.json` (`0.4.0`)
  - `docs/acceptance/M4-results.md`
  - `docs/acceptance/probes/m4-release-upgrade.mjs`
  - `docs/acceptance/probes/ops-compose.mjs`
  - `docs/release/M4-CANDIDATE-CHECKLIST.md`
  - `docs/release/M4-PUBLICATION-PLAN.md`
  - `docs/release/M4-ROLLBACK-PLAN.md`
  - `docs/handoffs/lote-10.md`
- Validaciones ejecutadas sobre el árbol candidato `release/0.4.0`:
  - `pnpm format:check`, ESLint, `pnpm typecheck`, `pnpm build` y `node docs/acceptance/probes/validate-results.mjs`: aprobados.
  - `node docs/acceptance/probes/m4-release-upgrade.mjs`: migración `0000`–`0005` (`v0.3.0`) → `0006` (`v0.4.0`) y reejecución idempotente aprobadas sobre base PostgreSQL aislada, preservando usuarios, perfiles, habilidades, proyectos, CV y análisis previos.
  - `pnpm test` con PostgreSQL aislado: 37 archivos y 313 pruebas aprobadas (incluyendo `apps/api` 18 archivos / 145 pruebas, `apps/web` 15 archivos / 115 pruebas, `apps/skill-engine` 3 archivos / 51 pruebas de dominio y privacidad, `tests/e2e/support/trace.test.ts` 2 pruebas, validación de 5 contratos OpenAPI / 54 ejemplos y validación de catálogo/plantillas `1.0.0`).
  - `pnpm test:e2e` con PostgreSQL aislado y servicios reales (`web`, `api`, `skill-engine`): 16/16 pruebas Playwright aprobadas (incluyendo `learning-paths.spec.ts`, `m4-acceptance.spec.ts` y regresión M1/M2/M3).

## DEP-01 — evaluar despliegue a cero pesos (opcional)

- Integrada en `develop` (`0a5439cb5a0e9f55b227d082d647856118117f68`) por Zaid (`DEPREMU`) en
  `docs/DEPLOY_OPTIONS.md`. Concluye que la ejecución local mediante Docker Compose es la opción
  recomendada de costo cero garantizado y sin exposición de datos.

## Condición exacta de continuación para cierre definitivo de `v0.4.0`

1. Publicar `release/0.4.0` en `origin` y abrir el PR `release/0.4.0 → main` usando **Create a merge commit**.
2. Verificar en GitHub Actions que pasen `CI gate (required)` (incluyendo `M1 E2E (Chromium + PostgreSQL 16)`) y `OPS M1 Compose runtime` (`compose-runtime` con PostgreSQL 16) sobre el SHA candidato de `release/0.4.0`.
3. Tras contar con la revisión y autorización humana, realizar el merge commit de `release/0.4.0 → main`.
4. Verificar el SHA final de `main`, crear y empujar el tag anotado `v0.4.0`, publicar la GitHub Release `v0.4.0` y sincronizar `main → develop` mediante merge commit.
