@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server with Turbopack (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run the built app
- `npm run lint` — ESLint (flat config via `eslint-config-next`)
- `npx prisma migrate dev --name <name>` — create + apply a dev migration
- `npx prisma migrate deploy` — apply pending migrations (CI/prod)
- `npx prisma generate` — regenerate the Prisma client into `src/generated/prisma`
- `npm run db:seed` (or `npx prisma db seed`) — populate the dev DB from `prisma/seed.ts` (idempotent upserts)

No test runner is configured.

## Stack & versions

- Next.js **16.2.6** (App Router) — see `AGENTS.md`: this is not the Next.js in training data. Consult `node_modules/next/dist/docs/` before writing Next-specific code.
- React 19.2, TypeScript 5, Tailwind CSS v4 (via `@tailwindcss/postcss`)
- Auth.js (`next-auth` v5 beta) with Prisma adapter, database session strategy
- Prisma **7.8** with **PostgreSQL only** (no SQLite, no dev-mode JSON fallback). Schema `provider = "postgresql"`; runtime uses `@prisma/adapter-pg`. `DATABASE_URL` is loaded from `.env` by `dotenv/config` in both `prisma.config.ts` and `src/lib/prisma.ts`. A running Postgres is required to start the app.

## Database setup

The app requires Postgres. Local-dev quick start (macOS, Homebrew):

```
brew install postgresql@16
brew services start postgresql@16
/opt/homebrew/opt/postgresql@16/bin/createdb vision_one
```

Default `.env`:
```
DATABASE_URL="postgresql://<your-os-user>@localhost:5432/vision_one"
```

Then: `npx prisma migrate dev` and `npm run db:seed`.

## Architecture

- **Prisma client lives at `src/generated/prisma`**, not `@prisma/client`. Always import via `@/lib/prisma` (singleton at `src/lib/prisma.ts`) which prevents hot-reload connection leaks in dev. Do not instantiate `PrismaClient` elsewhere. `src/lib/prisma.ts` constructs a `PrismaPg` adapter from a `pg.Pool` and throws if `DATABASE_URL` is unset — there is no offline mode.
- **`src/lib/db-fallback.ts` is a misnomer** — it no longer falls back to JSON. It is now a thin Prisma wrapper kept under that name because ~14 API routes import from it. For the `MaterialCategory` wrappers, the external shape uses `{ category, remark }` while the schema uses `{ name, description }`; the wrapper maps between them. Safe to rename in a follow-up commit (update all importing routes).
- **Per-domain library modules** in `src/lib/<domain>.ts` (`employees.ts`, `materials.ts`, `joint-profiles.ts`, etc.) wrap Prisma directly and are consumed by both API routes and server components. New domain modules should follow the same pattern: call `prisma` from `@/lib/prisma`, no offline fallback.
- **Auth is centralized in `src/lib/auth.ts`** — exports `handlers`, `auth`, `signIn`, `signOut`. The catch-all route `src/app/api/auth/[...nextauth]/route.ts` only re-exports `handlers.GET`/`handlers.POST`. Add OAuth providers inside `NextAuth({ providers: [...] })` in `src/lib/auth.ts`; the custom sign-in page is `/auth/signin`.
- Session strategy is `"database"`, so sessions/accounts/users persist via the Prisma adapter — the schema in `prisma/schema.prisma` defines the required `User`, `Account`, `Session`, `VerificationToken` models. Changing session strategy or adapter requires schema changes.
- TypeScript path alias `@/*` → `src/*`.
- App Router layout: `src/app/layout.tsx` is the root layout (loads Geist fonts + global CSS). The main app shell lives under `src/app/dashboard/{admin,master-profile,production,profiles,sales}` with `src/components/Sidebar.tsx` as the primary navigation.

## Product spec

This repo implements **FITPRISE EMS** — the ERP described in `docs/spec/`. Start at [`docs/spec/README.md`](docs/spec/README.md) for the workflow overview, cross-cutting rules (no DELETE / void-only, latest-exchange-rate, two-tier PO approval, document numbering), and the per-domain file map. Per-domain files: `profiles.md`, `sales-order.md`, `work-order.md`, `production-terminal.md`, `qc-and-ncr.md`, `purchasing.md`, `subcon.md`, `delivery-and-coc.md`, `printouts.md`, `reports.md`. Treat those files as the single source of truth; do not re-read the source PDF unless something there is ambiguous.
