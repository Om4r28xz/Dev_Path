# Skill Engine

Servicio REST interno en TypeScript. La base M0 separa `app` de `server`, valida el puerto y expone únicamente `/health`. El análisis determinista se implementará después de CTR-01 y CAT-01. No puede importar la capa de DB ni recibir datos personales.

- Responsable: P2.
- Etapas: frontera técnica M0; matching M1.
- Desarrollo: `pnpm --filter @devpath/skill-engine dev`.
- Build: `pnpm --filter @devpath/skill-engine build`.
- Puerto predeterminado: `127.0.0.1:3001`.
- Estado: base técnica M0 implementada; matching pendiente.
