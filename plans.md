# Plan: Patient Timeline tab

> Standalone implementation plan. Written for an implementing agent that has **not** seen the
> planning conversation. Read `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`, `DESIGN.md`, `lessons.md`,
> and `docs/backend-testing.md` before starting. Follow every convention in those docs exactly —
> this plan describes _what_ to build and _in what order_; those docs remain the binding _how_.
>
> Supersedes the previous plan in this file (Billing & Revenue Cycle v1), which is fully
> implemented — `charge-item`, `invoice`, `payment` modules and the `/billing` screens all exist.

## 1. Goal

`/patients/[id]` currently has two tabs: **Overview** (demographics) and **Chart** (allergies,
problems, medications, vitals, clinical notes). Neither answers the question a clinician or
front-desk user actually asks first — _what has happened with this patient, and when?_ That
history exists but is scattered across `/appointments`, `/visits`, `/admissions`, and `/billing`,
each filtered separately.

Add a third tab, **Timeline**: a single reverse-chronological, infinitely-scrolling feed of every
lifecycle transition on the patient's record — bookings, visits, admissions, bed transfers,
invoices, payments, document uploads, signed clinical notes — each entry linking to the detail
page that owns it. Both API and UI.

### In scope (confirmed)

1. **`patient-timeline` backend module** — read-only. One `UNION ALL` repository query over the
   existing tables, cursor-paginated, no new domain tables.
2. **`GET /api/v1/patients/[id]/timeline`** — cursor-paginated, `feed` filter param.
3. **Migration** — three new transition columns, four new indexes. No new tables.
4. **Appointment detail sheet** — `GET /api/v1/appointments/[id]` + a Sheet on `/appointments`
   opened by `?appointment=<id>`, so Booking entries have a link target (none exists today).
5. **Timeline tab UI** — grouped-by-day feed, sentinel + "Load more" infinite scroll, four filter
   chips, all three patient tabs moved into the URL.
6. Colocated Vitest tests, Swagger updates, glossary terms, ADR — per `CLAUDE.md`, not optional.

### Out of scope (explicit)

- **Chart records on the timeline** — Allergies, Problems, Medications, Vital Signs are excluded.
  See §2 decision 2 for why; do not "helpfully" add them.
- **Actor attribution** — no `performedByUserId` columns, no "who did it" line. §2 decision 6.
- **A real audit trail** — field-level diffs, request origin. `app/(protected)/audit-log/` remains
  mock-only; do not wire it up here.
- **Timeline anywhere other than the patient detail page.**
- **Backfilling the three new timestamp columns** — historical rows stay `NULL` and those
  transitions simply do not appear. §2 decision 4.
- **Fixing the 19 browser-timezone date format call sites** in `app/(protected)`. Pre-existing
  inconsistency with ADR 0026, tracked separately.
- **Scroll-offset restoration** on back-navigation. Browser default only.

## 2. Key design decisions

Each was argued through and is recorded in
`docs/adr/0041-patient-timeline-events-derive-from-transition-columns.md`. Read that ADR before
changing any of them.

1. **One Timeline Event per lifecycle transition, not per record.** A Visit that was checked in,
   seen, and completed contributes **three** entries at three points on the feed, each linking to
   the same `/visits/[id]`. Same for Admission (admitted/discharged/cancelled) and Invoice
   (finalized/voided). This is why the query reads transition _columns_, not rows.

2. **Chart records are excluded, deliberately.** `patient_problem.onsetDate`,
   `patient_allergy.notedOn`, and `patient_medication.startDate` are _clinical_ dates, not system
   events — a problem with a 2019 onset would land years down a feed whose every other entry
   means "this happened at the hospital." Vital Signs would additionally drown the feed during an
   admission (recorded every few hours). The Chart tab already owns all four with better UI.
   **Signed Clinical Notes are the exception and _are_ included** — `signedAt` is a true instant.

3. **Derived at read time; nothing is persisted.** Rejected alternative: a materialized
   `patient_timeline_event` table written by every command. That needs a backfill, and every
   command in six modules must dual-write — one missed write leaves a silent permanent hole in a
   patient's history that no test catches. Derivation works on existing data on day one and
   cannot drift from the records it reads, because it _is_ the records.

4. **Two timestamp gaps are closed by new columns, not by proxying `modifiedOn`.** `appointment`
   had no `cancelledAt` and `patient` had no deactivate/reactivate timestamps. `modifiedOn` is
   not a substitute — any unrelated edit clobbers it, which would put a false timestamp in a
   clinical record. Historical rows hold `NULL`: a pre-existing cancellation is **invisible
   rather than wrongly dated**. That is the correct trade.

5. **Cursor pagination, not the house `Paginated<T>`.** The feed is `DESC` by time with new events
   arriving at the **top**. Under offset pagination, a payment recorded mid-scroll shifts
   everything down one and the last row of page 1 reappears as the first row of page 2 —
   duplicate entries in a clinical history. A cursor names a position in the ordering, so
   insertions above it cannot shift it. Offset would also force Postgres to build and sort the
   entire union and discard N rows per page, plus a second full pass to compute `total` that
   infinite scroll never displays. **Rule going forward: tables offset, feeds cursor.**

6. **Doctor is context, never actor.** Render "Visit completed · Dr. Rao", **not** "Dr. Rao
   completed the Visit". `visit.doctorId` is the doctor the visit is _with_, not whoever clicked
   Complete — the second phrasing is a claim the data does not support and would put a false
   statement in a clinical record. Invoice, Payment, Bed Transfer and Visit Document have no user
   column at all; those entries simply omit the trailing context.

7. **No display strings in SQL.** The union projects a flat, nullable-padded row. The query layer
   maps it to a TypeScript discriminated union keyed on `sourceType`. Every label, icon, and
   phrasing lives in the UI, changeable without a migration.

8. **UTC instants only over the wire; the client converts.** No server-computed local date. This
   is a deliberate departure from ADR 0026 — that ADR governs _decisions_ the server makes
   (has a DoctorSlot passed?), whereas the Timeline only _displays_ settled instants. Consequence,
   accepted: day headers follow the viewer's device, so an event near local midnight can file
   under an adjacent date for a viewer in another zone.

9. **Appointments are timestamped on `createdOn`, not `slotDate`.** A booking made today for
   15 Aug sits at **today** — booking is the thing that happened. Sorting future slots to the top
   would open a "what happened" feed with things that have not, and make "newest first" mean
   "furthest in the future first". The slot date is carried in the entry text instead:
   _"Booking APT-1042 · for Dr. Rao, 15 Aug 2026"_ — future info present, at the moment it became
   true, with no ordering distortion.

10. **Visit Documents collapse per Visit.** Row-per-file would emit six near-simultaneous entries
    for one upload session — the same noise argument used to exclude Vital Signs, applied
    consistently. `GROUP BY visit_id` with `COUNT` + `MAX(created_on)`. A count of one renders the
    filename instead ("Referral letter uploaded"), because "1 document uploaded" reads badly.

11. **Soft-deleted records are excluded** (`is_deleted = false`), per ADR 0012, consistent with
    every other read in the app. **Deactivated patients are not** — `CONTEXT.md` says an Inactive
    Patient's "record and history remain retained and readable", so the feed must still render.

12. **Patient Reconciliation is glossary-only, not implemented.** No merge exists, so the query
    reads a single `patientId` with no merged-history handling. Do not build for it.

## 3. Glossary additions

Already written to `CONTEXT.md` — **Patient Timeline**, **Timeline Event**, **Timeline Event
Source**. Do not redefine them; use those words in code, comments, and Swagger.

Note the existing `VisitStatusTimeline` component (`app/(protected)/visits/[id]/_components/`)
is a per-Visit horizontal progress stepper — a different concept that happens to share the word.
Leave it alone; do not import from or extend it.

## 4. Data model changes

**No new tables.** One migration adding three columns and four indexes.

### 4.1 New columns

| Table         | Column           | Type                   | Why                                                 |
| ------------- | ---------------- | ---------------------- | --------------------------------------------------- |
| `appointment` | `cancelled_at`   | `timestamptz` nullable | Booking-cancelled events; no timestamp existed      |
| `patient`     | `deactivated_at` | `timestamptz` nullable | Patient-deactivated events; only `isActive` existed |
| `patient`     | `reactivated_at` | `timestamptz` nullable | Patient-reactivated events                          |

All nullable, no backfill (decision 4).

### 4.2 New indexes

`invoice` and `payment` already have their patient/invoice indexes. These four are missing and
the union needs them:

- `visit` → `(tenant_id, patient_id)`
- `admission` → `(tenant_id, patient_id)`
- `appointment` → `(tenant_id, patient_id)`
- `clinical_note` → `(tenant_id, patient_id)`

Add via the schema files (`app/db/schema/*.ts`) then `bun run db:generate` + `bun run db:migrate`.
Follow the table-export naming convention in ADR 0015.

### 4.3 Commands that must now set the new columns

- `appointment` cancel command → set `cancelledAt` to now.
- `patient` deactivate command → set `deactivatedAt`; reactivate command → set `reactivatedAt`.

These are small edits to existing commands. Their existing unit tests must be extended to assert
the timestamp is written.

## 5. New utility type

Add to `app/api/lib/utils/types.ts`, **alongside** `Paginated<T>` — do not replace it:

```ts
export type CursorPaginated<T> = {
  data: T[];
  meta: { nextCursor: string | null };
};
```

## 6. Backend module — `patient-timeline`

Read-only. Mirror the shape of `patient-chart` (`app/api/lib/modules/patient-chart/`), which is
the existing aggregate-read module — but unlike `patient-chart` this one owns a repository,
because it issues real SQL rather than fanning out to other repositories.

```
app/api/lib/modules/patient-timeline/
├── schemas/patient-timeline-schema.ts
├── schemas/patient-timeline-schema.unit.tests.ts
├── repository/patient-timeline-repository.ts
├── repository/patient-timeline-repository.integration.tests.ts
├── validator/get-patient-timeline-validator.ts
├── validator/patient-timeline-validator.unit.tests.ts
├── queries/get-patient-timeline-query.ts
└── queries/patient-timeline-queries.unit.tests.ts
```

No `commands/` directory — queries never mutate.

### 6.1 Schema

Source and event types (fixed system sets, not tenant masters):

```ts
export const TIMELINE_SOURCES = [
  'APPOINTMENT',
  'VISIT',
  'ADMISSION',
  'BED_TRANSFER',
  'INVOICE',
  'PAYMENT',
  'VISIT_DOCUMENT',
  'CLINICAL_NOTE',
  'PATIENT',
] as const;

export const TIMELINE_EVENT_TYPES = [
  'APPOINTMENT_BOOKED',
  'APPOINTMENT_CANCELLED',
  'VISIT_CHECKED_IN',
  'VISIT_IN_CONSULTATION',
  'VISIT_COMPLETED',
  'VISIT_CANCELLED',
  'ADMISSION_ADMITTED',
  'ADMISSION_DISCHARGED',
  'ADMISSION_CANCELLED',
  'BED_TRANSFERRED',
  'INVOICE_FINALIZED',
  'INVOICE_VOIDED',
  'PAYMENT_RECEIVED',
  'DOCUMENTS_UPLOADED',
  'CLINICAL_NOTE_SIGNED',
  'PATIENT_REGISTERED',
  'PATIENT_DEACTIVATED',
  'PATIENT_REACTIVATED',
] as const;

export const TIMELINE_FEEDS = ['all', 'encounters', 'billing', 'records'] as const;
```

Feed → source mapping (decision: grouped chips, not nine toggles):

- `encounters` → APPOINTMENT, VISIT, ADMISSION, BED_TRANSFER
- `billing` → INVOICE, PAYMENT
- `records` → VISIT_DOCUMENT, CLINICAL_NOTE
- `all` → every source including PATIENT

`PATIENT` events appear only under `all` — they are lifecycle bookends, not a category.

Request params schema: `patientId` (coerced positive int), `tenantId` (non-empty trimmed string),
`cursor` (optional opaque string), `feed` (optional enum, default `all`), `limit` (optional,
default **20**, max 50).

The public `TimelineEvent` type is a **discriminated union on `sourceType`** (decision 7), each
variant carrying only the fields it actually has. Common to all: `occurredAt` (ISO UTC string),
`sourceType`, `sourceId`, `eventType`, `reference`.

### 6.2 Cursor

Opaque to the client, base64 of `occurredAt|sourceType|sourceId`. Encode/decode helpers live in
the schema file (pure functions — unit-test them, including malformed input, which must be
rejected by the validator as a 400, not crash).

Keyset predicate uses a row-value comparison so the composite ordering is exact:

```sql
(occurred_at, source_type, source_id) < ($cursorTs, $cursorSource, $cursorId)
```

### 6.3 Repository

One exported function, `getPatientTimeline({ tenantId, patientId, cursor, feed, limit })`.
All SQL lives here — no Drizzle outside this file (`CLAUDE.md`).

Build a `UNION ALL` with **one branch per transition**, each projecting the identical flat,
nullable-padded column list:

```
occurred_at, source_type, source_id, event_type,
reference,     -- VST-1042 / ADM-1007 / INV-1233 / APT-1042 / RCP-1001; parent's number for
               -- bed transfer + documents, null for patient events
doctor_name,   -- joined; null for BED_TRANSFER, INVOICE, PAYMENT, VISIT_DOCUMENT, PATIENT
amount,        -- numeric; null except INVOICE, PAYMENT
detail,        -- one spare varchar: ward/bed for transfers, filename for a single document,
               -- note type for clinical notes, slot date for appointments
detail_count   -- integer; document collapse count, null elsewhere
```

Every branch filters `tenant_id = $1 AND patient_id = $2 AND is_deleted = false AND
<transition column> IS NOT NULL`, plus the cursor predicate. Branches whose source is excluded by
the `feed` filter are **not emitted at all** — a filtered query is cheaper, not more expensive.

Then `ORDER BY occurred_at DESC, source_type DESC, source_id DESC LIMIT $limit + 1`. The extra row
determines `nextCursor` without a count query; drop it before returning.

Branch notes:

- **`visit_document` has no `patient_id`** — join through `visit` to reach the patient.
- **Documents branch is grouped**: `GROUP BY visit_id` with `COUNT(*)` → `detail_count` and
  `MAX(created_on)` → `occurred_at` (decision 10).
- **Visit contributes four branches** (`checkedInAt`, `consultationStartedAt`, `completedAt`,
  `cancelledAt`), Admission three, Invoice two, Patient three. This is the point of decision 1.
- **Clinical Note** filters `signed_at IS NOT NULL` — drafts never appear.
- Numbers to project as `reference`: `visit.visitNumber`, `admission.admissionNumber`,
  `invoice.invoiceNumber`, `payment.receiptNumber`, `appointment.bookingNumber`.

### 6.4 Validator

`validateGetPatientTimeline(params, tenantId)` → `ValidationResult<...>`. Zod parse **plus** a
repository-backed existence check that the patient exists in this tenant (reuse
`patientRepository`), returning `status: NOT_FOUND` when absent — same shape as
`get-patient-chart-validator.ts`. Malformed cursor → validation failure, never a throw.

### 6.5 Query

`getPatientTimelineQuery(...)` → `SingleQueryResult<CursorPaginated<TimelineEvent>>`. Validate
first, return early on failure without touching the repository, then map the flat rows into the
discriminated union.

## 7. API surface

### 7.1 `GET /api/v1/patients/[id]/timeline`

Route + sibling `types.ts` (type-only, no runtime code — `CLAUDE.md`). Thin handler:
`requireTenantSession()` → parse `cursor` / `feed` / `limit` from `request.nextUrl.searchParams`
(use `parsePositiveInteger` from `app/api/lib/utils/parser.ts` for `limit`) → call the query →
`NextResponse.json<GetPatientTimelineResponse>()`. Copy the error mapping from
`app/api/v1/patients/[id]/chart/route.ts` (404 → "Patient not found").

`tenantId` comes from the session only, never the request.

### 7.2 `GET /api/v1/appointments/[id]` (new — required by the Booking link)

Does not exist today. Add `get-appointment-query.ts` + validator to the existing `appointment`
module, plus `app/api/v1/appointments/[id]/route.ts` and `types.ts`. Return the appointment with
its joined masters (mode, type, reason, status, cancelled reason) and doctor — mirror the shape
`getAppointmentsQuery` already returns for list rows so the sheet can render without a second call.

## 8. Frontend

### 8.1 Query hooks — `app/queries/patients/timeline/`

`usePatientTimeline.ts` exporting `usePatientTimelineQuery(patientId, feed)`.

- **`useInfiniteQuery`**, non-suspense. The `tanstack-query-patterns` skill's flavor table says
  tab-switched data must be non-suspense so switching tabs doesn't blow away surrounding chrome.
  This is the app's **first** `useInfiniteQuery` — there is no prior art to copy; follow the
  skill's other rules (stable top-level `queryFn`, derive via `select`, no `useMemo`).
- Query key **must include `feed`** so switching filters doesn't reuse the wrong cached pages.
- `getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined`.
- Grouping by day belongs in `select`, not `useMemo` (skill rule) — map flat pages to
  `{ dayLabel, events[] }[]`, converting UTC → browser zone (decision 8).
- Invoke `/tanstack-query-patterns` before writing this file.

Also `app/queries/appointments/useAppointment.ts` for the detail sheet.

### 8.2 Patient detail tabs — URL state

`app/(protected)/patients/[id]/_components/patient-detail-impl.tsx` currently uses
`<Tabs defaultValue="overview">` with no URL state. Move **all three** tabs to `nuqs`:
`?tab=overview|chart|timeline`, default `overview` cleared from the URL.

Rationale: the Timeline's whole purpose is linking out, so the common flow is scroll → open a
visit → **back**. Without URL state, back lands on Overview and the user re-clicks and re-scrolls.
It also makes the tab deep-linkable and composes with `?feed=`. Extends ADR 0010's reasoning
(view state survives refresh and is linkable) from sheets to tabs.

React Query keeps loaded pages cached under the same key, so returning to the tab re-renders the
full feed rather than refetching page 1.

### 8.3 Timeline components

Per the screen-composition rules in `CLAUDE.md` — small single-responsibility files, no giant
client component. Use `_timeline/` alongside the existing `_chart/` directory, matching that
precedent:

```
app/(protected)/patients/[id]/_components/_timeline/
├── patient-timeline-section.tsx    # owns the query, feed filter param, empty/error states
├── timeline-filter-chips.tsx       # All / Encounters / Billing / Records → ?feed=
├── timeline-day-group.tsx          # sticky day header + its entries
├── timeline-entry.tsx              # switches on sourceType, renders icon/title/context/link
└── timeline-load-more.tsx          # sentinel + button + end-of-feed marker
```

Pure helpers (event → label/icon/href mapping, day-label formatting) go in
`app/(protected)/patients/[id]/_utils/timeline-presentation.ts` — **pure TypeScript only**, no JSX,
no hooks. Types stay co-located with the component that owns them; no speculative exports.

### 8.4 Infinite scroll behaviour

**Sentinel plus a real button** — not one or the other. `IntersectionObserver` on a sentinel
auto-fetches the next page; the sentinel _contains_ a visible "Load more" button. In practice the
observer fires first and the button is rarely clicked, but it makes the next page keyboard- and
screen-reader-reachable, gives a manual recovery path if the observer never fires (hidden tab,
zero-height container), and doubles as the loading indicator (spinner + disabled while
`isFetchingNextPage`).

- `aria-live="polite"` region announcing "20 more events loaded".
- When `hasNextPage` is false, replace the sentinel with an end-of-feed marker — "Registered
  12 Mar 2024" is genuinely useful, and the history gets a visible bottom.
- **No entry animation on appended pages.** DESIGN.md: scroll reveals fire once and must not
  replay; animating streamed-in items fights that and adds `prefers-reduced-motion` branching for
  no benefit.
- Skeleton rows on **first load only**.

### 8.5 Entry anatomy and link targets

Icon · title · doctor-as-context · relative time, whole row clickable.

| Source         | Example title                       | Links to                         |
| -------------- | ----------------------------------- | -------------------------------- |
| Appointment    | Booking APT-1042 · for 15 Aug 2026  | `/appointments?appointment=1042` |
| Visit          | Visit VST-1042 completed · Dr. Rao  | `/visits/1042`                   |
| Admission      | Discharged · ADM-1007 · Dr. Rao     | `/admissions/1007`               |
| Bed Transfer   | Moved to ICU-01 · ADM-1007          | `/admissions/1007`               |
| Invoice        | Invoice INV-1233 finalized · ₹8,000 | `/billing/1233`                  |
| Payment        | Payment received · ₹5,000 · UPI     | `/billing/<invoiceId>`           |
| Visit Document | 6 documents uploaded · VST-1042     | `/visits/1042`                   |
| Clinical Note  | Progress Note signed                | `/patients/<id>?tab=chart`       |
| Patient        | Patient registered                  | — (no link; already on the page) |

Clinical Note links to the Chart tab via the new `?tab=` param (§8.2) — it does not scroll to or
highlight the individual note.

### 8.6 Appointment detail sheet

`app/(protected)/appointments/_components/_sheets/appointment-detail-sheet.tsx`. Shell only, per
`CLAUDE.md`. Opened by `?appointment=<id>` via `nuqs` (ADR 0010); the container derives open state
and resolves the appointment from `useAppointmentQuery`. Read-only — booking number, patient,
doctor, slot date, rota, mode/type/reason, status, cancelled reason, remarks.

The existing `appointments-page-impl.tsx` already uses `useQueryState` for `date`/`doctor`/`status`
— add `appointment` alongside them.

### 8.7 Loaders

`CLAUDE.md` requires the route's `loader.tsx` to stay page-shaped when route-local `_components/`
change. Update `app/(protected)/patients/[id]/loader.tsx` for the third tab and
`app/(protected)/appointments/loader.tsx` if its shell shifts.

## 9. Swagger / OpenAPI

Mandatory, same change — not follow-up work. Both new operations
(`GET /api/v1/patients/{id}/timeline`, `GET /api/v1/appointments/{id}`) documented with path/query
params, the cursor envelope, the `feed` enum, auth requirements, and **realistic EMR examples**:
a success page mixing several source types, an empty timeline, an invalid cursor (400), an unknown
patient (404), and unauthorized. Use the canonical `CONTEXT.md` terms exactly — "Patient Timeline",
"Timeline Event", "Timeline Event Source".

## 10. Testing

Per `docs/backend-testing.md` and ADR 0016 — colocated, same change, filename suffix
`*.unit.tests.ts` / `*.integration.tests.ts` (**plural**; singular is silently ignored by Vitest).

- **Schema unit tests** — param defaults and bounds (`limit` default 20, max 50), `feed` enum
  rejection, cursor encode/decode round-trip, malformed cursor rejected.
- **Validator unit tests** — schema failure short-circuits with no repository call; patient
  existence check; `status: NOT_FOUND` propagation; malformed cursor → failure not throw.
- **Query unit tests** — validation failure means no repository call; `CursorPaginated` shape;
  `nextCursor` null on the last page; the `limit + 1` extra row is dropped from `data`.
- **Repository integration tests** (the important ones — this is where the union can be wrong):
  - **Tenant isolation** — another tenant's visits/invoices never appear.
  - **Soft-delete filtering** on every branch.
  - **Ordering** — strict `occurredAt DESC` across mixed sources.
  - **Multi-transition** — one completed Visit yields exactly three events (decision 1).
  - **Cursor pagination correctness** — paging through a known fixture returns every event exactly
    once, no duplicates, no gaps.
  - **Stability under insertion** — insert a new event between page fetches; page 2 must not
    duplicate a page-1 row. This is decision 5's whole justification; test it explicitly.
  - **Feed filtering** — excluded sources absent; `PATIENT` events only under `all`.
  - **Document collapse** — 6 files on one visit → 1 event with `detailCount = 6`; 1 file →
    filename, no count.
  - **NULL transition columns** — an appointment with no `cancelledAt` yields only the booked event.
  - **Visit document patient reach** — resolved through the `visit` join.
- **Route tests** — auth handling, query param parsing, 404 mapping. Do not re-test query behaviour.
- **Extend existing command tests** for the new timestamp writes (§4.3).

Integration tests need `TEST_DATABASE_URL` (name must contain `test`) and `bun run test:db:migrate`
first. `bun run test` and `bunx tsc --noEmit` must be green before the task is done.

## 11. Definition of done

- `/patients/[id]?tab=timeline` renders a merged, day-grouped, reverse-chronological feed.
- Scrolling loads more; "Load more" is keyboard-reachable; the feed has a visible end.
- All four filter chips work and are reflected in the URL.
- Every entry links to a live page — including Bookings, via the new sheet.
- Back-navigation from a linked page returns to the Timeline tab with the feed intact.
- Deactivated patient still renders a full timeline.
- `bun run test`, `bunx tsc --noEmit`, `bun run lint`, `bun run format:check`, `bun run build` all
  clean.
- Swagger updated; ADR 0041 and the three `CONTEXT.md` terms already committed.

---

## Task checklist

Phases are ordered by dependency; within a phase, tickets are parallelizable. Every backend ticket
ships its colocated tests in the same change.

> **Implemented 2026-07-23.** All four phases done on the `main` working tree (not committed).
> `bun run test` 2762 passed / 272 files, `bunx tsc --noEmit` clean, lint 0 errors (13 pre-existing
> warnings, none in new files), `format:check` clean, `bun run build` compiled. Migration `0052`
> applied to the Neon dev database.
>
> **One deviation from the plan (§4.3):** the appointment-cancel command the plan told the
> implementer to update **does not exist** — appointment cancellation is not implemented anywhere in
> the codebase. There is no cancel command, no PATCH/DELETE route, and the only writer of
> `appointmentStatusId` after creation is `visit-repository.ts`, doing the ADR 0030 check-in/complete
> sync. `appointment.cancelledAt` was still added and the `APPOINTMENT_CANCELLED` union branch is
> written and integration-tested against a hand-inserted timestamp; it simply returns zero rows in
> production until appointment cancellation ships as its own feature. Building that feature — status
> transition rules, slot-reservation release, a cancelled-reason picker — was out of scope here.

### Phase 0 — Schema & foundations

- [x] Add `appointment.cancelledAt`, `patient.deactivatedAt`, `patient.reactivatedAt` to the schema
      files (§4.1).
- [x] Add the four `(tenant_id, patient_id)` indexes (§4.2).
- [x] `bun run db:generate` then `bun run db:migrate` — one migration, `0052_moaning_shen.sql`,
      containing exactly the three columns and four indexes.
- [x] Add `CursorPaginated<T>` to `app/api/lib/utils/types.ts` (§5).
- [x] Patient deactivate/reactivate now stamp their instants — done in
      `patientRepository.setPatientActive`, which serves both commands, plus an integration test
      asserting a later reactivation does not erase the earlier deactivation.
      **Appointment-cancel: not applicable — see the deviation note above.**

### Phase 1 — `patient-timeline` backend module

- [x] `schemas/patient-timeline-schema.ts` — source/event/feed sets, param schema, cursor
      encode/decode, `TimelineEvent` discriminated union (§6.1, §6.2) **+ 22 schema unit tests**.
- [x] `repository/patient-timeline-repository.ts` — 18-branch `UNION ALL`, keyset cursor, feed
      branch pruning (§6.3) **+ 22 integration tests** covering the full §10 list.
- [x] `validator/get-patient-timeline-validator.ts` (§6.4) **+ 12 unit tests**.
- [x] `queries/get-patient-timeline-query.ts` (§6.5) **+ 9 unit tests**.
- [x] `GET /api/v1/patients/[id]/timeline` route + `types.ts` (§7.1). No route tests: the adapter is
      the same thin session → parse → query → map shape as the sibling chart route, which also has
      none, so route tests would only restate query behaviour (policy item 6).
- [x] Swagger for the timeline operation (§9).

### Phase 2 — Appointment detail endpoint

- [x] `get-appointment-by-id-query.ts` + validator **+ 7 unit tests**. `getAppointmentById` already
      existed on the repository with the full join set, so no repository change was needed.
- [x] `GET /api/v1/appointments/[id]` route + `types.ts` (§7.2).
- [x] Swagger for the appointment-by-id operation (§9).

### Phase 3 — Frontend

- [x] `app/queries/patients/timeline/usePatientTimeline.ts` — the app's first `useInfiniteQuery`,
      `feed` in the key, day grouping derived in `select` (§8.1).
- [x] `app/queries/appointments/useAppointment.ts`.
- [x] All three patient tabs moved to `?tab=` via `nuqs` in `patient-detail-impl.tsx` (§8.2).
- [x] `_timeline/` components: section, filter chips, day group, entry, load-more (§8.3).
- [x] `_utils/timeline-presentation.ts` — pure label/context/href mapping (§8.3).
- [x] Sentinel + button + `aria-live` + end-of-feed marker; skeletons on first load only (§8.4).
- [x] Empty state (distinguishes "no activity" from "no match for this filter") and error state.
- [x] `appointment-detail-sheet.tsx` + `?appointment=` param on `appointments-page-impl.tsx` (§8.6).
- [x] Updated `patients/[id]/loader.tsx` for the third tab. `appointments/loader.tsx` unchanged —
      the sheet is an overlay and does not alter the page shell.

### Phase 4 — Gates

- [x] `bun run test` green — 2762 tests, 272 files.
- [x] `bunx tsc --noEmit`, `bun run lint`, `bun run format:check`, `bun run build` clean.
- [x] SQL verified against real data before the test DB was available: patient 7 on the Neon dev
      database returned 9 events across 2 Visits with correct multi-transition expansion, document
      collapse, and DESC ordering; cursor paging at `limit=2` walked all 9 with 0 duplicates,
      including a split across two events sharing an identical timestamp.
- [ ] Manual browser smoke on a patient with bookings, a discharged admission with a transfer, and
      an invoice with payments — the dev-database patient has only Visits and documents, so the
      Admission, Invoice, Payment, Bed Transfer and Clinical Note entries are covered by integration
      tests but have not been seen rendered.
