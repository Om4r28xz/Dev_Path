# Primera revisión visual M1 — Emanuel

## Delegación y comprobaciones finales en curso

Emanuel comunica que Omar le delegó coordinar el cierre y autorizó continuar el trabajo técnico y preparar/publicar el candidato **cuando se satisfagan sus requisitos**. Esto acredita coordinación y participación de Emanuel, no firmas realizadas por P1/P2/P5 ni reasignación automática de todos los roles. FLUJO_GITHUB pide revisor humano distinto del autor como objetivo; si no está disponible, registrar revisión pendiente. No inventar aprobación.

La primera revisión fue grabada según informa Emanuel; video no adjunto ni inspeccionado por la IA. Zoom real200%, teclado completo, lector, estados y comprensión adicional se registrarán solo tras recibir sus resultados. Zoom real200%: Emanuel confirmó explícitamente que revisó Perfil, Nuevo análisis y resultado con evidencias, todo legible y utilizable, y después volvió al100%. Resultado: aprobado por Emanuel para ese alcance; navegador/versión y capturas no aportados. No equivale a aprobación integral UI-01 ni a firma de otro rol. Teclado: Emanuel confirmó que completó sin mouse los cuatro pasos solicitados: Tab/Shift+Tab y foco en Perfil, Space para skills y guardado con Enter, formulario/análisis por teclado y cancelación del modal con Escape/retorno de foco. Resultado: aprobado por Emanuel para ese recorrido; no prueba de todas las combinaciones ni firma ajena. Lector de pantalla: tras las instrucciones de activar Narrador y recorrer perfil, formulario, resultado/evidencias y confirmación de eliminación, Emanuel confirmó que funcionó todo el recorrido solicitado. Resultado: compatibilidad básica observada por Emanuel, sin problemas reportados; navegador/versión y versión del lector no aportados. No constituye certificación WCAG ni prueba exhaustiva de anuncios/estados. No crear rama release hasta satisfacer las puertas.

Fetch actual: PR36 (develop→main) y PR37 (revisión Emanuel→main) fusionados; main956ed32, develop3024b5c. La revisión bf66975 es ancestro de main, no de develop. Sin tagv0.1.0 observado. No se interpreta integración prematura en main como REL-01 completa; sincronización main→develop reservada al procedimiento humano, tras revisar contenido exclusivo.


## Identidad, entorno y alcance

Fuente: observaciones directas comunicadas por Emanuel en esta conversación. Revisión manual realizada por **Emanuel**; no es firma de P5, P1/P2 ni Omar. Fecha/hora exacta de ejecución, navegador/versión, viewport y capturas: no aportados. Demo preparada sobre3024b5c, Node22/PostgreSQL18.3 nativos y servicios reales; no se atribuye prueba Docker local ni PG16 local.

Emanuel revisó registro, perfil, selección de habilidades, guardado, análisis de vacantes, porcentaje, evidencias, historial, detalle y cierre de sesión. Informó que no observó fallos que impidieran utilizar las funcionalidades principales. Esto acredita **ese alcance observado**, no aceptación integral de UI-01/EVID-06 ni de M1. No se atribuyen login independiente, eliminación, zoom, lector o teclado manual si no se confirmaron explícitamente.

Ejemplo observado: perfil C# y Git; vacante Git, JavaScript y React. Coincidencia Git, faltantes JavaScript/React; C# no está en la vacante. round(100×1/3)=33%. Emanuel confirmó coherencia del33%. No se afirma que ejecutó el ejemplo67% en esta revisión.

## Hallazgos y clasificación

| Observación de Emanuel                     | Clasificación actual                                      | Condición que la convertiría en defecto bloqueante                                            |
| ------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Mucho espacio blanco en escritorio         | Mejora estética opcional                                  | Impide alcanzar/entender contenido o controles necesarios                                     |
| Algunos textos/elementos pequeños          | Mejora de legibilidad por evaluar; sin bloqueo demostrado | Texto ilegible, zoom/reflujo roto, targets o contraste incumplidos con evidencia reproducible |
| Selector de habilidades largo              | Mejora opcional de organización                           | Imposible seleccionar/guardar o navegación/foco inaccesibles                                  |
| Porcentaje/evidencias podrían destacar más | Mejora opcional de jerarquía visual/comprensión           | Información oculta, engañosa o incomprensible en el criterio de aceptación                    |

No se abre un rediseño ni se convierten preferencias estéticas en tareas obligatorias de v0.1.0. No hay defecto bloqueante demostrado por esta revisión. Las mejoras pueden priorizarse después de M1, salvo que las comprobaciones pendientes aporten un incumplimiento concreto. No se modificó código.

## Comprobación de evidencia técnica existente

No se repitieron suites sin cambios de frontend: comparación git entre6cba655 y3024b5c no arroja cambios en apps/web/src ni vite.config. Se inspeccionaron los artefactos ya ejecutados:

- `evidence/readiness-accessibility-fixed.json`:10 vistas, ninguna violación automatizada detectada; scrollWidth/clientWidth320 en todas a viewport320px. Esto cubre overflow horizontal medido, no todos los posibles recortes ni una evaluación estética.
- Axe conserva incomplete color-contrast en formulario y engine503; no se reclasificó como aprobado del escáner.
- `evidence/contrast-recheck.json`: cálculo independiente normal/503 de18.526740961784572:1, colores opacos. No certifica todos los colores/estados ni WCAG completo.
- `evidence/final06-e2e.txt`:8 E2E aprobados, incluido orden de Tab/Shift+Tab/foco visible, navegación/recarga, target-size con teclado/guardado, aislamiento y legacy/HTML inerte. Modal/Escape y retorno de foco cubiertos en pruebas existentes; no sustituyen lectura humana.
- CI/Compose reales sobre44b0301 y merge5061185 ya aprobados; evidencia integrada en `OPS-01-dossier.md`. El merge3024b5c solo modifica documentación; su Docs check no se presenta como nueva ejecución de producto.

Se conserva la matriz histórica27 técnicos/3 casos completos pendientes. Esta revisión añade evidencia manual de Emanuel, no cambia firmas ajenas ni resultados para hacer pasar pruebas.

## Pendientes mínimos para aceptación

| Responsable                | Acción necesaria                                                                                                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Emanuel / revisor asignado | Completar lo no confirmado: navegación solo teclado y modal, responsive/zoom real200%, contraste visual y mensajes/vacíos. Registrar navegador, viewport, resultados y capturas saneadas cuando aporten evidencia. No repetir recorridos ya confirmados sin motivo.                                           |
| P5                         | Revisar este alcance y completar/firmar UI-01 y EVID-06 conforme a `P5-review-form.md`: lector/anuncios y zoom, estados, null frente0%, evidence ausente/HTML inerte y comprensión. Si Omar reasigna el rol a Emanuel, documentar la reasignación y cobertura; no deducirla del pedido de probar la interfaz. |
| P1/P2                      | Revisar artefactos exitosos y registrar aceptación OPS-01, muestra QA/DB/privacidad y rollback. Las firmas están pendientes; el runtime remoto ya está comprobado.                                                                                                                                            |
| Omar/P1                    | Confirmar decisiones, ausencia de bloqueantes y autorización expresa del candidato/publicación. El encargo de ejecutar/revisar M1 no equivale a esa autorización.                                                                                                                                             |

## Decisión REL-01

La preparación independiente de REL-01 ya está integrada: changelog propuesto, estrategia de8 versiones privadas, instalación limpia, smoke, rollback y sincronización en `docs/release/M1-CANDIDATE-CHECKLIST.md`. No requiere otro rediseño ni repetir suites para cerrar esta revisión documental.

**Aún no habilitada la rama release/0.1.0 según las puertas actuales:** faltan decisiones humanas documentadas. La autorización de Omar para continuar y preparar/publicar el candidato validado fue comunicada por Emanuel; es condicional al cumplimiento de las puertas, no sustituye esas decisiones. Después se aplican versiones/changelog y se valida el SHA candidato final; esos resultados futuros no se inventan a partir de CI previo. Merge/tagv0.1.0 y sincronización main→develop son pasos humanos del proceso autorizado. CTR-02 espera su comprobación.

Estado: revisión funcional/visual inicial de Emanuel realizada sin bloqueantes reportados; UI-01/EVID-06 integrales y OPS-01 formal pendientes. Sin release/tag/merge automático.

## Revisión manual de ventana estrecha

Emanuel confirmó que Perfil, Nuevo análisis, resultado con evidencias e Historial funcionaron con ventana estrecha y zoom100%, sin reportar textos cortados, superposiciones, botones inaccesibles ni desplazamiento horizontal en ese recorrido. Resultado: aprobado por Emanuel para el tamaño utilizado; ancho exacto y navegador/versión no aportados. No equivale a prueba de todos los dispositivos o breakpoints.

## Validación y vacante sin tecnologías — confirmación de Emanuel

Emanuel indicó que ya había realizado esta prueba y confirmó que funciona tal como se describió: vacante vacía impide envío o presenta indicación clara; texto «Buscamos una persona organizada y con buena comunicación.» se procesa sin tecnologías y explica compatibilidad no calculable, sin confundirla con0% o un fallo del sistema. Se registra confirmación de prueba previa, no nueva ejecución ordenada por la IA. No se recibió literal del mensaje ni captura.

## Consolidación manual actual

Recorrido funcional inicial/33%, zoom real200%, teclado solicitado, Narrador básico, ventana estrecha y validación/null: confirmados por Emanuel. Sin bloqueantes funcionales reportados; preferencias estéticas opcionales sin cambios de código. Navegador/versión y tamaños exactos siguen sin aportarse; video informado pero no inspeccionado. Pruebas técnicas existentes de legacy/HTML inerte, engine503/retry, contraste, sesiones y aislamiento se reutilizan sin convertirlas en ejecuciones manuales de Emanuel. Las comprobaciones que no confirmó explícitamente conservan esa limitación.

Siguiente puerta: P1/P2 revisan artefactos y aceptación OPS/QA; P5 o revisor formalmente designado evalúa la cobertura de este registro y documenta la decisión UI-01/EVID-06. Coordinación delegada a Emanuel no se transforma en firmas ajenas. Omar confirma decisiones y autoriza candidato con requisitos satisfechos. No repetir pruebas acreditadas; solo repetir afectadas por un defecto o las obligatorias sobre el candidato final.
