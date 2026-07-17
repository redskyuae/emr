# Plan: Inpatient Management (IPD) — Admissions, Wards, Beds, Transfers, Discharge

> Standalone implementation plan. Written for an implementing agent that has **not** seen the
> planning conversation. Read `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`, `DESIGN.md`, `lessons.md`,
> and `docs/backend-testing.md` before starting. Follow every convention in those docs exactly —
> this plan describes _what_ to build and _in what order_; those docs remain the binding _how_.
>
> Supersedes the previous plan in this file (Visit Management), which is fully implemented and
> merged (PR #246).

## 1. Goal

Make the EMR a genuine **hospital** system, not just an OPD clinic tool. `CONTEXT.md` already
defines **Admission** ("an inpatient clinical event… a Patient is admitted to a Facility and
occupies a Bed"), **Ward**, and **Bed** — none of which exist in the schema. Rooms exist but only
carry an integer `bedCount`; there is no Bed entity, no Ward, and no way to admit a patient.

This plan adds the **Inpatient (IPD)** capability: Ward and Bed masters, an AdmissionType master,
the **Admission** module (admit → transfer bed → discharge/cancel lifecycle with bed-status sync),
inpatient clinical capture (vitals + notes stamped with `admissionId`, mirroring the Visit work),
an **Admissions census** screen, a ward-wise **Bed Board**, master CRUD screens, nav/menu entries,
permissions, onboarding seeds, Swagger, ADRs, and glossary terms. Both FE and BE, tests colocated.

### In scope (confirmed)

1. **Ward master** — tenant-scoped Master (standard master pattern).
2. **Bed entity** — physical bed in a Ward (optional Room link), fixed system Bed Status set,
   CRUD as a master screen plus the operational Bed Board.
3. **AdmissionType master** — tenant-scoped Master, seeded at onboarding.
4. **Admission module** — full CQRS stack: admit (with optional source Visit link), bed transfer
   (with history), discharge (disposition + summary), cancel, update, list/get, soft delete.
5. **Bed status sync** — admit/transfer/discharge/cancel flip Bed status inside the same
   transaction (precedent: Visit ↔ Appointment status sync, ADR 0030).
6. **Inpatient clinical capture** — nullable `admissionId` FK on `patient_vital_sign` and
   `clinical_note`, mirroring the existing `visitId` wiring.
7. **Frontend** — `/admissions` census + admit sheet + transfer/discharge/cancel surfaces,
   `/admissions/[id]` detail with bed history and in-admission vitals/notes capture,
   `/bed-board` ward-wise occupancy grid, `inpatient-masters/{wards,beds,admission-types}` CRUD
   screens, nav groups + pageMeta.
8. Permission-catalogue additions + migration, onboarding seed, Swagger, ADRs, CONTEXT.md terms.

### Out of scope (explicit)

- **Billing / bed charges** — Room Type already carries a daily rate; charge capture per bed-day
  is the billing plan's job. Record nothing monetary here.
- **Nursing worklists, medication administration (MAR), doctor rounds, I/O charts** — inpatient
  charting in v1 is vitals + clinical notes only, same capture surfaces as Visits.
- **Discharge summary as a formatted document** — v1 stores it as text on the Admission; a
  templated/printable summary is a future enhancement.
- **Transfer Center / inter-facility transfers** (Epic Grand Central territory) — transfers in v1
  are bed-to-bed within the Tenant.
- **Room Status sync** — the existing Rooms module manages Room Status manually; do **not** wire
  Bed status changes back to Room status in v1 (open decision §12.4).
- **Bed reservations workflow** — RESERVED is a manually set Bed status, not a reservation entity
  with a target patient.
- **Facility scoping** — same stance as the Visit plan: no `facility` table exists yet; everything
  is tenant-scoped, add `facilityId` when the Facility module lands. Ward's glossary entry says
  "section of a Facility" — acceptable drift, documented.
- **Encounter hierarchy / OpenMRS-style visit-contains-admission** — Admission is its own
  top-level clinical event, optionally _linked from_ a Visit, never nested in one.

## 2. Competitor / standards research (why the model looks like this)

- **FHIR** models an inpatient stay as an `Encounter` with `class = IMP`, and the physical
  hierarchy as `Location` resources (ward → room → bed) with an operational status; the encounter
  tracks its current location over time and a discharge disposition (routine, LAMA-equivalent,
  transfer, expired…) on `Encounter.hospitalization`. We adopt: Bed as a first-class located
  entity, an admission that always points at its current Bed, a movement history, and a fixed
  discharge-disposition set. (hl7.org/fhir/encounter.html, /location.html)
- **OpenMRS / Bahmni bed management + ADT module** is the closest open-source reference: wards
  ("admission locations") contain beds laid out on a grid; a bed must be assigned at admission;
  the IPD app shows worklists (to admit / admitted / to discharge) and a color-coded bed layout;
  beds support tags and an **Expected Date of Discharge**. We adopt: bed-first admission, the
  ward-wise Bed Board grid, and optional `expectedDischargeDate`.
  (github.com/openmrs/openmrs-module-bedmanagement, Bahmni wiki "Admit, Discharge and Transfer
  Patients", "Bed Management (BM)")
- **Epic Grand Central** is the enterprise ADT benchmark: real-time bed planning, patient location
  tracking, housekeeping integration, transfer center. Far beyond v1, but it confirms the census +
  bed board as the two core operational views, and that ADT events (admit/transfer/discharge) are
  the atomic unit everything else hangs off. We adopt the event model; housekeeping/transport
  integration is future work.
- **Indian HMS IPD modules** (Lifemaan, Aarogya HMIS, SWI, PatientERP, DoctorsApp…) uniformly
  ship: admission with an admission type (emergency/planned/transfer-from-OPD), admitting
  consultant, real-time color-coded bed dashboard, one-click ward/bed transfer with history,
  discharge with disposition incl. **LAMA** and death, and an auto-assembled discharge summary.
  We adopt: AdmissionType master, admitting Doctor, transfer history, LAMA/DECEASED dispositions,
  free-text discharge summary in v1.

## 3. Key design decisions

1. **Admission is a top-level clinical event, sibling of Visit — never nested.** Optional
   `visitId` records "admitted from this OPD Visit" (the Indian-HMS "transfer from OPD" flow);
   a direct/emergency admission has no Visit. Glossary rule: "Distinct from a Visit — do not
   conflate them."

2. **Bed-first admission (Bahmni precedent).** Admitting requires choosing a concrete Bed; the
   Ward is always derived from the Bed (`admission.bedId` → `bed.wardId`), never stored on the
   Admission. Transfers move the Admission to another Bed and log history.

3. **Bed Status is a fixed system-defined set** — like Room Status and Visit Status, not a
   Master: `AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE` (varchar + CHECK). `OCCUPIED` is
   **system-managed only**: it is set/cleared exclusively by admission transactions; the Bed CRUD
   API may set the other three but must reject manual `OCCUPIED` writes. Record in an ADR.

4. **Admission Status is a fixed system-defined set**: `ADMITTED`, `DISCHARGED`, `CANCELLED`.
   Transitions (validators enforce; each transition is its own command):
   - `ADMITTED → DISCHARGED` (discharge; requires disposition)
   - `ADMITTED → CANCELLED` (cancel — wrong admission/patient left before care; requires reason)
   - Bed transfer is allowed only while `ADMITTED`.
   - Discharged/cancelled Admissions are immutable except soft delete.

5. **Discharge Disposition is a fixed system-defined set** (FHIR + Indian HMS): `ROUTINE`,
   `LAMA`, `TRANSFERRED`, `DECEASED`, `ABSCONDED`. Stored on the Admission, required at
   discharge. Tenant-custom dispositions are an explicit non-goal for v1 (§12.3).

6. **Bed status sync happens inside the admission command's transaction** (ADR 0030 precedent):
   admit → target bed `OCCUPIED`; transfer → old bed `AVAILABLE`, new bed `OCCUPIED`; discharge/
   cancel → bed `AVAILABLE`. Beds in `AVAILABLE` **or** `RESERVED` status are admittable/
   transfer targets (a reservation exists to be used); `OCCUPIED`/`MAINTENANCE` are not.

7. **Admission Number** is a permanent human-facing identifier, `ADM-` + tenant-scoped sequence
   starting at `1001`, generated exactly like Visit/Booking Number (ADR 0024/0028: counter table +
   transactional increment). Immutable, never reused. New ADR mirrors 0028.

8. **Uniqueness invariants** (partial unique indexes + validator checks, `lessons.md` pattern):
   - At most **one active Admission per Patient** per tenant (`status = 'ADMITTED'`).
   - At most **one active Admission per Bed** per tenant — the DB-level backstop that makes bed
     occupancy race-safe (the `OCCUPIED` flag is a projection of this invariant).

9. **Admission gates** (validator, exact messages §6): patient exists in tenant, is **Registered**
   (not Provisional) and **active** (glossary: an Inactive Patient cannot be admitted); doctor
   exists + active; admission type exists; bed exists and is admittable (decision 6); when
   `visitId` is supplied it must exist in tenant, belong to the same patient, and not be
   cancelled.

10. **Transfer history is its own table** (`admission_bed_transfer`): from-bed, to-bed, reason,
    timestamp. The initial bed assignment is the Admission itself, not a transfer row.

11. **Masters follow the house pattern exactly.** `ward` and `admission-type` clone the
    `visit-type` module shape (name/code/description/isActive, uppercase codes, partial unique
    indexes on lower(name)/lower(code)). **Ward delete is guarded**: a Ward cannot be removed
    while any non-deleted Bed is assigned to it (Room Type precedent). **Bed delete is guarded**:
    an occupied Bed cannot be removed. AdmissionType mirrors VisitType (no in-use guard, same
    documented follow-up).

12. **Bed ↔ Room**: `bed.roomId` is an **optional** FK to the existing `room` table (glossary: a
    Room holds Beds, but Rooms today are an independent registry with free-text ward-ish fields).
    No consistency enforcement against `room.bedCount` in v1 (§12.4).

13. **Inpatient clinical capture mirrors the Visit wiring**: nullable `admission_id` columns +
    FKs on `patient_vital_sign` and `clinical_note`; a record may reference a Visit **or** an
    Admission, never both (validator rule + DB CHECK).

14. Soft delete per ADR 0012 (`deleteWard`, `deleteBed`, `deleteAdmissionType`,
    `deleteAdmission`); schema export naming per ADR 0015 (`export const ward = pgTable(...)`,
    imported `as wardTable`).

## 4. Domain glossary additions (`CONTEXT.md`)

**Admission**, **Ward**, **Bed** already exist — extend, don't redefine. Add:

- **Admission Number** — The permanent, human-facing identifier assigned by the system to an
  Admission within a Tenant, formatted as `ADM-` followed by a Tenant-scoped sequence beginning
  at `1001`. Immutable and never reused, including after the Admission is removed.
- **Admission Status** — The lifecycle state of an Admission: Admitted, Discharged, or Cancelled.
  A fixed system-defined set (like Visit Status), not a Tenant-scoped Master.
- **AdmissionType** — A Tenant-scoped Master that classifies how a Patient came to be admitted,
  such as Emergency, Elective, Transfer, or Maternity. Distinct from VisitType, which classifies
  outpatient Visits.
- **Active Admission** — An Admission in the Admitted status. A Patient has at most one Active
  Admission at a time within a Tenant, and a Bed hosts at most one Active Admission.
- **Bed Number** — The human-facing identifier for a Bed within its Ward (e.g., `ICU-01`).
  Unique within the Ward, compared case-insensitively.
- **Bed Status** — The operational state of a Bed: Available, Occupied, Reserved, or Maintenance.
  A fixed system-defined set (like Room Status). Occupied is system-managed: it is set and
  cleared only by Admission lifecycle events, never edited directly.
- **Bed Transfer** — The movement of an Active Admission from one Bed to another within the
  Tenant, recorded with the source Bed, target Bed, reason, and time. The Admission always
  reflects the current Bed.
- **Discharge** — The act that ends an Active Admission: recording the Discharge Disposition and
  optional Discharge Summary, and releasing the Bed.
- **Discharge Disposition** — The system-defined outcome of a Discharge: Routine, LAMA (leave
  against medical advice), Transferred, Deceased, or Absconded.
- **Discharge Summary** — The narrative record captured at Discharge describing the course of the
  Admission. Stored as text on the Admission in this version.
- **Expected Discharge Date** — The anticipated date an Active Admission will end; informational,
  editable while Admitted.
- **Bed Board** — The ward-wise operational view of every Bed and its Bed Status, showing the
  Patient occupying each Occupied Bed.
- **Inpatient Census** — The list of Admissions, defaulting to Active Admissions, used by ward
  staff to see who is currently admitted, where, and under which Doctor.

New ADRs (numbered after the current max, 0031):

- `0032-admission-number-is-tenant-scoped-generated-sequence.md` (decision 7)
- `0033-bed-status-is-a-fixed-system-set-managed-by-admissions.md` (decisions 3 & 6)
- `0034-one-active-admission-per-patient-and-per-bed.md` (decision 8)
- `0035-admission-lifecycle-and-discharge-disposition-are-fixed-sets.md` (decisions 4 & 5)

## 5. Data model

New files under `app/db/schema/`; all tables carry `tenantId varchar(255) notNull` +
`masterColumns()`. Read `lessons.md` before writing the partial unique indexes. Copy
`visit-type.ts` for the masters and `visit.ts` for the event + counter tables.

**`ward.ts`** → `ward` (standard master, mirror `visit-type.ts`)

| column      | type                         | notes            |
| ----------- | ---------------------------- | ---------------- |
| name        | varchar(100) notNull         |                  |
| code        | varchar(20) notNull          | stored uppercase |
| description | text                         |                  |
| isActive    | boolean notNull default true |                  |

- Unique: `(tenantId, lower(name))` and `(tenantId, lower(code))`, both `where is_deleted = false`

**`admission-type.ts`** → `admission_type` — identical shape to `ward`.

**`bed.ts`** → `bed`

| column    | type                                    | notes                                                      |
| --------- | --------------------------------------- | ---------------------------------------------------------- |
| bedNumber | varchar(20) notNull                     | e.g. `ICU-01`                                              |
| wardId    | integer notNull FK ward                 |                                                            |
| roomId    | integer FK room                         | nullable — optional physical Room link                     |
| status    | varchar(20) notNull default 'AVAILABLE' | CHECK in ('AVAILABLE','OCCUPIED','RESERVED','MAINTENANCE') |
| notes     | text                                    |                                                            |

Indexes:

- `bed_ward_bed_number_idx` unique on `(tenantId, wardId, lower(bedNumber))`
  `where is_deleted = false`
- non-unique `(tenantId, status)` and `(tenantId, wardId)` for the board query

**`admission.ts`** → `admission`

| column                | type                                   | notes                                                                                   |
| --------------------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| admissionNumber       | varchar(20) notNull                    | `ADM-1001`…                                                                             |
| patientId             | integer notNull FK patient             |                                                                                         |
| doctorId              | integer notNull FK doctor              | admitting/attending doctor                                                              |
| admissionTypeId       | integer notNull FK admission_type      |                                                                                         |
| bedId                 | integer notNull FK bed                 | **current** bed                                                                         |
| visitId               | integer FK visit                       | nullable — source OPD Visit                                                             |
| status                | varchar(20) notNull default 'ADMITTED' | CHECK in ('ADMITTED','DISCHARGED','CANCELLED')                                          |
| admissionReason       | varchar(500)                           | presenting complaint / provisional diagnosis (free text)                                |
| remarks               | text                                   |                                                                                         |
| expectedDischargeDate | date                                   | nullable, editable while admitted                                                       |
| admittedAt            | timestamptz notNull default now        |                                                                                         |
| dischargedAt          | timestamptz                            | set on discharge                                                                        |
| dischargeDisposition  | varchar(20)                            | CHECK in ('ROUTINE','LAMA','TRANSFERRED','DECEASED','ABSCONDED'), required on discharge |
| dischargeSummary      | text                                   |                                                                                         |
| cancelledAt           | timestamptz                            | set on cancel                                                                           |
| cancellationReason    | varchar(255)                           | required on cancel                                                                      |

Indexes:

- `admission_tenant_number_idx` unique on `(tenantId, lower(admissionNumber))`
- `admission_active_patient_idx` unique on `(tenantId, patientId)`
  `where is_deleted = false and status = 'ADMITTED'` (ADR 0034)
- `admission_active_bed_idx` unique on `(tenantId, bedId)`
  `where is_deleted = false and status = 'ADMITTED'` (ADR 0034 — occupancy race backstop)
- non-unique `(tenantId, status)`

**`admission.ts` (same file)** → counter, mirroring `visitNumberCounter`:

- `admission_number_counter(tenant_id varchar pk, last_number integer notNull)`

**`admission-bed-transfer.ts`** → `admission_bed_transfer`

| column        | type                            | notes |
| ------------- | ------------------------------- | ----- |
| admissionId   | integer notNull FK admission    |       |
| fromBedId     | integer notNull FK bed          |       |
| toBedId       | integer notNull FK bed          |       |
| reason        | varchar(255)                    |       |
| transferredAt | timestamptz notNull default now |       |

- non-unique index `(tenantId, admissionId)`

**Migration on existing tables**: add nullable `admission_id` columns + FKs to
`patient_vital_sign` and `clinical_note` (→ `admission.id`), plus a CHECK on each table:
`not (visit_id is not null and admission_id is not null)`.

Run `bun run db:generate` then `bun run db:migrate` after each schema change.

## 6. Backend modules

Four modules under `app/api/lib/modules/`, full CQRS stack each, **colocated tests in the same
change** per `docs/backend-testing.md`.

### 6.1 `ward` and 6.2 `admission-type` (copy the `visit-type` module shape)

Standard master modules: schema (+unit tests), repository (+integration tests), validators
(+unit tests), commands (+unit tests), queries (+unit tests). Codes transform to uppercase.
Exact-string messages follow the house convention:

- `Ward name ICU already exists.` / `Ward code ICU already exists.` / `Ward abc is Invalid.`
- `Admission type name Emergency already exists.` / `Admission type code EMER already exists.` /
  `Admission type abc is Invalid.`
- Ward delete guard (decision 11): `Ward ICU cannot be removed while Beds are assigned to it.`
  — validator calls a `bedRepository.countActiveBedsByWardId(tenantId, wardId)`-style read
  (non-deleted beds).

### 6.3 `bed`

- **Repository** (+integration tests): `getBedById`, `getBeds(tenantId, filters, pagination)`
  (filters: `wardId`, `status`, `search` on bed number; joined ward name/code + room number when
  linked), `getBedBoard(tenantId)` (all non-deleted beds grouped-ready: ward, room, status, and
  for OCCUPIED beds the active admission's id/number + patient id/name/MRN via the
  active-admission join), `createBed`, `updateBed`, `deleteBed`, plus reads for validators:
  `findBedByWardAndNumber`, `countActiveBedsByWardId`.
- **Schemas** (+unit tests): create/update (bedNumber, wardId, roomId?, status among the three
  manually settable values, notes), list filters. Reject `OCCUPIED` in the schema enum for
  create/update (decision 3) with message `Bed status OCCUPIED cannot be set manually.`
- **Validators** (+unit tests): ward exists (`Ward {id} is Invalid.`), room exists when supplied
  (`Room {id} is Invalid.`), uniqueness `Bed number ICU-01 already exists in ward ICU.`,
  existence `Bed {id} is Invalid.`, delete guard `Bed ICU-01 cannot be removed while occupied.`
  (status OCCUPIED or an active admission references it), status-edit guard: an OCCUPIED bed's
  status cannot be edited manually (`Bed ICU-01 is occupied and its status is managed by
admissions.`).
- **Commands / queries** (+unit tests): create/update/delete; get/list/board. Map `23505` on the
  ward+number index to the clean duplicate message.

### 6.4 `admission`

**Repository** (`repository/admission-repository.ts` + integration tests):

- `getAdmissionById(tenantId, id)` — joined shape: patient (id, mrn, firstName, lastName),
  doctor (id, name, specialty), admissionType (id, name, code), bed (id, bedNumber) + ward
  (id, name), visit (id, visitNumber) when linked, plus the bed-transfer history rows (with from/
  to bed numbers). All reads filter `tenantId` + `isDeleted = false`.
- `getAdmissions(tenantId, filters, pagination)` — filters: `status` (query layer defaults to
  `ADMITTED`), `wardId` (via bed join), `doctorId`, `patientId`, `search` (admission number /
  MRN / patient name); ordered `admittedAt` desc; returns `{ data, total }`.
- `findActiveAdmissionByPatientId(tenantId, patientId)`; `findActiveAdmissionByBedId(tenantId, bedId)`.
- `createAdmission(...)` — one transaction: increment `admission_number_counter`
  (insert-or-update, copy the visit-number repo), insert the admission, and update the target
  bed's status to `OCCUPIED` **with a guarded UPDATE** (`where status in ('AVAILABLE','RESERVED')
and is_deleted = false`; zero rows updated → roll back and return the not-available outcome —
  copy the outcome-union style the visit repository uses).
- `transferBed(tenantId, id, toBedId, reason)` — one transaction: guarded-occupy the target bed,
  release the old bed to `AVAILABLE`, update `admission.bedId`, insert the
  `admission_bed_transfer` row.
- `dischargeAdmission(tenantId, id, disposition, summary)` / `cancelAdmission(tenantId, id,
reason)` — status + timestamps, release the bed to `AVAILABLE`, same transaction.
- `updateAdmission` (admissionReason/remarks/expectedDischargeDate, active only).
- `deleteAdmission(tenantId, id)` — soft delete (ADR 0012 naming).
- Read for clinical-capture validators: `getAdmissionForClinicalCapture(tenantId, id)` (id,
  patientId, status).

**Schemas** (`schemas/admission-schema.ts` + unit tests): `admitPatientSchema` (patientId,
doctorId, admissionTypeId, bedId, optional visitId/admissionReason/remarks/
expectedDischargeDate), `transferBedSchema` (toBedId, optional reason), `dischargeSchema`
(disposition enum required, optional summary), `cancelAdmissionSchema` (required reason),
`updateAdmissionSchema`, `listAdmissionsSchema` (filters + pagination; date handling reuses the
ADR 0026 helpers where dates appear).

**Validators** (+unit tests). Exact messages:

- `Admission {id} is Invalid.` / `Patient {id} is Invalid.` / `Doctor {id} is Invalid.` /
  `Admission type {id} is Invalid.` / `Bed {id} is Invalid.` / `Visit {id} is Invalid.`
- `Patient {id} is provisional and must complete registration before admission.`
- `Patient {id} is inactive and cannot be admitted.`
- `Patient {id} already has an active admission.`
- `Bed {bedNumber} is not available for admission.` (status not AVAILABLE/RESERVED, or occupied)
- `Visit {id} does not belong to patient {patientId}.` / `Visit {id} is cancelled.`
- `Admission {admissionNumber} cannot be transferred from its current status.` (and equivalents
  for discharge / cancel / update)
- `Admission {admissionNumber} is already in bed {bedNumber}.` (transfer to the same bed)
- Repository-backed checks live in validators (house rule); validators call `patientRepository`,
  `doctorRepository`, `bedRepository`, `admissionTypeRepository`, `visitRepository`,
  `admissionRepository` reads — never write Drizzle directly.

**Commands** (+unit tests): `admit-patient-command` (validate → repository → `CommandResult`;
map `23505` on the active-patient / active-bed indexes to the clean conflict messages — the DB
race backstop), `transfer-bed-command`, `discharge-admission-command`,
`cancel-admission-command`, `update-admission-command`, `delete-admission-command`.

**Queries** (+unit tests): `get-admission-query` (detail incl. transfer history + in-admission
records), `get-admissions-query` (status defaults to `ADMITTED` when no filters given).

### 6.5 Clinical capture wiring (existing modules)

Mirror the Visit wiring exactly (see `visit-clinical-capture-validator` and the `visitId`
handling in `patient-vital-sign` / `clinical-note`):

- Create schemas accept optional `admissionId` (positive int); reject when both `visitId` and
  `admissionId` are supplied: `A record may reference a Visit or an Admission, not both.`
- Validators: when `admissionId` present, resolve via
  `admissionRepository.getAdmissionForClinicalCapture` — must exist in tenant
  (`Admission {id} is Invalid.`), belong to the same patient
  (`Admission {id} does not belong to patient {patientId}.`), and be active
  (`Admission {id} is not active.`).
- Add `getVitalSignsByAdmissionId` / `getClinicalNotesByAdmissionId` reads (tenant + admission
  filtered) and surface them in the admission detail query. Update both modules' unit tests.

## 7. API surface (`app/api/v1/`)

Thin routes (`requireTenantSession()` → command/query → `NextResponse`), each with a sibling
type-only `types.ts`. Static segments beat dynamic, so `beds/board` coexists with `beds/[id]`.

- `wards` — GET (list), POST; `wards/[id]` — GET, PUT, DELETE.
- `admission-types` — GET, POST; `admission-types/[id]` — GET, PUT, DELETE.
- `beds` — GET (list; `wardId`, `status`, `search`, pagination), POST; `beds/[id]` — GET, PUT,
  DELETE; `beds/board` — GET (ward-grouped occupancy payload for the Bed Board).
- `admissions` — GET (list; `status`, `wardId`, `doctorId`, `patientId`, `search`, pagination),
  POST (admit).
- `admissions/[id]` — GET (detail incl. transfer history + in-admission vitals/notes summaries),
  PUT (admissionReason/remarks/expectedDischargeDate), DELETE (soft delete).
- `admissions/[id]/transfer` — POST (body: `toBedId`, `reason?`).
- `admissions/[id]/discharge` — POST (body: `dischargeDisposition`, `dischargeSummary?`).
- `admissions/[id]/cancel` — POST (body: `cancellationReason`).
- Patient admission history: reuse `GET /admissions?patientId=…&status=` — no nested route.

Route handler tests only where adapter logic is non-trivial (admit body, transition routes,
param parsing).

## 8. Permissions & onboarding seed

1. **Permission catalogue** (`permission/seed-data.ts` + a **new** migration, never edit old
   ones). New Permission Modules:
   - `inpatient` / `admission`: read, create, update, delete, transfer, discharge, cancel
   - `inpatient-masters` / `ward`: read, create, update, delete
   - `inpatient-masters` / `bed`: read, create, update, delete
   - `inpatient-masters` / `admission-type`: read, create, update, delete
     (Match the existing module/resource/action naming style in `seed-data.ts` exactly — inspect it
     before writing.)
2. **Onboarding** (`tenant-provisioning`): `seed-default-admission-types-command.ts` seeding —
   `Emergency (EMER)`, `Elective (ELEC)`, `Transfer (TRF)`, `Maternity (MAT)`, `Day Care (DAYC)`.
   Wire beside the existing seed commands (visit types is the template), keep idempotent, update
   onboarding unit tests. Wards/Beds are physical and are **not** seeded (like Rooms).

## 9. Frontend

Follow `DESIGN.md` + `design-system` skill, screen-composition rules in `CLAUDE.md`,
`tanstack-query-patterns` skill for all hooks, ADR 0009 (react-hook-form + zodResolver), ADR 0010
(nuqs URL state). Every `page.tsx` gets a page-shaped `loader.tsx`.

### 9.1 Query hooks (`app/queries/`)

- `app/queries/inpatient-masters/{wards,beds,admission-types}/` — list/get/create/update/delete
  hooks per master (clone the visit-types hooks).
- `app/queries/admissions/` — `useAdmissions` (keyed by filters), `useAdmission(id)`,
  `useBedBoard`, `useAdmitPatient`, `useTransferBed`, `useDischargeAdmission`,
  `useCancelAdmission`, `useUpdateAdmission`, `useDeleteAdmission`. Every admission mutation
  invalidates the admissions list + detail **and** the beds list + bed board (bed statuses
  changed). Reuse the `parseApiError` + `credentials: 'same-origin'` pattern.

### 9.2 `/admissions` — Inpatient census (`app/(protected)/admissions/`)

Default view = **active admissions** (status `ADMITTED`).

- `page.tsx` + `loader.tsx` + `_components/admissions-page-impl.tsx` (thin container; nuqs owns
  filter + surface state: `?status=`, `?ward=`, `?doctor=`, `?admit=new`, `?discharge={id}`,
  `?transfer={id}`, `?cancel={id}`).
- `admissions-toolbar.tsx` — status filter (default Admitted), ward select, doctor select,
  search, **Admit Patient** primary action.
- `admissions-table.tsx` — columns: Admission Number, Patient (name + MRN), Ward / Bed, Admitting
  Doctor, Admission Type, Admitted at, Expected discharge, Status badge, row actions. Row actions
  while Admitted: Transfer, Discharge, Cancel; all: View, Open Patient.
- `_sheets/admit-patient-sheet.tsx` — patient combobox (registered + active only — reuse the
  check-in sheet's pattern), doctor select, admission type select, **Ward select → Bed select
  cascade** (beds filtered to the chosen ward, AVAILABLE/RESERVED only, show status), optional
  source Visit (only if trivially resolvable — otherwise omit from the sheet and keep `visitId`
  API-only for v1), admission reason, expected discharge date. Server errors via `setError`;
  required-asterisks from the API schema.
- `_modals/discharge-dialog.tsx` — disposition select (required) + summary textarea;
  `_modals/transfer-bed-dialog.tsx` — ward→bed cascade + reason; `_modals/cancel-admission-dialog.tsx`
  — required reason.

### 9.3 `/admissions/[id]` — Admission detail

- Header: admission number, status + timeline (admitted → discharged/cancelled timestamps,
  expected discharge), current Ward/Bed, patient identity (link to patient page) with the
  existing **AllergyBanner** reused, admitting doctor, admission type, source visit link when
  present.
- Body: admission reason/remarks (editable while active), **Bed history** (initial bed + transfer
  rows with reasons/times), **Vitals this admission** and **Clinical notes this admission**
  lists with capture sheets posting to the existing patient-chart endpoints **with `admissionId`
  stamped** (clone the `/visits/[id]` capture sheets).
- Status action buttons mirror the census row actions; discharged view shows disposition +
  summary read-only.

### 9.4 `/bed-board` — Ward-wise occupancy grid

The flagship visual (Bahmni bed layout / Epic bed planning, scoped to v1):

- One section per Ward; each Bed is a card/tile color-coded by status (use design-token status
  colors per `DESIGN.md` — no hardcoded hex), showing bed number, room number when linked, and
  for occupied beds the patient name + MRN + admission number.
- Occupied tile → links to the admission detail; Available/Reserved tile → "Admit here" opening
  `/admissions?admit=new` with the bed preselected (pass ward/bed through the nuqs params).
- Toolbar: ward filter, status filter, an occupancy summary line (x/y beds occupied per ward —
  computed client-side from the board payload).
- Data from `GET /api/v1/beds/board` via `useBedBoard`.

### 9.5 Master screens + nav

- `app/(protected)/inpatient-masters/wards/`, `.../beds/`, `.../admission-types/` — clone the
  `visit-masters/visit-types` screen (table, toolbar, form sheet, delete dialog, `_utils` schema,
  loader). The Beds screen adds the ward select (+ optional room select) and shows status; its
  form must not offer OCCUPIED.
- `components/app/app-shell-config.ts`:
  - New nav group **Inpatient** (after Clinical): **Admissions** (`/admissions`, icon
    `BedDouble`) and **Bed Board** (`/bed-board`, icon `LayoutGrid`).
  - Configuration group: **Inpatient Masters** (icon `Hospital`) with items Wards
    (`/inpatient-masters/wards`), Beds (`/inpatient-masters/beds`), Admission Types
    (`/inpatient-masters/admission-types`).
  - `pageMeta` entries for all six new routes (census, board, detail falls back to parent, three
    masters), each with title + subtitle in the house voice; census gets primaryAction
    "Admit patient" → `/admissions?admit=new`.

## 10. Swagger / OpenAPI

Update the OpenAPI source in the same change as each route: all ward / bed / admission-type /
admission operations with realistic EMR examples (admission number `ADM-1001`, bed `ICU-01`,
ward `ICU`, disposition `ROUTINE`), the board payload, transition endpoints with status-conflict
error examples, the extended `admissionId` field on vital-sign/clinical-note create ops, and
validation/conflict/not-found/unauthorized examples using the exact messages from §6. Zero
unresolved `$ref`s.

## 11. Cross-module touchpoints

1. **`visit` module**: admission validators need a visit read returning id/patientId/status —
   `getVisitForClinicalCapture` already has this shape; reuse it (rename only if trivial).
2. **`patient-vital-sign` / `clinical-note`**: the `admissionId` wiring (§6.5) touches the same
   files the Visit feature touched — follow the `visitId` code paths symmetrically.
3. **`room` module**: read-only FK from `bed.roomId`; validators need `roomRepository.getRoomById`
   (exists). Do not modify room behavior.
4. **Dashboard/appShellStats** are hardcoded demo values — out of scope.

## 12. Open decisions (recommended defaults baked into this plan)

1. **Bed-first admission (no "admit without bed" pending state)** — Bahmni's newer flow requires
   the bed upfront; an "awaiting bed" worklist is a future enhancement, not v1.
2. **Ward is a Master, Bed Board is the operational view** — the glossary lists Ward and Bed
   under Masters; operations happen on `/bed-board` and `/admissions`.
3. **Discharge Disposition fixed set vs Master** — fixed set chosen (mirrors Visit Status
   reasoning). Revisit via the AppointmentStatus category pattern if a tenant needs custom values.
4. **No Room Status / `room.bedCount` reconciliation** — Rooms stay a manually managed registry
   in v1. If Rooms later become bed containers for real, that is its own migration task.
5. **`visitId` on admit is API-first** — the admit sheet may omit the visit picker if resolving
   "today's completed visits for this patient" adds UI complexity; the API contract carries it
   either way.
6. **AdmissionType has no in-use delete guard** — mirrors VisitType (documented follow-up there);
   Ward and Bed **do** get guards because dangling physical topology breaks the board.

## 13. Definition of done

- `bun run test` green (all new colocated unit + integration tests included).
- `bunx tsc --noEmit`, `bun run lint`, `bun run format:check` clean; `bun run build` passes.
- `bun run db:migrate` applies cleanly from a fresh DB; onboarding seeds Admission Types.
- Swagger renders every new operation with success + error examples.
- Manual smoke: create Ward `ICU` → create Beds `ICU-01`, `ICU-02` → admit a Registered patient
  to `ICU-01` (`ADM-1001`; bed flips OCCUPIED; second admit for same patient refused with exact
  message; admit to `ICU-01` for another patient refused) → record vitals + a note against the
  admission → transfer to `ICU-02` with a reason (`ICU-01` back to AVAILABLE, history row shown)
  → verify the Bed Board shows the occupancy → discharge with disposition `ROUTINE` + summary
  (bed freed, admission immutable) → cancel-path check on a fresh admission → verify a
  Provisional patient is refused admission with the exact message → verify Ward/Bed delete
  guards.

---

## Task checklist

Phases are ordered by dependency; within a phase, tickets are parallelizable. Every backend
ticket ships its colocated tests in the same change.

> **Progress log (2026-07-17):** Phases 0–3 implemented on `feat/inpatient-management`.
>
> - **Phase 0:** CONTEXT.md terms added (Admission Number/Status, AdmissionType, Active
>   Admission, Bed Number/Status, Bed Transfer, Discharge + Disposition + Summary, Expected
>   Discharge Date, Bed Board, Inpatient Census); ADRs `0032`–`0035` written; `inpatient` +
>   `inpatient-masters` permission groups + backfill migration `0044_seed_inpatient_permissions.sql`.
> - **Phase 1:** `ward` and `admission-type` modules cloned from `visit-type` (full CQRS +
>   colocated tests); `bed` module hand-built (per-ward case-insensitive uniqueness, manual
>   OCCUPIED writes rejected, occupied update/delete guards, board read); Ward delete guarded via
>   `bedRepository.countActiveBedsByWardId`. Routes `wards(+/[id])`, `admission-types(+/[id])`,
>   `beds(+/[id], /board)`. Onboarding seeds 5 default AdmissionTypes
>   (`seed-default-inpatient-masters-command`) + backfill migration `0046` for existing tenants.
>   Master screens + hooks + Inpatient Masters nav group.
> - **Phase 2:** `admission` module complete — admit transaction (ADM- counter + guarded bed
>   occupy with `bed-not-available` outcome), transfer (release + occupy + history row), discharge/
>   cancel (bed release), soft delete releases the bed of an Active Admission, 2 partial unique
>   indexes (active-patient, active-bed) with 23505 mapping, census list with ward filter via bed
>   join, detail with embedded transfer history. `admissionId` FK + one-parent CHECK on
>   `patient_vital_sign`/`clinical_note` (migration `0045`), validated via
>   `admission-clinical-capture-validator`. 16 repository integration tests incl. bed-status sync
>   and board occupant join.
> - **Phase 3:** `/admissions` census (status default Admitted, ward/doctor/search filters, admit
>   sheet with ward→bed cascade of free beds, transfer/discharge/cancel dialogs),
>   `/admissions/[id]` detail (timeline, AllergyBanner, bed history, editable reason/remarks/EDD,
>   in-admission vitals + note capture stamping `admissionId`), `/bed-board` ward-grouped
>   color-coded grid (occupied tile → admission, free tile → prefilled admit deep-link),
>   `inpatient-masters/{wards,beds,admission-types}` screens, **Inpatient** nav group + pageMeta.
> - **Gates:** `bun run test` 250 files / 2447 tests green (unit + integration against the
>   OrbStack test DB); `bunx tsc --noEmit` clean; `bun run lint` 0 errors; prettier clean;
>   `bun run build` passes with all new routes; Swagger has 1966 resolved `$ref`s / 0 unresolved.
> - **Not done:** §13 manual smoke (needs a running app + seeded tenant; the dev DB is the shared
>   remote Neon instance, so this branch's migrations were deliberately **not** applied there).
>   The backend path is covered end-to-end by the integration tests (admit → transfer → discharge/
>   cancel/delete incl. bed-status sync and occupancy races).
>
> **Known follow-ups (not blocking):**
>
> 1. **`/admissions/[id]` reads in-admission records by filtering the whole Patient Chart**
>    client-side on `admissionId` — mirrors the `/visits/[id]` approach and its documented
>    follow-up; a `admissions/[id]/records` aggregate would be tighter if the chart grows.
> 2. **AdmissionType delete has no in-use guard** (mirrors VisitType, §12.6). Ward and Bed do
>    have guards.
> 3. **The admit sheet does not offer a source-Visit picker** — `visitId` is API-only for v1
>    (§12.5).

### Phase 0 — Foundations

- [x] CONTEXT.md terms (§4): Admission Number/Status, AdmissionType, Active Admission, Bed
      Number/Status, Bed Transfer, Discharge, Discharge Disposition, Discharge Summary, Expected
      Discharge Date, Bed Board, Inpatient Census.
- [x] ADRs 0032–0035 (§4).
- [x] Permission catalogue: `inpatient` + `inpatient-masters` permissions in `seed-data.ts` + new
      seed migration (§8.1).

### Phase 1 — Masters (backend + frontend)

- [x] `ward` schema + migration; full module + colocated tests (incl. delete guard).
- [x] `admission-type` schema + migration; full module + colocated tests.
- [x] `bed` schema + migration; full module + colocated tests (ward/room existence, per-ward
      uniqueness, OCCUPIED write rejection, delete guard).
- [x] Routes + `types.ts` + Swagger: `wards(+/[id])`, `admission-types(+/[id])`, `beds(+/[id])`.
- [x] Onboarding seed `seed-default-admission-types-command.ts` + onboarding test updates (§8.2).
- [x] Query hooks `app/queries/inpatient-masters/*`.
- [x] `inpatient-masters/{wards,beds,admission-types}` CRUD screens + loaders.
- [x] Nav: Configuration → **Inpatient Masters** group + pageMeta entries.

### Phase 2 — Admission module (backend)

- [x] `admission` + `admission_bed_transfer` + counter schema + migration incl. partial unique
      indexes (§5).
- [x] Migration adding `admission_id` columns/FKs + one-parent CHECK on `patient_vital_sign` /
      `clinical_note`.
- [x] `admission` repository (admit/transfer/discharge/cancel transactions with guarded bed
      updates + counter; list/get incl. transfer history; deleteAdmission) + integration tests
      (tenant isolation, unique-index races, bed status sync, guarded-update zero-rows outcome).
- [x] `admission` schemas + unit tests.
- [x] `admission` validators + unit tests (all gates + exact messages §6).
- [x] `admission` commands + unit tests (23505 mapping on both partial indexes).
- [x] `admission` queries + unit tests (status defaults to ADMITTED; detail shape).
- [x] `bed` board read (`getBedBoard`) + `beds/board` route + Swagger.
- [x] `patient-vital-sign` + `clinical-note`: optional `admissionId` in schemas/validators
      (+ by-admission reads) + test updates (§6.5).
- [x] Routes + `types.ts` + Swagger: `admissions`, `admissions/[id]`,
      `admissions/[id]/{transfer,discharge,cancel}` (+ route tests for transitions).

### Phase 3 — Frontend

- [x] Query hooks `app/queries/admissions/` (§9.1) incl. cross-invalidation of beds/board.
- [x] `/admissions` census: page + loader + impl + toolbar + table (+ status-driven row actions).
- [x] `admit-patient-sheet` (ward→bed cascade) + `transfer-bed-dialog` + `discharge-dialog` +
      `cancel-admission-dialog`.
- [x] `/admissions/[id]` detail: header + timeline + AllergyBanner + bed history + editable
      reason/remarks/EDD.
- [x] In-admission capture sheets (vitals, clinical note) posting with `admissionId`.
- [x] `/bed-board`: page + loader + ward-grouped grid + toolbar + occupancy summary + admit/
      detail links.
- [x] Nav: **Inpatient** group (Admissions, Bed Board) + pageMeta entries.

### Phase 4 — Docs & gates

- [x] Swagger sweep — every new/changed operation with success + error examples.
- [x] Green gates: `bun run test`, `bunx tsc --noEmit`, `bun run build`, lint, prettier.
- [ ] Manual smoke per §13.
