# Handoff lote 08 — estado vigente

Base verificada: `origin/develop c596a55` el 4 de noviembre de 2026. REL-01, CTR-02, ANL-01/02, AUTH-03 y VIS-04 están integradas. El lote 07 está en develop: PRJ-01/02, CV-01/02 y QA-03 (PR #48–#53). El árbol principal con CAT-02 y todos los worktrees previos se conservaron.

| Tarea  | Estado                                                            | Dependencia / siguiente acción                                                                                     |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| REL-02 | En desarrollo en worktree/branch independiente `release/0.2.0`    | Candidato desde c596a55; validar upgrade, Compose/CV, regresión y revisión humana antes del PR/merge/tag.          |
| JSR-01 | Implementada localmente en `docs/jsr-01-provider-contract-review` | P1/P2 revisan matriz y ajuste cursor; publicar PR a develop. Sin llamadas ni suscripciones.                        |
| JSR-02 | Bloqueada                                                         | Requiere REL-02 y JSR-01 integradas, además de CTR-02. Puede implementar fixtures después; live sigue desactivado. |
| JSR-03 | Bloqueada                                                         | Requiere JSR-02 integrada y permiso de conservar texto/derivados; hoy ese permiso está pendiente.                  |
| JSR-04 | Bloqueada                                                         | Requiere JSR-02, JSR-03, ANL-02 y VIS-04 integradas; solo las dos últimas están satisfechas.                       |

## JSR-01

Archivos: `docs/provider/JSEARCH.md`, dos fixtures JSON sintéticos y este handoff. Fuentes oficiales consultadas con fecha; headers, endpoints, cursor, cuota pública y errores documentados. Plan de cuenta, cero costo total, atribución, caché, texto y derivados permanecen pendientes; por eso no se activa live.

Hallazgo contractual: la documentación vigente usa cursor opaco, mientras el M3 propuesto de CTR-02 expone page numérico. JSR-02 no debe inventar traducción; P4+P1/P2 deben ajustar el contrato a cursor antes de implementarlo. No se modificó OpenAPI en JSR-01 para respetar la coordinación requerida.

Validación: JSON parseable, enlaces revisados y diff documental sin secretos. No hay prueba live ni cuota de cuenta atribuida.
