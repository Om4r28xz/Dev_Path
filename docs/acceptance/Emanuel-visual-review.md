# Primera revisión visual M1 — Emanuel

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

**Aún no habilitada la rama release/0.1.0 según las puertas actuales:** faltan decisiones humanas documentadas y autorización explícita de Omar. Después se aplican versiones/changelog y se valida el SHA candidato final; esos resultados futuros no se inventan a partir de CI previo. Merge/tagv0.1.0 y sincronización main→develop son pasos humanos del proceso autorizado. CTR-02 espera su comprobación.

Estado: revisión funcional/visual inicial de Emanuel realizada sin bloqueantes reportados; UI-01/EVID-06 integrales y OPS-01 formal pendientes. Sin release/tag/merge automático.
