# Handoff lote 04

Base revisada tras `git fetch origin`: `origin/develop` en `598ff90` (merge PR #9). AUTH-01 (`ca021d6`), DAT-01, CAT-01 y WEB-01 están integradas. ENG-02 permanece en la rama local `feature/eng-02-skill-matching`, commit `4848ce0`, sin merge.

| Tarea   | Estado                 | Siguiente acción                                                      |
| ------- | ---------------------- | --------------------------------------------------------------------- |
| AUTH-02 | Implementada sin merge | Revisar este commit con P2; PR propio a develop e integración humana. |
| PRO-01  | Pendiente              | Lista para rama propia desde develop actualizado.                     |
| ENG-02  | Implementada sin merge | Revisar `4848ce0` con P1; PR propio a develop.                        |
| AUTH-03 | Bloqueada              | Requiere AUTH-02 integrado y WEB-01, ya integrado.                    |
| AUTH-04 | Bloqueada              | Requiere AUTH-03 integrado.                                           |

## AUTH-02

Rama `feature/auth-02-refresh-logout`, worktree `.worktrees/auth-02`. Contrato consumido: `packages/contracts/openapi/public.yaml` 1.0.0; sin cambios de contrato ni migración. Archivos: repositorio y servicio auth, router, middleware de bearer, pruebas de integración y este handoff.

El refresh opaco rota bajo bloqueo transaccional de la familia; el token usado se marca en DB, la reutilización revoca la familia, y la nueva cookie conserva la expiración absoluta original. Logout revoca la familia y borra la cookie con 204. Los errores de DB dan 503, sin confirmar una revocación. El middleware verifica firma RS256, typ, issuer, audience, expiración, subject UUID, jti y role candidate. Las rutas de negocio solo aceptarán ese bearer; la cookie no autentica en ellas. Los endpoints auth preservan origen exacto, encabezado de cliente, JSON y limitación local de solicitudes.

Validación: PostgreSQL 18 aislado en `127.0.0.1:55452`, cluster y DB locales ignorados por Git. Migración OK; 28 pruebas API pasan con DB real, incluyendo rotación, carrera de refresh, reutilización, logout concurrente, origen malicioso, JWT inválidos y DB ausente. Typecheck, build y lint OK. La revisión final del diff y formato se registran al cerrar el commit. P2 revisa la implementación antes del merge.

PR propuesto: **feat(auth): rotate refresh sessions and verify access tokens (AUTH-02)**. Destino `develop`. Cuerpo: implementa refresh/logout con familia transaccional y cookie HttpOnly, revocación por reutilización, middleware de JWT RS256 y pruebas de DB real/errores; conserva OpenAPI 1.0.0. Solicitar revisión P2; no hacer merge desde la IA.
