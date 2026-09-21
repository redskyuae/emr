# Patient Treatment Plans in Procedure Booking

**Date:** 2026-09-16
**Status:** Approved in chat

## Problem

The Book Appointment screen currently loads every Tenant Treatment master and presents each one as available to assign. It cannot identify Treatments already assigned to the selected Patient, represent Patient-specific Session progress, or prevent the same planned Session from being booked twice.

The supplied `DhathriDetails.xlsx` workbook contains patient-linked Treatment history rather than only a reusable Treatment catalogue. Its `TreatmentDetails` sheet contains 8,491 source rows across 1,185 MRNs, with Treatment-level and Session-level status. The same Treatment may be prescribed with different Session counts, so the reusable Treatment master cannot own Patient progress or the final prescribed count.

## Domain Model

### Treatment masters

A Treatment remains a reusable Tenant-scoped clinical protocol. Its Session Structure is one of:

- **Repeatable:** one Session template may be repeated for a Patient-specific `totalSessions`. The count is editable when assigning the Treatment.
- **Sequenced:** the Treatment defines a fixed ordered set of distinct Session templates. The Patient Treatment Plan copies that sequence and its count is not editable.

Imported Dhathri Treatments are Repeatable. Their duration, setup time, cleaning time, room type, therapist skill, equipment, preparation, and warnings remain unknown because the workbook does not provide those values.

### Patient Treatment Plans

A Patient Treatment Plan assigns one Treatment to one Patient within one Tenant. It snapshots the Treatment name, code, Session Structure, and applicable Session details at assignment time. Later Treatment-master edits do not rewrite the Plan or its history.

A Plan owns Patient Treatment Plan Sessions. The normal Plan lifecycle is system-controlled:

- `PENDING`: no Sessions are completed.
- `IN_PROGRESS`: at least one, but not all, Sessions are completed.
- `COMPLETED`: every planned Session is completed.
- `STOPPED`: an explicit clinical action ended the Plan early.

Pending and In Progress Plans are current. Completed and Stopped Plans are historical.

### Patient Treatment Plan Sessions

A Patient Treatment Plan Session is one numbered Patient-specific occurrence within a Plan. It may retain a nullable reference to a reusable Treatment Session template, but its snapshot is authoritative for the Patient's prescription.

The Session becomes Completed only when its linked Visit is completed. Booking or checking in does not complete it. Appointment or Visit cancellation does not complete it.

Each Procedure Appointment holds an exclusive Patient Treatment Plan Session Reservation. A database constraint prevents two active reservations for the same Plan Session. Cancelling or marking the Appointment as No Show releases its reservation. Rescheduling retains the same reservation.

## Procedure Booking Workflow

After the operator selects a registered Patient and chooses the Procedure Booking Path:

1. Load the Patient's current Treatment Plans and all their Sessions.
2. If exactly one current Plan has an eligible Session, select that Plan and its lowest-numbered bookable Session automatically.
3. If multiple current Plans exist, show all of them and require the operator to choose one. After selection, default to its lowest-numbered bookable Session while allowing any other incomplete, unreserved Session.
4. Completed Sessions and Sessions with active Appointment reservations remain visible in progress details but are not selectable. The API supplies `isBookable` and the reason when false.
5. If current Plans exist but none has a bookable Session, show the reservation conflict. Do not expose catalogue search.
6. Only when the Patient has no current Plan, show remote Treatment catalogue search.
7. Assigning a Repeatable Treatment requires `totalSessions`, prefilled from the Treatment default when one exists and editable for the Patient's prescription. Assigning a Sequenced Treatment copies its fixed template sequence and does not allow editing the count.
8. The new Plan, its Sessions, the first Session reservation, and the Procedure Appointment are created atomically. Merely choosing a Treatment in the UI creates no records.

For imported Treatments with unknown duration, show `Duration not configured` and require the operator to enter the Procedure end time manually. Do not invent duration or resource defaults, and do not filter Rooms or Therapists using unavailable metadata.

## APIs

### Patient Treatment Plans

Add:

`GET /api/v1/patients/{patientId}/treatment-plans?status=current`

The response returns every current Plan and its full Session list. Each Plan includes its identifier, derived status, Treatment snapshot, prescribed count, completed count, and Session Structure. Each Session includes its identifier, number, completion state, reservation state, nullable snapshot metadata, nullable legacy Conduction Note, `isBookable`, and a reason when unavailable.

The endpoint is Tenant-isolated and requires `patient-treatment-plan:read`.

### Treatment catalogue

Keep the existing paginated `GET /api/v1/treatments?query=...` endpoint for tenant-wide remote catalogue search. The booking screen uses it only when the Patient has no current Plan and the Current User holds `patient-treatment-plan:assign`.

Valid imported Treatments are searchable and visibly labelled as legacy. Search results show the full source code and name plus missing-duration state. Quarantined Treatments are excluded.

### Appointment creation

The Procedure request explicitly distinguishes:

- an existing Plan selection containing `patientTreatmentPlanId` and `patientTreatmentPlanSessionId`; or
- a catalogue assignment containing `treatmentId` and, for a Repeatable Treatment, `totalSessions`.

Appointment creation verifies that the Plan belongs to the selected Patient and active Tenant, the Plan is current, the Session belongs to the Plan, the Session is incomplete, and no active reservation exists. A concurrent reservation conflict returns `409 Conflict` and the client refreshes the Patient Plans.

Appointments retain Treatment references for reporting and backward compatibility, but the Patient Treatment Plan Session is authoritative for new Procedure bookings.

## Permissions

Add:

- `patient-treatment-plan:read` — view Patient Treatment Plans and Sessions.
- `patient-treatment-plan:assign` — assign a catalogue Treatment to a Patient and create a Plan.

Booking an existing assigned Plan requires `appointment:create` and `patient-treatment-plan:read`. Creating a Plan through catalogue fallback additionally requires `patient-treatment-plan:assign`. These permissions do not grant Treatment-master create or update authority.

## Dhathri Import

### Execution boundary

Replace the existing Dhathri treatment import behavior with a dedicated one-off command. The command:

- requires an explicit target Tenant rather than searching across Tenants;
- supports dry run;
- is idempotent;
- imports in transactional batches;
- never commits the workbook or patient data to Git;
- emits imported, skipped, and quarantined counts plus a detailed conflict report.

The confirmed Dhathri target is Tenant `N5eSMvVQtLopN4ooFYN3W9GagQ4XJx8S`. The new command must still require the Tenant argument and verify it before work begins rather than hardcoding it.

The configured database was unavailable during design. Before importing, the dry run must detect whether the old scripts were already executed. Those scripts fabricated 60-minute duration, 10-minute setup, 5-minute cleaning, `Panchakarma room`, and `Abhyanga`; capped Sessions at 12; converted invalid totals to 1; and skipped code/name collisions. If records matching that pattern exist, stop and produce a remediation report. Do not delete or rewrite possibly referenced records automatically.

### Source preservation and matching

Persist every workbook source row in a Tenant-scoped import audit record with its batch, source row, raw values, and deterministic source identity. Treat blank values and literal `NULL` notes as null.

Match an existing Patient only by `tenantId + MRN`. Do not create Patients or Visits as a side effect. Missing or ambiguous Patient matches quarantine the affected Plan.

Retain legacy `VisitID` and `VisitNumber` as provenance and idempotency data only. They are not foreign keys and do not own the Patient Treatment Plan.

The exact full `Treatment` cell is the legacy Treatment identity. Split its first underscore into source code and display name for search, but do not merge different full values merely because their parsed code or name matches. Catalogue uniqueness must support the full source identity because source codes and names are not independently unique.

An identical workbook re-import is a no-op. A changed workbook creates a new import batch and compares source identities. Conflicting changes are quarantined for review rather than overwriting Plans, completed Sessions, or Appointment links.

### Canonical Plan construction

For unambiguous records, the deterministic legacy Plan key is the Tenant plus `MRN + VisitID + full Treatment value`. Session rows create Patient Treatment Plan Sessions by Session number. `ConductionNote` is stored as a nullable legacy Session note, not as Treatment-master content.

When a source Plan has no Session rows but has a positive integer `TotalSession`, generate Pending Sessions numbered `1...TotalSession`. Do not impose an arbitrary smaller legacy-import maximum.

Map legacy `Pending`, `Progress`, `Completed`, and `Stop` to the canonical Plan lifecycle only when Treatment-level status agrees with Session evidence. Quarantine records when any of the following applies:

- duplicated Session numbers within the apparent Plan;
- conflicting Treatment statuses;
- conflicting `TotalSession` values;
- non-positive, missing, or non-integer totals;
- Treatment-level status contradicts Session completion;
- missing or ambiguous Patient MRN match;
- structural parsing or persistence validation failure.

All raw source rows remain in the audit records even when their canonical Plan is quarantined.

## Backward Compatibility

Existing Procedure Appointments may have Treatment and Treatment Session references without a Patient Treatment Plan Session. Keep the new reference nullable for these historical records and retain their current read behavior. Do not infer or manufacture historical Plan assignments from Appointment or Visit rows.

Only Procedure Appointments created after deployment use the Plan-based request and reservation invariant.

## Documentation

- `CONTEXT.md` defines Patient Treatment Plan, Patient Treatment Plan Session, Patient Treatment Plan Session Reservation, and Treatment Session Structure.
- ADR 0046 records why Procedure Appointments reserve Patient Treatment Plan Sessions rather than generic Treatment Session templates.
- OpenAPI must document both Procedure Treatment selection shapes, the patient-scoped read response, nullable legacy metadata, permissions, and reservation conflicts.

## Testing

Backend changes require colocated plural-suffix Vitest files per `docs/backend-testing.md`. Coverage includes:

- schema constraints, Tenant isolation, snapshots, Plan/Session relationships, and active reservation uniqueness;
- Repeatable and Sequenced Plan creation;
- derived lifecycle transitions on Visit completion;
- release on Appointment cancellation and No Show;
- existing-Plan and catalogue-assignment Appointment request validation;
- transactional Plan, Sessions, reservation, and Appointment creation;
- patient-scoped API authorization and bookability reasons;
- legacy Appointment compatibility;
- importer dry run, idempotency, MRN matching, source identity, generated Sessions, every quarantine rule, and old-import detection.

Frontend tests cover the three primary states: one current Plan, multiple current Plans, and no current Plan. They also cover no-bookable-Session conflicts, permission-gated catalogue search, Repeatable versus Sequenced assignment, missing-duration manual end time, and stale reservation conflicts.

Final verification requires `bun run test`, `bunx tsc --noEmit`, lint, production build, importer dry run against the target Tenant, and an authenticated browser walkthrough without submitting an unintended Appointment.

## Out of Scope

- Creating or editing Patients or Visits during Treatment import.
- Automatically reconciling quarantined clinical data.
- Automatically rewriting records produced by the old Dhathri import scripts.
- A Patient Treatment Plan management screen or Stopped transition UI.
- Retrofitting existing Procedure Appointments into inferred Plans.
- Inventing legacy duration or Room/Therapist requirements.
