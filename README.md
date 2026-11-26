# EMR

An API-first, multi-tenant hospital management system. A **Tenant** is a hospital group, and each
Tenant holds one or more **Facilities**. All clinical and operational data is scoped to a Tenant.

Built with Next.js (App Router), TypeScript, PostgreSQL through Drizzle ORM, BetterAuth, Zod,
Tailwind CSS and shadcn/ui. Bun is the package manager and script runner.

## Setup

Requirements: [Bun](https://bun.sh) and a PostgreSQL database (a second one for integration tests).

```bash
bun install
cp .env.example .env   # then fill in the values below
bun run db:migrate     # apply migrations to DATABASE_URL
bun run db:seed        # optional: seed reference data
bun run dev            # http://localhost:3000
```

Create an account at `/signup`. Signing up provisions a new Tenant and makes you its Tenant Owner.
The API reference is served at `/swagger`.

## Environment variables

See `.env.example` for the full list with example values.

| Variable                          | Required | Purpose                                                                               |
| --------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| `DATABASE_URL`                    | Yes      | PostgreSQL connection string for the app.                                             |
| `BETTER_AUTH_SECRET`              | Yes      | Random secret of 32+ characters for BetterAuth.                                       |
| `BETTER_AUTH_URL`                 | Yes      | Base URL of the app, e.g. `http://localhost:3000`.                                    |
| `TEST_DATABASE_URL`               | Tests    | Database for integration tests. Its name must contain `test`; the suite truncates it. |
| `BLOB_READ_WRITE_TOKEN`           | Uploads  | Vercel Blob token for Visit document uploads.                                         |
| `LOGIN_LOGO_VARIANT`              | No       | `dhathri-ayurvedic` (default), `dhathri-gram` or `none`.                              |
| `AUTH_SHOW_CREATE_WORKSPACE_LINK` | No       | `true` shows the create-workspace link on auth screens.                               |
| `AUTH_SHOW_BACK_TO_SITE_LINK`     | No       | `true` shows the back-to-site link on auth screens.                                   |
| `SIDEBAR_APPOINTMENTS_ONLY`       | No       | Defaults to `true` (reduced sidebar). Set `false` for the full menu.                  |
| `SIDEBAR_SHOW_VISITS`             | No       | `true` adds Reports to the reduced sidebar (each page follows its own Permission).    |
| `ENABLE_DEMO_PAGES`               | No       | `true` enables the static-data demo pages. Keep it off in production.                 |
| `ANALYTICS_ENABLED`               | No       | `true` turns on product analytics. Read `docs/analytics.md` first.                    |
| `POSTHOG_PROJECT_KEY`             | No       | PostHog project key, used only when analytics is enabled.                             |
| `POSTHOG_HOST`                    | No       | PostHog ingestion host. Defaults to PostHog Cloud EU.                                 |

## Commands

```bash
bun run dev            # development server
bun run build          # production build
bun run lint           # ESLint
bun run format:check   # Prettier check (bun run format writes)
bunx tsc --noEmit      # type check
```

Database:

```bash
bun run db:generate    # generate a migration from schema changes
bun run db:migrate     # apply pending migrations
bun run db:deploy      # check, then migrate (CI and production)
bun run db:studio      # Drizzle Studio
```

Tests (Vitest):

```bash
bun run test:unit         # unit tests, no database needed
bun run test:db:migrate   # migrate TEST_DATABASE_URL before integration tests
bun run test:integration  # repository tests against TEST_DATABASE_URL
bun run test              # everything
```

Test files must end in `*.unit.tests.ts` or `*.integration.tests.ts`. Any other suffix is not run.

## Where to read next

- [`CLAUDE.md`](CLAUDE.md): architecture, module layout, multi-tenancy and testing rules.
- [`CONTEXT.md`](CONTEXT.md): the domain glossary. Use its terms exactly.
- [`DESIGN.md`](DESIGN.md): the UI design system.
- [`docs/backend-testing.md`](docs/backend-testing.md): how to write backend tests.
- [`docs/adr/`](docs/adr/): architecture decision records.
- [`lessons.md`](lessons.md): lessons learned and historical fixes.
