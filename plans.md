# Plans

Write the next implementation plan here.

# Plan: Audit Log (v1)

> Standalone implementation plan. Read `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`, `DESIGN.md`,
> `lessons.md`, and `docs/backend-testing.md` first; they remain the binding _how_. The decision
> record is `docs/adr/0053-audit-log-is-an-append-only-event-table.md`.
>
> Supersedes the previous plan in this file (Emirates ID and Identity Documents on Patient), which
> is implemented and committed (ADRs 0042, 0043).

## 1. Goal

Record **who did what to which record, and to which Patient**, for every Visit and Patient action
that matters medico-legally, plus billing and identity-and-access changes. Show it on the real
Audit Log page (replacing the mock in `app/(protected)/audit-log/`) and let permitted users export
it as CSV.

## 2. Decisions already made (do not re-litigate)

- **One append-only table, `audit_event`** (`app/db/schema/audit-event.ts`, migration
  `0081_audit_event.sql`). No `isDeleted`/`modifiedOn`; a `BEFORE UPDATE OR DELETE` trigger rejects
  changes. This is the named exception to ADR 0012.
- **Recorded from the route's success branch** via `recordAuditEvent(tenantSession, request, action,
details)` in `app/api/lib/audit/audit-recorder.ts`. Actor comes from the Session, IP/user agent
  from headers, never from the body. It is awaited, and a recording failure is logged and swallowed
  (the action has already committed). Not in the same DB transaction as the write: repositories do
  not share a transaction handle today. Revisit if regulation requires transactional capture.
- **Actions come from one catalogue**, `app/api/lib/modules/audit-log/schemas/audit-action-catalogue.ts`.
  The category and entity type derive from the action; a new action is one catalogue line.
- **Before/after for updates and amendments**: routes read the record with the module's existing
  get-by-id query before the command, then `diffAuditFields(before, after, FIELDS)` from
  `app/api/lib/audit/audit-changes.ts`. Only listed fields are compared.
- **Reads that are logged**: opening a Patient, a Visit, and the Consolidated Patient Report. List
  and search screens are not logged per row in v1.
- **Permissions**: `audit-log:read` to list, `audit-log:read` + `audit-log:export` to export. Seeded
  in `permission/seed-data.ts` and backfilled to the system Tenant Admin role in migration 0081.
- **Export**: synchronous CSV (`GET /api/v1/audit-log/export`), refused with 422 above 50,000 rows
  rather than truncated, formula-injection-safe cells, UTF-8 BOM. The export is itself an Audit
  Event carrying its filters and row count.
- **Dates**: `fromDate`/`toDate` are the Tenant's local days (`YYYY-MM-DD`), converted to instants
  in SQL with the Tenant time zone so the `(tenant_id, occurred_on)` index is used.
- **Support access**: an impersonated Session records `metadata.impersonatedBy`.

### Out of scope for v1 (deliberate)

Hash chain / tamper verification, monthly partitioning and cold archive, retention purge, async
export jobs and PDF reports, SIEM streaming, FHIR `AuditEvent` output, sign-in events (BetterAuth
hooks), denied-access (403) events, document download logging (files are served straight from Blob
storage), alerting.

## 3. Task checklist

### Phase 1 — Database and module

- [x] `audit_event` table, indexes, append-only trigger, permission backfill (migration 0081)
- [x] `audit-log:read` / `audit-log:export` in the Permission Catalogue
- [x] Module `app/api/lib/modules/audit-log/` — catalogue, schema, repository, validators,
      `recordAuditEventCommand`, `getAuditEventsQuery`, `exportAuditEventsQuery`
- [x] `app/api/lib/audit/` — recorder, diff helper and field lists, CSV writer
- [x] Tests: schema, validator, command, query unit tests; repository integration tests (tenant
      isolation, filters, date range in Tenant time zone, append-only trigger); recorder, diff and
      CSV unit tests; migration integration test for the permission backfill

### Phase 2 — Routes

- [x] `GET /api/v1/audit-log`, `GET /api/v1/audit-log/export` (+ `types.ts`)
- [x] Visits: view, check-in, update, start, complete, cancel, delete, amend; diagnoses save/amend;
      documents add/delete; note and vital-sign amend
- [x] Patients: view, create, update, delete, deactivate, reactivate, consolidated report; clinical
      notes create/update/sign/delete; vital signs create/update/delete
- [x] Billing and IAM: invoice finalize/void, payment record; roles create/update/delete/permissions;
      users create/update/deactivate/reactivate/role assign/remove/sessions revoke
- [x] Existing route unit tests mock `@/app/api/lib/audit/audit-recorder` and assert the event

### Phase 3 — Contracts and docs

- [x] Swagger: both Audit Log operations with examples and errors
- [x] ADR 0053; CONTEXT.md Audit Log / Audit Event entries

### Phase 4 — Frontend

- [x] `app/queries/audit-log/useAuditEvents.ts`
- [x] Replace the mock page: URL-driven filters (dates, category, search, Patient, Visit),
      paginated table, event detail sheet (`?event=`) with before/after, Export button gated on
      `audit-log:export`; update `loader.tsx`; delete the mock data
- [x] "Audit history" links from the Patient and Visit pages (`/audit-log?patient=` / `?visit=`)

### Phase 5 — Verify

- [x] `bun run test`, `bunx tsc --noEmit`, `bun run lint`
- [x] Browser check: Patient and Visit views listed, Patient scope link, detail sheet, CSV export (read-only actions in an existing Tenant)

### Phase 6 — Competitor-style columns (follow-up, same change)

- [x] Module and Operation on every catalogue action (derived at read), with filters on both
- [x] Actor Roles snapshot on each event (`actor_roles`, migration 0082)
- [x] CSV: one row per changed field with Field / Old value / New value, Event ID, Tenant-local
      date and time beside UTC, Roles, Module, Operation, record type, Details, Device, support user
- [x] Page table: Date & time, User (email, Roles), Module, Operation, Action, Record, Patient, Visit,
      Field, Old value, New value, Details, IP address, Device; Module and Operation filters
- [x] Integration tests for the Module/Operation filters and the Roles column on the test database

### Phase 7 — User Audit (sign-ins, Sessions, devices per user)

- [x] Record `auth.sign-in` (with Session id), `auth.sign-in-failed` (outcome `failed`, known users
      only), `auth.sign-out` (with the browser's trigger as the reason) and `auth.session-revoke`;
      admin revokes list the Session ids they ended
- [x] Every Audit Event stores its Session id (`session_id`, migration 0083); new Module
      "Sign-in & Sessions", Operations "Sign in" / "Sign out", category `auth`
- [x] `GET /api/v1/audit-log/users` and `GET /api/v1/audit-log/users/{userId}` (`audit-log:read`)
- [x] `/audit-log/users` list and `/audit-log/users/[userId]` detail (Sessions with how each ended,
      duration, device; failed attempts; IP addresses; devices; activity by Module)
- [x] Audit Log menu now holds Audit Events and User Audit; Audit Log page accepts `?actor=` and
      `?session=`
- [x] Shared user-agent parser `lib/user-agent.ts`; CSV gains Session ID, Browser, Operating system,
      Device type
- [x] Signup records `auth.sign-in` for the Tenant Owner's first Session (`metadata.signup: true`)
- [ ] Not yet: Sessions that ended by sign-out
      but began before tracking are not listed on the user's page (their sign-out is in the Audit Log)

### Phase 8 — Audit Log menu and PDF exports

- [x] Sidebar section **Audit Log** holds **All Audit Events** (`/audit-log`) then **User Audit
      Events** (`/audit-log/users`); page titles match
- [x] Shared branded PDF builder `app/api/lib/export/pdf-report.ts` (jsPDF, landscape A4); brand lookup
      moved to `app/api/lib/export/export-brand.ts` and reused by the appointment export
- [x] `GET /api/v1/audit-log/export?format=csv|pdf` (PDF capped at 5,000 events)
- [x] `GET /api/v1/audit-log/users/export` and `GET /api/v1/audit-log/users/{userId}/export`, CSV or PDF,
      recorded as `user-audit.list-export` / `user-audit.export`
- [x] Export menu (PDF / CSV) on all three pages, gated on `audit-log:export`
- [x] PDFs embed Noto Sans and Noto Sans Arabic (`app/api/lib/export/fonts`, OFL), so Arabic names print
      as written, also inside mixed-script cells; `next.config.ts` traces the font files into the export
      routes
- [ ] Not yet: fonts for Indic scripts (Devanagari, Tamil), which still print as "?" in PDFs
