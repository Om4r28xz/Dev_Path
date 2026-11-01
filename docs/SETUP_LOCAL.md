# Instalación local de DevPath

## Requisitos y entorno

Windows PowerShell, Git, Node 22.23.4 (rango >=22.16 <23), pnpm 11.22.0. Para demo: Docker Desktop con motor Linux/Compose y virtualización/WSL disponibles. No reemplazar Node 24 de otros proyectos.

Con fnm instalado según https://github.com/Schniz/fnm:

```powershell
fnm env --shell powershell | Out-String | Invoke-Expression
fnm install 22.23.4
fnm use 22.23.4
npm install --global pnpm@11.22.0
node --version
pnpm --version
pnpm install --frozen-lockfile
```

`.node-version` fija la versión del repo. La activación afecta esta terminal; otras terminales conservan su Node. En esta computadora se preparó fnm portable y un activador local en `C:\Users\auror\Documents\Codex\2026-10-31\holi\work\activate-devpath.ps1`. Para usarlo en el worktree actual:

```powershell
. 'C:\Users\auror\Documents\Codex\2026-10-31\holi\work\activate-devpath.ps1'
```

Ese archivo es específico de esta computadora, está fuera de Git y no es requisito del proyecto. El sandbox bloqueó symlinks; se instaló sin alterar lockfile usando:

```powershell
pnpm install --frozen-lockfile --store-dir .pnpm-store --config.enable-global-virtual-store=false --config.node-linker=hoisted
```

El activador aplica además `pnpm_config_verify_deps_before_run=false` para evitar reinstalación automática que reintente enlaces prohibidos. Fuera del sandbox usar la instalación normal.

## Demo Compose (mismo origen :8080)

Desde la raíz, generar configuración local y claves sin sobrescribir existentes:

```powershell
node scripts/setup-local.mjs
docker compose --env-file infra/.env -f infra/compose.yaml config --quiet
docker compose --env-file infra/.env -f infra/compose.yaml build
docker compose --env-file infra/.env -f infra/compose.yaml up -d db
docker compose --env-file infra/.env -f infra/compose.yaml run --rm migrate
docker compose --env-file infra/.env -f infra/compose.yaml run --rm seed
docker compose --env-file infra/.env -f infra/compose.yaml up -d api engine web
docker compose --env-file infra/.env -f infra/compose.yaml ps
```

No iniciar API útil antes de migrar. Abrir http://localhost:8080/login; recargar la URL comprueba fallback SPA. La web todavía contiene pantallas base sin conexión auth: AUTH-01 entrega endpoints; AUTH-03/04 posteriores conectan la interfaz. Engine matching conserva defectos conocidos CAT-02; health solo certifica disponibilidad, no exactitud del negocio.

Solo se publica 127.0.0.1:8080; DB5432, API3000 y engine3001 quedan internos. Proxy solo envía `/api/v1/` y `/health/` a API, nunca `/internal/` al engine. API accede a DB y tiene URL/credencial para el engine, cuya integración de análisis llega después. El volumen `database` conserva datos. Claves privadas solo montadas en API; engine no recibe datos personales ni DB.

Detener, iniciar y reiniciar SIN borrar datos:

```powershell
docker compose --env-file infra/.env -f infra/compose.yaml stop
docker compose --env-file infra/.env -f infra/compose.yaml start
docker compose --env-file infra/.env -f infra/compose.yaml restart
```

`down` sin `--volumes` conserva el volumen. No usar `down -v` ni borrar volúmenes como reparación rutinaria. Verificar persistencia creando cuenta sintética por HTTP, reiniciando y comprobando login.

## Desarrollo Vite :5173

PostgreSQL local o de prueba propio, con base creada exclusivamente para DevPath. No apuntar pruebas a datos de demo. Tras generar claves, configurar en cada terminal API/migraciones (valores de conexión propios; no guardarlos en Git):

```powershell
$env:DATABASE_URL = Read-Host 'URL PostgreSQL local'
$env:AUTH_PRIVATE_KEY_FILE = (Resolve-Path '.local-data/keys/access-private.pem').Path
$env:AUTH_LOCAL_HTTP = 'true'
$env:CORS_ALLOWED_ORIGINS = 'http://localhost:5173'
pnpm --filter @devpath/db migrate
pnpm --filter @devpath/db seed
pnpm dev:api
```

Otra terminal: `pnpm dev:web`. Otra terminal: establecer `$env:ENGINE_SERVICE_SECRET` con secreto local y ejecutar `pnpm dev:engine`. Vite sirve 5173 y proxy `/api` a 3000; engine sirve 3001. No se carga `.env` automáticamente en estos procesos: configurar variables de terminal explícitamente. Compose consume `infra/.env` únicamente mediante `--env-file`.

## Variables

| Variable                  | Uso                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| DATABASE_URL              | Solo API/migrate/seed; conexión privada PostgreSQL                                                             |
| AUTH_PRIVATE_KEY_FILE     | API, clave PKCS8 RSA >=2048 bits; generador usa 3072                                                           |
| AUTH_LOCAL_HTTP           | `true` habilita cookie devpath_refresh sin Secure solo en orígenes loopback HTTP explícitos; por defecto HTTPS |
| CORS_ALLOWED_ORIGINS      | Lista exacta separada por comas; 5173 dev/8080 demo                                                            |
| ENGINE_SERVICE_SECRET     | Credencial interna distinta de JWT de usuarios                                                                 |
| ENGINE_URL                | URL interna reservada para integración de análisis posterior                                                   |
| HOST / PORT               | Loopback por defecto; Compose usa 0.0.0.0 dentro del contenedor                                                |
| POSTGRES_USER/DB/PASSWORD | Compose; generados localmente, no copiar secretos a logs                                                       |
| TEST_DATABASE_URL         | DB aislada para integración auth; si falta, los tests se omiten y no cuentan como aprobados                    |

Auth: POST `/api/v1/auth/register` y `/login`, `Content-Type: application/json`, `Origin` permitido y `X-DevPath-Client: web`. Registro: name/email/password; login: email/password. Respuestas 201/200 SessionResponse. No imprimir respuestas completas con tokens en reportes. HTTP local es exclusivamente demostración loopback; HTTPS usa cookie `__Secure-devpath_refresh`. Refresh/logout no están implementados en AUTH-01.

## Verificación y problemas

```powershell
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
git diff --check
git status --short
```

Para integración real establecer TEST_DATABASE_URL en DB migrada de prueba antes de `pnpm --filter @devpath/api test`. Casos manuales/evidencia: docs/acceptance/M1-cases.md. P5 debe registrar ejecución independiente; no se presume aprobada.

- Node incompatible: activar fnm en la terminal y verificar `Get-Command node`; no cambiar engines.
- pnpm no encontrado: instalar versión fijada con Node 22 activo.
- EPERM en enlaces: usar opción hoisted de arriba solo para este entorno.
- Docker no encontrado/daemon detenido: instalar/iniciar Docker Desktop Linux; verificar `docker version`; no declarar stack probado hasta tener daemon disponible.
- Puerto ocupado: `Get-NetTCPConnection -LocalPort 8080,5173,3000,3001`; identificar proceso antes de detenerlo; no matar servicios ajenos.
- DB no disponible: revisar conexión, pg_isready/health y migraciones; conservar volúmenes.
- Config ausente: ejecutar setup-local; no sobrescribe claves ni `.env`. `.env`, `.local-data`, PEM y KEY están ignorados. En Windows proteger además permisos NTFS de la carpeta local: mode POSIX no sustituye ACL.
- 403 auth: comprobar origen exacto, header de cliente y modo local; no relajar CORS con `*`.
- 404 refresh/perfil/análisis: endpoints de tareas posteriores; no confundir shell web con M1 completo.

La evidencia y limitaciones reales de esta entrega se mantienen en docs/handoffs/lote-03.md.
