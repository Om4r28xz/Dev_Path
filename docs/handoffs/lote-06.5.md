# Lote 06.5 — handoff de implementación

Estado verificado el 3 de noviembre de 2026 desde Git, no desde handoffs antiguos. Base de VIS-01: `origin/develop` 47f2af0. El tag `v0.1.0` es ancestro de `origin/develop`; CTR-02 está integrado por PR #43. No se modificó `main` ni el tag.

| Tarea  | Estado                                                                          | Rama                                               | Siguiente acción                                                                                             |
| ------ | ------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| VIS-01 | Implementación y validación técnica local terminadas; revisión humana pendiente | `feature/vis-01-design-system`                     | P5 revisa uso, zoom, teclado y lector; P1 revisa contrato/privacidad. Integrar PR solo tras esas revisiones. |
| VIS-02 | Bloqueada por dependencia                                                       | `feature/vis-02-auth-profile-ui` aún no creada     | Partir de `origin/develop` después de integrar VIS-01.                                                       |
| VIS-03 | Bloqueada por dependencia                                                       | `feature/vis-03-analysis-history-ui` aún no creada | Partir de `origin/develop` después de integrar VIS-02. ANL-04 ya está integrado.                             |
| VIS-04 | Bloqueada por dependencia                                                       | `docs/vis-04-m1-ui-acceptance` aún no creada       | P5 ejecuta la matriz real después de integrar VIS-03; no atribuir aceptación humana sin ejecución.           |

## VIS-01

Contrato consumido: API pública `/api/v1` y DTO M1 existentes, sin cambios. Se modificaron únicamente componentes React compartidos, CSS del shell y documentación; las rutas, reglas de análisis y lógica de sesión permanecen igual.

Cambios: tokens en `apps/web/src/styles/tokens.css`; estilos base y componentes visuales en `apps/web/src/styles/index.css`; shell accesible en `AppLayout.tsx`; roles de anuncio en `Alert.tsx`; nuevo `StatePanel.tsx`; guía `docs/design/SISTEMA_VISUAL.md`. El script `scripts/vis-01-capture.mjs` usa respuestas **sintéticas interceptadas únicamente para capturas de UI**. Las imágenes `vis-01-shell-desktop.png` (1280 px) y `vis-01-shell-mobile.png` (320 px) no contienen datos personales reales y no son evidencia de backend ni de recorrido funcional.

Validación local:

- `pnpm format:check`: pasó.
- `pnpm typecheck`: pasó.
- `pnpm build`: pasó.
- `pnpm test`: pasó; web 97, engine 51, API 64 (54 pruebas de integración omitidas por entorno), soporte E2E 2.
- `pnpm exec eslint . --ignore-pattern '.worktrees/**'`: pasó. `pnpm lint` sin exclusión falla porque ESLint recorre otros worktrees ubicados dentro de `.worktrees`, y detecta múltiples raíces TSConfig; no es un error de VIS-01.
- `node scripts/vis-01-capture.mjs`: pasó en Edge local, shell desktop/móvil, targets de navegación y logout de al menos 44 px, enlace de salto y ausencia de desbordamiento horizontal.
- Contraste calculado para parejas documentadas en el sistema visual: todas superan 4.5:1. No se ejecutó axe en esta sesión porque `QA_AXE_CORE_SOURCE` no está configurada.
- No se ejecutó el E2E real con API, engine y PostgreSQL porque `E2E_DATABASE_URL` no está configurada. Capturas sintéticas no sustituyen esa prueba.

Pendiente: CI del PR, axe, reflujo con zoom real al 200%, recorrido manual de teclado y lector de pantalla, y revisiones de P5/P1. VIS-02 aplicará el sistema a auth, perfil y selección de habilidades; VIS-03 migrará los estilos heredados de historial y el diálogo.

La creación de la issue por la integración GitHub devolvió 403 (`Resource not accessible by integration`). No se creó issue ni se inventó número.
