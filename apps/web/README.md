# DevPath Web

React/Vite/TypeScript client for DevPath. It calls the public API through relative `/api/v1` URLs and does not access PostgreSQL, the Skill Engine, or JSearch directly.

Registration, login, session handling, profile editing, and skill selection are connected to the API. The analysis creation, history, and detail pages are currently placeholders awaiting the remaining M1 web tasks. Projects, CV, jobs, and learning paths are later milestones.

- Owner: P2.
- Development: `pnpm --filter @devpath/web dev`.
- Build: `pnpm --filter @devpath/web build`.
- Default local address: `127.0.0.1:5173`.

See the [local setup guide](../../docs/SETUP_LOCAL.md) for the API, database, and Skill Engine prerequisites.
