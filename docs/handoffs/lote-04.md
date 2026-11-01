# Handoff lote 04

Base revisada tras `git fetch origin`: `origin/develop` en `598ff90` (merge PR #9). AUTH-01, DAT-01, CAT-01 y WEB-01 están integradas. ENG-02 y AUTH-02 se implementaron en ramas propias locales; no están integradas.

| Tarea   | Estado                              | Siguiente acción                                                                                                  |
| ------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| AUTH-02 | Implementada sin merge              | Rama `feature/auth-02-refresh-logout`, commit `8e63e36`; revisión P2 y PR a develop.                              |
| PRO-01  | Implementada parcialmente sin merge | Código, migración y pruebas en esta rama; conectar al middleware definitivo y montar rutas tras integrar AUTH-02. |
| ENG-02  | Implementada sin merge              | Rama `feature/eng-02-skill-matching`, commit `4848ce0`; revisión P1 y PR a develop.                               |
| AUTH-03 | Bloqueada                           | Requiere AUTH-02 integrado; WEB-01 ya está integrado.                                                             |
| AUTH-04 | Bloqueada                           | Requiere AUTH-03 integrado.                                                                                       |

## PRO-01

Rama `feature/pro-01-profile-skills-api`, worktree `.worktrees/pro-01`. Contrato consumido: `packages/contracts/openapi/public.yaml` 1.0.0 y catálogo 1.0.0. La migración Drizzle añade `app.profiles.skills_revision` con valor inicial 0; no cambia DTO ni catálogo.

Archivos: `packages/db/src/schema/index.ts`, migración 0001 y metadatos, `apps/api/src/modules/profile/repository.ts`, `http/router.ts`, prueba de integración y este handoff.

Comportamiento implementado en router inyectable: GET/PATCH /me; GET /skills con búsqueda literal, límite 1–50 y cursor estable; GET/PUT /me/skills con IDs únicos, máximo 100, validación contra catálogo, reemplazo y revisión atómicos. Las consultas usan el ID autenticado suministrado por el middleware; no admiten userId del cuerpo. El router no está montado en `server.ts` hasta integrar el middleware AUTH-02: exponerlo sin verificación real del bearer sería inseguro. El test inyecta una identidad sintética para verificar el dominio, no sustituye la prueba de JWT final.

Validación: PostgreSQL 18 aislado en DB `devpath_pro01` del puerto `127.0.0.1:55452`, separado de AUTH-02. Migración y seed de 10 skills OK. API 28/28 pruebas con dos cuentas, búsqueda/paginación, entradas inválidas, sustitución vacía, carrera de revisión y rollback ante fallo de inserción. Typecheck de API y DB, build API, lint, Prettier y `git diff --check` pasan. Falta verificar el flujo con JWT real tras la integración de AUTH-02.

PR propuesto: **feat(profile): add profile and skills API (PRO-01)**. Destino `develop`. Cuerpo: añade revisión de habilidades, rutas y repositorio de perfil/catálogo/habilidades, validación y pruebas sobre PostgreSQL real. Antes de integrar, conectar `profileRouter` al middleware `accessTokenMiddleware` de AUTH-02 y revalidar el flujo con bearer firmado. Revisión P2.
