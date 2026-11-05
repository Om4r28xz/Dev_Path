# JSR-02 — propuesta de paginación por cursor

Estado: **pendiente de aprobación P1/P2/P4**. Este documento no modifica el contrato OpenAPI vigente ni habilita el proveedor live.

## Problema comprobado

El contrato M3 propuesto por CTR-02 publica `GET /api/v1/jobs` con `page: integer`. JSearch avanza mediante un cursor opaco; no ofrece una traducción estable para saltar a una página arbitraria. Inventar offsets, repetir búsquedas o mantener un mapa global de páginas consumiría cuota, produciría resultados inconsistentes y rompería el aislamiento entre usuarios.

## Cambio mínimo y retrocompatible

### Petición pública

- Primera página: `GET /api/v1/jobs?q=...&location=...`, o `page=1` para conservar clientes generados con el contrato actual.
- Página siguiente: repetir `q` y `location` con `cursor=<token emitido por DevPath>`.
- `page` permanece temporalmente, marcado como obsoleto. Solo se acepta ausente o con valor `1` cuando no hay cursor.
- `page > 1`, cursor junto con un `page` distinto de `1`, cursor inválido, expirado o ligado a otra consulta: `400 VALIDATION_ERROR` con el campo afectado.

El cursor público es opaco, autenticado por el servidor y ligado al usuario, a la consulta normalizada, a la localidad y al ordinal. El cliente no lo construye ni lo interpreta. Puede encapsular el cursor del proveedor, pero no debe aceptarse como URL ni registrarse completo.

### Respuesta pública

Conservar los campos existentes `items`, `page`, `hasNextPage` y `mode`, y añadir inicialmente el campo opcional `nextCursor: string|null`:

- `nextCursor` contiene el único token válido para continuar, o `null` al finalizar;
- `hasNextPage` equivale a `nextCursor !== null`; deja de depender de un total inventado;
- `page` conserva el ordinal para clientes actuales: 1 en la petición inicial y el ordinal autenticado por el cursor en las siguientes;
- `mode` continúa distinguiendo `fixture` de `live`.

Agregar un campo opcional es compatible con consumidores tolerantes a propiedades nuevas. Al mantener `page`, `hasNextPage` y los valores actuales, tampoco se rompe el código generado existente. Una versión contractual posterior podrá exigir `nextCursor` y retirar `page` mediante el proceso normal de versión.

## Traducción al proveedor

1. DevPath normaliza `q` y `location`, aplica configuración fija de país/idioma y construye `query`.
2. Siempre solicita `num_pages=1`; así cada operación queda acotada a una página de hasta diez resultados y un crédito publicado por el proveedor.
3. En la primera petición no envía cursor. En las siguientes extrae del token autenticado el cursor devuelto previamente por JSearch.
4. Normaliza como máximo diez ofertas y emite un nuevo token únicamente si el proveedor entrega un cursor siguiente válido.
5. Nunca expone claves, headers de cuota, el envelope crudo ni mensajes internos del proveedor.

No hay navegación directa a una página N, totales ni precarga automática. Fixture y live deben implementar la misma interfaz y semántica.

## Límites y errores

Se conservan `q` de 1–80 caracteres y `location` de 1–120. Se propone cursor base64url de 16–2048 caracteres para no truncar el valor autenticado; P1 debe aprobar el formato y expiración.

| Caso                                                            | Respuesta DevPath            |
| --------------------------------------------------------------- | ---------------------------- |
| Parámetros o cursor inválidos/incompatibles                     | 400 `VALIDATION_ERROR`       |
| JWT ausente o inválido                                          | 401 `UNAUTHENTICATED`        |
| Cuota/rate limit del proveedor                                  | 429 `RATE_LIMITED`           |
| Live deshabilitado, 403 del proveedor, 5xx o respuesta inválida | 503 `DEPENDENCY_UNAVAILABLE` |
| Timeout acotado                                                 | 504 `DEPENDENCY_TIMEOUT`     |

No reintentar automáticamente un 429. Cualquier retry de 5xx/timeout debe ser acotado, presupuestado y aprobado; fixture no simula cuota real.

## Impacto en frontend

- La primera búsqueda omite cursor; cambiar consulta o localidad descarta el cursor anterior.
- “Cargar más” o “Siguiente” usa exclusivamente `nextCursor`; no permite introducir un número de página.
- El botón se deshabilita mientras la petición está activa y cuando `nextCursor` es `null`.
- Mantener resultados anteriores ante un error de página siguiente y anunciar el error accesiblemente.
- Mostrar de forma inequívoca `fixture` o `live`; no presentar fixtures como vacantes actuales.

## Archivos que cambiarían tras la aprobación

- `packages/contracts/openapi/m3-proposed.yaml`: parámetro cursor, compatibilidad de `page`, `nextCursor` y ejemplos/error 400.
- `packages/contracts/examples/m3-proposed/jobs.json` y ejemplos nuevos de continuación/error.
- `packages/contracts/examples/manifest.json`, validadores y `packages/contracts/src/proposals/m3/generated.ts` regenerado.
- `packages/contracts/EXTENDED-CONTRACTS.md` y `docs/provider/JSEARCH.md`.
- En JSR-02: módulo `JobsProvider`, adaptadores fixture/live, rutas y pruebas de API; README/configuración de la API.
- En JSR-03/04, cuando estén desbloqueadas: cliente web y pruebas de navegación incremental.

No se modifica `packages/contracts/openapi/public.yaml` de M1 ni sus endpoints. Puede reutilizarse la forma pública de `ErrorResponse`, pero el contrato M1 permanece intacto.

## Decisiones solicitadas

- **P4:** compatibilidad de mantener `page=1`, adición opcional inicial de `nextCursor` y transición futura.
- **P1:** formato, firma, expiración, longitud y vínculo usuario/consulta del cursor; timeout y política de retry.
- **P2:** presupuesto de una página por petición, tratamiento de 429 y activación live solo con cuota/coste confirmados.

Hasta registrar esas decisiones, JSR-02 puede diseñarse y probarse únicamente con fixtures; no debe cambiarse OpenAPI ni activarse live.
