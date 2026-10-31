# Handoff lote 01 — base y contratos

## Estado real

| Tarea | Estado | Evidencia | Condición de continuación |
| --- | --- | --- | --- |
| GOV-01 | Integrada. | PR #2 fusionado en `develop` mediante `ebe5940`; contiene `72c1956` y la actualización `cda9ff6`. | Sin pendientes técnicos; las revisiones humanas quedan representadas por el merge autorizado. |
| GOV-02 | Implementada sin merge. | Rama `docs/gov-02-collaboration` creada desde `develop` actualizado en `ebe5940`; README, ignores, atributos y plantillas validados localmente. | Push, PR, revisión P1/P2 y merge humano a `develop`. |
| FND-01 | Bloqueada. | STR-01 sí está integrado en `develop` mediante `a421535`; GOV-02 no está integrada. | Integrar GOV-02; crear `chore/fnd-01-workspace` desde `develop` actualizado. |
| CTR-01 | Bloqueada. | Depende de GOV-01 y del workspace real de FND-01. | Integrar GOV-01 y FND-01; crear `docs/ctr-01-mvp-contracts`. |
| CAT-01 | Bloqueada. | Depende de GOV-01 y del validador/esquema aportado por FND-01. | Integrar GOV-01 y FND-01; crear `data/cat-01-technology-catalog`. |

## Decisiones preparadas

- M0–M4 y ejecución local quedan documentados sin presentar funciones como implementadas.
- Matching inicial determinista y catálogo versionado; sin IA generativa.
- API y Skill Engine deben ejecutarse como procesos separados por requisito confirmado de evaluación.
- Auth permanece como módulo propuesto dentro de la API; no se requiere un tercer proceso.
- OpenAPI será la fuente de verdad para las fronteras HTTP; CTR-01 automatizará generación o comprobación sobre el workspace de FND-01.
- P1–P5 son roles operativos suficientes por decisión explícita; nombres y usernames no son requisitos. El integrador se asigna en cada PR de release.

## Git y evidencia observada

- Base de GOV-01: `develop` en `a4215356ab9d208519fb2922151eab5e77e94af1`.
- STR-01: integrado por el merge `a421535` desde `chore/str-01-project-structure`.
- `main` y `origin/main`: `135a1a7fea9bea0ae6d8d4087c8bf032efda8a91`; el historial conserva `c338a21`.
- Remoto verificado: `https://github.com/Om4r28xz/Dev_Path.git`.
- Rama actual de la tarea: `docs/gov-01-decisions`.
- Commit de GOV-01: `72c19567cc8f562f96eec1efaf8d21a7853fa0ce` (`docs(governance): record scope, topology and stack decisions`).
- Push verificado: la rama local y `origin/docs/gov-01-decisions` apuntan al mismo commit `72c1956`.
- PR #2: merge verificado en `origin/develop` mediante `ebe5940498f3453cbc23899bc72306bbdba3d410`.
- GOV-01 está integrada. No se hizo tag ni cambio remoto de protección durante esta actualización.

## Validación GOV-01

- Revisión de estructura documental, estados confirmado/propuesto, contexto y consecuencias.
- Comprobación pendiente: revisión humana P1/P2.
- No aplican pruebas de código.

## Entrega GOV-02

### Archivos cambiados

- `README.md`: estado real, arquitectura, colaboración y alternativa manual cuando GitHub no permita rulesets.
- `.gitignore` y `.gitattributes`: exclusión de dependencias, secretos, resultados, uploads y volúmenes; finales de línea reproducibles.
- `.github/ISSUE_TEMPLATE/task.yml`, `bug.yml` y `config.yml`: intake verificable de tareas y defectos.
- `.github/pull_request_template.md`: alcance, contrato, validación, seguridad, revisores y pendientes.
- `docs/handoffs/lote-01.md`: evidencia del merge de GOV-01 y estado de GOV-02.

### Contrato y límites consumidos

- Flujo de ramas y releases de `docs/FLUJO_GITHUB.md`.
- Responsabilidades por rol de `docs/RESPONSABILIDADES.md`.
- GOV-02 no añade lógica de negocio, dependencias, manifiestos de workspace ni workflows de CI.
- No se modificaron reglas remotas. El README documenta el control manual obligatorio si el plan o los permisos de GitHub no ofrecen protección automática.

### Validaciones ejecutadas

- Todos los archivos requeridos existen y no están vacíos.
- `develop` local coincide con `origin/develop` en `ebe5940` y desciende de `main`.
- `docs/gov-02-collaboration` parte del `develop` actualizado.
- `git check-ignore` confirma exclusión de `.env`, `node_modules`, `infra/.data` y `uploads`; `.env.example` permanece versionable.
- Búsqueda de patrones de secretos sin hallazgos.
- `git diff --check` sin errores.

### Estado Git

- Base: `develop` en `ebe5940498f3453cbc23899bc72306bbdba3d410`.
- Rama: `docs/gov-02-collaboration`.
- Commit: el commit que contiene este handoff y la entrega GOV-02.
- Push y PR: pendientes.
- Los roles P1–P5 y sus revisiones están definidos sin depender de nombres ni cuentas registradas en el repositorio.

### PR propuesto para GOV-02

- Título: `docs(collaboration): establish repository contribution workflow`
- Base: `develop`
- Rama: `docs/gov-02-collaboration`

#### Cuerpo propuesto

Establece la entrada del repositorio, exclusiones seguras, atributos de texto y plantillas de issues/PR. Conserva P1–P5 como roles de autoría y revisión sin requerir usernames. Documenta el flujo `develop`/`main` y la alternativa obligatoria cuando GitHub no permita reglas automáticas.

Validación: archivos presentes; ascendencia y base verificadas; exclusiones sensibles comprobadas con `git check-ignore`; búsqueda de secretos y `git diff --check` satisfactorios. Pendientes: revisión P1/P2 y verificación de permisos/reglas en GitHub.

## PR propuesto para GOV-01

- Título: `docs(governance): record scope, topology and stack decisions`
- Base: `develop`
- Rama: `docs/gov-01-decisions`

### Cuerpo propuesto

Registra el alcance M0–M4, el matching determinista, la topología local y el stack propuesto. Confirma API y Skill Engine como procesos separados y mantiene auth como módulo de la API. Añade la matriz de responsabilidad y revisión basada en los roles operativos P1–P5.

Validación: revisión documental local. Pendientes antes del merge: aprobaciones P1/P2.

## Próxima acción

Publicar GOV-02, abrir su PR hacia `develop` y completar el merge humano. Después, crear FND-01 desde el `develop` actualizado. CTR-01 y CAT-01 siguen esperando la integración de FND-01.
