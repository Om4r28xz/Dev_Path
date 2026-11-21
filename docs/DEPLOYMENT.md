# Procedimiento de Despliegue — DevPath

Este documento define el procedimiento estándar de despliegue local/demo de DevPath mediante Docker Compose (`infra/compose.yaml`), organizado en cinco fases: **preparación**, **despliegue**, **verificación**, **recuperación** y **registro**.

## Arquitectura del despliegue Compose

El archivo `infra/compose.yaml` orquesta los siguientes servicios y recursos:

| Componente | Rol | Exposición / Red |
| --- | --- | --- |
| `db` (`postgres:16-alpine`) | Base de datos PostgreSQL | Solo red `internal` (puerto `5432`) |
| `migrate` (perfil `tools`) | Ejecuta migraciones (`@devpath/db migrate`) | Solo red `internal` |
| `seed` (perfil `tools`) | Carga datos iniciales (`@devpath/db seed`) | Solo red `internal` |
| `cv-storage-init` | Ajusta propietario (`LOCAL_UID:LOCAL_GID`) del volumen `cv_files` | Solo red `internal` |
| `engine` (`@devpath/skill-engine`) | Motor de análisis de habilidades | Solo red `internal` (puerto `3001`) |
| `api` (`@devpath/api`) | API REST (ejecutada con usuario no-root `LOCAL_UID:LOCAL_GID`) | Solo red `internal` (puerto `3000`) |
| `web` (`nginx:1.28-alpine`) | Proxy inverso y SPA estática | Publica únicamente `127.0.0.1:8080:8080` (`edge` + `internal`) |

Reglas de aislamiento de `infra/proxy/default.conf`:
- `/api/v1/` y `/health/` se envían a `http://api:3000`.
- `/internal/` devuelve `404` para no exponer rutas internas del `engine`.
- `/` aplica fallback SPA hacia `/index.html`.
- Los volúmenes `database` y `cv_files` persisten datos y PDFs privados; las claves privadas (`.local-data/keys`) se montan en solo lectura únicamente en `api`.

---

## Fase 1: Preparación

1. **Verificar requisitos previos** en el host:
   - Docker Engine y Docker Compose v2+.
   - Node.js (`>=22.16.0 <23`, fijado en `.node-version`).
   - Puerto `127.0.0.1:8080` disponible en el host.

   ```bash
   docker --version
   docker compose version
   node --version
   ```

2. **Generar configuración local y claves** desde la raíz del repositorio (no sobrescribe archivos existentes):

   ```bash
   node scripts/setup-local.mjs
   ```

   Esto crea:
   - `infra/.env` con credenciales generadas localmente (`POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD`, `ENGINE_SERVICE_SECRET`, `LOCAL_UID`, `LOCAL_GID`).
   - `.local-data/keys/access-private.pem` y clave pública asociada (ignoradas por Git).

3. **Validar la definición de Compose** antes de construir:

   ```bash
   docker compose --env-file infra/.env -f infra/compose.yaml config --quiet
   ```

   Si el comando termina con código `0`, la configuración y las variables requeridas son válidas.

---

## Fase 2: Despliegue

Ejecutar todos los comandos desde la raíz del repositorio:

1. **Construir las imágenes** (`runtime.Dockerfile` y `web.Dockerfile`):

   ```bash
   docker compose --env-file infra/.env -f infra/compose.yaml build
   ```

2. **Iniciar la base de datos** y esperar su estado `healthy`:

   ```bash
   docker compose --env-file infra/.env -f infra/compose.yaml up -d db
   ```

3. **Ejecutar migraciones y seed** antes de levantar la API:

   ```bash
   docker compose --env-file infra/.env -f infra/compose.yaml run --rm migrate
   docker compose --env-file infra/.env -f infra/compose.yaml run --rm seed
   ```

4. **Iniciar los servicios de aplicación y proxy**:

   ```bash
   docker compose --env-file infra/.env -f infra/compose.yaml up -d api engine web
   ```

5. **Comprobar estado de los contenedores**:

   ```bash
   docker compose --env-file infra/.env -f infra/compose.yaml ps
   ```

---

## Fase 3: Verificación

Confirmar que todos los servicios estén saludables y respondiendo a través del proxy en `http://127.0.0.1:8080`:

1. **Salud de contenedores**: `db`, `engine` y `api` deben figurar como `healthy`, y `web` como `Up` en `127.0.0.1:8080->8080/tcp`.
2. **Readiness de la API**:

   ```bash
   curl -fsS http://127.0.0.1:8080/health/ready
   # Esperado: {"service":"api","status":"ready"}
   ```

3. **Liveness de la API**:

   ```bash
   curl -fsS http://127.0.0.1:8080/health/live
   # Esperado: {"service":"api","status":"ok"}
   ```

4. **Fallback SPA del frontend**:

   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/login
   # Esperado: 200
   ```

5. **Bloqueo de rutas internas**:

   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/internal/
   # Esperado: 404
   ```

---

## Fase 4: Recuperación

### Operación segura sin pérdida de datos

- **Detener y reanudar** conservando contenedores, redes y volúmenes:

  ```bash
  docker compose --env-file infra/.env -f infra/compose.yaml stop
  docker compose --env-file infra/.env -f infra/compose.yaml start
  ```

- **Reiniciar servicios** ante cambios de estado transitorios:

  ```bash
  docker compose --env-file infra/.env -f infra/compose.yaml restart
  ```

- **Bajar el stack conservando datos** (NO usar `-v` / `--volumes` en operación rutinaria):

  ```bash
  docker compose --env-file infra/.env -f infra/compose.yaml down
  ```

  Los volúmenes `devpath-local_database` y `devpath-local_cv_files` permanecen intactos para el siguiente arranque.

### Resolución de incidencias comunes

| Síntoma | Causa probable | Acción de recuperación |
| --- | --- | --- |
| `Run setup-local` al ejecutar Compose | Falta `infra/.env` o variables requeridas | Ejecutar `node scripts/setup-local.mjs` y volver a validar con `config --quiet`. |
| `api` falla al arrancar o `/health/ready` falla | No se ejecutaron migraciones o `db` no está lista | Verificar `ps`, inspeccionar `docker compose ... logs api db`, ejecutar `run --rm migrate` y reiniciar `api`. |
| `all predefined address pools have been fully subnetted` | El daemon Docker agotó los rangos de subred por defecto debido a otras redes activas en el host | Usar un override temporal por `stdin` asignando subredes libres a `internal` y `edge` (ver ejemplo abajo) sin modificar `infra/compose.yaml`. |
| Puerto `8080` ocupado en el host | Otro proceso escucha en `127.0.0.1:8080` | Identificar el proceso (`ss -tlnp` o equivalente) y detener el servicio conflictivo antes de `up -d web`. |
| Error de permisos en `/run/devpath-cv` o `/run/keys` | Desajuste de `LOCAL_UID`/`LOCAL_GID` o clave ausente | Confirmar que `cv-storage-init` terminó con éxito y regenerar configuración faltante con `node scripts/setup-local.mjs`. |

Ejemplo de override temporal de subredes sin alterar archivos del repositorio:

```bash
cat <<'EOF' | docker compose --env-file infra/.env -f infra/compose.yaml -f - up -d
networks:
  internal:
    ipam:
      config:
        - subnet: 10.201.1.0/24
  edge:
    ipam:
      config:
        - subnet: 10.201.2.0/24
EOF
```

---

## Fase 5: Registro

Cada ejecución de despliegue debe dejar constancia con fecha, entorno, versión/rama, resultado de cada fase e incidencias observadas.

### Plantilla de registro

```markdown
- **Fecha:** YYYY-MM-DD HH:MM
- **Responsable:** <nombre>
- **Rama / Commit:** <rama> (<hash>)
- **Entorno:** <SO / Docker / Docker Compose>
- **Preparación:** <OK / Observaciones>
- **Despliegue:** <OK / Observaciones>
- **Verificación:** <OK / Evidencias de health y HTTP>
- **Recuperación:** <OK / Prueba realizada>
- **Incidencias y resolución:** <Detalle o "Ninguna">
```

### Registro de validación ejecutada

- **Fecha:** 2026-11-20 20:17 -06:00
- **Responsable:** Zaid
- **Rama:** `docs/deployment`
- **Entorno:** Linux, Docker `29.9.3`, Docker Compose `v5.7.0`
- **Preparación:** OK — `node scripts/setup-local.mjs` generó `infra/.env` y `.local-data/keys`; `docker compose --env-file infra/.env -f infra/compose.yaml config --quiet` finalizó con código `0`.
- **Despliegue:** OK — Se construyeron las 4 imágenes (`devpath-local-engine`, `devpath-local-api`, `devpath-local-web`, `devpath-local-cv-storage-init`), `db` levantó en estado `healthy`, `migrate` reportó `Migrations applied successfully.`, `seed` finalizó con código `0`, y `api`, `engine` y `web` arrancaron correctamente (`api`, `db`, `engine` en `healthy`).
- **Verificación:** OK —
  - `GET http://127.0.0.1:8080/health/ready` → `{"service":"api","status":"ready"}`
  - `GET http://127.0.0.1:8080/health/live` → `{"service":"api","status":"ok"}`
  - `GET http://127.0.0.1:8080/login` → HTTP `200`
  - `GET http://127.0.0.1:8080/internal/` → HTTP `404`
- **Recuperación:** OK — Se ejecutó `stop` seguido de `start`; los servicios volvieron a estado `healthy` y `/health/ready` respondió `{"service":"api","status":"ready"}`. Posteriormente se ejecutó `down` (sin `-v`), verificando con `docker volume ls` la conservación de `devpath-local_database` y `devpath-local_cv_files`.
- **Incidencias y resolución:** El daemon Docker del host reportó `all predefined address pools have been fully subnetted` al crear `devpath-local_internal` debido a redes preexistentes en el entorno. Se resolvió mediante override temporal por `stdin` (`10.201.1.0/24` para `internal` y `10.201.2.0/24` para `edge`) sin modificar `infra/compose.yaml`, y el caso quedó documentado en la Fase 4.
