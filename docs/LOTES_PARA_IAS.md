# DevPath: lotes de trabajo y prompts para IAs

Actualizado: 31 de octubre de 2026.

Se han preparado **11 prompts completos**: un lote 00 para la IA de estructura y diez lotes de hasta cinco tareas para las 49 tareas originales. Se agrega STR-01 al backlog: **50 tareas en total**, incluida DEP-01 opcional.

Cada prompt contiene contexto, arquitectura, dependencias, responsables humanos, archivos, contratos relevantes, orden, pruebas, límites de Git y entrega. Copiar el archivo completo a la IA; no es necesario reconstruir el encargo a partir de un título.

## 1. Índice de prompts

| Lote | Encargo | Tareas, en orden recomendado | Prompt |
| --- | --- | --- | --- |
| 00 | Estructura completa del proyecto | STR-01 | [Copiar prompt 00](prompts/lotes/00-estructura-completa.md) |
| 01 | Base del repositorio, workspace y contratos | GOV-01, GOV-02, FND-01, CTR-01, CAT-01 | [Copiar prompt 01](prompts/lotes/01-base-y-contratos.md) |
| 02 | Infraestructura de API, datos, web, engine y CI | API-01, DAT-01, WEB-01, ENG-01, CI-01 | [Copiar prompt 02](prompts/lotes/02-infraestructura-tecnica.md) |
| 03 | Corpus, aceptación inicial, ejecución local y registro | CAT-02, QA-01, OPS-01, DOC-01, AUTH-01 | [Copiar prompt 03](prompts/lotes/03-datos-entorno-y-registro.md) |
| 04 | Sesión, habilidades y matching real | AUTH-02, PRO-01, ENG-02, AUTH-03, AUTH-04 | [Copiar prompt 04](prompts/lotes/04-sesion-skills-y-matching.md) |
| 05 | Integración vertical de perfil y análisis manual | PRO-02, ANL-01, ANL-03, ANL-02, ANL-04 | [Copiar prompt 05](prompts/lotes/05-integracion-perfil-y-analisis.md) |
| 06 | Pruebas, aceptación, release M1 y contratos M2 | QAA-01, QA-02, DOC-02, REL-01, CTR-02 | [Copiar prompt 06](prompts/lotes/06-validacion-release-m1.md) |
| 07 | Proyectos y CV privado | PRJ-01, PRJ-02, CV-01, CV-02, QA-03 | [Copiar prompt 07](prompts/lotes/07-proyectos-y-cv.md) |
| 08 | Release M2 e integración JSearch | REL-02, JSR-01, JSR-02, JSR-03, JSR-04 | [Copiar prompt 08](prompts/lotes/08-release-m2-y-jsearch.md) |
| 09 | Aceptación del proveedor y backend de aprendizaje | QA-04, REL-03, LRN-01, LRN-02, LRN-03 | [Copiar prompt 09](prompts/lotes/09-proveedor-y-aprendizaje-api.md) |
| 10 | Interfaz de rutas, aceptación final y opción de hosting | LRN-04, QA-05, REL-04, DEP-01 (DEP-01 opcional) | [Copiar prompt 10](prompts/lotes/10-rutas-y-cierre.md) |

El inventario legible por herramientas está en [lotes.json](lotes.json). Las tareas detalladas siguen en [TAREAS_PARA_IAS.md](TAREAS_PARA_IAS.md); arquitectura en [PLAN_DE_IMPLEMENTACION.md](PLAN_DE_IMPLEMENTACION.md); colaboración en [FLUJO_GITHUB.md](FLUJO_GITHUB.md).

Estado de esta entrega: prompts preparados y planificación actualizada. Esto no afirma que las 50 tareas estén implementadas ni integradas. La creación del árbol de aplicación corresponde a ejecutar el lote 00 y validar su salida.

## 2. Cómo usar un lote

1. Seleccionar el prompt y asignarlo a una IA con acceso a una copia del repositorio.
2. La IA lee el estado real y verifica dependencias de la primera tarea que vaya a ejecutar.
3. Realiza esa tarea en su rama, valida y prepara su commit/PR con el responsable humano.
4. El revisor y el integrador humanos revisan e integran; la IA no hace merges ni publica tags por sí sola.
5. La siguiente tarea dependiente nace de develop actualizado. Si falta el merge, la IA puede continuar otra tarea independiente Ready del mismo lote o dejar handoff.
6. Retomar el mismo prompt después de la integración. No duplicar trabajo ni abrir un PR gigante con todo el lote.

Una sola IA puede llevar la agenda de cinco tareas y cambiar de rama al terminar cada una. No necesita tener cinco tareas activas ni cinco contextos simultáneos. Se pueden reutilizar IAs para lotes posteriores con el handoff y el estado del repositorio como referencia.

## 3. Arranque concreto de este repositorio

Ya se observó un primer commit, c338a21, en main y la referencia local origin/main. No se encontró develop en las refs locales. Los prompts deben volver a comprobarlo, no asumir que ese estado sigue igual.

Orden de arranque:

1. **Lote 00 / STR-01:** preparar carpetas M0–M4, README de área, .gitkeep en hojas vacías y manifiesto de directorios. Puede prepararse localmente sin develop.
2. **Lote 01 / GOV-01 y GOV-02:** registrar decisiones y formalizar develop reutilizando el historial existente. No repetir bootstrap.
3. **Integrar STR-01:** PR chore/str-01-project-structure → develop cuando esa rama exista. Los archivos preparados localmente no equivalen a un merge.
4. **Retomar lote 01:** FND-01 añade herramientas/configuración reales sobre la estructura integrada; luego CTR-01 y CAT-01.

Si se prefiere completar GOV-01/GOV-02 antes del lote 00, también es válido. La condición indispensable es que STR-01 esté integrado antes de FND-01. Esto evita que dos IAs creen dos estructuras incompatibles.

## 4. Dependencias sin bloqueos artificiales

Los lotes agrupan una agenda; la disponibilidad la determina cada tarea. No es obligatorio esperar a que termine el lote anterior completo si la tarea concreta ya tiene todas sus dependencias integradas.

Ejemplos:

- CAT-02 y QA-01 del lote 03 pueden prepararse con contratos/catálogo integrados aunque todavía siga CI-01 del lote 02.
- ENG-02 del lote 04 necesita ENG-01 y CAT-02; no depende de pantallas de login.
- ANL-02 necesita ANL-01, ANL-03 y PRO-02. Por eso el lote 05 coloca ANL-03 antes de la UI de detalle.
- CTR-02 del lote 06 espera a REL-01, incluida sincronización main → develop.
- JSR-01 puede investigarse desde REL-01 aunque no esté publicado M2; implementar JSR-02 requiere REL-02.
- Si falta acceso permitido a JSearch, LRN-01/LRN-02/LRN-03 pueden avanzar con análisis manuales. No dependen de REL-03.
- DEP-01 es opcional y no bloquea M1–M4.

Para la estructura hay dos estados distintos: preparación local y posterior integración. Para una release hay preparación técnica y posterior publicación/sincronización humana. Los prompts conservan esas puertas explícitas.

## 5. Reparto humano dentro de los lotes

Un lote puede contener tareas de varias especialidades. La IA sirve de asistente común, pero cada tarea mantiene su responsable; no se atribuyen todos los cambios a una sola persona ni se inventa autoría.

| Lote | Responsables |
| --- | --- |
| 00 | P2 coordina estructura; P1/P4 revisan. |
| 01 | P4 coordina; P2 implementa FND-01 y P3 entrega CAT-01. |
| 02 | P1: API-01/DAT-01. P2: WEB-01/ENG-01/CI-01. |
| 03 | P3: CAT-02. P5: QA-01. P2: OPS-01. P4: DOC-01. P1: AUTH-01. |
| 04 | P1: AUTH-02/PRO-01. P2: ENG-02/AUTH-03/AUTH-04. |
| 05 | P1: ANL-01/ANL-03. P2: PRO-02/ANL-02/ANL-04. |
| 06 | P2: QAA-01. P5: QA-02. P4: DOC-02/CTR-02. P1 integra REL-01 con revisión P2. |
| 07 | P1: PRJ-01/CV-01. P2: PRJ-02/CV-02. P5: QA-03. |
| 08 | P1: REL-02/JSR-02/JSR-03. P4: JSR-01. P2: JSR-04. |
| 09 | P5: QA-04. P1: REL-03/LRN-02/LRN-03. P3: LRN-01. |
| 10 | P2: LRN-04. P5: QA-05. P1 integra REL-04. P4: DEP-01 opcional. |

P1/P2 concentran el código. P3 entrega catálogo/corpus/plantillas, P4 contratos/documentación y P5 casos/resultados de aceptación. Para hacer contribuciones personales, cada participante revisa y aporta su parte real desde su cuenta y rama. La IA no cambia identidades Git para simular participación.

Con dos programadores, mantener una tarea principal de código activa por persona. Los otros tres participantes pueden trabajar simultáneamente en su contenido, documentación y aceptación. No se necesitan once IAs funcionando a la vez.

## 6. Qué debe devolver cada IA

Además de los archivos de la tarea:

- Estado por ID: pendiente, en curso, implementada sin merge, integrada o bloqueada.
- Base/rama/commit y PR si existen.
- Contrato y versiones usados.
- Comandos/casos realmente ejecutados y su resultado.
- Qué necesita revisión o aceptación manual.
- Siguiente tarea Ready o dependencia exacta que falta.

Guardar en docs/handoffs/lote-XX.md al ejecutar el lote; no se crean informes ficticios de éxito durante esta planificación.

Si una herramienta falta o una operación es rechazada, registrar el hecho y el alcance pendiente. No declarar creada una estructura por haber escrito su prompt ni probada una pantalla por haber generado su código.

## 7. Estructura frente a implementación

El lote 00 reserva todas las carpetas, incluidas las futuras. FND-01 añade package.json, workspace, herramientas y arranque mínimo; los lotes de cada entrega implementan negocio.

Una carpeta de CV o learning-paths no implica que esas funciones existan. No se crean app.ts, YAML, SQL ni contratos vacíos para fingir avance. El manifiesto de estructura separa directorios existentes de archivos previstos pendientes.

El objetivo local se conserva; DEP-01 investiga opciones de cero pesos sin desplegar ni contratar.

