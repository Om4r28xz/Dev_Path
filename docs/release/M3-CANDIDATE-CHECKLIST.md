# Candidato M3 — v0.3.0 (REL-03)

Base: `develop` tras integrar `JSR-01` (`e1a5b10`), ADR 0005 (`fedbc65`), `JSR-02` (`e179f39`), `JSR-03` (`1216bdd`), `JSR-04` (`fad9d1a`) y `QA-04` (`d5f6064`). Rama: `release/0.3.0`.

## Alcance honesto y estado de entrega E3

- **Repositorio:** `https://github.com/Om4r28xz/Dev_Path`
- **Despliegue público:** no existe (ejecución local por diseño documentada en `docs/SETUP_LOCAL.md`).
- **Modo verificado:** `fixture` (datos sintéticos con estructura normalizada de JSearch) y dobles HTTP para el adaptador `LiveJSearchProvider`.
- **Estado `live` y etiqueta `e3-microservice`:** dado que los permisos de cuenta (hard cap cero costo total) y retención de texto/derivados de `JSR-01` (`docs/provider/JSEARCH.md`) siguen pendientes, **no se realizó llamada saliente real a `https://jsearch.p.rapidapi.com`**. Por tanto:
  1. El alcance de `v0.3.0` se declara explícitamente como **demo de adaptador y flujo M3 en modo `fixture`** y no cierra las issues de integración `live`.
  2. La etiqueta adicional `e3-microservice` **queda pendiente** y solo debe ser publicada por el integrador humano cuando se verifique la llamada externa real autorizada (`JSR-ACC-05` en `docs/acceptance/M3-cases.md`).

## Puertas técnicas

- [x] Ocho manifiestos privados del monorepo actualizados a `0.3.0`; versiones de OpenAPI (`public.yaml` `1.1.0`, `m2.yaml` `0.1.0`, `m3-proposed.yaml` `0.1.0`), catálogo (`1.0.0`) y snapshots permanecen independientes.
- [x] `CHANGELOG.md` delimita M3 (`fixture` vs `live`), documenta permisos y excluye M4.
- [x] Configuración sin `RAPIDAPI_KEY` (`JOBS_PROVIDER_MODE=fixture` por defecto) mantiene M1 y M2 100 % utilizables.
- [x] `apps/api/README.md` y `apps/api/requests/e3-jsearch.http` documentan los 3 endpoints de negocio E3 protegidos con JWT (`GET /api/v1/jobs`, `GET /api/v1/jobs/details`, `POST /api/v1/analyses` con `source.type="jsearch"`).
- [x] Lint, formato, contratos (5 OpenAPI / 54 ejemplos), typecheck, build, suites unitarias/integración (`api` 16 archivos / 152 pruebas, `web` 13 archivos / 110 pruebas, `skill-engine` 51 pruebas) y E2E Playwright (12/12 pruebas incluyendo `tests/e2e/jobs.spec.ts` y regresión M1/M2).

## Puertas humanas y publicación

- [ ] P5 y P1/P2 revisan la matriz E3 en `docs/acceptance/M3-results.md` y deciden si publicar `v0.3.0` con alcance declarado de adaptador `fixture` o esperar la prueba `live` acotada de `JSR-01`.
- [ ] P2 revisa diff de `release/0.3.0 → main`.
- [ ] CI del PR `release/0.3.0 → main` aprobado.
- [ ] Omar realiza el merge commit hacia `main` y publica el tag anotado `v0.3.0`.
- [ ] Solo tras completar y registrar la llamada `live` autorizada (criterio 3 de E3), el integrador humano publica el tag anotado `e3-microservice` sobre el commit evaluable exacto.
- [ ] Sincronización `main → develop` mediante PR con merge commit.
