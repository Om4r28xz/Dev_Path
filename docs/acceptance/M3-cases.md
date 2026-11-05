# Matriz de aceptación M3 y criterios E3 — QA-04

Alcance: adaptador de proveedor JSearch en API (`JSR-02`), análisis de vacantes normalizadas del proveedor mediante el Skill Engine (`JSR-03`), interfaz `/jobs` con distinción explícita `fixture`/`live` y continuidad del sistema visual del lote 06.5 (`JSR-04`), separación estricta entre evidencia en modo `fixture` (mocks/sintéticos) y proveedor real (`live`), preservación del flujo de análisis manual (`M1`) y matriz de verificación del microservicio E3 sobre el commit integrado `fad9d1a` (`develop`). Contratos vigentes: `packages/contracts/openapi/public.yaml` (`1.1.0`), `packages/contracts/openapi/m2.yaml` (`0.1.0`), `packages/contracts/openapi/m3-proposed.yaml` (`0.1.0` con cursor confidencial AES-256-GCM según ADR 0005), catálogo `1.0.0`.

## JSR-ACC-01 — Búsqueda controlada por submit, paginación con cursor cifrado y detalle normalizado (modo fixture)

- Pantalla/endpoint: `/jobs` → `GET /api/v1/jobs`, `GET /api/v1/jobs/details`.
- Precondiciones: Cuenta autenticada con Bearer JWT; `JOBS_PROVIDER_MODE=fixture` (por defecto).
- Entrada: `q="React"`, `location="Remoto"`; selección de `providerId="synthetic-job-001"`.
- Pasos: Verificar que teclear en el campo no dispara peticiones HTTP; enviar formulario con botón `Buscar vacantes`; avanzar página con `nextCursor` (`j1.<base64url>`) cuando `hasNextPage=true`; consultar detalle de la vacante seleccionada.
- Esperado: `401` sin JWT; `200 OK` con vacantes normalizadas y `mode="fixture"`; rechazo `400` de `page > 1` sin cursor, de cursores manipulados/expirados o de otro usuario/consulta, y de URLs arbitrarias en `providerId` (prevención de SSRF).
- Criterio del plan/dependencia: `JSR-02`, `JSR-04`, ADR 0005.
- Estado: aprobado técnicamente en modo `fixture` (`apps/api/tests/integration/jobs.test.ts`, `apps/web/src/features/jobs/pages/JobsPage.test.tsx`, `tests/e2e/jobs.spec.ts`).

## JSR-ACC-02 — Distinción explícita fixture vs live, sistema visual (lote 06.5) y atribución segura

- Pantalla/endpoint: `/jobs` (`JobsPage`).
- Precondiciones: Sesión iniciada en navegador.
- Entrada: Respuestas con `mode="fixture"` y simulación controlada de `mode="live"`.
- Pasos: Inspeccionar insignia de procedencia (`role="status"`), alerta informativa de datos sintéticos, escapado de etiquetas HTML/scripts en descripción (`<script>`, `<b>`) y atributos del enlace externo (`applyUrl`).
- Esperado: En modo `fixture` se muestra explícitamente `Modo demostración (fixtures sintéticos)` y el aviso de que no son ofertas actuales ni consumen cuota; el HTML del proveedor se presenta como texto plano escapado; el enlace externo incluye `target="_blank"` y `rel="noopener noreferrer"`; la pantalla respeta tokens, foco visible, navegación por teclado y ancho móvil `320px` sin scroll horizontal (`docs/design/SISTEMA_VISUAL.md`).
- Criterio del plan/dependencia: `JSR-01`, `JSR-04`, `VIS-01`–`VIS-04`.
- Estado: aprobado técnicamente (`apps/web/src/features/jobs/pages/JobsPage.test.tsx`, `tests/e2e/jobs.spec.ts`).

## JSR-ACC-03 — Análisis de vacante del proveedor e idempotencia reutilizando el Skill Engine

- Pantalla/endpoint: `/jobs` → `POST /api/v1/analyses` (`source: { type: "jsearch", providerId }`), `/analyses/:id`.
- Precondiciones: Usuario autenticado con habilidades guardadas (`JavaScript`, `React`); vacante `synthetic-job-001` seleccionada (`JavaScript`, `React`, `Git`).
- Entrada: `POST /api/v1/analyses` con `Idempotency-Key` y `source.type="jsearch"`.
- Pasos: Presionar `Analizar compatibilidad con mi perfil` (incluyendo prueba de doble clic), verificar renderizado con el componente compartido `AnalysisResult` y abrir el detalle guardado en `/analyses/:id`.
- Esperado: El servidor resuelve `providerId` mediante `JobsProvider.getJobDetails` (rechaza con `400` cualquier intento del cliente de inyectar texto en `source.type="jsearch"`), invoca al Skill Engine, calcula `67%` (`matched: ["javascript", "react"]`, `missing: ["git"]`), guarda `source: { type: "jsearch", providerId: "synthetic-job-001" }` con idempotencia (`201` inicial, `200` replay, `409` conflicto de payload) y muestra el resultado sin alterar el algoritmo de M1.
- Criterio del plan/dependencia: `JSR-03`, `JSR-04`.
- Estado: aprobado técnicamente en modo `fixture` (`apps/api/tests/integration/jsearch-analysis.test.ts`, `apps/web/src/features/jobs/pages/JobsPage.test.tsx`, `tests/e2e/jobs.spec.ts`).

## JSR-ACC-04 — Manejo de fallos del proveedor (429, 504, 503, 404), compuerta de retención live y supervivencia del flujo manual

- Pantalla/endpoint: `/jobs`, `/analysis/new`, `GET /api/v1/jobs`, `GET /api/v1/jobs/details`, `POST /api/v1/analyses`.
- Precondiciones: Respuestas de error simuladas del proveedor (`429 RATE_LIMITED`, `504 DEPENDENCY_TIMEOUT`, `503 DEPENDENCY_UNAVAILABLE`, `404 NOT_FOUND`) y modo `live` con `JOBS_LIVE_RETENTION_ALLOWED != 'true'`.
- Entrada: Búsqueda/detalle/análisis cuando el proveedor falla o cuando la retención live está bloqueada por `JSR-01`.
- Pasos: Provocar errores `429`/`504`/`503`/`404` en API y UI; verificar ausencia de reintentos automáticos en `429` y ausencia de filtración de `RAPIDAPI_KEY`; navegar a `/analysis/new` y crear un análisis manual (`source.type="text"`).
- Esperado: Mensajes claros y sin alarmismo en UI explicando cuota (`429`), timeout de 5 s (`504`) o indisponibilidad/permiso de retención (`503`); cero exposición de `RAPIDAPI_KEY` en cuerpos o logs; si `nextCursor` falla se conservan los resultados de la primera página; el análisis manual en `/analysis/new` funciona al 100 % aunque JSearch falle o esté deshabilitado.
- Criterio del plan/dependencia: `JSR-01`, `JSR-02`, `JSR-03`, `JSR-04`, `QA-04`.
- Estado: aprobado técnicamente con dobles de prueba y E2E (`apps/api/tests/integration/jobs.test.ts`, `apps/api/tests/integration/jsearch-analysis.test.ts`, `apps/web/src/features/jobs/pages/JobsPage.test.tsx`, `tests/e2e/jobs.spec.ts`).

## JSR-ACC-05 — Llamada real acotada a JSearch (`live`) y verificación de permisos de cuenta/retención

- Pantalla/endpoint: `LiveJSearchProvider` → `https://jsearch.p.rapidapi.com/search` y `/job-details`.
- Precondiciones definidas en `docs/provider/JSEARCH.md`:
  1. Evidencia de suscripción de cuenta en RapidAPI con hard cap total que impida cualquier cargo (incluyendo transferencia).
  2. Términos expresos del proveedor que autoricen mostrar resultados y/o retener descripciones y derivados para `JSR-03`.
  3. Credencial `RAPIDAPI_KEY` en entorno local del servidor (`JOBS_PROVIDER_MODE=live`, `JOBS_LIVE_ENABLED=true`) y autorización humana para una consulta acotada (`num_pages=1`).
- Estado: **pendiente / bloqueado externamente por acceso y permisos del proveedor (`JSR-01`)**. No existe `RAPIDAPI_KEY` ni confirmación de hard cap/retención en el entorno actual; conforme a las reglas del proyecto, **no se simula ni se marca como completada la integración `live` a partir de fixtures o mocks**.
