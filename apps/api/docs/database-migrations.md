# Database Migration Workflow

CiMarket uses separate Neon databases for development and production:

| Environment | Neon database | Purpose |
| --- | --- | --- |
| Development | `cimarket-dev` | Local development and schema changes |
| Production | `cimarket-prod` | Live application data |

Each environment must provide its own `DATABASE_URL`. Never use the production URL in local development.

## Development (`cimarket-dev`)

From `apps/api`, update `prisma/schema.prisma`, then create and apply a migration:

```bash
pnpm prisma migrate dev --name <change_name>
```

This updates `cimarket-dev` and creates a migration under `prisma/migrations`.

Review and commit both the schema and the generated migration files:

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: describe database change"
```

## Production (`cimarket-prod`)

Deploy the application with `DATABASE_URL` set to the `cimarket-prod` Neon connection string.

Before starting the new application version, run:

```bash
pnpm prisma migrate deploy
```

`migrate deploy` applies only committed migrations that have not yet been applied to `cimarket-prod`. It does not create new migrations.

## Rules

- Create migrations only with `prisma migrate dev` against `cimarket-dev`.
- Commit every directory under `prisma/migrations`.
- Run `prisma migrate deploy` once per production release.
- Do not run `prisma migrate dev` against `cimarket-prod`.
