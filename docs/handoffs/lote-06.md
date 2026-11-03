# Handoff lote 06 — estado vigente y registro histórico

## Primera revisión manual de Emanuel

Emanuel confirmó recorrido funcional/visual inicial sin fallos que impidan uso principal; ejemplo33% coherente (C# y Git frente Git/JavaScript/React). Mejoras estéticas opcionales registradas, sin rediseño. [Informe y pendientes](../acceptance/Emanuel-visual-review.md). No constituye firma P5/P1/P2/Omar ni aceptación global. Zoom/lector/estados completos y decisiones humanas siguen pendientes; REL-01 conserva sus puertas y CTR-02 sigue bloqueada.


## Vigente tras merge PR34

Develop5061185 contiene44b0301, QAA-01, QA-02, DOC-02 y target-size (ascendencia verificada). Dos jobs Compose reales aprobados; [expediente OPS](../acceptance/OPS-01-dossier.md). OPS ejecutada técnicamente, pendiente aceptación P1/P2. UI-01/EVID-06 pendientes P5, autorización REL pendiente Omar. Rama documental docs/m1-acceptance-closeout; no crear release/0.1.0 sin firmas, no aplicar versiones ni iniciar CTR. [Candidato](../release/M1-CANDIDATE-CHECKLIST.md) reutiliza changelog/versiones/publicación/rollback. Registros anteriores son históricos.

## Estado vigente final técnico —2026-11-02

Develop f700cf2 incluye PR32/6cba655 (fix target-size) y PR33/ff667d8 (documentación). QAA-01/QA-02/DOC-02 integradas; no duplicar sus ramas.8 E2E sobre integración,97web/118API/51motor/2privacidad, corpus30/OpenAPI2/19 y upgrade con datos aprobados PG18.3. CI heavy del merge32 aprobado PG16;33 Docs-only y producto idéntico.

Nuevo probe contraste normal/503:18.5267:1, colores/fondo opacos sin filtros, muestras de geometría visibles. Axe conserva incomplete: no se alteró su salida ni se afirmó revisión visual humana. Target-size cerrado técnicamente e integrado; UI-01/EVID-06 completas siguen pendientes P5. OPS-01 no ejecutado: WSL ausente, Docker ausente en PATH/modos usuario y sistema; consulta CIM de virtualización denegada, estado hardware desconocido. Instrucciones oficiales añadidas al runbook; no se ejecutó admin/reinicio ni se eludió UAC.

Rama docs/lote-06-final-technical-checks: resultados técnicos nuevos, rollback, guías actualizadas. Sin cambios de producto/contratos/versiones y sin release/0.1.0. Se añade un workflow independiente OPS M1 Compose runtime; el CI existente se conserva. Driver preparado, ejecución local bloqueada por docker ENOENT; todavía no ejecutado en GitHub. Backup custom/restauración real en DB nueva PG18.3 aprobados, sin restaurar datos de producción. Preparación REL-01 lista para revisión, bloqueada por OPS y aprobación humana/P1/P2/Omar. CTR-02 no iniciada formalmente hasta release/tag/sincronización; cualquier prepropuesta queda fuera del contrato vigente. Las secciones siguientes conservan historia, no sustituyen este estado.

## Histórico: estado tras PR31 — preparación M1,2026-11-02

QA-02 correctiva/a80e48a integrada en origin/develop6d057b1 por PR31 merged=true; QAA-01/DOC-01/DOC-02 también integradas. Develop local actualizado mediante pull --ff-only; worktrees anteriores conservados. CI del merge aprobado con PG16, run41524142215.

Rama documental docs/m1-human-review-release-readiness desde6d057b1, sin release/0.1.0. Checks funcionales97web/118API/51motor/2privacidad y7E2E aprobados; nuevo probe axe4.11 falló en10 checkbox13x13/espacio16px (M1-A11Y-001). Corrección aislada fix/profile-skill-target-size/6cba655: objetivos24px/labels32px,8E2E y probe10vistas sin infracciones confirmadas aprobados localmente; falta revisión/CI/integración. No se cambió producto en la rama documental ni se ocultó el fallo original.

Persisten2 contrastes incomplete de textarea y aceptación humana UI-01/EVID-06. Formulario P5 y runbook OPS preparados. OPS-01: falta Docker Engine/WSL; usuario instalará y confirmará docker info. La validación estática Compose no aprueba el stack. No se cambió seguridad del sistema ni se atendió UAC.

Ensayo nuevo0000–0002→0003 con datos existente/repetición aprobadoPG18.3; instalación frozen/build desde copia nueva. REL-01 bloqueada por fix no integrado, aceptación/OPS y revisiones P1/P2/Omar. Changelog/versión/publicación preparados solo como borradores docs/release;8 manifiestos privados siguen0.0.0. Sin tags, merge protegido o publicación. CTR-02 bloqueada.

Detalle/evidencias en [READINESS-M1](../acceptance/READINESS-M1.md) y [defecto](../acceptance/defects/M1-A11Y-001.md). Las secciones anteriores en el tiempo que siguen conservan su historia; ya no describen QA-02 ausente de develop.

## Histórico: auditoría PR27–30 — 2026-11-02

PR27/QAA-01 y PR28/DOC-02 integrados en develop b84255e. PR29 fusionó develop34a2242→main; PR30 fusionó QA-02 a0faee1→main fe830bb, sin llevarla a develop. GitHub merged=true y contenido/ancestry comprobados, no solo mensajes de commits. QA-02 está publicada/integrada en main, falta integración y aceptación en develop.

Correctivo fix/qa-02-integrate-develop, .worktrees/qa-02-correction: parte de origin/develop y hace fast-forward solo de la rama QA-02, conservando autores/hashes de sus cuatro commits. No se fusionó main; su handoff04 exclusivo queda fuera y a salvo. [Auditoría](../acceptance/INTEGRATION-AUDIT.md).

Validación nueva: install frozen en worktree limpio, lint/formato/typecheck/build, web97/API118/motor51/privacidad2, E2E7/7 y contratos/corpus aprobados. Nuevo ensayo PG18.3: datos existentes0000–0002→0003 preservados, índice y rerun correctos; fixture limpio. CI QA a0faee1/main fe830bb aprobado con PG16; correctivo pendiente de publicación/CI/revisión/merge según reporte de entrega.

Persisten3 casos completos pendientes: UI-01/EVID-06 dependen de P5 (lector/zoom/contraste completo/comprensión), OPS-01 depende de P1/P2 y Compose no disponible. No se cambian las27 aprobaciones técnicas anteriores ni se firma aceptación humana. REL-01 sigue bloqueada por integración correctiva/aceptación/reproducción y revisión humana; ensayo de upgrade ya aprobado técnicamente, revisión P1/P2 pendiente. Sin release/0.1.0, tag ni CTR-02. Borrador de changelog/publicación solo fuera del repositorio.

Las secciones siguientes son históricas; las referencias antiguas a QA-02 solo local o CI pendiente describen su entrega original, no la situación actual.

## Histórico — QA-02 técnica preparada, 2026-11-02

GitHub confirmó PR27 fusionado a develop en b84255efc996f67af26d6478528eba42afe6bce6. Ancestry de99ef5be/QAA-01 y38b7c7d/DOC-02 comprobado; develop actualizado con pull --ff-only en worktree temporal limpio. Se preservan CAT-02 y todos los worktrees anteriores. Rama QA-02 independiente: docs/qa-02-mvp-acceptance-results, .worktrees/qa-02.

| Tarea  | Estado real                                                                    | Siguiente acción                                                                                                               |
| ------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| QAA-01 | Integrada por PR27/b84255e                                                     | CI base PG16 aprobado; no reimplementar.                                                                                       |
| DOC-02 | Integrada por PR28/34a2242                                                     | Arquitectura conservada.                                                                                                       |
| QA-02  | Implementación técnica e informe locales; aceptación humana y merge pendientes | Publicar PR propio, CI nuevo, P5/P1/P2 y Omar revisan. No equivale a M1 aceptada.                                              |
| REL-01 | Bloqueada                                                                      | QA-02 integrada/aceptada, Compose/upgrade con datos, revisión humana y preparación de versión/changelog. DOC-01/02 integradas. |
| CTR-02 | Bloqueada                                                                      | Publicación/tag/sincronización de REL-01 verificadas.                                                                          |

Resultados y trazabilidad completos en [M1-results](../acceptance/M1-results.md): web97/API118/motor51/privacidad2;7 E2E reales; historial20+3 y reintentos/cuentas; comandos400/403/415 y caída física PostgreSQL503→200. Node22.23.4/pnpm11.22.0/PG18.3/Chromium156; migración/seed desde vacío. Dos pestañas y teclado/foco técnicos aprobados;13 muestras de contraste en login/register mínimo6.0428:1. Matriz:27 casos técnicos aprobados,0 fallidos de producto observados y3 casos completos no ejecutados (UI-01/OPS-01/EVID-06, con cobertura técnica parcial donde corresponde). No hay aprobación humana ni conformidad WCAG completa.

CI de b84255e aprobado, incluido PG16, run41515963292; CI de los nuevos casos QA-02 pendiente al publicar. Docker ausente y WSL no instalado: Compose no ejecutado. Revisión P5, instalación Compose y upgrade con datos pendientes. No se modificó producto/OpenAPI/CI/seguridad del sistema; se añadieron verificaciones y evidencias saneadas. El primer initdb falló por permisos y otro intento se interrumpió; probe final aprobado con clúster propio. Limpieza del temporal interrumpido bloqueada por revisión automática, detalle en el informe.

Guía humana [P5-review](../acceptance/P5-review.md) y puerta exacta [REL-01-checklist](../acceptance/REL-01-checklist.md). Los commits de herramientas/evidencia son2e21e23 y4b73e13; hash final de documentación/push se registra en entrega. No se creó release/0.1.0, tag ni aprobación ficticia. Las secciones siguientes conservan el registro histórico y sus estados NO sustituyen esta tabla vigente.

## Histórico: estado al resolver PR #27 — 2026-11-02

Fetch de origin/develop: **34a2242**. PR #27 sigue abierto; su rama publicada es test/qaa-01-mvp-e2e (8785173 antes del merge de actualización). Se integra origin/develop únicamente en esa rama mediante merge normal, sin rebase ni modificación de develop/main.

| Tarea  | Estado vigente                                   | Dependencia o siguiente acción                                                                      |
| ------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| QAA-01 | Implementada y publicada en PR #27; no integrada | Handoff unificado y pruebas locales aprobadas; publicación del merge, CI nuevo y revisión de Omar.  |
| QA-02  | Bloqueada; no completada                         | Requiere QAA-01 realmente integrada en origin/develop; después aceptación técnica y humana P5.      |
| DOC-02 | Integrada por PR #28, merge 34a2242 (38b7c7d)    | Arquitectura y README conservados íntegros desde develop.                                           |
| REL-01 | Bloqueada; M1 no liberada                        | QA-02 integrada, aceptación humana, reproducción y bloqueantes resueltos. DOC-01/DOC-02 integradas. |
| CTR-02 | Bloqueada; contratos futuros intactos            | Release publicada/tag y sincronización main→develop comprobados.                                    |

ANL-04 (e628ce4, PR #25), ANL-01/02/03, PRO-02 y evidence están integradas. Los bloqueos antiguos ANL-04/QAA-01 descritos abajo son históricos: ya no bloquean comenzar QAA-01, pero su PR todavía no está integrado. Los resultados locales no sustituyen CI PostgreSQL16, Docker Compose o aceptación humana. CI del commit previo 8785173 está aprobado, incluido PostgreSQL16; la nueva revisión remota del merge sigue pendiente. Docker Compose y aceptación humana continúan pendientes. E3/JSearch corresponde a M3 y no se convierte en criterio de release M1.

El conflicto fue de adición al mismo final del archivo: QAA-01 frente a DOC-02. Se conservaron las dos contribuciones, las decisiones de Omar, pruebas y pendientes; README y ARCHITECTURE.md entran sin modificaciones adicionales.

## Validación de esta resolución

Node22.23.4/pnpm11.22.0: lint, format:check, typecheck y build aprobados. pnpm test: web97/API118/engine51 y privacidad2; catálogo30, OpenAPI2 documentos/19 ejemplos aprobados. E2E4/4 en Chromium con API/engine y PostgreSQL18.3 reales; usuarios/análisis residuales0/0. Base dedicada conservada; procesos propios detenidos. Diff sin whitespace inválido, sin marcadores ni otros archivos unmerged. No existe script real de validación documental en Docs workflow (solo echo): se usó Prettier explícito, validación de contratos y comprobación de preservación de contenidos.

README.md y ARCHITECTURE.md son idénticos a origin/develop34a2242; runner, tests E2E y workflow CI son idénticos a QAA-01 anterior. Se preserva la base histórica y ambas secciones de tareas, actualizando solo estados comprobados. CI previo: [Actions41513742076](https://github.com/Om4r28xz/Dev_Path/actions/runs/41513742076). No se afirma CI nuevo aprobado ni M1 liberada.

## Registro histórico anterior a la integración de DOC-02

Los siguientes estados, bases y resultados conservan su fecha original. La tabla vigente anterior y las secciones QAA-01/DOC-02 posteriores los sustituyen para decisiones operativas.

Fecha: 1 de noviembre de 2026. Base origin/develop659e305. PR9 y lote04 integrados; verificar evidencia en lote-05.md. No hay cambios funcionales de lote06, ramas de tareas06, PR de release ni tag creados.

| Tarea  | Estado real                                             | Bloqueo y forma de retomar                                                                                                                                                                     |
| ------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QAA-01 | Bloqueada, sin implementar                              | Falta ANL-04 integrada. AUTH-03/OPS-01/CI-01 están integradas, pero el recorrido análisis/historial aún no existe en develop. Tras ANL-04, rama test/qaa-01-mvp-e2e desde develop actualizado. |
| QA-02  | Bloqueada, sin ejecutar ni generar resultados ficticios | Requiere QAA-01 integrada. Luego docs/qa-02-mvp-acceptance-results y M1-results.md con observado real y commit probado.                                                                        |
| DOC-02 | Bloqueada, sin implementar                              | Requiere ANL-04 además de AUTH-02 y ENG-02; estas dos últimas sí están integradas. No documentar análisis/historial futuros como implementados. Luego docs/doc-02-mvp-architecture.            |
| REL-01 | Bloqueada, sin preparar release de código incompleto    | Requiere QA-02/DOC-02/DOC-01 integradas y bloqueantes resueltos/revisión humana. DOC-01 está integrada por PR9; reproducción completa de Compose y aceptación humana siguen pendientes.        |
| CTR-02 | Bloqueada, sin modificar OpenAPI futuro                 | Requiere REL-01 integrada, aprobación humana, tag y sincronización main→develop verificados. No adelantar contratos M2 para aparentar release.                                                 |

## Evidencia disponible y límites

PRO-02 y ANL-01 están implementadas/validadas localmente en ramas independientes, todavía sin push ni merge por bloqueo de credenciales. Sus pruebas parciales no sustituyen QAA-01 ni aceptación completa: aún faltan GET/DELETE historial y sus pantallas integradas. No se crearon tests E2E de lote06 antes de su dependencia. El smoke Chromium de PRO-02 es evidencia acotada de esa tarea, no una aprobación de M1.

Base técnica de pruebas: Node22.23.4/pnpm11.22.0, PostgreSQL18.3 aislado y engine real; runners de CI usan PostgreSQL16, pendientes de correr después de publicar cada rama. No se afirma CI verde sin consultarlo. Docker/WSL no se modificaron en esta entrega; sigue pendiente reproducir el stack Compose si el entorno no dispone del motor.

## Procedimiento cuando se desbloquee la release

1. Integrar tareas pendientes de lote05 por sus PRs, comprobar dependencias reales en origin/develop y completar QAA-01, QA-02 y DOC-02 en ramas específicas.
2. Corregir bloqueantes por PRs revisados y registrar aceptaciones humanas pendientes, sin inventar resultados. Verificar instalación/migraciones desde vacío y desde versión anterior, CI y E2E reales.
3. Solo entonces crear release/0.1.0 desde develop actualizado, congelar alcance, preparar changelog/versión/smoke y PR a main. No incluir M2/M3/M4. La IA no hace merge ni publica tag.
4. Omar aprueba y hace merge commit de release→main y etiqueta el commit exacto v0.1.0; verificar smoke del tag. Luego PR main→develop con merge commit y validación de sincronización.
5. Solo al comprobar esa integración/sincronización, crear docs/ctr-02-extended-contracts desde develop para contratos M2 y propuestas claramente marcadas M3/M4. Sin implementación de features futuras.

No hay M1 liberada, ni tareas06 implementadas, publicadas o integradas por esta entrega. El siguiente paso disponible tras merge de ANL-01 es ANL-03; QAA-01 se desbloquea únicamente después de ANL-04 integrada.

## Estado actualizado tras auditoría ANL-02 — 2026-11-02

Esta sección reemplaza únicamente el estado operativo, conservando el registro histórico anterior. Base verificada origin/develop 09dfb04 (mergePR #24, Karen502df79); PRO-02/ANL-01/ANL-03/evidence integradas. ANL-04 existe solo localmente en feature/anl-04-analysis-history-ui, commit e628ce4, y NO es dependencia integrada. Fetch posterior a ese commit mantiene develop 09dfb04. No hay QAA-01/DOC-02/QA-02 implementadas por esta preparación.

Auditoría de la versión integrada: lint/formato/typecheck/build aprobados; web 73/API 118/motor 51, catálogo 30,OpenAPI 2/19 ejemplos con PostgreSQL18.3 real. Chromium real verificó67%, evidence/legacy/recarga/0-null, motor detenido/retry, snapshots/cuentas/corpus y respuesta perdida201→200 sin duplicar. Además401 real + refresh,409 real conserva entrada/nueva key tras editar y detalle lento no sustituye resultado actual. No se detectaron defectos ANL-02 reproducibles en este alcance; no hay rama fix inventada. P5 aún debe revisar comprensión/accesibilidad humana.

ANL-04 local pasó lint/formato/typecheck/build; web 97/API 118/motor 51 y navegador real con historial propio, cursor20+3 sin duplicados/huecos a timestamps iguales, confirmación/cancelación/foco, persistencia/404/cuentas y fallos de red/retry. El defecto de foco al cancelar surgió en la feature nueva y se corrigió allí. Estos resultados no equivalen a CI remoto ni integración de ANL-04.

| Tarea  | Estado verificado | Dependencias y siguiente acción                                                                                                                                                     |
| ------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QAA-01 | Bloqueada         | ANL-04 sin merge. AUTH-03/OPS-01/CI-01 integradas. Tras merge verificado, crear test/qaa-01-mvp-e2e desde develop actualizado.                                                      |
| QA-02  | Bloqueada         | QAA-01 sin integrar. No crear M1-results.md con aprobaciones supuestas; después ejecutar casos y registrar commit/observados reales.                                                |
| DOC-02 | Bloqueada         | ANL-04 sin merge; AUTH-02/ENG-02 integradas. Tras ANL-04 puede avanzar en rama separada y en paralelo a QAA-01.                                                                     |
| REL-01 | Bloqueada         | Faltan QA-02 y DOC-02 integradas, aceptación y bloqueantes resueltos. DOC-01 integrada; reproducción Compose pendiente en este entorno. Sin release/0.1.0 ni changelog/tag creados. |
| CTR-02 | Bloqueada         | REL-01 no publicada; falta tag/historial/sincronización main→develop verificados. No modificar OpenAPI futuro.                                                                      |

La rama docs/lote-06-readiness contiene solo esta actualización y dos documentos de planificación: docs/PLAN_EJECUCION_M1.md y docs/CHECKLIST_PREPARATORIO_M1.md. No implementa tareas bloqueadas ni adelanta contratos M2. P2/P4 pueden revisar el material desde la base integrada; Omar decide su PR separado. El PR de ANL-04 tiene revisión independiente.

## Orden exacto para retomar

1. Emanuel publica ANL-04 cuando lo autorice, P1 revisa código/propiedad/cursor/cache, P5 teclado/mensajes y Omar integra. Revisar CI de esa rama, no reutilizar el verde de 09dfb04 como evidencia de feature.
2. Fetch y verificar commit/PR ANL-04 en origin/develop (si squash, contenido y PR), sin copiar su worktree local a otras ramas.
3. Desde esa base crear test/qaa-01-mvp-e2e y docs/doc-02-mvp-architecture independientemente. Plan y criterios en PLAN_EJECUCION_M1.md. La prueba manual automatizada de ANL-04 es insumo, no QAA-01 terminada.
4. Tras QAA-01 integrada, P5/IA ejecutan únicamente verificaciones disponibles en docs/qa-02-mvp-acceptance-results, registrando no ejecutado para lo humano pendiente. Integrar resultados y DOC-02 después de revisión.
5. Solo con QA-02/DOC-02/DOC-01 integradas y bloqueantes resueltos, preparar release/0.1.0/changelog/smoke. Humano autoriza merge hacia main, tag exacto v0.1.0 y sincronización main→develop. Ninguno se ejecuta aquí.
6. CTR-02 permanece bloqueada hasta comprobar todos esos pasos. No afecta el análisis manual disponer o no de futuros permisos JSearch.

Límites actuales: Node 22.23.4/pnpm 11.22.0; PG 18.3 local aislado. PG 16 solo en CI consultada de la base; Docker/Compose y aceptación humana no probados por esta entrega. Sin push, merge, tags ni identidad ajena. No se borra ningún trabajo anterior.

## QAA-01 publicada en PR #27, pendiente de integración — 2026-11-02

Base c564a57: fetch confirmó ANL-04 por PR25/3b7c30e (e628ce4), preparación06 por PR26/b4c7a15, E3 por PR23/18f37ed y documentación c564a57. develop se actualizó mediante pull --ff-only en worktree temporal limpio. Se conservaron los cambios CAT-02 y borradores ANL-02 sin copiarlos. Rama test/qaa-01-mvp-e2e, worktree .worktrees/qaa-01, independiente de DOC-02.

Implementada suite Playwright con cuatro escenarios reales: recorrido completo con 67%, perfil/skills, evidence, snapshot PG/historial/detalle/recarga/borrado/logout/protección; dos cuentas/404/propiedad; parada real del proceso engine y retry/key/replay sin duplicar; legacy, 0/null y HTML inerte. El runner exige DB loopback dedicada sin usuarios, migra/seed, genera clave efímera, sirve build y apaga exclusivamente sus hijos. No usa mocks internos ni modifica código de producto/contratos.

Validado con Node22.23.4, pnpm11.22.0, PostgreSQL18.3 aislado y Chromium156/Playwright1.64.1: install frozen, lint, formato, typecheck (incluye tests), build; web97/API118/engine51, soporte privacidad2, catálogo30 y OpenAPI2/19 ejemplos. E2E4/4; consulta posterior users=0,analyses=0. Fallo deliberado de privacidad dio exit1 esperado y se retiró el archivo temporal; trazas/reportes inspeccionados sin passwords/JWT, incluso con campo password rellenado. Se descubrió y evitó la copia DOM automática de Playwright que incluía password; se conservan errores y trazas filtradas. Detalles/reproducción en tests/e2e/README.md.

CI añade job PG16/Chromium con migración/seed/readiness/cleanup y artefactos filtrados en fallo, incluido en ci-gate junto con los cuatro checks existentes. YAML validado estructuralmente. En la entrega local original la ejecución remota y PG16 quedaron pendientes; se confirmó después éxito de esos checks para 8785173 en Actions run 41513742076. El nuevo merge requiere su propia ejecución remota. Docker Compose y aceptación humana P5 no ejecutados ni aprobados por estas pruebas. Advertencia local NO_COLOR/FORCE_COLOR solo de presentación; no se deshabilitaron checks.

Estado en esa entrega: implementada y publicada en PR #27, commit 8785173; todavía no integrada en origin/develop. Omar/P2 deben revisar runner, lockfile, CI y artefactos; P1 aislamiento/SQL; P5 mantiene aceptación humana. QA-02 sigue bloqueada hasta verificar QAA-01 en origin/develop. DOC-02 ya está integrada por PR #28 (34a2242, commit 38b7c7d); REL-01 necesita QA-02/DOC-02/DOC-01 integradas y aceptación; CTR-02 necesita publicación/sincronización REL-01. No se crearon release, tags ni contratos futuros. E3/JSearch corresponde a M3, no bloquea pruebas M1.

## DOC-02 integrada por PR #28 — 2026-11-02

Rama docs/doc-02-mvp-architecture, worktree .worktrees/doc-02, desde c564a57 de origin/develop. ANL-04 ya integrada por PR25; AUTH-02/ENG-02 y ANL-01/02/03/evidence también están integradas. Se conserva el registro histórico anterior: sus bloqueos ANL-04 no describen la base actual. DOC-02 no incluye cambios de QAA-01, contrato ni código de producto.

ARCHITECTURE.md documenta componentes reales, auth/tokens/cookies/rotación/logout, SQL/snapshots/idempotencia, engine/alias/scoring, evidence/legacy, historial/cursor/delete, seguridad/fallos, variables/puertos/Compose y mapa pantalla-endpoint. Tres diagramas Mermaid explican componentes, sesión y análisis. README enlaza el documento. M2/M3/M4 y las tres operaciones E3/JSearch se distinguen como futuras: el proceso evaluado será API Express; fixtures no prueban llamadas live; E3 no bloquea release M1.

Validación: correspondencia manual con routers, esquemas Zod/OpenAPI, repositorios/servicios/config, extractor/scorer, migraciones0000–0003, proxy/Compose y ADR0001–0004; enlaces Markdown locales existentes; tres diagramas parseados y renderizados en Chromium con Mermaid11.12.1 externo a dependencias del producto; formato de documentos nuevos/README y diff sin errores de whitespace. No se ejecutaron tests de código en esta rama documental ni Docker/CI remoto: no son resultados inferidos de otra rama.

Estado en esa entrega: publicada e integrada en origin/develop por PR #28, merge 34a2242, commit 38b7c7d. P1/P2 revisan conexiones/seguridad/configuración; P4 fidelidad de DTOs y límites; Omar ya integró el PR independiente. QAA-01 se entrega en otra rama: no se presupone su merge. QA-02 depende de ese merge; REL-01 también exige QA-02/DOC-02/DOC-01 integradas, aceptación humana y reproducción; CTR-02 espera release/tag/sincronización. Sin release ni tags creados. El conflicto de las dos secciones se unificó conservando ambas; los resultados históricos no equivalen a validaciones remotas nuevas.
