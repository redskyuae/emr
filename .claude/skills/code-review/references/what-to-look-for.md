# What to look for

Go through the sections that match what the change touches. Each item is a
question to ask of the diff, not a rule to quote. Before reporting a rule,
re-read it in its source (`CLAUDE.md`, the ADR, the docs): this list is a
pointer, and the source wins when they disagree.

## 1. Does it do what it should? (Google: functionality)

- Does the change meet each acceptance criterion in the issue? Name any that
  are missing.
- Walk the main path, then the edges a hospital actually hits: empty Tenant,
  first record, large lists, the record deleted or changed by another user,
  a user without the Permission, an expired Session, a refresh mid-flow.
- Off-by-one and boundary errors: dates and times (time zones, the end of a
  day, a slot that ends at midnight), pagination, inclusive versus exclusive
  ranges.
- Money: amounts stored and computed as integers or decimals as the existing
  billing code does, never floating-point arithmetic on currency.
- State transitions: can a status be reached from a state it shouldn't
  (cancelling a checked-in Appointment, amending a closed Invoice)? Compare
  with the guards in the existing commands of that module.
- Concurrency that is real here: two users booking the same slot, a
  double-clicked submit, two tabs. Is there a transaction, a unique index or
  a status check that stops it?
- Error paths: does every failure return a clean message and the right
  status, or can it fall through to a 500?

## 2. EMR backend rules (CLAUDE.md "Architecture" and "Multi-tenancy")

- **Tenant isolation.** Every new table with Tenant data has `tenantId`.
  Every repository query filters by `tenantId`, including joins, subqueries,
  counts, updates and deletes. A missing filter is Must Fix.
- **`tenantId` comes from the Session** (`requireTenantSession`,
  `requireTenantAdminSession` in `app/api/lib/utils/auth-helpers.ts`), never
  from the body, query string or path.
- **Permissions.** A new or changed route checks the right Permission with
  `requireTenantPermissions` like its sibling routes do. Compare with the
  module's existing routes.
- **Thin routes.** Route handlers parse input, call one command or query and
  return `NextResponse.json<T>()`. Business logic in `route.ts` is a finding.
- **Contracts.** Every `route.ts` has a type-only sibling `types.ts`: no
  runtime code, no `next/server` import, response types imported with
  `import type`.
- **Commands validate first.** The validator runs before any write. A write
  path that can skip it is Must Fix.
- **Validators** return `ValidationResult<T>`, may call repository reads for
  existence and uniqueness, and never contain Drizzle queries.
- **Queries never write.**
- **Repositories own all SQL.** A Drizzle query anywhere else is Must Fix.
- **Result types.** Commands, queries and validators return the unions in
  `app/api/lib/utils/types.ts`; they don't throw or return raw data.
- **Unique constraints with soft delete** use partial unique indexes as
  `lessons.md` describes. Case-insensitive uniqueness where the sibling
  module has it.
- **`23505`** maps to a clean conflict error through
  `isUniqueConstraintViolation` (`app/api/lib/utils/db-errors.ts`), not a 500.
- **Naming.** `delete{Entity}` (soft delete), not `softDelete{Entity}` (ADR
  0012). Schema tables are exported without a `Table` suffix and imported
  `as xxxTable` (ADR 0015).
- **Exact messages.** Validation messages the issue specifies are exact,
  including the submitted value in duplicate errors.
- **Domain terms.** Names and messages use `CONTEXT.md` terms.

## 3. Database and migrations

- A schema change without a generated migration under `app/db/drizzle/`, or
  a hand-edited migration that no longer matches the schema.
- Migrations that drop, rename or rewrite data are one-way: is that
  intended, and is the data preserved?
- A new `NOT NULL` column without a default, or a new unique index, on a
  table that already has rows: will it fail on deploy?
- A backfill or seed for every Tenant: is running it twice safe?
- Indexes for new foreign keys and for the columns the new queries filter on,
  when the table will grow (Appointments, Visits, Invoices, audit rows).

## 4. API documentation (CLAUDE.md "Swagger/OpenAPI documentation")

- Every added, changed or removed `/api/v1` operation is reflected in
  `app/api/lib/openapi/document.ts`: path, method, parameters, request body,
  responses, status codes, auth, and examples for success and the important
  errors.
- Changed validation messages or response shapes are updated in the Swagger
  examples too.
- A changed or removed contract: search `app/queries/` and the screens for
  callers that still expect the old shape.

## 5. Next.js 16 App Router

Confirm against `node_modules/next/dist/docs/` before reporting. Useful files:
`01-app/01-getting-started/05-server-and-client-components.md`,
`15-route-handlers.md`, `16-proxy.md`, `08-caching.md`, `10-error-handling.md`,
`01-app/02-guides/data-security.md`, `environment-variables.md`.

- `params` and `searchParams` are Promises in pages, layouts and route
  handlers and must be awaited (`params: Promise<{ id: string }>`, as in
  `app/(protected)/patients/[id]/page.tsx`).
- Request interception lives in `proxy.ts`, not a new `middleware.ts`.
- `'use client'` sits as low in the tree as it can. A client component must
  not import server-only code (`app/db/**`, `app/api/lib/**` runtime code,
  `app/lib/auth.ts`) or read server environment variables. Brand data comes
  from `BrandProvider`, not `process.env` in client code.
- Data on screens is read through the React Query hooks in `app/queries/`,
  which call `/api/v1` with `credentials: 'same-origin'` and invalidate the
  related query keys after a mutation. A new screen that fetches inline, or
  a mutation that leaves a stale list or slot view, is a finding. Compare
  with `app/queries/appointments/useCancelAppointment.ts`.
- `redirect()`, `notFound()`, `forbidden()` work by throwing. Wrapping them in
  a `try/catch` that swallows the error breaks them.
- `useSearchParams` in a client component that renders on a static route
  needs a `<Suspense>` boundary.
- `next/navigation`, not `next/router`. `next/link` for internal links,
  `next/image` for images.
- Demo pages stay behind `ENABLE_DEMO_PAGES` with `DemoDataBanner` until they
  read real data.

## 6. Screens and React (CLAUDE.md "Frontend" and "Screen composition", DESIGN.md)

- Protected pages live in `app/(protected)/`. `page.tsx` is a thin server
  component. Page components live in the route's `_components/`; sheets in
  `_sheets/`, dialogs in `_modals/`; `_utils/` holds pure TypeScript only.
- Every `page.tsx` has a sibling `loader.tsx` using `Skeleton`, and a change
  to the page's shape updates the loader in the same change.
- Sheet and dialog open state is in the URL via `nuqs` (ADR 0010), one param
  per surface.
- Forms use `react-hook-form` with `zodResolver`, a client schema in
  `_utils/`, `mode: 'onTouched'`, and map server errors with `setError`
  (ADR 0009). Required asterisks follow the API contract for that operation.
- No speculative `export`: an export with no importer is a Chore.
- Themed components in `components/ui/` are used, not forked. Colours and
  spacing come from tokens in `app/globals.css`, not hard-coded values.
- Empty states use the shared `EmptyState` (ADR 0051).
- Hooks: stale closures, missing effect dependencies, effects that should be
  derived state, keys from array indexes on lists that reorder, state that
  resets on every render.
- Accessibility: labels on inputs, `aria-required` with the asterisk,
  keyboard reach for new controls, focus returned when a sheet closes.
- Animations go through the GSAP data-attribute pattern and respect
  `prefers-reduced-motion`.
- A new Session-creating flow marks the tab in `sessionStorage` before it
  navigates to protected UI.

## 7. Security and privacy

- No Patient data, record ids, money amounts or typed text in Analytics
  Events. Every event is declared in `lib/analytics/catalogue.ts` and sent
  through `captureAnalyticsEvent` (ADR 0050, `docs/analytics.md`).
- No Patient data in logs, error messages returned to the client, or URLs.
- No secrets in client bundles, committed files or fixtures.
- User input reaching raw SQL (`sql\`` with interpolation that isn't a
parameter), `dangerouslySetInnerHTML`, file paths or redirects.
- A record fetched by id: is it checked against the Session's Tenant and,
  where the module does it, the Facility?

## 8. Tests (CLAUDE.md "Backend testing policy", docs/backend-testing.md)

- A backend module change ships with its colocated tests in the same change:
  schema, validator, command and query unit tests, and repository
  integration tests. Missing ones are Must Fix.
- File names end `.unit.tests.ts` or `.integration.tests.ts`, **plural**. A
  `*.unit.test.ts`, `*.test.ts` or `*.spec.ts` file never runs: Must Fix,
  because the author thinks it is covered.
- Explicit imports from `vitest`; test names start with `should ...`.
- Tests exercise behaviour through the public interface, not the
  implementation (Matt Pocock's tdd skill). A test that only asserts a mock
  was called, while the behaviour it guards goes unchecked, is a Chore.
- Repository tests cover Tenant isolation, soft-delete filtering and the
  uniqueness constraints the module adds.
- A bug fix comes with a test that fails before the fix.

## 9. Design and complexity (Google: design, complexity; Matt Pocock: deep modules)

- Does this belong here, or in an existing module or `lib/` helper? Search
  before accepting a new helper: duplication of an existing one is a Chore.
- Is anything over-engineered for what the issue needs: options nobody
  passes, a generic layer with one user, a hypothetical seam ("one adapter is
  a hypothetical seam")?
- Is a new module shallow, its interface as complex as its body? Apply the
  deletion test: if deleting it just moves the code to its one caller, it
  isn't earning its keep.
- Would a reader understand this in one pass? Names that say what a thing is
  in domain terms; comments that say why, not what.
- Is a single client component growing into the giant page CLAUDE.md warns
  against?

## 10. What not to report

- Formatting, import order and anything else Prettier or ESLint enforce.
- The pyramid ordering style, unless the engineer asked for it.
- Hypothetical problems with no reachable trigger (SKILL.md Step 4).
- Pre-existing problems the change doesn't touch or worsen.
- A rewrite to your preferred style when the code already follows a pattern
  the codebase uses.
- Anything an ADR decided, unless the change itself contradicts the ADR.
