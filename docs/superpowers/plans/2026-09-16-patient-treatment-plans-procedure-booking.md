# Patient Treatment Plans and Procedure Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Procedure booking prefer a selected Patient's current Treatment Plans, reserve a Patient-specific Session exactly once, and create a new Plan atomically from catalogue search only when that Patient has no current Plan.

**Architecture:** Add Tenant-scoped Patient Treatment Plan, Plan Session, and active Session Reservation tables. Keep Treatment masters reusable, snapshot their clinical/scheduling fields into Plans, and derive Plan lifecycle from Session completion except for explicit `STOPPED`. Extend the existing Appointment transaction to validate or create a Plan, reserve one Plan Session, and create the Procedure Appointment as one unit. Expose a patient-scoped read API and drive the Book Appointment form with dependent TanStack Query state.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, React Hook Form, Zod 4, TanStack Query 5, Drizzle ORM/PostgreSQL, Vitest, Tailwind/shadcn UI.

**Spec:** `docs/superpowers/specs/2026-09-16-patient-treatment-plans-and-procedure-booking-design.md`

## Global Constraints

- Follow `CLAUDE.md`, `CONTEXT.md`, `lessons.md`, `docs/backend-testing.md`, `DESIGN.md`, and ADR 0046.
- Treat every identifier and lookup as Tenant-scoped. A numeric ID alone never establishes ownership.
- Use the canonical terms `Treatment`, `Treatment Session Structure`, `Patient Treatment Plan`, `Patient Treatment Plan Session`, and `Patient Treatment Plan Session Reservation` exactly.
- Keep existing Procedure Appointments readable: their new Plan references remain nullable and no historical backfill is inferred.
- Use plural Vitest suffixes only: `*.unit.tests.ts` and `*.integration.tests.ts`.
- Work red-green-refactor. Run the focused test after every red and green step, then the full verification suite at the end.
- Generate migrations with Drizzle; do not hand-edit snapshot JSON. Use named generation so the expected migration is `app/db/drizzle/0060_patient_treatment_plans.sql`.
- Do not add an artificial maximum to prescribed Session count. Validation requires a positive integer and database transactions remain the practical limit.
- Imported unknown scheduling fields stay `null`; the UI requires a manual Procedure end time and does not infer Room or Therapist eligibility.

---

## Task 1: Persist Treatment Session Structure and Patient Treatment Plans

**Files:**

- Modify: `app/db/schema/treatment.ts`
- Create: `app/db/schema/patient-treatment-plan.ts`
- Modify: `app/db/schema/appointment.ts`
- Modify: `app/api/lib/modules/treatment/schemas/treatment-schema.ts`
- Modify: `app/api/lib/modules/treatment/schemas/treatment-schema.unit.tests.ts`
- Create: `app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema.ts`
- Create: `app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema.unit.tests.ts`
- Modify: `app/api/lib/modules/treatment/repository/treatment-repository.integration.tests.ts`
- Create: `app/db/schema/patient-treatment-plan.integration.tests.ts`
- Generate: `app/db/drizzle/0060_patient_treatment_plans.sql`
- Generate: `app/db/drizzle/meta/0060_snapshot.json`
- Modify: `app/db/drizzle/meta/_journal.json`

- [ ] **Step 1: Write failing Zod tests for the new domain shapes**

Add tests that require:

- `sessionStructure` to be `REPEATABLE` or `SEQUENCED`;
- manually created Treatments to retain positive duration and at least one Session;
- Repeatable assignment to accept a positive `totalSessions`;
- Sequenced assignment to reject a caller-supplied count;
- patient/plan/session/Tenant IDs to be positive/non-empty;
- nullable snapshot metadata and nullable legacy Conduction Note in response types.

Run:

```bash
bunx vitest run --project unit app/api/lib/modules/treatment/schemas app/api/lib/modules/patient-treatment-plan/schemas
```

Expected: FAIL because the Plan schema and Treatment structure field do not exist.

- [ ] **Step 2: Define the database model and invariants**

In `treatment.ts`:

- add `sessionStructure: 'REPEATABLE' | 'SEQUENCED'`, defaulting existing/native rows to `SEQUENCED`;
- add nullable `defaultTotalSessions` for Repeatable masters;
- add nullable `legacySourceIdentity` and nullable `legacySourceSystem`;
- make duration/setup/cleaning nullable at the database/type level so imports can preserve unknown values, while keeping create/update Zod validation strict for normal master maintenance;
- replace unconditional active name/code uniqueness with partial uniqueness for non-legacy masters and add active uniqueness on `(tenantId, lower(legacySourceIdentity))` when the identity is not null.

Create `patient-treatment-plan.ts` with:

- `patientTreatmentPlan`: Tenant, Patient, nullable Treatment reference, Treatment name/code/source identity snapshots, Session Structure snapshot, positive `totalSessions`, nullable `statusOverride` restricted to `STOPPED`, and nullable legacy/import provenance fields;
- `patientTreatmentPlanSession`: Tenant, Plan, nullable Treatment Session template reference, unique positive `sessionNumber` per active Plan, snapshot label/procedure/scheduling/resource fields, nullable `legacyConductionNote`, `completionStatus` (`PENDING` or `COMPLETED`), nullable `completionSource` (`VISIT` or `LEGACY_IMPORT`), nullable completed Visit reference, and nullable completion timestamp;
- `patientTreatmentPlanSessionReservation`: Tenant, Plan Session, Appointment, soft-delete timestamps, a partial unique index on active `(tenantId, patientTreatmentPlanSessionId)`, and a partial unique index on active `(tenantId, appointmentId)`.

In `appointment.ts` add nullable `patientTreatmentPlanId` and `patientTreatmentPlanSessionId`, plus a check that both are null or both are non-null. Preserve `treatmentId` and `treatmentSessionId`.

- [ ] **Step 3: Generate and inspect migration 0060**

Run:

```bash
bun run db:generate -- --name patient_treatment_plans
```

Inspect the SQL for:

- the three new tables and foreign keys;
- all Tenant-leading indexes;
- positive count/number checks;
- Session completion consistency checks (`VISIT` requires a completed Visit; `LEGACY_IMPORT` permits no Visit);
- the two partial active-reservation unique indexes;
- nullable Appointment Plan references and their pair check;
- safe defaults/backfill before any new non-null Treatment columns are enforced.

- [ ] **Step 4: Write failing repository integration tests for database invariants**

Use direct Drizzle inserts to cover snapshot persistence, repeated Session creation beyond 12, unique Session numbers, unique active reservation, reservation reuse after soft release, nullable historical Appointment references, and legacy completion without a Visit.

Run:

```bash
bunx vitest run --project integration app/db/schema/patient-treatment-plan.integration.tests.ts app/api/lib/modules/treatment/repository
```

Expected after the schema and migration are present: PASS, with database-level duplicate inserts proving the constraints independently of repository code.

- [ ] **Step 5: Implement Zod/domain types and keep native Treatment validation strict**

Export concrete types for:

```ts
type TreatmentSessionStructure = 'REPEATABLE' | 'SEQUENCED';
type PatientTreatmentPlanStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'STOPPED';
type PatientTreatmentPlanSessionUnavailableReason = 'COMPLETED' | 'RESERVED';
```

Update Treatment response types so scheduling metadata can be `null`, but keep `createTreatmentSchema` and `updateTreatmentSchema` requiring valid numeric duration/setup/cleaning for staff-created masters. A Repeatable Treatment must have exactly one template Session; a Sequenced Treatment must have one or more unique ordered Sessions.

- [ ] **Step 6: Run focused schema tests and commit**

```bash
bunx vitest run --project unit app/api/lib/modules/treatment/schemas app/api/lib/modules/patient-treatment-plan/schemas
bunx tsc --noEmit
git add app/db/schema app/db/drizzle app/api/lib/modules/treatment/schemas app/api/lib/modules/patient-treatment-plan/schemas app/api/lib/modules/treatment/repository/treatment-repository.integration.tests.ts
git commit -m "feat: add patient treatment plan persistence"
```

---

## Task 2: Build the Patient Treatment Plan Read Model

**Files:**

- Create: `app/api/lib/modules/patient-treatment-plan/repository/patient-treatment-plan-repository.ts`
- Create: `app/api/lib/modules/patient-treatment-plan/repository/patient-treatment-plan-repository.integration.tests.ts`
- Create: `app/api/lib/modules/patient-treatment-plan/validator/patient-treatment-plan-validator.ts`
- Create: `app/api/lib/modules/patient-treatment-plan/validator/patient-treatment-plan-validator.unit.tests.ts`
- Create: `app/api/lib/modules/patient-treatment-plan/queries/get-patient-treatment-plans-query.ts`
- Create: `app/api/lib/modules/patient-treatment-plan/queries/patient-treatment-plan-queries.unit.tests.ts`

- [ ] **Step 1: Specify the read contract in failing tests**

Test that `getCurrentByPatientId`:

- returns only the Tenant's Patient and only `PENDING`/`IN_PROGRESS` Plans;
- derives `PENDING`, `IN_PROGRESS`, and `COMPLETED` from Session completion, but honors `STOPPED`;
- returns all Sessions ordered by number;
- marks completed Sessions `isBookable: false, unavailableReason: 'COMPLETED'`;
- marks actively reserved Sessions `isBookable: false, unavailableReason: 'RESERVED'`;
- leaves released reservations bookable;
- returns prescribed and completed counts plus nullable snapshot metadata.

Run the focused integration test and confirm RED.

- [ ] **Step 2: Implement lock-safe repository primitives**

Implement:

```ts
getCurrentByPatientId(patientId: number, tenantId: string): Promise<PatientTreatmentPlan[]>;
getPlanSessionForBooking(planId: number, sessionId: number, patientId: number, tenantId: string, tx: Transaction): Promise<PlanSessionBookingContext | undefined>;
createPlanFromTreatment(input: CatalogueAssignment, tx: Transaction): Promise<CreatedPatientTreatmentPlan>;
reserveSession(planSessionId: number, appointmentId: number, tenantId: string, tx: Transaction): Promise<void>;
releaseReservationForAppointment(appointmentId: number, tenantId: string, tx: Transaction): Promise<void>;
completeSessionForVisit(visitId: number, appointmentId: number, tenantId: string, tx: Transaction): Promise<void>;
```

`getPlanSessionForBooking` must lock the Plan Session and reject cross-Patient, cross-Plan, completed, stopped, or actively reserved selections. `createPlanFromTreatment` copies the Treatment and template snapshots; Repeatable creates `1...totalSessions`, Sequenced copies the fixed ordered template list.

- [ ] **Step 3: Add validation/query layers**

The validator parses Patient ID, Tenant ID, and `status=current`, then verifies that the Patient exists in the Tenant. The query returns the repository read model through `SingleQueryResult` and maps missing Patients to `404`.

- [ ] **Step 4: Make focused tests green and commit**

```bash
bunx vitest run --project unit app/api/lib/modules/patient-treatment-plan
bunx vitest run --project integration app/api/lib/modules/patient-treatment-plan/repository
git add app/api/lib/modules/patient-treatment-plan
git commit -m "feat: query current patient treatment plans"
```

---

## Task 3: Add Permission Enforcement and the Patient-scoped API

**Files:**

- Modify: `app/api/lib/modules/permission/seed-data.ts`
- Modify: `app/api/lib/modules/permission/repository/permission-repository.integration.tests.ts`
- Modify: `app/api/lib/modules/role-permission/repository/role-permission-repository.integration.tests.ts`
- Modify: `app/api/lib/utils/auth-helpers.ts`
- Create: `app/api/lib/utils/auth-helpers.unit.tests.ts`
- Create: `app/api/v1/patients/[id]/treatment-plans/route.ts`
- Create: `app/api/v1/patients/[id]/treatment-plans/types.ts`
- Create: `app/api/v1/patients/[id]/treatment-plans/route.unit.tests.ts`
- Modify: `app/api/v1/appointments/route.ts`
- Modify: `app/api/v1/appointments/route.unit.tests.ts`
- Modify: `app/db/drizzle/0060_patient_treatment_plans.sql`

- [ ] **Step 1: Write failing authorization and route tests**

Cover unauthenticated `401`, missing active Tenant `403`, missing `patient-treatment-plan:read` `403`, valid current-plan response `200`, invalid status `400`, missing Patient `404`, and Tenant propagation. For Appointment POST, require `appointment:create`; catalogue assignment additionally requires `patient-treatment-plan:assign`.

- [ ] **Step 2: Add the Permission Catalogue entries**

Add the `appointments` module resource:

```ts
{
  module: 'appointments',
  resource: 'patient-treatment-plan',
  actions: [
    ['read', 'View Patient Treatment Plans and Sessions.'],
    ['assign', 'Assign Treatments to Patients and create Patient Treatment Plans.'],
  ],
}
```

Extend migration 0060 with idempotent permission inserts and Tenant Admin role assignments for existing Tenants, following `0059_seed_treatment_masters.sql`.

- [ ] **Step 3: Add a reusable server-side permission guard**

Extend `auth-helpers.ts` with a guard that accepts the already resolved Tenant session and one or more permission keys. Tenant owners/admins retain their existing all-active-permissions behavior; other users are checked through their Tenant Role assignments. Return a `403` JSON response without running the protected query/command.

- [ ] **Step 4: Implement the GET adapter using Next 16 route context**

Use:

```ts
export async function GET(
  request: NextRequest,
  context: RouteContext<'/api/v1/patients/[id]/treatment-plans'>
) {
  const { id } = await context.params;
}
```

Do not opt into static caching; this response contains current reservation state.

- [ ] **Step 5: Make focused tests green and commit**

```bash
bunx vitest run --project unit app/api/lib/utils/auth-helpers.unit.tests.ts app/api/v1/patients/\[id\]/treatment-plans app/api/v1/appointments/route.unit.tests.ts
bunx vitest run --project integration app/api/lib/modules/permission/repository app/api/lib/modules/role-permission/repository
git add app/api/lib/modules/permission app/api/lib/modules/role-permission app/api/lib/utils/auth-helpers.ts app/api/lib/utils/auth-helpers.unit.tests.ts app/api/v1/patients/'[id]'/treatment-plans app/api/v1/appointments app/db/drizzle/0060_patient_treatment_plans.sql
git commit -m "feat: expose authorized patient treatment plans"
```

---

## Task 4: Change Procedure Appointment Input to Plan-based Selection

**Files:**

- Modify: `app/api/lib/modules/appointment/schemas/appointment-schema.ts`
- Modify: `app/api/lib/modules/appointment/schemas/appointment-schema.unit.tests.ts`
- Modify: `app/api/lib/modules/appointment/validator/create-appointment-validator.ts`
- Modify: `app/api/lib/modules/appointment/validator/create-appointment-validator.unit.tests.ts`
- Modify: `app/api/v1/appointments/types.ts`
- Modify: `app/api/v1/appointments/types.unit.tests.ts`

- [ ] **Step 1: Write failing request-shape tests**

Replace the direct generic Session shape with an exact union:

```ts
type ExistingPlanSelection = {
  patientTreatmentPlanId: number;
  patientTreatmentPlanSessionId: number;
  treatmentId?: never;
  totalSessions?: never;
};

type CatalogueAssignment = {
  treatmentId: number;
  totalSessions?: number;
  patientTreatmentPlanId?: never;
  patientTreatmentPlanSessionId?: never;
};
```

Tests must reject mixed/empty selectors, reject provisional Patients for Procedures, require `totalSessions` only after resolving a Repeatable Treatment without a default, ignore no server-owned snapshot fields from callers, and preserve Consultation behavior.

- [ ] **Step 2: Implement structural parsing before database validation**

The Zod schema should establish exactly one selector. The validator then:

- requires an existing registered Patient for Procedure booking;
- validates an existing Plan/Session against Patient and Tenant through the Plan repository;
- validates a catalogue Treatment and its Structure;
- rejects catalogue fallback when any current Plan exists, even if every Session is unavailable;
- normalizes Repeatable count from request or `defaultTotalSessions`;
- locks no rows here—final race protection remains inside the Appointment transaction.

- [ ] **Step 3: Make focused tests green and commit**

```bash
bunx vitest run --project unit app/api/lib/modules/appointment/schemas app/api/lib/modules/appointment/validator/create-appointment-validator.unit.tests.ts app/api/v1/appointments/types.unit.tests.ts
git add app/api/lib/modules/appointment app/api/v1/appointments/types.ts app/api/v1/appointments/types.unit.tests.ts
git commit -m "feat: validate plan based procedure booking"
```

---

## Task 5: Create Plans, Reserve Sessions, and Book Atomically

**Files:**

- Modify: `app/api/lib/modules/appointment/repository/appointment-repository.ts`
- Modify: `app/api/lib/modules/appointment/repository/appointment-repository.integration.tests.ts`
- Modify: `app/api/lib/modules/appointment/commands/create-appointment-command.ts`
- Modify: `app/api/lib/modules/appointment/commands/create-appointment-command.unit.tests.ts`
- Modify: `app/api/lib/modules/appointment/commands/cancel-appointment-command.unit.tests.ts`
- Modify: `app/api/lib/modules/appointment/schemas/appointment-schema.ts`

- [ ] **Step 1: Add failing integration tests for both atomic paths**

Cover:

- existing Plan + Session creates Appointment and one reservation;
- catalogue Repeatable selection creates Plan, the prescribed Session count, reserves Session 1, and creates Appointment;
- catalogue Sequenced selection copies templates and locks the fixed count;
- any failure rolls back Plan, Sessions, reservation, counter increment, and Appointment;
- cross-Tenant/cross-Patient Plan selection fails;
- completed, stopped, and reserved Sessions fail;
- simultaneous attempts return one success and one reservation conflict;
- old Appointments with null Plan references still read correctly.

- [ ] **Step 2: Revalidate and lock inside the existing Appointment transaction**

For the existing-Plan path, lock the Plan Session and its active reservation set before inserting the Appointment. For the catalogue path, lock/read the Treatment, confirm the Patient has zero current Plans, create snapshots and Sessions, then choose the lowest-numbered Session. Insert the Appointment first, then the active reservation using its ID, all inside the same `db.transaction`.

Populate legacy `appointment.treatmentId` and `appointment.treatmentSessionId` from the Plan snapshots/template when available; populate both new Plan IDs for every new Procedure booking.

- [ ] **Step 3: Map database conflicts to stable API errors**

Map `patient_treatment_plan_session_reservation_active_session_idx` to HTTP `409` with:

`The selected Patient Treatment Plan Session is no longer available.`

Expose a distinct repository outcome when catalogue fallback loses a race to a newly created current Plan, also as `409`, so the client refreshes Plans rather than retrying catalogue assignment.

- [ ] **Step 4: Release reservations on Appointment cancellation**

Inside `cancelAppointment`, soft-release the active Plan Session Reservation in the same transaction that moves the Appointment to Cancelled. Rescheduling changes only date/time and retains the reservation.

Add a repository-level terminal-status helper that releases a reservation for `CANCELLED` and `NO_SHOW` but not `SCHEDULED`, `CONFIRMED`, `CHECKED_IN`, or `COMPLETED`; use it from cancellation now so a future No Show command cannot bypass the invariant.

- [ ] **Step 5: Make focused tests green and commit**

```bash
bunx vitest run --project unit app/api/lib/modules/appointment
bunx vitest run --project integration app/api/lib/modules/appointment/repository
git add app/api/lib/modules/appointment
git commit -m "feat: reserve patient treatment plan sessions atomically"
```

---

## Task 6: Complete Plan Sessions with Visits

**Files:**

- Modify: `app/api/lib/modules/visit/repository/visit-repository.ts`
- Modify: `app/api/lib/modules/visit/repository/visit-repository.integration.tests.ts`
- Modify: `app/api/lib/modules/visit/commands/visit-commands.unit.tests.ts`
- Modify: `app/api/lib/modules/visit/schemas/visit-schema.ts`

- [ ] **Step 1: Write failing lifecycle integration tests**

Prove that completing a Visit linked to a Procedure Appointment:

- marks its Plan Session completed with `completionSource='VISIT'`, Visit ID, and timestamp;
- derives the Plan as `IN_PROGRESS` until the final Session and `COMPLETED` after it;
- does not complete a Session on check-in, Visit cancellation, Appointment cancellation, or reschedule;
- is idempotent under the existing Visit transition guard;
- leaves historical non-Plan Procedure Appointments unchanged.

- [ ] **Step 2: Extend the existing Visit completion transaction**

When `runTransitionVisitTransaction` moves a Visit to `COMPLETED`, resolve the linked Appointment's Plan Session, lock it, and mark it completed in the same transaction before reading the updated Visit. Do not persist normal Plan status; derive it from Sessions on reads.

- [ ] **Step 3: Make focused tests green and commit**

```bash
bunx vitest run --project unit app/api/lib/modules/visit
bunx vitest run --project integration app/api/lib/modules/visit/repository
git add app/api/lib/modules/visit
git commit -m "feat: complete treatment plan sessions with visits"
```

---

## Task 7: Add Patient Plan and Remote Catalogue Queries to the Client

**Files:**

- Create: `app/queries/patient-treatment-plans/usePatientTreatmentPlans.ts`
- Create: `app/queries/patient-treatment-plans/usePatientTreatmentPlans.unit.tests.ts`
- Modify: `app/queries/treatments/useTreatments.ts`
- Modify: `app/(protected)/appointments/new/_utils/book-appointment-types.ts`
- Modify: `app/(protected)/appointments/new/_utils/book-appointment-form-schema.ts`
- Modify: `app/(protected)/appointments/new/_utils/book-appointment-form-schema.unit.tests.ts`
- Modify: `app/(protected)/appointments/new/_utils/book-appointment-request.ts`
- Modify: `app/(protected)/appointments/new/_utils/book-appointment-request.unit.tests.ts`

- [ ] **Step 1: Write failing client contract tests**

Test disabled Patient Plan queries without a Patient ID, stable query keys, same-origin credentials, and response transformation. Update form/request tests for `selectionMode: 'EXISTING_PLAN' | 'CATALOGUE'`, Plan/Session IDs, Treatment ID, and optional Repeatable count.

- [ ] **Step 2: Implement dependent query behavior**

Use a key shaped as:

```ts
['patients', patientId, 'treatment-plans', { status: 'current' }];
```

Set `enabled` only when a registered existing Patient is selected and the Booking Path is Procedure. Keep catalogue search disabled unless Plan loading succeeded with zero current Plans and the user has `patient-treatment-plan:assign`. Debounce the catalogue search string and request a small page instead of `limit=999`.

- [ ] **Step 3: Implement request mapping**

Existing Plan selection sends Plan ID + Plan Session ID. Catalogue selection sends Treatment ID and Repeatable count. Never send a generic Treatment Session ID as the authoritative selector.

- [ ] **Step 4: Make focused tests green and commit**

```bash
bunx vitest run --project unit app/queries/patient-treatment-plans app/'(protected)'/appointments/new/_utils
git add app/queries/patient-treatment-plans app/queries/treatments/useTreatments.ts app/'(protected)'/appointments/new/_utils
git commit -m "feat: query patient plans for procedure booking"
```

---

## Task 8: Replace the Treatment Dropdown with Plan-first UI States

**Files:**

- Modify: `app/(protected)/appointments/new/_components/use-book-appointment.ts`
- Modify: `app/(protected)/appointments/new/_components/treatment-session-section.tsx`
- Modify: `app/(protected)/appointments/new/_components/book-appointment-page-impl.tsx`
- Modify: `app/(protected)/appointments/new/_components/book-appointment-demo-data.ts`
- Modify: `app/(protected)/appointments/new/_components/book-appointment-demo-data.unit.tests.ts`
- Create: `app/(protected)/appointments/new/_components/treatment-session-section.unit.tests.ts`
- Modify: `app/(protected)/appointments/new/_components/procedure-schedule-section.tsx`
- Modify: `app/(protected)/appointments/new/_components/resource-allocation-section.tsx`
- Modify: `app/(protected)/appointments/new/loader.tsx`

- [ ] **Step 1: Extract and test deterministic selection state**

Move pure mapping/default-selection logic into `book-appointment-demo-data.ts` (rename exported domain-facing types away from `Demo*` while preserving unrelated demo resources). Test:

- one current Plan with an eligible Session auto-selects the Plan and lowest eligible Session;
- multiple current Plans select none until the operator chooses;
- a chosen Plan defaults to its lowest eligible Session;
- completed/reserved Sessions remain visible but cannot be selected;
- current Plans with no bookable Session produce the conflict state and never catalogue state;
- zero current Plans produces catalogue state only when assignment permission is present.

- [ ] **Step 2: Orchestrate dependent fetch/reset behavior**

In `use-book-appointment.ts`:

- clear Plan/Treatment/Session selection when Patient or Booking Path changes;
- fetch Plans only for a registered selected Patient on Procedure path;
- apply auto-selection once per loaded Patient/result version without overwriting a user's manual choice;
- use `useHasPermission('patient-treatment-plan:assign')` for catalogue fallback;
- refresh Patient Plans on the stable `409` reservation error and return to step 1;
- retain manual end time when duration is unknown; only auto-calculate when the selected snapshot has a duration;
- skip Room/Therapist filtering and do not require those form fields when their metadata is unknown.

- [ ] **Step 3: Render the four explicit UI states**

`TreatmentSessionSection` renders:

1. loading skeleton for Patient Plans;
2. one/multiple current Plan picker with progress and full Session list;
3. no-bookable-Session warning with no catalogue controls;
4. no-current-Plan remote Treatment combobox, Structure-aware count input, and missing-duration notice.

Use existing Card, Field, Alert, Badge, Button, and combobox/select primitives. Labels use title case; status labels use sentence case. Every unavailable Session includes readable text such as `Completed` or `Reserved by another Appointment`, not colour alone.

- [ ] **Step 4: Update the route loader**

Mirror the new Plan progress rows, catalogue search input, count field, and conflict alert proportions in `loader.tsx`; avoid a skeleton that looks like the retired two-native-select layout.

- [ ] **Step 5: Make focused tests green and commit**

```bash
bunx vitest run --project unit app/'(protected)'/appointments/new
bunx tsc --noEmit
git add app/'(protected)'/appointments/new
git commit -m "feat: show assigned treatment plans when booking procedures"
```

---

## Task 9: Document the API and Verify the Complete Slice

**Files:**

- Modify: `app/api/lib/openapi/document.ts`
- Modify: `app/api/lib/openapi/document.unit.tests.ts`
- Modify if implementation changes terminology: `CONTEXT.md`
- Modify if implementation changes the decision: `docs/adr/0046-procedure-appointments-reserve-patient-treatment-plan-sessions.md`
- Modify if implementation changes behavior: `docs/superpowers/specs/2026-09-16-patient-treatment-plans-and-procedure-booking-design.md`

- [ ] **Step 1: Add failing OpenAPI assertions**

Assert the patient-scoped path, `status=current`, full Session availability response, both Procedure selection shapes, nullable metadata, `403`, and reservation `409` response.

- [ ] **Step 2: Update OpenAPI and run format checks**

```bash
bunx vitest run --project unit app/api/lib/openapi
bun run format:check
```

- [ ] **Step 3: Run database migration and full automated verification**

```bash
bun run test:db:migrate
bun run test
bunx tsc --noEmit
bun run lint
bun run build
git diff --check
```

Expected: every command exits 0. If integration Postgres is unavailable, report that environmental blocker explicitly; do not claim the integration suite passed.

- [ ] **Step 4: Perform authenticated browser verification**

Without submitting an unintended Appointment, verify:

- one current Plan auto-selects its lowest bookable Session;
- multiple current Plans require a Plan choice;
- unavailable Sessions are visible with reasons;
- current/no-bookable state hides catalogue search;
- no-current state exposes permitted remote search;
- Repeatable count is editable and Sequenced count is locked;
- unknown duration requires manual end time and does not filter resource demos;
- loading/error states are keyboard reachable and the loader matches the page.

- [ ] **Step 5: Commit documentation and verification-ready state**

```bash
git add app/api/lib/openapi CONTEXT.md docs/adr/0046-procedure-appointments-reserve-patient-treatment-plan-sessions.md docs/superpowers/specs/2026-09-16-patient-treatment-plans-and-procedure-booking-design.md
git commit -m "docs: describe patient treatment plan booking API"
```

## Completion Criteria

- A Procedure Appointment cannot be newly created without a Patient Treatment Plan Session.
- A Patient Plan Session has at most one active Appointment reservation under concurrency.
- Cancellation releases and reschedule retains the reservation; Visit completion completes the Session.
- Catalogue fallback is impossible while any current Plan exists.
- Historical Appointments remain readable with null Plan references.
- Permission, Tenant isolation, OpenAPI, loader, UI, unit, integration, type, lint, and build checks are green.
