# Publicación v0.2.0

Esta guía prepara la intervención humana; no autoriza merge, tag ni release automáticos.

1. Publicar `release/0.2.0` y abrir PR hacia `main` con **Create a merge commit**.
2. Revisar que el diff contra main contenga solo el cierre M2 esperado. Main ya recibió M2 mediante PR #52; no revertirlo ni reconstruir la rama.
3. Exigir CI, Compose M2, revisión P2 y aceptación humana P5. Resolver defectos desde ramas de fix basadas en release, sin force push.
4. Omar aprueba el SHA final y realiza el merge. Confirmar el SHA exacto antes de etiquetar.
5. Desde PowerShell autenticado:

```powershell
git fetch origin --tags
git switch main
git pull --ff-only origin main
git tag -a v0.2.0 <SHA_MERGE_APROBADO> -m "DevPath v0.2.0 - projects and private CV"
git push origin v0.2.0
```

6. Crear GitHub Release `v0.2.0` con el bloque 0.2.0 de CHANGELOG.md, sin marcadores ni resultados no ejecutados.
7. Ejecutar smoke sobre el tag: registro, proyecto CRUD, upload/download/restart/delete de CV, análisis manual e historial.
8. Abrir PR `main → develop` y usar merge commit. Verificar que `v0.2.0` sea ancestro de develop antes de iniciar JSR-02.

No publicar JSearch en v0.2.0 y no incluir claves, PDFs reales ni archivos `.env`.
