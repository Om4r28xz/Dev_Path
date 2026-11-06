# Resultados de aceptación M4 — QA-05

Fecha: 5 de noviembre de 2026.

Estado: **aceptación técnica en CI (PR #61) y revisión manual realizada por Emanuel completadas sin defectos bloqueantes**. Este registro desbloquea la preparación técnica del candidato `REL-04` (`release/0.4.0`), sin atribuir firmas a otras personas y manteniendo sujetos a autorización/ejecución humana el merge hacia `main`, el tag `v0.4.0`, la GitHub Release y la sincronización `main → develop`.

## Base y alcance verificados

- Base probada en `QA-05`: `origin/develop` en `b4724e72946236d84fe27314c0eda9bbc3f55ff4`.
- LRN-04: PR #59 integrado a `develop`; commits `af71431` y `9d0dcd0` contenidos por el merge
  `b4724e7`.
- Checks de la cabeza del PR #59: build, typecheck, lint/formato, tests, documentación, Chromium con
  PostgreSQL 16 y `CI gate (required)` aprobados en la ejecución `42125603506`.
- QA-05: PR #61 (`eba2740`) integrado a `develop` en `87e5c6d8db5bef72255e26b7a3f90bff1bf01989` con
  todos los checks aprobados: `M1 E2E (Chromium + PostgreSQL 16)` (`127598195279`), `Test`
  (`127598195812`), `Build` (`127598195593`), `Type Check` (`127598195697`), `Lint & Format`
  (`127598195708`), `Docs check` (`127598194953`) y `CI gate (required)` (`127598740391`).
- Datos usados por QA-05: cuentas, vacantes, proyecto y PDF exclusivamente sintéticos. Ningún
  fixture se presenta como respuesta real de JSearch.

## Matriz requisito → prueba → resultado → evidencia

| ID       | Requisito                                                                                                | Prueba                                                                                   | Resultado actual                                                 | Evidencia                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `M4-01`  | Recorrido cuenta nueva → perfil → skills → análisis → proyecto → CV → ruta → progreso → recarga → logout | E2E completo con navegador, API, engine y PostgreSQL aislado                             | Aprobado en PR #61 (PostgreSQL 16 en CI) y E2E local aislado     | `tests/e2e/m4-acceptance.spec.ts`, check `127598195279` (`87e5c6d`)                         |
| `M4-02`  | Crear una sola ruta ante doble clic e idempotencia                                                       | Doble clic sobre CTA y conteo de POST reales                                             | Aprobado en PR #59                                               | `tests/e2e/learning-paths.spec.ts`, API `201/200/409` de LRN-02                             |
| `M4-03`  | Listar, abrir y explicar pasos, motivos, actividad, proyecto y recurso                                   | Detalle real y enlace seguro HTTP(S)                                                     | Aprobado técnicamente y confirmado en revisión manual            | `apps/web/src/features/learning-paths/**`, `api.test.ts`, `types.test.ts`                   |
| `M4-04`  | Progreso persistente; un rechazo no confirma éxito                                                       | PATCH real, recarga y fallo `503` controlado                                             | Aprobado en PR #59                                               | `tests/e2e/learning-paths.spec.ts`, integración API LRN-03                                  |
| `M4-05`  | Cero brechas muestra estado positivo sin inventar pasos                                                  | Análisis con skills completas y ruta de cero pasos                                       | Aprobado en PR #59 y confirmado en revisión manual               | Segundo caso de `tests/e2e/learning-paths.spec.ts`                                          |
| `M4-06`  | Eliminar un proyecto no rompe la instantánea                                                             | Eliminar proyecto vinculado, recargar ruta y conservar actividad                         | Aprobado en PR #59 y confirmado en revisión manual               | Primer caso de `tests/e2e/learning-paths.spec.ts`                                           |
| `M4-07`  | Propietario en todos los niveles y privacidad entre cuentas                                              | Cuenta B recibe `404`; rutas privadas requieren sesión                                   | Aprobado en PR #59 y PR #61                                      | Tercer caso de `tests/e2e/learning-paths.spec.ts`; `m4-acceptance.spec.ts`                  |
| `M4-08`  | No agregar skills automáticamente ni prometer empleo                                                     | Comparación de `/me/skills` y lenguaje explícito de avance autodeclarado                 | Aprobado técnicamente y confirmado en revisión manual            | Integración API LRN-03 y detalle LRN-04                                                     |
| `M4-09`  | Accesibilidad, foco, teclado y móvil a 320 px                                                            | Foco tras navegación/error, controles nativos, acceso por teclado y ausencia de overflow | Aprobado automáticamente y confirmado en revisión manual (200 %) | `learning-paths.spec.ts`, `m4-acceptance.spec.ts`, `SISTEMA_VISUAL.md`, revisión de Emanuel |
| `REG-M1` | Registro, sesión, perfil, skills, análisis/evidencia, historial y aislamiento                            | Regresión completa M1                                                                    | Aprobado en PR #59 y PR #61                                      | `tests/e2e/m1.spec.ts`, `acceptance.spec.ts`, PostgreSQL 16                                 |
| `REG-M2` | CRUD de proyectos y CV privado                                                                           | Crear/editar/eliminar proyecto; subir/descargar/sustituir/eliminar PDF                   | Aprobado en PR #59 y PR #61                                      | `tests/e2e/projects.spec.ts`, `cv.spec.ts`, PostgreSQL 16                                   |
| `REG-M3` | Búsqueda, detalle y análisis desde proveedor disponible                                                  | Flujo E2E en modo `fixture`; evidencia `live` histórica separada                         | Aprobado con limitación explícita                                | `tests/e2e/jobs.spec.ts`, `docs/acceptance/M3-results.md`                                   |

## Validaciones ejecutadas en QA-05

- Formato del alcance CI y lint completo: aprobados.
- Typecheck de API, web, Skill Engine, contratos, DB y E2E: aprobado.
- Build de API, web y Skill Engine: aprobado; Vite produjo 115 módulos.
- Vitest: 30 archivos y 240 pruebas aprobadas; 7 archivos / 71 casos PostgreSQL omitidos localmente
  por no existir `E2E_DATABASE_URL` aislada configurada.
- Contratos: 5 OpenAPI y 54 ejemplos validados, incluidas las respuestas rechazadas esperadas.
- Catálogo: 10 tecnologías, 18 alias, 30 casos sintéticos ES/EN y 10 plantillas acíclicas validadas.
- Playwright: el nuevo caso M4 fue descubierto y compilado; su ejecución real queda a cargo del CI
  con PostgreSQL 16 de la rama QA-05.

La ejecución global de Prettier sobre documentación histórica detectó 12 archivos anteriores fuera
del formato actual. El comando oficial del repositorio no incluye esos documentos y pasó; QA-05 no
reescribe archivos históricos ajenos para ocultar esa diferencia.

## M3: `fixture`, `live` y pendientes

- CI y el recorrido reproducible utilizan `JOBS_PROVIDER_MODE=fixture`; son datos sintéticos.
- La consulta `live` documentada en `M3-results.md` ocurrió el 5 de noviembre de 2026 contra
  `/search-v2` y `/job-details`; QA-05 no hizo nuevas llamadas ni consumió cuota.
- `JOBS_LIVE_ENABLED=false` y `JOBS_LIVE_RETENTION_ALLOWED=false` permanecen como valores seguros
  por defecto. La autorización de retención del proveedor sigue siendo una limitación abierta y no
  bloquea los flujos locales/fixture publicados en M3.

## Defectos y limitaciones

- No se encontró un defecto funcional bloqueante en las suites ejecutadas.
- QA-05 detectó que el manifiesto histórico de readiness comparaba la evidencia M1 contra un probe
  modificado después de aquella ejecución (`76c7b11`). Se archivó la versión exacta probada de
  `ff667d8` (mismo SHA-256 ya registrado) y el manifiesto apunta ahora a esa instantánea inmutable;
  `validate-results.mjs` vuelve a comprobar la evidencia sin atribuir una reejecución inexistente.
  Se aplicó el mismo archivado fiel al probe de contraste de `7846f86`, también modificado después
  de generar su manifiesto final.
- El runner E2E rechaza correctamente cualquier base no identificada como `test`/`e2e`; en CI (`127598195279`) y en el candidato `release/0.4.0` con base aislada (`devpath_e2e_rel04`) la suite completa pasa sin fallos.

## Revisión manual de aceptación M4 realizada por Emanuel

Fecha de confirmación: 5 de noviembre de 2026. Revisor: **Emanuel** (`cocotero64`), con datos exclusivamente sintéticos. Este registro refleja únicamente las comprobaciones ejecutadas y comunicadas personalmente por Emanuel; **no atribuye aprobaciones, revisiones ni firmas a otras personas** (`P1`, `P2`, `P3`, `P4` u otro revisor humano).

| #   | Verificación manual de M4                                                                                                                                                           | Resultado comunicado por Emanuel       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1   | Recorrido funcional completo de M4 (cuenta nueva → perfil → skills → análisis → proyecto → CV → ruta → progreso → recarga → logout y aislamiento entre cuentas)                     | **Aprobado**, sin defectos bloqueantes |
| 2   | Navegación por teclado en la creación y apertura de una ruta, selector de estado, enlace de recurso externo y retorno a “Mis rutas”, con foco visible y orden comprensible          | **Aprobado**, sin defectos bloqueantes |
| 3   | Revisión de listado (`/learning-paths`) y detalle (`/learning-paths/:id`) con zoom real del navegador al 200 %, sin acciones ocultas ni desplazamiento horizontal que impida operar | **Aprobado**, sin defectos bloqueantes |
| 4   | Contraste y legibilidad de estado, progreso, mensajes de error, estado vacío y ruta con cero brechas                                                                                | **Aprobado**, sin defectos bloqueantes |
| 5   | Utilidad y comprensión de motivo y actividad de cada paso, y presentación segura sin instrucción engañosa cuando el proyecto vinculado fue eliminado                                | **Aprobado**, sin defectos bloqueantes |
| 6   | Comprensión directa de “avance autodeclarado”, ausencia de certificación automática y ausencia de garantía laboral sin explicación adicional                                        | **Aprobado**, sin defectos bloqueantes |

### Evaluación de puertas y desbloqueo de `REL-04`

- **Criterios de `QA-05`:** satisfechos con los checks en verde de `PR #59` (`b4724e7`) y `PR #61` (`87e5c6d`, incluyendo `M1 E2E (Chromium + PostgreSQL 16)`) más las seis verificaciones manuales aprobadas personalmente por Emanuel sin defectos bloqueantes.
- **Estado de `DEP-01`:** tarea opcional asignada a Zaid (`DEPREMU`), integrada en `develop` (`0a5439c`) y explícitamente no bloqueante según `docs/prompts/lotes/10-rutas-y-cierre.md` y `docs/TAREAS_PARA_IAS.md`.
- **Autorizaciones pendientes para publicación (`REL-04`):** queda desbloqueada la creación y validación de la rama candidata `release/0.4.0` desde `develop` y la apertura del PR `release/0.4.0 → main`. Conforme a `docs/FLUJO_GITHUB.md` y `docs/prompts/lotes/10-rutas-y-cierre.md`, **no se realiza merge, publicación de tag `v0.4.0`, GitHub Release ni sincronización `main → develop` sin verificar antes todas las validaciones del candidato y contar con la autorización/ejecución humana correspondiente**.
