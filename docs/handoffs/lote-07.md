# Lote 07 — Proyectos y CV privado

Estado verificado el 3 de noviembre de 2026. Base actual de `origin/develop`: `c4b5ad0` (PR #48, PRJ-01 integrado). REL-01, CTR-02, AUTH-03 y VIS-04 están integradas. Contrato consumido: `packages/contracts/openapi/m2.yaml` 0.1.0, `packages/contracts/EXTENDED-CONTRACTS.md` y catálogo 1.0.0. No se cambiaron los contratos.

| Tarea  | Estado                                                                                                 | Evidencia y continuación                                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRJ-01 | Integrada en `develop` mediante PR [#48](https://github.com/Om4r28xz/Dev_Path/pull/48), merge `c4b5ad0` | Migración 0004, esquema, CRUD con aislamiento por propietario, validación y pruebas integrados.                                                    |
| PRJ-02 | Implementada sin merge en `feature/prj-02-projects-ui`, base `c4b5ad0`                                 | Lista, alta, edición y borrado reales, selector de tecnologías, enlaces seguros y E2E con recarga. Crear PR hacia `develop` y esperar merge humano. |
| CV-01  | Implementada sin merge en `feature/cv-01-private-storage-api`, commit local `479da94`                   | Tras integrar PRJ-02, sincronizar con `develop` y regenerar su migración como 0005 porque PRJ-01 ya ocupa 0004.                                     |
| CV-02  | Bloqueada                                                                                              | Requiere CV-01 integrada en `develop`. AUTH-03 y VIS-04 ya están integradas.                                                                        |
| QA-03  | Bloqueada                                                                                              | Requiere PRJ-02 y CV-02 integradas en `develop`.                                                                                                   |

## PRJ-01

PR [#48](https://github.com/Om4r28xz/Dev_Path/pull/48) integrada en `develop`. El CRUD usa `userId` del token, filtros SQL por propietario, 404 uniforme para recurso ajeno o ausente, validación de URL sin solicitudes de red y `skillIds` contra catálogo. Escrituras y `projects_revision` comparten transacción. La paginación conserva microsegundos y liga el cursor al propietario. El borrado no toca `app.user_skills`.

Validación local previa al merge: migraciones 0000–0004 y seed de catálogo en PostgreSQL 18 aislado, `pnpm typecheck`, build de API y `pnpm --filter @devpath/api test`: 13 archivos y 122 pruebas aprobadas.

## PRJ-02

La página `/profile/projects` consume el CRUD de PRJ-01 con React Query y ofrece lista paginada, estados de carga, error y vacío, alta y edición con borrador preservado, selector de tecnologías del catálogo y borrado con confirmación. Cada tarjeta identifica el contenido como autodeclarado. Los enlaces externos solo aceptan HTTP(S) y se abren con `target="_blank"` y `rel="noreferrer"`.

Archivos principales: `apps/web/src/features/projects/{api,types}.ts`, `apps/web/src/features/projects/components/{ProjectCard,DeleteProjectDialog}.tsx`, `apps/web/src/features/projects/pages/ProjectsPage.tsx`, su hoja de estilos y pruebas; rutas y navegación en `apps/web/src/app/router.tsx`, `apps/web/src/components/layout/AppLayout.tsx` y `apps/web/src/features/profile/pages/ProfilePage.tsx`; flujo real en `tests/e2e/projects.spec.ts`.

Validación local:

- `pnpm --filter @devpath/web test`: 11 archivos y 103 pruebas aprobadas.
- `pnpm typecheck`, `pnpm build`, `pnpm lint` y `pnpm format:check`: aprobados.
- `pnpm test`: web 103, engine 51, API 64 aprobadas y 58 omitidas por entorno; catálogos, contratos y soporte E2E aprobados.
- `pnpm test:e2e -- tests/e2e/projects.spec.ts`: flujo real aprobado contra API, engine y PostgreSQL. Cubre alta por teclado sin doble envío, enlace seguro, persistencia tras recarga, edición, cancelación por Escape, borrado y ancho de 320 px.

Pendiente de revisión humana P5: zoom al 200 %, lector de pantalla, comprensión de los textos y revisión visual de contraste y móvil. No se atribuye CI remoto ni revisión humana.

PR sugerido hacia `develop`: **feat(web): add projects portfolio UI (PRJ-02)**. No hacer merge automático.
