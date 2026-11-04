# Guía de contexto para agentes

El objetivo de este archivo es evitar lecturas masivas que consuman tokens sin aportar a la tarea actual. No se debe cargar toda la documentación del repositorio al iniciar una tarea.

## Lectura mínima por defecto

1. Leer únicamente la solicitud del usuario, los archivos que este señale y el código directamente relacionado.
2. Consultar `README.md` solo si hace falta una orientación general del repositorio.
3. Consultar el `README.md` del área afectada solo si la tarea toca esa área.
4. Usar búsquedas por nombre, símbolo o texto antes de abrir archivos completos.
5. Abrir primero fragmentos relevantes; ampliar la lectura únicamente cuando falte contexto.
6. Comprobar el estado real del código y de Git. Un documento histórico no sustituye esa comprobación.

## Documentos que no se leen por defecto

Omitir los siguientes archivos y directorios salvo que la solicitud los mencione o la tarea coincida con la excepción indicada:

| Ruta | Cuándo sí leerla |
| --- | --- |
| `DevPath_Project_Description.md` | Definición de producto, alcance original, recorridos o requisitos globales. |
| `CHANGELOG.md` | Preparación de versión, notas de release o investigación de cambios publicados. |
| `docs/PLAN_DE_IMPLEMENTACION.md` | Planificación de funcionalidades futuras o revisión del plan maestro. |
| `docs/PLAN_EJECUCION_M1.md` | Trabajo explícito sobre la ejecución histórica de M1. |
| `docs/TAREAS_PARA_IAS.md` | Selección, validación o ejecución de una tarea identificada por su ID. Leer solo la sección de esa tarea. |
| `docs/LOTES_PARA_IAS.md` y `docs/lotes.json` | Coordinación de lotes o búsqueda del prompt correspondiente. |
| `docs/prompts/lotes/` | Ejecución explícita de un lote. Leer únicamente el prompt del lote solicitado. |
| `docs/handoffs/` | Continuación de un lote concreto. Leer solo su handoff y contrastarlo con Git. |
| `docs/acceptance/` | Pruebas de aceptación, auditoría, accesibilidad, readiness o corrección de un defecto documentado. No precargar evidencias, capturas ni logs. |
| `docs/release/` | Preparación, publicación, rollback o auditoría de una release. No precargar evidencias ni logs. |
| `docs/adr/` | Una decisión arquitectónica que afecte directamente la tarea. Leer solo el ADR pertinente. |
| `docs/design/` | Implementación o revisión visual/UI. |
| `docs/CHECKLIST_PREPARATORIO_M1.md` | Trabajo explícito de preparación de M1. |
| `docs/ESTRUCTURA_DEL_PROYECTO.md` y `docs/project-structure.json` | Auditoría o modificación de la estructura global. Para ubicar archivos, preferir una búsqueda del árbol actual. |
| `docs/FLUJO_GITHUB.md` | Ramas, commits, PR, integración o releases. |
| `docs/SETUP_LOCAL.md` | Configuración del entorno, servicios locales, base de datos o ejecución completa. |
| `docs/ARCHITECTURE.md` y `docs/RESPONSABILIDADES.md` | Cambios entre servicios, límites arquitectónicos o responsabilidades de componentes. |

Los `README.md` de aplicaciones, paquetes, infraestructura, pruebas y features tampoco se leen todos al inicio. Se consulta únicamente el más cercano al código que se vaya a modificar.

## Regla de excepción

Si una tarea requiere uno de los documentos omitidos, leer la menor sección suficiente y seguir los enlaces solo cuando sean necesarios para resolver una duda concreta. Las instrucciones directas del usuario y los archivos de instrucciones más específicos siempre tienen prioridad sobre esta política de ahorro de contexto.
