# OPS-01 — reproducción oficial aislada

Estado: **stack no ejecutado**. Docker Engine/WSL ausentes al verificar; el usuario instalará Docker Desktop/WSL y avisará cuando `docker info` funcione. No se atendió UAC ni se cambiaron características/servicios del sistema desde esta sesión. La autorización previa de instalación no se vuelve a solicitar; falta habilitación efectiva del entorno.

La CLI standalone Compose5.6.1 sí permite validar configuración estática. Su `config --quiet` aprobado no prueba imágenes, montajes, red, cookies, health o persistencia. No marcar OPS-01 por ese resultado.

## Preparación de P1/P2

Confirmar `docker info`, `docker compose version`, Node22 y pnpm11.22.0. Usar contenedores Linux; si Docker solicita instalación WSL/virtualización/UAC/reinicio, la persona autorizada lo realiza. No cambiar seguridad del sistema o usar una base de demo para evitar el bloqueo.

En PowerShell, desde el repositorio, crear checkout y proyecto nuevos. No reutilizar un volumen con nombre de demo:

```powershell
$repo='C:\Users\auror\OneDrive\Escritorio\ramses\Dev_Path'
$opsProject='devpath-m1-ops-'+[Guid]::NewGuid().ToString('N').Substring(0,8)
$opsPath=Join-Path $repo ".worktrees\$opsProject"
git -C $repo fetch origin
git -C $repo worktree add --detach $opsPath origin/develop
Set-Location $opsPath
git rev-parse HEAD
node --version
pnpm --version
docker info
docker compose version
node scripts/setup-local.mjs
docker compose -p $opsProject --env-file infra/.env -f infra/compose.yaml config --quiet
docker compose -p $opsProject --env-file infra/.env -f infra/compose.yaml up -d db
docker compose -p $opsProject --env-file infra/.env -f infra/compose.yaml run --rm migrate
docker compose -p $opsProject --env-file infra/.env -f infra/compose.yaml run --rm seed
docker compose -p $opsProject --env-file infra/.env -f infra/compose.yaml up --build -d --wait
docker compose -p $opsProject --env-file infra/.env -f infra/compose.yaml ps
```

Comprobar que8080 está libre antes de arrancar. Abrir **http://localhost:8080**, coincidente con el Origin configurado; no sustituir arbitrariamente por otro host. El nombre `-p` aísla el volumen `database`, redes y contenedores del proyecto oficial. La configuración oficial no publica DB ni engine al host. Si cualquier comando falla, detener la secuencia y registrar el fallo; no continuar como si estuviera aprobado.

No imprimir `infra/.env`, PEM, `docker inspect ...Config.Env`, JSON de auth o configuración Compose completa en logs del PR. `.dockerignore` excluye .env, claves, .local-data y dependencias del contexto de build. Verificar que esos archivos están ignorados por Git; conservarlos solo en la copia de prueba.

## Recorrido y registro de evidencias

| Caso                  | Ejecutar                                                                                                      | Esperado                                                                                                                          | Observado/evidencia | Estado       |
| --------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------ |
| OPS-A Inicio          | Construir y arrancar desde la copia limpia; revisar ps/health.                                                | Web/proxy, API, engine y PostgreSQL16 sanos; migraciones/seed reales.                                                             | __________          | No ejecutado |
| OPS-B Proxy           | Abrir /login directamente y recargar; solicitar /health/ready y /internal/v1/analyze.                         | SPA/API funcionan; internal404. Health no sustituye matching.                                                                     | __________          | No ejecutado |
| OPS-C Fronteras       | Revisar puertos y redes sin volcar env.                                                                       | Solo web8080 en loopback; DB/engine internos.                                                                                     | __________          | No ejecutado |
| OPS-D Auth/perfil     | Crear cuenta sintética, login/logout, editar perfil/skills.                                                   | Persistencia real; cookie HttpOnly/SameSite/path apropiados al HTTP local y origen/cliente válidos. No guardar valores de cookie. | __________          | No ejecutado |
| OPS-E Análisis        | JS+React contra JS+React+Git; historial/detalle.                                                              | 67%, evidence y snapshot guardados por API→engine→PG.                                                                             | __________          | No ejecutado |
| OPS-F Reinicio        | Guardar IDs propios; restart del proyecto sin borrar volumen; login y abrir perfil/detalle.                   | Mismos datos/score/evidence/skills tras reiniciar.                                                                                | __________          | No ejecutado |
| OPS-G Fallo engine    | Detener solo engine de este proyecto; intentar nuevo análisis y consultar perfil/histórico; arrancar y retry. | 503, texto/key conservados, perfil/histórico disponibles, retry sin duplicar.                                                     | __________          | No ejecutado |
| OPS-H Secrets/cleanup | Revisar diff/archivos ignorados; detener solo este proyecto al terminar.                                      | Sin secretos en Git/evidencia; ningún volumen/base existente borrado.                                                             | __________          | No ejecutado |

Comandos del propio proyecto para reinicio/fallo:

```powershell
docker compose -p $opsProject --env-file infra/.env -f infra/compose.yaml restart
docker compose -p $opsProject --env-file infra/.env -f infra/compose.yaml stop engine
# Ejecutar caso de error antes de restaurar:
docker compose -p $opsProject --env-file infra/.env -f infra/compose.yaml up -d --wait engine
# Al terminar las pruebas, conservar volumen/evidencia:
docker compose -p $opsProject --env-file infra/.env -f infra/compose.yaml stop
```

No usar down -v, prune ni eliminación de bases/volúmenes. No reutilizar nombres ajenos. Registrar SHA, nombre del proyecto aislado, SO/Docker/Compose, PostgreSQL16 efectivo, timestamps, esperado/observado y códigos de salida. Si se omite un caso, queda no ejecutado con causa.

`pnpm test:e2e` del repo arranca su propio stack nativo; pasarlo no demuestra que Compose funcione. OPS-01 exige el recorrido anterior contra8080. P1/P2 revisan datos y red, P5 revisa comprensión y Omar decide la aceptación. Ninguna casilla está aprobada por preparar este runbook.
