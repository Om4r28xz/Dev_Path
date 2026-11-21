# Changelog

## 0.4.0 — M4 publicada

### Funcionalidad

- Plantillas curadas de aprendizaje sin IA generativa en `packages/catalog/learning-templates.json` (`1.0.0`): objetivos por tecnología del catálogo, grafo de prerequisitos acíclico verificado, actividades prácticas concretas, extensión sugerida de proyectos compatibles y recursos oficiales verificados.
- Generación determinista y persistencia atómica de rutas de aprendizaje en `POST /api/v1/learning-paths` (`generatorVersion: "rules-1"`, `Idempotency-Key` obligatoria `201`/`200`/`409`), a partir de un análisis propio guardado, el snapshot de habilidades personales, proyectos existentes y contenido versionado.
- Consulta paginada por cursor (`GET /api/v1/learning-paths`), detalle con pasos explicables (`GET /api/v1/learning-paths/:id`), actualización de estado por paso (`PATCH /api/v1/learning-paths/:id/steps/:stepId` para `pending`, `in_progress`, `completed` con `completedAt` coherente y porcentaje derivado) y eliminación (`DELETE /api/v1/learning-paths/:id`).
- Pantallas `/learning-paths` y `/learning-paths/:id` y acción desde el detalle de análisis (`/analyses/:id`): creación idempotente resistente a doble clic, visualización de motivo (`missing_from_analysis` / `prerequisite`), actividad sugerida, proyecto vinculado o conservado en texto cuando fue eliminado, recurso externo seguro (`http`/`https`), estado positivo explícito cuando el análisis tiene cero brechas y aviso claro de que el progreso es autodeclarado, no agrega habilidades automáticamente al perfil y no representa probabilidad ni garantía de contratación.

### Datos, privacidad, migración y despliegue

- Migración `0006_empty_martin_li.sql` añade `app.learning_paths` y `app.learning_path_steps` sin alterar las migraciones publicadas `0000`–`0005`: cascada al eliminar el análisis origen y `ON DELETE SET NULL` sobre `suggested_project_id` al eliminar un proyecto vinculado, preservando la actividad instantánea del paso.
- Verificación de propietario en todos los niveles (`404` ante cuentas ajenas o combinaciones ruta/paso inexistentes). El Skill Engine continúa aislado sin recibir datos personales ni participar en el seguimiento de progreso.
- Evaluación documental de opciones de despliegue con presupuesto cero en `docs/DEPLOY_OPTIONS.md` (`DEP-01`): confirma que la ejecución local reproducible mediante Docker Compose continúa siendo la entrega oficial sin costo ni exposición de datos.

### Compatibilidad y aceptación

- Upgrade desde `v0.3.0` (`0000`–`0005` → `0006`) conserva íntegros usuarios, perfiles, habilidades, análisis, proyectos y metadatos de CV existentes; las tablas de rutas inician vacías y admiten reejecución idempotente.
- `QA-05` integrada (`PR #61`, `87e5c6d`) con suite E2E completa (`tests/e2e/m4-acceptance.spec.ts`) aprobada en CI sobre PostgreSQL 16 y seis verificaciones manuales de M4 completadas y aprobadas personalmente por Emanuel sin defectos bloqueantes (`docs/acceptance/M4-results.md`).
- Ocho manifiestos privados del monorepo pasan a `0.4.0`. Las versiones de contratos OpenAPI (`public.yaml` `1.1.0`, `m2.yaml` `0.1.0`, `m3-proposed.yaml` `0.1.0`, `m4-proposed.yaml` `0.1.0`), catálogo (`1.0.0`), plantillas (`1.0.0`) y snapshots mantienen sus ciclos independientes.
- En M3 (`jobs`), `JOBS_PROVIDER_MODE=fixture`, `JOBS_LIVE_ENABLED=false` y `JOBS_LIVE_RETENTION_ALLOWED=false` se mantienen como valores seguros por defecto; la autorización contractual de retención `live` del proveedor sigue documentada como limitación abierta.

Publicación completada: PR #62 integrado a `main` en `cacec37bba40528cfc091888bd2a33290b414940`; tag anotado y GitHub Release `v0.4.0` sobre ese commit; PR #63 sincronizó `main → develop` en `bc104f044a65f5102cbf0c8fb46c8c37649e58f9`. Los checks actuales de `develop` aprobaron CI, E2E con PostgreSQL 16, documentación y Compose.

## 0.3.0 — M3 publicada

### Funcionalidad

- Adaptador de vacantes JSearch en API (`JobsProvider` con implementaciones `FixtureJobsProvider` y `LiveJSearchProvider`), búsqueda `GET /api/v1/jobs` con paginación por cursor confidencial AES-256-GCM (`j1.<base64url>`, ADR 0005) y detalle `GET /api/v1/jobs/details` por `providerId` opaco.
- Análisis de vacantes del proveedor en `POST /api/v1/analyses` con `source: { type: "jsearch", providerId }`: resolución exclusiva en servidor, reutilización del Skill Engine de M1, idempotencia y compuerta de retención `JOBS_LIVE_RETENTION_ALLOWED`.
- Pantalla `/jobs` (`JobsPage`) con búsqueda controlada por submit, insignia explícita de procedencia (`fixture` / `live`), descripción escapada como texto plano, atribución con enlace externo seguro (`target="_blank"`, `rel="noopener noreferrer"`), análisis con `AnalysisResult` compartido y preservación íntegra del análisis manual (`/analysis/new`).

### Límites del proveedor, permisos y estado E3

- Conforme a `docs/provider/JSEARCH.md` (`JSR-01`) y `docs/acceptance/M3-results.md` (`QA-04`), el modo por defecto es `JOBS_PROVIDER_MODE=fixture` (`JOBS_LIVE_ENABLED=false`, `JOBS_LIVE_RETENTION_ALLOWED=false`), con consulta acotada `live` (`num_pages=1` contra `/search-v2` y `/job-details`) verificada en memoria (`200 OK`) sin almacenar credenciales en el repositorio.
- La configuración sin `RAPIDAPI_KEY` mantiene M1 y M2 100 % operativos.
- Ocho manifiestos privados del monorepo pasan a `0.3.0`. Las rutas de aprendizaje (M4) quedan fuera de `v0.3.0`.

Publicada mediante los tags anotados `v0.3.0` y `e3-microservice` sobre `dae6c7519534d089393067ee151cbdcb478404c2` y sincronizada en `develop` (`ec66b9f`).

## 0.2.0 — M2 publicada

### Funcionalidad

- Portafolio propio con CRUD de proyectos, tecnologías del catálogo, enlaces tratados como datos y aislamiento entre cuentas mediante 404.
- CV privado PDF: carga y sustitución multipart de hasta 5 MiB, metadatos, descarga autenticada como attachment y borrado idempotente.
- Interfaz responsive de proyectos y panel de CV en perfil, con estados de carga/error, confirmaciones y flujo de análisis manual M1 conservado.

### Datos, privacidad e infraestructura

- Migraciones 0004 y 0005 añaden proyectos, relaciones, revisión de proyectos, CV activo y cola de limpieza sin modificar migraciones publicadas de M1.
- El archivo se valida por extensión, MIME, firma y bytes reales; se guarda con clave generada fuera del webroot. No se analiza, no modifica habilidades y no llega al Skill Engine.
- Compose monta el volumen privado `cv_files` solo en el inicializador de permisos y la API. DB, engine, claves y archivos continúan sin exposición pública.
- Reemplazo concurrente, compensación ante fallos de DB/disco y reconciliación de temporales/huérfanos están cubiertos por pruebas.

### Compatibilidad y aceptación

- Upgrade desde v0.1.0 conserva usuarios, perfil, habilidades y análisis existentes; las nuevas estructuras empiezan vacías y aceptan migración idempotente.
- QA-03 técnica integrada: 129 pruebas API, 106 web y 11 E2E M1/M2 sobre datos sintéticos; sin defectos bloqueantes registrados.
- Versiones privadas del workspace pasan a 0.2.0. OpenAPI, catálogo y versiones de snapshots mantienen sus ciclos independientes.
- JSearch y rutas de aprendizaje no forman parte de v0.2.0. La integración live permanece desactivada hasta completar JSR-01 y las tareas dependientes.

Publicada mediante el tag anotado `v0.2.0` sobre `1ebce21381fb5f32613a3ea54ed0fe9fea343e25` y sincronizada en `develop` (`40360a5`).

## 0.1.0 — M1 publicada

### Funcionalidad

- Registro/login, perfil y catálogo de habilidades; JWT de acceso en memoria, refresh HttpOnly rotado y logout entre pestañas compatibles.
- Análisis manual determinista: tecnologías requeridas, coincidencias/faltantes, porcentaje de cobertura (no probabilidad de contratación),0% distinto de ausencia de cálculo.
- Snapshots PostgreSQL, idempotencia, evidence opcional de menciones literales mostradas como texto; compatibilidad con análisis antiguos.
- Historial propio con paginación, detalle recuperable y eliminación con confirmación; aislamiento entre cuentas.

### Infraestructura y correcciones

- Verificación Compose tras reinicio sincronizada con la respuesta real de habilidades y su estado renderizado; regresión de carga tardía sin simular datos ni omitir persistencia.

- React/Vite, Express y Skill Engine separado; PostgreSQL16 oficial, migraciones0000–0003 y seed idempotente.
- Compose con proxy mismo origen, servicios internos y persistencia; recuperación tras fallo del engine y reinicio comprobada en CI.
- Dependencias corregidas durante estabilización: React Router7.18.2, Drizzle ORM0.45.2 y Zod4.6.6; adaptación del default de paginación para mantener20 sin alterar el contrato.
- Checkboxes del perfil con objetivos accesibles; API no-root alineada al dueño de la llave0600, montaje read-only.
- Corpus, contratos OpenAPI, pruebas unitarias/integración/E2E y expediente de aceptación. Ocho manifiestos privados pasan a0.1.0 sin publicar paquetes npm.

### Compatibilidad y aceptación

- Node22.23.4 y pnpm11.22.0; OpenAPI público1.1.0/interno1.0.0 y versiones de datos/extractor independientes, sin cambios de contrato ni SQL histórico por la release.
- Emanuel aceptó el alcance UI-01/EVID-06/OPS-01 como revisor delegado por Omar según registro de aceptación; revisión independiente del PR pendiente.
- Preferencias estéticas opcionales quedan fuera del candidato. Catálogo pequeño/reglas acotadas; sin certificación WCAG completa. Docker Desktop Windows local no probado; demo nativa PG18.3 y CI PG16 diferenciados.
- HTTP loopback es demo local, no despliegue HTTPS productivo; sin revocación inmediata de access JWT ya emitidos ni rate limit distribuido.
- No incluye proyectos/CV, proveedor JSearch ni rutas de aprendizaje; CTR-02 y futuras funcionalidades conservan sus dependencias.

Publicada mediante el tag anotado `v0.1.0` sobre `1f9e721a320270a415d0825e75a92f10f0d0b35d`. El expediente histórico permanece en docs/release.
