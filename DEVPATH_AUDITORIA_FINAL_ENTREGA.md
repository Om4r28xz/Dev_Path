# DevPath - auditoría final de entrega

Fecha de auditoría: 5 de noviembre de 2026

Rama de corrección: `docs/final-delivery-audit`

Base auditada: `origin/develop` en `bc104f044a65f5102cbf0c8fb46c8c37649e58f9`

Release auditada: `v0.4.0` en `cacec37bba40528cfc091888bd2a33290b414940`
`origin/main`: `d85f13b893fd752cf305f9907774cb4b3a521f37`

## Veredicto

**LISTO CON OBSERVACIONES.** El árbol corregido sustenta **100/100 puntos** de la rúbrica y no se
encontró un defecto funcional bloqueante. Antes de entregar debe integrarse esta rama documental para
que el README, la arquitectura, el changelog, el handoff, el checklist y el informe PDF corregido
coincidan con `v0.4.0`. No se requiere una nueva funcionalidad, migración, tag ni release.

## Estado real del producto

| Alcance | Estado comprobado                                                                  | Evidencia principal                                                                |
| ------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| M1      | Publicado en `v0.1.0`: auth, perfil, skills, análisis manual, evidence e historial | `packages/contracts/openapi/public.yaml`, suites API/web/E2E                       |
| M2      | Publicado en `v0.2.0`: proyectos y CV PDF privado                                  | `packages/contracts/openapi/m2.yaml`, `projects.spec.ts`, `cv.spec.ts`             |
| M3      | Publicado en `v0.3.0`: JobsProvider, búsqueda/detalle y análisis                   | `docs/acceptance/M3-results.md`, `jobs.spec.ts`, tag `e3-microservice`             |
| M4      | Publicado en `v0.4.0`: rutas deterministas y progreso persistente                  | `docs/acceptance/M4-results.md`, `learning-paths.spec.ts`, `m4-acceptance.spec.ts` |
| Lote 10 | LRN-04, QA-05 y REL-04 integradas; DEP-01 también integrada aunque era opcional    | PR #59, #61, #62 y #63; `docs/handoffs/lote-10.md`                                 |

La GitHub Release `v0.4.0` existe y su target es `cacec37bba40528cfc091888bd2a33290b414940`.
`origin/main` es ancestro de `origin/develop`; ambos tienen el mismo árbol de archivos antes de esta
corrección y difieren solo por el merge commit de sincronización PR #63.

## Matriz de rúbrica

|   # | Indicador                        | Evidencia y prueba realizada                                                                                                                                                                                           | Resultado                                                                                                                                                 | Puntos | Defecto / corrección                                                                                     |
| --: | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -----: | -------------------------------------------------------------------------------------------------------- |
|   1 | Repositorio y README             | Repositorio público accesible; `README.md`, `docs/SETUP_LOCAL.md`, `.node-version`, `package.json` e `infra/.env.example` revisados.                                                                                   | Instalación, versiones, configuración y ejecución quedan enlazadas y reproducibles.                                                                       |    8/8 | El README seguía en M1. Corregido a M1-M4 y `v0.4.0`.                                                    |
|   2 | Arranque siguiendo README        | Clon limpio de `develop`; Node 22.23.4 y pnpm 11.22.0; `pnpm install --frozen-lockfile` y `node scripts/setup-local.mjs`. El setup creó configuración/llaves ignoradas. Compose real acreditado por run `42151380600`. | Instalación limpia aprobada; stack real aprobado en GitHub con PostgreSQL 16.                                                                             |  10/10 | Docker no existe en esta sesión local; no se simuló. El sandbox requirió el modo hoisted ya documentado. |
|   3 | Mínimo tres endpoints            | OpenAPI y routers confirman auth, perfil, analyses, projects, CV, jobs y learning paths; más de 20 operaciones de negocio.                                                                                             | Métodos y rutas REST coherentes.                                                                                                                          |  10/10 | El PDF anterior inventaba dos rutas; PDF regenerado con rutas reales.                                    |
|   4 | Códigos HTTP                     | Contratos y pruebas cubren 200, 201, 204, 400, 401, 404 y 409; también 413, 429, 503 y 504 donde corresponde.                                                                                                          | Todos los códigos solicitados tienen casos reales apropiados.                                                                                             |    8/8 | Sin defecto funcional.                                                                                   |
|   5 | Validación de entradas           | Zod, parsers de PDF, límites de cuerpo, cursores/UUID y validadores de ejemplos; 54 ejemplos OpenAPI incluidos rechazos esperados.                                                                                     | JSON seguro con `code`, `message`, `requestId` y `fields` opcional.                                                                                       |    8/8 | Sin defecto funcional.                                                                                   |
|   6 | Autenticación                    | Argon2id; JWT RS256 de 15 min; refresh opaco rotado con expiración absoluta de 7 días; HttpOnly/SameSite; reutilización revoca familia; owner desde `sub`.                                                             | Protección, credenciales inválidas, refresh, logout y aislamiento cubiertos por integración/E2E.                                                          |  10/10 | PDF corregido: eliminadas afirmaciones de HMAC, bcrypt, email y roles no implementados.                  |
|   7 | Variables de entorno             | `.gitignore`, `infra/.env.example`, `setup-local.mjs` y tablas de `SETUP_LOCAL.md`; escaneo de archivos versionados.                                                                                                   | `.env`, claves, uploads y volúmenes ignorados; no se hallaron secretos reales.                                                                            |    8/8 | Coincidencias encontradas eran valores sintéticos `generated-locally` y tests.                           |
|   8 | Manejo seguro de errores         | `platform/http/error-handler.ts`, pruebas API/provider y E2E de caídas.                                                                                                                                                | No se devuelven stack, SQL, rutas, tokens ni key; 5xx se registra con `requestId`.                                                                        |    6/6 | PDF corregido: eliminado fallback live->fixture inexistente.                                             |
|   9 | API externa                      | `LiveJSearchProvider`, `docs/provider/JSEARCH.md`, `M3-results.md` y `apps/api/requests/e3-jsearch.http`.                                                                                                              | `/search-v2` y `/job-details` fueron verificados live con 200; fixture permanece default; 404/429/timeout/JSON inválido probados con servidor controlado. |  10/10 | Live no se repitió para evitar costo/cuota; retención live sigue cerrada por permiso contractual.        |
|  10 | Aplicación consume microservicio | `EngineClient` llama `POST /internal/v1/analyze` con Bearer de servicio y `X-Request-Id`; E2E y Compose prueban análisis y recuperación.                                                                               | Comunicación Express -> Skill Engine real y separada de auth/JSearch.                                                                                     |  10/10 | PDF corregido: engine no recibe `X-User-Id` ni llama JSearch.                                            |
|  11 | Pruebas o colección              | Unitarias, integración PostgreSQL, Playwright, OpenAPI, catálogo, Compose y colección HTTP E3.                                                                                                                         | Casos de éxito/error reproducibles para endpoints evaluados.                                                                                              |    6/6 | Sin defecto funcional.                                                                                   |
|  12 | Contribuciones                   | `git shortlog -sne --all` y commits identificables de Omar, Emanuel, Betsy, Karen y Zaid.                                                                                                                              | Los cinco integrantes tienen contribución verificable sin cambiar autorías.                                                                               |    6/6 | Betsy, Karen y Zaid tienen al menos un commit propio comprobable.                                        |

**Total sustentado: 100/100.** La puntuación corresponde al árbol corregido y a evidencia técnica
ya integrada; no significa que fixture sea tráfico JSearch live ni que exista un despliegue público.

## Pruebas ejecutadas en esta auditoría

### Copia limpia local

- Clon limpio de `origin/develop` en `bc104f0`: aprobado.
- Node `22.23.4` y pnpm `11.22.0`: versiones exactas comprobadas.
- `pnpm install --frozen-lockfile`: aprobado, 363 paquetes, lockfile y políticas de cadena de
  suministro verificadas.
- `node scripts/setup-local.mjs`: aprobado; creó `infra/.env` y clave privada solo en rutas
  ignoradas, sin imprimir secretos.
- ESLint: aprobado.
- Prettier: aprobado.
- TypeScript: API, engine, web, contracts, DB y E2E aprobados.
- Build: API, engine, web y generación/typecheck de contracts aprobados. Vite produjo el bundle.
- API sin DB local: 11 archivos/74 pruebas aprobadas; 7 archivos/71 casos PostgreSQL omitidos de
  forma explícita. Esos casos sí se ejecutaron en CI con PostgreSQL 16.
- Web: 15 archivos/115 pruebas aprobadas.
- Skill Engine: 4 archivos/51 pruebas aprobadas.
- Soporte E2E: 1 archivo/2 pruebas aprobadas.
- Catálogo: 10 tecnologías, 18 alias, 30 casos ES/EN, 10 plantillas y 3 casos de referencia.
- Contratos: 5 OpenAPI y 54 ejemplos, incluidos rechazos esperados.
- `pnpm audit --prod --audit-level moderate`: sin vulnerabilidades conocidas.

### GitHub Actions vigente

Sobre `origin/develop` `bc104f0`:

- CI run `42151380572`: Test, E2E Chromium + PostgreSQL 16, Build, Type Check, Lint & Format y
  `CI gate (required)` aprobados.
- Compose run `42151380600`: `compose-runtime` aprobado con PostgreSQL 16.
- Docs run `42151380661`: aprobado.

Sobre el release commit `cacec37`:

- CI run `42137763397`: aprobado.
- Compose run `42137763343`: aprobado.
- El evento posterior del tag, run `42149692855`, falló en el paso del probe. El artefacto no fue
  accesible sin autenticación, por lo que no se inventa su causa. Es una anomalía histórica, no un
  check pendiente: el mismo SHA ya tenía Compose aprobado y la cabeza sincronizada `bc104f0` volvió
  a aprobar el probe completo.

## Arquitectura y seguridad comprobadas

- React/Vite solo consume rutas relativas `/api/v1`.
- Express es la API principal y contiene auth como módulo; auth no es un microservicio independiente.
- Skill Engine es un proceso independiente, sin JWT de usuario ni acceso a PostgreSQL.
- JobsProvider pertenece a Express y conserva `RAPIDAPI_KEY` exclusivamente en backend.
- PostgreSQL mantiene datos privados y todas las consultas sensibles usan parámetros/propietario.
- CV usa almacenamiento privado, validación PDF/tamaño/nombre, descarga autenticada y limpieza.
- Rutas de aprendizaje usan reglas/plantillas curadas, no IA generativa; progreso autodeclarado.
- CORS, límites de cuerpo, cookies, RS256, Argon2id, timeouts y errores están probados.

## Defectos encontrados y corregidos

1. Estado de producto obsoleto en `README.md`, `docs/ARCHITECTURE.md` e `infra/README.md`.
2. `CHANGELOG.md`, handoff y checklist seguían presentando REL-04 como pendiente después de la
   publicación.
3. `DevPath_Authentication_System_Report_CORRECTED.pdf` tenía topología y endpoints falsos:
   autenticación/microservicio, `/skills/match`, `/api/v1/match`, JSearch desde engine, `X-User-Id`,
   HMAC/bcrypt, roles inexistentes y fallback live->fixture.
4. Se añadió `scripts/generate-auth-report.py` para que el PDF corregido sea reproducible y
   auditable; el PDF se regeneró y se revisaron visualmente sus cinco páginas.
5. Se ignoraron artefactos Python `__pycache__`/`*.pyc`.

No se cambió código de negocio, contratos, migraciones ni comportamiento de M1-M4.

## Entregables y evidencias

- `README.md` y `docs/SETUP_LOCAL.md`: instalación/ejecución.
- `docs/ARCHITECTURE.md`: topología, seguridad y contratos implementados.
- `docs/acceptance/M1-results.md` a `M4-results.md`: aceptación por versión.
- `docs/DevPath_Authentication_System_Report_CORRECTED.pdf`: evidencia 4 corregida.
- `docs/Case Study_Presentation (2).pdf`, `docs/case-study.pdf (1).pdf` y
  `docs/Coevaluation_Act 3.pdf`: entregables académicos versionados.
- `packages/contracts/openapi/` y `apps/api/requests/e3-jsearch.http`: contratos/solicitudes.
- Tags `v0.1.0` a `v0.4.0` y `e3-microservice`.

## Limitaciones verificadas

- JSearch live está desactivado por defecto; la retención live requiere permiso contractual. Esto es
  una protección deliberada, no una simulación de tráfico real.
- No existe despliegue público obligatorio; la entrega reproducible oficial es Docker Compose.
- Docker no estuvo instalado en esta sesión local; se usó evidencia real de GitHub Actions, no una
  afirmación local.
- Los archivos `m3-proposed.yaml` y `m4-proposed.yaml` conservan nombres históricos, aunque sus
  rutas aceptadas están implementadas y probadas. Renombrarlos ahora rompería referencias sin aportar
  funcionalidad.
- El PDF corregido no es un PDF etiquetado para lector de pantalla; su contenido equivalente está
  disponible en documentación Markdown y contratos. No afecta la ejecución del producto.

## Commits, PR y acción humana pendiente

- Base: PR #63 / `bc104f0`.
- Rama preparada: `docs/final-delivery-audit`.
- La corrección debe publicarse y revisarse mediante un PR hacia `develop`; después, si la entrega
  académica se toma desde `main`, Omar debe sincronizarla mediante el flujo oficial.
- No crear otro tag `v0.4.0`, no mover la etiqueta y no publicar una nueva release por estas
  correcciones documentales.

Tras integrar el PR documental, el veredicto cambia a **LISTO PARA ENTREGAR** sin observaciones de
integración pendientes.
