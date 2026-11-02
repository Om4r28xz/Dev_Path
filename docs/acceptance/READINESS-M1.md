# Preparación M1 tras integrar QA-02 — todavía bloqueada

Fecha:2026-11-02. Base integrada **6d057b15d8a5fb886e66420d6dfd5910728bce9b**, PR31 merged=true a develop confirmado en GitHub y por ascendencia de a80e48a. QAA-01, QA-02, DOC-01 y DOC-02 están integradas. Develop local actualizado con pull --ff-only; avances CAT-02 y worktrees anteriores preservados.

Rama documental: `docs/m1-human-review-release-readiness`, worktree `.worktrees/m1-readiness`. No es release/0.1.0 y no incorpora código de producción del fix por copia/merge. No hay aprobaciones humanas nuevas.

## Resultado técnico nuevo

| Verificación                                | Producto integrado6d057b1                                                                                               | Fix aislado6cba655                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Install frozen/lint/formato/typecheck/build | Aprobados en copia de trabajo nueva                                                                                     | Aprobados; instalación con store propio tras EPERM de symlink del intento compartido. Sin cambios de seguridad. |
| Web/API/motor/privacidad                    | 97/118/51/2 aprobados                                                                                                   | 97/118/51/2 aprobados                                                                                           |
| E2E funcionales                             | 7/7 aprobados,12.3s                                                                                                     | 8/8 aprobados,13.5s; incluye regresión de tamaño/Space/guardar/reload                                           |
| Probe axe4.11.0                             | **Falló**, target-size en10 checkboxes de perfil                                                                        | Aprobó su alcance:0 infracciones automáticas confirmadas en10 vistas                                            |
| Reflujo técnico                             | 0 desbordamientos medidos en320CSSpx,10 vistas; la aserción final no llegó a ejecutarse por el fallo previo de axe      | 0 desbordamientos, aserción final aprobada                                                                      |
| Contraste no resuelto automáticamente       | 2 incomplete sobre textarea (formulario y503)                                                                           | Persisten2 incomplete; no se consideran aprobados                                                               |
| Migración con datos                         | 0000–0002→0003, datos/índice/rerun aprobados PG18.3                                                                     | No hubo cambios de DB en el fix; no se afirma ensayo nuevo PG16                                                 |
| CI GitHub PG16                              | [run41524142215](https://github.com/Om4r28xz/Dev_Path/actions/runs/41524142215), todos los checks aprobados para6d057b1 | CI nuevo pendiente de publicar/revisar el fix                                                                   |

Catálogo30 casos,2 contratos OpenAPI/19 ejemplos aprobados. PostgreSQL18.3 loopback55465 con DBs nuevas dedicadas; los navegadores de base/fix/probe dejaron0 usuarios/0 análisis. Clúster propio apagado después de cada ejecución. No se usaron cuentas/volúmenes de demo. La compatibilidad PG16 de CI no certifica Compose ni el nuevo fix sin su CI.

## Defecto confirmado y puerta adicional

[M1-A11Y-001](defects/M1-A11Y-001.md): controles13x13 y espacio seguro16px, insuficientes para el objetivo24x24 de la regla target-size. Rama **fix/profile-skill-target-size**, commit **6cba65598572718ce844779d3a6179cd7b19c1aa**. Solo cambia clases/estilo de controles del catálogo y añade test de regresión; no auth, contratos ni comportamiento de selección.

La repetición sin infracciones se hizo **sobre el fix local**, no sobre develop. El defecto no está cerrado en el producto integrado hasta que Omar revise/integre el PR y se repita la muestra sobre ese commit. Los resultados originales fallidos se conservan. No se desactivó la regla ni se redujo el objetivo WCAG.

## Casos completos y responsables

- **UI-01:** evidencia técnica ampliada, pero fallo presente en develop, fix pendiente y revisión humana P5 no ejecutada. Faltan lector, zoom real200%, contraste/estados completos y comprensión. El muestreo automático no certifica WCAG.
- **EVID-06:** HTML/legacy/evidence/error estados comprobados técnicamente; P5 debe revisar anuncios y comprensión, incluida ausencia de evidencia. Sin firma humana.
- **OPS-01:** CLI Compose standalone5.6.1 valida la configuración estática. Docker Engine/servicio Desktop no disponibles; wsl --status informa subsistema no instalado. El usuario instalará Desktop/WSL y confirmará docker info. Stack no ejecutado, no aprobado.

Documentos preparados: [formulario P5](P5-review-form.md), [guía P5](P5-review.md), [runbook OPS-01](OPS-01-runbook.md) y [checklist REL-01](REL-01-checklist.md). El formulario mantiene todos los estados no ejecutados hasta que una persona registre observados y decisión.

## Reproducir el probe ampliado

Usar Node22/pnpm11.22.0, build real y una base nueva de prueba loopback sin usuarios. El runner genera claves efímeras, migra/seed y apaga solo sus hijos; no usar DATABASE_URL de desarrollo. Axe se instala únicamente en un directorio ignorado, sin tocar dependencias del producto:

```powershell
pnpm install --frozen-lockfile
pnpm build
npm install --prefix .local-data/qa-tools --no-audit --no-fund --save-exact axe-core@4.11.0
pnpm exec playwright install chromium
$env:QA_AXE_CORE_SOURCE=(Resolve-Path '.local-data/qa-tools/node_modules/axe-core/axe.min.js').Path
$env:E2E_DATABASE_URL='postgresql://TEST_USER@127.0.0.1:5432/devpath_e2e_readiness_new'
$env:QA_PRODUCT_COMMIT=(git rev-parse HEAD)
pnpm exec tsc -p docs/acceptance/probes/tsconfig.readiness.json
pnpm test:e2e --config docs/acceptance/probes/readiness.config.ts
```

Preparar la base nueva con PostgreSQL local autorizado antes del comando. El probe es diagnóstico separado, sin skip por falta de axe ni falsas aprobaciones; si falta la herramienta falla explícitamente. No altera el CI estándar ni depende de llamadas de red del navegador. El JSON no guarda HTML/valores/cookies/tokens. Las trazas de fallo siguen el filtro de privacidad de QAA-01. La medición320CSSpx no es zoom real del navegador200%.

Para repetir sobre el fix antes de integrar la documentación, copiar temporalmente solo los3 archivos readiness.config.ts/readiness.browser.spec.ts/tsconfig.readiness.json a ese worktree limpio, usar QA_PRODUCT_COMMIT del fix y conservar su resultado bajo nombre distinto. No copiar cambios del producto a esta rama documental. No sobrescribir evidencias de otra ejecución.

## Release

**REL-01 no habilitada.** Falta integrar/revalidar fix, completar P5 UI-01/EVID-06, ejecutar OPS-01, revisión P1/P2 del ensayo/instalación y decisión de Omar. Se reutilizaron borradores en docs/release; las versiones actuales0.0.0 no se cambiaron. No se creó rama release, PR release, tag o publicación. CTR-02 sigue bloqueada hasta release/tag/sincronización.
