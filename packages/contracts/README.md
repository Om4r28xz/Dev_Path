# Contratos

Contratos HTTP canónicos de DevPath para M1, responsabilidad de P4 con revisión técnica de P1 y P2.

## Dirección de generación

`openapi/public.yaml` y `openapi/engine.yaml` son la única fuente de verdad. Los tipos de `src/public/generated.ts` y `src/internal/generated.ts` se generan con `pnpm generate`; no se editan a mano. La API, web y Skill Engine deben importar esos tipos o generar validadores desde el mismo OpenAPI, sin copiar DTOs por pantalla.

## Validación

- `pnpm generate`: regenera los tipos TypeScript.
- `pnpm test`: parsea ambos documentos, valida `operationId`, comprueba todos los JSON registrados en `examples/manifest.json` contra su esquema y detecta tipos generados obsoletos.
- `pnpm typecheck`: verifica los artefactos TypeScript.

Los ejemplos usan datos sintéticos. Un access token vive solo en memoria; el refresh opaco viaja exclusivamente en cookie HttpOnly y nunca aparece en JSON. El engine usa una credencial de servicio diferente del JWT de usuario y no recibe identidad ni otros datos personales.

## Analysis.evidence — contrato público 1.1.0

Campo opcional en Analysis (POST/replay y GET detalle), no en AnalysisSummary. Forma: grupos {skillId,matches:[{text,start,end}]}; menciones literales, offsets UTF-16 originales, end exclusivo.100 grupos/20 matches/texto1–100 y posiciones hasta20000; cobertura exacta de required. Ausente: no disponible/validado; []: sin tecnologías requeridas. Nunca null. API valida JSONB, slice, alias/versiones y presupuesto128KiB del DTO; omite evidencia inválida/completa excesiva sin alterar snapshots. No expone source completo ni recalcula históricos. Ver ADR0004.

Compatibilidad direccional: clientes nuevos aceptan respuestas antiguas sin campo. Un validador antiguo cerrado rechaza respuestas con campo; actualizar consumidores antes de emitirlo. Los tests conservan analysis-response.json como fixture legado y añaden dos fixtures públicos. El generador/huella y los validadores se actualizan juntos, sin editar tipos generados a mano. La UI ANL-02 se adapta tras el merge del contrato/API; no está incluida en esta rama.
