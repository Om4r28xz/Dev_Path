# Changelog

## 0.1.0 — candidato M1, pendiente de publicación

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

La fecha y el SHA de publicación se registran tras el merge/tag humano exacto. Este changelog versiona el candidato; no afirma release/tag ya publicados. Ver docs/release/M1-CANDIDATE-CHECKLIST.md y M1-ROLLBACK-PLAN.md.
