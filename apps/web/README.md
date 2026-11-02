# DevPath Web

React/Vite/TypeScript client for DevPath. It calls the public API through relative `/api/v1` URLs and does not access PostgreSQL, the Skill Engine, or JSearch directly.

Registration, login, session handling, profile editing, skill selection, analysis creation, saved history, detail, and deletion are connected to the API. The analysis screens were integrated in batch 05; full M1 acceptance and release remain in batch 06. Projects, CV, jobs, and learning paths are later milestones.

- Owner: P2.
- Development: `pnpm --filter @devpath/web dev`.
- Build: `pnpm --filter @devpath/web build`.
- Default local address: `127.0.0.1:5173`.

See the [local setup guide](../../docs/SETUP_LOCAL.md) for the API, database, and Skill Engine prerequisites.
