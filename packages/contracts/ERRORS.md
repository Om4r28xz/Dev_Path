# Guía de errores M1

Todas las respuestas de error públicas tienen `error.code`, un mensaje presentable y `requestId`. `fields` solo aparece para errores de campos. Los consumidores deciden por `code` y HTTP status, nunca comparando el texto en español.

| Estado | Código                                                              | Uso                                                                  |
| ------ | ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`, `SKILL_IDS_UNKNOWN`                             | Sintaxis, límites o IDs de catálogo inválidos.                       |
| 401    | `INVALID_CREDENTIALS`, `INVALID_REFRESH_SESSION`, `UNAUTHENTICATED` | Login genérico, refresh inválido o bearer ausente/inválido.          |
| 403    | `FORBIDDEN`                                                         | Identidad válida sin permiso o protección de origen/cliente fallida. |
| 404    | `NOT_FOUND`                                                         | Recurso inexistente o ajeno; no se revela propiedad.                 |
| 409    | `EMAIL_ALREADY_REGISTERED`, `IDEMPOTENCY_KEY_REUSED`, `CONFLICT`    | Conflicto de unicidad o reutilización incompatible.                  |
| 413    | `PAYLOAD_TOO_LARGE`                                                 | Cuerpo o campo supera el límite del contrato.                        |
| 415    | `UNSUPPORTED_MEDIA_TYPE`                                            | Se esperaba `application/json`.                                      |
| 429    | `RATE_LIMITED`                                                      | Límite de abuso; puede incluir `Retry-After`.                        |
| 500    | `INTERNAL_ERROR`                                                    | Fallo no recuperable sin traza ni secretos.                          |
| 503    | `DEPENDENCY_UNAVAILABLE`                                            | DB/engine no disponible o respuesta interna inválida.                |
| 504    | `DEPENDENCY_TIMEOUT`                                                | El engine excedió su plazo.                                          |

El engine usa el mismo sobre pero códigos internos limitados: `VALIDATION_ERROR`, `INVALID_SERVICE_CREDENTIAL`, `CATALOG_VERSION_MISMATCH`, `PAYLOAD_TOO_LARGE` e `INTERNAL_ERROR`. Sus errores nunca incluyen texto de la vacante, credenciales o stack traces.

Un `POST /analyses` repetido con la misma clave y el mismo cuerpo devuelve el análisis existente con 200. La misma clave con otro cuerpo devuelve 409 `IDEMPOTENCY_KEY_REUSED`. Un fallo del engine no persiste un resultado parcial.
