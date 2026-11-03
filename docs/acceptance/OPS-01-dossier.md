# OPS-01 — evidencia para P1/P2 y Omar

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
