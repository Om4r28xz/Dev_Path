# Publicación v0.4.0 (REL-04)

Esta guía prepara los pasos verificables del cierre de `v0.4.0`; no autoriza merge, tag ni release antes de confirmar las validaciones del candidato y la autorización correspondiente.

1. Publicar `release/0.4.0` y abrir PR hacia `main` usando **Create a merge commit** (nunca squash).
2. Esperar y verificar que pasen todos los checks de GitHub Actions sobre la cabeza de `release/0.4.0`, incluidos:
   - `M1 E2E (Chromium + PostgreSQL 16)`
   - `CI gate (required)`
   - `OPS M1 Compose runtime` (`compose-runtime` con PostgreSQL 16 y persistencia tras reinicio)
3. Una vez autorizado y ejecutado el merge commit hacia `main`, verificar el SHA exacto de `main` y crear el tag anotado `v0.4.0`:

```powershell
git fetch origin --tags
git switch main
git pull --ff-only origin main
$mainSha = (git rev-parse HEAD).Trim()
git tag -a v0.4.0 $mainSha -m "DevPath v0.4.0 - deterministic learning paths and M4 closure"
git push origin v0.4.0
```

4. Publicar la GitHub Release `v0.4.0` apuntando al tag `v0.4.0` con las notas de la sección `0.4.0` de `CHANGELOG.md`.
5. Sincronizar `main → develop` mediante PR con **Create a merge commit** (o merge fast-forward/merge commit autorizado hacia `develop`) y verificar que `develop` contiene el SHA publicado en `main`.
