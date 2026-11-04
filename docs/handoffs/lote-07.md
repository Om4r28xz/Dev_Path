# Lote 07 — Proyectos y CV privado

Estado comprobado el 4 de noviembre de 2026. `origin/develop` está en `65cc14f` (con `PRJ-01`, `PRJ-02`, `CV-01` y `CV-02` integradas mediante PR #48, #49, #50 y #51). REL-01, CTR-02, AUTH-03 y VIS-04 también están integradas. Contratos consumidos: `packages/contracts/openapi/m2.yaml` versión 0.1.0, `packages/contracts/EXTENDED-CONTRACTS.md`; catálogo 1.0.0. No se cambiaron contratos ni catálogos.

| Tarea  | Estado                                                                         | Evidencia y siguiente acción                                                                       |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| PRJ-01 | Integrada en `develop` por PR #48                                              | CRUD, migración y pruebas integrados.                                                              |
| PRJ-02 | Integrada en `develop` por PR #49                                              | Portafolio web y flujo E2E integrados en `60daedc`.                                                |
| CV-01  | Integrada en `develop` por PR #50 (`ff5ceec`)                                  | API, almacenamiento, migración 0005, Compose y pruebas integrados.                                 |
| CV-02  | Integrada en `develop` por PR #51 (`65cc14f`)                                  | Panel de CV en perfil, cliente Blob autenticado y pruebas Vitest/E2E integrados.                   |
| QA-03  | Implementada sin merge en `docs/qa-03-profile-context-results`, base `65cc14f` | Matriz `M2-cases.md`, informe `M2-results.md` y E2E M2+regresión M1 validados. Pendiente PR/merge. |

## CV-01

Archivos: `apps/api/src/modules/cv/{storage,upload,repository,service,router}.ts`, `apps/api/src/server.ts`, `apps/api/tests/integration/cv.test.ts`, `apps/api/package.json`, `pnpm-lock.yaml`, `packages/db/src/schema/{index,app}.ts`, `packages/db/migrations/0005_cold_gateway.sql` y metadata Drizzle, `infra/compose.yaml`, `docs/SETUP_LOCAL.md`, `apps/api/README.md`. La migración CV fue regenerada sobre el snapshot 0004 integrado de proyectos.

Se añadió carga multipart en streaming de una sola parte `file`, máximo real 5 242 880 bytes, validación de nombre, extensión, MIME y firma PDF. Los temporales y finales tienen claves aleatorias y se guardan fuera de webroot. La sustitución serializa por cuenta con bloqueo de perfil; el archivo anterior permanece confirmado si falla DB. La limpieza vieja se encola en la misma transacción y se reintenta al iniciar y periódicamente; archivos huérfanos/temporales con más de diez minutos se reconcilian. La descarga exige bearer, abre un stream privado y devuelve attachment con no-store/nosniff. No hay parseo ni envío al motor.

Compose monta `cv_files` solo en API y servicio de preparación de permisos, nunca en web/proxy/engine. `CV_STORAGE_DIR` es obligatorio en producción. P2 debe revisar volumen, permisos y lockfile; P4 debe revisar la actualización de setup.

Validación local: instalación offline congelada, migraciones 0000–0005 y seed en PostgreSQL 18 aislado, 14 archivos y 129 pruebas API aprobadas. La validación de runtime aprobó formato, lint, tipos, build, pruebas y arranque web (6/6). Las siete pruebas CV cubren privacidad entre dos usuarios, metadata y descarga, límite exacto 5 MiB, rechazo de tipo/firma/tamaño/traversal/partes extra, fallo DB y disco, limpieza pendiente y reconciliación, reemplazos concurrentes y DELETE idempotente. `docker compose config --quiet` pasó con variables sintéticas; no se ejecutó stack Compose ni reinicio real del proceso/volumen. El test recreó el servicio sobre la misma DB/almacenamiento. No se atribuye CI remoto ni aceptación humana.

PR sugerido: **feat(api): store private CVs with recovery (CV-01)**. Cuerpo: “Implementa el contrato M2 para PDF privado: carga streaming, metadatos, descarga autenticada y borrado; añade persistencia y reconciliación de limpieza, volumen privado y pruebas PostgreSQL. Sincronizada con proyectos y migración CV regenerada como 0005.” Destino: `develop`. Sin merge automático.

## CV-02

Archivos: `apps/web/src/features/cv/{CvPanel.tsx,api.ts,api.test.ts,cv.css}`, `apps/web/src/features/profile/pages/ProfilePage.tsx`, `apps/web/src/lib/http/{transport.ts,client.ts}`, `apps/api/src/modules/auth/http/router.ts`, `apps/api/src/server.ts`, `tests/e2e/cv.spec.ts`, `docs/handoffs/lote-07.md`.

Se añadió la sección `CvPanel` dentro de la página de perfil reutilizando `Alert`, `Button`, tokens y superficies del sistema visual. Incluye aviso explícito de que DevPath no analiza ni extrae habilidades del archivo automáticamente, validación previa de extensión `.pdf`/MIME `application/pdf` y tamaño máximo de 5 MiB, subida `FormData` sin fijar boundary manual (`requestResponse` omite `Content-Type: application/json` para `FormData`), control de doble clic en subida y borrado, descarga autenticada con bearer en memoria hacia `Blob` y liberación inmediata con `URL.revokeObjectURL`, sustitución, eliminación con confirmación y avisos diferenciados cuando `X-File-Cleanup-Pending` es `'true'`. Además, en entorno `test` el router de autenticación respeta `config.http.rateLimit.maxRequests` para evitar falsos `429` al ejecutar la suite E2E completa.

Validación local: `pnpm --filter @devpath/web test` (incluyendo `apps/web/src/features/cv/api.test.ts`), `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build` y `pnpm test:e2e` sobre PostgreSQL 18 aislado (11/11 pruebas E2E aprobadas, incluyendo `CV-02: upload, reload, authenticated download, replace and delete a private PDF`). No se atribuye CI remoto ni aceptación humana P5.

PR sugerido: **feat(web): add private CV panel in profile (CV-02)**. Cuerpo: “Implementa la sección de CV privado en perfil: subida y sustitución multipart sin boundary manual, metadatos, descarga autenticada vía Blob con liberación de ObjectURL, borrado con confirmación, avisos de limpieza pendiente y pruebas unitarias/E2E.” Destino: `develop`. Sin merge automático.

## QA-03

Archivos: `docs/acceptance/M2-cases.md`, `docs/acceptance/M2-results.md`, `tests/e2e/cv.spec.ts`, `docs/handoffs/lote-07.md`.

Se documentaron los casos de aceptación M2 (`PRJ-ACC-01`, `PRJ-ACC-02`, `CV-ACC-01`, `CV-ACC-02`, `CV-ACC-03`) y regresión M1 (`REG-M1-ACC-01`) sobre el commit integrado `65cc14f`, verificando explícitamente en `tests/e2e/cv.spec.ts` el rechazo de archivo no PDF en UI, la invariabilidad de `/api/v1/me/skills` tras subir un CV con nombres de tecnologías del catálogo, la ausencia de token en la URL durante la descarga autenticada vía Blob y el regreso operativo al flujo de análisis manual M1 (`/analysis/new` → `/analyses/:id`).

Validación local: `pnpm install --frozen-lockfile --offline`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build` y `pnpm test:e2e` sobre PostgreSQL 18 aislado (11/11 pruebas E2E aprobadas). No se atribuye aprobación humana P5 ni cierre de release `v0.2.0` (`REL-02`).

PR sugerido: **docs(qa): record M2 acceptance and M1 regression results (QA-03)**. Cuerpo: “Registra la matriz de casos y resultados de aceptación M2 (`M2-cases.md`, `M2-results.md`), amplía la verificación E2E de CV con invariabilidad de skills y regreso al flujo M1, y actualiza el handoff del Lote 07.” Destino: `develop`. Sin merge automático.
