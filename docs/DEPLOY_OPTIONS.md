# Opciones de despliegue con presupuesto cero — DEP-01

Consulta: **5 de noviembre de 2026**. Alcance: investigación documental; no se creó ninguna cuenta, suscripción o despliegue. Los límites pueden cambiar y deben verificarse nuevamente antes de usar un proveedor.

## Conclusión

No existe una combinación demostrada que ejecute la arquitectura actual de DevPath de forma **persistente, privada, disponible y garantizada a costo cero** sin cambios de código ni riesgo de suspensión. La opción recomendada para aceptación y entrega sigue siendo la ejecución local reproducible mediante Docker Compose.

Sí es posible preparar una **demostración pública temporal** combinando servicios gratuitos, pero tiene cold starts, pausas, cuotas compartidas, almacenamiento efímero y requiere implementar un adaptador de almacenamiento privado para el CV. Esa alternativa necesita una tarea posterior de despliegue y una revisión de seguridad; DEP-01 no la autoriza.

## Requisitos de DevPath

| Componente     | Necesidad real                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web React/Vite | Archivos estáticos, fallback SPA y acceso HTTPS a `/api/v1`.                                                                                         |
| API Express    | Proceso Node 22 con secretos, JWT, conexión PostgreSQL, acceso a CV y llamadas al Skill Engine/JSearch.                                              |
| Skill Engine   | Segundo proceso HTTP independiente; no recibe datos personales ni accede a PostgreSQL.                                                               |
| PostgreSQL     | Persistencia de usuarios, sesiones, proyectos, análisis y rutas; migraciones `0000`–`0006`.                                                          |
| CV privado     | Objetos PDF no públicos, autorización mediante API y persistencia tras reinicios. El código actual usa filesystem privado mediante `CV_STORAGE_DIR`. |
| JSearch        | Key solo en API, cuota acotada y retención live desactivada mientras falte permiso contractual.                                                      |

## Comparación por componente

### Frontend estático

| Opción             | Plan gratuito documentado                                                                                                                  | Restricciones                                                                                                                                                    | Evaluación                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Cloudflare Pages   | 500 builds/mes, un build concurrente, 20 000 archivos y 25 MiB por archivo. Las peticiones de assets estáticos son gratuitas e ilimitadas. | Requiere configurar fallback SPA, API externa, CORS y secretos únicamente en backend. La documentación consultada no afirma expresamente si Pages exige tarjeta. | Adecuado para la web de una demo. No aloja los procesos Express existentes. |
| Render Static Site | Sitio estático gratuito sujeto a ancho de banda y minutos de pipeline incluidos.                                                           | Si se excede una cuota sin método de pago, Render suspende/deshabilita en vez de cobrar; con método de pago puede facturar excedentes.                           | Alternativa válida para demo, pero no resuelve backend ni persistencia.     |

### API Express y Skill Engine

Render permite web services Node gratuitos, pero:

- cada servicio se suspende tras 15 minutos sin tráfico y puede tardar alrededor de un minuto en reactivarse;
- el filesystem es efímero y se pierde al reiniciar, redesplegar o suspender;
- el workspace comparte 750 horas de instancia al mes; dos procesos activos continuamente necesitarían aproximadamente 1 440 horas;
- las instancias gratuitas no reciben tráfico de red privada, por lo que el Skill Engine tendría que exponerse públicamente y protegerse con la credencial interna;
- Render puede reiniciar las instancias y puede suspender tráfico saliente anormal.

Por tanto, dos web services gratuitos sirven como demostración manual con calentamiento previo, pero no como servicio persistente ni como reproducción exacta de la frontera privada. Unir API y engine en un solo proceso ahorraría horas, pero contradice la arquitectura y los criterios ya aceptados; no se recomienda.

La documentación de Render contempla operar sin método de pago: al superar determinados límites suspende servicios o builds en lugar de cobrar. Si se agrega un método de pago, los excedentes aplicables pueden facturarse.

### PostgreSQL

| Opción               | Cuota y suspensión                                                                                                       | Persistencia/seguridad                                                                                                                                                                                                                   | Evaluación                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Supabase Free        | Dos proyectos; 500 MB de base por proyecto, 5 GB de egress. Proyectos de baja actividad pueden pausarse tras siete días. | PostgreSQL compatible con conexión normal. El plan gratuito no ofrece las garantías de un servicio de producción; revisar backups y restauración antes de usar datos importantes. La fuente consultada no confirma requisito de tarjeta. | Útil para demo o evaluación. La pausa afecta disponibilidad y cold start. |
| Render Free Postgres | 1 GB, una base gratuita por workspace.                                                                                   | Expira 30 días después de crearla; luego hay 14 días para actualizar antes de borrado. Sin backups ni pooling administrado.                                                                                                              | Solo demo temporal; no es persistencia duradera.                          |

No colocar datos personales reales en una demostración gratuita. Usar cuentas y datos sintéticos, TLS del proveedor y secretos fuera de Git.

### Almacenamiento privado de CV

| Opción                    | Cuota                                                                                             | Restricciones para DevPath                                                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase Storage Free     | 1 GB incluido según la tabla oficial del plan.                                                    | Debe usarse bucket privado y autorización únicamente desde API. El código actual no tiene adaptador Supabase/S3; requiere una tarea nueva, pruebas de aislamiento y migración desde `CV_STORAGE_DIR`.                             |
| Cloudflare R2 Standard    | 10 GB-mes, 1 millón de operaciones Class A, 10 millones Class B y egress directo gratuito al mes. | Requiere activar una suscripción mediante checkout; es un servicio con medición y posible facturación fuera del free tier. No se demostró que pueda usarse sin método de pago. También exige implementar un adaptador S3 privado. |
| Filesystem de Render Free | Sin persistencia.                                                                                 | Incompatible: los PDFs se pierden al reiniciar, redesplegar o suspender. Los discos persistentes no están disponibles para web services gratuitos.                                                                                |

El CV nunca debe alojarse como asset público de Pages ni en un bucket público. La descarga debe continuar pasando por la API autenticada, con `Cache-Control: no-store` y autorización del propietario.

### JSearch

La página oficial de JSearch anuncia BASIC por USD 0/mes, 200 requests/mes con hard limit y 1 000 requests/hora. La cuenta verificada por el lote 09 observó 200 requests y modo live funcional, pero DevPath conserva por defecto `JOBS_PROVIDER_MODE=fixture`, `JOBS_LIVE_ENABLED=false` y `JOBS_LIVE_RETENTION_ALLOWED=false`. La ficha de precios de RapidAPI también muestra 10 240 MB/mes de ancho de banda de plataforma y USD 0.001 por MB adicional; el límite duro de requests no demuestra que el consumo de ancho de banda no pueda generar cargos. Confirmar el medidor y las condiciones vigentes en la cuenta antes de usar el plan.

Un despliegue no debe activar live automáticamente. Debe conservar la key únicamente en API, limitar cada búsqueda a una página, respetar 429 y no guardar texto/derivados live mientras siga pendiente el permiso de retención. El costo cero publicado no sustituye la revisión del dashboard, transferencia y términos de la cuenta.

## Escenarios completos

| Escenario                                              | Costo esperado                                                                 | Persistencia y disponibilidad                                                                    | Veredicto                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Docker Compose local                                   | Sin tarifa de hosting; usa equipo, electricidad e internet propios.            | PostgreSQL y `cv_files` persistentes; funciona sin exposición pública.                           | **Recomendado para entrega, aceptación y reproducción.**             |
| Cloudflare Pages + 2 Render Free + Supabase DB/Storage | Puede permanecer en USD 0 dentro de cuotas, pero no está garantizado.          | API/engine se suspenden; DB puede pausarse; necesita adaptador de CV y engine público protegido. | Demo temporal después de una tarea específica; no funciona tal cual. |
| Render completo gratuito                               | USD 0 temporal.                                                                | 750 horas compartidas, servicios suspendidos, CV efímero y DB expira en 30 días.                 | No viable para DevPath persistente.                                  |
| Pages/Render + R2 + DB gratuita                        | R2 tiene free tier, pero requiere suscripción medida y posible método de pago. | Mejor persistencia de CV, todavía con cold starts/pausas y cambios de código.                    | No cumple “cero pesos garantizados”.                                 |

## Recomendación y condiciones para una prueba futura

1. Mantener Docker Compose como referencia oficial y no condicionar REL-04 a un despliegue web.
2. Si el equipo desea una demo temporal, crear una tarea independiente con datos sintéticos y presupuesto bloqueado.
3. Implementar primero una interfaz de almacenamiento de CV con adaptador S3/Supabase, pruebas de 404 entre usuarios y migración/reversión.
4. Revisar CORS, cookies `Secure`/SameSite, URLs de API/engine, health checks, cold start, límites de egress y gestores de secretos.
5. No exponer PostgreSQL, CV, private key JWT, `ENGINE_SERVICE_SECRET` ni `RAPIDAPI_KEY` al frontend.
6. Registrar proveedor, región, cuotas reales, método de pago, spend cap y procedimiento de borrado antes de crear recursos.

## Fuentes oficiales

- Cloudflare Pages, límites: <https://developers.cloudflare.com/pages/platform/limits/>
- Cloudflare Pages Functions, precios de assets: <https://developers.cloudflare.com/pages/functions/pricing/>
- Render, servicios gratuitos: <https://render.com/docs/free>
- Render, FAQ de servicios/filesystem: <https://render.com/docs/faq>
- Supabase, facturación y cuotas: <https://supabase.com/docs/guides/platform/billing-on-supabase>
- Supabase, pausa de proyectos gratuitos: <https://supabase.com/docs/guides/platform/free-project-pausing>
- Cloudflare R2, precios: <https://developers.cloudflare.com/r2/pricing/>
- Cloudflare R2, activación: <https://developers.cloudflare.com/r2/get-started/>
- JSearch, overview/autenticación/cuota: <https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch>
- JSearch, precios: <https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch/pricing>

## Revalidación propia — 5 de noviembre de 2026

Se reabrieron las fuentes oficiales de Cloudflare Pages, Render, Supabase, Cloudflare R2 y JSearch. La comprobación confirma las cuotas principales de las tablas: Pages Free permite 500 builds mensuales, 20 000 archivos y 25 MiB por archivo; Render mantiene 750 horas compartidas por workspace, suspensión por inactividad tras 15 minutos y expiración de Postgres Free a los 30 días; Supabase Free mantiene 500 MB por base, 5 GB de egress y pausa por baja actividad durante una ventana de siete días; R2 Standard incluye 10 GB-mes, 1 millón de operaciones Class A, 10 millones Class B y egress gratuito. En Render, al agotar el ancho de banda incluido sin método de pago se suspenden los servicios gratuitos hasta el siguiente mes; al agotar minutos de build se deshabilitan nuevos builds. La ficha de precios de JSearch además publica la cuota de ancho de banda y el precio por exceso descritos arriba, así que el límite duro de requests no basta para afirmar costo cero garantizado.

Fuentes reabiertas: las páginas oficiales listadas arriba; para la ficha de JSearch, overview y precios de RapidAPI. No se crearon cuentas ni se hicieron llamadas de prueba.

## Revisión requerida

- P1 valida compatibilidad de PostgreSQL, secretos y almacenamiento privado.
- P2 valida topología API/engine, horas, cold start, CORS y CI.
- P4/Zaid vuelve a abrir las fuentes, registra cambios y aporta una comparación o corrección propia antes de firmar su commit.

La investigación no concede permiso para desplegar ni contratar. Una publicación real necesita una tarea nueva y autorización explícita.
