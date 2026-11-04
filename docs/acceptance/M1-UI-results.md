# Resultados de aceptación visual M1 — VIS-04

Fecha técnica: 3 de noviembre de 2026. Rama única autorizada para el cierre pendiente del lote: `feature/vis-03-04-analysis-acceptance-ui`. Base: VIS-02 `a2f5e5b`. Commit de implementación probado localmente: `4cb41ec`.

Este documento separa comprobaciones automatizadas, inspección técnica y revisión humana. Las capturas usan respuestas sintéticas interceptadas para representar estados de UI; no prueban API, engine, PostgreSQL, propiedad ni persistencia.

## Entorno

- Windows, Node 22.16.0, pnpm 11.22.0, Playwright 1.64.1 y Microsoft Edge del sistema.
- Preview de la compilación web en loopback.
- Viewports automatizados: 1280 × 800, 640 × 600 y 320 × 720.
- `E2E_DATABASE_URL` no está configurada; el E2E real local queda bloqueado antes de iniciar.

## Matriz

| Caso                                       | Estado                                               | Evidencia / observación                                                                       |
| ------------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Login y registro, escritorio/móvil         | Aprobado automatizado                                | Capturas VIS-02; targets principales y ausencia de overflow. API sintética.                   |
| Perfil y selector de habilidades           | Aprobado automatizado                                | Capturas VIS-02; 320 px, 640 px y escritorio. API sintética.                                  |
| Formulario de nueva vacante                | Aprobado automatizado                                | `vis-03-new-desktop.png`, `vis-03-new-mobile.png`; labels, contador y CTA presentes.          |
| Resultado 67%                              | Aprobado automatizado                                | Capturas VIS-03; jerarquía de porcentaje, coincidencias, faltantes, tecnologías y evidencias. |
| Resultado 0%                               | Aprobado por pruebas de componente                   | Se conserva como porcentaje real y no se confunde con `null`.                                 |
| Resultado `null`                           | Aprobado por pruebas de componente                   | Explica que no se detectaron tecnologías y no presenta `0%`.                                  |
| Evidencia literal y HTML inerte            | Aprobado por pruebas de componente                   | Las menciones se renderizan como texto escapado; no se inserta HTML ejecutable.               |
| Evidencia ausente / vacía                  | Aprobado por pruebas de componente                   | Mensajes distintos para snapshot antiguo y ausencia de tecnologías.                           |
| Historial con 67%, 0% y `null`             | Aprobado automatizado                                | `vis-03-history-desktop.png`, `vis-03-history-mobile.png`.                                    |
| Confirmación de borrado                    | Aprobado automatizado parcial                        | Diálogo nativo, Escape y retorno de foco al botón; API de borrado no ejecutada en captura.    |
| Carga, vacío, error y reintento            | Aprobado por pruebas existentes / inspección técnica | Se conservan regiones vivas, foco programático y borradores. Falta recorrido humano.          |
| Contrato, sesión, propiedad e idempotencia | Sin cambios de código                                | No se modificaron API, OpenAPI, DB, engine ni cliente de sesión. Requiere muestra P1/CI.      |
| E2E web/API/engine/PostgreSQL              | No ejecutado localmente                              | Bloqueado por ausencia de `E2E_DATABASE_URL`; no se atribuye aprobación.                      |
| Zoom real 200%                             | No ejecutado                                         | El viewport de 640 px demuestra reflujo, no zoom real.                                        |
| Teclado completo                           | No ejecutado por humano                              | Automatización solo cubre Escape y retorno de foco del diálogo.                               |
| Lector de pantalla                         | No ejecutado                                         | Requiere P5 o revisor humano designado.                                                       |
| Contraste/axe integral                     | No ejecutado                                         | Se reutilizan tokens con contrastes documentados; falta axe y revisión de todas las parejas.  |
| Comprensión y jerarquía profesional        | No ejecutado por humano                              | Las capturas sirven para revisión, no sustituyen la observación P5.                           |

## Evidencia automatizada saneada

- Nueva vacante: [escritorio](evidence/vis-03-new-desktop.png), [móvil](evidence/vis-03-new-mobile.png).
- Resultado: [escritorio](evidence/vis-03-result-desktop.png), [móvil](evidence/vis-03-result-mobile.png), [reflujo 640 px](evidence/vis-03-result-reflow-640.png).
- Historial: [escritorio](evidence/vis-03-history-desktop.png), [móvil](evidence/vis-03-history-mobile.png).
- Borrado: [diálogo](evidence/vis-03-delete-dialog.png).

Ninguna captura contiene credenciales ni datos personales reales. “Alex Demo”, títulos, identificadores y fechas son valores sintéticos. No se conserva token utilizable.

## Puertas pendientes

1. CI o entorno local dedicado ejecuta el E2E real con PostgreSQL y casos de caída del engine.
2. P5 recorre acceso, perfil, análisis, resultado, historial, error y vacío con teclado, zoom real 200% y lector.
3. P1 reproduce una muestra de score, evidencia inerte, propiedad y borrado sin cambios contractuales.
4. Los defectos bloqueantes que surjan se corrigen y revalidan en esta misma rama, según la instrucción del usuario para este cierre.

VIS-04 no se considera aceptada mientras esas puertas humanas y de entorno sigan marcadas como no ejecutadas.
