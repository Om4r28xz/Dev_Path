# Candidato M2 — v0.2.0

Base: `origin/develop` en `c596a55`. Rama: `release/0.2.0`. QA-03 está integrada por PR #53; PRJ-01/02 y CV-01/02 por PR #48–#51. Por el PR #52, `main` ya contiene el árbol M2 y QA-03; la release añade versiones, changelog y evidencia sin duplicar commits ni reescribir historia.

## Puertas técnicas

- [x] Ocho manifiestos privados en 0.2.0; versiones de OpenAPI, catálogo y snapshots permanecen independientes.
- [x] Changelog delimita M2 y excluye JSearch.
- [x] Instalación congelada en worktree nuevo con Node 22.23.4 y pnpm 11.22.0.
- [x] Migración real 0000–0003 → 0004–0005 con datos M1 sintéticos conservados y rerun idempotente mediante `m2-release-upgrade.mjs`.
- [x] Lint, formato, 5 OpenAPI/54 ejemplos, typecheck, build y suites API129/web106/engine51/privacidad2.
- [x] E2E M1/M2: 11/11 con servicios reales y PostgreSQL 18.3 aislado.
- [ ] Compose PostgreSQL16: proyecto, CV privado y bytes del volumen persisten tras reinicio; M1 y recuperación del engine continúan pasando.
- [x] Auditoría de dependencias de producción: cero vulnerabilidades conocidas.

Resultados locales ejecutados sobre el árbol candidato antes del commit final; repetir CI/Compose sobre el SHA publicado de la rama. El probe Compose ampliado no se ejecutó localmente porque Docker no está instalado. Un check verde anterior solo es antecedente; no se presenta como resultado nuevo.

## Puertas humanas y publicación

- [ ] P5 registra aceptación humana M2 o delegación explícita con alcance y limitaciones.
- [ ] P2 revisa migraciones, volumen `cv_files`, privacidad y diff de release.
- [ ] CI del PR `release/0.2.0 → main` aprobado.
- [ ] Omar hace merge commit hacia main.
- [ ] Tag anotado `v0.2.0` creado sobre el merge exacto y GitHub Release publicada con el changelog real.
- [ ] Smoke del tag y sincronización main → develop mediante PR.

No mover `v0.1.0`, no borrar volúmenes y no iniciar JSR-02 hasta que REL-02 y JSR-01 estén integradas.

## Comandos del candidato

```powershell
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
pnpm test
pnpm test:e2e
```

El probe de upgrade requiere una DB PostgreSQL loopback **nueva y vacía** cuyo nombre contenga `test` o `e2e`:

```powershell
$env:QA_M2_UPGRADE_DATABASE_URL = 'postgresql://devpath_test@127.0.0.1:55465/devpath_test_rel02_<id>'
node docs/acceptance/probes/m2-release-upgrade.mjs
```

Compose se ejecuta en CI con proyecto único. Conserva sus volúmenes y genera `ops-runtime.json`; no usar `down -v`.
