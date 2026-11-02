# Database

This package contains the PostgreSQL schemas, versioned migrations, connection pool, catalog seed, and test factory used by DevPath. The M1 database foundation is implemented; the API is the only application process that accesses PostgreSQL. Migrations for projects, CV, jobs, and learning paths belong to later milestones.

From the repository root, configure `DATABASE_URL` for a DevPath database, then run:

```powershell
pnpm --filter @devpath/db migrate
pnpm --filter @devpath/db seed
```

Use a separate database for integration tests. See the [local setup guide](../../docs/SETUP_LOCAL.md). Owner: P1.
