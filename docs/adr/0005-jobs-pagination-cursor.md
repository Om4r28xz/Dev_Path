# ADR 0005 — Cursor confidencial para búsqueda de empleos

- Fecha: 2026-11-04.
- Estado: aprobado por delegación de Omar (P1, P2 y P4) el 2026-11-05.
- Alcance: contrato M3 propuesto e implementación JSR-02. No modifica M1 ni habilita JSearch live.

## Contexto

JSearch continúa una búsqueda mediante un cursor opaco. El contrato M3 de CTR-02 expone `page`, pero no existe una traducción fiable para saltar a una página arbitraria. El PR #56 integró una transición compatible basada en `nextCursor` y dejó pendiente elegir cómo ocultar, autenticar y expirar el cursor del proveedor.

Una codificación Base64 con firma HMAC protege integridad, pero no confidencialidad: el cliente podría decodificar el cursor interno. Eso incumple el requisito de no exponerlo.

## Alternativas evaluadas

| Alternativa                   | Ventajas                                                                                           | Costes y riesgos                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Mapa temporal en memoria      | Token público corto; el cursor del proveedor nunca sale del proceso                                | Se pierde en reinicios; no funciona entre varias instancias; necesita afinidad de sesión y limpieza.      |
| Tabla temporal PostgreSQL     | Reinicios y varias instancias; revocación explícita                                                | Nueva migración, escrituras y limpieza para una navegación efímera; amplía datos retenidos sin necesidad. |
| Token con cifrado autenticado | Sin estado compartido; confidencialidad e integridad; funciona entre instancias con la misma clave | Exige clave backend, nonce único, expiración, límite de tamaño y rotación controlada.                     |

La arquitectura actual no incluye Redis ni otro almacén efímero. Agregar una tabla solo para paginación aumenta estado, retención y mantenimiento. Se recomienda un token con cifrado autenticado.

## Decisión propuesta

DevPath emitirá un token versionado `j1.<base64url>` cifrado con AES-256-GCM. Los bytes codificados contienen nonce aleatorio de 96 bits, ciphertext y tag de autenticación de 128 bits. La clave de 32 bytes proviene de `JOBS_CURSOR_KEY` en la API; nunca usa prefijo `VITE_`, no se registra y debe ser igual entre instancias.

El payload cifrado contiene únicamente:

- versión;
- cursor del proveedor;
- ID del usuario autenticado;
- SHA-256 de `q`, `location`, modo y configuración normalizados;
- ordinal de la siguiente página;
- expiración Unix.

AAD fija `devpath:jobs:v1`. El token expira a los 15 minutos y admite de 16 a 2048 caracteres. La API deriva el usuario del JWT y compara usuario, hash, versión y expiración en tiempo constante cuando corresponda. Token alterado, vencido o ligado a otra consulta devuelve `400 VALIDATION_ERROR` en `cursor`, sin explicar qué comprobación falló. Rotar `JOBS_CURSOR_KEY` invalida cursores activos, un efecto aceptable para navegación efímera; una rotación sin interrupción requerirá una tarea posterior con clave anterior acotada.

Semántica pública compatible:

- primera petición: cursor ausente y `page` ausente o `page=1`;
- continuación: `cursor` presente; `page` puede omitirse o conservar el valor heredado `1`, pero no selecciona página;
- cualquier `page>1` devuelve `400 VALIDATION_ERROR` y orienta a usar `nextCursor`;
- la respuesta conserva `page` como ordinal derivado del token y añade `nextCursor` opcional inicialmente;
- `hasNextPage` es `nextCursor !== null`; no se fabrican totales.

## Presupuesto y errores

- JSearch recibe siempre `num_pages=1`: hasta diez resultados y un crédito publicado por petición.
- Timeout total del proveedor: 5 segundos. Tamaño máximo de respuesta: 1 MiB.
- Sin retry automático para 429, timeout, 5xx o JSON inválido; el usuario decide reintentar para no consumir cuota de forma oculta.
- 429 se normaliza como `RATE_LIMITED`; `Retry-After` solo se reenvía si es un valor acotado y válido.
- Timeout devuelve 504 `DEPENDENCY_TIMEOUT`.
- Live deshabilitado, 403/5xx o JSON inválido devuelven 503 `DEPENDENCY_UNAVAILABLE`, sin cuerpo crudo ni headers sensibles.
- Una búsqueda válida sin resultados devuelve 200 con `items: []`, `nextCursor: null`, `hasNextPage: false` y el modo visible.

Fixture y live deben compartir interfaz y semántica. El fixture usa cursores sintéticos protegidos por la misma capa, sin simular cuota real. Host, rutas y `RAPIDAPI_KEY` permanecen exclusivamente en backend. No hay caché ni persistencia de resultados mientras JSR-01 mantenga esos permisos pendientes.

## Compatibilidad y consecuencias

El cambio se limita a `packages/contracts/openapi/m3-proposed.yaml`, sus ejemplos/tipos generados y el futuro módulo jobs. `packages/contracts/openapi/public.yaml` y las listas M1 no cambian. Clientes actuales pueden seguir enviando `page=1` y leyendo `page`, `hasNextPage` y `mode`; clientes nuevos continúan únicamente con el token recibido.

P1 debe aprobar criptografía, clave, expiración y timeout. P2 debe aprobar presupuesto, 429 y puerta live. P4 debe aprobar la transición contractual y la adición inicialmente opcional de `nextCursor`. El merge de este ADR no sustituye esas decisiones salvo que queden expresas en la revisión del PR.
