# Contratos

Contratos HTTP canónicos de DevPath para M1, responsabilidad de P4 con revisión técnica de P1 y P2.

## Dirección de generación

`openapi/public.yaml` y `openapi/engine.yaml` son la única fuente de verdad. Los tipos de `src/public/generated.ts` y `src/internal/generated.ts` se generan con `pnpm generate`; no se editan a mano. La API, web y Skill Engine deben importar esos tipos o generar validadores desde el mismo OpenAPI, sin copiar DTOs por pantalla.

## Validación

- `pnpm generate`: regenera los tipos TypeScript.
- `pnpm test`: parsea ambos documentos, valida `operationId`, comprueba todos los JSON registrados en `examples/manifest.json` contra su esquema y detecta tipos generados obsoletos.
- `pnpm typecheck`: verifica los artefactos TypeScript.

Los ejemplos usan datos sintéticos. Un access token vive solo en memoria; el refresh opaco viaja exclusivamente en cookie HttpOnly y nunca aparece en JSON. El engine usa una credencial de servicio diferente del JWT de usuario y no recibe identidad ni otros datos personales.
