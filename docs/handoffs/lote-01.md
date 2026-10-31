# Handoff lote 01 — base y contratos

## Estado real

| Tarea | Estado | Evidencia | Condición de continuación |
| --- | --- | --- | --- |
| GOV-01 | Implementada y publicada, sin merge. | ADR 0001–0003 y matriz de responsabilidades en el commit `72c1956`, publicado como `origin/docs/gov-01-decisions`; P1–P5 aceptados como roles operativos. | Abrir o verificar el PR, obtener revisión P1/P2 y hacer merge humano a `develop`. |
| GOV-02 | Bloqueada. | `develop` y `origin/develop` ya existen y STR-01 está integrado en `a421535`, pero GOV-01 aún no está integrada. | Merge humano de GOV-01; crear `docs/gov-02-collaboration` desde `develop` actualizado. |
| FND-01 | Bloqueada. | STR-01 sí está integrado en `develop` mediante `a421535`; GOV-02 no está integrada. | Integrar GOV-02; crear `chore/fnd-01-workspace` desde `develop` actualizado. |
| CTR-01 | Bloqueada. | Depende de GOV-01 y del workspace real de FND-01. | Integrar GOV-01 y FND-01; crear `docs/ctr-01-mvp-contracts`. |
| CAT-01 | Bloqueada. | Depende de GOV-01 y del validador/esquema aportado por FND-01. | Integrar GOV-01 y FND-01; crear `data/cat-01-technology-catalog`. |

## Decisiones preparadas

- M0–M4 y ejecución local quedan documentados sin presentar funciones como implementadas.
- Matching inicial determinista y catálogo versionado; sin IA generativa.
- API y Skill Engine deben ejecutarse como procesos separados por requisito confirmado de evaluación.
- Auth permanece como módulo propuesto dentro de la API; no se requiere un tercer proceso.
- OpenAPI será la fuente de verdad para las fronteras HTTP; CTR-01 automatizará generación o comprobación sobre el workspace de FND-01.
- P1–P5 son roles operativos suficientes por decisión explícita; los nombres reales no son requisito. El integrador se asigna en cada PR de release y no se inventan usuarios para `CODEOWNERS`.

## Git y evidencia observada

- Base de GOV-01: `develop` en `a4215356ab9d208519fb2922151eab5e77e94af1`.
- STR-01: integrado por el merge `a421535` desde `chore/str-01-project-structure`.
- `main` y `origin/main`: `135a1a7fea9bea0ae6d8d4087c8bf032efda8a91`; el historial conserva `c338a21`.
- Remoto verificado: `https://github.com/Om4r28xz/Dev_Path.git`.
- Rama actual de la tarea: `docs/gov-01-decisions`.
- Commit de GOV-01: `72c19567cc8f562f96eec1efaf8d21a7853fa0ce` (`docs(governance): record scope, topology and stack decisions`).
- Push verificado: la rama local y `origin/docs/gov-01-decisions` apuntan al mismo commit `72c1956`.
- PR: no verificado desde el repositorio local.
- No se hizo merge, tag ni cambio remoto de protección durante esta actualización.

## Validación GOV-01

- Revisión de estructura documental, estados confirmado/propuesto, contexto y consecuencias.
- Comprobación pendiente: revisión humana P1/P2.
- No aplican pruebas de código.

## PR propuesto para GOV-01

- Título: `docs(governance): record scope, topology and stack decisions`
- Base: `develop`
- Rama: `docs/gov-01-decisions`

### Cuerpo propuesto

Registra el alcance M0–M4, el matching determinista, la topología local y el stack propuesto. Confirma API y Skill Engine como procesos separados y mantiene auth como módulo de la API. Añade la matriz de responsabilidad y revisión basada en los roles operativos P1–P5.

Validación: revisión documental local. Pendientes antes del merge: aprobaciones P1/P2.

## Próxima acción

Abrir o verificar el PR hacia `develop`, obtener revisión P1/P2 y hacer el merge humano de GOV-01. No iniciar GOV-02 en esta rama ni encadenar FND-01/CTR-01/CAT-01 antes de que sus dependencias estén integradas.
