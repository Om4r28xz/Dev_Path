# Borrador de changelog — v0.1.0 propuesta

**Borrador para revisión, sin versión oficial, fecha de publicación ni tag. No acredita aceptación M1.** No se modificaron manifiestos o contratos del producto para producir este borrador.

## Alcance propuesto M1

- Registro/login, perfil editable y habilidades del catálogo.
- Sesiones con access JWT en memoria, refresh HttpOnly rotado y logout coordinado entre pestañas compatibles.
- Análisis manual determinista con tecnologías detectadas, coincidencias, faltantes, porcentaje explicado y0% diferenciado de null.
- Snapshots PostgreSQL e idempotencia; evidence opcional de menciones literales, presentación inerte y tolerancia a registros antiguos.
- Historial propio con cursor, detalle/recarga y eliminación con confirmación; aislamiento entre cuentas.
- API y Skill Engine como procesos separados, contratos OpenAPI, migraciones/seed y configuración local.
- Pruebas unitarias/integración/E2E, corpus etiquetado, arquitectura y evidencia técnica de aceptación.

## Preparación y validación disponibles

Node22 >=22.16 y <23; pnpm11.22.0; PostgreSQL16 oficial. Base integrada5061185 incluye PR34 y corrección EACCES: API con identidad no-root alineada al dueño de llave0600 y montaje read-only. Dos jobs Compose reales aprobados sobre44b0301. Última regresión local97 web/118 API/51 motor/2 privacidad/8 E2E (PG18.3); upgrade y backup/restauración aislados aprobados. Evidencia y límites en [expediente OPS](../acceptance/OPS-01-dossier.md). Repetir candidato final cuando se apliquen versiones.

## Cambios de datos y contratos

Migraciones0000–0003, con índice de historial en0003. El ensayo de upgrade no modifica SQL histórico. OpenAPI público1.1.0 e interno1.0.0; versiones de contratos no se sustituyen por0.1.0 de la release del producto.

## Limitaciones que deben revisarse antes de publicar

- Aceptación P5 UI-01/EVID-06 y firma técnica OPS-01 pendientes; ejecución Compose remota aprobada; no declarar conformidad WCAG ni M1 aceptada.
- QA-02 ya integrada correctamente en develop por PR31/6d057b1; ninguna de esas integraciones constituye una release.
- Catálogo pequeño y reglas de negación acotadas; porcentaje de cobertura tecnológica, no probabilidad de contratación.
- No hay funcionalidades M2/M3/M4: proyectos/CV, JSearch/E3 y aprendizaje son futuros; no se afirma integración live con proveedor.
- Demo HTTP loopback no es despliegue HTTPS productivo; sin revocación inmediata de access JWT ya emitidos ni rate limit distribuido.
- Revisión P1/P2 del ensayo y reproducción final en candidato/PG16, revisión de Omar y smoke de instalación/tag pendientes.

## Antes de convertirlo en changelog oficial

Completar puertas humanas/técnicas (QA-02 ya integrada), congelar commit/alcance M1, decidir versiones del workspace y documentar cambios reales y limitaciones aceptadas. Solo entonces preparar release/0.1.0 y PR a main. Omar decide merge/tag exacto y posterior sincronización main→develop; la IA no publica automáticamente.

## Corrección técnica integrada por PR32

M1-A11Y-001: objetivos pequeños de checkbox del perfil. Fix independiente6cba655 aumenta tamaño y conserva semántica/teclado/guardado;8 E2E y repetición axe de10 vistas aprobados en esa rama. PR32 confirma su inclusión en develop;8 E2E sobre f700cf2 aprobados. Mantener lector/zoom y aceptación P5 pendientes. Las dos muestras de contraste cuentan con cálculo independiente18.5267:1; axe conserva incomplete.
