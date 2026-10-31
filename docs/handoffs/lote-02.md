# Handoff lote 02 — infraestructura técnica de API, datos, web, engine y CI

## Estado real

| Tarea      | Estado                  | Evidencia                                                                                                                                                                                                                                                                 | Siguiente acción                              |
| :--------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------- |
| **API-01** | Implementada sin merge. | Commit `1196e16`; Express 5, request IDs UUID, 128 KiB limit, sobre de error JSON, CORS, sliding rate limit, redacción de secretos y 13 tests pasando.                                                                                                                    | Push, PR, revisión P1 y merge a `develop`.    |
| **DAT-01** | Implementada sin merge. | Commit `e4cc82f`; esquemas Drizzle `auth` y `app` para M1, migración `0000_ambiguous_joseph.sql`, pool con graceful shutdown, seed idempotente de 10 tecnologías y factoría sintética.                                                                                    | Push, PR, revisión P1 y merge a `develop`.    |
| **WEB-01** | Implementada sin merge. | Commit `5c83ff3`; React 19 + React Router v7 + TanStack Query, rutas `/register`, `/login`, `/profile`, `/analysis/new`, `/analyses`, `/analyses/:id`, componentes accesibles con foco visible, rosa suave y cliente HTTP base con sobre de error. Build Vite verificado. | Push, PR, revisión P2/P5 y merge a `develop`. |
| **ENG-01** | Implementada sin merge. | Commit `7627238`; `POST /internal/v1/analyze`, validación de Bearer token de servicio, catálogo v1.0.0 integrado, extracción determinista por alias sin DB, cálculo de scoring, health checks y 13 tests pasando.                                                         | Push, PR, revisión P2 y merge a `develop`.    |
| **CI-01**  | Implementada sin merge. | Commit `f803c03`; `.github/workflows/ci.yml` con `ci-gate` agregado, lint, typecheck, build, contenedor de servicio PostgreSQL 16 para tests de DB, y workflow liviano `.github/workflows/docs.yml` para cambios documentales.                                            | Push, PR, revisión P2 y merge a `develop`.    |

> [!NOTE]
> Las 5 tareas de este lote fueron implementadas y validadas en commits secuenciales dentro de la rama `chore/api-01-http-foundation` para acelerar la preparación según la instrucción directa del usuario.

---

## Decisiones y límites consumidos

- **API-01**: Express 5.3.0 en puerto 3000 (configurable). Valida `HOST`, `PORT`, `CORS_ALLOWED_ORIGINS`, `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_MS`, `SHUTDOWN_TIMEOUT_MS`. Límite de cuerpo 128 KiB devolviendo `413 PAYLOAD_TOO_LARGE`. Respuestas de error estables con `code`, `message` y `requestId`. Logger JSON estructurado redacta cookies, encabezados Authorization y enmascara tokens Bearer.
- **DAT-01**: PostgreSQL con Drizzle ORM 0.43.1 y `pg` 8.16.0. Esquema `auth` (`users`, `session_families`, `refresh_tokens`, `security_events`) y esquema `app` (`profiles`, `skills`, `user_skills`, `analyses`). Restricciones de unicidad, borrado en cascada e índices de usuario/fecha. Seed idempotente mediante `ON CONFLICT (id) DO UPDATE` con las 10 tecnologías del catálogo.
- **WEB-01**: React 19.3.1, React Router 7.6.2, TanStack Query 5.80.7 y Vite 8.3.5. URLs relativas consumiendo `/api/v1` a través del proxy de Vite. Paleta accesible rosa suave (`#9a4768` primario, fondos `#fff7fa`/`#fff0f5`, foco visible con `outline: 2px solid #9a4768; outline-offset: 2px`). Formularios con labels explícitos, `aria-describedby` y alertas con `role="alert"`. Pantallas sin conectar muestran avisos informativos visibles.
- **ENG-01**: Skill Engine en puerto 3001. No se conecta a base de datos ni recibe PII del usuario. Valida credencial de servicio Bearer contra `ENGINE_SERVICE_SECRET`. Extrae habilidades por coincidencia exacta de alias del catálogo `1.0.0`. Calcula `matched`, `missing` y `matchPercentage` redondeado (o `null` si no hay requisitos).
- **CI-01**: GitHub Actions con `pnpm install --frozen-lockfile`, Node 22, pnpm 11.22.0. El job agregado `ci-gate` evalúa el resultado de `lint`, `typecheck`, `build` y `test`, y falla si alguno de los jobs obligatorios falla o es cancelado.

---

## Validación ejecutada

Comandos ejecutados en el workspace limpio:

- `pnpm install --frozen-lockfile`: exitoso (árbol de dependencias congelado y sincronizado).
- `pnpm typecheck`: exitoso (0 errores en los 8 proyectos del monorepo).
- `pnpm lint`: exitoso (0 errores en ESLint).
- `pnpm format:check`: exitoso (100% de archivos cumplen estilo Prettier).
- `pnpm build`: exitoso (compilación de contratos, catálogo, web, api y skill-engine).
- `pnpm test`: exitoso (tests unitarios e integración en `@devpath/catalog`, `@devpath/contracts`, `@devpath/api` y `@devpath/skill-engine`).

---

## Git y PR propuesto

- **Rama:** `chore/api-01-http-foundation`
- **Base:** `develop` (en `71d2a71`)
- **Commits:**
  1. `1196e16` `chore(api): build HTTP foundation, error handling, and lifecycle` (API-01)
  2. `e4cc82f` `chore(db): create PostgreSQL M1 schemas, pool, and catalog seed` (DAT-01)
  3. `5c83ff3` `feat(web): add M1 application shell, navigation, and core components` (WEB-01)
  4. `7627238` `feat(engine): expose internal analysis service contract and deterministic matching` (ENG-01)
  5. `f803c03` `chore(ci): automate pull request checks and ci-gate workflow` (CI-01)
- **Título de PR recomendado:** `chore(infra): deliver M0 technical foundations (API, DB, Web, Engine, CI)`

### Cuerpo del PR recomendado

```markdown
### Resumen

Entrega la infraestructura técnica base para M0 y M1 (Lote 02 completo):

1. **API-01**: Plataforma Express con validación de entorno, request IDs, rate limit, errores contractuales sanitizados, redacción de credenciales en logs y graceful shutdown.
2. **DAT-01**: Esquemas Drizzle PostgreSQL (`auth` y `app`), migración inicial `0000_ambiguous_joseph.sql`, pool transaccional, seed idempotente del catálogo y factoría de usuarios.
3. **WEB-01**: Shell de aplicación con React 19, React Router v7, TanStack Query, navegación SPA, proxy `/api`, estilos rosa suave accesibles y pantallas M1 con avisos informativos.
4. **ENG-01**: Servicio interno Skill Engine con autenticación de servicio Bearer, extracción determinista por alias del catálogo v1.0.0, cálculo de matching y tests de integración.
5. **CI-01**: Automatización de GitHub Actions con contenedor de PostgreSQL, jobs paralelos (`lint`, `typecheck`, `build`, `test`), workflow liviano de docs y job agregado `ci-gate`.

### Validación

- `pnpm install --frozen-lockfile` OK
- `pnpm typecheck` OK
- `pnpm lint` OK
- `pnpm format:check` OK
- `pnpm build` OK
- `pnpm test` OK (26 tests pasando entre api, engine, contracts y catalog)
```

---

## Continuación

La siguiente etapa (Lote 03) requiere que este PR esté revisado y fusionado en `develop`. Una vez integrado:

1. `CAT-02` y `QA-01` pueden iniciarse.
2. `AUTH-01` y `OPS-01` podrán conectarse sobre la infraestructura HTTP, de datos y de servicios entregada aquí.
