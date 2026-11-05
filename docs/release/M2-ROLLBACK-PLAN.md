# Reversión v0.2.0

El rollback preserva datos y archivos. Nunca borrar el volumen `database` ni `cv_files`, nunca editar migraciones aplicadas y nunca mover el tag.

1. Detener escrituras y registrar el SHA/estado observado.
2. Conservar backup de PostgreSQL y copia coherente del volumen privado con acceso restringido. No adjuntar CV ni rutas internas a issues.
3. Si falla el código y el esquema sigue compatible, preparar un PR de fix/revert y volver a desplegar un artefacto revisado. La aplicación v0.1.0 no conoce tablas M2, pero las migraciones 0004/0005 permanecen aplicadas; confirmar compatibilidad antes de ejecutar binarios antiguos.
4. Si falla almacenamiento, conservar la referencia DB y el archivo confirmado; usar la cola/reconciliación para temporales y huérfanos. No limpiar claves aún referenciadas.
5. Si una migración causa corrupción, restaurar DB y volumen como par desde respaldo probado. No crear SQL manual destructivo durante el incidente.
6. Una corrección publicada usa una versión nueva; no reutilizar ni forzar `v0.2.0`.

El smoke posterior verifica usuarios/análisis M1, proyectos, metadata y bytes de CV, aislamiento entre cuentas y que el Skill Engine siga sin recibir el PDF.
