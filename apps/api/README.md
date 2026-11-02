# DevPath API

The Express/TypeScript API is the browser's public backend. It owns authentication, profile and skill data, saved analyses, and PostgreSQL access. It calls the separate Skill Engine over internal REST for manual job text analysis. JSearch integration for the jobs module is planned for M3 and is not implemented.

## Current routes

Routes below are mounted under `/api/v1`. The API also exposes `GET /health/live` and `GET /health/ready` outside that prefix.

| Method      | Path                    | Authentication  | Purpose                                          |
| ----------- | ----------------------- | --------------- | ------------------------------------------------ |
| POST        | `/auth/register`        | No bearer token | Create an account and session                    |
| POST        | `/auth/login`           | No bearer token | Start a session                                  |
| POST        | `/auth/refresh`         | Refresh cookie  | Rotate the session and return a new access token |
| POST        | `/auth/logout`          | Refresh cookie  | End the session                                  |
| GET, PATCH  | `/me`                   | Bearer JWT      | Read or update the current profile               |
| GET         | `/skills`               | Bearer JWT      | List catalog skills                              |
| GET, PUT    | `/me/skills`            | Bearer JWT      | Read or replace the user's skills                |
| POST, GET   | `/analyses`             | Bearer JWT      | Create a manual analysis or list saved analyses  |
| GET, DELETE | `/analyses/:analysisId` | Bearer JWT      | Read or delete one owned analysis                |

The [public OpenAPI contract](../../packages/contracts/openapi/public.yaml) defines request and response shapes. The web analysis pages are not yet connected to these analysis routes. Jobs endpoints are planned in [M3](../../docs/PLAN_DE_IMPLEMENTACION.md) and must not be presented as available.

## Setup and checks

Follow the [local setup guide](../../docs/SETUP_LOCAL.md) to create keys, configure PostgreSQL, run migrations and seed data. The API requires `DATABASE_URL` and `AUTH_PRIVATE_KEY_FILE`. It also uses `ENGINE_URL` and `ENGINE_SERVICE_SECRET` to reach the Skill Engine; set the same service secret on both processes. `CORS_ALLOWED_ORIGINS` and `AUTH_LOCAL_HTTP` control local browser access and cookie behavior. Do not commit secrets.

```powershell
pnpm --filter @devpath/api dev
pnpm --filter @devpath/api test
pnpm --filter @devpath/api build
```

The default local address is `127.0.0.1:3000`. Set `TEST_DATABASE_URL` to a migrated, isolated database to run database integration tests. The E3 task batches will extend this README with the jobs endpoint table, provider environment variables, and request examples when those routes exist.
