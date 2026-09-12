# Procedure Booking with an Optional Doctor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow staff to book a Procedure with Doctor `N/A` or an active Doctor using only a direct date/time window, Room, and Therapist, while leaving Consultation DoctorSlot booking unchanged.

**Architecture:** `POST /api/v1/appointments` becomes a `bookingPath`-discriminated contract. Consultation continues reserving DoctorSlots through a Doctor Rota; Procedure stores an independent start/end time window and an optional Doctor assignment without consulting DoctorSchedules, DoctorRotas, or DoctorSlots. The Book Appointment UI renders separate Consultation and Procedure scheduling components so their rules cannot leak into each other.

**Tech Stack:** Next.js 16 App Router, TypeScript, Zod 4, Drizzle ORM/PostgreSQL, React Hook Form, TanStack Query, Vitest, Tailwind CSS/shadcn.

**Spec:** `docs/superpowers/specs/2026-09-12-procedure-booking-with-optional-doctor-design.md`

## Global Constraints

- Use the canonical terms Appointment, Booking Path, Consultation, Procedure, DoctorSchedule, DoctorRota, DoctorSlot, Room, and Therapist from `CONTEXT.md`.
- Procedure Doctor assignment is independent of Procedure date/time and never loads or validates DoctorSchedules, DoctorRotas, or DoctorSlots.
- Doctor `N/A` means a nullable `doctorId`; never create a fake Doctor record.
- Procedure Room and Therapist are required in the form but remain temporary UI-only dependencies and are not sent to the API.
- Consultation request, validation, and DoctorSlot conflict behavior remain unchanged except for the new explicit `bookingPath` and stored time snapshot.
- Every backend change ships with colocated `*.unit.tests.ts` or `*.integration.tests.ts` coverage as required by `docs/backend-testing.md`.
- Update OpenAPI for every changed request/response contract and keep the `/appointments/new` loader page-shaped.

---

### Task 1: Define the discriminated Appointment create contract

**Files:**

- Modify: `app/api/lib/modules/appointment/schemas/appointment-schema.ts`
- Modify: `app/api/lib/modules/appointment/schemas/appointment-schema.unit.tests.ts`
- Modify: `app/api/v1/appointments/types.ts`
- Modify: `app/api/v1/appointments/route.unit.tests.ts`

**Interfaces:**

- Produces: `BookingPath = 'CONSULTATION' | 'PROCEDURE'`
- Produces: `CreateConsultationAppointmentInput` with Doctor/master/Rota/slots fields
- Produces: `CreateProcedureAppointmentInput` with optional `doctorId` and required `startTime`/`endTime`
- Produces: `CreateAppointmentInput` as the discriminated union keyed by `bookingPath`

- [ ] **Step 1: Write failing schema tests**

Add tests that prove a Procedure accepts no Doctor/master/Rota fields, accepts an active-Doctor-shaped `doctorId`, rejects Consultation-only keys under `.strict()`, rejects missing/invalid times, and rejects `endTime <= startTime`. Retain the existing Consultation cases with `bookingPath: 'CONSULTATION'`.

```ts
const procedurePayload = {
  bookingPath: 'PROCEDURE',
  patientId: 1,
  slotDate: '20-09-2026',
  startTime: '10:00',
  endTime: '11:15',
};

expect(createAppointmentSchema.safeParse(procedurePayload).success).toBe(true);
expect(createAppointmentSchema.safeParse({ ...procedurePayload, endTime: '09:45' }).success).toBe(
  false
);
```

- [ ] **Step 2: Run the schema test and verify RED**

Run: `bunx vitest run app/api/lib/modules/appointment/schemas/appointment-schema.unit.tests.ts`

Expected: failures show that `bookingPath`, Procedure time fields, and path-specific optionality are not implemented.

- [ ] **Step 3: Implement the discriminated Zod schema and public request type**

Factor common Patient/remarks fields once, then define strict path-specific objects. Export route request types from the schema-derived union rather than duplicating requiredness.

```ts
export const bookingPathValues = ['CONSULTATION', 'PROCEDURE'] as const;
export type BookingPath = (typeof bookingPathValues)[number];

export const createAppointmentSchema = z.discriminatedUnion('bookingPath', [
  createConsultationAppointmentSchema,
  createProcedureAppointmentSchema,
]);
```

- [ ] **Step 4: Run the schema test and verify GREEN**

Run: `bunx vitest run app/api/lib/modules/appointment/schemas/appointment-schema.unit.tests.ts`

Expected: all schema tests pass.

- [ ] **Step 5: Commit the contract slice**

```bash
git add app/api/lib/modules/appointment/schemas/appointment-schema.ts app/api/lib/modules/appointment/schemas/appointment-schema.unit.tests.ts app/api/v1/appointments/types.ts app/api/v1/appointments/route.unit.tests.ts
git commit -m "feat: define procedure appointment contract"
```

### Task 2: Validate Consultation and Procedure through separate branches

**Files:**

- Modify: `app/api/lib/modules/appointment/validator/create-appointment-validator.ts`
- Modify: `app/api/lib/modules/appointment/validator/create-appointment-validator.unit.tests.ts`

**Interfaces:**

- Consumes: discriminated `CreateAppointmentInput` from Task 1
- Produces: `ValidatedCreateAppointmentData` with Tenant time zone
- Produces: Procedure validation that optionally calls `doctorRepository.getDoctorById` but never calls slot/master repositories

- [ ] **Step 1: Write failing validator tests**

Test Doctor `N/A`, active Doctor, invalid Doctor, inactive Doctor, past Procedure time, and repository call boundaries. The key isolation assertion is:

```ts
await validateCreateAppointment(procedurePayload, 'tenant-1');

expect(mockedAppointmentRepository.getSlotBookingContext).not.toHaveBeenCalled();
expect(mockedAppointmentRepository.getReservedSlotTimes).not.toHaveBeenCalled();
expect(mockedModeRepository.getAppointmentModeById).not.toHaveBeenCalled();
expect(mockedTypeRepository.getAppointmentTypeById).not.toHaveBeenCalled();
expect(mockedReasonRepository.getAppointmentReasonById).not.toHaveBeenCalled();
```

- [ ] **Step 2: Run validator tests and verify RED**

Run: `bunx vitest run app/api/lib/modules/appointment/validator/create-appointment-validator.unit.tests.ts`

Expected: Procedure follows the existing Consultation-only Rota/master branch or rejects its payload.

- [ ] **Step 3: Implement path-specific validation**

Keep shared Tenant, Scheduled AppointmentStatus, Patient, reconciliation, and provisional-Patient checks. For Consultation call the existing slot/master validation. For Procedure validate only optional Doctor existence/activity and Tenant-local future time.

```ts
if (data.bookingPath === 'PROCEDURE') {
  const doctor = data.doctorId
    ? await doctorRepository.getDoctorById(data.doctorId, validatedTenantId)
    : undefined;
  // Return a controlled conflict for missing/inactive supplied Doctors.
  // Do not call any schedule, rota, slot, mode, type, or reason repository.
}
```

- [ ] **Step 4: Run validator and schema tests and verify GREEN**

Run: `bunx vitest run app/api/lib/modules/appointment/validator/create-appointment-validator.unit.tests.ts app/api/lib/modules/appointment/schemas/appointment-schema.unit.tests.ts`

Expected: both suites pass and Consultation regression cases remain green.

- [ ] **Step 5: Commit the validation slice**

```bash
git add app/api/lib/modules/appointment/validator/create-appointment-validator.ts app/api/lib/modules/appointment/validator/create-appointment-validator.unit.tests.ts
git commit -m "feat: validate procedure appointments without rota"
```

### Task 3: Persist Booking Path, optional Doctor, and direct time window

**Files:**

- Modify: `app/db/schema/appointment.ts`
- Generate: `app/db/drizzle/0057_*.sql`
- Generate: `app/db/drizzle/meta/0057_snapshot.json`
- Modify: `app/db/drizzle/meta/_journal.json`
- Modify: `app/api/lib/modules/appointment/repository/appointment-repository.ts`
- Modify: `app/api/lib/modules/appointment/repository/appointment-repository.integration.tests.ts`
- Modify: `app/api/lib/modules/appointment/commands/create-appointment-command.unit.tests.ts`

**Interfaces:**

- Consumes: validated discriminated input from Task 2
- Produces: nullable Appointment Doctor/master/Rota references and `bookingPath`, `startTime`, `endTime`
- Preserves: Appointment Slot Reservations exclusively for Consultations

- [ ] **Step 1: Write failing repository integration tests**

Add read/write tests for Procedure Doctor `N/A` and an assigned Doctor, assert no Appointment Slot Reservation rows are created, and retain Consultation slot reservation/conflict tests.

```ts
expect(created.data).toMatchObject({
  bookingPath: 'PROCEDURE',
  doctor: null,
  startTime: '10:00',
  endTime: '11:15',
  appointmentMode: null,
  appointmentType: null,
  appointmentReason: null,
  rotaName: null,
  slots: [],
});
```

- [ ] **Step 2: Run the repository test and verify RED**

Run: `bunx vitest run app/api/lib/modules/appointment/repository/appointment-repository.integration.tests.ts`

Expected: the current schema/repository requires Doctor, Rota, and master identifiers.

- [ ] **Step 3: Update the Drizzle schema and generate the migration**

Add `bookingPath`, `startTime`, and `endTime`; make `doctorId`, Appointment master IDs, and `rotaName` nullable. Default historical `bookingPath` rows to `CONSULTATION`; historical time snapshots may remain null.

Run: `bun run db:generate`

Expected: migration `0057` alters only the Appointment table and records the new snapshot.

- [ ] **Step 4: Implement repository branching and nullable reads**

Use left joins for optional references. Consultation locks and validates slot context, writes Appointment Slot Reservations, and derives its end snapshot from the last selected slot plus slot duration. Procedure writes its direct time window and skips all DoctorSlot reservation work.

```ts
if (data.bookingPath === 'CONSULTATION') {
  // Existing locked slot-context and reservation workflow.
} else {
  // Insert the Appointment only; doctorId may be null.
}
```

- [ ] **Step 5: Update command fixtures and run backend slice tests**

Run: `bunx vitest run app/api/lib/modules/appointment/commands/create-appointment-command.unit.tests.ts app/api/lib/modules/appointment/repository/appointment-repository.integration.tests.ts`

Expected: command and repository suites pass when the test database is configured.

- [ ] **Step 6: Commit persistence**

```bash
git add app/db/schema/appointment.ts app/db/drizzle app/api/lib/modules/appointment/repository/appointment-repository.ts app/api/lib/modules/appointment/repository/appointment-repository.integration.tests.ts app/api/lib/modules/appointment/commands/create-appointment-command.unit.tests.ts
git commit -m "feat: persist procedure appointment windows"
```

### Task 4: Make Appointment readers safe for Doctor N/A

**Files:**

- Modify: `app/(protected)/appointments/_components/appointments-table.tsx`
- Modify: `app/(protected)/appointments/_components/_sheets/appointment-detail-sheet.tsx`
- Modify: `app/(protected)/visits/_components/_sheets/check-in-sheet.tsx`
- Modify: `app/api/lib/modules/visit/validator/check-in-visit-validator.ts`
- Modify: `app/api/lib/modules/visit/validator/check-in-visit-validator.unit.tests.ts`

**Interfaces:**

- Consumes: nullable Appointment response fields from Task 3
- Produces: `N/A` display values and a controlled Check-in conflict for missing Doctor

- [ ] **Step 1: Write a failing Check-in validator test**

```ts
mockedAppointmentRepository.getAppointmentById.mockResolvedValue({
  ...procedureAppointment,
  doctor: null,
});

await expect(validateCheckInVisit(payload, 'tenant-1')).resolves.toMatchObject({
  success: false,
  errors: ['A Doctor must be assigned before this Appointment can be checked in.'],
});
```

- [ ] **Step 2: Run the Check-in validator test and verify RED**

Run: `bunx vitest run app/api/lib/modules/visit/validator/check-in-visit-validator.unit.tests.ts`

Expected: current code dereferences `appointment.doctor.id`.

- [ ] **Step 3: Implement the guard and nullable UI rendering**

Display Appointment `bookingPath`, direct time, and `N/A` for missing Doctor/master/Rota values. Prefer `startTime`/`endTime`, falling back to historical `slots` when time snapshots are null.

- [ ] **Step 4: Run targeted tests and TypeScript**

Run: `bunx vitest run app/api/lib/modules/visit/validator/check-in-visit-validator.unit.tests.ts app/api/lib/modules/patient-timeline/repository/patient-timeline-repository.integration.tests.ts`

Run: `bunx tsc --noEmit`

Expected: no nullable-reference errors and all available tests pass.

- [ ] **Step 5: Commit reader safety**

```bash
git add app/api/lib/modules/visit/validator 'app/(protected)/appointments' 'app/(protected)/visits'
git commit -m "fix: handle appointments without assigned doctors"
```

### Task 5: Transform the Book Appointment form into path-specific requests

**Files:**

- Modify: `app/(protected)/appointments/new/_utils/book-appointment-form-schema.ts`
- Modify: `app/(protected)/appointments/new/_utils/book-appointment-form-schema.unit.tests.ts`
- Modify: `app/(protected)/appointments/new/_utils/book-appointment-request.ts`
- Modify: `app/(protected)/appointments/new/_utils/book-appointment-request.unit.tests.ts`
- Modify: `app/(protected)/appointments/new/_utils/submit-book-appointment.ts`
- Modify: `app/(protected)/appointments/new/_utils/submit-book-appointment.unit.tests.ts`
- Create: `app/(protected)/appointments/new/_utils/procedure-time-options.ts`
- Create: `app/(protected)/appointments/new/_utils/procedure-time-options.unit.tests.ts`

**Interfaces:**

- Produces: Procedure form validation that requires Treatment, Session, date, start/end, Room, and Therapist but not Rota or Appointment Details
- Produces: `getProcedureStartTimes()` returning 15-minute choices
- Produces: `getProcedureEndTime(startTime, sessionDuration)`
- Produces: Procedure API request with `doctorId` omitted for form value `not-applicable`

- [ ] **Step 1: Rewrite form/request tests first**

Assert Consultation requiredness remains. Assert a complete Procedure is valid with `doctorId: 'not-applicable'`, empty Rota/master fields, and required resource fields. Assert request output is exactly:

```ts
expect(request).toEqual({
  bookingPath: 'PROCEDURE',
  patientId: 42,
  slotDate: '20-09-2026',
  startTime: '10:00',
  endTime: '11:15',
});
```

Add the selected-Doctor variant with `doctorId` and verify Room/Therapist/Treatment/Session temporary IDs are omitted.

- [ ] **Step 2: Run frontend utility tests and verify RED**

Run: `bunx vitest run app/'(protected)'/appointments/new/_utils/book-appointment-form-schema.unit.tests.ts app/'(protected)'/appointments/new/_utils/book-appointment-request.unit.tests.ts app/'(protected)'/appointments/new/_utils/submit-book-appointment.unit.tests.ts app/'(protected)'/appointments/new/_utils/procedure-time-options.unit.tests.ts`

Expected: missing helper plus old Doctor/Rota/master validation and request shape failures.

- [ ] **Step 3: Implement minimal path-specific form and request logic**

Use `visitType` only as the form's Booking Path field unless renaming it is low-risk across all route-local files. For Procedure calculate the end from the selected Session duration and omit `doctorId` when its value is `not-applicable`.

- [ ] **Step 4: Run frontend utility tests and verify GREEN**

Run the Task 5 command again.

Expected: all route-local utility tests pass.

- [ ] **Step 5: Commit frontend domain logic**

```bash
git add 'app/(protected)/appointments/new/_utils'
git commit -m "feat: build procedure appointment requests"
```

### Task 6: Render a separate Procedure schedule and decouple queries

**Files:**

- Create: `app/(protected)/appointments/new/_components/procedure-schedule-section.tsx`
- Modify: `app/(protected)/appointments/new/_components/appointment-schedule-section.tsx`
- Modify: `app/(protected)/appointments/new/_components/doctor-selection-section.tsx`
- Modify: `app/(protected)/appointments/new/_components/use-book-appointment.ts`
- Modify: `app/(protected)/appointments/new/_components/book-appointment-page-impl.tsx`
- Modify: `app/(protected)/appointments/new/loader.tsx`

**Interfaces:**

- Consumes: Task 5 procedure time helpers and form schema
- Produces: Procedure UI containing Doctor (`N/A` plus active Doctors), Treatment/Session, date/start/derived-end time, Room, Therapist, and Book Procedure
- Preserves: current Consultation schedule and Appointment Details UI

- [ ] **Step 1: Add the `N/A` Doctor option and Procedure schedule component**

Doctor `N/A` is selected when switching to Procedure. `ProcedureScheduleSection` receives only form control, selected Session duration, date/time values, and time change callbacks—no Doctor, DoctorRota, or DoctorSlot props.

```tsx
{
  isProcedurePath ? (
    <ProcedureScheduleSection
      control={form.control}
      session={selectedSession}
      startTime={values.startTime}
      endTime={values.endTime}
      onDateChange={booking.changeProcedureDate}
      onStartTimeChange={booking.changeProcedureStartTime}
    />
  ) : (
    <AppointmentScheduleSection {...consultationScheduleProps} />
  );
}
```

- [ ] **Step 2: Decouple Procedure queries and errors**

Pass `doctorId: null` to `useDoctorSlotsQuery` for Procedure. Do not include Appointment master loading/errors in the Procedure dependency state. Never clear or recalculate Procedure time because Doctor changed.

- [ ] **Step 3: Hide Procedure Appointment Details and preserve resources**

Render `AppointmentDetailsSection` only for Consultation. Keep Room and Therapist required after the Procedure date/start time is selected. Render the submit action after resource selection with exact API errors.

- [ ] **Step 4: Update the route loader**

Keep the two-column wizard skeleton but remove Procedure-inaccurate schedule/detail shapes and include the resource blocks.

- [ ] **Step 5: Run TypeScript, route tests, and route lint**

Run: `bunx tsc --noEmit`

Run: `bunx vitest run app/'(protected)'/appointments/new`

Run: `bunx eslint app/'(protected)'/appointments/new`

Expected: all checks pass with no errors.

- [ ] **Step 6: Commit the Procedure UI**

```bash
git add 'app/(protected)/appointments/new'
git commit -m "feat: add rota-free procedure booking workflow"
```

### Task 7: Update domain and API documentation

**Files:**

- Modify: `CONTEXT.md`
- Create: `docs/adr/0045-procedure-appointments-use-direct-time-windows.md`
- Modify: `app/api/lib/openapi/document.ts`

**Interfaces:**

- Documents: Booking Path persistence, optional Procedure Doctor, direct Procedure time windows, and the absence of Procedure resource conflict enforcement

- [ ] **Step 1: Update canonical Appointment language**

Describe Appointment as a scheduled Patient period whose requirements depend on Booking Path. State that Consultation reserves consecutive DoctorSlots and Procedure may use a direct time window with an optional Doctor assignment.

- [ ] **Step 2: Record the architecture decision**

Use the repository ADR format with Context, Decision, Consequences, and Rejected Alternatives. Explicitly reject fake N/A Doctor/Rota/master records and a separate Procedure endpoint.

- [ ] **Step 3: Update OpenAPI and examples**

Document the `oneOf` request shapes with a `bookingPath` discriminator; nullable response references; success examples for Procedure Doctor `N/A` and Consultation; and invalid time/Doctor/slot conflicts.

- [ ] **Step 4: Run documentation-adjacent checks**

Run: `bunx tsc --noEmit`

Run: `git diff --check`

Expected: types and whitespace checks pass.

- [ ] **Step 5: Commit documentation**

```bash
git add CONTEXT.md docs/adr/0045-procedure-appointments-use-direct-time-windows.md app/api/lib/openapi/document.ts
git commit -m "docs: define rota-free procedure appointments"
```

### Task 8: Verify every Book Appointment workflow

**Files:**

- Verify only; fix regressions in the owning task's files and tests

**Interfaces:**

- Produces: evidence that Consultation, Procedure Doctor N/A, and Procedure selected-Doctor workflows match the specification

- [ ] **Step 1: Run automated verification**

Run: `bun run test:unit`

Run: `bun run test` when `TEST_DATABASE_URL` is configured.

Run: `bunx tsc --noEmit`

Run: `bun run lint`

Run: `bun run build`

Run: `git diff --check`

Expected: all configured checks pass. Report missing `TEST_DATABASE_URL` explicitly rather than claiming integration success.

- [ ] **Step 2: Review the final diff against the spec**

Confirm no Procedure path imports or calls DoctorSlot/Rota logic, no temporary Treatment/Session/Room/Therapist IDs enter the POST body, and Consultation behavior is unchanged.

- [ ] **Step 3: Walk through Consultation in the authenticated browser**

Verify registered-Patient selection, real Doctor, date, Doctor Rota, available consecutive DoctorSlots, Appointment Details, and Book Consultation. Do not submit a real Appointment.

- [ ] **Step 4: Walk through Procedure with Doctor N/A**

Verify Doctor N/A, Treatment, explicit Session, date, static start time, calculated end time, Room, Therapist, no Doctor Rota, no Appointment Details, and Book Procedure. Do not submit a real Appointment.

- [ ] **Step 5: Walk through Procedure with a selected Doctor**

Verify an active Doctor can replace N/A without loading or changing date/time options and without introducing Doctor Rota. Do not submit a real Appointment.

- [ ] **Step 6: Report verification evidence and limitations**

Report exact test counts, lint warnings, build result, browser-observed behavior, integration-test availability, and the temporary lack of persisted Room/Therapist conflicts.
