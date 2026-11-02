# Handoff lote 06 — bloqueado por integraciones pendientes

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

| Tarea | Estado verificado | Dependencias y siguiente acción |
| --- | --- | --- |
| QAA-01 | Bloqueada | ANL-04 sin merge. AUTH-03/OPS-01/CI-01 integradas. Tras merge verificado, crear test/qaa-01-mvp-e2e desde develop actualizado. |
| QA-02 | Bloqueada | QAA-01 sin integrar. No crear M1-results.md con aprobaciones supuestas; después ejecutar casos y registrar commit/observados reales. |
| DOC-02 | Bloqueada | ANL-04 sin merge; AUTH-02/ENG-02 integradas. Tras ANL-04 puede avanzar en rama separada y en paralelo a QAA-01. |
| REL-01 | Bloqueada | Faltan QA-02 y DOC-02 integradas, aceptación y bloqueantes resueltos. DOC-01 integrada; reproducción Compose pendiente en este entorno. Sin release/0.1.0 ni changelog/tag creados. |
| CTR-02 | Bloqueada | REL-01 no publicada; falta tag/historial/sincronización main→develop verificados. No modificar OpenAPI futuro. |

La rama docs/lote-06-readiness contiene solo esta actualización y dos documentos de planificación: docs/PLAN_EJECUCION_M1.md y docs/CHECKLIST_PREPARATORIO_M1.md. No implementa tareas bloqueadas ni adelanta contratos M2. P2/P4 pueden revisar el material desde la base integrada; Omar decide su PR separado. El PR de ANL-04 tiene revisión independiente.

## Orden exacto para retomar

1. Emanuel publica ANL-04 cuando lo autorice, P1 revisa código/propiedad/cursor/cache, P5 teclado/mensajes y Omar integra. Revisar CI de esa rama, no reutilizar el verde de 09dfb04 como evidencia de feature.
2. Fetch y verificar commit/PR ANL-04 en origin/develop (si squash, contenido y PR), sin copiar su worktree local a otras ramas.
3. Desde esa base crear test/qaa-01-mvp-e2e y docs/doc-02-mvp-architecture independientemente. Plan y criterios en PLAN_EJECUCION_M1.md. La prueba manual automatizada de ANL-04 es insumo, no QAA-01 terminada.
4. Tras QAA-01 integrada, P5/IA ejecutan únicamente verificaciones disponibles en docs/qa-02-mvp-acceptance-results, registrando no ejecutado para lo humano pendiente. Integrar resultados y DOC-02 después de revisión.
5. Solo con QA-02/DOC-02/DOC-01 integradas y bloqueantes resueltos, preparar release/0.1.0/changelog/smoke. Humano autoriza merge hacia main, tag exacto v0.1.0 y sincronización main→develop. Ninguno se ejecuta aquí.
6. CTR-02 permanece bloqueada hasta comprobar todos esos pasos. No afecta el análisis manual disponer o no de futuros permisos JSearch.

Límites actuales: Node 22.23.4/pnpm 11.22.0; PG 18.3 local aislado. PG 16 solo en CI consultada de la base; Docker/Compose y aceptación humana no probados por esta entrega. Sin push, merge, tags ni identidad ajena. No se borra ningún trabajo anterior.


## DOC-02 implementada localmente — 2026-11-02

Rama docs/doc-02-mvp-architecture, worktree .worktrees/doc-02, desde c564a57 de origin/develop. ANL-04 ya integrada por PR25; AUTH-02/ENG-02 y ANL-01/02/03/evidence también están integradas. Se conserva el registro histórico anterior: sus bloqueos ANL-04 no describen la base actual. DOC-02 no incluye cambios de QAA-01, contrato ni código de producto.

ARCHITECTURE.md documenta componentes reales, auth/tokens/cookies/rotación/logout, SQL/snapshots/idempotencia, engine/alias/scoring, evidence/legacy, historial/cursor/delete, seguridad/fallos, variables/puertos/Compose y mapa pantalla-endpoint. Tres diagramas Mermaid explican componentes, sesión y análisis. README enlaza el documento. M2/M3/M4 y las tres operaciones E3/JSearch se distinguen como futuras: el proceso evaluado será API Express; fixtures no prueban llamadas live; E3 no bloquea release M1.

Validación: correspondencia manual con routers, esquemas Zod/OpenAPI, repositorios/servicios/config, extractor/scorer, migraciones0000–0003, proxy/Compose y ADR0001–0004; enlaces Markdown locales existentes; tres diagramas parseados y renderizados en Chromium con Mermaid11.12.1 externo a dependencias del producto; formato de documentos nuevos/README y diff sin errores de whitespace. No se ejecutaron tests de código en esta rama documental ni Docker/CI remoto: no son resultados inferidos de otra rama.

Estado: implementada localmente, pendiente de publicación/revisión/integración según reporte de entrega. P1/P2 revisan conexiones/seguridad/configuración; P4 fidelidad de DTOs y límites; Omar integra el PR independiente. QAA-01 se entrega en otra rama: no se presupone su merge. QA-02 depende de ese merge; REL-01 también exige QA-02/DOC-02/DOC-01 integradas, aceptación humana y reproducción; CTR-02 espera release/tag/sincronización. Sin release ni tags creados. Si ambos PR modifican el final del handoff, conservar ambas secciones y actualizar solo estado operativo tras cada merge.
