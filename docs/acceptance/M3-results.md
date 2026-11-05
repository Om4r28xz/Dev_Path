# Resultados de aceptación M3, límites del proveedor y matriz E3 — QA-04

Fecha: 5 de noviembre de 2026. **Aceptación técnica del flujo M3 en modo `fixture` y regresión M1/M2 verificadas; llamada `live` real a JSearch y etiqueta `e3-microservice` pendientes de permisos externos (`JSR-01`).**

## Base y trazabilidad

- **Commit integrado probado en `develop`:** `fad9d1a` (`Merge branch 'feature/jsr-04-jobs-ui' into develop (JSR-04)`), que integra `JSR-01` (`e1a5b10`), ADR 0005 (`fedbc65`), `JSR-02` (`e179f39`, `518f833`), `JSR-03` (`1216bdd`, `7aa50a7`) y `JSR-04` (`fad9d1a`, `84dd2ec`).
- **Contratos y versiones:** `packages/contracts/openapi/public.yaml` (`1.1.0`), `packages/contracts/openapi/m2.yaml` (`0.1.0`), `packages/contracts/openapi/m3-proposed.yaml` (`0.1.0` actualizado con cursor confidencial AES-256-GCM según ADR 0005), catálogo `1.0.0`.
- **Revisión P1/P4 de permisos, `apps/api/README.md` y colección `.http`:** completada sobre `docs/provider/JSEARCH.md`, `docs/adr/0005-jobs-pagination-cursor.md`, `apps/api/README.md` y `apps/api/requests/e3-jsearch.http`.

## Separación estricta entre pruebas `fixture` (mocks/sintéticos) y proveedor real (`live`)

1. **Qué fue probado en modo `fixture` y con dobles HTTP controlados:**
   - Búsqueda (`GET /api/v1/jobs`), paginación con cursor cifrado AES-256-GCM (`j1.<base64url>`), detalle (`GET /api/v1/jobs/details`) y creación de análisis (`POST /api/v1/analyses` con `source.type="jsearch"`) de punta a punta entre navegador, API Express, Skill Engine y PostgreSQL.
   - Comportamiento de `LiveJSearchProvider` frente a un servidor HTTP local de pruebas que emula el envelope de JSearch (`200 OK`, vacío, `404`, `429`, timeout de 5 s → `504` y `5xx` → `503`), comprobando que `RAPIDAPI_KEY` nunca se filtra en cuerpos de error ni logs y que no existen reintentos automáticos ante `429`.
   - Compuerta de retención en `POST /api/v1/analyses`: si el proveedor responde con `mode="live"` y `JOBS_LIVE_RETENTION_ALLOWED` no es `'true'`, la API rechaza persistir el análisis con `503 DEPENDENCY_UNAVAILABLE` sin afectar el análisis manual (`source.type="text"`).
2. **Qué NO fue probado con el proveedor real (`live`) y limitaciones de acceso registradas (`JSR-01`):**
   - **No se ejecutó ninguna llamada saliente real a `https://jsearch.p.rapidapi.com`**.
   - Conforme a `docs/provider/JSEARCH.md`, el modo `live` permanece desactivado por defecto (`JOBS_PROVIDER_MODE=fixture`, `JOBS_LIVE_ENABLED=false`, `JOBS_LIVE_RETENTION_ALLOWED=false`) porque siguen pendientes:
     - la verificación en cuenta autorizada de RapidAPI de un hard cap total que impida cargos por peticiones o transferencia;
     - la confirmación en los términos específicos del proveedor sobre exhibición de resultados y retención de descripciones/derivados (`JSR-03`).
   - En cumplimiento de las reglas de aceptación, **los resultados en modo `fixture` no cierran las issues de integración real ni acreditan el requisito de llamada externa real de E3**.

## Resumen de resultados por caso

| Caso         | Descripción                                                                                                                        | Modo probado          | Resultado técnico              | Evidencia                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `JSR-ACC-01` | Búsqueda por submit, cursor cifrado AES-256-GCM (`nextCursor`), detalle por `providerId` y rechazo de URLs/cursores inválidos      | `fixture` + doble API | Aprobado (en modo `fixture`)   | `apps/api/tests/integration/jobs.test.ts`, `apps/web/src/features/jobs/pages/JobsPage.test.tsx`, `tests/e2e/jobs.spec.ts`          |
| `JSR-ACC-02` | Insignia de procedencia `fixture`/`live`, escapado de HTML crudo, enlace externo seguro y sistema visual del lote 06.5 (`320px`)   | `fixture` + UI        | Aprobado                       | `apps/web/src/features/jobs/pages/JobsPage.test.tsx`, `tests/e2e/jobs.spec.ts`                                                     |
| `JSR-ACC-03` | Análisis de vacante del proveedor vía Skill Engine (`67%`), idempotencia, persistencia en historial y rechazo de texto inyectado   | `fixture`             | Aprobado (en modo `fixture`)   | `apps/api/tests/integration/jsearch-analysis.test.ts`, `tests/e2e/jobs.spec.ts`                                                    |
| `JSR-ACC-04` | Manejo sin alarmismo de `429`/`504`/`503`/`404`, compuerta `JOBS_LIVE_RETENTION_ALLOWED` y preservación del análisis manual (`M1`) | `fixture` + doble API | Aprobado                       | `apps/api/tests/integration/jobs.test.ts`, `apps/api/tests/integration/jsearch-analysis.test.ts`, `tests/e2e/jobs.spec.ts`         |
| `JSR-ACC-05` | Consulta acotada (`num_pages=1`) contra `https://jsearch.p.rapidapi.com` con credencial real y permisos verificados                | `live`                | **Pendiente (bloqueo JSR-01)** | `docs/provider/JSEARCH.md`: requiere cuenta sin riesgo de cargo, confirmación de términos de retención y `RAPIDAPI_KEY` autorizada |

## Matriz de verificación E3 (criterio → evidencia → estado)

| Criterio E3                                                                             | Evidencia en el repositorio                                                                                                                                                                                              | Estado                                                                              |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| 1. Tres endpoints de negocio protegidos con Bearer JWT (excluyendo `/health/*`)         | `GET /api/v1/jobs`, `GET /api/v1/jobs/details` y `POST /api/v1/analyses` (`source.type="jsearch"`). Verificados con `401` sin JWT en `apps/api/tests/integration/jobs.test.ts` y `jsearch-analysis.test.ts`.             | **Cumplido**                                                                        |
| 2. Consumo real desde la aplicación web                                                 | Pantalla `/jobs` (`apps/web/src/features/jobs/pages/JobsPage.tsx` y `apps/web/src/features/jobs/api/index.ts`), validada en `JobsPage.test.tsx` y en el flujo E2E `tests/e2e/jobs.spec.ts`.                              | **Cumplido (en modo `fixture`)**                                                    |
| 3. Llamada externa real desde la API a JSearch (`https://jsearch.p.rapidapi.com`)       | Adaptador `LiveJSearchProvider` implementado en `apps/api/src/modules/jobs/services/provider.ts`; la llamada saliente real permanece desactivada por defecto hasta resolver los bloqueos de cuenta/permisos de `JSR-01`. | **Pendiente (bloqueado por acceso/permisos `JSR-01`; no se sustituye con fixture)** |
| 4. `apps/api/README.md` con propósito, setup, variables de entorno y tabla de endpoints | `apps/api/README.md` documenta arquitectura, variables (`JOBS_PROVIDER_MODE`, `JOBS_LIVE_ENABLED`, `JOBS_LIVE_RETENTION_ALLOWED`, `RAPIDAPI_KEY`, `JOBS_CURSOR_KEY`) y tabla de los 3 endpoints de negocio E3.           | **Cumplido**                                                                        |
| 5. Pruebas HTTP automatizadas y colección `.http` reproducible con respuestas esperadas | `apps/api/requests/e3-jsearch.http`, `apps/api/tests/integration/jobs.test.ts` y `apps/api/tests/integration/jsearch-analysis.test.ts`.                                                                                  | **Cumplido**                                                                        |
| 6. Enlace al repositorio (y enlace de despliegue solo si existe)                        | Repositorio: `https://github.com/Om4r28xz/Dev_Path`. Ejecución local por diseño (`docs/SETUP_LOCAL.md`); no existe despliegue público ni es obligatorio para la entrega.                                                 | **Cumplido**                                                                        |

> **Conclusión para `REL-03` y etiqueta `e3-microservice`:**
> Dado que el criterio 3 (llamada externa real a JSearch) continúa pendiente de las compuertas externas de `JSR-01`, el candidato `v0.3.0` (`REL-03`) se documenta honestamente como **adaptador JSearch y flujo completo en modo demostración (`fixture`)**, manteniendo abiertas las issues de integración `live` y dejando la publicación del tag adicional `e3-microservice` en espera hasta que el integrador humano verifique la prueba `live` autorizada.

## Ejecución de suites y comandos verificados

- `pnpm lint` y `pnpm format:check`: aprobados.
- `pnpm typecheck` y `pnpm build`: aprobados en todos los paquetes y `tsconfig.e2e.json`.
- `pnpm --filter @devpath/api test`: 16 archivos, 152 pruebas aprobadas (incluyendo `jobs.test.ts` y `jsearch-analysis.test.ts`).
- `pnpm --filter @devpath/web test`: 13 archivos, 110 pruebas aprobadas (incluyendo `JobsPage.test.tsx`).
- `pnpm test:e2e`: 12/12 pruebas E2E aprobadas con Chromium, `web`/`api`/`skill-engine` reales y PostgreSQL 18 aislado (incluyendo `tests/e2e/jobs.spec.ts` y la regresión completa de M1 y M2).
