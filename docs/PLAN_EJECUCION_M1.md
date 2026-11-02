# Plan de ejecución de M1 — preparación documental

Fecha:2026-11-02. Base 09dfb04. Este plan NO implementa QAA-01, QA-02 ni DOC-02; ANL-04 aún no está integrada. No sustituye criterios originales ni observados de aceptación. Fuente: lote06, backlog, QA-01 y ADR0004.

## Puertas y responsables

| Trabajo futuro | Puerta real                                            | Responsable/revisor                                            |
| -------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| QAA-01         | ANL-04,AUTH-03,OPS-01,CI-01 integradas                 | P2 implementa, P1 revisa servicios/aislamiento/CI              |
| DOC-02         | ANL-04,AUTH-02,ENG-02 integradas                       | P4 documenta; P1/P2 revisan código y conexiones                |
| QA-02          | QAA-01 integrada                                       | P5 revisa aceptación; IA registra solo ejecuciones comprobadas |
| REL-01         | QA-02,DOC-02,DOC-01 integradas y bloqueantes resueltos | P1 integrador, P2 revisor, Omar autoriza pasos humanos         |
| CTR-02         | REL-01 publicada/tag/sincronización verificadas        | P4 con P1/P2; fuera del alcance M1                             |

## QAA-01: matriz de recorridos propuestos

Cada caso deberá registrar SHA/base, versiones Node/pnpm/PG/browser, datos sintéticos, pasos, esperado, observado y artefacto saneado. No hay resultados QAA-01 por escribir este plan.

| Caso planificado | Recorrido/datos                                       | Esperado y evidencia requerida                                                   |
| ---------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| E2E-ACCOUNT      | Registro→logout→login                                 | Sesión real, validaciones/errores; sin tokens en capturas/logs                   |
| E2E-PROFILE      | Editar perfil/skills y recargar                       | PostgreSQL conserva cambios; catálogo integrado                                  |
| E2E-67           | JS+React frente a JS+React+Git                        | 67%, coincidencias JS/React,faltante Git, explicación de cobertura               |
| E2E-NONE         | Texto sin tecnologías                                 | null y aviso; nunca0% inventado                                                  |
| E2E-ZERO         | Usuario sin skills con requisitos                     | 0% real y evidencia disponible                                                   |
| E2E-EVIDENCE     | Resultado nuevo/antiguo/legacy                        | Menciones guardadas, ausencia tolerada y[] sin requisitos; nunca HTML ejecutable |
| E2E-RETRY        | Motor caído/recovery, doble envío y respuesta perdida | Misma key/body, snapshot único; cambiar entrada genera otra key                  |
| E2E-HISTORY      | Crear dos→listar→detalle→skills editadas→volver       | Historial propio, skillsOutdated, score/snapshot inmutable                       |
| E2E-DELETE       | Cancelar/Escape→confirmar→reload                      | Confirmación explícita/foco, eliminación persistida,404 útil                     |
| E2E-CURSOR       | >20 registros, fechas iguales, cargar más             | Cursor real, orden estable, sin huecos/duplicados en casos cubiertos             |
| E2E-OWNERSHIP    | A/B conlist/detail/delete                             | B no accede ni borraA; cache no mezcla usuarios                                  |
| E2E-NETWORK      | Error inicial/página/borrado/detalle                  | Error separado de vacío/carga, retry sin éxito ficticio                          |
| E2E-LATE         | Consulta lenta/logout/cambio de cuenta                | No restaurar datos de identidad anterior                                         |
| E2E-SECURITY     | HTML en título/fragmentos,401/409/503                 | Render inerte y errores correctos; pruebas negativas claramente identificadas    |
| E2E-SESSION      | Expiración/dos pestañas/logout                        | Renovación coordinada y cancelación sin restaurar sesión tardía                  |

Éxitos con navegador/API/engine/PostgreSQL reales. Dobles de red solo para negativos imposibles de forzar limpiamente; no inventar puntuaciones. Históricos/timestamps se preparan exclusivamente sobre cuentas sintéticas de una DB aislada y se limpian al terminar. No cambiar etiquetas del corpus para ocultar fallos.

Insumos existentes: tests unitarios/integración API, scripts de auditoría de esta sesión y apps/web/tests/integration/analysis-history.browser.mjs de la rama local ANL-04. Esa ruta solo estará disponible en develop cuando su PR se fusione. Reutilizar comportamiento, no copiar ramas sin integrar ni llamar QAA-01 al smoke acotado.

## Integración CI a definir cuando se habilite QAA-01

- Mantener Node 22/pnpm 11.22 y lockfile frozen. Añadir Playwright/config únicamente en esa tarea, documentando dependencias/lockfile bajo revisión P2/P1.
- PostgreSQL16 aislado como el workflow existente; aplicar migraciones/seed sin borrar datos para ocultar incompatibilidades.
- Claves/credencial interna efímeras, puertos conocidos y readiness real. Servicios de prueba nunca apuntan a usuarios/DB de demo.
- Job E2E real con arranque/cierre y artefactos de fallos saneados; hacer que ci-gate falle si el job obligatorio falla. No desactivar TypeScript/tests ni relajar paths-ignore para ocultar problemas.
- Ejecutar local yCI. Tener mocks/fixtures o una rama verde anterior no acredita el nuevo job ni la copia limpia.

## QA-02: registro futuro, sin aprobación humana ficticia

Reutilizar M1-cases.md y ampliaciones EVID. M1-results.md se crea únicamente cuando la dependencia esté integrada y se ejecuten casos. Formato: ID, SHA, entorno, precondiciones, pasos, esperado, observado, aprobado/fallido/no ejecutado, evidencia, defecto/issue y revalidación. P5 conserva pendientes de comprensión, lector, contraste/responsive y aceptación humana aunque automatización pase. La auditoría09dfb04 aporta resultados propios, no cierra QA-02.

## DOC-02: índice propuesto

Tras integrar ANL-04, documentar implementación real en docs/ARCHITECTURE.md: procesos React/Vite→Express→PG/engine; rutas/pantallas; authJWT/cookie/refresh/propietario; fórmula y significado67/null/0; snapshots/versiones/evidence/ausencia; historial/cursor/delete; DTOs y mapa endpoint-pantalla; errores y aislamiento; diagrama renderizable y limitaciones. Contrastar cada nodo/puerto con código y ADRs. CV/proyectos/JSearch/rutas como futuros, no implementados. P1/P2 revisan conexiones; P4 coherencia. Puede avanzar en paralelo a QAA-01 cuando su propia puerta se cumpla.
