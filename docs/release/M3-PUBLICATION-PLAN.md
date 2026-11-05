# Publicación v0.3.0 y etiqueta e3-microservice (REL-03)

Esta guía prepara la intervención humana; no autoriza merge, tag ni release automáticos.

1. Publicar `release/0.3.0` y abrir PR hacia `main` con **Create a merge commit**.
2. Confirmar en el cuerpo del PR el alcance real documentado en `docs/acceptance/M3-results.md`:
   - Si la prueba `live` (`JSR-ACC-05`) sigue bloqueada por permisos/cuenta de `JSR-01`, declarar la entrega como **demo de adaptador en modo `fixture`**, conservar abiertas las issues de integración `live` y **no publicar todavía `e3-microservice`**.
   - Si la persona autorizada completa la verificación `live` acotada (`num_pages=1`) y actualiza `docs/provider/JSEARCH.md` y `docs/acceptance/M3-results.md` en la rama antes del merge, ambos tags (`v0.3.0` y `e3-microservice`) pueden compartir el mismo commit de `main`.
3. Una vez aprobado el PR y realizado el merge commit en `main`, desde PowerShell autenticado:

```powershell
git fetch origin --tags
git switch main
git pull --ff-only origin main
git tag -a v0.3.0 <SHA_MERGE_APROBADO> -m "DevPath v0.3.0 - JSearch provider adapter and M3 jobs flow"
git push origin v0.3.0
```

4. **Únicamente cuando todos los criterios E3 estén verificados (incluida la llamada externa real a JSearch):**

```powershell
git tag -a e3-microservice <SHA_EVALUABLE_CONFIRMADO> -m "DevPath E3 microservice - verified JSearch API integration"
git push origin e3-microservice
```

5. Crear la GitHub Release `v0.3.0` con la sección correspondiente de `CHANGELOG.md` y abrir PR `main → develop` con merge commit.
