# Matriz de aceptación M2 — QA-03

Alcance: proyectos autodeclarados (`PRJ-01`, `PRJ-02`), almacenamiento y panel de CV privado (`CV-01`, `CV-02`), privacidad entre cuentas, ausencia de modificación automática de habilidades por el CV y regresión del flujo M1 sobre el commit integrado `65cc14f` (`origin/develop`). Contratos vigentes: `packages/contracts/openapi/m2.yaml` (`0.1.0`), `packages/contracts/EXTENDED-CONTRACTS.md`, catálogo `1.0.0`.

## PRJ-ACC-01 — CRUD propio de proyectos y revisión transaccional

- Pantalla/endpoint: `/profile/projects` → `GET/POST /api/v1/projects`, `PATCH/DELETE /api/v1/projects/:id`.
- Precondiciones: Cuenta A autenticada; DB de pruebas aislada con catálogo `1.0.0`.
- Entrada: `title="Portfolio sintético"`, `description="Construí la interfaz."`, `url="https://example.org/portfolio"`, `skillIds=["react"]`.
- Pasos: Crear proyecto, recargar, editar título a `Portfolio actualizado`, recargar y eliminar tras confirmación.
- Esperado: `201`/`200`/`204`; persistencia real tras recarga; `projects_revision` incrementa transaccionalmente; borrar proyecto no elimina habilidades personales de `/api/v1/me/skills`; las URLs se validan como dato sin disparar `fetch` desde el servidor.
- Criterio del plan/dependencia: `PRJ-01`, `PRJ-02`.
- Estado: aprobado técnicamente (`apps/api/tests/integration/projects.test.ts`, `tests/e2e/projects.spec.ts`).

## PRJ-ACC-02 — Aislamiento entre dos cuentas y claridad de evidencia autodeclarada

- Pantalla/endpoint: `/profile/projects` y `/api/v1/projects/:id`.
- Precondiciones: Cuentas A y B registradas.
- Entrada: Proyecto creado por Cuenta A.
- Pasos: Intentar `PATCH` y `DELETE` sobre el ID de Cuenta A con token de Cuenta B; verificar aviso en UI de proyectos.
- Esperado: `404` para Cuenta B; la interfaz muestra explícitamente que la información es autodeclarada y los enlaces externos usan `target="_blank"` y `rel="noreferrer"`.
- Criterio del plan/dependencia: `PRJ-01`, `PRJ-02`.
- Estado: aprobado técnicamente (`apps/api/tests/integration/projects.test.ts`, `tests/e2e/projects.spec.ts`).

## CV-ACC-01 — Subida, metadatos, sustitución, descarga privada vía Blob y eliminación

- Pantalla/endpoint: `/profile` (`CvPanel`) → `PUT/GET/DELETE /api/v1/me/cv`, `GET /api/v1/me/cv/download`.
- Precondiciones: Cuenta A autenticada.
- Entrada: PDF sintético válido `cv-inicial.pdf` y reemplazo `cv-actualizado.pdf` (≤ 5 MiB).
- Pasos: Subir con doble clic controlado, recargar `/profile`, descargar mediante `Blob`, sustituir por segundo PDF, recargar y eliminar con confirmación.
- Esperado: Una sola petición `PUT` ante doble clic; metadatos visibles tras recarga; descarga con `Content-Disposition: attachment` y `Cache-Control: no-store` sin exponer bearer en URL ni historial; `URL.revokeObjectURL` ejecutado; eliminación limpia estado activo.
- Criterio del plan/dependencia: `CV-01`, `CV-02`.
- Estado: aprobado técnicamente (`apps/api/tests/integration/cv.test.ts`, `apps/web/src/features/cv/api.test.ts`, `tests/e2e/cv.spec.ts`).

## CV-ACC-02 — Límites de tamaño/tipo, compensación ante fallos y privacidad entre cuentas

- Pantalla/endpoint: `PUT/GET/DELETE /api/v1/me/cv`, `GET /api/v1/me/cv/download`.
- Precondiciones: Cuentas A y B autenticadas; almacenamiento fuera de webroot.
- Entrada: Archivo `.txt` no PDF, archivo con firma inválida, PDF > 5 MiB (`5 242 881` bytes), nombre con path traversal.
- Pasos: Intentar cargas inválidas en UI y API; consultar/descargar CV de A usando token de B; inyectar fallo de DB/disco en sustitución y borrado.
- Esperado: Rechazo claro (`413`/`415`/`400`); Cuenta B recibe `404` y no ve ni descarga el CV de A; si falla DB durante reemplazo se conserva el CV confirmado anterior; si falla el borrado físico se marca `X-File-Cleanup-Pending: true` y la reconciliación limpia huérfanos.
- Criterio del plan/dependencia: `CV-01`, `CV-02`.
- Estado: aprobado técnicamente (`apps/api/tests/integration/cv.test.ts`, `apps/web/src/features/cv/api.test.ts`, `tests/e2e/cv.spec.ts`).

## CV-ACC-03 — El CV no modifica habilidades ni se envía al Skill Engine

- Pantalla/endpoint: `/profile` (`CvPanel`), `GET /api/v1/me/skills` y `/analysis/new`.
- Precondiciones: Cuenta A sin habilidades declaradas (`skillIds: []`).
- Entrada: PDF sintético cuyo contenido incluye nombres del catálogo (`React TypeScript Docker Kubernetes`).
- Pasos: Verificar aviso en pantalla, subir PDF y consultar `GET /api/v1/me/skills`.
- Esperado: La pantalla informa que DevPath no analiza ni extrae habilidades automáticamente; `GET /api/v1/me/skills` permanece sin cambios (`[]`).
- Criterio del plan/dependencia: `CV-01`, `CV-02`, `QA-03`.
- Estado: aprobado técnicamente (`tests/e2e/cv.spec.ts`, `apps/api/tests/integration/cv.test.ts`).

## REG-M1-ACC-01 — Continuidad visual, accesibilidad y regreso al flujo M1

- Pantalla/endpoint: `/profile`, `/profile/projects`, `/analysis/new`, `/analyses/:id`.
- Precondiciones: Suite completa sobre PostgreSQL aislado y servicios reales (`web`, `api`, `skill-engine`).
- Entrada: Vacante sintética tras operar proyectos y CV privado.
- Pasos: Navegar de `/profile` a `/analysis/new`, ejecutar análisis manual y ejecutar la suite de regresión M1 (`acceptance.spec.ts`, `m1.spec.ts`, `profile-skills-readiness.spec.ts`, `profile-target-size.spec.ts`).
- Esperado: El análisis manual se crea y muestra resultado sin regresión; se mantienen foco, teclado, tamaño de objetivos y ausencia de scroll horizontal en móvil (`320px`).
- Criterio del plan/dependencia: `QA-03`.
- Estado: aprobado técnicamente (`tests/e2e/*.spec.ts`).
