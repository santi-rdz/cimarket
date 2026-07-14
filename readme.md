# CIMarket

CIMarket is an exclusive cross-platform marketplace designed for the UABC community,
enabling students to securely buy and sell products using their institutional accounts.

## Tech stack

- **Monorepo:** pnpm workspaces + [Turborepo](https://turbo.build)
- **Mobile:** Expo (SDK 57) + Expo Router + React Native 0.86 / React 19
- **API:** Node + Express 5 + Prisma 7 + Zod
- **Language:** TypeScript (strict) across all packages
- **Tooling:** ESLint + Prettier (shared config in `@cm/config`)

## Repository structure

```
cimarket/
├── apps/
│   ├── api/        # Express + Prisma backend
│   └── mobile/     # Expo app (iOS / Android)
├── packages/
│   ├── config/         # Shared ESLint, Prettier & tsconfig (@cm/config)
│   ├── api-client/     # Typed API client + query keys
│   ├── constants/      # Shared constants
│   ├── types/          # Shared TypeScript types
│   ├── ui/             # Shared UI primitives
│   ├── utils/          # Shared utilities
│   └── validation/     # Shared Zod schemas
├── docker/         # Docker resources
├── compose.yml     # Local services (TODO)
└── turbo.json      # Turbo task pipeline
```

## Requirements

- Node.js >= 20
- pnpm 11 (`corepack enable` recommended)
- For mobile: Expo Go / Xcode / Android Studio as needed

## Getting started

```bash
# 1. Install all workspace dependencies
pnpm install

# 2. Set up env files (see "Environment variables" below)
cp apps/api/.env.example apps/api/.env

# 3. Run the app you need
pnpm --filter mobile dev     # Expo dev server
pnpm --filter mobile ios     # iOS simulator
pnpm --filter mobile android # Android emulator
pnpm --filter mobile web     # Web
```

## Scripts (root)

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `pnpm lint`     | Lint all packages (`turbo run lint`) |
| `pnpm lint:fix` | Lint & autofix all packages          |

Run a task in a single workspace with `pnpm --filter <name> <script>`
(e.g. `pnpm --filter api lint`).

## Environment variables

Secrets live in per-app `.env` files (git-ignored). Each app ships a
`.env.example` documenting the required keys — copy it and fill in real values.

> ⚠️ Never commit `.env` files. `apps/api/.env` is ignored by design.

## Conventions

- Shared lint/format/tsconfig come from `@cm/config` — extend, don't duplicate.
- Mobile: read the versioned Expo docs before writing code
  (see `apps/mobile/AGENTS.md`).

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

| Type       | When to use                                        |
| ---------- | -------------------------------------------------- |
| `FEAT`     | New feature                                        |
| `FIX`      | Bug fix                                            |
| `REFACTOR` | Code change that neither fixes a bug nor adds one  |
| `STYLE`    | Formatting / lint / whitespace (no logic change)   |
| `CHORE`    | Tooling, config, deps, build                       |
| `DOCS`     | Documentation only                                 |
