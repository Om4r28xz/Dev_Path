# Handoff lote 04

Base revisada tras `git fetch origin`: `origin/develop` en `c17a6a4`. AUTH-01, DAT-01, CAT-01, WEB-01, AUTH-02, PRO-01, ENG-02 y AUTH-03 están integradas. AUTH-04 parte de este merge, no de otra rama feature.

| Tarea   | Estado                       | Evidencia / siguiente acción |
| ------- | ---------------------------- | ---------------------------- |
| AUTH-02 | Integrada                    | PR #13, merge `7f85f76`; la rama remota fue eliminada. |
| PRO-01  | Integrada, conexión pendiente | PR #12, merge `d32165e`; `profileRouter` sigue sin montarse en `server.ts`. Conectarlo a `accessTokenMiddleware` antes de release. |
| ENG-02  | Integrada                    | PR #10, merge `3fbaa16`. |
| AUTH-03 | Integrada                    | PR #14, merge `c17a6a4`; prueba manual de dos pestañas con API real aún pendiente. |
| AUTH-04 | Implementada sin merge       | Rama `feature/auth-04-auth-screens` desde `c17a6a4`; revisar con P5 y crear PR a `develop`. |

## AUTH-04

Contrato consumido: `packages/contracts/openapi/public.yaml` 1.0.0, `POST /auth/register` y `POST /auth/login` con respuesta `SessionResponse`. Los formularios respetan límites de nombre, email y contraseña; usan la API real mediante `authRequest` y entregan el access token al provider de AUTH-03, sin web storage. El guard espera bootstrap antes de mostrar rutas privadas, y el retorno tras login/registro admite únicamente rutas internas seguras. El botón de salida invoca logout real; los envíos usan bloqueo inmediato y estados pendientes para evitar doble operación. Errores de credenciales, conflicto, 429 y 503 muestran mensajes controlados, y los errores de campo y de servidor tienen foco accesible.

Archivos: `apps/web/src/features/auth/pages/{LoginPage,RegisterPage}.tsx`, `RouteGuards.tsx`, `form-utils.ts` y su prueba; `apps/web/src/app/router.tsx`, `apps/web/src/components/layout/AppLayout.tsx`, `apps/web/src/styles/index.css` y este handoff.

Validación: build web, lint, Prettier y 22 pruebas unitarias, incluidas validación, retorno interno y mensajes, además de las pruebas previas de sesión. Queda pendiente el recorrido manual de registro/login/logout con API y PostgreSQL reales, teclado y foco, y revisión P5. PR propuesto: **feat(auth): connect access screens and private routes (AUTH-04)**, destino `develop`. Cuerpo: conecta formularios a la API, espera bootstrap en rutas privadas, valida retornos internos y ofrece logout. No marca aceptación manual ni release como completados.

## AUTH-03

Contrato consumido: `packages/contracts/openapi/public.yaml` 1.0.0, sin cambios de DTO ni catálogo. El cliente usa `POST /api/v1/auth/refresh` y `POST /api/v1/auth/logout` con `X-DevPath-Client: web`, JSON y cookie HttpOnly administrada por el navegador. El access token permanece únicamente en memoria. Las peticiones protegidas usan bearer; solo `401 UNAUTHENTICATED` permite un refresh y un reintento. `403`, `429` y `503` no lo hacen. Un fallo ambiguo de refresh deja el estado `unavailable` y bloquea reintentos automáticos.

Archivos: `apps/web/src/lib/http/{client,transport}.ts`, `apps/web/src/lib/session/session.ts`, `apps/web/src/features/auth/SessionProvider.tsx`, `apps/web/src/app/App.tsx` y pruebas enfocadas en `apps/web/src/lib/{http,session}/*.test.ts`. El provider hace bootstrap; el cliente usa single-flight por pestaña y Web Locks + BroadcastChannel para compartir la sesión rotada entre pestañas. Cambio de cuenta y logout cancelan consultas y vacían QueryClient antes de publicar la nueva identidad. Si logout falla, se conserva el estado local para no afirmar una revocación no confirmada.

Soporte: con Web Locks y BroadcastChannel disponibles, las pestañas serializan refresh/logout y comparten el access token únicamente por memoria del mismo origen. Sin Web Locks hay single-flight por pestaña y difusión por BroadcastChannel, pero no se puede garantizar exclusión mutua entre pestañas; se requiere recargar o iniciar sesión si una carrera invalida la familia. Sin BroadcastChannel se mantiene la coordinación del lock, pero cada pestaña obtiene su token al hacer bootstrap. No se usa localStorage ni sessionStorage para credenciales.

Validación: build de web, lint y 11 pruebas unitarias enfocadas en dos pestañas, single-flight, 401 frente a 403/429/503, refresh/logout concurrentes, cambio de cuenta y fallo ambiguo. Pendiente prueba manual de navegador con API/PostgreSQL reales, expiración controlada y logout durante solicitudes. PR integrado: **feat(auth): coordinate browser sessions across tabs (AUTH-03)**, #14 hacia `develop`. Revisión P1/P2 del flujo real de cookies y pestañas sigue pendiente.

## PRO-01

Rama `feature/pro-01-profile-skills-api`, worktree `.worktrees/pro-01`. Contrato consumido: `packages/contracts/openapi/public.yaml` 1.0.0 y catálogo 1.0.0. La migración Drizzle añade `app.profiles.skills_revision` con valor inicial 0; no cambia DTO ni catálogo.

Archivos: `packages/db/src/schema/index.ts`, migración 0001 y metadatos, `apps/api/src/modules/profile/repository.ts`, `http/router.ts`, prueba de integración y este handoff.

Comportamiento implementado en router inyectable: GET/PATCH /me; GET /skills con búsqueda literal, límite 1–50 y cursor estable; GET/PUT /me/skills con IDs únicos, máximo 100, validación contra catálogo, reemplazo y revisión atómicos. Las consultas usan el ID autenticado suministrado por el middleware; no admiten userId del cuerpo. El router sigue sin montarse en `server.ts` aunque AUTH-02 ya está integrado. El test inyecta una identidad sintética para verificar el dominio, no sustituye la prueba de JWT final.

Validación: PostgreSQL 18 aislado en DB `devpath_pro01` del puerto `127.0.0.1:55452`, separado de AUTH-02. Migración y seed de 10 skills OK. API 28/28 pruebas con dos cuentas, búsqueda/paginación, entradas inválidas, sustitución vacía, carrera de revisión y rollback ante fallo de inserción. Typecheck de API y DB, build API, lint, Prettier y `git diff --check` pasan. Falta verificar el flujo con JWT real tras la integración de AUTH-02.

PR integrado: **feat(profile): add profile and skills API (PRO-01)**, #12 hacia `develop`. Se añadió revisión de habilidades, rutas y repositorio de perfil/catálogo/habilidades, validación y pruebas sobre PostgreSQL real. Sigue pendiente conectar `profileRouter` al middleware `accessTokenMiddleware` de AUTH-02 y revalidar el flujo con bearer firmado antes de release.
