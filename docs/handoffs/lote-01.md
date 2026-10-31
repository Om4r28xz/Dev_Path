# Handoff lote 01 — base y contratos

## Estado real

| Tarea  | Estado                  | Evidencia                                                                                                                           | Siguiente acción                                                |
| ------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| GOV-01 | Integrada.              | PR #2 fusionado en `develop` mediante `ebe5940`; decisiones y roles operativos P1–P5 documentados.                                  | Ninguna técnica.                                                |
| GOV-02 | Integrada.              | PR #3 fusionado en `develop` mediante `fef802c`; flujo, exclusiones y plantillas documentados.                                      | Ninguna técnica.                                                |
| FND-01 | Integrada.              | PR #4 fusionado en `develop` mediante `3282e62`; contiene `2f16327`.                                                                | Ninguna técnica.                                                |
| CTR-01 | Implementada sin merge. | OpenAPI público/interno, 17 ejemplos, tipos generados, guía de errores y validación automática en `feat/ctr-01-cat-01-foundations`. | Push, PR, revisión P1/P2 y merge humano a `develop`.            |
| CAT-01 | Implementada sin merge. | Catálogo `1.0.0` con 10 tecnologías, 18 alias justificados y validador de estructura/colisiones en la misma rama combinada.         | Incluir en el mismo PR, revisión P2 y merge humano a `develop`. |

La combinación de CTR-01 y CAT-01 en una rama/PR es una instrucción explícita del usuario para acelerar los siguientes trabajos. Los entregables y sus validaciones permanecen separados.

## Decisiones y límites consumidos

- OpenAPI 3.1 es la única fuente de verdad para las fronteras HTTP. Los cambios comienzan en `openapi/public.yaml` o `openapi/engine.yaml`; los tipos TypeScript se regeneran, no se editan a mano.
- El contrato público usa `/api/v1`; el interno usa `/internal/v1/analyze` con una credencial de servicio distinta del JWT de usuario.
- La respuesta de sesión contiene `accessToken`, `tokenType`, `expiresIn` y `user`. El refresh opaco solo viaja en cookie HttpOnly y nunca en JSON.
- El access token dura 900 segundos. La cookie HTTPS es `__Secure-devpath_refresh`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/api/v1/auth`, sin `Domain` y con expiración absoluta máxima de siete días. El modo HTTP local usa nombre sin prefijo Secure y `Secure=false` únicamente de forma explícita.
- Listas: `limit` predeterminado 20, máximo 50 y cursor opaco base64url. Análisis: `Idempotency-Key` UUID por propietario/operación; mismo cuerpo devuelve 200 y resultado existente, cuerpo diferente devuelve 409.
- El engine recibe solo `jobText`, `candidateSkillIds` y `catalogVersion`; no recibe identidad ni PII. `matched` y `missing` particionan `required`; el porcentaje es redondeado y vale `null` sin requisitos.
- El catálogo `1.0.0` mantiene IDs textuales estables y separa Java/JavaScript, React/React Native, C#/C++. Los alias incluyen una justificación revisable.
- P1–P5 son roles operativos. No se requieren nombres personales, usernames ni CODEOWNERS.

## Entrega CTR-01

### Archivos principales

- `packages/contracts/openapi/public.yaml`: auth, perfil, catálogo, habilidades y análisis M1.
- `packages/contracts/openapi/engine.yaml`: análisis interno determinista y errores internos.
- `packages/contracts/examples/`: requests, respuestas, fallos, idempotencia y caso sin requisitos.
- `packages/contracts/src/{public,internal}/generated.ts`: tipos producidos desde OpenAPI.
- `packages/contracts/scripts/generate-contracts.mjs`: generación reproducible y huella de las fuentes.
- `packages/contracts/scripts/validate-contracts.mjs`: parseo, esquemas, ejemplos, ausencia de refresh JSON/PII e invariantes de matching.
- `packages/contracts/ERRORS.md`: semántica estable de estados y códigos.

### Contrato fijado

- Auth: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`.
- Perfil y skills: `GET/PATCH /me`, `GET /skills`, `GET/PUT /me/skills`.
- Análisis: `POST/GET /analyses`, `GET/DELETE /analyses/{analysisId}`.
- Engine: `POST /internal/v1/analyze`.
- Límites: nombre 100, email 254, contraseña de registro 12–128, título 120, texto de vacante 20 000, perfil headline 160, location 120, máximo 100 skills.
- Errores públicos e internos usan un sobre estable con `code`, `message` y `requestId`; `fields` es opcional.

## Entrega CAT-01

### Archivos y esquema

- `packages/catalog/technologies.json`: versión `1.0.0`, arreglo `technologies` y entradas con `id`, `name`, `category`, `aliases[{value,reason}]`.
- `packages/catalog/README.md`: contrato del esquema, categorías y reglas de normalización.
- `packages/catalog/scripts/validate-catalog.mjs`: semver fijado, forma, categorías, IDs obligatorios, unicidad global de IDs/nombres/alias y longitud de justificaciones.

Incluye Java, JavaScript, React, React Native, Node.js, Git, Docker, SQL, C# y C++. La normalización de colisiones ignora mayúsculas y separadores comunes, pero conserva `#` y `+` porque distinguen tecnologías.

## Validación

- `pnpm install --frozen-lockfile`: correcto; instalación reproducible desde el lockfile.
- `pnpm --filter @devpath/contracts generate`: correcto; generó ambos artefactos TypeScript desde OpenAPI.
- `pnpm --filter @devpath/contracts test`: correcto; validó 2 especificaciones y 17 ejemplos JSON, además de las invariantes de matching y seguridad.
- `pnpm --filter @devpath/contracts typecheck`: correcto; tipos generados compilables.
- `pnpm --filter @devpath/catalog test`: correcto; 10 tecnologías y 18 alias únicos válidos.
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build`: correctos en todo el workspace.

## Git y PR propuesto

- Base: `develop` en `3282e62` (merge de FND-01).
- Rama combinada: `feat/ctr-01-cat-01-foundations`.
- Commit: este commit, con mensaje `feat(contracts): define M1 APIs and technology catalog`.
- Push/PR/merge: pendientes y a cargo del usuario.
- Título: `feat(contracts): define M1 APIs and curated technology catalog`.

### Cuerpo propuesto

Define los contratos OpenAPI 3.1 públicos e internos de M1, fija límites, cookie, cursor, idempotencia y errores, y genera tipos TypeScript desde una única fuente de verdad. Añade ejemplos válidos y de fallo comprobados automáticamente, incluidas las invariantes del matching y el caso sin requisitos. Entrega además el catálogo curado `1.0.0` con IDs estables, alias justificados y validación de colisiones.

Validación: instalación congelada; generación de tipos; parseo de 2 contratos y validación de 17 ejemplos; catálogo de 10 tecnologías/18 alias; formato, lint, typecheck, tests y build del workspace. Pendientes: revisión técnica P1/P2, push, PR y merge humano.

## Continuación

Después del merge a `develop`, las tareas siguientes compatibles pueden prepararse juntas en una misma rama por instrucción del usuario, sin mezclar sus criterios ni afirmar integraciones antes del merge humano.
