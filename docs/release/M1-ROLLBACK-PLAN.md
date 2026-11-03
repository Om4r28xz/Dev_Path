# Reversión M1 — procedimiento preparado, no ejecutado

Solo P1/P2 con decisión de Omar ejecutan una reversión. Este documento no autoriza restaurar una DB existente ni mueve tags. Ver [publicación](M1-PUBLICATION-PLAN.md).

## Antes del candidato

Registrar SHA/imágenes/configuración del candidato y del último estado aprobado, versión PostgreSQL, migraciones aplicadas y resultado del smoke. Guardar backup protegido fuera de Git y probar su restauración en otra DB. No incluir .env/PEM/cookies/tokens/volúmenes en PR o artefactos públicos.

Ejemplo de backup dentro del **proyecto Compose aislado y confirmado** del runbook; conservar el formato binario sin usar redirección de PowerShell sobre el stream:

```powershell
# $opsProject debe ser el proyecto propio creado por OPS-01, nunca uno ajeno.
New-Item -ItemType Directory -Force .local-data/backups | Out-Null
docker compose -p $opsProject --env-file infra/.env -f infra/compose.yaml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/devpath-m1-backup.dump'
if($LASTEXITCODE -ne 0){throw 'Backup fallido; detener procedimiento'}
$backupPath=Join-Path '.local-data/backups' ('devpath-m1-'+[Guid]::NewGuid().ToString('N')+'.dump')
$dbContainer=(docker compose -p $opsProject --env-file infra/.env -f infra/compose.yaml ps -q db).Trim()
docker cp "${dbContainer}:/tmp/devpath-m1-backup.dump" $backupPath
if($LASTEXITCODE -ne 0){throw 'Copia de backup fallida'}
```

El backup contiene datos: conservar permisos/acceso apropiados, no imprimir su contenido ni copiarlo a outputs públicos. El proyecto y el SHA deben anotarse en evidencia privada. No se ha generado un backup por redactar este ejemplo.

## Ante un fallo

1. Registrar síntoma, esperado/observado, severidad, logs saneados, SHA y datos afectados; detener escrituras si P1 lo indica.
2. Conservar DB/volúmenes e imágenes; no ejecutar down -v, prune, drop ni reset --hard para ocultar el fallo.
3. Si la DB sigue siendo compatible, preparar un PR de revert/fix del código o volver al artefacto previamente aprobado, tras decisión humana. Mantener historial, no force push y no mover v0.1.0 si ya existe.
4. Si falla el esquema/datos, P1 diseña migración correctiva hacia adelante o restauración aprobada. No borrar/renumerar0000–0003 ni inferir que revertir código revierte DB.0003 añade índice, pero el comportamiento completo debe comprobarse.
5. Ensayar cualquier restore primero en DB **nueva** aislada; si el nombre ya existe, detenerse. Nunca usar --clean contra una DB existente como atajo.
6. Repetir smoke: auth/refresh/logout, perfil/skills,67%/null/evidence, historial/ownership/borrado y persistencia. P5 vuelve a revisar los recorridos afectados.
7. Omar decide hotfix/publicación/sincronización. Una release nueva puede requerir nuevo tag; el anterior permanece inmutable. Registrar cierre solo con evidencia.

Sin backup restaurable o revisión de P1/P2, la reversión de datos no se considera preparada para ejecutar. En esta entrega se probó upgrade0000–0002→0003 y backup custom pg_dump/restauración en otra DB nueva con PostgreSQL18.3: usuario, perfil, habilidades, análisis/evidence, claves/hash y journal idénticos; rerun de migraciones sin cambios y limpieza de la cuenta sintética. Ver ../acceptance/evidence/final06-backup.txt y ../acceptance/probes/backup-restore.mjs. No se ejecutó restore de producción, Compose ni rollback del futuro tag.
