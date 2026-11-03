# Lote 06.5 — handoff de implementación

Estado verificado el 3 de noviembre de 2026 desde Git, no desde handoffs antiguos. VIS-01 quedó integrado en `origin/develop` mediante PR [#45](https://github.com/Om4r28xz/Dev_Path/pull/45), merge `0ba1b67`; su commit de código probado en CI fue `507b1f3`. VIS-02 parte exactamente de ese merge en `feature/vis-02-auth-profile-ui`. El tag `v0.1.0` es ancestro de `origin/develop`; CTR-02 está integrado por PR #43. No se modificó `main` ni el tag.

| Tarea  | Estado                                                            | Rama                                               | Siguiente acción                                                                                   |
| ------ | ----------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| VIS-01 | Integrada en `develop`; revisión humana global continúa pendiente | `feature/vis-01-design-system`                     | Conservar pendientes humanos para la matriz VIS-04.                                                |
| VIS-02 | Implementación local completa; checks automáticos aprobados       | `feature/vis-02-auth-profile-ui`                   | Commit, CI con E2E real y revisiones P5/P1 antes de integrar.                                      |
| VIS-03 | Bloqueada por dependencia                                         | `feature/vis-03-analysis-history-ui` aún no creada | Partir de `origin/develop` después de integrar VIS-02. ANL-04 ya está integrado.                   |
| VIS-04 | Bloqueada por dependencia                                         | `docs/vis-04-m1-ui-acceptance` aún no creada       | P5 ejecuta la matriz real después de integrar VIS-03; no atribuir aceptación humana sin ejecución. |

## VIS-02

Se aplicó el sistema visual de VIS-01 a login, registro, perfil y selección de habilidades sin modificar rutas, DTO, sesión, refresh, logout ni reglas de negocio. El trabajo continúa local y sin commit sobre `feature/vis-02-auth-profile-ui`, cuya base es `origin/develop` `0ba1b67`.

Cambios principales:

- Login y registro usan una tarjeta de acceso con propósito, jerarquía y acciones claras; el registro anuncia el requisito de contraseña mediante `aria-describedby`.
- Perfil separa datos personales y habilidades, presenta estado de cuenta y siguiente paso solo cuando existen datos, y mantiene errores/confirmaciones independientes por operación.
- El catálogo adapta densidad y columnas a escritorio, 640 px y 320 px; conserva checkbox nativo de 24 px y objetivos principales de al menos 44 px.
- La marca “Cambios sin guardar” compara la selección como conjunto contra las habilidades persistidas; guardar queda deshabilitado cuando no hay diferencias reales.
- `scripts/vis-02-capture.mjs` genera evidencia sintética de login, registro y perfil en escritorio, móvil y reflujo a 640 px. Intercepta `/api/v1` exclusivamente para capturas y no acredita backend, persistencia ni E2E.

Validación local ejecutada tras los cambios:

- Plan reproducible `.tsupgrader/runtime-validation/eval-plan.json`: 6/6 aserciones aprobadas; formato, ESLint con exclusión de `.worktrees`, typecheck, build, respuesta HTTP de preview y `pnpm test`.
- `pnpm test`: pasó en el monorepo. La salida incluye web 97, engine 51, API 64 con las integraciones dependientes de entorno omitidas y soporte E2E 2.
- `node scripts/vis-02-capture.mjs`: pasó y regeneró siete capturas sin datos personales reales; verificó ausencia de desbordamiento, targets principales, checkbox, banner de siguiente paso y estado de cuenta.
- `pnpm test:e2e`: bloqueado antes de iniciar porque `E2E_DATABASE_URL` no está configurada. No se transforma este bloqueo de entorno en aprobación del recorrido real.
- La evidencia histórica y el script de VIS-01 se restauraron a `HEAD`; VIS-02 no reescribe las capturas de la tarea anterior.

Pendiente antes de integrar: CI con PostgreSQL y recorrido real registro/login/perfil/skills/recarga/logout, errores y dos pestañas; zoom real 200%, teclado, foco, lector y contraste revisados por P5; revisión P1 de contrato/privacidad. La captura `profile-reflow-640` demuestra reflujo de viewport, no zoom real.

## VIS-01

Contrato consumido: API pública `/api/v1` y DTO M1 existentes, sin cambios. Se modificaron únicamente componentes React compartidos, CSS del shell y documentación; las rutas, reglas de análisis y lógica de sesión permanecen igual.

Cambios: tokens en `apps/web/src/styles/tokens.css`; estilos base y componentes visuales en `apps/web/src/styles/index.css`; shell accesible en `AppLayout.tsx`; roles de anuncio en `Alert.tsx`; nuevo `StatePanel.tsx`; guía `docs/design/SISTEMA_VISUAL.md`. El script `scripts/vis-01-capture.mjs` usa respuestas **sintéticas interceptadas únicamente para capturas de UI**. Las imágenes `vis-01-shell-desktop.png` (1280 px) y `vis-01-shell-mobile.png` (320 px) no contienen datos personales reales y no son evidencia de backend ni de recorrido funcional.

Validación local:

- `pnpm format:check`: pasó.
- `pnpm typecheck`: pasó.
- `pnpm build`: pasó.
- `pnpm test`: pasó; web 97, engine 51, API 64 (54 pruebas de integración omitidas por entorno), soporte E2E 2.
- `pnpm exec eslint . --ignore-pattern '.worktrees/**'`: pasó. `pnpm lint` sin exclusión falla porque ESLint recorre otros worktrees ubicados dentro de `.worktrees`, y detecta múltiples raíces TSConfig; no es un error de VIS-01.
- `node scripts/vis-01-capture.mjs`: pasó en Edge local, shell desktop/móvil, targets de navegación y logout de al menos 44 px, checkboxes de al menos 24 px, enlace de salto y ausencia de desbordamiento horizontal.
- El primer CI de PR #45 detectó que los checkboxes habían bajado a 20 px. Se restauraron a 24 px mediante `--checkbox-size`. El CI del commit `507b1f3` pasó: build, pruebas, typecheck, lint/formato y M1 E2E con Chromium y PostgreSQL 16, además del check Docs.
- Contraste calculado para parejas documentadas en el sistema visual: todas superan 4.5:1. No se ejecutó axe en esta sesión porque `QA_AXE_CORE_SOURCE` no está configurada.
- El E2E real con API, engine y PostgreSQL no se ejecutó localmente porque `E2E_DATABASE_URL` no está configurada; sí pasó en CI para `507b1f3`. Capturas sintéticas no sustituyen esa prueba.

Pendiente: axe, reflujo con zoom real al 200%, recorrido manual de teclado y lector de pantalla, y revisiones de P5/P1. VIS-02 aplicará el sistema a auth, perfil y selección de habilidades; VIS-03 migrará los estilos heredados de historial y el diálogo.

La integración GitHub devolvió 403 al intentar crear la issue y el PR. Ambos se crearon después mediante la credencial Git ya autorizada para publicar la rama, sin guardar el token ni incluirlo en el repositorio.
