# Resultados de aceptación M3, límites del proveedor y matriz E3 — QA-04

Fecha: 5 de noviembre de 2026. **Aceptación técnica del flujo M3 en modo `fixture`, regresión M1/M2 y consulta acotada `live` (`num_pages=1` contra `https://jsearch.p.rapidapi.com/search-v2` y `/job-details`) verificadas.**

## Base y trazabilidad

- **Commit integrado probado en `develop`:** `fad9d1a` (`Merge branch 'feature/jsr-04-jobs-ui' into develop (JSR-04)`), que integra `JSR-01` (`e1a5b10`), ADR 0005 (`fedbc65`), `JSR-02` (`e179f39`, `518f833`), `JSR-03` (`1216bdd`, `7aa50a7`) y `JSR-04` (`fad9d1a`, `84dd2ec`), más el ajuste de ruta v5 `/search-v2` y sobre `{ data: { jobs, cursor } }` validado en `live`.
- **Contratos y versiones:** `packages/contracts/openapi/public.yaml` (`1.1.0`), `packages/contracts/openapi/m2.yaml` (`0.1.0`), `packages/contracts/openapi/m3-proposed.yaml` (`0.1.0` actualizado con cursor confidencial AES-256-GCM según ADR 0005), catálogo `1.0.0`.
- **Revisión P1/P4 de permisos, `apps/api/README.md` y colección `.http`:** completada sobre `docs/provider/JSEARCH.md`, `docs/adr/0005-jobs-pagination-cursor.md`, `apps/api/README.md` y `apps/api/requests/e3-jsearch.http`.

## Separación estricta entre pruebas `fixture` (mocks/sintéticos) y proveedor real (`live`)

1. **Qué fue probado en modo `fixture` y con dobles HTTP controlados:**
   - Búsqueda (`GET /api/v1/jobs`), paginación con cursor cifrado AES-256-GCM (`j1.<base64url>`), detalle (`GET /api/v1/jobs/details`) y creación de análisis (`POST /api/v1/analyses` con `source.type="jsearch"`) de punta a punta entre navegador, API Express, Skill Engine y PostgreSQL.
   - Comportamiento de `LiveJSearchProvider` frente a un servidor HTTP local de pruebas que emula el envelope de JSearch (`200 OK`, vacío, `404`, `429`, timeout de 5 s → `504` y `5xx` → `503`), comprobando que `RAPIDAPI_KEY` nunca se filtra en cuerpos de error ni logs y que no existen reintentos automáticos ante `429`.
   - Compuerta de retención en `POST /api/v1/analyses`: si el proveedor responde con `mode="live"` y `JOBS_LIVE_RETENTION_ALLOWED` no es `'true'`, la API rechaza persistir el análisis con `503 DEPENDENCY_UNAVAILABLE` sin afectar el análisis manual (`source.type="text"`).
2. **Qué fue probado con el proveedor real (`live`) y qué permanece restringido por política (`JSR-01`):**
   - **Llamada `live` acotada verificada (`2026-11-05T18:38:45.523Z`):** con credencial suministrada únicamente en memoria de proceso (sin escribirse en `.env`, logs ni Git), `LiveJSearchProvider.search` consultó `GET https://jsearch.p.rapidapi.com/search-v2` (`num_pages=1`) recibiendo `HTTP 200 OK` (`mode="live"`, 10 vacantes normalizadas, cursor upstream de 703 caracteres cifrado y descifrado con AES-256-GCM en token `j1.` de 1179 caracteres) y `LiveJSearchProvider.details` consultó `GET https://jsearch.p.rapidapi.com/job-details` recibiendo `HTTP 200 OK` (`mode="live"`, descripción normalizada de 8161 caracteres). Cabeceras reales observadas: `x-ratelimit-requests-limit: 200`, `x-ratelimit-requests-remaining: 194`, `x-ratelimit-requests-reset: 2591239`.
   - **Retención `live` y tráfico por defecto:** el repositorio mantiene `JOBS_PROVIDER_MODE=fixture`, `JOBS_LIVE_ENABLED=false` y `JOBS_LIVE_RETENTION_ALLOWED=false` por defecto para evitar consumo accidental de cuota en CI/desarrollo y porque la retención persistente de descripciones `live` (`POST /api/v1/analyses` en modo `live`) sigue sujeta a confirmación escrita de licencia del proveedor (`docs/provider/JSEARCH.md`).

## Resumen de resultados por caso

| Caso         | Descripción                                                                                                                        | Modo probado       | Resultado técnico            | Evidencia                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `JSR-ACC-01` | Búsqueda por submit, cursor cifrado AES-256-GCM (`nextCursor`), detalle por `providerId` y rechazo de URLs/cursores inválidos      | `fixture` + `live` | Aprobado                     | `apps/api/tests/integration/jobs.test.ts`, `apps/web/src/features/jobs/pages/JobsPage.test.tsx`, `tests/e2e/jobs.spec.ts`    |
| `JSR-ACC-02` | Insignia de procedencia `fixture`/`live`, escapado de HTML crudo, enlace externo seguro y sistema visual del lote 06.5 (`320px`)   | `fixture` + UI     | Aprobado                     | `apps/web/src/features/jobs/pages/JobsPage.test.tsx`, `tests/e2e/jobs.spec.ts`                                               |
| `JSR-ACC-03` | Análisis de vacante del proveedor vía Skill Engine (`67%`), idempotencia, persistencia en historial y rechazo de texto inyectado   | `fixture`          | Aprobado (en modo `fixture`) | `apps/api/tests/integration/jsearch-analysis.test.ts`, `tests/e2e/jobs.spec.ts`                                              |
| `JSR-ACC-04` | Manejo sin alarmismo de `429`/`504`/`503`/`404`, compuerta `JOBS_LIVE_RETENTION_ALLOWED` y preservación del análisis manual (`M1`) | `fixture` + `live` | Aprobado                     | `apps/api/tests/integration/jobs.test.ts`, `apps/api/tests/integration/jsearch-analysis.test.ts`, `tests/e2e/jobs.spec.ts`   |
| `JSR-ACC-05` | Consulta acotada (`num_pages=1`) contra `https://jsearch.p.rapidapi.com` (`/search-v2` y `/job-details`) con credencial en memoria | `live`             | **Aprobado (`200 OK`)**      | `docs/provider/JSEARCH.md`: `2026-11-05T18:38:45.523Z`, 10 vacantes normalizadas, cursor `j1.` (1179 chars), cuota `194/200` |

## Matriz de verificación E3 (criterio → evidencia → estado)

| Criterio E3                                                                             | Evidencia en el repositorio                                                                                                                                                                                                    | Estado                                                                    |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| 1. Tres endpoints de negocio protegidos con Bearer JWT (excluyendo `/health/*`)         | `GET /api/v1/jobs`, `GET /api/v1/jobs/details` y `POST /api/v1/analyses` (`source.type="jsearch"`). Verificados con `401` sin JWT en `apps/api/tests/integration/jobs.test.ts` y `jsearch-analysis.test.ts`.                   | **Cumplido**                                                              |
| 2. Consumo real desde la aplicación web                                                 | Pantalla `/jobs` (`apps/web/src/features/jobs/pages/JobsPage.tsx` y `apps/web/src/features/jobs/api/index.ts`), validada en `JobsPage.test.tsx` y en el flujo E2E `tests/e2e/jobs.spec.ts`.                                    | **Cumplido**                                                              |
| 3. Llamada externa real desde la API a JSearch (`https://jsearch.p.rapidapi.com`)       | `LiveJSearchProvider` (`apps/api/src/modules/jobs/services/provider.ts`) verificado en `live` contra `/search-v2` y `/job-details` (`200 OK`, `mode="live"`, cuota `194/200`); `fixture` se mantiene por defecto para CI/demo. | **Cumplido (`live` verificado en memoria; retención `live` desactivada)** |
| 4. `apps/api/README.md` con propósito, setup, variables de entorno y tabla de endpoints | `apps/api/README.md` documenta arquitectura, variables (`JOBS_PROVIDER_MODE`, `JOBS_LIVE_ENABLED`, `JOBS_LIVE_RETENTION_ALLOWED`, `RAPIDAPI_KEY`, `JOBS_CURSOR_KEY`) y tabla de los 3 endpoints de negocio E3.                 | **Cumplido**                                                              |
| 5. Pruebas HTTP automatizadas y colección `.http` reproducible con respuestas esperadas | `apps/api/requests/e3-jsearch.http`, `apps/api/tests/integration/jobs.test.ts` y `apps/api/tests/integration/jsearch-analysis.test.ts`.                                                                                        | **Cumplido**                                                              |
| 6. Enlace al repositorio (y enlace de despliegue solo si existe)                        | Repositorio: `https://github.com/Om4r28xz/Dev_Path`. Ejecución local por diseño (`docs/SETUP_LOCAL.md`); no existe despliegue público ni es obligatorio para la entrega.                                                       | **Cumplido**                                                              |

> **Conclusión para `REL-03` y etiqueta `e3-microservice`:**
> La búsqueda y el detalle contra `https://jsearch.p.rapidapi.com` (`/search-v2` y `/job-details`) quedaron verificados en modo `live` (`200 OK`) sin almacenar credenciales en el repositorio, mientras que la persistencia de análisis `live` (`JOBS_LIVE_RETENTION_ALLOWED=false`) y el modo por defecto (`JOBS_PROVIDER_MODE=fixture`) permanecen protegidos conforme a `docs/provider/JSEARCH.md`.

## Ejecución de suites y comandos verificados

- `pnpm lint` y `pnpm format:check`: aprobados.
- `pnpm typecheck` y `pnpm build`: aprobados en todos los paquetes y `tsconfig.e2e.json`.
- `pnpm --filter @devpath/api test`: 16 archivos, 152 pruebas aprobadas (incluyendo `jobs.test.ts` y `jsearch-analysis.test.ts`).
- `pnpm --filter @devpath/web test`: 13 archivos, 110 pruebas aprobadas (incluyendo `JobsPage.test.tsx`).
- `pnpm test:e2e`: 12/12 pruebas E2E aprobadas con Chromium, `web`/`api`/`skill-engine` reales y PostgreSQL 18 aislado (incluyendo `tests/e2e/jobs.spec.ts` y la regresión completa de M1 y M2).
