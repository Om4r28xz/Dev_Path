# Resultados de aceptación M1 — QA-02

## Estado vigente tras PR34

Base integrada 5061185183a2f4b6201cc8f73f29a2d59f0899cb. QAA-01/QA-02/DOC-02 y fixes target-size/UID de llave integrados. Dos ejecuciones reales Compose sobre44b0301 aprobadas (push41568936504 y PR41568942398); expediente [OPS-01](OPS-01-dossier.md). Ejecución técnica acreditada por jobs/pasos GitHub, contenidos de artefactos pendientes de revisión autenticada P1/P2. No confundir el fallo local por Docker ausente con el resultado remoto aprobado.

OPS-01: pendiente aceptación P1/P2; UI-01/EVID-06: pendientes P5. Matriz histórica27/3 se conserva, no se inventan aprobaciones. REL-01 bloqueada hasta registrar decisiones; versiones siguen0.0.0, sin rama release/tag/release oficial ni CTR-02. Las secciones siguientes conservan historia y quedan subordinadas a este estado.


## Actualización final sobre f700cf2

QAA-01, QA-02 y DOC-02 integradas; PR32 cierra la corrección técnica M1-A11Y-001 y PR33 integra su documentación. Revalidación actual: web97/API118/motor51/privacidad2,8 E2E, contraste específico normal/503 y upgrade con datos aprobados. Las dos muestras de color dan18.5267:1 mediante método independiente sobre estilos opacos y geometría comprobada; axe sigue incomplete y se conserva.

UI-01/EVID-06 completas continúan pendientes de la decisión real de P5. OPS-01 no ejecutada sin Docker/WSL; workflow independiente de Compose preparado, aún sin ejecución remota. Backup/restauración real en DB nueva PG18.3 aprobados. La matriz histórica de27 casos técnicos aprobados y3 completos pendientes no se convierte en aceptación global; fuente y evidencias de cada ejecución se conservan. Nuevo registro [final06-manifest](evidence/final06-manifest.json). Las secciones de anteriores entregas se interpretan con su base/fecha, no revierten integraciones verificadas.

## Estado actual tras PR31 y auditoría ampliada

QA-02 correctiva está integrada en origin/develop **6d057b1**, GitHub merged=true/PR31 y ancestry comprobados. CI PG16 del merge aprobado. Las referencias antiguas a QA-02 solo en main o correctivo pendiente son históricas. [Preparación actual](READINESS-M1.md).

Nueva prueba técnica sobre6d057b1: suites funcionales aprobadas, pero **probe axe fallido** por10 objetivos pequeños del perfil (M1-A11Y-001). Corrección independiente **6cba655**, aún no integrada:8 E2E y probe de10 vistas sin infracciones confirmadas;2 contrastes incomplete siguen para revisar. No se cambió el esperado ni se desactivó la regla. [Defecto y revalidación](defects/M1-A11Y-001.md).

UI-01/EVID-06 completas continúan pendientes de P5 y OPS-01 no se ejecutó sin Docker Engine; el usuario instalará Desktop/WSL y confirmará docker info. Se prepararon [formulario humano](P5-review-form.md) y [runbook aislado](OPS-01-runbook.md). Las27 aprobaciones técnicas y3 casos completos pendientes del registro original se conservan, pero la nueva incidencia debe atenderse antes de afirmar aceptación global. REL-01 sigue bloqueada; sin rama release/tag/publicación.

## Actualización de integración y preparación técnica

QA-02 se publicó y se fusionó por PR30 a **main**, no a develop. La rama fix/qa-02-integrate-develop recupera solo los commits originales desde origin/develop; no fusiona main completo. QAA-01/PR27 y DOC-02/PR28 sí están integradas en develop. Ver [auditoría verificable](INTEGRATION-AUDIT.md).

Nueva ejecución: lint/formato/typecheck/build, web97/API118/motor51/privacidad2 y E2E7/7 aprobados; instalación frozen en worktree nuevo limpio. El ensayo de actualización0000–0002→0003 con datos sintéticos existentes preservó filas/score/evidence/idempotencia, creó índice de cursor y pasó reejecución sin cambios en PG18.3. Evidencias separadas en [integration-correction.json](evidence/integration-correction.json). CI QA-02/a0faee1 y merge-main/fe830bb aprobados con PG16; la nueva punta correctiva requiere su propio CI.

La matriz histórica de30 casos conserva27 aprobados técnicos y3 completos pendientes: UI-01/EVID-06 humanos y OPS-01/Compose técnico bloqueado por entorno. No hay aceptación humana ni M1 liberada. Los apartados originales siguientes conservan los resultados de su entrega; esta actualización sustituye únicamente el estado de integración/CI y del ensayo técnico de upgrade.

Fecha: 2 de noviembre de 2026. **Aceptación técnica documentada; M1 NO aceptada formalmente ni liberada.** Ejecutor: Codex, automatización técnica. Sin firma de P5 ni aprobación humana inventada.

## Base y trazabilidad

Producto integrado probado: **b84255efc996f67af26d6478528eba42afe6bce6** (merge PR27). DOC-02 integrada por PR28/34a2242; DOC-01 por PR9 (08981cb ancestro confirmado). Se revisaron GitHub y ancestry, se actualizó develop con pull --ff-only y se creó docs/qa-02-mvp-acceptance-results en .worktrees/qa-02 sin tocar avances anteriores. Código de verificación y métricas del árbol validado recogidos en **4b73e13274b46d218e382a03a158fe042e2a89f2**; los commits posteriores de informe no cambian producto ni estos tests. Las huellas SHA256 están en [execution.json](evidence/execution.json).

Los esperados proceden de [M1-cases.md](M1-cases.md), no se modificaron para ajustar resultados. Los casos conservan su ID, y los compuestos con revisión humana no se aprueban completos por tener cobertura técnica parcial.

## Entornos y evidencias

- **E1:** Windows x64; Node22.23.4; pnpm11.22.0; PostgreSQL18.3 loopback; Chromium156; Playwright1.64.1; synthetic dedicated databases.
- **E2:** Chromium156 on Windows; partial technical accessibility, P5 pending.
- **E3:** PostgreSQL18.3 newly initialized throwaway cluster + compiled API; physical stop/restart.
- **E4:** Compose not executed: Docker absent, WSL not installed.

Bases sintéticas nuevas: devpath_test_qa02, devpath_e2e_qa02 y devpath_test_qa02_history, puerto55465. Migraciones0000–0003 y seed aplicados desde vacío. El probe ERR-02 genera otro clúster temporal propio y elimina su directorio validado al finalizar. No se usaron datos/volúmenes de demo.

| Verificación                                           | Resultado                                                             | Evidencia                                                                           |
| ------------------------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Install frozen, lint, format:check, typecheck, build   | Aprobados; Node22.23.4/pnpm11.22.0                                    | execution.json y comandos reproducibles abajo                                       |
| Web / API / motor / privacidad                         | 97 / 118 / 51 / 2 aprobados                                           | [tests](evidence/tests.txt)                                                         |
| Playwright                                             | 7/7 aprobados,11.3s                                                   | [E2E](evidence/e2e.txt)                                                             |
| Historial real ampliado                                | Cursor20+3, timestamps iguales, retry, foco y cuenta tardía aprobados | [historial](evidence/history.txt)                                                   |
| Catálogo/OpenAPI                                       | Corpus30,2 documentos/19 ejemplos aprobados                           | tests.txt                                                                           |
| Auth inválido y caída física DB                        | 400/403/415 y503→200 correctos                                        | [probe](evidence/database-outage.txt)                                               |
| Contraste acotado                                      | Login6 muestras; registro7; mínimo6.0428:1, outline2px                | [métricas](evidence/ui-metrics.json)                                                |
| CI base integrada PG16                                 | Todos los checks aprobados en b84255e                                 | [Actions41515963292](https://github.com/Om4r28xz/Dev_Path/actions/runs/41515963292) |
| CI correctivo / PG16 local / Compose / revisión humana | No ejecutados en esta entrega                                         | Pendientes claramente separados                                                     |

Resultado formal de la matriz: **27 casos técnicos aprobados, 0 fallidos de producto observados y 3 casos completos no ejecutados** (UI-01, OPS-01, EVID-06). UI-01/EVID-06 sí tienen resultados parciales automatizados. Esto no es aceptación global. No se declara conformidad WCAG; contraste medido solo sobre estilos de texto por defecto en login/registro, sin cubrir todos los estados, componentes, imágenes o pantallas.

## Resultados por caso

### REG-01 — Registro y persistencia atómica

- **Precondiciones:** DB aislada migrada/seed; cuenta sintética nueva.
- **Pasos ejecutados/pendientes:** Registrar desde navegador y ejecutar auth.test.ts.
- **Esperado:** 201, perfil/familia/hash; cookie HttpOnly; secretos fuera del JSON.
- **Observado:** 201 real; suite verifica hash Argon2, RS256 y grafo persistido; E2E llega al perfil.
- **Estado:** aprobado.
- **Evidencia:** evidence/tests.txt; apps/api/tests/integration/auth.test.ts; evidence/e2e.txt.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### REG-02 — Normalización y registro concurrente

- **Precondiciones:** DB aislada; correos únicos.
- **Pasos ejecutados/pendientes:** Normalizar email; enviar dos registros iguales concurrentes.
- **Esperado:** Un grafo confirmado, duplicado409.
- **Observado:** Suite de auth aprobó normalización, carrera y una sola cuenta/perfil/sesión.
- **Estado:** aprobado.
- **Evidencia:** evidence/tests.txt; apps/api/tests/integration/auth.test.ts; apps/api/tests/unit/auth-commands.test.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### REG-03 — Validación del registro

- **Precondiciones:** API del probe y DB temporal propias.
- **Pasos ejecutados/pendientes:** Enviar nombre vacío, email inválido, password11/129, extra; ejecutar preservación de espacios.
- **Esperado:** 400 sin cuenta parcial; password no se recorta.
- **Observado:** Cinco variantes HTTP400; unidad confirma preservación de espacios y límites.
- **Estado:** aprobado.
- **Evidencia:** evidence/database-outage.txt; probes/database-outage.mjs; apps/api/tests/unit/auth-commands.test.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### REG-04 — Rollback de registro

- **Precondiciones:** Integración PostgreSQL aislada con fallo controlado.
- **Pasos ejecutados/pendientes:** Forzar insert de perfil y sesión fallidos en auth.test.ts.
- **Esperado:** Sin user/perfil/sesión huérfanos.
- **Observado:** Ambos casos de rollback aprobados.
- **Estado:** aprobado.
- **Evidencia:** evidence/tests.txt; apps/api/tests/integration/auth.test.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### LOGIN-01 — Login válido

- **Precondiciones:** Cuenta sintética registrada.
- **Pasos ejecutados/pendientes:** Logout y login UI; verificar sesión y cookie en auth suite.
- **Esperado:** 200, RS256900s, cookie7d, sin hash/refresh JSON.
- **Observado:** Login real y validaciones de token/cookie aprobadas.
- **Estado:** aprobado.
- **Evidencia:** evidence/tests.txt; apps/api/tests/integration/auth.test.ts; evidence/e2e.txt.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### LOGIN-02 — Credenciales inválidas

- **Precondiciones:** Cuenta sintética existente y email desconocido.
- **Pasos ejecutados/pendientes:** Probar password erróneo y email desconocido en auth suite.
- **Esperado:** 401 genérico idéntico, sin sesión.
- **Observado:** Caso de fallos genéricos aprobado.
- **Estado:** aprobado.
- **Evidencia:** evidence/tests.txt; apps/api/tests/integration/auth.test.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### AUTH-SEC — Origen, cliente y media type

- **Precondiciones:** API real del probe.
- **Pasos ejecutados/pendientes:** Enviar origen ajeno/null/vacío, cliente vacío, text/plain y JSON malformado.
- **Esperado:** 403/415/400 sin sesión de éxito.
- **Observado:** 403 para cuatro variantes, 415 text/plain y 400 JSON malformado.
- **Estado:** aprobado.
- **Evidencia:** evidence/database-outage.txt; probes/database-outage.mjs.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### TOKEN-01 — Verificación del bearer

- **Precondiciones:** Claves y tokens sintéticos de integración.
- **Pasos ejecutados/pendientes:** Solicitar protegidos con token vencido/manipulado/claims o algoritmo incorrectos.
- **Esperado:** 401 sin datos; cookie no sustituye bearer.
- **Observado:** Suite fully verified access JWT aprobada; rutas UI requieren login.
- **Estado:** aprobado.
- **Evidencia:** evidence/tests.txt; apps/api/tests/integration/auth.test.ts; evidence/e2e.txt.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### SESSION-01 — Rotación, replay y logout

- **Precondiciones:** Sesión con refresh cookie y DB aislada.
- **Pasos ejecutados/pendientes:** Rotar; reutilizar; logout; ejecutar carreras y dos pestañas reales.
- **Esperado:** Rotación atómica, familia revocada ante replay, UI no recupera sesión tras logout.
- **Observado:** Suite de auth/session y dos pestañas Chromium aprobadas; logout se propaga y persiste tras reload.
- **Estado:** aprobado.
- **Evidencia:** evidence/tests.txt; apps/api/tests/integration/auth.test.ts; apps/web/src/lib/session/session.test.ts; evidence/e2e.txt.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### PROFILE-01 — Perfil editable y propio

- **Precondiciones:** Dos cuentas de prueba.
- **Pasos ejecutados/pendientes:** Editar nombre/titular; probar campos extra y otro usuario.
- **Esperado:** Solo perfil propio cambia; campos fuera del DTO rechazados.
- **Observado:** Edición UI y pruebas de aislamiento/DTO aprobadas.
- **Estado:** aprobado.
- **Evidencia:** evidence/tests.txt; apps/api/tests/integration/profile.test.ts; evidence/e2e.txt.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### SKILLS-01 — Catálogo y habilidades

- **Precondiciones:** Catálogo1.0.0 sembrado.
- **Pasos ejecutados/pendientes:** Buscar/paginar catálogo, reemplazar, agregar/quitar y probar inválidos/duplicados.
- **Esperado:** IDs únicos conocidos y revisión coherente.
- **Observado:** Reemplazo/revisión/rollback/aislamiento API aprobados; agregar/quitar UI aprobado.
- **Estado:** aprobado.
- **Evidencia:** evidence/tests.txt; apps/api/tests/integration/profile.test.ts; evidence/e2e.txt.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### ANL-01 — Análisis 50% y ejemplo 67%

- **Precondiciones:** Cuenta con java; otra con JavaScript+React.
- **Pasos ejecutados/pendientes:** Analizar Java y SQL; analizar JS+React+Git; leer DTO y PG.
- **Esperado:** 50% y67%; required/matched/missing y versiones guardados.
- **Observado:** 50% exacto en prueba QA-02;67% en QAA-01; DTO y fila PG coinciden.
- **Estado:** aprobado.
- **Evidencia:** evidence/e2e.txt; tests/e2e/acceptance.spec.ts; tests/e2e/m1.spec.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### ANL-EMPTY — Texto vacío y whitespace

- **Precondiciones:** API real; UUID key nuevo.
- **Pasos ejecutados/pendientes:** Enviar vacíos del corpus y validación whitespace/límites.
- **Esperado:** 400 sin éxito ni fila.
- **Observado:** Vacíos reales400; integración de validación aprobada.
- **Estado:** aprobado.
- **Evidencia:** evidence/e2e.txt; evidence/tests.txt; apps/api/tests/integration/analyses.test.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### ANL-NONE — Vacante sin tecnologías

- **Precondiciones:** Usuario registrado.
- **Pasos ejecutados/pendientes:** Analizar texto sin tecnologías y abrir detalle.
- **Esperado:** null, warning y explicación; no0%.
- **Observado:** UI distingue null/0; integration y DTO validan warning y conjuntos vacíos.
- **Estado:** aprobado.
- **Evidencia:** evidence/e2e.txt; evidence/tests.txt; apps/api/tests/integration/analyses.test.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### ANL-CORPUS — Corpus canónico sin reetiquetar

- **Precondiciones:** Catálogo1.0.0; servicios reales.
- **Pasos ejecutados/pendientes:** Ejecutar 30 casos en extractor y enviar textos no vacíos por API→engine; vacíos400.
- **Esperado:** IDs coinciden con fixture; Java/JS y React/Native separados.
- **Observado:** 30 casos unitarios aprobados; todos los requests válidos del corpus concuerdan con IDs originales.
- **Estado:** aprobado.
- **Evidencia:** evidence/tests.txt; evidence/e2e.txt; tests/e2e/acceptance.spec.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### ANL-IDEM — Idempotencia, replay y conflicto

- **Precondiciones:** Cuenta con análisis; key UUID.
- **Pasos ejecutados/pendientes:** Repetir comando; cambiar cuerpo con misma key; concurrencia.
- **Esperado:** Una fila, replay200, conflicto409.
- **Observado:** Retry real tras caída y replay200 guardan una fila; integración verifica409 y concurrencia.
- **Estado:** aprobado.
- **Evidencia:** evidence/e2e.txt; evidence/tests.txt; apps/api/tests/integration/analyses.test.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### OWN-01 — Propiedad en detalle y borrado

- **Precondiciones:** A tiene análisis; B otra cuenta.
- **Pasos ejecutados/pendientes:** Listar/leer/borrar como B; leer UUID ausente; volver a A.
- **Esperado:** 404 ajeno/ausente, fila de A intacta.
- **Observado:** Dos cuentas reales y suites de historial verificadas.
- **Estado:** aprobado.
- **Evidencia:** evidence/e2e.txt; evidence/history.txt; evidence/tests.txt; apps/api/tests/integration/analysis-history.test.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### HISTORY-01 — Historial, detalle, recarga y snapshots

- **Precondiciones:** Cuenta con análisis y skills guardadas.
- **Pasos ejecutados/pendientes:** Cambiar skills, volver al historial/detalle, reload, crear23 y paginar20+3.
- **Esperado:** Snapshot estable, skillsOutdated, sin huecos/duplicados.
- **Observado:** Browser integrado aprobó navegación, snapshot, cursor real a timestamps iguales y persistencia de borrado.
- **Estado:** aprobado.
- **Evidencia:** evidence/history.txt; apps/web/tests/integration/analysis-history.browser.mjs.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### ERR-01 — Fallo del engine y recuperación

- **Precondiciones:** API y motor reales propios.
- **Pasos ejecutados/pendientes:** Detener motor, analizar, usar perfil, arrancar y retry; inducir timeout en integración.
- **Esperado:** 503/504 contractual, borrador conservado, sin análisis ficticio.
- **Observado:** 503 real y recuperación/key aprobados; 504 y presupuesto comprobados por integración controlada.
- **Estado:** aprobado.
- **Evidencia:** evidence/e2e.txt; evidence/tests.txt; apps/api/tests/integration/analyses.test.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### ERR-02 — Caída física de PostgreSQL

- **Precondiciones:** Clúster nuevo efímero del probe, sin datos de desarrollo.
- **Pasos ejecutados/pendientes:** Registrar, detener solo ese PG, login, reiniciar, login otra vez.
- **Esperado:** 503 saneado sin cookie; recuperación200, cuenta conservada.
- **Observado:** 503 DEPENDENCY_UNAVAILABLE sin URL/hash/stack; login200 con mismo ID al reiniciar.
- **Estado:** aprobado.
- **Evidencia:** evidence/database-outage.txt; probes/database-outage.mjs.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E3.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### UI-01 — Accesibilidad completa y comprensión

- **Precondiciones:** Persona P5, navegador y lector de pantalla.
- **Pasos ejecutados/pendientes:** Revisar teclado completo, zoom200%, lector, contraste/estados y comprensión.
- **Esperado:** Objetivo WCAG AA y recorrido entendible validado por humano.
- **Observado:** Parte técnica: Tab/Shift+Tab, outline2px, labels, foco de modal y13 muestras de texto aprobadas; lector/zoom/comprensión humana no realizados.
- **Estado:** no ejecutado.
- **Evidencia:** evidence/ui-metrics.json; evidence/e2e.txt; P5-review.md.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E2.
- **Observaciones:** Caso completo pendiente de P5. No equivale a ausencia de pruebas técnicas ni certifica WCAG.

### OPS-01 — Reproducción Compose y proxy

- **Precondiciones:** Docker Engine/Compose operativo.
- **Pasos ejecutados/pendientes:** Migrar/seed, iniciar proxy8080, reload, verificar fronteras y reiniciar conservando volumen.
- **Esperado:** Stack reproducible, engine/DB privados, persistencia.
- **Observado:** Docker ausente; wsl.exe existe pero wsl --status dice subsistema no instalado. No se ejecutó Compose.
- **Estado:** no ejecutado.
- **Evidencia:** REL-01-checklist.md.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E4.
- **Observaciones:** No se instalaron herramientas elevadas ni se cambió seguridad del sistema.

### EVID-01 — Evidence del resultado 67%

- **Precondiciones:** JS+React frente a JS+React+Git.
- **Pasos ejecutados/pendientes:** POST, GET propio y reload; comparar PG.
- **Esperado:** Menciones/offsets guardados iguales; sin fuente completa ni campos internos.
- **Observado:** 67%,3 grupos; integración compara evidence DB y proyección limitada; reload UI aprobado.
- **Estado:** aprobado.
- **Evidencia:** evidence/e2e.txt; evidence/tests.txt; apps/api/tests/integration/analyses.test.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### EVID-02 — Legacy sin evidence

- **Precondiciones:** Fila sintética antigua con required y evidence[].
- **Pasos ejecutados/pendientes:** GET y replay con misma key; motor no necesario.
- **Esperado:** Opcional ausente; ID/score/versiones estables.
- **Observado:** Legacy UI y replay de integración aprobados sin recalcular.
- **Estado:** aprobado.
- **Evidencia:** evidence/e2e.txt; evidence/tests.txt; apps/api/tests/integration/analyses.test.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### EVID-03 — Evidence vacía y null

- **Precondiciones:** Vacante sin tecnologías.
- **Pasos ejecutados/pendientes:** POST/GET; revisar DTO y pantalla.
- **Esperado:** required[]/evidence[], warning y null.
- **Observado:** Unitarias/integración verifican[] y warning; UI muestra explicación sin0%.
- **Estado:** aprobado.
- **Evidencia:** evidence/tests.txt; evidence/e2e.txt; apps/api/tests/unit/analysis-evidence.test.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### EVID-04 — Evidence almacenada corrupta

- **Precondiciones:** Fixtures de unidad y DB de integración aislada.
- **Pasos ejecutados/pendientes:** Probar JSON inválido, aliases/rangos/duplicados/arrays; consultar historial.
- **Esperado:** Omitir opcional completo sin mutar base; rechazo de POST interno inválido.
- **Observado:** Proyección conservadora y errores internos inválidos aprobados; filas históricas no reescritas.
- **Estado:** aprobado.
- **Evidencia:** evidence/tests.txt; apps/api/tests/unit/analysis-evidence.test.ts; evidence/tests.txt; apps/api/tests/integration/analysis-history.test.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### EVID-05 — Aislamiento de evidence/cache

- **Precondiciones:** Dos cuentas y análisis propio.
- **Pasos ejecutados/pendientes:** B lista/lee/borra; cambiar cuenta con respuesta de A demorada.
- **Esperado:** 404 ajeno y caché B sin datos de A.
- **Observado:** Browser real e historial ampliado verifican propiedad y respuesta tardía tras cambio de identidad.
- **Estado:** aprobado.
- **Evidencia:** evidence/e2e.txt; evidence/history.txt.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### EVID-06 — HTML, lector y evidencia sin motor

- **Precondiciones:** Análisis sintético y persona P5.
- **Pasos ejecutados/pendientes:** Inyectar título conHTML; revisar fragmento inerte; GET sin motor; lectura accesible humana.
- **Esperado:** Sin ejecución HTML; histórico funciona sin engine; contenido comprensible.
- **Observado:** HTML inerte y GET sin motor aprobados técnicamente; revisión de lector/comprensión P5 no ejecutada.
- **Estado:** no ejecutado.
- **Evidencia:** evidence/e2e.txt; evidence/tests.txt; apps/api/tests/integration/analysis-history.test.ts; P5-review.md.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E2.
- **Observaciones:** Caso compuesto: parte humana pendiente, no se declara aprobado completo.

### EVID-07 — Compatibilidad direccional de validadores

- **Precondiciones:** Ejemplos/schema anterior y actual.
- **Pasos ejecutados/pendientes:** Validar DTO con/sin evidence y validador antiguo cerrado.
- **Esperado:** Nuevo acepta viejo; viejo cerrado rechaza campo nuevo.
- **Observado:** Script de contratos ejecutó explícitamente compatibilidad direccional.
- **Estado:** aprobado.
- **Evidencia:** evidence/tests.txt; packages/contracts/scripts/validate-contracts.mjs.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

### EVID-08 — Límite UTF-8 del DTO

- **Precondiciones:** Fixtures de frontera128KiB/multibyte.
- **Pasos ejecutados/pendientes:** Proyectar caso dentro de presupuesto y exceso.
- **Esperado:** Completa solo dentro; fuera se omite entero.
- **Observado:** Unidad de frontera/presupuesto y UTF16 aprobadas.
- **Estado:** aprobado.
- **Evidencia:** evidence/tests.txt; apps/api/tests/unit/analysis-evidence.test.ts.
- **Commit exacto / entorno:** 4b73e13274b46d218e382a03a158fe042e2a89f2; producto b84255efc996f67af26d6478528eba42afe6bce6; E1.
- **Observaciones:** Aprobación técnica automatizada; no firma humana.

## Incidencias, límites y defectos

No se detectó un defecto de producto reproducible en los recorridos ejecutados; no se abrió una rama fix ni se cambió auth/contratos/CI para aparentar éxito. La prueba de medición inicialmente podía recoger cero nodos antes de pintar React: se corrigió el harness esperando el label y exigiendo al menos4 muestras por pantalla; resultados finales6/7. No fue un defecto de producto.

El primer initdb del probe falló por permisos al renombrar WAL en el temporal del sandbox. Otro intento con pipes heredados se interrumpió; se acotaron timeouts y stdio, y el probe final pasó íntegro desde QA_TEMP_ROOT autorizado. No se cuentan esos intentos como aprobados. No se instalaron herramientas elevadas ni se relajaron controles de seguridad. El temporal del intento interrumpido, work/devpath-qa02-pg-v8CsyI, quedó pendiente de limpieza porque la revisión automática rechazó el comando recursivo por requerir aprobación no disponible. No pertenece al repositorio ni a los resultados de producto; no volver a usarlo como base de prueba.

Docker no figura en PATH ni en la ubicación oficial de Docker Desktop; wsl.exe existe pero --status informa subsistema no instalado. Por eso OPS-01 no se ejecutó. PG16 está comprobado **en CI de la base integrada**; localmente se usó18.3. CI QA-02 a0faee1 ya está comprobado con PG16; el correctivo requiere CI propio al publicar.

Migración desde vacío e instalación frozen sí se probaron en un worktree nuevo. La actualización con datos estaba pendiente en esta entrega original; el ensayo0000–0002→0003 se aprobó después según INTEGRATION-AUDIT. Reinicio completo Compose con volumen, revisión humana del ensayo y smoke del candidato/tag siguen pendientes. Los negativos de timeout/rollback usan inyección controlada en integración; los éxitos, caída del engine y caída DB descritos como reales sí usaron procesos reales.

## Revisión humana y recomendación

P5 debe completar [P5-review.md](P5-review.md), registrar observados/evidencia/fecha y firmar con su propia identidad. P1/P2 deben reproducir una muestra técnica y revisar conexiones/aislamiento, probe e instalación. Omar revisa e integra este PR y registra la decisión; la IA no sustituye esas revisiones.

**Recomendación: QA-02 está lista para revisión técnica/humana; REL-01 aún no está habilitada.** Falta integrar/aceptar QA-02, ejecutar Compose, revisar el ensayo de actualización con datos y completar revisión P5/P1/P2/Omar, confirmar CI nuevo, congelar alcance y preparar versiones/changelog. Ver [checklist exacto REL-01](REL-01-checklist.md). No hay release/0.1.0 ni tag creados por esta tarea. CTR-02 espera publicación y sincronización verificadas de REL-01.
