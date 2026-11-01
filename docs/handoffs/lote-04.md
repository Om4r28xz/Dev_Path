# Handoff lote 04

Base verificada tras `git fetch origin`: `origin/develop` en `2205b3f`. ENG-01 (`7627238`), CAT-02 (`7f481f9`), DAT-01 (`e4cc82f`), CAT-01 (`387074a`) y WEB-01 (`5c83ff3`) son ancestros de esa base. AUTH-01 no está integrado en `origin/develop`; una rama remota del lote 03 no satisface la dependencia. Rama de ENG-02: `feature/eng-02-skill-matching`, worktree exclusivo `.worktrees/eng-02`.

| Tarea   | Estado                 | Evidencia y siguiente acción                                                                     |
| ------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| AUTH-02 | Bloqueada              | Requiere AUTH-01 integrado en develop. Crear su rama desde develop actualizado tras el merge.    |
| PRO-01  | Bloqueada              | Requiere AUTH-01, DAT-01 y CAT-01 integrados; falta AUTH-01.                                     |
| ENG-02  | Implementada sin merge | Código y pruebas en esta rama. P1 revisa la respuesta interna; responsable prepara PR a develop. |
| AUTH-03 | Bloqueada              | Requiere AUTH-02 integrado; WEB-01 ya está integrado.                                            |
| AUTH-04 | Bloqueada              | Requiere AUTH-03 integrado.                                                                      |

## ENG-02

Contrato consumido: `packages/contracts/openapi/engine.yaml` 1.0.0, catálogo `packages/catalog/technologies.json` 1.0.0 y corpus CAT-02 1.0.0. Sin cambios de contrato ni catálogo. Versiones de implementación: extractor 1.1.0 y scoring 1.1.0.

Archivos: `apps/skill-engine/src/modules/analysis/extractor.ts`, `scorer.ts`, `tests/unit/extractor.test.ts`, `tests/unit/scorer.test.ts`, `tests/integration/analyze.test.ts`, `apps/skill-engine/README.md` y este handoff.

Comportamiento: alias literales con NFKC y límites Unicode, precedencia de coincidencias específicas, offsets sobre el texto original, negaciones comunes ES/EN, orden estable y máximo 20 evidencias por skill. Scoring por conjuntos: matched y missing particionan required; 2/3 = 67, R vacío = null, C vacío con R no vacío = 0. Las reglas de negación son heurísticas locales y no resuelven contexto complejo ni requisitos deseables.

Validación: `pnpm install --frozen-lockfile` con Node 22.16.0 y pnpm 11.22.0; `pnpm --filter @devpath/skill-engine test` (51/51, incluidos 30 casos del corpus y respuesta HTTP de 67%); `pnpm --filter @devpath/skill-engine build` y `typecheck`, `pnpm lint`, Prettier y `git diff --check`, todos exitosos. Texto de 20 000 caracteres cubierto con límite de tiempo y evidencia. P1 debe revisar la respuesta interna antes de la integración.

PR propuesto: **feat(engine): complete deterministic skill matching (ENG-02)**. Cuerpo: corrige límites y precedencia del extractor con el corpus CAT-02, añade negaciones comunes, evidencia acotada y scoring por conjuntos; conserva contrato 1.0.0 y catálogo 1.0.0; indica checks ejecutados y limitación de contexto de negación. Destino: develop. Revisión: P1.
