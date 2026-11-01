# Handoff lote 03 — Emanuel

Fecha: 31 de octubre de 2026. Rama exclusiva: `feature/lote-03-emanuel`. Worktree: `C:\Users\auror\OneDrive\Escritorio\ramses\Dev_Path\.worktrees\emanuel`.

## Base e integración

`git fetch origin` confirmó `origin/develop` en 2205b3f, merge del PR #8 de Betsy (7f481f9). CAT-02 está integrada. Lote 02: merge 254ec8f; CTR-01/CAT-01: 387074a, ancestros verificados de develop. Se creó develop local, `git pull --ff-only origin develop` indicó actualizado, y desde esa base se creó la rama personal en un worktree limpio.

La carpeta original permanece en `data/cat-02-matching-corpus` con sus cinco archivos locales originales sin commit; no se eliminaron, copiaron ni mezclaron. El diff de esta rama en packages/catalog está vacío. Emanuel autorizó agrupar las cuatro tareas en una rama con commits separados. OPS-01 y DOC-01 se revisan conjuntamente dentro de este PR; no se afirma que OPS-01 ya esté integrada por ser dependencia de DOC-01.

## Estado real

| Tarea   | Estado                                                                           | Evidencia / pendiente                                                                                                                           |
| ------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| CAT-02  | Integrada por Betsy                                                              | PR #8, merge 2205b3f. Sin cambios en catálogo/corpus.                                                                                           |
| QA-01   | Implementada localmente; sin publicar ni integrar                                | 22 casos en docs/acceptance/M1-cases.md; todos sin observados manuales. Pendiente revisión P1/P2/P5.                                            |
| OPS-01  | Implementada localmente; validación de ejecución incompleta                      | Compose config válido; generador idempotente y secretos ignorados. Sin Docker daemon/WSL; faltan build/arranque/SPA/proxy/persistencia Compose. |
| DOC-01  | Implementada localmente; pendiente reproducción humana                           | README y SETUP_LOCAL.md con PowerShell, desarrollo/demo, variables, persistencia y diagnóstico. P4/P5 deben reproducir Compose y guía completa. |
| AUTH-01 | Implementada localmente y validada con PostgreSQL real; sin publicar ni integrar | 7 tests nuevos de integración y 2 de comandos, más regresión existente. Pendiente revisión P2 de DTO/Set-Cookie y CI PostgreSQL16.              |

No hay PR ni push exitoso; no hay merges/releases/tags realizados. El lote no está completamente integrado.

## Implementación y contratos

Contratos públicos/internos OpenAPI 1.0.0 sin modificaciones; catálogo 1.0.0. Register/login consumen DTOs, longitudes, códigos INVALID_CREDENTIALS/EMAIL_ALREADY_REGISTERED y protección Origin/JSON/X-DevPath-Client existentes.

Auth: validación estricta, email trim/minúsculas preservando puntos/+; password sin trim; Argon2id sal individual, m=19456 KiB/t=2/p=1/hash32; JWT RS256/typ at+jwt/iss urn:devpath:auth/aud devpath-api/900 s; refresh 32 bytes aleatorios, solo SHA256 en DB, expiración siete días. Registro user+profile+family+refresh transaccional; login crea sesión transaccional. Cookie host-only HttpOnly/SameSite=Lax/Path=/api/v1/auth; Secure y prefijo __Secure por defecto; modo HTTP explícito restringido a orígenes loopback. No se implementaron rotación/logout/validación bearer ni UI conectada de tareas posteriores. No hay migraciones nuevas.

Infra: infra/compose.yaml canónico, DB/API/engine en red interna, proxy/web loopback8080, fallbacks SPA, migración/seed explícitos, volumen persistente, claves locales generadas sin sobrescritura. API readiness consulta tabla auth.users; health no certifica matching.

## Validación ejecutada

Entorno: Windows PowerShell, Node22.23.4 mediante fnm portable, pnpm11.22.0. Node24 existente conservado; sin cambios a otros proyectos. Activador específico de máquina fuera de Git: `C:\Users\auror\Documents\Codex\2026-10-31\holi\work\activate-devpath.ps1`. pnpm en sandbox usó store local y node-linker hoisted por EPERM en symlinks; instalación frozen exitosa antes y después de agregar dependencias AUTH-01. Argon2 autorizado explícitamente en allowBuilds; lockfile actualizado con cambios acotados.

| Comando/caso                                                                                                                   | Resultado real                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pnpm install --frozen-lockfile --store-dir .pnpm-store --config.enable-global-virtual-store=false --config.node-linker=hoisted | OK, lockfile sincronizado                                                                                                                                                                                                                    |
| pnpm --filter @devpath/db migrate                                                                                              | OK en PostgreSQL18.3 aislado en 127.0.0.1:55439                                                                                                                                                                                              |
| pnpm --filter @devpath/db seed                                                                                                 | OK, diez tecnologías                                                                                                                                                                                                                         |
| pnpm test con TEST_DATABASE_URL aislada                                                                                        | API22 tests y engine13 tests pasan; catálogo30 casos; contratos2 OpenAPI/17 ejemplos válidos. Web no tiene tests; salida 0 no equivale a E2E.                                                                                                |
| Auth integración                                                                                                               | Registro201/login200, normalización, hash/sal, JWT firmado/claims, cookie local/segura, hash de refresh, duplicados concurrentes201/409, rollback ante fallo perfil y fallo sesión, credenciales falsas401, validación400, CSRF403, media415 |
| API compilada real, DB detener/reiniciar                                                                                       | Registro201; DB detenida produce503 saneado; DB reiniciada permite login200; persistencia verificada; datos sintéticos limpiados                                                                                                             |
| pnpm lint / typecheck / build / format:check                                                                                   | Todos OK                                                                                                                                                                                                                                     |
| Compose v5.6.1 standalone: --env-file infra/.env -f infra/compose.yaml config --quiet                                          | OK; no requiere daemon; no demuestra arranque                                                                                                                                                                                                |
| setup-local dos veces; git check-ignore                                                                                        | Preserva archivos existentes; infra/.env y claves ignorados                                                                                                                                                                                  |
| Medición Argon2id cinco hashes                                                                                                 | 29,31,31,29,30 ms en esta máquina; no es benchmark de producción                                                                                                                                                                             |
| git diff --check; inventario de archivos                                                                                       | OK; no .env/PEM/KEY/dependencias/artefactos incluidos                                                                                                                                                                                        |

CI: se agregó migración de la DB de servicio antes de tests para que integración auth sea ejecutable en PostgreSQL16. YAML parseado/formato válido; GitHub Actions no ejecutado desde aquí.

## Bloqueos del entorno

Docker: winget no pudo iniciarse (acceso al alias denegado). Se descargó instalador oficial con firma válida Docker Inc; instalación por usuario terminó en -5. `wsl --status` indica WSL ausente; intento autorizado de instalación elevada fue denegado por el entorno. No se reinició Windows ni se alteraron volúmenes. El binario standalone de Compose permitió validar config, pero no construir/ejecutar contenedores. Se requiere completar Docker/WSL desde Windows fuera de este entorno y luego reproducir SETUP_LOCAL.

GitHub: identidad de commit es la configuración Git existente, sin suplantar a nadie. `git credential-manager github list` devuelve acceso denegado; `git push -u origin feature/lote-03-emanuel` falló porque el helper no pudo acceder al gestor de credenciales (NtCreateDirectoryObject/access denied; unable to get password). No se publicaron cambios ni se abrió PR. No hay token guardado en archivos.

## Commits y siguiente paso

- 88c37eb QA-01: matriz M1.
- c132fae OPS-01: Compose/proxy/generador/Node fijado.
- a838bbd DOC-01: instalación PowerShell.
- ca021d6 AUTH-01: implementación, pruebas, dependencias y migración CI.
- c3fcddb: formato de infraestructura.
- 7f8a6bd: conserva arquitectura/colaboración en README.
- Este handoff se confirma en commit separado.

Desde PowerShell normal autenticado de Emanuel, ubicado en el worktree:

```powershell
git status --short --branch
git log --oneline origin/develop..HEAD
git push -u origin feature/lote-03-emanuel
```

Crear PR hacia develop: https://github.com/Om4r28xz/Dev_Path/compare/develop...feature/lote-03-emanuel?expand=1 (solo después del push). Texto preparado fuera del repo en outputs de la sesión. Omar debe revisar transacciones/duplicados, DTO/cookies, claves/secretos, allowBuilds/lockfile, ejecutar CI PostgreSQL16, reproducir Compose y pedir revisión P2/P5. No aprobar matriz manual por los tests unitarios. Omar integra tras revisión; no continuar con AUTH-02 ni otro lote por este handoff.
