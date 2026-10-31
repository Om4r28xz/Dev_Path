# Responsabilidades y revisiones

## Modelo de responsabilidad

Por decisión explícita del responsable del proyecto el 31 de octubre de 2026, P1–P5 son las identidades operativas suficientes para este proyecto. No es requisito registrar nombres personales para cerrar GOV-01. Los PR e issues asignan responsabilidad mediante estos roles y cada colaborador usa su propia cuenta al realizar acciones en GitHub.

El integrador de release se identifica por el rol `Integrador de release`. La persona que ejerza ese rol en una entrega debe quedar indicada en el PR de release, sin necesidad de mantener datos personales en esta matriz.

| Rol | Responsabilidad principal | Revisa obligatoriamente | Asignación |
| --- | --- | --- | --- |
| P1 | Backend y datos. | Engine/infra de P2, contratos y catálogo consumidos por backend. | Asignado al rol P1. |
| P2 | Frontend e integración técnica. | Backend de P1, contratos, catálogo y validaciones del workspace. | Asignado al rol P2. |
| P3 | Catálogo y contenido verificable. | Alias, corpus y plantillas de aprendizaje. | Asignado al rol P3. |
| P4 | Contratos, documentación y coordinación. | Coherencia de ADR, OpenAPI, guías y flujo Git. | Asignado al rol P4. |
| P5 | Aceptación, experiencia y evidencias. | Casos manuales, accesibilidad y evidencia ligada al commit. | Asignado al rol P5. |
| Integrador de release | Integra releases aprobados y publica tags autorizados. | Checklist de release y sincronización `main` → `develop`. | Rol asignado por cada PR de release. |

El autor de un PR no cuenta como su propio aprobador. Ninguna IA suplanta una identidad Git ni registra una aprobación humana.

## Mapa de revisión del lote 01

| Tarea / PR | Autor responsable | Revisiones requeridas | Base |
| --- | --- | --- | --- |
| GOV-01 — decisiones | P4 | P1 y P2 | `develop` |
| GOV-02 — colaboración | P4 | P1 y P2 | `develop` |
| FND-01 — workspace | P2 | P1 | `develop` |
| CTR-01 — contratos M1 | P4 | P1 y P2 | `develop` |
| CAT-01 — catálogo inicial | P3 | P2; P1 revisa el impacto en consumidores | `develop` |

## Uso en GitHub

GOV-02 debe configurar `CODEOWNERS` solo con cuentas o equipos de GitHub que estén realmente disponibles. Si todavía no existen cuentas distintas para P1–P5, la matriz de roles sigue siendo la fuente de responsabilidad y las revisiones se solicitan manualmente en cada PR. No se inventan usuarios ni se simulan aprobaciones.
