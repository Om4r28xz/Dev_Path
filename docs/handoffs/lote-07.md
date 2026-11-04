# Lote 07 — Proyectos y CV privado

Estado comprobado el 3 de noviembre de 2026. `origin/develop` está en `60daedc`: PRJ-01 y PRJ-02 están integradas mediante los PR #48 y #49. REL-01, CTR-02, AUTH-03 y VIS-04 también están integradas. Contratos consumidos: `packages/contracts/openapi/m2.yaml` versión 0.1.0, `packages/contracts/EXTENDED-CONTRACTS.md`; catálogo 1.0.0. No se cambiaron contratos ni catálogos.

| Tarea  | Estado                                                                        | Evidencia y siguiente acción                                                                            |
| ------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| PRJ-01 | Integrada en `develop` por PR #48                                             | CRUD, migración y pruebas integrados.                                                                   |
| PRJ-02 | Integrada en `develop` por PR #49                                             | Portafolio web y flujo E2E integrados en `60daedc`.                                                     |
| CV-01  | Implementada sin merge en `feature/cv-01-private-storage-api`, base `60daedc` | API, almacenamiento, migración 0005, Compose y pruebas. Revisión P1/P2/P4 pendiente antes del PR/merge. |
| CV-02  | Bloqueada                                                                     | Espera CV-01 integrada en develop. AUTH-03/VIS-04 ya integradas.                                        |
| QA-03  | Bloqueada                                                                     | PRJ-02 ya está integrada; espera CV-02 integrada en develop.                                            |

## CV-01

Archivos: `apps/api/src/modules/cv/{storage,upload,repository,service,router}.ts`, `apps/api/src/server.ts`, `apps/api/tests/integration/cv.test.ts`, `apps/api/package.json`, `pnpm-lock.yaml`, `packages/db/src/schema/{index,app}.ts`, `packages/db/migrations/0005_cold_gateway.sql` y metadata Drizzle, `infra/compose.yaml`, `docs/SETUP_LOCAL.md`, `apps/api/README.md`. La migración CV fue regenerada sobre el snapshot 0004 integrado de proyectos.

Se añadió carga multipart en streaming de una sola parte `file`, máximo real 5 242 880 bytes, validación de nombre, extensión, MIME y firma PDF. Los temporales y finales tienen claves aleatorias y se guardan fuera de webroot. La sustitución serializa por cuenta con bloqueo de perfil; el archivo anterior permanece confirmado si falla DB. La limpieza vieja se encola en la misma transacción y se reintenta al iniciar y periódicamente; archivos huérfanos/temporales con más de diez minutos se reconcilian. La descarga exige bearer, abre un stream privado y devuelve attachment con no-store/nosniff. No hay parseo ni envío al motor.

Compose monta `cv_files` solo en API y servicio de preparación de permisos, nunca en web/proxy/engine. `CV_STORAGE_DIR` es obligatorio en producción. P2 debe revisar volumen, permisos y lockfile; P4 debe revisar la actualización de setup.

Validación local: instalación offline congelada, migraciones 0000–0005 y seed en PostgreSQL 18 aislado, 14 archivos y 129 pruebas API aprobadas. La validación de runtime aprobó formato, lint, tipos, build, pruebas y arranque web (6/6). Las siete pruebas CV cubren privacidad entre dos usuarios, metadata y descarga, límite exacto 5 MiB, rechazo de tipo/firma/tamaño/traversal/partes extra, fallo DB y disco, limpieza pendiente y reconciliación, reemplazos concurrentes y DELETE idempotente. `docker compose config --quiet` pasó con variables sintéticas; no se ejecutó stack Compose ni reinicio real del proceso/volumen. El test recreó el servicio sobre la misma DB/almacenamiento. No se atribuye CI remoto ni aceptación humana.

PR sugerido: **feat(api): store private CVs with recovery (CV-01)**. Cuerpo: “Implementa el contrato M2 para PDF privado: carga streaming, metadatos, descarga autenticada y borrado; añade persistencia y reconciliación de limpieza, volumen privado y pruebas PostgreSQL. Sincronizada con proyectos y migración CV regenerada como 0005.” Destino: `develop`. Sin merge automático.
