# DevPath API

The Express/TypeScript API is the browser's public backend. It owns authentication, profile and skill data, saved analyses, and PostgreSQL access. It calls the separate Skill Engine over internal REST for manual job text analysis. JSearch integration for the jobs module is planned for M3 and is not implemented.

## Current routes

Routes below are mounted under `/api/v1`. The API also exposes `GET /health/live` and `GET /health/ready` outside that prefix.

| Method           | Path                    | Authentication  | Purpose                                                  |
| ---------------- | ----------------------- | --------------- | -------------------------------------------------------- |
| POST             | `/auth/register`        | No bearer token | Create an account and session                            |
| POST             | `/auth/login`           | No bearer token | Start a session                                          |
| POST             | `/auth/refresh`         | Refresh cookie  | Rotate the session and return a new access token         |
| POST             | `/auth/logout`          | Refresh cookie  | End the session                                          |
| GET, PATCH       | `/me`                   | Bearer JWT      | Read or update the current profile                       |
| GET              | `/skills`               | Bearer JWT      | List catalog skills                                      |
| GET, PUT         | `/me/skills`            | Bearer JWT      | Read or replace the user's skills                        |
| POST, GET        | `/analyses`             | Bearer JWT      | Create a manual analysis or list saved analyses          |
| GET, DELETE      | `/analyses/:analysisId` | Bearer JWT      | Read or delete one owned analysis                        |
| GET, PUT, DELETE | `/me/cv`                | Bearer JWT      | Read metadata, upload/replace, or delete one private PDF |
| GET              | `/me/cv/download`       | Bearer JWT      | Stream the owner's PDF as an attachment                  |

The [public OpenAPI contract](../../packages/contracts/openapi/public.yaml) defines M1 request and response shapes; the [M2 contract](../../packages/contracts/openapi/m2.yaml) defines the private CV routes. The web analysis pages now use the analysis routes. Jobs endpoints are planned in [M3](../../docs/PLAN_DE_IMPLEMENTACION.md) and must not be presented as available.

## Setup and checks

Follow the [local setup guide](../../docs/SETUP_LOCAL.md) to create keys, configure PostgreSQL, run migrations and seed data. The API requires `DATABASE_URL` and `AUTH_PRIVATE_KEY_FILE`. Set `CV_STORAGE_DIR` to a private persistent directory outside the webroot; it is required in production. Compose mounts the private `cv_files` volume there. The API also uses `ENGINE_URL` and `ENGINE_SERVICE_SECRET` to reach the Skill Engine; set the same service secret on both processes. `CORS_ALLOWED_ORIGINS` and `AUTH_LOCAL_HTTP` control local browser access and cookie behavior. Do not commit secrets or PDFs.

```powershell
pnpm --filter @devpath/api dev
pnpm --filter @devpath/api test
pnpm --filter @devpath/api build
```

The default local address is `127.0.0.1:3000`. Set `TEST_DATABASE_URL` to a migrated, isolated database to run database integration tests. The E3 task batches will extend this README with the jobs endpoint table, provider environment variables, and request examples when those routes exist.
