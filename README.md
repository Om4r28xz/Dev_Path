# DevPath

DevPath helps students and junior developers compare their skills with technologies mentioned in a job posting. Matching uses a versioned technology catalog and deterministic rules; it is not a hiring prediction or a generative AI feature.

## Current status

DevPath `v0.4.0` is published and synchronized between `main` and `develop`. The released application includes the complete M1-M4 scope. JSearch fixture mode remains the safe default; a bounded live verification is documented, but live traffic and retention require explicit backend configuration and provider permission.

| Milestone | Scope                                                           | Status                                    |
| --------- | --------------------------------------------------------------- | ----------------------------------------- |
| M0        | Workspace, contracts, catalog, database, infrastructure, and CI | Integrated                                |
| M1        | Authentication, profile, skills, manual analysis, and history   | Published in `v0.1.0`                     |
| M2        | Projects and private PDF résumé                                 | Published in `v0.2.0`                     |
| M3        | Job search and analysis through JSearch                         | Published in `v0.3.0`; fixture by default |
| M4        | Deterministic learning paths and progress                       | Published in `v0.4.0`                     |

The [v0.4.0 release](https://github.com/Om4r28xz/Dev_Path/releases/tag/v0.4.0), [implementation plan](docs/PLAN_DE_IMPLEMENTACION.md), [acceptance results](docs/acceptance/), and [handoffs](docs/handoffs/) provide the release and verification history. The `e3-microservice` tag records the independently verified external-integration milestone.

## Architecture

```text
Browser → React/Vite → /api/v1 → Express API → PostgreSQL
                                     ├────────→ Skill Engine (internal REST)
                                     └────────→ JSearch (backend-only, explicitly gated)
```

The API and Skill Engine run as separate processes. Authentication is a module of the API, not a standalone microservice. The browser uses only the public API. The API-owned JobsProvider is the only component that can call JSearch; the browser and Skill Engine never receive its credential. See the [implemented architecture](docs/ARCHITECTURE.md), [architecture decisions](docs/adr/) and [project responsibilities](docs/RESPONSABILIDADES.md).

## Run locally

Use Node.js `>=22.16 <23` and pnpm `11.22.0`. The full [local setup guide](docs/SETUP_LOCAL.md) covers environment variables, local keys, PostgreSQL migrations, seed data, and Docker Compose. Configure the required services before starting the application.

```powershell
pnpm install --frozen-lockfile
node scripts/setup-local.mjs
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

By default, the web app uses port 5173, the API uses port 3000, and the Skill Engine uses port 3001. The [API README](apps/api/README.md) describes the implemented routes; the [Skill Engine README](apps/skill-engine/README.md) describes its internal endpoint. The [contract package](packages/contracts/README.md) links the validated public, M2, jobs, learning-path, and internal OpenAPI documents and their examples.

## Contributing

Work starts from `develop` and returns through a pull request. `main` is reserved for approved releases and hotfixes. Read the [Git workflow](docs/FLUJO_GITHUB.md) and the [task backlog](docs/TAREAS_PARA_IAS.md) before taking a task. Check the current Git history and task handoff rather than treating an old handoff as the live status.

Do not commit `.env` files, private keys, tokens, passwords, personal data, résumés, logs, or local database volumes. Examples and test fixtures must use synthetic data.
