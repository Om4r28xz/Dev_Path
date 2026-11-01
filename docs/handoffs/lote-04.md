# Handoff lote 04

Base revisada tras `git fetch origin`: `origin/develop` en `659e305`. AUTH-02, PRO-01, ENG-02, AUTH-03 y AUTH-04 están integradas. La conexión autenticada de las rutas de perfil también llegó a `develop` mediante el PR #17. El lote aún requiere aceptación manual y cierre de release; los merges por sí solos no acreditan esos criterios.

| Tarea   | Estado                       | Evidencia / siguiente acción |
| ------- | ---------------------------- | ---------------------------- |
| AUTH-02 | Integrada                    | PR #13, merge `7f85f76`; la rama remota fue eliminada. |
| PRO-01  | Integrada                    | PR #12, merge `d32165e`; rutas autenticadas conectadas en PR #17, merge `659e305`. Falta aceptación del flujo real. |
| ENG-02  | Integrada                    | PR #10, merge `3fbaa16`. |
| AUTH-03 | Integrada                    | PR #14, merge `c17a6a4`; prueba manual de dos pestañas con API real aún pendiente. |
| AUTH-04 | Integrada                    | PR #15, merge `3a5f2b6`; falta recorrido manual de registro/login/logout, teclado, foco y revisión P5. |

## Cierre pendiente

- Ejecutar el recorrido de AUTH-03 con navegador en dos pestañas, API y PostgreSQL reales: recarga, expiración controlada, refresh concurrente y logout durante solicitudes.
- Ejecutar el recorrido de AUTH-04 con cuenta nueva, datos inválidos, credenciales falsas, sesión expirada, teclado y foco; obtener revisión P5.
- Verificar las rutas de PRO-01 con bearer firmado y dos cuentas sobre API y PostgreSQL reales tras el PR #17. El test de integración del PR cubre bearer/cookie y rutas desconocidas, pero no equivale al recorrido manual completo.
- Registrar evidencia de aceptación y la publicación humana de release antes de marcar el lote completo.

En la revisión de este handoff no se ejecutó el recorrido manual: el motor Linux de Docker Desktop no respondió y este checkout no contiene `infra/.env` ni `.local-data/keys/access-private.pem`. La ausencia de estos archivos locales no afecta los merges, pero impide acreditar aquí la aceptación con el stack real. Ejecutar `docs/SETUP_LOCAL.md` en un entorno habilitado y registrar los resultados con P5.

## AUTH-04

Contrato consumido: `packages/contracts/openapi/public.yaml` 1.0.0, `POST /auth/register` y `POST /auth/login` con respuesta `SessionResponse`. Los formularios respetan límites de nombre, email y contraseña; usan la API real mediante `authRequest` y entregan el access token al provider de AUTH-03, sin web storage. El guard espera bootstrap antes de mostrar rutas privadas, y el retorno tras login/registro admite únicamente rutas internas seguras. El botón de salida invoca logout real; los envíos usan bloqueo inmediato y estados pendientes para evitar doble operación. Errores de credenciales, conflicto, 429 y 503 muestran mensajes controlados, y los errores de campo y de servidor tienen foco accesible.

Archivos: `apps/web/src/features/auth/pages/{LoginPage,RegisterPage}.tsx`, `RouteGuards.tsx`, `form-utils.ts` y su prueba; `apps/web/src/app/router.tsx`, `apps/web/src/components/layout/AppLayout.tsx`, `apps/web/src/styles/index.css` y este handoff.

Validación de la rama: build web, lint, Prettier y 22 pruebas unitarias, incluidas validación, retorno interno y mensajes, además de las pruebas previas de sesión. Queda pendiente el recorrido manual de registro/login/logout con API y PostgreSQL reales, teclado y foco, y revisión P5. PR #15 integrado en `develop` (`3a5f2b6`): **feat(auth): connect access screens and private routes (AUTH-04)**. La integración no marca aceptación manual ni release como completados.

## AUTH-03

Contrato consumido: `packages/contracts/openapi/public.yaml` 1.0.0, sin cambios de DTO ni catálogo. El cliente usa `POST /api/v1/auth/refresh` y `POST /api/v1/auth/logout` con `X-DevPath-Client: web`, JSON y cookie HttpOnly administrada por el navegador. El access token permanece únicamente en memoria. Las peticiones protegidas usan bearer; solo `401 UNAUTHENTICATED` permite un refresh y un reintento. `403`, `429` y `503` no lo hacen. Un fallo ambiguo de refresh deja el estado `unavailable` y bloquea reintentos automáticos.

Archivos: `apps/web/src/lib/http/{client,transport}.ts`, `apps/web/src/lib/session/session.ts`, `apps/web/src/features/auth/SessionProvider.tsx`, `apps/web/src/app/App.tsx` y pruebas enfocadas en `apps/web/src/lib/{http,session}/*.test.ts`. El provider hace bootstrap; el cliente usa single-flight por pestaña y Web Locks + BroadcastChannel para compartir la sesión rotada entre pestañas. Cambio de cuenta y logout cancelan consultas y vacían QueryClient antes de publicar la nueva identidad. Si logout falla, se conserva el estado local para no afirmar una revocación no confirmada.

Soporte: con Web Locks y BroadcastChannel disponibles, las pestañas serializan refresh/logout y comparten el access token únicamente por memoria del mismo origen. Sin Web Locks hay single-flight por pestaña y difusión por BroadcastChannel, pero no se puede garantizar exclusión mutua entre pestañas; se requiere recargar o iniciar sesión si una carrera invalida la familia. Sin BroadcastChannel se mantiene la coordinación del lock, pero cada pestaña obtiene su token al hacer bootstrap. No se usa localStorage ni sessionStorage para credenciales.

Validación: build de web, lint y 11 pruebas unitarias enfocadas en dos pestañas, single-flight, 401 frente a 403/429/503, refresh/logout concurrentes, cambio de cuenta y fallo ambiguo. Pendiente prueba manual de navegador con API/PostgreSQL reales, expiración controlada y logout durante solicitudes. PR integrado: **feat(auth): coordinate browser sessions across tabs (AUTH-03)**, #14 hacia `develop`. Revisión P1/P2 del flujo real de cookies y pestañas sigue pendiente.

## PRO-01

Rama `feature/pro-01-profile-skills-api`, worktree `.worktrees/pro-01`. Contrato consumido: `packages/contracts/openapi/public.yaml` 1.0.0 y catálogo 1.0.0. La migración Drizzle añade `app.profiles.skills_revision` con valor inicial 0; no cambia DTO ni catálogo.

Archivos: `packages/db/src/schema/index.ts`, migración 0001 y metadatos, `apps/api/src/modules/profile/repository.ts`, `http/router.ts`, prueba de integración y este handoff.

Comportamiento implementado en router inyectable: GET/PATCH /me; GET /skills con búsqueda literal, límite 1–50 y cursor estable; GET/PUT /me/skills con IDs únicos, máximo 100, validación contra catálogo, reemplazo y revisión atómicos. Las consultas usan el ID autenticado suministrado por el middleware; no admiten userId del cuerpo. El PR #17 monta el router en `server.ts` mediante `accessTokenMiddleware` y agrega cobertura de integración con bearer real, rechazo de cookie en ruta de negocio y rutas desconocidas.

Validación de la rama PRO-01: PostgreSQL 18 aislado en DB `devpath_pro01` del puerto `127.0.0.1:55452`, separado de AUTH-02. Migración y seed de 10 skills OK. API 28/28 pruebas con dos cuentas, búsqueda/paginación, entradas inválidas, sustitución vacía, carrera de revisión y rollback ante fallo de inserción. Typecheck de API y DB, build API, lint, Prettier y `git diff --check` pasan. El PR #17 añadió una prueba de integración con JWT firmado; queda pendiente la aceptación manual del flujo.

PR integrado: **feat(profile): add profile and skills API (PRO-01)**, #12 hacia `develop`. Se añadió revisión de habilidades, rutas y repositorio de perfil/catálogo/habilidades, validación y pruebas sobre PostgreSQL real. La conexión de `profileRouter` con `accessTokenMiddleware` llegó por el PR #17 (`659e305`). Sigue pendiente el recorrido de aceptación con bearer firmado, dos cuentas y PostgreSQL real antes de release.
