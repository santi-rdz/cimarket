# cimarket

cimarket is an exclusive cross-platform marketplace for the UABC community, enabling
students to securely buy and sell products using their institutional accounts.

## Tech stack

- **Monorepo:** pnpm workspaces + [Turborepo](https://turbo.build)
- **API:** Cloudflare Workers + [Hono](https://hono.dev) + Prisma 7 (Neon Postgres) + Zod
- **Mobile:** Expo (SDK 57) + Expo Router + React Native 0.86 / React 19
- **Language:** TypeScript (strict) across all packages
- **Tooling:** ESLint + Prettier (shared config in `@cm/config`)

## Repository structure

```
cimarket/
├── apps/
│   ├── api/          # Cloudflare Workers API (Hono + Prisma)
│   └── mobile/        # Expo app (iOS / Android / web)
├── packages/
│   ├── config/        # Shared ESLint, Prettier & tsconfig (@cm/config)
│   ├── validation/     # Shared Zod schemas (@cm/validation)
│   ├── api-client/    # Typed API client + query keys (in progress)
│   ├── constants/      # Shared constants (planned, not yet implemented)
│   ├── types/          # Shared TypeScript types (planned, not yet implemented)
│   ├── ui/             # Shared UI primitives (planned, not yet implemented)
│   └── utils/          # Shared utilities (planned, not yet implemented)
├── docker/             # Docker resources
├── compose.yml         # Local services
└── turbo.json          # Turbo task pipeline
```

Packages marked "planned" exist only as empty directories reserved for future use —
they have no `package.json` yet and are not part of the pnpm workspace until one is
added.

## Requirements

- Node.js >= 22 (see `.nvmrc`)
- pnpm 11 (`corepack enable` recommended)
- For the API: a Cloudflare account and `wrangler` (installed as a dev dependency)
- For mobile: Expo Go, or Xcode / Android Studio for simulators

## Getting started

```bash
# 1. Install all workspace dependencies
pnpm install

# 2. Set up environment variables
cp apps/api/.dev.vars.example apps/api/.dev.vars
# then fill in real values (see "Environment variables" below)

# 3. Run the app you need
pnpm api:dev                  # API (wrangler dev)
pnpm --filter mobile dev      # Expo dev server
pnpm --filter mobile ios      # iOS simulator
pnpm --filter mobile android  # Android emulator
pnpm --filter mobile web      # Web
```

## Environment variables

- **API** (`apps/api`): secrets are read from `apps/api/.dev.vars` (git-ignored,
  used by `wrangler dev` and by Prisma CLI commands via `dotenv-cli`). Copy
  `apps/api/.dev.vars.example` to `apps/api/.dev.vars` and fill in real values
  for `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`.
- Never commit `.dev.vars` or any other file containing real secrets.

## Scripts (root)

| Command          | Description                                     |
| ---------------- | ----------------------------------------------- |
| `pnpm lint`      | Lint all packages (`turbo run lint`)            |
| `pnpm lint:fix`  | Lint & autofix all packages                     |
| `pnpm typecheck` | Type-check all packages (`turbo run typecheck`) |
| `pnpm api:dev`   | Run the API's dev server (`wrangler dev`)       |

Run a task in a single workspace with `pnpm --filter <name> <script>`
(e.g. `pnpm --filter api typecheck`, `pnpm --filter mobile lint`).

## Conventions

- Shared lint/format/tsconfig come from `@cm/config` — extend, don't duplicate.
- Shared validation schemas live in `@cm/validation`, organized one folder per
  resource (e.g. `user/schema.ts`, `user/constants.ts`), with reusable
  cross-resource helpers in `fields.ts`.
- Mobile: read the versioned Expo docs before writing code
  (see `apps/mobile/AGENTS.md`).
- API-specific conventions (routing, validation, error handling) are documented
  in `apps/api/README.md`.

## Git commit convention

**Format:**

```
TicketNumber-TYPE - Short description
```

**Examples:**

```
C25-FEAT - Add gallery download
C31-FIX - Fix upload validation
C40-REFACTOR - Simplify image service
C50-DOCS - Update README
```

**Commit types:**

| Type       | When to use                                       |
| ---------- | ------------------------------------------------- |
| `FEAT`     | New feature                                       |
| `FIX`      | Bug fix                                           |
| `REFACTOR` | Code change that neither fixes a bug nor adds one |
| `STYLE`    | Formatting / lint / whitespace (no logic change)  |
| `CHORE`    | Tooling, config, deps, build                      |
| `DOCS`     | Documentation only                                |
