# Reversión v0.4.0 (REL-04)

El procedimiento de reversión preserva todos los datos de usuario, análisis, proyectos y archivos de CV.

1. **Compatibilidad de esquema (`0006_empty_martin_li.sql`):**
   - La migración `0006` únicamente añade las tablas `app.learning_paths` y `app.learning_path_steps`; no elimina ni altera columnas de `auth.users`, `app.profiles`, `app.skills`, `app.user_skills`, `app.analyses`, `app.projects`, `app.project_skills`, `app.cv_files` ni `app.cv_cleanup`.
   - Los flujos de M1 (autenticación, perfil, habilidades, análisis manual e historial), M2 (portafolio y CV privado) y M3 (búsqueda de vacantes en modo `fixture`) continúan funcionando sin verse afectados.
2. **Reversión de código en `main`:**
   - Si se detecta una regresión tras publicar `v0.4.0`, aplicar un revert commit o rama `hotfix/*` sobre `main` y publicar `v0.4.1`, sincronizando después `main → develop`.
   - Nunca mover ni eliminar los tags publicados `v0.1.0`, `v0.2.0`, `v0.3.0`, `e3-microservice` o `v0.4.0`, ni borrar los volúmenes de PostgreSQL o `cv_files`.
3. **Verificación posterior al rollback:**
   - Confirmar `GET /health/ready`, inicio de sesión, perfil/habilidades, proyectos/CV, búsqueda `/jobs` en modo `fixture` y creación de análisis manual en `/analysis/new`.
