# Changelog

## 0.2.0 — candidato M2, pendiente de publicación

### Funcionalidad

- Portafolio propio con CRUD de proyectos, tecnologías del catálogo, enlaces tratados como datos y aislamiento entre cuentas mediante 404.
- CV privado PDF: carga y sustitución multipart de hasta 5 MiB, metadatos, descarga autenticada como attachment y borrado idempotente.
- Interfaz responsive de proyectos y panel de CV en perfil, con estados de carga/error, confirmaciones y flujo de análisis manual M1 conservado.

### Datos, privacidad e infraestructura

- Migraciones 0004 y 0005 añaden proyectos, relaciones, revisión de proyectos, CV activo y cola de limpieza sin modificar migraciones publicadas de M1.
- El archivo se valida por extensión, MIME, firma y bytes reales; se guarda con clave generada fuera del webroot. No se analiza, no modifica habilidades y no llega al Skill Engine.
- Compose monta el volumen privado `cv_files` solo en el inicializador de permisos y la API. DB, engine, claves y archivos continúan sin exposición pública.
- Reemplazo concurrente, compensación ante fallos de DB/disco y reconciliación de temporales/huérfanos están cubiertos por pruebas.

### Compatibilidad y aceptación

- Upgrade desde v0.1.0 conserva usuarios, perfil, habilidades y análisis existentes; las nuevas estructuras empiezan vacías y aceptan migración idempotente.
- QA-03 técnica integrada: 129 pruebas API, 106 web y 11 E2E M1/M2 sobre datos sintéticos; sin defectos bloqueantes registrados.
- Versiones privadas del workspace pasan a 0.2.0. OpenAPI, catálogo y versiones de snapshots mantienen sus ciclos independientes.
- JSearch y rutas de aprendizaje no forman parte de v0.2.0. La integración live permanece desactivada hasta completar JSR-01 y las tareas dependientes.

Pendiente del candidato: validación final del commit de release, revisión humana P2/P5, PR con merge commit hacia main, tag anotado `v0.2.0`, smoke del tag y sincronización main → develop. Este texto no afirma que esas acciones protegidas ya ocurrieron.

## 0.1.0 — M1 publicada

### Funcionalidad

- Registro/login, perfil y catálogo de habilidades; JWT de acceso en memoria, refresh HttpOnly rotado y logout entre pestañas compatibles.
- Análisis manual determinista: tecnologías requeridas, coincidencias/faltantes, porcentaje de cobertura (no probabilidad de contratación),0% distinto de ausencia de cálculo.
- Snapshots PostgreSQL, idempotencia, evidence opcional de menciones literales mostradas como texto; compatibilidad con análisis antiguos.
- Historial propio con paginación, detalle recuperable y eliminación con confirmación; aislamiento entre cuentas.

### Infraestructura y correcciones

- Verificación Compose tras reinicio sincronizada con la respuesta real de habilidades y su estado renderizado; regresión de carga tardía sin simular datos ni omitir persistencia.

- React/Vite, Express y Skill Engine separado; PostgreSQL16 oficial, migraciones0000–0003 y seed idempotente.
- Compose con proxy mismo origen, servicios internos y persistencia; recuperación tras fallo del engine y reinicio comprobada en CI.
- Dependencias corregidas durante estabilización: React Router7.18.2, Drizzle ORM0.45.2 y Zod4.6.6; adaptación del default de paginación para mantener20 sin alterar el contrato.
- Checkboxes del perfil con objetivos accesibles; API no-root alineada al dueño de la llave0600, montaje read-only.
- Corpus, contratos OpenAPI, pruebas unitarias/integración/E2E y expediente de aceptación. Ocho manifiestos privados pasan a0.1.0 sin publicar paquetes npm.

### Compatibilidad y aceptación

- Node22.23.4 y pnpm11.22.0; OpenAPI público1.1.0/interno1.0.0 y versiones de datos/extractor independientes, sin cambios de contrato ni SQL histórico por la release.
- Emanuel aceptó el alcance UI-01/EVID-06/OPS-01 como revisor delegado por Omar según registro de aceptación; revisión independiente del PR pendiente.
- Preferencias estéticas opcionales quedan fuera del candidato. Catálogo pequeño/reglas acotadas; sin certificación WCAG completa. Docker Desktop Windows local no probado; demo nativa PG18.3 y CI PG16 diferenciados.
- HTTP loopback es demo local, no despliegue HTTPS productivo; sin revocación inmediata de access JWT ya emitidos ni rate limit distribuido.
- No incluye proyectos/CV, proveedor JSearch ni rutas de aprendizaje; CTR-02 y futuras funcionalidades conservan sus dependencias.

Publicada mediante el tag anotado `v0.1.0` sobre `1f9e721a320270a415d0825e75a92f10f0d0b35d`. El expediente histórico permanece en docs/release.
