# Contratos

Contratos HTTP canónicos de DevPath para M1, responsabilidad de P4 con revisión técnica de P1 y P2.

CTR-02 añade `openapi/m2.yaml` (proyectos/CV definidos para M2), `openapi/m3-proposed.yaml` y `openapi/m4-proposed.yaml` (propuestas). No son endpoints disponibles en v0.1.0. [Alcance, seguridad, errores, limpieza e idempotencia](EXTENDED-CONTRACTS.md). M1 mantiene sus dos documentos y tipos sin cambios.

## Dirección de generación

Los cinco documentos `openapi/*.yaml` son las fuentes de verdad de sus respectivos hitos. Los tipos de M1 en `src/public/generated.ts` y `src/internal/generated.ts`, M2 en `src/m2/generated.ts` y propuestas en `src/proposals/{m3,m4}/generated.ts` se generan con `pnpm generate`; no se editan a mano. La API, web y Skill Engine actuales siguen consumiendo únicamente M1. Los contratos futuros referencian esquemas comunes de M1 sin duplicar su ErrorResponse ni alterar sus endpoints.

## Validación

- `pnpm generate`: regenera los tipos TypeScript.
- `pnpm test`: parsea los cinco documentos, resuelve referencias, compila esquemas, valida `operationId`, ejemplos inline y los JSON registrados en `examples/manifest.json` (positivos y negativos con `valid:false`), y detecta fuentes generadas obsoletas. Comprueba 401/JWT, límites declarados e invariantes de fixtures; no sustituye pruebas de futuras implementaciones.
- `pnpm typecheck`: verifica los artefactos TypeScript.

Los ejemplos usan datos sintéticos. Un access token vive solo en memoria; el refresh opaco viaja exclusivamente en cookie HttpOnly y nunca aparece en JSON. El engine usa una credencial de servicio diferente del JWT de usuario y no recibe identidad ni otros datos personales.

## Analysis.evidence — contrato público 1.1.0

Campo opcional en Analysis (POST/replay y GET detalle), no en AnalysisSummary. Forma: grupos {skillId,matches:[{text,start,end}]}; menciones literales, offsets UTF-16 originales, end exclusivo.100 grupos/20 matches/texto1–100 y posiciones hasta20000; cobertura exacta de required. Ausente: no disponible/validado; []: sin tecnologías requeridas. Nunca null. API valida JSONB, slice, alias/versiones y presupuesto128KiB del DTO; omite evidencia inválida/completa excesiva sin alterar snapshots. No expone source completo ni recalcula históricos. Ver ADR0004.

Compatibilidad direccional: clientes nuevos aceptan respuestas antiguas sin campo. Un validador antiguo cerrado rechaza respuestas con campo; actualizar consumidores antes de emitirlo. Los tests conservan analysis-response.json como fixture legado y añaden dos fixtures públicos. El generador/huella y los validadores se actualizan juntos, sin editar tipos generados a mano. El contrato, la API y la UI de ANL-02 forman parte de M1 publicado; el estado de aceptación y publicación se conserva en [handoff del lote 06](../../docs/handoffs/lote-06.md).
