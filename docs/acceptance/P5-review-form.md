# Revisión M1 — decisión de Emanuel como revisor delegado

Emanuel aceptó explícitamente «Acepto ese alcance para preparar el candidato», bajo delegación de Omar comunicada por él. [Registro verificable](evidence/M1-delegated-acceptance.json) y [observaciones reales](Emanuel-visual-review.md). Registro UTC 2026-11-03T04:33:03.720Z; fecha exacta de pruebas no aportada. Navegador Opera GX, versión no aportada; demo3024b5c y revisión integrada por PR39.

|Criterio|Evidencia y decisión real|Límite|
|---|---|---|
|UI-01|Recorrido principal, zoom200%, teclado con foco/modal, Narrador y ventana estrecha confirmados por Emanuel; evidencia automatizada complementaria. Aceptado para candidato.|No certificación WCAG completa ni todos los estados/dispositivos.|
|EVID-06|Presentación de citas/porcentaje revisada;33% y ausencia de tecnologías comprendidos; HTML inerte/legacy y motor indisponible cubiertos técnicamente. Alcance aceptado por Emanuel.|No afirmar ejecución manual de los casos técnicos no confirmados.|
|OPS-01|Seis checks reales del artefacto aprobado, digest/commit cotejados; alcance técnico aceptado por Emanuel.|Docker Windows local no probado; no firma de P1/P2/P4.|
|Revisión independiente|Pendiente para PR release según FLUJO_GITHUB.|No se deduce de la aceptación del autor/coordinador.|

Mejoras de espacio blanco, jerarquía/tamaño y organización de skills se aceptan como opcionales sin bloqueo demostrado. No se crea rediseño. Esta decisión habilita preparar/validar candidato; no publica M1 ni autoriza merge/tag automático. No atribuye firmas a P1/P2/P5.

## Formulario histórico previo a la decisión

Las casillas inferiores conservan la solicitud original; la decisión vigente es la anterior. No se interpretan campos antiguos vacíos como una firma inexistente de otros roles.

# Formulario de revisión humana M1 — pendiente

Evidencia manual complementaria disponible: [revisión de Emanuel](Emanuel-visual-review.md), con Opera GX, recorrido funcional/33%, zoom200%, teclado, Narrador básico, ventana estrecha y validación/null confirmados. Quien tenga el rol de aceptación debe revisar esa evidencia y registrar su decisión real; no repetir los recorridos acreditados sin motivo ni asignar automáticamente la firma a P5/P1/P2. Los campos siguientes pertenecen a sus respectivos revisores, no a la IA.


No rellenado por una persona autorizada. No constituye firma de aceptación. Guía complementaria: [P5-review](P5-review.md).

- Persona y rol: ____________________
- Fecha: ____________________
- Commit exacto probado: ____________________
- PR/versión y entorno aislado: ____________________
- SO, navegador y versión: ____________________
- Lector de pantalla y versión: ____________________
- Viewport y zoom real del navegador: ____________________
- Estado del fix M1-A11Y-001 integrado en ese commit: ____________________

Usar cuentas sintéticas A/B y no registrar passwords, cookies o tokens. P1/P2 preparan el entorno; no alterar DB real para fabricar casos. Cada fila conserva no ejecutado hasta que P5 haga los pasos y describa lo que observó.

| ID / alcance           | Pasos concretos                                                                                     | Esperado                                                                                        | Observado/evidencia/defecto | Estado       |
| ---------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------- | ------------ |
| P5-01 Registro/login   | Registrar cuenta nueva, logout, login; intentar datos inválidos.                                    | Etiquetas claras, errores legibles, sin pérdida inesperada de contexto.                         | ____________________        | No ejecutado |
| P5-02 Perfil           | Cambiar nombre/titular, guardar y recargar.                                                         | Datos persistidos; error/éxito comprensible.                                                    | ____________________        | No ejecutado |
| P5-03 Skills           | Con Tab llegar a JavaScript/React, Space para marcar, guardar; quitar y volver a agregar.           | Objetivos fáciles de activar, foco visible y selección clara/persistente.                       | ____________________        | No ejecutado |
| P5-04 Compatibilidad   | Dejar solo JS+React y analizar «JavaScript, React y Git».                                           | 67%, coincidentes JS/React y faltante Git; se entiende como cobertura, no probabilidad laboral. | ____________________        | No ejecutado |
| P5-05 Evidence         | Leer las menciones del análisis; navegar por encabezados y listas con lector.                       | Menciones literales comprensibles, asociadas con su tecnología, sin interpretar HTML.           | ____________________        | No ejecutado |
| P5-06 Sin tecnologías  | Analizar «Buscamos comunicación y trabajo en equipo».                                               | Explicación de null; no0% inventado ni vacante fallida por ausencia de tecnologías.             | ____________________        | No ejecutado |
| P5-07 Histórico/legacy | Abrir snapshot antiguo preparado por P1 sin evidence y luego cambiar skills del perfil.             | Ausencia explicada; score original estable y aviso de desactualización comprensible.            | ____________________        | No ejecutado |
| P5-08 Historial        | Abrir detalle, volver atrás, recargar y cargar más con suficientes fixtures.                        | Navegación y contexto claros; sin duplicados aparentes o pérdida de resultado.                  | ____________________        | No ejecutado |
| P5-09 Eliminar         | Abrir modal, Tab/Shift+Tab; Escape y comprobar foco; luego confirmar, recargar y abrir URL borrada. | Confirmación explícita, retorno de foco, borrado persistente y404 útil.                         | ____________________        | No ejecutado |
| P5-10 Teclado/lector   | Recorrer todas las pantallas sin mouse y escuchar labels, títulos, alert/status/modal.              | Orden lógico, controles con nombre, mensajes anunciados y ausencia de trampas.                  | ____________________        | No ejecutado |
| P5-11 Zoom/contraste   | Zoom real200%, ventana estrecha, todos los estados; revisar también textarea normal/error503.       | Reflujo/lectura sin controles ocultos; ratios AA según tamaño/componente; foco perceptible.     | ____________________        | No ejecutado |
| P5-12 Carga/errores    | P2 induce solo fallo de engine de prueba; revisar carga, vacío,503 y retry; preparar404.            | Mensajes útiles, vacante conservada y recuperación entendible.                                  | ____________________        | No ejecutado |
| P5-13 Sesión           | Dos pestañas, recarga, logout y cambio a otra cuenta.                                               | No reaparecen sesión ni datos anteriores; usuario comprende el estado.                          | ____________________        | No ejecutado |
| P5-14 Comprensión      | Pedir a una persona del público objetivo explicar67%, faltantes, evidence y eliminación.            | Comprensión real, sin sugerir probabilidades de contratación o evidencia inexistente.           | ____________________        | No ejecutado |

Estados admitidos: aprobado / fallido / no ejecutado. Si falla, registrar ID, severidad propuesta, pasos mínimos, esperado/observado, commit y evidencia saneada. P1/P2 coordinan PR fix y revalidación; no cambiar el esperado para hacerlo pasar.

## Decisión humana

- UI-01 completa: no ejecutado — decisión/justificación: ____________________
- EVID-06 completa: no ejecutado — decisión/justificación: ____________________
- Bloqueantes y revalidaciones: ____________________
- Firma/nombre/fecha P5: ____________________
- Revisión de muestra por P1/P2 y fecha: ____________________
- Decisión de aceptación por Omar y referencia: ____________________

Este formulario no autoriza merge/tag/release. OPS-01 tiene su propio registro técnico en [OPS-01-runbook](OPS-01-runbook.md).

## Registro de revisión técnica por P1/P2

Persona/rol: __________. Fecha: __________. Commit: __________. Entorno: __________.

| Criterio              | Qué permite aprobar                                                                                                                                  | Observado/evidencia/decisión |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Integraciones y CI    | QAA/QA/DOC y fix presentes por contenido/ancestry; checks del candidato identificados sin confundir Docs-only con CI completo.                       | __________                   |
| Instalación limpia    | Lockfile frozen, build y arranque reproducibles en copia nueva; no depender de secretos o datos de otro checkout.                                    | __________                   |
| DB y migraciones      | Desde vacío y con datos existentes; snapshots/evidence/key/revisión preservados e índice/rerun correctos; repetir candidato/PG16 cuando corresponda. | __________                   |
| Privacidad/seguridad  | Solo datos sintéticos; sin .env/PEM/tokens/passwords en commits/evidencia; ownership y cookies/origen correctos.                                     | __________                   |
| OPS-01                | Stack real, proxy, red, fallos/recovery y reinicio con volumen verificados según runbook. Un config estático no basta.                               | __________                   |
| Preparación/reversión | Changelog/versiones propuestos, backup/restauración aislada y rollback revisados; ningún tag/merge automático.                                       | __________                   |

Estado global P1/P2: **no ejecutado por estas personas**. Aprobación, limitaciones aceptadas y referencia del PR: __________. Omar registra por separado la autorización final de REL-01; no se deduce de los merges anteriores.
