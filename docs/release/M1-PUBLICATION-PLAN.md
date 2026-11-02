# Publicación M1 — guía de preparación, no autorización de release

## Integración confirmada y corrección nueva pendiente

QA-02 correctiva ya está integrada por PR31/6d057b1, con CI PG16 aprobado. No repetir el PR correctivo anterior ni fusionar main completo. Ahora Omar/P2 deben revisar el fix independiente fix/profile-skill-target-size/6cba655 (M1-A11Y-001), publicar su PR autorizado y repetir CI/probe sobre el merge integrado. P5 confirma interacción. Esta guía reutiliza el borrador anterior, actualizando hechos y puertas; no autoriza publicar.

## Aceptación que falta

1. P5: seguir docs/acceptance/P5-review.md; lector, zoom200%/reflujo, contraste/estados completos y comprensión. Registrar UI-01/EVID-06 con commit y evidencia; ninguna firma automática.
2. P1/P2: en equipo con Docker autorizado, reproducir docs/SETUP_LOCAL.md; migrar/seed, proxy8080, cookies/origen, engine/DB no expuestos y persistencia tras restart con volumen conservado. Registrar OPS-01. No borrar volúmenes.
3. P1/P2: revisar y repetir la migración con datos en el candidato/PG16 cuando corresponda. Crear una DB nueva de prueba, configurar QA_UPGRADE_DATABASE_URL y QA_TEMP_ROOT y ejecutar docs/acceptance/probes/migration-upgrade.mjs. El ensayo PG18.3 ya aprobó0000–0002→0003 y rerun; no probar contra DB de desarrollo.
4. Corregir hallazgos mediante PRs separados y repetir afectados; Omar/P1/P2 registran revisión y decisión de aceptación.

## Solo después: habilitar REL-01

- Confirmar QA-02/DOC-02/DOC-01 y el fix de accesibilidad integrados, y aceptación registrada, sin bloqueantes abiertos.
- Revisar nuevamente diferencias exclusivas de main, en especial handoff04; cualquier sincronización completa exige autorización de Omar.
- Desde develop actualizado, crear release/0.1.0 solo cuando las puertas estén satisfechas. Congelar M1; preparar versiones/changelog y limitaciones aceptadas.
- Ejecutar instalación limpia del candidato, migraciones, tests/build/E2E y smoke. Guardar SHA/entorno/evidencia; no reutilizar un verde anterior como resultado del candidato.
- Preparar PR release→main para revisión humana. Main ya contiene QA-02, así que conservar su historial y revisar el merge concreto; no hacer reset/rebase/force push.
- Omar autoriza y realiza merge/tag v0.1.0 sobre el commit exacto aprobado. Verificar smoke del tag y publicación; después PR main→develop y comprobación de sincronización, por decisión humana.
- CTR-02 se habilita únicamente al comprobar publicación/tag/sincronización. Este documento no ejecuta ninguno de esos pasos.

## Artefactos de preparación

[M1-VERSION-PLAN](M1-VERSION-PLAN.md), [M1-CHANGELOG-DRAFT](M1-CHANGELOG-DRAFT.md), [READINESS-M1](../acceptance/READINESS-M1.md), [formulario P5](../acceptance/P5-review-form.md) y [OPS-01-runbook](../acceptance/OPS-01-runbook.md). Ningún casillero humano se da por aprobado.
