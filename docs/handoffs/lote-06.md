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
