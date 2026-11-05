# Resultados de aceptación M2 y regresión M1 — QA-03

Fecha: 4 de noviembre de 2026. **Aceptación técnica y revisión manual delegada de M2 documentadas; revisión P2 independiente y publicación `v0.2.0` (`REL-02`) pendientes.**

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
- No autoriza por sí solo publicar `v0.2.0`; REL-02 conserva las puertas humanas y de publicación del lote 08.

## Revisión manual delegada del candidato REL-02

Omar delegó expresamente en Emanuel la coordinación del trabajo restante del lote 08. Emanuel realizó personalmente la revisión manual sobre el candidato exacto `1ebce21381fb5f32613a3ea54ed0fe9fea343e25`. Este registro identifica a Emanuel como revisor delegado; no atribuye una firma o identidad de P2/P5 que esas personas no hayan emitido.

Entorno de revisión: Node 22.23.4, pnpm 11.22.0, web/API/Skill Engine reales y PostgreSQL 18.3 nativo en datos aislados. La prueba local complementa, pero no reemplaza, el check Compose con PostgreSQL 16 ejecutado satisfactoriamente por GitHub Actions sobre el mismo SHA (`41950101474`).

Emanuel confirmó sin defectos observados:

- crear, recargar, editar, volver a recargar y eliminar un proyecto;
- subir, persistir tras recarga, descargar, sustituir y eliminar un PDF sintético;
- rechazo de archivo no PDF y de PDF de 5 242 881 bytes;
- conservación exacta de las habilidades personales aunque el PDF mencione tecnologías;
- navegación completa por teclado, foco operable, ancho de 320 px y zoom al 200 %;
- regresión M1 con C# y Git frente a una vacante con Git, JavaScript y React: 33 %, coincidencia Git, faltantes JavaScript/React, evidencia, historial y detalle persistente;
- cierre de sesión mediante teclado.

Resultado del revisor delegado: funcionalidades revisadas operables y sin defecto bloqueante observado. Limitaciones: no se ejecutó Docker localmente, no es certificación WCAG completa y sigue pendiente la revisión P2 de migraciones, volumen privado, privacidad y diff de release antes de autorizar el tag.
