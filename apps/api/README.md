# DevPath API

The Express/TypeScript API (`apps/api`) is the browser's public backend and the REST service evaluated for E3 job search integration. It owns authentication, profile and skill data, projects, private CV storage, saved analyses, PostgreSQL access, and the server-side `JobsProvider` adapter (`fixture` / `live`). It calls the separate Skill Engine over internal REST for skill gap analysis. The browser never accesses PostgreSQL, the Skill Engine, or JSearch directly.

## Current routes

Routes below are mounted under `/api/v1`. The API also exposes `GET /health/live` and `GET /health/ready` outside that prefix (health checks do not count as business operations for E3).

| Method             | Path                    | Authentication  | Purpose                                                                |
| ------------------ | ----------------------- | --------------- | ---------------------------------------------------------------------- |
| POST               | `/auth/register`        | No bearer token | Create an account and session                                          |
| POST               | `/auth/login`           | No bearer token | Start a session                                                        |
| POST               | `/auth/refresh`         | Refresh cookie  | Rotate the session and return a new access token                       |
| POST               | `/auth/logout`          | Refresh cookie  | End the session                                                        |
| GET, PATCH         | `/me`                   | Bearer JWT      | Read or update the current profile                                     |
| GET                | `/skills`               | Bearer JWT      | List catalog skills                                                    |
| GET, PUT           | `/me/skills`            | Bearer JWT      | Read or replace the user's skills                                      |
| GET, POST          | `/projects`             | Bearer JWT      | List or create owned portfolio projects                                |
| GET, PATCH, DELETE | `/projects/:id`         | Bearer JWT      | Read, update, or delete one owned project                              |
| GET, PUT, DELETE   | `/me/cv`                | Bearer JWT      | Read metadata, upload/replace, or delete one private PDF               |
| GET                | `/me/cv/download`       | Bearer JWT      | Stream the owner's PDF as an attachment                                |
| GET                | `/jobs`                 | Bearer JWT      | Search normalized job listings (`q`, `location`, `cursor`)             |
| GET                | `/jobs/details`         | Bearer JWT      | Fetch one normalized job by opaque `providerId`                        |
| POST, GET          | `/analyses`             | Bearer JWT      | Create a manual (`text`) or provider (`jsearch`) analysis, or list own |
| GET, DELETE        | `/analyses/:analysisId` | Bearer JWT      | Read or delete one owned analysis                                      |

### E3 business endpoints (JSR-02 & JSR-03)

See the reproducible request collection in [`requests/e3-jsearch.http`](./requests/e3-jsearch.http) for complete headers, payloads, and expected synthetic responses.

| #   | Method | Endpoint               | Auth       | Request example                                                                                                      | Expected response summary                                                                                                                                              |
| --- | ------ | ---------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | GET    | `/api/v1/jobs`         | Bearer JWT | `GET /api/v1/jobs?q=react&location=Remoto&page=1`                                                                    | `200 OK` `{ items: [Job], page: 1, hasNextPage: boolean, nextCursor: string\|null, mode: "fixture"\|"live" }`; `401` without JWT; `429`/`503`/`504` on provider errors |
| 2   | GET    | `/api/v1/jobs/details` | Bearer JWT | `GET /api/v1/jobs/details?providerId=synthetic-job-001`                                                              | `200 OK` `{ job: Job, mode: "fixture"\|"live" }`; `400` on arbitrary URL; `401` without JWT; `404` when job does not exist                                             |
| 3   | POST   | `/api/v1/analyses`     | Bearer JWT | `POST /api/v1/analyses` (`Idempotency-Key: <uuid>`) `{"source":{"type":"jsearch","providerId":"synthetic-job-001"}}` | `201 Created` (`200 OK` on idempotent replay) returning common `Analysis` DTO (`source.type="jsearch"`); `401` without JWT; `503` if live retention is not permitted   |

The [public OpenAPI contract](../../packages/contracts/openapi/public.yaml) defines M1 request and response shapes; the [M2 contract](../../packages/contracts/openapi/m2.yaml) defines projects and private CV routes; [m3-proposed.yaml](../../packages/contracts/openapi/m3-proposed.yaml) and [ADR 0005](../../docs/adr/0005-jobs-pagination-cursor.md) define the jobs search/details, confidential AES-256-GCM cursor pagination (`nextCursor`), and `jsearch` analysis creation.

## Setup and environment variables

Follow the [local setup guide](../../docs/SETUP_LOCAL.md) to create keys, configure PostgreSQL, run migrations and seed data.

- `DATABASE_URL` and `AUTH_PRIVATE_KEY_FILE`: required for PostgreSQL and JWT signing.
- `CV_STORAGE_DIR`: private persistent directory outside the webroot (required in production; Compose mounts `cv_files`).
- `ENGINE_URL` and `ENGINE_SERVICE_SECRET`: internal Skill Engine endpoint and shared service secret.
- `CORS_ALLOWED_ORIGINS` and `AUTH_LOCAL_HTTP`: browser origin allowlist and local HTTP cookie flag.
- `JOBS_PROVIDER_MODE`: `fixture` (default) or `live`. Never expose provider credentials to the browser.
- `JOBS_LIVE_ENABLED`: must be `'true'` alongside `RAPIDAPI_KEY` to allow outbound requests to the fixed host `https://jsearch.p.rapidapi.com` (`num_pages=1`, 5 s timeout, 1 MiB response cap, zero automatic retries on `429`). Remains disabled by default while JSR-01 account/retention permissions are pending.
- `JOBS_LIVE_RETENTION_ALLOWED`: must be `'true'` to permit persisting analyses created from `live` JSearch vacancies (`POST /api/v1/analyses` with `source.type="jsearch"`). While JSR-01 retention permission is pending, `fixture` mode persists synthetic demo snapshots and `live` mode rejects persistence with `503 DEPENDENCY_UNAVAILABLE` without affecting manual text analysis (`source.type="text"`).
- `RAPIDAPI_KEY`: server-only credential for JSearch on RapidAPI (never use a `VITE_` prefix or log its value).
- `JOBS_CURSOR_KEY`: 32-byte secret (hex, base64url, or passphrase >= 32 bytes; required in production) used to encrypt/authenticate `j1.<base64url>` pagination cursors with AES-256-GCM (15-minute TTL, bound to user and normalized query).
- `JOBS_DEFAULT_COUNTRY` / `JOBS_DEFAULT_LANGUAGE`: fixed provider locale defaults (`mx` / `es`).

```powershell
pnpm --filter @devpath/api dev
pnpm --filter @devpath/api test
pnpm --filter @devpath/api build
```

The default local address is `127.0.0.1:3000`. Set `TEST_DATABASE_URL` to a migrated, isolated database to run database integration tests.
