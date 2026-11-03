# CTR-02 — Contratos posteriores a M1

Base: `v0.1.0` (`1f9e721a320270a415d0825e75a92f10f0d0b35d`), sincronizada a develop mediante PR #42 (`fc9f41b`). Estos contratos **no añaden endpoints a la aplicación publicada**. No hay cambios de backend, pantallas, migraciones ni llamadas a proveedores.

| Documento                                    | Estado                                        | Implementación posterior                      |
| -------------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| `openapi/public.yaml`, `openapi/engine.yaml` | M1 publicado, sin cambios en CTR-02           | Consumidores actuales                         |
| `openapi/m2.yaml`                            | Definido para M2, pendiente de implementación | Proyectos y CV privado; sin proveedor externo |
| `openapi/m3-proposed.yaml`                   | Propuesto, no disponible                      | JSR-01 verifica proveedor y coordina ajustes  |
| `openapi/m4-proposed.yaml`                   | Propuesto, no disponible                      | LRN-01 confirma contenido y reglas            |

Los documentos usan el servidor `/api/v1`; sus paths son relativos a ese prefijo. Todos los endpoints futuros exigen bearer JWT y documentan 401 con el mismo ErrorResponse de M1. Los ejemplos son sintéticos y no acreditan ejecución HTTP de funcionalidades futuras. Las versiones de los paquetes continúan en `0.1.0`; no se modifica el tag publicado.

## M2: propiedad, proyectos y paginación

CRUD: GET/POST `/projects` y GET/PATCH/DELETE `/projects/{id}`. Obtener el propietario exclusivamente del JWT verificado. Nunca aceptar `userId`, `ownerId` ni relaciones de otro usuario desde el body. Filtrar SQL por propietario tanto para lectura como escritura; ausencia y acceso ajeno devuelven el mismo 404 NOT_FOUND. Un UUID inválido devuelve 400 VALIDATION_ERROR. No consultar primero sin filtro para revelar existencia.

Crear/actualizar devuelve el Project completo. PATCH reemplaza únicamente los campos presentes; `url: null` borra el enlace y `skillIds: []` elimina las relaciones. Body vacío o propiedades desconocidas: 400. Validar todos los IDs contra el catálogo; IDs desconocidos: 400 SKILL_IDS_UNKNOWN con fields.skillIds. IDs repetidos: 400 VALIDATION_ERROR, sin corregir silenciosamente. El proyecto y sus relaciones se escriben en una transacción que incrementa `projects_revision` del propietario; un fallo revierte todo. DELETE elimina relaciones y aumenta la revisión. Ninguna operación modifica habilidades personales, score ni snapshots de análisis anteriores.

Enlaces http/https son datos: no descargarlos ni utilizarlos como destinos de solicitudes del servidor. Renderizar texto escapado; no interpretar HTML de título/descripción. Límites elegidos en CTR-02 para revisión P1/P2: título no blanco 1–120, descripción no blanca 1–5000 caracteres, URL hasta 2048, hasta 100 skillIds únicos (mismo catálogo de M1). No son requisitos nuevos de runtime M1. Normalización de espacios al borde antes de validar; no truncar datos para hacerlos pasar.

Listas: `limit` predeterminado 20, máximo 50; cursor opaco validado, orden estable `(created_at DESC, id DESC)`, restringido al propietario autenticado. Cursor de otro usuario no concede acceso ni filtra información: rechazarlo como 400 VALIDATION_ERROR. Cursor inválido no se interpreta como SQL. `nextCursor: null` al terminar, incluyendo lista vacía. No fabricar totales.

## M2: CV privado

- GET `/me/cv`: metadatos del único CV activo; 404 si falta.
- PUT `/me/cv`: crear/reemplazar mediante multipart/form-data, exactamente una parte `file`; 200 y metadatos. Sin Base64 ni cuerpo JSON.
- GET `/me/cv/download`: binario PDF con JWT en Authorization, `Content-Disposition: attachment; filename="cv.pdf"`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`. El navegador hace fetch autenticado y crea/revoca un Blob URL; nunca pone bearer tokens en query strings, localStorage, logs ni enlaces públicos.
- DELETE `/me/cv`: idempotente, 204 sin body aunque ya no exista. No borra CV de otro usuario: no existe un parámetro de propietario manipulable.

Máximo **5 MiB = 5 242 880 bytes**, incluyendo exactamente ese tamaño. Contar bytes reales durante streaming y cancelar al superar el límite, sin confiar en Content-Length. Verificar extensión `.pdf` sin distinguir mayúsculas, MIME application/pdf y firma PDF; extensión/MIME/firma por separado no bastan. Rechazar archivo vacío o estructura multipart inválida: 400 VALIDATION_ERROR; más de un archivo/partes inesperadas: 400; formato/firma incompatibles: 415 UNSUPPORTED_MEDIA_TYPE; exceso de tamaño: 413 PAYLOAD_TOO_LARGE. El límite es sobre el archivo, no `maxLength` de caracteres JSON. El límite del proxy para todo el multipart debe permitir overhead acotado sin desactivar el límite de streaming del archivo. No extraer texto, no ejecutar contenido ni inferir habilidades desde el CV. La validación no equivale a certificación antimalware.

Ejemplo de forma HTTP para la futura implementación (no ejecutado por CTR-02): PUT `/api/v1/me/cv` con Authorization bearer en header y multipart de una parte `Content-Disposition: form-data; name="file"; filename="cv-sintetico.pdf"`, `Content-Type: application/pdf` y bytes de un PDF sintético válido. No fijar manualmente el boundary cuando se use FormData. Respuesta 200: [metadatos sintéticos al límite](examples/m2/cv-at-limit.json); GET download devuelve bytes, no esos metadatos. El OpenAPI declara la parte binaria, encoding y límite x-maxBytes; ningún fixture JSON se presenta como prueba de un PDF real.

Guardar fuera del webroot con clave aleatoria y permisos privados del servicio, nunca derivar rutas del nombre del cliente. Sanitizar originalName para presentación; no devolver rutas físicas, storage_key ni otros usuarios. No incluir archivos PDF personales en Git, fixtures ni logs. La autorización se valida antes de procesar el upload/download, incluso si se transmite lentamente. Storage no disponible: 503 DEPENDENCY_UNAVAILABLE; errores internos saneados: 500 INTERNAL_ERROR. No devolver errores de rutas del filesystem.

### Reemplazo, concurrencia y compensación

1. Validar autenticación y límites; transmitir a temporal privado de nombre generado y limpiar temporal en rechazo/desconexión.
2. Validar PDF, mover al destino privado final y preparar metadatos. Serializar por propietario la actualización de la referencia activa (transacción/bloqueo); unicidad de CV activo por usuario. Dos PUT válidos pueden finalizar sucesivamente: gana el último commit, sin dos referencias activas ni eliminación del archivo activo.
3. Confirmar referencia/metadata en DB. Si falla antes del commit, conservar CV anterior y eliminar o encolar limpieza del nuevo archivo huérfano. No anunciar éxito de una transacción fallida.
4. Después del commit eliminar el antiguo; si falla, encolar reintento/reconciliación, sin deshacer una referencia ya confirmada. El borrado de huérfanos debe comprobar que la clave ya no está referenciada. DELETE quita primero la referencia activa, luego aplica la misma limpieza idempotente. Descargar con handle abierto/lectura segura o sincronización compatible con reemplazo; una lectura concurrente no debe servir un CV de otra persona.
5. PUT/DELETE devuelven `X-File-Cleanup-Pending: true|false`: true informa limpieza diferida, no fracaso de persistencia ni permiso para acceder al archivo antiguo. La futura UI muestra aviso de limpieza pendiente. El header no contiene rutas/identificadores internos.

No se promete atomicidad entre filesystem y PostgreSQL. La implementación M2 necesitará reconciliación tras caída entre pasos, tests de disco/DB fallidos y concurrencia. No ejecutar limpieza indiscriminada de volúmenes.

## M3: propuestas E3, sin integración live

GET `/jobs?q=...&location=...&page=1`, GET `/jobs/details?providerId=...` y POST `/analyses` con `{source:{type:"jsearch",providerId:"synthetic-job-001"}}` están propuestos y exigen JWT, incluso búsqueda/detalle. Ejemplos 200/201 y 401 están dentro del OpenAPI y en fixtures. El adaptador de la API normaliza Job (provider/providerId/title/company/location/description/applyUrl/fetchedAt); no reenvía credenciales ni JSON bruto. No acepta URLs arbitrarias ni permite SSRF. `mode: fixture|live` impide presentar fixtures como respuestas reales. `hasNextPage: null` significa que el proveedor no permitió determinarlo; no inventar número total.

JSR-01 debe verificar host/rutas/parámetros reales, cuotas, costes, atribución, caché/retención y permiso para conservar texto derivado/snapshots. Hasta resolver permisos, mantener deshabilitado el flujo de proveedor; análisis manual M1 sigue funcionando. 429 RATE_LIMITED para límites; 503 DEPENDENCY_UNAVAILABLE para proveedor no disponible/no habilitado; 504 DEPENDENCY_TIMEOUT para timeout; 404 NOT_FOUND para oferta inexistente. Mensajes saneados, sin upstream keys. Límites de presentación propuestos (título/empresa/localidad 200, descripción 20000, ID opaco 512, hasta 50 resultados) requieren confirmación de JSR-01; no representan capacidades verificadas del proveedor.

POST requiere Idempotency-Key UUID: ámbito propietario + operación + payload normalizado. Nuevo snapshot 201; repetición de la misma petición 200 con el snapshot guardado, aunque cambie el proveedor/perfil; reutilizar clave con otro body: 409 IDEMPOTENCY_KEY_REUSED. Resolver providerId desde el servidor y persistir una sola vez en transacción, aplicando restricciones de proveedor antes de guardar. No regenerar en retry. No registrar tokens ni texto bruto en diagnósticos.

**Compatibilidad importante:** M1 acepta solamente `source.type: text`. ProposedJSearchAnalysis reutiliza todas las propiedades de Analysis mediante referencias y sustituye únicamente source en el documento propuesto. No vuelve aceptable jsearch en el M1 publicado. Antes de implementar, JSR-01 debe coordinar la unión discriminada source en public.yaml, tipos, validadores y consumidores mediante PR explícito. Los tests verifican que el ejemplo futuro todavía es rechazado por el validador M1. Título de resumen de análisis máximo 120 como M1; título de Job hasta 200: usar un resumen explícito y conservar el título original en el snapshot permitido del proveedor.

## M4: rutas, idempotencia y progreso propuestos

POST/GET `/learning-paths`, GET/DELETE `/learning-paths/{id}`, PATCH `/learning-paths/{id}/steps/{stepId}`. Fuente: analysisId propio guardado; usar las brechas del snapshot y proyectos propios actuales/revisión al crear, sin consultar JSearch ni recalcular score. Propietario en JWT; análisis/ruta/paso ajeno o inexistente: 404; paso debe pertenecer a esa ruta. Persistir texto de actividad, motivos y versiones de catálogo/contenido/generador, además de proyectosRevision. Contenido curado pendiente de LRN-01/P3, reglas deterministas; no IA generativa.

POST exige Idempotency-Key con las mismas reglas de M1 (propietario/operación/payload): 201 inicial, 200 replay exacto de la ruta guardada, 409 IDEMPOTENCY_KEY_REUSED si cambia analysisId. No invalidar la clave ni regenerar una ruta por cambios de contenido/proyectos. DELETE elimina ruta/pasos; borrar el análisis elimina sus rutas. Borrar un proyecto pone su referencia a null conservando el texto histórico de actividad; la operación y el aumento de projects_revision son transaccionales. No aceptar references de otros usuarios.

Estados `pending`, `in_progress`, `completed`. completedAt asignado por servidor al completar, null al reabrir; una repetición del mismo estado conserva el timestamp, no crea otro paso ni otra actividad. Progreso derivado de pasos (no otra verdad mutable): `completed/total`, porcentaje redondeado como `Math.round(100*completed/total)`. Cero pasos: `{completed:0,total:0,percentage:null}` y mensaje comprensible, sin inventar brechas. Máximo propuesto 200 pasos; LRN-01 revisará límites y plantillas. Completar actividad no cambia habilidades del perfil ni porcentajes de compatibilidad anteriores. Las listas usan las mismas reglas de cursor propio y orden estable de proyectos.

## Validación y límites de esta entrega

Desde raíz: `pnpm --filter @devpath/contracts generate`, `pnpm --filter @devpath/contracts test`, `pnpm typecheck`, `pnpm build`, `pnpm lint`, `pnpm format:check` y pruebas de regresión existentes. Los scripts resuelven refs locales/cruzadas, compilan todos los esquemas, validan ejemplos inline/fixtures positivos y rechazos negativos, autenticación/401 por operación, multipart/límites declarados, idempotencia y progreso de fixtures. Los artefactos M2/M3/M4 se generan en carpetas separadas; las huellas detectan fuentes obsoletas. No editar generated.ts a mano.

Los tests de esquemas no prueban aislamiento SQL, streaming PDF, permisos de disco, limpieza, llamadas live ni rutas de aprendizaje ejecutadas: aún no hay backend para ellos. Cada tarea M2/JSR-01/LRN-01 debe añadir pruebas HTTP/DB/concurrencia correspondientes antes de declarar esas funcionalidades operativas. En CTR-02 la compatibilidad M1 se contrasta además contra los archivos del tag v0.1.0. P1/P2 revisan límites, autorización, compensación y futura unión source antes de integrar el contrato; P3 revisará contenido M4 durante LRN-01.
