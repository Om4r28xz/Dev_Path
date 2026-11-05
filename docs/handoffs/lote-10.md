# Handoff lote 10 — estado vigente

Fecha: 5 de noviembre de 2026.

Contratos y versiones consumidos: `packages/contracts/openapi/public.yaml` (`1.1.0`),
`packages/contracts/openapi/m4-proposed.yaml` (`0.1.0`), catálogo `1.0.0`, contenido de
aprendizaje `1.0.0` y generador `rules-1`.

| Tarea  | Estado                                                                     | Evidencia / siguiente acción                                                                                                                                                                                                    |
| ------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LRN-04 | Implementada en `feature/lrn-04-learning-path-ui`; pendiente de PR y merge | Rutas `/learning-paths` y `/learning-paths/:id`, CTA desde análisis, progreso real, estados de error/vacío/cero brechas y E2E en `tests/e2e/learning-paths.spec.ts`. P1/P5 deben revisar el PR y su utilidad antes de integrar. |
| QA-05  | Bloqueada por el merge de LRN-04                                           | Crear `docs/qa-05-learning-path-results` desde `develop` actualizado únicamente cuando LRN-04 esté integrada.                                                                                                                   |
| REL-04 | Bloqueada por el merge y aceptación de QA-05                               | Preparar `release/0.4.0` desde `develop` actualizado; la integración, etiqueta y publicación son humanas.                                                                                                                       |
| DEP-01 | Preparada de forma independiente para contribución de Zaid                 | ZIP `DevPath_DEP-01_Zaid.zip` fuera del repositorio. Zaid debe revisar, aportar una contribución verificable, ejecutar los controles y publicar su propio PR. No bloquea M4.                                                    |

## LRN-04 — pantallas de ruta y avance

- Base verificada: `origin/develop` en `e9acc321141b2925f5112086f1c49760cf477451`.
- Dependencias integradas: ANL-02, VIS-04, LRN-01, LRN-02 y LRN-03.
- Contrato consumido sin modificaciones:
  - `POST /api/v1/learning-paths` con `Idempotency-Key` UUID.
  - `GET /api/v1/learning-paths` y `GET /api/v1/learning-paths/:id`.
  - `PATCH /api/v1/learning-paths/:id/steps/:stepId`.
- La interfaz no agrega habilidades, no cambia el score y no presenta progreso como probabilidad de
  empleo. El cambio de estado solo se refleja después de una respuesta exitosa del servidor.
- Un proyecto eliminado conserva el texto de la actividad instantánea y se presenta sin enlace roto.
- La ruta sin brechas muestra un estado positivo con cero pasos, sin fabricar un plan.

Archivos de LRN-04:

- `apps/web/src/features/learning-paths/**`
- `apps/web/src/features/analyses/pages/AnalysisDetailPage.tsx`
- `apps/web/src/app/router.tsx`
- `apps/web/src/components/layout/AppLayout.tsx`
- `tests/e2e/learning-paths.spec.ts`
- `docs/handoffs/lote-10.md`

## Condición exacta de continuación

1. Revisar, validar e integrar el PR de LRN-04 hacia `develop`.
2. Verificar el merge real mediante Git antes de crear QA-05.
3. Ejecutar QA-05 y registrar revisión manual P5 sin inventar resultados.
4. Solo después de integrar QA-05, preparar REL-04. El integrador humano decide el merge hacia
   `main`, publica `v0.4.0` y sincroniza `main` hacia `develop`.
