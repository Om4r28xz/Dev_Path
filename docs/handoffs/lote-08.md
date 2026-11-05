# Handoff lote 08 — estado vigente

Fecha: 5 de noviembre de 2026.
Contratos y versiones consumidos: `packages/contracts/openapi/public.yaml` (`1.1.0`), `packages/contracts/openapi/m2.yaml` (`0.1.0`), `packages/contracts/openapi/m3-proposed.yaml` (`0.1.0` actualizado con cursor AES-256-GCM según ADR 0005), catálogo `1.0.0`, manifiestos privados del monorepo en `0.2.0`.

| Tarea  | Estado                                                           | Evidencia / siguiente acción                                                                                                                                                                                  |
| ------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REL-02 | Integrada (`main` `1ebce21`, tag `v0.2.0`, sync `40360a5`)       | PR #54 en `main`, revisión manual delegada PR #57 (`08b29ba`), aprobación P2 por delegación de Omar, tag anotado `v0.2.0` publicado y `main` sincronizado a `develop`.                                        |
| JSR-01 | Integrada en `develop` (`e1a5b10`, PR #55)                       | `docs/provider/JSEARCH.md`, fixtures sintéticos y ADR 0005 (`fedbc65`, PR #58). Permisos de cuenta/retención live pendientes; modo `live` desactivado por defecto.                                            |
| JSR-02 | Integrada en `develop` (`518f833`, merge `e179f39`)              | `JobsProvider` (`FixtureJobsProvider` y `LiveJSearchProvider`), cursor AES-256-GCM `j1.<base64url>`, `GET /api/v1/jobs`, `GET /api/v1/jobs/details`, tests HTTP y README.                                     |
| JSR-03 | Integrada en `develop` (`7aa50a7`, merge `1216bdd`)              | `POST /api/v1/analyses` con `source: { type: "jsearch", providerId }`, compuerta de retención live (`503` si `JOBS_LIVE_RETENTION_ALLOWED != 'true'`), colección `apps/api/requests/e3-jsearch.http` y tests. |
| JSR-04 | Implementada e integrada en `develop` (`feature/jsr-04-jobs-ui`) | Pantalla `/jobs` (`JobsPage`), búsqueda controlada por submit, paginación `nextCursor`, detalle con texto escapado, atribución segura y análisis con `AnalysisResult` compartido.                             |

## REL-02

- PR #54 (`1ebce21381fb5f32613a3ea54ed0fe9fea343e25`) en `main` con versión `0.2.0`, `CHANGELOG.md`, `M2-CANDIDATE-CHECKLIST.md`, `M2-PUBLICATION-PLAN.md` y `M2-ROLLBACK-PLAN.md`.
- Revisión manual delegada registrada en `docs/acceptance/M2-results.md` (PR #57, `08b29ba`) y aprobación P2 autorizada por Omar.
- Tag anotado `v0.2.0` publicado sobre `1ebce21381fb5f32613a3ea54ed0fe9fea343e25` y sincronizado en `develop` mediante merge commit `40360a5`.

## JSR-01 y decisión de paginación (ADR 0005)

- Archivos: `docs/provider/JSEARCH.md`, `docs/provider/JSR-02-PAGINATION-PROPOSAL.md`, `docs/adr/0005-jobs-pagination-cursor.md`, `docs/provider/fixtures/jsearch-search.synthetic.json`, `docs/provider/fixtures/jsearch-detail.synthetic.json`.
- Omar aprobó por delegación (P1/P2/P4) la propuesta de paginación por cursor confidencial AES-256-GCM (`j1.<base64url>`, TTL 15 minutos, ligado a usuario y consulta normalizada).
- Los permisos de cuenta (hard cap cero costo total) y retención de texto/derivados de JSearch permanecen pendientes; por ello el tráfico `live` y la persistencia `live` permanecen desactivados por defecto.

## JSR-02

- Rama: `feature/jsr-02-jobs-provider-api` (`518f833`), integrada en `develop` (`e179f39`).
- Archivos: `packages/contracts/openapi/m3-proposed.yaml`, `packages/contracts/examples/m3-proposed/jobs.json`, `packages/contracts/src/proposals/m3/generated.ts`, `apps/api/src/modules/jobs/schemas/index.ts`, `apps/api/src/modules/jobs/services/cursor.ts`, `apps/api/src/modules/jobs/services/provider.ts`, `apps/api/src/modules/jobs/http/router.ts`, `apps/api/src/server.ts`, `apps/api/README.md`, `apps/api/tests/integration/jobs.test.ts`.
- Validación: `pnpm --filter @devpath/contracts generate`, `pnpm --filter @devpath/contracts test` (5 OpenAPI y 54 ejemplos), `pnpm --filter @devpath/api exec vitest run tests/integration/jobs.test.ts` (4 suites cubriendo 401 sin JWT, 200 fixture y paginación con cursor cifrado, rechazo de `page > 1` y URLs arbitrarias en `providerId`, 200/vacío/429/504/503 en `LiveJSearchProvider` sin filtración de `RAPIDAPI_KEY`) y `pnpm --filter @devpath/api typecheck`.

## JSR-03

- Rama: `feature/jsr-03-provider-analysis` (`7aa50a7`), integrada en `develop` (`1216bdd`).
- Archivos: `apps/api/src/modules/analyses/schemas.ts`, `apps/api/src/modules/analyses/repository.ts`, `apps/api/src/modules/analyses/router.ts`, `apps/api/src/server.ts`, `apps/api/README.md`, `apps/api/requests/e3-jsearch.http`, `apps/api/tests/integration/jsearch-analysis.test.ts`.
- Validación: `pnpm --filter @devpath/api exec vitest run tests/integration/jsearch-analysis.test.ts` (401 sin JWT, 201 Created con `source.type="jsearch"` en modo `fixture`, 200 replay idempotente, 409 conflicto de clave, 400 URL arbitraria o texto inyectado, 404/429/504 del proveedor, 503 cuando el proveedor está en modo `live` sin `JOBS_LIVE_RETENTION_ALLOWED=true`, y preservación del análisis manual `source.type="text"` cuando el proveedor falla).

## JSR-04

- Rama: `feature/jsr-04-jobs-ui`.
- Archivos: `apps/web/tsconfig.app.json`, `apps/web/src/app/router.tsx`, `apps/web/src/components/layout/AppLayout.tsx`, `apps/web/src/features/analyses/types.ts`, `apps/web/src/features/analyses/validation.ts`, `apps/web/src/features/jobs/api/index.ts`, `apps/web/src/features/jobs/pages/JobsPage.tsx`, `apps/web/src/features/jobs/pages/jobs.css`, `apps/web/src/features/jobs/pages/JobsPage.test.tsx`.
- Validación: `pnpm --filter @devpath/web test` (13 archivos, 110 pruebas aprobadas) y `pnpm --filter @devpath/web typecheck`.

## Condición de continuación hacia Lote 09

- Todas las dependencias técnicas de `LRN-01`, `LRN-02`, `LRN-03`, `LRN-04` y `QA-04` (en modo fixture) están integradas en `develop`.
- La prueba `live` acotada de JSearch para cerrar el requisito externo de E3 en `QA-04` / `REL-03` sigue condicionada a contar con cuenta/plan sin cargo confirmado y permisos de retención documentados en `docs/provider/JSEARCH.md`. Mientras tanto, el modo `fixture` está operativo e identificado explícitamente.
