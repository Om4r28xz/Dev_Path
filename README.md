# DevPath

DevPath helps students and junior developers compare their skills with technologies mentioned in a job posting. Matching uses a versioned technology catalog and deterministic rules; it is not a hiring prediction or a generative AI feature.

## Current status

The repository is in active M1 development. Registration, login, session handling, profile and skills are connected to the web app. The API and Skill Engine support manual job text analysis, and the API supports saved analysis history. The analysis screens in the web app are still placeholders; connecting them is part of the remaining M1 work. M1 has not been released yet.

| Milestone | Scope                                                           | Status                                        |
| --------- | --------------------------------------------------------------- | --------------------------------------------- |
| M0        | Workspace, contracts, catalog, database, infrastructure, and CI | Integrated                                    |
| M1        | Authentication, profile, skills, manual analysis, and history   | In progress                                   |
| M2        | Projects and private PDF résumé                                 | Planned                                       |
| M3        | Job search and analysis through JSearch                         | Planned; subject to provider access and terms |
| M4        | Deterministic learning paths and progress                       | Planned                                       |

The [implementation plan](docs/PLAN_DE_IMPLEMENTACION.md), [task batches](docs/LOTES_PARA_IAS.md), and [handoffs](docs/handoffs/) distinguish completed work from planned work. The E3 microservice requirements are assigned to pending tasks in batches 06, 08, and 09; the `e3-microservice` tag has not been created.

## Architecture

```text
Browser → React/Vite → /api/v1 → Express API → PostgreSQL
                                     └────────→ Skill Engine (internal REST)
```

The API and Skill Engine run as separate processes. Authentication is a module of the API. The browser uses only the public API. In M3, the API is planned to call JSearch for the jobs module; the browser and Skill Engine will not call JSearch directly. See the [architecture decisions](docs/adr/) and [project responsibilities](docs/RESPONSABILIDADES.md).

## Run locally

Use Node.js `>=22.16 <23` and pnpm `11.22.0`. The full [local setup guide](docs/SETUP_LOCAL.md) covers environment variables, local keys, PostgreSQL migrations, seed data, and Docker Compose. Configure the required services before starting the application.

```powershell
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Start the development processes in separate terminals after completing setup:

```powershell
pnpm dev:engine
pnpm dev:api
pnpm dev:web
```

By default, the web app uses port 5173, the API uses port 3000, and the Skill Engine uses port 3001. The [API README](apps/api/README.md) describes the implemented routes; the [Skill Engine README](apps/skill-engine/README.md) describes its internal endpoint. The [public OpenAPI contract](packages/contracts/openapi/public.yaml) is the source of truth for API request and response shapes.

## Contributing

Work starts from `develop` and returns through a pull request. `main` is reserved for approved releases and hotfixes. Read the [Git workflow](docs/FLUJO_GITHUB.md) and the [task backlog](docs/TAREAS_PARA_IAS.md) before taking a task. Check the current Git history and task handoff rather than treating an old handoff as the live status.

Do not commit `.env` files, private keys, tokens, passwords, personal data, résumés, logs, or local database volumes. Examples and test fixtures must use synthetic data.
