# REL-01 — candidato preparado, todavía no autorizado

## Candidato autorizado para preparación

Emanuel confirmó la aceptación delegada y límites en docs/acceptance/evidence/M1-delegated-acceptance.json. release/0.1.0 creada desde6cfdd2f; versiones0.1.0 y CHANGELOG.md aplicados. Revisión independiente del PR pendiente; ninguna firma ajena inventada. Los bloqueos de aceptación descritos más abajo son históricos, sustituidos por el registro delegado. Validaciones/CI del candidato, merge humano, tag/smoke y sincronización siguen siendo puertas reales.


Base integrada:5061185. No se ha creado release/0.1.0 ni cambiado versiones. Usar [changelog](M1-CHANGELOG-DRAFT.md), [versiones](M1-VERSION-PLAN.md), [publicación](M1-PUBLICATION-PLAN.md) y [rollback](M1-ROLLBACK-PLAN.md); no duplicarlos ni presentar el borrador como changelog publicado.

## Puertas de entrada

| Responsable | Qué debe decidir/documentar                                                                                                                      | Estado                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| P5          | UI-01: teclado/foco, lector, zoom/reflujo, contraste visual y navegación; EVID-06: significado de porcentaje/tecnologías/citas, errores y vacíos | Pendiente; [formulario](../acceptance/P5-review-form.md) |
| P1/P2       | Revisar los dos artefactos y evidencia de Compose; registrar aceptación OPS-01 y limitaciones del runner Linux frente a Windows local            | Pendiente; [expediente](../acceptance/OPS-01-dossier.md) |
| P1/P2       | Muestra de QA-02, instalación/DB/privacidad y rollback; aceptar limitaciones o abrir defecto bloqueante                                          | Pendiente; formulario P5 incluye checklist técnico       |
| Omar/P1     | Confirmar firmas, ausencia de bloqueantes, congelar alcance y autorizar candidato                                                                | Pendiente                                                |

Un merge de PR34 o un check verde no completa estas firmas. Si aparece un defecto, corregir mediante PR y repetir pruebas afectadas antes de autorizar. Actualizar M1-results/casos con persona/fecha/SHA/evidencia únicamente después de revisión real, conservando los registros históricos.

## Preparación segura completada

- QAA/QA/DOC, target-size y permisos de llave integrados; no repetir sus ramas.
- Ejecuciones Compose reales de push/PR aprobadas; migraciones/seed, proxy, persistencia y recuperación contemplados por el driver.
- Plan de versiones de8 manifiestos privados; versiones actuales0.0.0 sin aplicar propuesta0.1.0. Versiones independientes OpenAPI/catálogo/extractor no se sustituyen.
- Borrador de changelog y limitaciones, guía de publicación, reversión y restauración aislada disponibles.
- Comprobaciones de candidato/tag son posteriores y deben ligarse al SHA concreto. No atribuirles resultados previos.

## Solo cuando estén documentadas las puertas

Desde una copia del repositorio, conservar otros worktrees y confirmar rama release inexistente antes de crear una nueva. Si ya existe, inspeccionarla y continuar sin sobrescribir:

```powershell
git fetch origin
git worktree list
git branch --list release/0.1.0
git worktree add -b release/0.1.0 .worktrees/release-0.1.0 origin/develop
Set-Location .worktrees/release-0.1.0
git status
git rev-parse HEAD
node --version
pnpm --version
```

Node22/pnpm11.22.0. Aplicar estrategia de versiones aprobada a los8 manifiestos; convertir el borrador al CHANGELOG.md de release con fecha real y limitaciones aceptadas. Revisar lockfile sin cambios ajenos. No actualizar contratos/versiones de snapshots históricos para coincidir con0.1.0.

## Validación del candidato y copia limpia

1. Instalación `pnpm install --frozen-lockfile`; si la estrategia de versión exige lock actualizado, actualizarlo justificadamente y repetir frozen en otra copia nueva del commit. No usar dependencias/secretos de otro checkout.
2. `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build`, `node --test scripts/setup-local.test.mjs`.
3. Base PostgreSQL16 **nueva y aislada**: migración/seed, TEST_DATABASE_URL al recurso propio y `pnpm test`. Otra DB nueva para E2E_DATABASE_URL y `pnpm test:e2e`. No apuntar tests a datos de demo.
4. Ejecutar driver oficial `node docs/acceptance/probes/ops-compose.mjs` en checkout limpio con Docker, puerto8080 libre y sin infra/.env previa. Guardar JSON privado saneado según runbook. No quitar guardias para usar copia sucia.
5. Repetir upgrade con datos y, según revisión P1, backup/restauración en otra DB nueva; consultar probes existentes. No sobrescribir métricas históricas al guardar resultados nuevos.
6. Smoke explícito: registro/login/refresh/logout; perfil y skills; JS+React frente JS+React+Git=67%;0% y null diferenciados; evidence/legacy/HTML inerte; historial/detalle/recarga; aislamiento segunda cuenta/404; reintento tras caída real de engine; reinicio conserva datos. Registrar esperado/observado/SHA/entorno.
7. Revisar diff y ausencia de secretos/env/llaves/dumps/credenciales en archivos y artefactos; registrar defects abiertos y decisiones humanas. Ningún trace con tokens públicos.
8. Guardar evidencia del SHA candidato; repetir checks afectados tras correcciones. PR release→main, sin merge automático. Aprobar publicación solo con los resultados efectivos del candidato.

## Publicación y sincronización por Omar/P1

Omar revisa diferencias exclusivas de main antes del PR; no fusionar main completo a develop por atajo. Release→main mediante **merge commit**, conservando historia; revisión y merge humanos. El integrador etiqueta **el SHA exacto aprobado**, no HEAD sin comprobar; no mover tags publicados. Ver comandos de tag únicamente en la guía oficial FLUJO_GITHUB para ejecución humana autorizada.

Verificar instalación/smoke del tag. Abrir PR **main→develop**, revisar y usar merge commit según procedimiento del equipo. Después fetch y comprobar:

```powershell
git fetch origin --tags
git rev-parse 'v0.1.0^{commit}'
git merge-base --is-ancestor v0.1.0 origin/main
git merge-base --is-ancestor origin/main origin/develop
```

En PowerShell puede ser necesario entrecomillar `v0.1.0^{commit}`. Cada comando de ascendencia debe terminar0; revisar SHA del tag contra el aprobado. Si main avanzó después, revisar explícitamente su contenido antes de sincronizar. No usar force/reset ni cherry-picks masivos.

REL-01 solo completa cuando main representa M1, tag correcto, smoke efectivo y develop incluye la release. **Solo entonces CTR-02**. Este checklist no ejecuta ni autoriza esos pasos y no elimina validaciones pendientes del candidato futuro.
