# ADR 0001: Alcance incremental y ejecución local

- Estado: aceptada
- Fecha: 2026-10-31
- Clasificación: decisiones de producto confirmadas y límites propuestos para su ejecución
- Responsables de revisión: P1, P2 y P4

## Contexto

DevPath ayuda a estudiantes y desarrolladores junior a comparar sus habilidades con las tecnologías solicitadas en una vacante. El repositorio se encuentra en M0: los documentos describen el producto planeado, pero no demuestran que sus funciones estén implementadas.

El equipo confirmó cinco entregas incrementales y que la aplicación debe poder ejecutarse localmente. También confirmó que el matching inicial será explicable y determinista, apoyado en un catálogo versionado, sin IA generativa.

## Decisión

Se confirma el siguiente alcance:

| Etapa | Resultado previsto | Estado de la decisión |
| --- | --- | --- |
| M0 | Repositorio, workspace, contratos, catálogo, base de datos, esqueletos y controles comunes. | Confirmado; todavía en construcción. |
| M1 | Registro y sesión, perfil, habilidades y análisis manual guardado. | Confirmado como primera entrega funcional. |
| M2 | Proyectos y CV PDF privado. | Confirmado para una entrega posterior. |
| M3 | Búsqueda y análisis de vacantes mediante JSearch, sujeto a permisos y cuotas verificadas. | Confirmado como objetivo; integración del proveedor pendiente. |
| M4 | Rutas de aprendizaje deterministas, plantillas curadas y progreso manual. | Confirmado como objetivo posterior. |

El desarrollo y la demostración reproducible serán locales. Un despliegue con presupuesto de cero pesos es una evaluación opcional y no condiciona M0–M4.

El matching usa reglas y catálogo. Para tecnologías requeridas `R` y habilidades del candidato `C`, `matched = R ∩ C`, `missing = R − C` y `matchPercentage = round(100 × |matched| / |R|)`. Si `R` está vacío, el porcentaje es `null`. El resultado no representa probabilidad de contratación.

Quedan fuera del alcance acordado: portales de empleadores, postulaciones dentro de DevPath, pagos, chat, scraping propio, login social, extracción automática de CV, LLM y certificación de habilidades. No se describirán como funciones disponibles.

## Consecuencias

- Cada entrega debe conservar snapshots y versiones suficientes para explicar sus resultados.
- Las funcionalidades posteriores no bloquean la primera entrega y sus carpetas reservadas no equivalen a implementación.
- Los textos de producto deben presentar el porcentaje como coincidencia de tecnologías, no como predicción laboral.
- Cualquier ampliación de alcance necesita una tarea y una decisión documentadas antes de implementarse.

## Evidencia y revisión pendiente

La decisión se basa en `DevPath_Project_Description.md` y `docs/PLAN_DE_IMPLEMENTACION.md`. P1 y P2 deben revisar este ADR en el PR de GOV-01; esa revisión humana no se considera realizada por haber preparado el archivo.
