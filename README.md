# DevPath

**From your current skills to a clearer path toward your next software job.**

DevPath is a web application for software students, recent graduates, and junior developers. It helps users keep a skills profile, compare that profile with the requirements of a job posting, review evidence of their work, and follow a personalized learning path. It is **not** a job board or a tool that predicts whether someone will be hired.

**Repository:** https://github.com/Om4r28xz/Dev_Path  
**Current tagged release reviewed:** [`v0.4.0`](https://github.com/Om4r28xz/Dev_Path/releases/tag/v0.4.0)  
**Default branch:** `main` · **Development branch:** `develop`

## What the project includes

The `v0.4.0` release documents the following capabilities:

- Account registration, login, session handling, user profile, and registered skills.
- Manual job-description analysis with deterministic technology extraction, matched skills, missing skills, and a compatibility score.
- Saved analysis history and project/portfolio-related features.
- Curated, deterministic learning paths with activities, suggested projects, and progress tracking.
- A jobs integration layer with safe fixture mode as the default. **Live JSearch data is not enabled by default**, and any live integration must follow the provider's permissions and terms.

Skill matching uses a versioned catalog and rules, not generative AI. A compatibility score reflects detected technology overlap; it is **not** a prediction of recruitment success.

## Technology stack

| Component | Technology / location | Responsibility |
| --- | --- | --- |
| Web frontend | React, TypeScript, Vite (`apps/web`) | Interface and requests to the public API |
| Public API | Node.js, Express, TypeScript (`apps/api`) | Authentication, validation, users, analyses, and persistence |
| Skill Engine | Independent internal REST service (`apps/skill-engine`) | Extract technologies and calculate deterministic matches |
| Database | PostgreSQL 16 (`packages/db`) | Persist users, projects, analyses, and learning paths |
| Contracts / catalog | `packages/contracts`, `packages/catalog` | OpenAPI interfaces and canonical technology IDs |
| Infrastructure | Docker Compose, Nginx (`infra/`) | Reproducible local demonstration |
| Automation | GitHub Actions (`.github/workflows/ci.yml`) | Lint, format, typecheck, tests, build, and E2E checks |

The browser calls the **public Express API**, not PostgreSQL or the internal Skill Engine directly.

## Requirements

- Git.
- **Node.js 22.23.4** (supported range `>=22.16.0 <23`).
- **pnpm 11.22.0**.
- **Docker Desktop** with Linux containers and Docker Compose for the complete local demo.
- A terminal such as Windows PowerShell.

If Node.js is managed through `fnm`, activate the project's version in your terminal. Do not replace the Node version used by unrelated projects.

## Clone and install

Open a terminal and run:

```powershell
git clone https://github.com/Om4r28xz/Dev_Path.git
cd Dev_Path
node --version
npm install --global pnpm@11.22.0
pnpm --version
pnpm install --frozen-lockfile
```

If you use `fnm` and need to select the correct Node version first:

```powershell
fnm env --shell powershell | Out-String | Invoke-Expression
fnm install 22.23.4
fnm use 22.23.4
```

For dependency or Windows-specific setup issues, see [Local Setup](docs/SETUP_LOCAL.md).

## Run the full application locally with Docker Compose

This is the **documented, reproducible demonstration path**, rather than a claim of a public cloud deployment. Run these commands **from the repository root**, with Docker Desktop running:

```powershell
# Generate local configuration and keys. Do not commit the output.
node scripts/setup-local.mjs

# Validate and build the Compose configuration.
docker compose --env-file infra/.env -f infra/compose.yaml config --quiet
docker compose --env-file infra/.env -f infra/compose.yaml build

# Create the database, then apply migrations and seed data.
docker compose --env-file infra/.env -f infra/compose.yaml up -d db
docker compose --env-file infra/.env -f infra/compose.yaml run --rm migrate
docker compose --env-file infra/.env -f infra/compose.yaml run --rm seed

# Start the application.
docker compose --env-file infra/.env -f infra/compose.yaml up -d api engine web
docker compose --env-file infra/.env -f infra/compose.yaml ps
```

Open **http://localhost:8080/login** in your browser. The local reverse proxy provides the frontend and forwards `/api/v1/` requests to Express. The database and internal Skill Engine are not exposed publicly by this Compose setup.

Check the basic user flow with **synthetic data**: register, log in, add skills, paste a job description, review its analysis, and inspect saved results or learning paths as applicable to the release. Availability or health checks alone do not prove that matching is correct.

### Stop, start, or restart without deleting data

```powershell
docker compose --env-file infra/.env -f infra/compose.yaml stop
docker compose --env-file infra/.env -f infra/compose.yaml start
docker compose --env-file infra/.env -f infra/compose.yaml restart
```

**Do not use `down -v` as a routine cleanup or rollback command.** The PostgreSQL and private-file volumes contain persistent data.

## Develop without the web container

The supported developer workflow uses a local PostgreSQL instance and three separate processes:

```powershell
pnpm dev:engine
pnpm dev:api
pnpm dev:web
```

Each command runs in a **separate terminal**. Before starting them, follow [Local Setup](docs/SETUP_LOCAL.md) to generate local keys, set the appropriate environment variables in the API and engine terminals, and migrate/seed a database dedicated to development. These processes do **not** automatically load a `.env` file.

Default development ports: web **5173**, API **3000**, Skill Engine **3001**.

## Test and verify

Install dependencies first. The following scripts are defined in the root `package.json`:

```powershell
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

The course also asks for `npm test`. With pnpm installed as required above, you can run it **from the repository root**:

```powershell
npm test
```

`npm test` invokes the repository's `test` script, which delegates to **pnpm**. The project is a pnpm workspace; `npm install` is not the recommended dependency-installation command.

**Database-backed test coverage:** Some integration tests require an isolated PostgreSQL database and the `TEST_DATABASE_URL` configuration. Without it, those tests may be **skipped** rather than passed. The CI test job provisions PostgreSQL 16, applies migrations and seeds, then runs the suite. Do not point tests at the database used for a demo or real personal data.

**End-to-end tests:** The repository also defines `pnpm test:e2e`. They require the appropriate browser/runtime setup; GitHub Actions prepares Chromium and PostgreSQL for this job.

GitHub Actions workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Its aggregate job is named **`CI gate (required)`**. A green result must be checked on the actual pull request and commit; documentation alone does not confirm that branch protection is enabled.

## Release / deployment procedure

The recommended class demonstration is **local Docker Compose**. The sequence is:

1. **Before:** choose the reviewed commit/tag, check tools and secrets, confirm database backup and compatibility.
2. **Deploy:** build images, start PostgreSQL, run migrations and seed, start API, Skill Engine, and web app.
3. **Verify:** check service status, open the login page, and complete a smoke test with synthetic data.
4. **Roll back:** if a release fails, redeploy a known-good compatible version and follow a reviewed database recovery plan. Do not delete volumes or blindly undo migrations.
5. **Record:** document the commit/tag, commands, time, tester, result, and evidence in the team's deployment record.

For detailed local commands, use [Local Setup](docs/SETUP_LOCAL.md). For hosting constraints and alternatives, see [Deployment Options](docs/DEPLOY_OPTIONS.md). **A tagged GitHub release or a local Compose demo is not proof of an Internet-accessible deployment.**

## Repository and collaboration

Development changes normally begin from `develop` in feature branches. They are integrated through reviewed pull requests. `main` is used for releases and hotfixes. Follow [Git Workflow](docs/FLUJO_GITHUB.md) and the current repository rules; do not assume a protection rule is active without verifying GitHub settings.

Project documentation:

- [Local setup](docs/SETUP_LOCAL.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Git workflow](docs/FLUJO_GITHUB.md)
- [API README](apps/api/README.md)
- [Skill Engine README](apps/skill-engine/README.md)
- [Public OpenAPI specification](packages/contracts/openapi/public.yaml)
- [Release notes for v0.4.0](https://github.com/Om4r28xz/Dev_Path/releases/tag/v0.4.0)

## Security and data protection

**Never commit** `.env` files, database URLs containing credentials, private keys, tokens, API keys, private résumés, personal data, local database volumes, or logs containing secrets. Generate local configuration using `node scripts/setup-local.mjs` and keep it outside version control.

Use dummy accounts and synthetic records for screenshots and automated tests. JSearch credentials, when enabled under approved terms, must remain on the server only. The browser must never call private internal endpoints.

---

**DevPath · Unit 4, Evidence 4 — Test and Release a Web App**
