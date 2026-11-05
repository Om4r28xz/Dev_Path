# Changelog

## 0.3.0 — candidato M3 (demo de adaptador fixture), pendiente de publicación

### Funcionalidad

- Adaptador de vacantes JSearch en API (`JobsProvider` con implementaciones `FixtureJobsProvider` y `LiveJSearchProvider`), búsqueda `GET /api/v1/jobs` con paginación por cursor confidencial AES-256-GCM (`j1.<base64url>`, ADR 0005) y detalle `GET /api/v1/jobs/details` por `providerId` opaco.
- Análisis de vacantes del proveedor en `POST /api/v1/analyses` con `source: { type: "jsearch", providerId }`: resolución exclusiva en servidor, reutilización del Skill Engine de M1, idempotencia y compuerta de retención `JOBS_LIVE_RETENTION_ALLOWED`.
- Pantalla `/jobs` (`JobsPage`) con búsqueda controlada por submit, insignia explícita de procedencia (`fixture` / `live`), descripción escapada como texto plano, atribución con enlace externo seguro (`target="_blank"`, `rel="noopener noreferrer"`), análisis con `AnalysisResult` compartido y preservación íntegra del análisis manual (`/analysis/new`).

### Límites del proveedor, permisos y estado E3

- Conforme a `docs/provider/JSEARCH.md` (`JSR-01`) y `docs/acceptance/M3-results.md` (`QA-04`), el modo por defecto es `JOBS_PROVIDER_MODE=fixture` (`JOBS_LIVE_ENABLED=false`, `JOBS_LIVE_RETENTION_ALLOWED=false`).
- **Alcance declarado del candidato:** demostración completa del adaptador y flujo M3 sobre fixtures sintéticos verificados. No se cierran las issues de integración real (`live`) ni se etiqueta `e3-microservice` mientras sigan pendientes la confirmación de hard cap sin cargo en cuenta RapidAPI, los permisos de retención del proveedor y la prueba `live` acotada autorizada.
- La configuración sin `RAPIDAPI_KEY` mantiene M1 y M2 100 % operativos.
- Ocho manifiestos privados del monorepo pasan a `0.3.0`. Las rutas de aprendizaje (M4) quedan fuera de `v0.3.0`.

Pendiente del candidato: decisión humana de alcance/publicación, revisión P2, PR con merge commit `release/0.3.0 → main`, tag anotado `v0.3.0` (y tag adicional `e3-microservice` únicamente cuando se verifiquen todos los criterios E3 incluyendo llamada externa real) y sincronización `main → develop`.

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
