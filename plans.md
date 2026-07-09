# Visit Management (Outpatient Visits) — Implementation Plan

> Status: **approved plan, not yet implemented**. Backend first (Phase 1), then frontend (Phase 2).
> This plan is self-sufficient: all domain decisions were resolved in a grilling session and are recorded below. Follow `CLAUDE.md` conventions throughout (CQRS module recipe, result types, colocated tests, Swagger updates, pyramid style).

## Context

The EMR has Patients (with MRN), Doctors, and five appointment _masters_, but no clinical-event entity yet. `CONTEXT.md` defines a **Visit** as an outpatient clinical event, and the app shell already links to `/visits` (currently a `404` badge). ADR 0021 anticipated Visits as the next clinical entity anchored to `/patients/[id]`. This work builds Visit Management end-to-end.

## Decisions (locked — do not re-litigate)

1. **Visit is standalone.** No Appointment entity exists; every Visit is effectively walk-in. Do NOT add an `appointmentId` column now — it arrives with the future Appointment module.
2. **Tenant-scoped only.** No Facility entity exists; the system operates single-facility-per-tenant today. Visit carries `tenantId` only (from session `activeOrganizationId`, never from request body).
3. **Visit Number** is a tenant-scoped generated sequence, exactly the MRN / Work Order code pattern (ADR 0019 / 0011): counter table + formatter → `VST-0001` (`padStart(4)`), never user-chosen, never reused.
4. **VisitStatus is a tenant-scoped Master with system categories**, mirroring Work Order Status: tenants can add/rename statuses, but every status carries a fixed **Visit Status Category** that business rules key off.
5. **Categories (fixed):** `WAITING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
   Legal category transitions: WAITING→IN_PROGRESS, WAITING→CANCELLED, IN_PROGRESS→COMPLETED, IN_PROGRESS→CANCELLED. COMPLETED and CANCELLED are terminal.
6. **Doctor is optional at creation** (nullable FK); a Visit **must have a Doctor before it can move to IN_PROGRESS**.
7. **Classification reuses appointment masters:** `appointmentTypeId` (required) and `appointmentReasonId` (optional). No new VisitType/VisitReason masters.
8. **Cancellation reason is free text**, required on the cancel transition, null otherwise. The AppointmentCancelledReason master is NOT reused.
9. **Transitions are semantic verb endpoints** (deactivate/reactivate precedent): `POST /api/v1/visits/[id]/start | complete | cancel`. Each accepts an optional `statusId` to pick among same-category tenant statuses (defaults to the seeded system status of the target category); cancel body requires `cancelledReason`.
10. **One open Visit per Patient**: creating a Visit fails with a clear conflict error if the patient already has a Visit whose status category is WAITING or IN_PROGRESS. Enforced in the validator via a repository check (no DB constraint — category lives on the status row).
11. **Fields:** `chiefComplaint` (free text, optional), `notes` (free text, optional), lifecycle timestamps `startedOn` / `completedOn` / `cancelledOn` set by transition commands. Check-in time = `createdOn`.
12. **Edit rules:** visit details (doctor, type, reason, complaint, notes) are editable only while the Visit is open (WAITING/IN_PROGRESS). Delete is soft (`deleteVisit`, ADR 0012) and allowed from any state.
13. **Only active Patients** (and active Doctors, when provided) can be attached to a new Visit.
14. **Frontend v1:** `/visits` list, `/visits/new`, `/visits/[id]` detail, **plus a queue/board view** (a view toggle of `/visits`, not a separate route); VisitStatus master CRUD under a new `/visit-masters` area (sheet pattern, ADR 0010); a Visits section on `/patients/[id]`.

---

## Phase 0 — Documentation updates (small, do first)

### Task 0.1 — Update `CONTEXT.md` (glossary only, zero implementation detail)

- [ ] **Facility**: append a note that Facility is not yet a modeled entity; every Tenant currently operates as a single implicit Facility, and clinical events are scoped by Tenant until Facility is introduced.
- [ ] **Visit**: extend — a Visit is created when the Patient is present (walk-in today), has a lifecycle expressed through VisitStatus, and is identified by a Visit Number.
- [ ] Add **Visit Number** — tenant-scoped, system-assigned identifier for a Visit, never chosen by the user and never reused (mirror the MRN entry's wording).
- [ ] Add **VisitStatus** — a Tenant-scoped Master defining the lifecycle state of a Visit. Every VisitStatus belongs to a Visit Status Category. Distinct from AppointmentStatus, which tracks the scheduling lifecycle of an Appointment.
- [ ] Add **Visit Status Category** — the system-defined lifecycle meaning of a VisitStatus: Waiting, In Progress, Completed, or Cancelled (mirror the Work Order Status Category entry's wording).
- [ ] Add **System Visit Status** — a VisitStatus provided to every Tenant for one Visit Status Category; display details customizable, code/category fixed (mirror System Work Order Status wording).
- [ ] Add **Open Visit** — a Visit in the Waiting or In Progress category. A Patient has at most one Open Visit at a time within a Tenant.
- [ ] Update **AppointmentType** and **AppointmentReason** to state they classify both Appointments and Visits.

### Task 0.2 — New ADRs in `docs/adr/`

- [ ] `0022-visit-status-is-a-tenant-master-with-system-categories.md` — chose tenant master + fixed categories over a fixed enum; trade-off is configurability vs rule stability; mirrors the Work Order Status pattern.
- [ ] `0023-visits-reuse-appointment-classification-masters.md` — Visit references AppointmentType/AppointmentReason instead of parallel visit masters; one taxonomy, no duplicate maintenance, enables future Appointment→Visit conversion.
- [ ] `0024-visit-number-is-tenant-scoped-generated-sequence.md` — short; mirrors ADR 0019.

---

## Phase 1 — Backend

### Task 1.1 — `visit-status` schema

Template: `app/db/schema/work-order-status.ts` (copy shape exactly).

- [ ] Create `app/db/schema/visit-status.ts`: `id, tenantId, name, code, category (varchar enum WAITING|IN_PROGRESS|COMPLETED|CANCELLED + check constraint), color, description, isSystem, isDeleted, createdOn, modifiedOn, deletedOn`.
- [ ] Partial unique indexes on `(tenantId, lower(name))` and `(tenantId, lower(code))` where `isDeleted = false` (see `lessons.md`).
- [ ] Export as `visitStatus` — no `Table` suffix (ADR 0015); consumers import `as visitStatusTable`.

### Task 1.2 — `visit` schema + migration

Templates: `app/db/schema/patient.ts` (counter table), `work-order.ts` (status FK).

- [ ] Create `app/db/schema/visit.ts` with table `visit`:
  - `id`, `tenantId` (notNull), `visitNumber` (notNull),
  - `patientId` → `patient.id` (notNull), `doctorId` → `doctor.id` (nullable),
  - `appointmentTypeId` → appointment type table (notNull), `appointmentReasonId` → appointment reason table (nullable),
  - `statusId` → `visitStatus.id` (notNull),
  - `chiefComplaint` (text, nullable), `notes` (text, nullable), `cancelledReason` (text, nullable),
  - `startedOn`, `completedOn`, `cancelledOn` (timestamps, nullable),
  - soft-delete columns from `masterColumns()`.
  - Partial unique index on `(tenantId, lower(visitNumber))` where not deleted.
- [ ] Add `visitNumberCounter` table (`tenantId` PK, `lastNumber`) like `patientMrnCounter`.
- [ ] Import all referenced tables with `as xxxTable` aliases (ADR 0015).
- [ ] `bun run db:generate` → `bun run db:migrate` → `bun run test:db:migrate`.

### Task 1.3 — `visit-status` module

Template: copy `app/api/lib/modules/work-order-status/` wholesale and adapt.

- [ ] `schemas/visit-status-schema.ts` + `schemas/visit-status-schema.unit.tests.ts`
- [ ] `repository/visit-status-repository.ts` + `repository/visit-status-repository.integration.tests.ts`
- [ ] `validator/` (create/update/delete validators; system statuses: code/category immutable, not deletable — same rules as work-order-status) + `validator/visit-status-validator.unit.tests.ts`
- [ ] `commands/` (create/update/delete) + `commands/visit-status-commands.unit.tests.ts`
- [ ] `queries/` (list/getById) + `queries/visit-status-queries.unit.tests.ts`
- [ ] Routes: `app/api/v1/visits/statuses/route.ts` + `visits/statuses/[id]/route.ts`, each with sibling type-only `types.ts`.
  - Note: static segment `statuses` takes precedence over `visits/[id]` in Next.js routing — both can coexist.

### Task 1.4 — Seed System Visit Statuses at Tenant Onboarding

Template: `tenant-provisioning/commands/seed-default-work-order-masters-command.ts`.

- [ ] `seed-default-visit-masters-command.ts` seeding 4 System Visit Statuses (one per category): Waiting/WAITING, In Progress/IN_PROGRESS, Completed/COMPLETED, Cancelled/CANCELLED — `isSystem: true`, sensible colors.
- [ ] Wire into `onboard-tenant-command.ts`; update `onboard-tenant-command.unit.tests.ts`.
- [ ] Unit tests for the new seed command.

### Task 1.5 — `visit` module

Templates: `work-order` (code sequence in transaction), `patient` (lifecycle commands, list/search).

- [ ] `repository/visit-number.ts`: `formatVisitNumber(n)` → `` `VST-${String(n).padStart(4, '0')}` ``.
- [ ] `repository/visit-repository.ts`:
  - `create` in a transaction: upsert/increment `visitNumberCounter`, insert with formatted `visitNumber` and the resolved WAITING statusId.
  - Reads join `visitStatus` (name/code/category/color), `patient` (name, MRN), `doctor` (user name via staff join — follow how doctor lists resolve names).
  - `findOpenVisitByPatientId(tenantId, patientId)` — joins status, filters category in (WAITING, IN_PROGRESS), not deleted.
  - `getAll` with pagination + search (visit number, patient name, MRN) + filters (status category, statusId, doctorId, date range).
  - `getById`, `update` (open-visit field edits), `updateStatusTransition(id, statusId, timestampField, cancelledReason?)`, `deleteVisit` (soft, ADR 0012 naming).
  - Every query filters `tenantId` and `isDeleted = false`. Pyramid-ordered exports.
- [ ] `schemas/visit-schema.ts`: `createVisitSchema` (patientId + appointmentTypeId required; doctorId, appointmentReasonId, chiefComplaint, notes optional), `updateVisitSchema`, `startVisitSchema` / `completeVisitSchema` (optional statusId), `cancelVisitSchema` (cancelledReason required non-empty, optional statusId), list-params schema. + unit tests.
- [ ] `validator/` — one function per operation, `ValidationResult<T>`, repository-backed checks:
  - **create**: patient exists/active; **no Open Visit** (conflict message naming the patient); doctor (if given) exists/active; appointment type exists; appointment reason (if given) exists; resolve default WAITING system status.
  - **update**: visit exists; visit is open; referenced entities valid.
  - **start**: visit exists; current category WAITING; doctor assigned (on the visit, or allow doctorId in the start body to assign-and-start); target status (given `statusId` or default system status) has category IN_PROGRESS.
  - **complete**: current category IN_PROGRESS; target category COMPLETED.
  - **cancel**: current category WAITING or IN_PROGRESS; target category CANCELLED; reason present.
  - **delete**: visit exists.
  - - unit tests (schema-failure short-circuits repo calls, etc.).
- [ ] `commands/`: create / update / start / complete / cancel / delete — validate → repository → `CommandResult<T>`; transition commands set the matching timestamp; map Postgres `23505` to clean conflict errors. + unit tests.
- [ ] `queries/`: `getVisits` (paginated `QueryResult`), `getVisitById`. + unit tests.
- [ ] Routes (thin; `tenantId` from session):
  - `app/api/v1/visits/route.ts` — GET (list), POST (create) + `types.ts`
  - `app/api/v1/visits/[id]/route.ts` — GET, PATCH, DELETE (204 → `void` response type) + `types.ts`
  - `app/api/v1/visits/[id]/start/route.ts`, `.../complete/route.ts`, `.../cancel/route.ts` + `types.ts` each.
- [ ] Repository integration tests: tenant isolation, soft-delete filtering, visit-number sequencing/uniqueness per tenant, open-visit lookup, transition updates, pagination/search/filters.

### Task 1.6 — Permissions

- [ ] `app/api/lib/modules/permission/seed-data.ts`: add module `visit-management` with resource `visit`: `read, create, update, delete, start, complete, cancel`; add module `visit-masters` with resource `visit-status`: `read, create, update, delete`. Follow existing group shape and descriptions ("View Visits.", etc.).
- [ ] Update permission integration tests if they assert catalogue counts/contents.

### Task 1.7 — Swagger/OpenAPI

- [ ] Update `app/api/lib/openapi/document.ts` (and wherever operations are registered) for ALL new endpoints: request/response schemas, params, status codes, auth requirements.
- [ ] Realistic examples: successful check-in, open-visit conflict, invalid transition (e.g. complete from WAITING), cancel-without-reason validation error, not found, invalid JSON.

### Task 1.8 — Backend gate

- [ ] `bun run test` green (export `TEST_DATABASE_URL` — docker `emr-test-pg` on :5433; run `bun run test:db:migrate` first).
- [ ] `bunx tsc --noEmit` green; `bun run lint` green.

---

## Phase 2 — Frontend (after backend is done)

Read `DESIGN.md`; invoke the `design-system` skill for all UI work and `tanstack-query-patterns` for all query/mutation code. Every `page.tsx` gets a sibling `loader.tsx` rendering `Skeleton` from `@/components/ui/skeleton`, kept page-shaped.

### Task 2.1 — `/visit-masters/visit-statuses` (sheet-based master CRUD, ADR 0010)

Template: the appointment-masters screens under `app/(protected)/appointment-masters/`.

- [ ] Route `app/(protected)/visit-masters/visit-statuses/` — page, loader, `_components/` (page-impl, table, toolbar, `_sheets/visit-status-sheet.tsx`), `_utils/` form schema.
- [ ] Sheet open-state in URL via `nuqs` (one param: `?status=new` / `?status=<id>`).
- [ ] System statuses: code/category read-only in the sheet; no delete action.
- [ ] Add "Visit Masters" nav group in `components/app/app-shell-config.ts`.

### Task 2.2 — `/visits` list + queue board (ADR 0021 clinical pages)

- [ ] `app/(protected)/visits/page.tsx` + `loader.tsx`; `_components/`: `visits-page-impl.tsx`, `visits-table.tsx` (visit number, patient + MRN, doctor, type, status badge with master color, checked-in time), `visits-toolbar.tsx` (search, status-category & doctor filters, "New Visit" primary action, list ⇄ queue view toggle).
- [ ] `visit-queue-board.tsx`: WAITING and IN_PROGRESS columns, cards grouped per doctor (unassigned bucket for doctor-less visits), card actions start/complete/cancel. View mode + filters persisted in URL via `nuqs` — same list query as the table, no separate route.
- [ ] `_components/_modals/cancel-visit-dialog.tsx` (required free-text reason) and `_modals/delete-visit-dialog.tsx`.
- [ ] Remove `badge: '404'` from the Visits nav item in `components/app/app-shell-config.ts`.

### Task 2.3 — `/visits/new` (check-in form)

- [ ] `app/(protected)/visits/new/` — page, loader, `_components/visit-check-in-impl.tsx`.
- [ ] Fields: patient picker (searchable, active patients only), doctor (optional, active doctors), appointment type (required — asterisk derived from the create API contract), appointment reason (optional), chief complaint, notes.
- [ ] `react-hook-form` + `zodResolver`, client schema in `_utils/visit-form-schema.ts`, `mode: 'onTouched'`, server errors via `setError` (open-visit conflict lands on the patient field).
- [ ] Support `?patient=<id>` prefill (from patient detail).

### Task 2.4 — `/visits/[id]` detail

- [ ] `app/(protected)/visits/[id]/` — page, loader, `_components/visit-detail-impl.tsx`.
- [ ] Header: visit number + status badge; cards: patient (link to `/patients/[id]`), doctor (assignable while open), complaint/notes; timeline: created/started/completed/cancelled timestamps; cancelled reason when present.
- [ ] Actions gated by category: Start (WAITING, requires doctor), Complete (IN_PROGRESS), Cancel (open states, via dialog), Edit (open states only — either in-place or an `[id]/edit` page mirroring patients), Delete.

### Task 2.5 — Patient detail integration

- [ ] Add a Visits section to `app/(protected)/patients/[id]/_components/patient-detail-impl.tsx`: recent visits (status badge, doctor, date) linking to `/visits/[id]`, plus a "New Visit" button → `/visits/new?patient=<id>` (disabled with tooltip for Inactive Patients or when an Open Visit exists).
- [ ] Update `app/(protected)/patients/[id]/loader.tsx` in the same change (loader stays page-shaped).

### Task 2.6 — Frontend gate

- [ ] `bunx tsc --noEmit`, `bun run lint`, `bun run test` all green; `bun run build` passes.

---

## Verification (end-to-end)

1. Fresh tenant signup → onboarding seeds 4 System Visit Statuses (verify via `/visit-masters/visit-statuses` and API).
2. Check in a patient from `/visits/new` → visit `VST-0001`, WAITING; attempting a second check-in for the same patient returns the conflict and the form surfaces it on the patient field.
3. Start without a doctor fails; assign doctor → Start → IN_PROGRESS (`startedOn` set) → Complete → COMPLETED (`completedOn` set).
4. Cancel path requires a reason; cancelled visit shows reason + `cancelledOn`; terminal visits are not editable.
5. Queue board reflects the same data as the list; per-doctor grouping and unassigned bucket correct.
6. Patient detail shows the visit history and pre-fills `/visits/new?patient=<id>`.
7. Cross-tenant isolation: a second tenant sees no visits/statuses from the first (covered by integration tests; spot-check via API).
8. `/swagger` documents every new operation with success + conflict + validation examples.
