# @cm/api

The cimarket API: a Cloudflare Workers service built with Hono and Prisma, backed by
a Neon Postgres database.

## Tech stack

- **Runtime:** Cloudflare Workers
- **Framework:** [Hono](https://hono.dev)
- **ORM:** Prisma 7, via the [Neon](https://neon.tech) serverless driver adapter
- **Validation:** Zod, via shared schemas from `@cm/validation`
- **Language:** TypeScript (strict)

## Project structure

```
apps/api/
├── prisma/
│   ├── schema.prisma      # Data model
│   ├── migrations/        # SQL migrations
│   ├── seed.ts             # Fake data for local development (--import / --delete)
│   └── seed-data/          # Static seed data (categories, cities, ...)
├── src/
│   ├── index.ts            # App entry point: routes, middleware, scheduled handler
│   ├── routes/              # One Hono router per resource (e.g. userRoutes.ts)
│   ├── services/            # Business logic + Prisma calls, framework-agnostic
│   ├── middlewares/          # Hono middleware (Prisma injection, error handling)
│   ├── lib/                  # Shared helpers (validation, query building, errors)
│   ├── jobs/                 # Scheduled (cron) job handlers
│   └── types/                 # Shared Hono types (AppEnv, AppContext)
└── wrangler.jsonc            # Cloudflare Workers configuration
```

## Getting started

```bash
# From the repo root
pnpm install

# Set up secrets
cp apps/api/.dev.vars.example apps/api/.dev.vars
# fill in DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
# JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# Apply migrations and generate the Prisma clients
pnpm --filter api prisma:migrate
pnpm --filter api prisma:gen

# Run the dev server
pnpm --filter api dev
```

## Scripts

| Command                  | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| `pnpm dev`               | Run the API locally with `wrangler dev`                     |
| `pnpm deploy`            | Deploy to the `dev` Cloudflare environment                  |
| `pnpm deploy:prod`       | Deploy to the `production` Cloudflare environment           |
| `pnpm typecheck`         | Type-check with `tsc --noEmit`                              |
| `pnpm lint` / `lint:fix` | Lint (and autofix) with ESLint                              |
| `pnpm prisma:migrate`    | Create/apply a migration (`prisma migrate dev`)             |
| `pnpm prisma:gen`        | Regenerate both Prisma clients (see "Prisma clients" below) |
| `pnpm prisma:studio`     | Open Prisma Studio                                          |
| `pnpm seed:import`       | Load fake data (users, products, conversations, ...)        |
| `pnpm seed:delete`       | Wipe all seeded data                                        |

`pnpm prisma` is a thin wrapper that loads `.dev.vars` before running any Prisma CLI
command — use it for anything not already covered by a script above, e.g.
`pnpm --filter api prisma db execute --file <path>`.

## Database

The schema lives in `prisma/schema.prisma` and is documented inline (soft-delete
policy, retention notes, etc. are recorded as `///` comments on the relevant
models). A few things worth knowing before touching it:

- **Soft delete only.** `User` — and, by convention, most resources — are never
  hard-deleted. Deletion sets `isDeleted` / `deletedAt` and scrubs identifying
  fields (see `email`/`googleId` handling in `user.service.ts`'s `remove`).
  Every foreign key back to `User` uses `onDelete: Restrict` accordingly.
- **CHECK constraints are hand-written.** Prisma can't declare `CHECK` in the
  schema (e.g. `buyer_id <> seller_id`, `rating BETWEEN 1 AND 5`). These live in
  raw SQL inside specific migration files — if you regenerate a migration that
  touches those tables, re-check the constraint survived.
- **Two Prisma clients are generated from the same schema** (see the two
  `generator` blocks): one targets the Cloudflare Workers runtime (used by the
  app itself, `src/generated/prisma`), the other targets plain Node
  (`src/generated/prisma-node`, used only by `prisma/seed.ts`, which runs
  outside Workers). Run `pnpm prisma:gen` after any schema change to regenerate
  both.

## Adding a resource

Each resource (`user`, and eventually `product`, `conversation`, etc.) follows the
same shape:

1. **Schema** — add `<resource>/schema.ts` + `<resource>/constants.ts` to
   `packages/validation/src`, exporting a create schema, a partial/update schema,
   and (if the resource supports listing) a query schema built from
   `sortQueryParam`/`fieldsQueryParam`/`baseQuery` in `fields.ts`.
2. **Service** — `src/services/<resource>.service.ts`: plain functions
   `(prisma: PrismaClient, ...) => ...`. No Hono types here — services only know
   about Prisma and the validated data shapes from `@cm/validation`.
3. **Routes** — `src/routes/<resource>Routes.ts`: a single chained
   `new Hono<AppEnv>()...` (chaining matters — see "Conventions" below), using
   `validate(target, schema)` from `@/lib/validate` on every route that takes
   input, and calling into the service.
4. **Mount it** in `src/index.ts` via `.route('/api/v1/<resource>', router)`.

## Conventions

- **Routes stay chained.** `userRoutes.ts` and `index.ts` build the Hono app as
  one chained expression (`new Hono().get(...).post(...)`) instead of separate
  statements. This is required for Hono's RPC client (`hono/client`) to infer
  the full route/type map from `AppType` — breaking the chain silently drops
  routes from that inferred type.
- **No controllers.** Handlers live directly in the route file; only the
  Prisma-touching logic is pulled out into `services/`. This matches Hono's own
  guidance against a separate MVC-style controller layer, since splitting
  `zValidator`/`c.req.valid()` usage across files breaks type inference.
- **Errors are thrown, not returned.** Throw `AppError` (or a subclass —
  `NotFoundError`, `ConflictError`, `ValidationError`, `UnauthorizedError` — see
  `src/lib/AppError.ts`) or let Hono's own `HTTPException` propagate. The single
  `errorHandler` (`src/middlewares/errorHandler.ts`), wired via `.onError()` in
  `index.ts`, is the only place that maps errors to an HTTP response —
  including translating specific Prisma error codes (`P2002`, `P2025`, `P2003`)
  into friendly, Spanish, per-model messages.
- **Validation goes through `validate()`**, not `@hono/zod-validator` directly.
  `src/lib/validate.ts` is a thin wrapper over `hono/validator` built specifically
  so it can be reused as a factory (`validate(target, schema)`) without losing
  `c.req.valid()`'s type inference — `@hono/zod-validator`'s own hook type
  breaks when wrapped this way.
- **Pagination/sort/select go through `buildFindManyArgs`**
  (`src/lib/queryFeatures.ts`), fed by a query schema built with
  `sortQueryParam`/`fieldsQueryParam` from `@cm/validation`. Sort and field
  selection are always validated against an explicit allow-list per resource —
  never pass a client-supplied field name straight to Prisma.

## Scheduled jobs

`src/jobs/retention.ts` runs on Cloudflare's Cron Trigger (configured under
`env.production.triggers.crons` in `wrangler.jsonc`, currently daily at 03:00
UTC) and purges `Session` rows expired/revoked more than 30 days ago and
`AdminAuditLog` rows older than 365 days. Add new retention policies there as
more models accumulate PII-adjacent history (see the relevant `///` comments in
`schema.prisma`).

## Deployment

`pnpm deploy` / `pnpm deploy:prod` run `wrangler deploy` against the `dev` /
`production` Cloudflare environments defined in `wrangler.jsonc`. Both require
`DATABASE_URL` to be set as a Wrangler secret (`wrangler secret put
DATABASE_URL --env <env>`) — `.dev.vars` is local-only and never deployed.
