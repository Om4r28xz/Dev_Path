# API

API principal Express/TypeScript. La base M0 separa `app` de `server`, valida el puerto y expone únicamente `/health`. Auth, dominios M1–M4 y acceso PostgreSQL siguen pendientes.

- Responsable: P1.
- Etapas: base M0; funcionalidades M1–M4 según cada módulo.
- Desarrollo: `pnpm --filter @devpath/api dev`.
- Build: `pnpm --filter @devpath/api build`.
- Puerto predeterminado: `127.0.0.1:3000`.
- Estado: base técnica M0 implementada; sin funciones de negocio.
