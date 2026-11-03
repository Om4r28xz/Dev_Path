# Revisión humana pendiente — M1

Estado: **no ejecutada por P5; sin aprobación humana**. Complementa [M1-results.md](M1-results.md), no lo reemplaza.

Formulario rellenable: [P5-review-form](P5-review-form.md). Estado técnico nuevo y defecto: [READINESS-M1](READINESS-M1.md). PR31 integra QA-02, pero no equivale a firma de aceptación. M1-A11Y-001 tiene fix6cba655 integrado por PR32 y revalidado sobre f700cf2; registrar el commit real que evalúe P5.

## Guía breve para completar ahora

Evaluar develop5061185 (o anotar SHA posterior real). Abrir [formulario](P5-review-form.md), seguir pasos UI-01/EVID-06 y registrar observado, decisión, fecha y evidencia sintética. Técnicamente están cubiertos foco/teclado/targets, navegación/recarga,67%/0%/null, legacy/HTML inerte y fallos; no repetir suites completas para firmar. Falta lectura humana con lector/zoom/reflujo, contraste visual de todos los estados y comprensión real. Compose remoto ya aprobó: preparar el entorno según [expediente OPS](OPS-01-dossier.md), no mostrar credenciales en capturas.

## Preparación

P1/P2 preparan una copia del commit revisado, migraciones/seed y dos cuentas sintéticas en una base dedicada. Confirmar versión/commit y no usar datos personales, credenciales ni CV reales. Usar [SETUP_LOCAL](../SETUP_LOCAL.md); no apuntar pruebas destructivas a volúmenes de demo. Si Docker está disponible, ejecutar también OPS-01 de la matriz.

| Revisión             | Pasos de P5                                                                                                                                                 | Registrar                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Teclado y foco       | Tab/Shift+Tab/Enter por registro, login, perfil, catálogo, vacante, resultado e historial. Abrir confirmación de borrado, recorrerla y cancelar con Escape. | Orden lógico, foco visible, regreso al botón inicial, ausencia de trampas.                                          |
| Zoom y responsive    | Zoom real200%, viewport estrecho, textos largos y títulos hostiles inertes.                                                                                 | Lectura, reflujo, ausencia de controles ocultos/solapados; capturas sintéticas.                                     |
| Lector de pantalla   | Navegar títulos, labels, errores/status, compatibilidad, coincidencias/faltantes, evidence/legacy y modal.                                                  | Lector/versión, anuncios efectivos y elementos sin nombre. La inspección DOM automática no sustituye esto.          |
| Contraste            | Comprobar todos los estados/pantallas, incluidos hover/focus/error, badges, bordes y vacíos.                                                                | Colores, herramienta y ratios. Las13 muestras de texto login/register del informe no acreditan todo el objetivo AA. |
| Comprensión          | Perfil JS+React y vacante JS+React+Git; después vacante sin tecnologías y un análisis antiguo.                                                              | Comprensión de67%, null frente a0%, skillsOutdated y evidence ausente; el score no es probabilidad laboral.         |
| Errores/recuperación | Con P2 detener solo engine de prueba, provocar error, restaurar y reintentar. Probar404, carga/vacío, error inicial/página/borrado.                         | Mensaje legible, texto conservado, retry claro y ningún éxito ficticio.                                             |
| Dos pestañas/logout  | Abrir dos pestañas de la misma cuenta, recargar, logout y cambiar a otra cuenta.                                                                            | No restaurar sesión ni mostrar datos anteriores; probar también el navegador objetivo real del equipo.              |
| Borrado              | Cancelar primero; después confirmar, recargar y abrir URL eliminada.                                                                                        | Confirmación explícita, persistencia de borrado y404 útil.                                                          |

## Registro que debe completar una persona autorizada

Para cada caso anotar ID de M1-cases, commit exacto, fecha, SO/navegador/lector, precondiciones, pasos, esperado, observado, estado aprobado/fallido/no ejecutado y evidencia saneada. No subir cookies/tokens/passwords; evitar capturas de formularios rellenados con credenciales.

Si falla: ID de defecto, severidad/impacto, reproducción mínima y responsable. P1/P2 revisan si requiere PR fix separado. Repetir los casos afectados tras integrar la corrección; conservar el registro del fallo original.

| Responsable                                        | Estado    | Evidencia/fecha/decisión                   |
| -------------------------------------------------- | --------- | ------------------------------------------ |
| P5 — revisión humana y aceptación                  | Pendiente | Sin firma ni aprobación registrada.        |
| P1/P2 — reproducción de muestra y revisión técnica | Pendiente | El informe automático no es su aprobación. |
| Omar — decisión global de aceptación M1               | Pendiente | No se hizo merge por la IA.                |

Aceptar solo cuando se hayan atendido los casos completos no ejecutados, resuelto/reprobado bloqueantes y registrado las revisiones. No declarar M1 liberada por completar este documento.
