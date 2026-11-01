# ADR 0004 — Evidencia pública opcional de Analysis

- Fecha: 2026-11-01.
- Estado: implementación local autorizada por Emanuel, quien comunica la aprobación de Omar; pendiente revisión y merge del PR.
- Alcance: M1, contrato público y API. ANL-02/Karen se adapta después del merge, no en esta rama.

## Decisión

OpenAPI público 1.1.0 añade evidence opcional con grupos {skillId,matches:[{text,start,end}]}. Son menciones literales almacenadas, no frases, HTML ni texto completo. Se conserva la forma del engine, sin cambiar sus versiones ni recalcular historia. start inclusivo/end exclusivo usan unidades UTF-16 del original.

Máximo100 grupos únicos correspondientes a required,1–20 coincidencias por grupo, texto1–100 y posiciones dentro del source original de hasta20000 unidades. Se valida estructura, cobertura, slice, duplicados y alias del catálogo canónico de la versión disponible. Una versión histórica sin catálogo disponible no se reinterpreta. El DTO completo con evidence no excede128KiB UTF-8; si lo excede se omite el opcional entero.

Ausencia significa evidencia no disponible/validada. [] se expone cuando no hay required; required no vacío con [] antiguo se devuelve sin evidence. No añadir warnings nuevos, mutar filas ni usar engine para GET/replay. El POST mantiene validación interna y rollback: evidencia interna inválida no se convierte en éxito por omitirla públicamente.

POST201/replay200 y GET propio comparten la proyección. Listado mantiene AnalysisSummary sin evidencia. JWT, filtros de propietario,404 ajeno, no-store, hash/key e idempotencia se conservan. La columna JSONB existente de0002 y job_text bastan; sin migración nueva.

## Compatibilidad y consumidores

Los DTO antiguos sin propiedad siguen válidos en1.1.0. Clientes tolerantes la ignoran; validadores antiguos additionalProperties:false sí rechazan nuevas respuestas. Se actualizan artefactos generados, ejemplos y validadores estrictos del repo; tests lo comprueban explícitamente. No se promete compatibilidad con consumidores estrictos externos no inventariados. El cliente web integrado aún no consume Analysis funcional; su cast genérico no rechaza propiedades. La UI local de Karen se conserva y se adaptará tras integrar este PR. Antes de desplegar frente a otros clientes, Omar debe confirmar sus versiones/validadores y actualizar lectores primero; si no es posible, se requiere otra decisión de negociación/versionado, no relajar esquemas silenciosamente.

## Seguridad, límites y reversión

El JSONB se trata como unknown y se reconstruyen solo propiedades permitidas; nunca la fila ni job_text. Solo alias verificables minimizan exposición: no existe garantía absoluta de que la vacante pegada esté libre de PII. No registrar contenido rechazado. React deberá renderizar texto inerte; HTML/contexto y evidencia de CV/proyectos son otros alcances.

La reversión consiste en retirar la emisión desde el mapper mediante PR revisado manteniendo esquema opcional/cliente tolerante; sin borrar columnas, registros ni migraciones. Si se revierte también el contrato, regenerar tipos/huella y comprobar consumidores. No reset/force push.

## Validación y puertas pendientes

Unitarias de proyección/límites/Unicode, contratos con y sin campo/negativos, API+engine+PG reales, replay/historia/cuentas/404/lista y suites generales. PG16 se ejecutará en CI; el entorno local solo dispone de18.3. No declarar CI/revisión humana hasta comprobarlos. ANL-04 y lote06 mantienen sus dependencias. JSearch futuro deberá verificar permisos de derivados; rutas usan gaps/snapshots, no evidencia textual.
