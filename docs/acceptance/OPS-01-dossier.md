# OPS-01 — evidencia para P1/P2 y Omar

## Estabilización M1: carrera en verificación tras reinicio

Run41581061547 sobre mainc4201f7 falla en persistent restart, ops-compose.mjs:197:10, isChecked() inmediato devuelvefalse. Cuatro checks previos aprobados; persistencia y recuperación no se dan por aprobadas en esa ejecución. ZIP cotejado con digest GitHub. API GET /me/skills200 consta en log, pero sin cuerpo ni consulta DB: no prueba por sí solo el estado original de filas.

Frontend carga profile/skills/catalog en consultas independientes; hasta recibir skills, selected=[] y catálogo puede mostrar checkbox visible, desmarcado y deshabilitado. Regresión determinista con backend/PG reales reproducefalse a la vez que SQL y respuesta upstream contienen JavaScript/React. Se retiene solo la entrega de esa respuesta real y luego se libera intacta; sin sleeps ni datos simulados. Prueba confirma la carrera, no pérdida de datos en la reproducción; el artefacto original no permite inspeccionar retroactivamente sus filas.

Fix mínimo en probe: capturar/validar GET /me/skills tras login y exigir skillIds persistidos; helper compartido espera nombre y ambos checkboxes realmente seleccionados mediante expect reintentable. Sigue fallando si API/persistencia es incorrecta; no se elimina ninguna comprobación. No cambia frontend/API/SQL ni contratos.

Regresión1/1 y suite9/9; API118/web97/motor51/privacidad2, lint/formato/typecheck/build y contratos aprobados localmente. [Evidencia acotada](evidence/ops-profile-readiness-fix.json). Docker/PG16 Compose del fix pendiente de CI. Historial fuente del probe se archiva con SHA idéntico en final06-ops-compose-source.txt; manifest anterior conserva hash real sin fingir que el nuevo script fue el probado entonces.

Rama fix/ops-profile-skills-readiness desde c4201f7, correctivo hacia main: FLUJO_GITHUB clasifica los defectos antes de primera publicación como fix, no hotfix de versión estable. Esperar checks/Compose de rama, revisión y merge humanos; después repetir Compose del nuevo main y verificar ese SHA antes del tag. No etiquetar c4201f7 ni declarar REL cerrada con el fallo pendiente.


## Aceptación delegada recibida

Emanuel, autorizado por Omar para asumir revisiones restantes según su comunicación, aceptó explícitamente el alcance técnico comprobado para preparar el candidato. [Decisión real](evidence/M1-delegated-acceptance.json). No es firma de P1/P2/P4 ni prueba manual nueva. La reproducción se sustenta en CI real y el artefacto inspeccionado; Windows/Docker local no comprobado queda como limitación aceptada. La revisión independiente del release y sus resultados sigue pendiente. Los registros vacíos inferiores son plantillas históricas, no puertas que ignoren esta decisión delegada.


## Artefacto exitoso inspeccionado — estado vigente

ZIP facilitado por Emanuel, ejecución [41568942398](https://github.com/Om4r28xz/Dev_Path/actions/runs/41568942398), artifact13200486709. SHA256 del ZIP idéntico al digest público de GitHub: 0f9e6085a38f1785bf023d883225b04cdbc928119987fcd7b3331d27ae573703. [JSON original](evidence/ops-pr34-runtime.json) y [verificación](evidence/ops-pr34-runtime-verification.json). No contiene tokens, claves ni contraseñas.

El JSON registra productCommit **a2002e345363d4aec848232a3df8f4a7464af266**, merge temporal del PR con padres f700cf2 y44b0301. No se sustituyó por el SHA de la rama. La API de GitHub confirma head44b0301 y éxito del run; el árbol completo de a2002e3 y44b0301 es idéntico (dde2ff71d034d2891c2408e662e9ea2e5301f203). Así corresponde a la corrección indicada, probada en su integración temporal.

Runtime: Docker28.0.4, Compose2.38.2, PostgreSQL16.15. Status passed/stage complete; seis checks observed=true/result=passed:

|Check registrado|Qué acredita|Límite|
|---|---|---|
|Build/migrations/seed/readiness|Arranque oficial web/API/engine/DB, migración/seed y disponibilidad|Resultado agregado, sin log SQL individual|
|Only web published on loopback|Puertos de DB/API/engine no publicados, web loopback|No auditoría general de seguridad/red|
|SPA direct reload/internal blocked|Ruta SPA directa y rechazo de ruta interna comprobados por driver|No prueba todas las URLs posibles|
|Register/profile/skills/analysis67/evidence|Recorrido navegador→proxy→Express→engine→PG real,67% y evidence|No lectura humana/estética ni todos los casos de auth|
|Persist after real restart|Login, perfil, historial y snapshot recuperados tras reinicio|No backup/restore de producción|
|Engine503/same-key retry/success|Fallo real de engine, borrador/reintento seguro y recuperación|No ensayo de todas las caídas posibles|

Cleanup registrado: solo contenedores/red propios retirados, volumen retenido, volumesRemoved=false. No hay campo error/diagnostics ni checks fallidos u omitidos entre los seis. El JSON no enumera advertencias de build: no afirmar que fueron cero. Servicios concretos, assertions y orden se contrastaron con el driver del mismo árbol; no se acredita una prueba solo por existir su script.

**Conclusión técnica:** evidencia suficiente del recorrido automatizado OPS-01, incluida persistencia y recuperación real. No acredita Docker Desktop/Windows local, revisión manual completa, restauración productiva ni firma de P1/P2. Especificación original OPS-01 (TAREAS_PARA_IAS): P2 responsable y P4 reproduce instrucciones; la revisión asignada debe registrar esa reproducción o su evidencia aceptada y cualquier reasignación explícita. No imponer repetir el mismo CI sin motivo.

## Registro de aceptación humana pendiente

Persona/rol autorizado: __________. Fecha: __________. Ejecución/SHA/evidencia revisados: __________. Reproducción/muestra o evidencia aceptada, y límites: __________. Decisión aprobado/fallido/pendiente: __________. Observaciones/defectos: __________. Revisor adicional/reasignación explícita si corresponde: __________.

P1/P2 deben registrar su aceptación técnica; P5 o revisor formalmente designado registra decisión UI-01/EVID-06 usando la revisión real de Emanuel ya integrada. No se fabrican firmas. Autorización de Omar para avanzar condicionada al cumplimiento de las puertas ya comunicada; no equivale a decisiones de esos roles.

Git actual: PR34/35 integrados en develop; PR38 entró en main y PR39 integra la revisión también en develop6cfdd2f. Sin cambios de producto/infra/scripts/workflows respecto44b0301. El CI de6cfdd2f es Docs-only, no nueva ejecución completa. REL-01 aún no publicada ni etiquetada/sincronizada; CTR-02 bloqueada.

## Histórico previo a inspeccionar el artefacto

Las menciones siguientes a artefactos no descargados describen la revisión anterior; el contenido del artefacto PR está ahora inspeccionado arriba. El artefacto separado de push no fue suministrado ni se presume leído.


Commit: `44b03015d982369b2de15c1b9629669bab73231d`. PR34 fusionado a develop como `5061185183a2f4b6201cc8f73f29a2d59f0899cb` (GitHub merged=true, ascendencia de44b0301 confirmada). Los nueve checks del commit están aprobados; no se realizó merge ni se cambió código en esta revisión.

| Ejecución real                                                                            | Resultado | Paso de stack/reinicio/recuperación       |
| ----------------------------------------------------------------------------------------- | --------- | ----------------------------------------- |
| [Push 41568936504](https://github.com/Om4r28xz/Dev_Path/actions/runs/41568936504)         | success   | success, 2026-11-03 02:54:47–02:56:22 UTC |
| [Pull request 41568942398](https://github.com/Om4r28xz/Dev_Path/actions/runs/41568942398) | success   | success, 2026-11-03 02:54:47–02:56:18 UTC |

También aprobaron build, typecheck, lint/formato, tests, E2E Chromium/PostgreSQL16, documentación y CI gate. [CI completo](https://github.com/Om4r28xz/Dev_Path/actions/runs/41568942151).

La API de GitHub confirma jobs y pasos completos, sin saltar el paso de ejecución, y subida satisfactoria del artefacto en ambas ejecuciones. Estos son resultados de contenedores reales del runner, no una validación estática ni Docker local. El código del driver del commit exige antes de terminar: migraciones/seed y readiness del stack oficial, PostgreSQL16, puertos privados salvo proxy loopback, SPA e internal404, registro/perfil/skills/67%/evidence, login/historial/snapshot tras reinicio y engine503→reintento con misma clave→éxito sin duplicado. No usa continue-on-error y propaga fallos, incluido cleanup.

**Límite de la revisión:** los contenidos de los artefactos no pudieron descargarse: GitHub exige autenticación (401). No se atribuyen valores concretos de versión runtime, proyecto, checks internos o cleanup al JSON que no se ha leído. La conclusión del job y de sus pasos sí fue consultada directamente. No se ha registrado aprobación humana.

## Artefactos para completar revisión

En Summary de cada ejecución, descargar `ops-m1-runtime-result`, extraer `ops-runtime.json` y conservarlo con un nombre que identifique la ejecución. No usar los artefactos del commit anterior c631a27.

- Push: artefacto13200935262, digest publicado `sha256:2b07b87ac2aa88c015d5d550900ef2da0d3cb782273032f9c21c463847b016df`.
- PR: artefacto13200486709, digest publicado `sha256:0f9e6085a38f1785bf023d883225b04cdbc928119987fcd7b3331d27ae573703`.

Los digests son metadatos de GitHub; no se verificaron contra ZIP descargado. El archivo hermano `evidence/ops-pr34-github.json` conserva la consulta de jobs/pasos y metadatos públicos.

## Decisión de P1/P2

Ya se puede solicitar revisión/aprobación técnica de OPS-01, sustentada en dos ejecuciones reales satisfactorias. Antes de firmar:

1. Revisar diff44b0301: API con UID/GID no-root del dueño de la llave,0600 y bind mount read-only; no root/chmod777 ni ampliación del acceso. Setup conserva credenciales y rechaza configuración incompatible.
2. Abrir ambos JSON; comprobar commit correcto, status=passed, stage=complete, todos los checks aprobados, PostgreSQL16 y cleanup satisfactorio, volumesRemoved=false. Comprobar proyectos aislados y ausencia de secretos. Si aparece discrepancia con el estado del job, investigar antes de firmar.
3. Confirmar cobertura del runbook y registrar limitaciones: runner Linux comprobado; Docker Desktop/Windows local sigue sin comprobarse. No confundir reproducibilidad Linux con prueba de ese equipo Windows.
4. Registrar persona/rol, fecha, commit, enlaces, observaciones, defectos y decisión real. Incorporar evidencia/decisión al reporte de aceptación del repositorio mediante el flujo acordado, conservando el historial.

P1: __________. P2: __________. Fecha: __________. Decisión/observaciones: __________.

## Revisión de Omar y bloqueantes REL-01

- Revisar PR34, corrección y nueve checks; confirmar aceptación P1/P2 antes de decidir merge. PR34 ya está integrado por merge confirmado; no sustituye aceptación humana.
- Pendiente UI-01 y EVID-06 completas por P5, con decisión documentada; los automatismos no sustituyen comprensión/revisión visual humana.
- Pendiente registrar aceptación OPS-01 y revisión técnica global P1/P2; ahora existe ejecución técnica exitosa y ya no falta configurar/arrancar Compose en el runner.
- Actualizar M1-results/checklist/handoff con nuevas evidencias y firmas reales; los estados históricos de «Compose no ejecutado» no describen estas nuevas ejecuciones.
- Integración PR34 confirmada; falta autorización expresa de Omar para candidato de release.
- Después preparar release/0.1.0 según flujo: versiones/changelog, pruebas y smoke/instalación del candidato; PR a main. Merge/tagv0.1.0, smoke desde tag y sincronización main→develop corresponden al proceso humano autorizado. Aún no realizados.
- CTR-02 sigue bloqueada hasta REL-01 integrada, tag exacto y sincronización comprobados. M1 no se declara liberada por estos checks.

Este expediente actualiza evidencia; no registra firmas humanas ni autoriza merges/tags/releases.

## CI del merge integrado

Merge5061185: ocho checks completos aprobados, incluido Compose real (run41569680337) y CI/E2E PG16 (run41569680256). [Registro](https://github.com/Om4r28xz/Dev_Path/actions/runs/41569680337). Evidencia pública en docs/acceptance/evidence/pr34-merge-checks.json. Esto añade ejecución sobre develop integrado, sin sustituir revisión de artefactos ni firmas humanas.
