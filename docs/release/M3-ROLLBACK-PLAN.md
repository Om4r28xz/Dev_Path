# Reversión v0.3.0 (REL-03)

El rollback preserva datos y archivos. M3 no añade migraciones destructivas ni modifica esquemas de M1/M2.

1. **Desactivación inmediata del proveedor externo sin redespliegue de base de datos:**
   - Fijar `JOBS_PROVIDER_MODE=fixture`, `JOBS_LIVE_ENABLED=false` y `JOBS_LIVE_RETENTION_ALLOWED=false` en la API.
   - Sin `RAPIDAPI_KEY`, los flujos de M1 (autenticación, perfil, habilidades, análisis manual e historial) y M2 (proyectos y CV privado) continúan operando con normalidad.
2. **Reversión de código en `main`:**
   - Si se detecta un defecto en el módulo `/jobs` tras publicar `v0.3.0`, crear una rama de corrección o revert commit sobre `main` y publicar una versión nueva (`v0.3.1`).
   - Nunca mover ni eliminar los tags publicados `v0.1.0`, `v0.2.0`, `v0.3.0` o `e3-microservice`, ni borrar los volúmenes `database` o `cv_files`.
3. **Verificación posterior al rollback:**
   - Confirmar `GET /health/ready`, inicio de sesión, edición de perfil/proyectos/CV y creación de análisis manual en `/analysis/new`.
