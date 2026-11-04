# Resultados de aceptación M2 y regresión M1 — QA-03

Fecha: 4 de noviembre de 2026. **Aceptación técnica de M2 documentada; aceptación humana formal P5 y publicación `v0.2.0` (`REL-02`) pendientes.**

## Base y trazabilidad

- **Commit integrado probado en `develop`:** `65cc14f` (`Merge pull request #51 from Om4r28xz/feature/cv-02-profile-cv-ui`), que incluye `PRJ-01` (PR #48), `PRJ-02` (PR #49), `CV-01` (PR #50, `ff5ceec`) y `CV-02` (PR #51, `3b3f79d`).
- **Contratos y versiones:** `packages/contracts/openapi/m2.yaml` (`0.1.0`), `packages/contracts/EXTENDED-CONTRACTS.md`, catálogo `1.0.0`.
- **Documentación operativa P4 (`docs/SETUP_LOCAL.md` y `apps/api/README.md`):** actualizada en `CV-01` con la variable `CV_STORAGE_DIR` y el volumen exclusivo `cv_files` fuera de webroot.
- **Defectos bloqueantes abiertos en M2:** ninguno. Durante la preparación de `CV-02` se detectó y corrigió antes de su integración que `authRouter` ignoraba `config.http.rateLimit.maxRequests` en `NODE_ENV=test` al ejecutar las 11 pruebas E2E seguidas (`3b3f79d`).

## Resumen de resultados por caso

| Caso            | Descripción                                                                                                                                                    | Resultado técnico | Evidencia                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `PRJ-ACC-01`    | CRUD de proyectos, persistencia tras recarga, `projects_revision` y preservación de skills personales al borrar proyecto                                       | Aprobado          | `apps/api/tests/integration/projects.test.ts`, `tests/e2e/projects.spec.ts`                                  |
| `PRJ-ACC-02`    | Privacidad entre dos cuentas (`404` cruzado), aviso de información autodeclarada y enlaces seguros (`target="_blank"`, `rel="noreferrer"`)                     | Aprobado          | `apps/api/tests/integration/projects.test.ts`, `tests/e2e/projects.spec.ts`                                  |
| `CV-ACC-01`     | Subida/sustitución multipart sin boundary manual, control de doble clic, descarga autenticada con `Blob` y `URL.revokeObjectURL`, eliminación con confirmación | Aprobado          | `apps/web/src/features/cv/api.test.ts`, `tests/e2e/cv.spec.ts`                                               |
| `CV-ACC-02`     | Límites de 5 MiB y firma/extensión PDF, rechazo de path traversal, aislamiento entre cuentas A/B (`404`), compensación DB/disco y `X-File-Cleanup-Pending`     | Aprobado          | `apps/api/tests/integration/cv.test.ts`, `tests/e2e/cv.spec.ts`                                              |
| `CV-ACC-03`     | Subir un CV con nombres de tecnologías no modifica `/api/v1/me/skills` ni invoca al Skill Engine; aviso explícito en UI                                        | Aprobado          | `tests/e2e/cv.spec.ts`, `apps/api/tests/integration/cv.test.ts`                                              |
| `REG-M1-ACC-01` | Continuidad visual, accesibilidad/teclado/móvil `320px` y regreso al flujo M1 (`/analysis/new` → `/analyses/:id`) sin regresión                                | Aprobado          | `tests/e2e/cv.spec.ts`, `tests/e2e/projects.spec.ts`, `tests/e2e/m1.spec.ts`, `tests/e2e/acceptance.spec.ts` |

## Ejecución de suites y comandos verificados

- `pnpm lint` y `pnpm format:check`: aprobados sin advertencias.
- `pnpm typecheck` y `pnpm build`: aprobados en todos los paquetes del monorepo (`contracts`, `db`, `skill-engine`, `api`, `web`) y `tsconfig.e2e.json`.
- `pnpm --filter @devpath/web test`: 12 archivos, 106 pruebas aprobadas.
- `pnpm --filter @devpath/api test` (con PostgreSQL 18 aislado y migraciones `0000`–`0005` + seed): 14 archivos, 129 pruebas aprobadas (incluyendo `projects.test.ts` y `cv.test.ts`).
- `pnpm test:e2e` (Chromium + PostgreSQL 18 aislado + `web`/`api`/`skill-engine` reales): 11/11 pruebas E2E aprobadas (`acceptance.spec.ts`, `cv.spec.ts`, `m1.spec.ts`, `profile-skills-readiness.spec.ts`, `profile-target-size.spec.ts`, `projects.spec.ts`).

## Alcance y pendientes

- Este informe registra la validación técnica automatizada sobre archivos sintéticos seguros y sin secretos ni datos personales.
- No sustituye la revisión humana de P5 ni autoriza publicar `v0.2.0` sin ejecutar `REL-02` en el Lote 08.
