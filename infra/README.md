# Local infrastructure

The [Compose file](compose.yaml), [proxy configuration](proxy/default.conf), and Dockerfiles under [docker/](docker/) support the local DevPath demo. Compose runs the web app, API, Skill Engine, PostgreSQL, migrations, and catalog seed. The proxy publishes the web app and `/api`; it does not expose the Skill Engine's `/internal` routes.

Run `node scripts/setup-local.mjs` from the repository root to create local configuration and keys, then follow the [local setup guide](../docs/SETUP_LOCAL.md). Configuration and keys stay out of Git. The official Compose probe in `docs/acceptance/probes/ops-compose.mjs` is exercised in GitHub Actions with PostgreSQL 16 and covers proxy access, registration, analysis, persistence after restart, M2/M4 data and Skill Engine recovery. A local configuration file by itself is not evidence of a successful runtime; use the probe or the documented smoke steps.

Owner: P2, reviewed by P1.
