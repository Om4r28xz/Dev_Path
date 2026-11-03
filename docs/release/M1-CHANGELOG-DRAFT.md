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

Node22 >=22.16 y <23; pnpm11.22.0; PostgreSQL16 oficial. CI de QA-02 y de su merge a main aprobado, incluido E2E PG16. Validación local adicional en PG18.3:97 web,118 API,51 motor,2 privacidad y7 E2E; ensayo0000–0002→0003 con datos preservados y rerun correcto. CI de la base6d057b1 aprobado; el nuevo fix de accesibilidad requiere revisión/integración y su propio CI.

## Cambios de datos y contratos

Migraciones0000–0003, con índice de historial en0003. El ensayo de upgrade no modifica SQL histórico. OpenAPI público1.1.0 e interno1.0.0; versiones de contratos no se sustituyen por0.1.0 de la release del producto.

## Limitaciones que deben revisarse antes de publicar

- Aceptación P5 UI-01/EVID-06 y OPS-01/Compose pendientes; no declarar conformidad WCAG ni M1 aceptada.
- QA-02 ya integrada correctamente en develop por PR31/6d057b1; ninguna de esas integraciones constituye una release.
- Catálogo pequeño y reglas de negación acotadas; porcentaje de cobertura tecnológica, no probabilidad de contratación.
- No hay funcionalidades M2/M3/M4: proyectos/CV, JSearch/E3 y aprendizaje son futuros; no se afirma integración live con proveedor.
- Demo HTTP loopback no es despliegue HTTPS productivo; sin revocación inmediata de access JWT ya emitidos ni rate limit distribuido.
- Revisión P1/P2 del ensayo y reproducción final en candidato/PG16, revisión de Omar y smoke de instalación/tag pendientes.

## Antes de convertirlo en changelog oficial

Completar puertas humanas/técnicas, integrar QA-02 en develop, congelar commit/alcance M1, decidir versiones del workspace y documentar cambios reales y limitaciones aceptadas. Solo entonces preparar release/0.1.0 y PR a main. Omar decide merge/tag exacto y posterior sincronización main→develop; la IA no publica automáticamente.

## Corrección candidata, todavía sin integrar

M1-A11Y-001: objetivos pequeños de checkbox del perfil. Fix independiente6cba655 aumenta tamaño y conserva semántica/teclado/guardado;8 E2E y repetición axe de10 vistas aprobados en esa rama. No presentarlo como incluido en develop hasta comprobar su PR. Mantener lector/zoom/contraste incomplete y aceptación P5 pendientes.
