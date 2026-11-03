# OPS-01 — reproducción oficial aislada

## Estado vigente tras PR34

Base integrada 5061185183a2f4b6201cc8f73f29a2d59f0899cb. QAA-01/QA-02/DOC-02 y fixes target-size/UID de llave integrados. Dos ejecuciones reales Compose sobre44b0301 aprobadas (push41568936504 y PR41568942398); expediente [OPS-01](OPS-01-dossier.md). Ejecución técnica acreditada por jobs/pasos GitHub, contenidos de artefactos pendientes de revisión autenticada P1/P2. No confundir el fallo local por Docker ausente con el resultado remoto aprobado.

OPS-01: pendiente aceptación P1/P2; UI-01/EVID-06: pendientes P5. Matriz histórica27/3 se conserva, no se inventan aprobaciones. REL-01 bloqueada hasta registrar decisiones; versiones siguen0.0.0, sin rama release/tag/release oficial ni CTR-02. Las secciones siguientes conservan historia y quedan subordinadas a este estado.


## PR34 — fallo real y corrección de permisos

El primer artefacto de CI sobre c631a27 confirmó Docker28.0.4/Compose2.38.2, imágenes construidas, PostgreSQL16.15 y engine saludables. La API terminó1 con EACCES al abrir /run/keys/access-private.pem. Setup genera la llave con0600 para el usuario del host; el bind mount :ro conserva los permisos y no concede lectura al usuario node de la imagen cuando su UID difiere. No es un fallo de disponibilidad de Docker ni del health check.

La corrección configura solo la API con LOCAL_UID:LOCAL_GID del usuario no-root que ejecuta setup. Mantiene0600, montaje :ro y USER node como valor por defecto de la imagen; no usa root, chmod777 ni cambia otros servicios. En Windows, sin UID/GID POSIX del proceso, setup usa1000:1000; la traducción de permisos de Docker Desktop debe verificarse en runtime. No admite setup con UID/GID0; verifica dueño/modo de una llave Unix existente y rechaza configuraciones incompatibles sin reemplazarla.

En copias anteriores ejecutar otra vez node scripts/setup-local.mjs con el usuario propietario, sin sudo: añade únicamente los campos de identidad ausentes, sin rotar llaves ni credenciales. Si hay discrepancia de propietario o identidad, detenerse y revisar esa copia; no ampliar permisos ni sobrescribir secretos. Compose exige esos campos antes de arrancar. Esta configuración local presupone Docker Linux con bind mount del host local; un daemon remoto/remapeo de usuarios requiere revisión específica, no permisos más amplios.

Pruebas nuevas: node --test scripts/setup-local.test.mjs verifica setup/rerun, preservación de credenciales antiguas y rechazo de override root. En Unix también comprueba propietario/0600. La validación estática confirma UID/GID configurados, montaje read-only y PostgreSQL16. La corrección **aún requiere ejecución real satisfactoria del workflow** y aceptación P1/P2; no aprueba OPS-01 por sí sola. La evidencia histórica siguiente conserva el estado previo a publicar PR34.

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

## Diagnóstico local y pasos oficiales de Windows — 2026-11-02

En esta sesión: wsl --status salió50, --version y --list --verbose salieron1: subsistema no instalado. Docker CLI no aparece en PATH, Program Files/Docker/Docker ni LOCALAPPDATA/Programs/DockerDesktop. El servicio com.docker.service tampoco aparece; su ausencia por sí sola no diagnostica fallo en una instalación por usuario. CLI standalone Compose5.6.1 config --quiet sí termina0, sin motor ni contenedores.

La consulta Win32_Processor/Win32_ComputerSystem por CIM fue denegada por el entorno de ejecución: no se afirma si BIOS/UEFI o hipervisor están habilitados. El registro devolvió ProductName Windows10HomeSingleLanguage, DisplayVersion26H2/build26300; confirmar edición real con winver, no decidir compatibilidad usando solo ese nombre de registro.

La autorización previa de Docker/WSL permanece registrada y el usuario indicó que hará la instalación. Ningún cambio administrativo/reinicio se ejecuta desde el agente. Una persona autorizada debe abrir PowerShell como administrador, atender UAC y decidir el reinicio guardando antes su trabajo.

Microsoft documenta instalar WSL sin distribución y actualizarlo mediante estos comandos ([instalación](https://learn.microsoft.com/en-us/windows/wsl/install), [opciones oficiales](https://learn.microsoft.com/en-us/windows/wsl/basic-commands)):

```powershell
# Ejecutar manualmente en PowerShell administrador autorizado:
wsl --install --no-distribution
# Si Windows solicita reinicio, acordarlo y hacerlo manualmente antes de seguir.
wsl --update
wsl --set-default-version 2
wsl --status
wsl --version
wsl --list --verbose
```

Docker describe instalación por usuario y backend WSL2, con WSL>=2.1.5 y virtualización de hardware habilitada. Descargar y abrir el instalador oficial, elegir modo por usuario y Linux/WSL2, abrir Desktop y revisar sus términos personalmente. La instalación por usuario no requiere admin, pero habilitar WSL2 por primera vez sí puede requerirlo. Ver [Docker Windows oficial](https://docs.docker.com/desktop/setup/install/windows-install/). No se aceptan términos ni se elude UAC automáticamente.

En PowerShell normal del usuario, comprobar después:

```powershell
docker info
docker compose version
```

Si no aparece docker tras instalar, abrir una terminal nueva o localizar el CLI en LOCALAPPDATA/Programs/DockerDesktop/resources/bin o Program Files/Docker/Docker/resources/bin; no cambiar permisos/grupos a ciegas. Para verificar hardware, usar Administrador de tareas→Rendimiento→CPU→Virtualización, o ejecutar las consultas CIM de diagnóstico desde la consola autorizada. Si dice deshabilitada, P1/P2/Omar deben revisar el cambio de firmware; no se altera BIOS desde este procedimiento.

Cuando docker info responda con servidor Linux, ejecutar el runbook anterior desde el checkout limpio y proyecto único. Si este equipo no puede habilitarse, P1/P2 ejecutan exactamente ese runbook en otro equipo autorizado y registran SHA/entorno/observados; no se presume aprobado por probar solo componentes nativos.

## Ensayo automatizado del stack oficial

Nuevo workflow OPS M1 Compose runtime: ejecuta el driver probes/ops-compose.mjs en Ubuntu con Docker, en un proyecto único y checkout limpio. No modifica el workflow CI existente. Comprueba PostgreSQL16, proxy, registro/login, perfil,67%, evidence, migraciones repetidas con datos, reinicio persistente y caída/recuperación real del engine con la misma clave. Conserva el volumen propio, nunca usa down -v. Solo sube JSON saneado; no env, llaves, tokens ni dumps.

Para P1/P2 en otra copia limpia: Node22/pnpm11.22, instalación congelada, Playwright Chromium y Docker operativo; ejecutar node docs/acceptance/probes/ops-compose.mjs desde la raíz. Puerto8080 libre, sin infra/.env existente; genera configuración solo para esa copia. Revisar status=passed, todos los checks y cleanup antes de registrar la decisión. El volumen sintético queda retenido; no eliminar volúmenes ajenos.

Estado local: el preflight terminó bloqueado con docker ENOENT; no construyó ni inició contenedores. La automatización está preparada, pero aún NO ejecutada en GitHub. Su existencia no aprueba OPS-01. Evidencia: evidence/ops-runtime-preflight.json.
