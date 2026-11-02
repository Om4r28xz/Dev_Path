# Local infrastructure

The [Compose file](compose.yaml), [proxy configuration](proxy/default.conf), and Dockerfiles under [docker/](docker/) support the local DevPath demo. Compose runs the web app, API, Skill Engine, PostgreSQL, migrations, and catalog seed. The proxy publishes the web app and `/api`; it does not expose the Skill Engine's `/internal` routes.

Run `node scripts/setup-local.mjs` from the repository root to create local configuration and keys, then follow the [local setup guide](../docs/SETUP_LOCAL.md). Configuration and keys stay out of Git. A complete Compose smoke test and release acceptance are still pending; the presence of this configuration does not mean M1 has been released.

Owner: P2, reviewed by P1.
