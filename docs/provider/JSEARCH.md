# JSearch — revisión de acceso, contrato y permisos (JSR-01)

Revisión: **4 de noviembre de 2026**. Alcance: documentación pública oficial de OpenWeb Ninja y RapidAPI. No se inició sesión en una cuenta, no se aceptó un plan y no se realizó ninguna llamada. Por tanto, esta revisión no acredita una cuota asignada a DevPath ni autoriza tráfico live.

## Decisión

El adaptador futuro puede construirse con fixtures sintéticos y el host fijo, pero **live permanece desactivado por defecto**. Antes de activarlo se necesitan:

1. evidencia de la suscripción concreta de la cuenta y de un límite que impida cargos, incluida transferencia;
2. términos del proveedor que autoricen caché/retención del texto, presentación y conservación de resultados derivados;
3. revisión P1/P2 del ajuste de paginación y de la unión `Analysis.source`.

La documentación pública permite consultar vacantes para casos como job boards, pero no concede de forma expresa los derechos de almacenamiento que necesita JSR-03. No se extrapola ese permiso.

## Acceso técnico confirmado

| Tema               | Estado                                      | Evidencia / decisión para DevPath                                                                                                                                                                               |
| ------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marketplace        | Confirmado                                  | JSearch es ofrecida por OpenWeb Ninja en RapidAPI; API version v5 mostrada como vigente.                                                                                                                        |
| Host RapidAPI      | Confirmado                                  | `https://jsearch.p.rapidapi.com`; el servidor de DevPath debe fijarlo, nunca aceptar host/URL del usuario.                                                                                                      |
| Autenticación      | Confirmado                                  | Headers `X-RapidAPI-Key` y `X-RapidAPI-Host: jsearch.p.rapidapi.com`. La key vive solo en API y se redacta de logs/errores.                                                                                     |
| Búsqueda           | Confirmado                                  | GET `/search`; `query` requerido. Filtros publicados: cursor, num_pages, country, language, location, date_posted, work_from_home, employment_types, job_requirements, radius, exclude_job_publishers y fields. |
| Detalle            | Confirmado con verificación final pendiente | GET `/job-details` recupera una oferta por ID. Antes de la primera llamada autorizada, cotejar el nombre exacto `job_id` en el playground de la cuenta; el contrato interno nunca acepta una URL.               |
| Respuesta          | Confirmado                                  | Envelope del proveedor: `status`, `request_id` y `data`, o `error {message,code}`. El gateway puede devolver otra forma. Normalizar y no reenviar cuerpos crudos.                                               |
| Errores            | Confirmado                                  | 400 inválido, 403 sin suscripción/key, 404, 429 y 5xx documentados. DevPath los mapea a su ErrorResponse sin filtrar request/key.                                                                               |
| Rate-limit headers | Confirmado                                  | `x-ratelimit-requests-limit`, `-remaining`, `-reset`; son observaciones de la cuenta, no valores que deban exponerse completos al navegador.                                                                    |

## Paginación y cambio de contrato requerido

La documentación vigente de búsqueda usa un **cursor opaco** devuelto por la respuesta. `num_pages` acepta 1–20 y cada página de hasta 10 resultados consume un crédito. OpenWeb Ninja recomienda cursor para avanzar.

El contrato propuesto de CTR-02 expone `page: integer` en GET `/api/v1/jobs`. No debe traducirse inventando offsets ni almacenando un mapa global de páginas. Antes de JSR-02, P4+P1/P2 deben ajustar M3 propuesto a:

- request inicial sin cursor;
- siguiente request con `cursor` opaco emitido por DevPath;
- respuesta con `nextCursor: string|null`, sin total fabricado;
- `num_pages=1` por llamada de DevPath para controlar presupuesto;
- cursor ligado al usuario y a la consulta normalizada, con longitud/límites y sin interpretarlo como URL.

Los filtros iniciales de DevPath pueden conservar `q` y `location`; el servidor crea el `query` de proveedor y fija country/language mediante configuración revisada. No pasar parámetros arbitrarios del cliente.

## Coste, cuota y disponibilidad

| Afirmación                                                                                    | Estado                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| La página pública muestra BASIC USD 0/mes, 200 requests/mes, hard limit y 1000 requests/hora. | Confirmado públicamente el 4-11-2026.                                                                                                                                    |
| La página pública afirma “no credit card required” para el plan gratuito.                     | Confirmado como afirmación del proveedor.                                                                                                                                |
| La cuenta DevPath está suscrita a BASIC y tiene 200 requests disponibles.                     | **Pendiente**; requiere captura/registro del dashboard autorizado, sin mostrar key.                                                                                      |
| No puede existir ningún cargo.                                                                | **Pendiente/no demostrado**: la tabla pública también muestra una tarifa de transferencia tras 10 240 MB. No se acepta plan ni prueba live sin confirmar hard cap total. |
| Cuota/rate limit real de la cuenta.                                                           | **Pendiente**; leer dashboard y headers de una llamada manual autorizada. No copiar el valor público como si fuera asignación de cuenta.                                 |

No añadir reintentos automáticos sobre 429: consumen presupuesto y pueden amplificar una falla. Para 5xx/timeout, como máximo un retry acotado con backoff y presupuesto, sujeto a JSR-02. En fixture no simular headers como cuota real de cuenta.

## Uso, atribución y retención

| Permiso                                            | Estado                                          | Consecuencia                                                                                         |
| -------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Mostrar resultados normalizados durante una sesión | Pendiente de términos específicos del proveedor | Fixture permitido; live desactivado hasta confirmar.                                                 |
| Mostrar enlace de aplicación/publisher             | Pendiente de reglas de atribución               | UI futura muestra proveedor/publisher y enlace externo seguro; P1/P2 confirman texto/logo requerido. |
| Guardar respuesta cruda                            | No autorizado por evidencia disponible          | No crear tabla/log/cache de payloads.                                                                |
| Cachear búsqueda/detalle                           | Pendiente                                       | JSR-02 opera sin persistencia; memoria efímera solo si P1 concluye que los términos la permiten.     |
| Conservar descripción de vacante                   | Pendiente y bloqueante para JSR-03              | No crear análisis JSearch live ni snapshot del texto.                                                |
| Conservar IDs/título/empresa/enlace                | Pendiente                                       | No asumir que “job board use case” es licencia de retención.                                         |
| Conservar tecnologías, score y evidence derivados  | Pendiente y bloqueante                          | El resultado derivado depende del texto; pedir confirmación expresa al proveedor/terms.              |
| Usar fixtures sintéticos etiquetados               | Permitido por el proyecto                       | CI/demo fixture, sin copiar vacantes reales ni afirmar consulta live.                                |

RapidAPI indica que los derechos de cada API son entre proveedor y consumidor; sus términos generales no reemplazan los términos de JSearch. Si el dashboard no muestra condiciones específicas suficientes, solicitar confirmación escrita a OpenWeb Ninja sobre retención, caché, atribución y derivados.

## Configuración propuesta para JSR-02

- `JOBS_PROVIDER_MODE=fixture|live`, default `fixture`; producción rechaza modo live sin configuración completa.
- `RAPIDAPI_KEY` únicamente en API/secret manager; nunca prefijo `VITE_`, JSON, URL, HTML, artefactos o logs.
- Host y paths constantes en código; timeout y máximo de respuesta configurados con límites seguros.
- Fixture/live visible en respuesta normalizada y UI. Un fixture nunca consume cuota ni se etiqueta como dato actual.
- Búsqueda/detalle exigen JWT de DevPath; la API no actúa como proxy público.
- Sin caché persistente ni JSearch Analysis mientras los permisos sigan pendientes.

## Verificación manual pendiente, sin efectuar llamadas

Una persona autorizada entra al dashboard y registra, sin secretos:

1. nombre del plan, cuota restante, fecha de reset, hard cap, transferencia incluida/overage y si hay método de pago;
2. términos específicos del listing y atribución requerida;
3. permiso o prohibición de guardar payload, descripción e información derivada;
4. endpoint/param `job_id` y cursor observados en snippets vigentes;
5. autorización expresa de Emanuel para una única llamada sintética sin costo.

Solo entonces: una búsqueda estrecha, `num_pages=1`, y un detalle del ID devuelto. Registrar fecha, HTTP, mode=live, campos normalizados y headers de cuota **sin key ni payload completo**. No habilitar tráfico general desde esa prueba.

## Fuentes oficiales consultadas

- [JSearch en RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch): overview, endpoints, autenticación, errores, límites y estructura.
- [JSearch — búsqueda v5](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch/playground/apiendpoint_374e27ef-ac8b-4014-a801-29065a6f224b): parámetros y cursor.
- [Pricing de JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch/pricing): planes, request hard limit, rate limit y transferencia.
- [JSearch de OpenWeb Ninja](https://www.openwebninja.com/api/jsearch): proveedor, free tier y recomendación de cursor.
- [Autenticación RapidAPI](https://docs.rapidapi.com/v2/docs/configuring-api-authentication): significado de X-RapidAPI-Key/Host.
- [Keys y rotación](https://docs.rapidapi.com/v2/docs/keys-and-key-rotation): claves por aplicación y dashboard.
- [Términos de RapidAPI](https://rapidapi.com/page/terms), actualización publicada 13-05-2026: los términos específicos de la API corresponden al proveedor/consumidor.

Las páginas pueden cambiar; repetir esta revisión antes de activar live.
