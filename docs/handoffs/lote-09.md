# Handoff lote 09 — estado vigente

Fecha: 5 de noviembre de 2026.
Contratos y versiones consumidos: `packages/contracts/openapi/public.yaml` (`1.1.0`), `packages/contracts/openapi/m2.yaml` (`0.1.0`), `packages/contracts/openapi/m3-proposed.yaml` (`0.1.0` con cursor AES-256-GCM según ADR 0005), `packages/contracts/openapi/m4-proposed.yaml` (`0.1.0`), catálogo `1.0.0`, plantillas de aprendizaje `1.0.0` (`packages/catalog/learning-templates.json`), generador `rules-1`.

| Tarea  | Estado                                                                       | Evidencia / siguiente acción                                                                                                                                                                                                                                                                                                       |
| ------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-04  | Integrada en `develop` (`d5f6064`, merge `02695a4` + ajuste `live` v5)       | `docs/acceptance/M3-cases.md`, `docs/acceptance/M3-results.md`, `docs/provider/JSEARCH.md` y `tests/e2e/jobs.spec.ts`. Separación `fixture` vs `live` y matriz E3 completas; prueba `live` acotada (`num_pages=1`) contra `/search-v2` y `/job-details` verificada en memoria (`200 OK`, cuota `194/200`) sin guardar key en repo. |
| REL-03 | Implementada sin merge hacia `main` (rama `release/0.3.0`, commit `f261311`) | `CHANGELOG.md`, 8 manifiestos en `0.3.0`, `M3-CANDIDATE-CHECKLIST.md`, `M3-PUBLICATION-PLAN.md` y `M3-ROLLBACK-PLAN.md`. Pendiente: revisión humana P1/P2/P5, PR `release/0.3.0 → main`, tags `v0.3.0` y `e3-microservice`.                                                                                                        |
| LRN-01 | Integrada en `develop` (`d905e8f` / `f8ff507`, merge `d001943`)              | `packages/catalog/learning-templates.json` (`1.0.0`), `packages/catalog/docs/LEARNING_CONTENT_GUIDE.md`, `packages/catalog/fixtures/learning-path-cases.json` y `packages/catalog/scripts/validate-learning-templates.mjs`.                                                                                                        |
| LRN-02 | Integrada en `develop` (`8ca23e4`, merge `ac380d6`)                          | Migración `0006_empty_martin_li.sql`, `learningPaths`/`learningPathSteps` en `@devpath/db`, `generator.ts`, `repository.ts`, `router.ts` (`POST /api/v1/learning-paths`) y suites unitarias/integración PostgreSQL.                                                                                                                |
| LRN-03 | Integrada en `develop` (`9c0e6ff`, merge `b74cec8`)                          | `GET /api/v1/learning-paths`, `GET /api/v1/learning-paths/:id`, `PATCH /api/v1/learning-paths/:id/steps/:stepId`, `DELETE /api/v1/learning-paths/:id`, `apps/api/README.md` y pruebas de progreso, cascada de análisis y preservación tras borrar proyecto.                                                                        |

## QA-04 — Aceptación y límites del proveedor

- Rama: `docs/qa-04-jsearch-results` (`d5f6064`), integrada en `develop`.
- Archivos: `docs/acceptance/M3-cases.md`, `docs/acceptance/M3-results.md`, `tests/e2e/jobs.spec.ts`.
- Evidencia:
  - Flujo `/jobs` probado de punta a punta con servicios reales (`web`, `api`, `skill-engine`, PostgreSQL 18 aislado) en modo `fixture` (`tests/e2e/jobs.spec.ts`).
  - Prueba `live` acotada (`JSR-ACC-05`, criterio 3 de E3) ejecutada en memoria el `2026-11-05T18:38:45.523Z` contra `https://jsearch.p.rapidapi.com/search-v2` (`num_pages=1`, `200 OK`, `mode="live"`, 10 vacantes normalizadas, cursor upstream de 703 caracteres cifrado/descifrado con AES-256-GCM en token `j1.` de 1179 caracteres) y `/job-details` (`200 OK`, descripción normalizada de 8161 caracteres; cuota observada `194/200`), sin persistir `RAPIDAPI_KEY` en disco ni Git.

## REL-03 — Cerrar v0.3.0

- Rama: `release/0.3.0`, basada en `develop` inmediatamente después de `QA-04` (sin mezclar cambios de M4).
- Archivos: `CHANGELOG.md`, `package.json`, `apps/api/package.json`, `apps/skill-engine/package.json`, `apps/web/package.json`, `packages/catalog/package.json`, `packages/contracts/package.json`, `packages/db/package.json`, `packages/test-support/package.json`, `docs/release/M3-CANDIDATE-CHECKLIST.md`, `docs/release/M3-PUBLICATION-PLAN.md`, `docs/release/M3-ROLLBACK-PLAN.md`.
- Condición exacta de continuación:
  - Revisión humana P1/P2/P5 sobre `release/0.3.0`, apertura de PR hacia `main` con merge commit y publicación de los tags anotados `v0.3.0` y `e3-microservice`.

## LRN-01 — Plantillas, prerequisitos y actividades curadas

- Rama: `data/lrn-01-learning-content` (`d905e8f`, `f8ff507`), integrada en `develop`.
- Archivos: `packages/catalog/learning-templates.json`, `packages/catalog/docs/LEARNING_CONTENT_GUIDE.md`, `packages/catalog/fixtures/learning-path-cases.json`, `packages/catalog/scripts/validate-learning-templates.mjs`, `packages/catalog/package.json`, `packages/catalog/README.md`.
- Validación: `pnpm --filter @devpath/catalog test` (catálogo `1.0.0`, 30 casos de extracción ES/EN, 10 plantillas curadas sin ciclos ni promesas de contratación y 3 casos de referencia).

## LRN-02 — Generación determinista y persistencia de rutas

- Rama: `feature/lrn-02-path-generation-api` (`8ca23e4`), integrada en `develop`.
- Archivos: `packages/db/src/schema/index.ts`, `packages/db/src/schema/app.ts`, `packages/db/migrations/0006_empty_martin_li.sql`, `packages/db/migrations/meta/_journal.json`, `packages/db/migrations/meta/0006_snapshot.json`, `apps/api/src/modules/learning-paths/schemas.ts`, `apps/api/src/modules/learning-paths/generator.ts`, `apps/api/src/modules/learning-paths/repository.ts`, `apps/api/src/modules/learning-paths/router.ts`, `apps/api/src/server.ts`, `apps/api/tests/unit/learning-path-generator.test.ts`, `apps/api/tests/integration/learning-paths.test.ts`.
- Validación: `pnpm --filter @devpath/api exec vitest run tests/unit/learning-path-generator.test.ts tests/integration/learning-paths.test.ts` (determinismo, rechazo de ciclos, `404` en análisis ajeno, atomicidad ante fallo de inserción de pasos, idempotencia `201`/`200`/`409` y caso de cero faltantes).

## LRN-03 — Consulta, progreso y eliminación de rutas

- Rama: `feature/lrn-03-learning-progress-api` (`9c0e6ff`), integrada en `develop`.
- Archivos: `apps/api/src/modules/learning-paths/schemas.ts`, `apps/api/src/modules/learning-paths/repository.ts`, `apps/api/src/modules/learning-paths/router.ts`, `apps/api/README.md`, `apps/api/tests/integration/learning-paths.test.ts`.
- Validación: `pnpm --filter @devpath/api exec vitest run tests/integration/learning-paths.test.ts` (paginación por cursor propio, detalle `200`/`404`, transiciones `pending` → `in_progress` → `completed` → `pending`, conservación de `completedAt` en repetición idempotente, no modificación de `/api/v1/me/skills`, preservación de actividad con `projectId = null` al eliminar proyecto y borrado en cascada al eliminar análisis).

## Condición de continuación hacia Lote 10

- En `develop` están integradas `QA-04`, `LRN-01`, `LRN-02` y `LRN-03` (además de `ANL-02` y `VIS-04`), por lo que `LRN-04` y `QA-05` del lote 10 tienen todas sus dependencias técnicas listas en `develop`.
- `REL-03` permanece lista en su rama `release/0.3.0` para revisión y publicación humana hacia `main`.
