# Lote 07 — Proyectos y CV privado

Estado verificado el 3 de noviembre de 2026. Base actual de `origin/develop`: `a6405d1` (PR #47, VIS-04 integrado). REL-01, CTR-02 y AUTH-03 están integradas en esa base. Contrato consumido: `packages/contracts/openapi/m2.yaml` 0.1.0, `packages/contracts/EXTENDED-CONTRACTS.md` y catálogo 1.0.0. No se cambiaron los contratos.

| Tarea  | Estado                                                                  | Evidencia y continuación                                                                                                                     |
| ------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| PRJ-01 | Implementada sin merge en `feature/prj-01-projects-api`, base `a6405d1` | Migración 0004, esquema, router/repository/validación y pruebas. Revisar PR/CI y hacer merge humano a develop.                               |
| PRJ-02 | Bloqueada                                                               | Requiere PRJ-01 integrada en develop. VIS-04 ya está integrada. Crear `feature/prj-02-projects-ui` desde develop actualizado tras ese merge. |
| CV-01  | Pendiente; Ready                                                        | CTR-02 y REL-01 integradas. Crear `feature/cv-01-private-storage-api` desde develop actualizado.                                             |
| CV-02  | Bloqueada                                                               | Requiere CV-01 integrada en develop. AUTH-03 y VIS-04 ya integradas.                                                                         |
| QA-03  | Bloqueada                                                               | Requiere PRJ-02 y CV-02 integradas en develop.                                                                                               |

## PRJ-01

Archivos de código: `packages/db/src/schema/index.ts`, `packages/db/src/schema/app.ts`, `packages/db/migrations/0004_youthful_senator_kelly.sql` y metadata Drizzle; `apps/api/src/modules/projects/{validation,repository,router}.ts`, `apps/api/src/server.ts`, `apps/api/src/platform/errors/http-error.ts`, `apps/api/tests/integration/projects.test.ts`. El contrato M2 no se modificó.

El CRUD usa `userId` del token, filtros SQL por propietario, 404 uniforme para recurso ajeno/ausente, validación de URL sin solicitudes de red y skillIds contra catálogo. Escrituras y `projects_revision` comparten transacción. La paginación conserva microsegundos y liga el cursor al propietario. El borrado no toca `app.user_skills`.

Validación local: instalación congelada offline, migraciones 0000–0004 y seed de catálogo en PostgreSQL 18 aislado (puerto 55477), `pnpm typecheck`, build de API y `pnpm --filter @devpath/api test`: 13 archivos/122 pruebas aprobadas. Las cuatro pruebas nuevas cubren CRUD, dos propietarios, entradas inválidas, rollback por fallo SQL inyectado y paginación/cursor. No se atribuye CI remoto ni revisión humana.

PR sugerido: **feat(api): implement own projects CRUD (PRJ-01)**. Cuerpo: “Implementa el contrato M2 de proyectos con propiedad por JWT, relaciones de catálogo y revisión transaccional. Añade migración 0004 y pruebas reales en PostgreSQL. Validación local: API 122/122, typecheck y build. Pendiente: CI y revisión P1/P2/P4 antes del merge.” Destino: `develop`. No hacer merge automático.
