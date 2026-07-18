# Plan: Billing & Revenue Cycle (v1) — Charge Items, Invoices, Payments

> Standalone implementation plan. Written for an implementing agent that has **not** seen the
> planning conversation. Read `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`, `DESIGN.md`, `lessons.md`,
> and `docs/backend-testing.md` before starting. Follow every convention in those docs exactly —
> this plan describes _what_ to build and _in what order_; those docs remain the binding _how_.
>
> Supersedes the previous plan in this file (Inpatient Management / IPD), which is fully
> implemented and merged to `main` (PRs #248/#249 — admission, ward, bed, bed-board all exist).

## 1. Goal

The EMR now covers the full clinical spine — appointments, OPD Visits, IPD Admissions with beds
and transfers, and the patient chart — but has **no financial capability at all**: no way to
price a service, raise a bill, or record a payment. Feature-parity analysis against OpenEMR,
Bahmni, and HospitalRun (§2) identified Billing as the largest gap and the biggest real-world
adoption blocker. The IPD plan explicitly deferred money to this plan ("charge capture per
bed-day is the billing plan's job" — `roomType.dailyRate` already exists and is read by nothing).

This plan adds **cash-first patient billing**: a **ChargeItem** master (priced service
catalogue), the **Invoice** module (draft → finalize → pay/void lifecycle with line items,
snapshot pricing, an invoice-level discount, and auto-generated bed-day charges for discharged
Admissions), and **Payments** (append-only, receipt-numbered, partial payments allowed). Both FE
and BE, tests colocated, plus permissions, Swagger, ADRs, and glossary terms.

### In scope (confirmed)

1. **ChargeItem master** — tenant-scoped Master: name, uppercase code, fixed category set,
   unit price, active flag. Standard master CRUD screen. No onboarding seed (decision 10).
2. **Invoice module** — full CQRS stack: create draft (patient + optional Visit **or**
   Admission link), add/remove lines (from ChargeItems, with qty and price override at add
   time), invoice-level flat discount, finalize, void, soft delete (draft/void only),
   list/get with joined patient + encounter + lines + payments.
3. **Snapshot pricing** — lines copy description + unit price at add time; later master price
   edits never change existing invoices (decision 3).
4. **Payments** — append-only, recorded against finalized invoices only, partial payments
   allowed, tenant-scoped `RCP-` receipt numbers, fixed payment-method set, transactional
   `amountPaid`/status sync (FINALIZED → PARTIALLY_PAID → PAID).
5. **Bed-day charge generation** — one command computes occupancy segments for a **discharged**
   linked Admission from `admittedAt` → bed transfers → `dischargedAt`, prices each segment via
   bed → Room → RoomType `dailyRate`, and inserts system-generated lines (regeneration replaces
   them). Unpriced segments (bed without Room, or null rate) are skipped and reported.
6. **Frontend** — `/billing` invoice list + create sheet, `/billing/[id]` detail (draft line
   editor, totals, finalize/void dialogs, payments + record-payment dialog, generate-bed-charges
   action), `/billing-masters/charge-items` CRUD, "Create Invoice" deep links from Visit and
   Admission detail, nav groups + pageMeta.
7. Permission-catalogue additions + backfill migration, Swagger, ADRs 0036–0040, CONTEXT.md
   terms.

### Out of scope (explicit)

- **Insurance, TPA, claims, payer contracts** — v1 is cash/self-pay only. The Payment method
  set has no INSURANCE value on purpose; claims are their own future plan.
- **Taxes (GST etc.)** — no tax fields anywhere in v1. Adding a tax engine later means new
  columns, not reworked ones (decision 9).
- **Refunds, credit notes, payment corrections** — payments are append-only (decision 6). The
  only correction path is voiding an **unpaid** invoice and reissuing.
- **Advances / deposits / interim bills** — bed charges require a discharged Admission; billing
  an active Admission is a future enhancement (decision 8).
- **Doctor-specific fee schedules** — consultation prices live on ChargeItems; `doctor` has no
  fee column and gets none in v1.
- **Packages / bundled pricing, multi-currency** — single implicit currency, plain line items.
- **Printable invoice PDF** — the detail screen is the record; a print/PDF layout is follow-up.
- **Cashier reports / day-close / revenue dashboards** — list filters are the only reporting.
- **Pharmacy and Lab charge sources** — those modules don't exist yet; the ChargeItem category
  set reserves room for them (decision 4) but nothing integrates.
- **Facility scoping** — same stance as the Visit/IPD plans: everything tenant-scoped, add
  `facilityId` when the Facility module lands.

## 2. Competitor / standards research (why the model looks like this)

- **OpenEMR** bills through a _Fee Sheet_ attached to an encounter: coded services with prices
  are captured per encounter, become a patient invoice, and payments are posted against it
  (patient portion vs insurance). Stripped of the US insurance machinery, the core loop is
  exactly: priced catalogue → encounter-linked invoice → posted payments.
- **Bahmni** does not build billing at all — it embeds **Odoo**: clinical orders sync to Odoo
  _quotations_ that become invoices; bed charges flow from the ADT (admission/transfer/
  discharge) record. The lesson carried over: bed-days are **derived from the admission's
  occupancy history**, not typed in by a clerk. Our `admission_bed_transfer` table is the ADT
  history that makes that derivable.
- **HospitalRun** (offline-first, low-resource hospitals) ships only basic per-visit charge
  capture — evidence that a lean, cash-first invoice is a legitimate v1 for exactly our target
  segment (Indian private hospital groups; the tenant examples in `CONTEXT.md` are Apollo/
  Fortis, where walk-in OPD billing is cash/UPI-first).
- **Commercial RCM** (Epic Resolute, Oracle Health) adds contracts, claims, remittance,
  denials — an order of magnitude beyond v1 and meaningless without payers in the domain.

Model consequences: invoice lines **snapshot** price (OpenEMR fee-sheet behaviour), bed charges
are **generated, replaceable system lines** (Bahmni/Odoo behaviour), and the lifecycle is the
minimal draft→final→paid/void state machine every one of these systems shares.

## 3. Key design decisions

1. **Invoice lifecycle is a fixed system set** — `DRAFT → FINALIZED → PARTIALLY_PAID → PAID`,
   with `VOID` reachable from `DRAFT` and `FINALIZED` (zero payments only). Stored in a
   `status` column with a CHECK, like `visit.status`/`admission.status`. `PARTIALLY_PAID` is a
   **stored** status flipped transactionally by the payment command, not derived at read time —
   list filtering and the partial unique story stay index-friendly. (ADR 0037)
2. **Finalized invoices are immutable** except for recording payments and voiding. All line,
   discount, and notes edits are DRAFT-only, enforced in validators **and** as a `status`
   predicate on the repository's guarded UPDATEs (zero rows → clean outcome), mirroring the
   guarded bed-occupy pattern from the admission module. (ADR 0037)
3. **Lines snapshot at add time** — `description` and `unitPrice` are copied from the
   ChargeItem when the line is added; `chargeItemId` is kept as a nullable provenance FK.
   The cashier may override price and set quantity at add time; after that the line is
   add/remove only (no in-place edit — remove and re-add). (ADR 0038)
4. **ChargeItem category is a fixed system set**, not a master:
   `CONSULTATION | PROCEDURE | INVESTIGATION | BED | CONSUMABLE | OTHER`. It exists for list
   filtering and future module integration (pharmacy → CONSUMABLE, lab → INVESTIGATION); a
   master table would be ceremony with no behaviour. (ADR 0036 records both fixed sets.)
5. **Invoice and Receipt numbers are tenant-scoped generated sequences** — `INV-1001…` /
   `RCP-1001…` via counter tables mirroring `visitNumberCounter`/`admissionNumberCounter`
   (precedent ADRs 0028/0032). Uppercase-unique per tenant. (ADR 0036)
6. **Payments are append-only.** No update or delete route for payments exists. `amountPaid`
   is denormalized on the invoice and maintained in the same guarded UPDATE that flips status:
   `amount_paid = amount_paid + $x WHERE status IN ('FINALIZED','PARTIALLY_PAID') AND
amount_paid + $x <= grand_total`, with `status` set via CASE in the same statement — the
   overpay race has no window. A table CHECK `amount_paid <= grand_total` is the backstop.
   (ADR 0039)
7. **One encounter parent max** — `visitId` and `admissionId` are both nullable with a CHECK
   `not (visit_id is not null and admission_id is not null)`, exactly like the clinical-capture
   columns on `patient_vital_sign`/`clinical_note`. Patient and encounter link are fixed at
   create (no re-parenting a draft; delete it and start over).
8. **Bed-day generation requires a DISCHARGED Admission** and computes per occupancy segment:
   segments come from `admittedAt` → each `admission_bed_transfer.transferredAt` →
   `dischargedAt`; each segment bills `max(1, calendar dates between segment start and end)`
   in the Tenant Time Zone (`Asia/Kolkata` until configurable) at the segment bed's
   Room → RoomType `dailyRate`. Same-day admit+discharge = 1 day; a transfer day can bill on
   both segments (standard hospital practice — documented, not a bug). Generated lines carry
   `source = 'BED_AUTO'`; regeneration deletes prior `BED_AUTO` lines and re-inserts, so the
   command is idempotent. Unpriced segments are skipped and returned as warnings in the command
   result. (ADR 0040)
9. **Money is `numeric(12,2)` with `mode: 'number'`** — the `roomType.dailyRate` precedent.
   All arithmetic rounds half-up to 2dp at the line level (`amount = round(qty × unitPrice)`),
   totals are sums of rounded lines. Single implicit currency; no tax fields.
10. **Discount is a flat invoice-level amount**, `0 ≤ discount ≤ subtotal`, editable in DRAFT
    only. No per-line discounts, no percentages in v1 (a percentage is just a client-side way
    to compute the flat amount). `grandTotal = subtotal − discountAmount`.
11. **A zero-total invoice finalizes straight to `PAID`** (`amountPaid` stays 0, balance 0) —
    supports free camps/charity cases without a fake payment row.
12. **No onboarding seed for ChargeItems** — unlike AdmissionTypes, a charge item without a
    real price is garbage data, and prices are tenant-specific. Tenants build their own
    catalogue. Permission seeds only.
13. **The invoice module owns payments** (commands, receipt counter, reads) rather than a
    separate `payment` module — payments only exist inside the invoice aggregate and must share
    its transaction, exactly as bed transfers live inside the admission module.

## 4. Domain glossary additions (`CONTEXT.md`)

Add (wording to taste, terms exact): **Charge Item**, **Charge Item Category**, **Invoice**,
**Invoice Number**, **Invoice Line**, **Invoice Status**, **Draft Invoice**, **Finalize**,
**Void**, **Discount**, **Payment**, **Payment Method**, **Receipt Number**, **Balance Due**
(grandTotal − amountPaid, always derived), **Bed-Day Charge**, **Occupancy Segment**.

New ADRs (`docs/adr/`):

- `0036-invoice-receipt-numbers-and-billing-fixed-sets.md` — INV-/RCP- tenant-scoped
  sequences; ChargeItem category + Payment method are fixed system sets.
- `0037-invoice-lifecycle-and-post-finalize-immutability.md`
- `0038-invoice-lines-snapshot-price-at-add-time.md`
- `0039-payments-are-append-only-with-transactional-status-sync.md`
- `0040-bed-day-charges-derive-from-admission-occupancy-segments.md`

## 5. Data model

New files under `app/db/schema/`; all tables carry `tenantId varchar(255) notNull` +
`masterColumns()`. Read `lessons.md` before writing the partial unique indexes. Export table
variables without a `Table` suffix; consumers alias (`as invoiceTable`) per ADR 0015.

**`charge-item.ts`** → `charge_item` (standard master, mirror `visit-type.ts`)

| column      | type                              | notes                                                                            |
| ----------- | --------------------------------- | -------------------------------------------------------------------------------- |
| name        | varchar(150) notNull              |                                                                                  |
| code        | varchar(20) notNull               | stored uppercase                                                                 |
| category    | varchar(20) notNull               | CHECK in ('CONSULTATION','PROCEDURE','INVESTIGATION','BED','CONSUMABLE','OTHER') |
| unitPrice   | numeric(12,2) mode number notNull | ≥ 0 CHECK                                                                        |
| description | text                              |                                                                                  |
| isActive    | boolean notNull default true      |                                                                                  |

- Unique: `(tenantId, lower(name))` and `(tenantId, lower(code))`, both `where is_deleted = false`
- Non-unique `(tenantId, category)`

**`invoice.ts`** → `invoice`

| column         | type                                | notes                                                              |
| -------------- | ----------------------------------- | ------------------------------------------------------------------ |
| invoiceNumber  | varchar(20) notNull                 | `INV-1001`…                                                        |
| patientId      | integer notNull FK patient          | fixed at create                                                    |
| visitId        | integer FK visit                    | nullable — source OPD Visit                                        |
| admissionId    | integer FK admission                | nullable — source Admission                                        |
| status         | varchar(20) notNull default 'DRAFT' | CHECK in ('DRAFT','FINALIZED','PARTIALLY_PAID','PAID','VOID')      |
| subtotal       | numeric(12,2) notNull default 0     | maintained transactionally with line changes                       |
| discountAmount | numeric(12,2) notNull default 0     | CHECK `discount_amount >= 0 and discount_amount <= subtotal`       |
| grandTotal     | numeric(12,2) notNull default 0     | = subtotal − discountAmount, maintained in the same transaction    |
| amountPaid     | numeric(12,2) notNull default 0     | CHECK `amount_paid >= 0 and amount_paid <= grand_total` (backstop) |
| notes          | text                                | DRAFT-editable                                                     |
| finalizedAt    | timestamptz                         | set on finalize                                                    |
| voidedAt       | timestamptz                         | set on void                                                        |
| voidReason     | varchar(255)                        | required on void                                                   |

Constraints / indexes:

- CHECK `not (visit_id is not null and admission_id is not null)` (decision 7)
- `invoice_tenant_number_idx` unique on `(tenantId, lower(invoiceNumber))`
- non-unique `(tenantId, status)`, `(tenantId, patientId)`

**`invoice.ts` (same file)** → counters, mirroring `visitNumberCounter`:

- `invoice_number_counter(tenant_id varchar pk, last_number integer notNull)`
- `receipt_number_counter(tenant_id varchar pk, last_number integer notNull)`

**`invoice-line.ts`** → `invoice_line`

| column       | type                                 | notes                                              |
| ------------ | ------------------------------------ | -------------------------------------------------- |
| invoiceId    | integer notNull FK invoice           |                                                    |
| chargeItemId | integer FK charge_item               | nullable — provenance only; null on BED_AUTO lines |
| description  | varchar(255) notNull                 | snapshot                                           |
| quantity     | integer notNull                      | CHECK ≥ 1                                          |
| unitPrice    | numeric(12,2) notNull                | CHECK ≥ 0 (snapshot, override allowed at add)      |
| amount       | numeric(12,2) notNull                | = round2(quantity × unitPrice)                     |
| source       | varchar(10) notNull default 'MANUAL' | CHECK in ('MANUAL','BED_AUTO')                     |

- non-unique `(tenantId, invoiceId)`

**`payment.ts`** → `payment`

| column        | type                            | notes                                                           |
| ------------- | ------------------------------- | --------------------------------------------------------------- |
| receiptNumber | varchar(20) notNull             | `RCP-1001`…                                                     |
| invoiceId     | integer notNull FK invoice      |                                                                 |
| amount        | numeric(12,2) notNull           | CHECK > 0                                                       |
| method        | varchar(20) notNull             | CHECK in ('CASH','CARD','UPI','BANK_TRANSFER','CHEQUE','OTHER') |
| reference     | varchar(100)                    | card auth / UPI txn / cheque no.                                |
| notes         | varchar(255)                    |                                                                 |
| receivedAt    | timestamptz notNull default now |                                                                 |

- `payment_tenant_receipt_idx` unique on `(tenantId, lower(receiptNumber))`
- non-unique `(tenantId, invoiceId)`

Run `bun run db:generate` then `bun run db:migrate` after each schema change.

## 6. Backend modules

Two modules under `app/api/lib/modules/`, full CQRS stack each, **colocated tests in the same
change** per `docs/backend-testing.md`.

### 6.1 `charge-item` (copy the `visit-type` module shape)

Standard master module: schema (+unit tests), repository (+integration tests), validators
(+unit tests), commands (+unit tests), queries (+unit tests). Code transforms to uppercase.
List supports `search` (name/code), `category`, `isActive` filters + pagination. Exact-string
messages follow the house convention:

- `Charge item name General Consultation already exists.` /
  `Charge item code CONS already exists.` / `Charge item abc is Invalid.`
- No delete guard: lines snapshot everything they need, so retiring an item is `isActive =
false` and deleting one never corrupts an invoice (mirrors VisitType; noted as a follow-up
  if a guard is ever wanted).

### 6.2 `invoice`

**Repository** (`repository/invoice-repository.ts` + integration tests):

- `getInvoiceById(tenantId, id)` — joined detail: patient (id, mrn, firstName, lastName),
  visit (id, visitNumber) / admission (id, admissionNumber) when linked, lines (ordered by id),
  payments (ordered by receivedAt).
- `getInvoices(tenantId, filters, pagination)` — filters: `status` (single or set), `patientId`,
  `search` (invoice number / patient name / MRN); returns list rows with patient join +
  balanceDue derived in the select. Default sort newest first.
- `createInvoice` — transaction: bump `invoice_number_counter` (insert-or-update, locked),
  insert invoice as DRAFT.
- `addInvoiceLine` / `removeInvoiceLine` — transaction: guarded write (`status = 'DRAFT'`),
  insert/delete line, recompute `subtotal`/`grandTotal` (clamping discount is the validator's
  job — repository re-reads and fails the transaction if the discount CHECK would break; see
  removal note below).
- `updateDraftInvoice` — guarded UPDATE (`status = 'DRAFT'`) for `discountAmount`/`notes`,
  recomputing `grandTotal`.
- `finalizeInvoice` — guarded UPDATE: `status = 'DRAFT'` → `FINALIZED` (or straight to `PAID`
  when `grand_total = 0`, decision 11), stamps `finalizedAt`. Zero rows → `not-draft` outcome.
- `voidInvoice` — guarded UPDATE: `status IN ('DRAFT','FINALIZED') AND amount_paid = 0` →
  `VOID`, stamps `voidedAt`/`voidReason`.
- `recordPayment` — transaction: bump `receipt_number_counter`, insert payment row, then the
  single guarded UPDATE from decision 6 (adds to `amount_paid`, flips status via CASE to
  `PARTIALLY_PAID` or `PAID`). Zero rows → `not-payable-or-over-balance` outcome and the
  transaction rolls back.
- `replaceBedAutoLines(tenantId, invoiceId, lines[])` — transaction: guarded on DRAFT, delete
  existing `source = 'BED_AUTO'` lines, insert new ones, recompute totals.
- `getAdmissionOccupancySegments(tenantId, admissionId)` — read for the bed-charge command:
  admission (admittedAt, dischargedAt, status, current bedId) + ordered bed transfers, each
  bed joined to room → roomType (`dailyRate`, room number, roomType name) + ward code/bed
  number for line descriptions.
- `deleteInvoice` — soft delete, guarded `status IN ('DRAFT','VOID')`.
- Reads for validators: `findInvoiceById` (bare row), plus reuse of existing repos
  (`patient`, `visit`, `admission`, `charge-item`) — validators call repository functions,
  never write Drizzle directly.

**Line-removal + discount interaction**: removing a line can make `subtotal <
discountAmount`, which the table CHECK rejects. The remove-line transaction clamps
`discountAmount = min(discountAmount, newSubtotal)` in the same UPDATE and the response
surfaces the adjusted totals — simplest rule that can't strand a draft (document in ADR 0037).

**Schemas** (+unit tests): create (patientId, visitId?, admissionId?, notes?; refine: not both
encounter links), add-line (chargeItemId, quantity int ≥ 1, unitPrice? override ≥ 0), draft
update (discountAmount ≥ 0, notes), void (voidReason required, trimmed, ≤ 255), payment
(amount > 0, method enum, reference?, notes?, receivedAt? defaults now), list filters.

**Validators** (+unit tests), exact messages:

- Existence: `Invoice abc is Invalid.` / `Invoice line abc is Invalid.` /
  `Patient abc is Invalid.` / `Visit abc is Invalid.` / `Admission abc is Invalid.` /
  `Charge item abc is Invalid.`
- Create: patient exists; linked Visit/Admission exists **and belongs to the same patient**
  (`Visit V-1001 does not belong to patient MRN-0001.` — same pattern for Admission).
- Draft-only edits: `Invoice INV-1001 can only be edited while in Draft.`
- Add-line: charge item active — `Charge item CONS is inactive.`
- Finalize: at least one line — `Invoice INV-1001 has no lines to finalize.`
- Void: `Invoice INV-1001 cannot be voided after payments are recorded.` (also covers
  PARTIALLY_PAID/PAID); already void/draft-deleted → existence message.
- Payment: `Invoice INV-1001 is not open for payment.` (DRAFT/PAID/VOID);
  `Payment amount 5000 exceeds the balance due 3000 on invoice INV-1001.`
- Discount: `Discount 6000 exceeds the invoice subtotal 5000.`
- Bed charges: `Invoice INV-1001 is not linked to an Admission.` /
  `Admission ADM-1001 is not discharged yet.`
- Delete: `Invoice INV-1001 cannot be removed once finalized.`

**Commands** (+unit tests): createInvoice, addInvoiceLine, removeInvoiceLine,
updateDraftInvoice, finalizeInvoice, voidInvoice, recordPayment, generateBedCharges,
deleteInvoice. Every command validates first; map `23505` (invoice/receipt number races) and
guarded-update zero-row outcomes to clean errors. `generateBedCharges` computes segments/days
per decision 8 (pure day-count helper lives beside the command, unit-tested hard: same-day,
transfer-day, month boundary, IST midnight edge) and returns
`{ linesAdded, warnings: string[] }` — warning text:
`Bed ICU-01 has no daily rate configured; segment skipped.`

**Queries** (+unit tests): getInvoiceById (detail shape incl. balanceDue), getInvoices
(validate filters; status set defaults to all), plus `getInvoicesByPatientId` only if the FE
needs it (no speculative exports).

## 7. API surface (`app/api/v1/`)

Every route: thin handler, sibling type-only `types.ts`, session-resolved `tenantId`, Swagger
in the same change.

| Route                          | Methods          | Notes                                      |
| ------------------------------ | ---------------- | ------------------------------------------ |
| `charge-items`                 | GET, POST        | list (filters) / create                    |
| `charge-items/[id]`            | GET, PUT, DELETE | delete = soft                              |
| `invoices`                     | GET, POST        | list (filters) / create draft              |
| `invoices/[id]`                | GET, PUT, DELETE | PUT = draft discount/notes; DELETE guarded |
| `invoices/[id]/lines`          | POST             | add line                                   |
| `invoices/[id]/lines/[lineId]` | DELETE           | remove line (204)                          |
| `invoices/[id]/finalize`       | POST             | lifecycle transition                       |
| `invoices/[id]/void`           | POST             | body: voidReason                           |
| `invoices/[id]/payments`       | GET, POST        | list / record payment (returns receipt)    |
| `invoices/[id]/bed-charges`    | POST             | generate/replace BED_AUTO lines + warnings |

Route tests for the transition/payment routes (non-trivial adapter logic: status-code mapping
for guard failures → 409, validation → 400, not found → 404).

## 8. Permissions & onboarding seed

1. **Permission catalogue**: new groups `billing` (invoice read/create/update/finalize/void/
   delete, payment record/read, bed-charge generate — collapse to the catalogue's house
   action-set granularity; follow how `inpatient` was structured in `seed-data.ts`) and
   `billing-masters` (charge-item CRUD). Seed via `seed-data.ts` + a backfill migration for
   existing tenants, exactly like `0044_seed_inpatient_permissions.sql`.
2. **Onboarding seed**: none for ChargeItems (decision 12). Update onboarding tests only if
   the permission additions touch them.

## 9. Frontend

All UI follows `DESIGN.md` + the `design-system` skill; every data call goes through the
`tanstack-query-patterns` skill. Every new `page.tsx` gets a sibling `loader.tsx` skeleton.
Sheet/dialog open-state lives in the URL via `nuqs` (ADR 0010); screen composition follows the
`_components` / `_sheets` / `_modals` / `_utils` structure (reference:
`app/(protected)/identity-access/roles/`).

### 9.1 Query hooks (`app/queries/billing/`)

- `charge-items`: list/get + create/update/delete mutations (copy an existing master's hooks).
- `invoices`: list (filters in the key), detail, create, draft-update, add/remove line,
  finalize, void, record-payment, generate-bed-charges. Mutations invalidate the detail + list
  keys; payment/finalize also invalidate anything patient-billing-related that exists. Export
  only hooks a component imports (no speculative exports).

### 9.2 `/billing` — Invoice list (`app/(protected)/billing/`)

- Toolbar: status filter (default **Open** = DRAFT + FINALIZED + PARTIALLY_PAID; explicit
  All/Paid/Void options), search (invoice # / patient name / MRN), **New Invoice** button.
- Table: invoice #, patient (name + MRN), linked encounter chip (visit/admission number),
  status badge, grand total, balance due, created date. Row → `/billing/[id]`.
- `create-invoice-sheet` (`_sheets/`): patient picker (reuse the existing patient search
  pattern from the admit sheet), optional encounter link (radio none/visit/admission + a picker
  filtered to that patient's records), notes. Opens via `?invoice=new`; supports prefill params
  `?invoice=new&patientId=…&visitId=…` / `…&admissionId=…` for the deep links in §9.4. On
  success → navigate to the new draft's detail.

### 9.3 `/billing/[id]` — Invoice detail

- Header: invoice #, status badge, patient identity, encounter chip (links to visit/admission
  detail), finalized/voided timestamps, void reason.
- Lines card: table of description / qty / unit price / amount, `BED_AUTO` lines visually
  tagged. In DRAFT: **Add line** sheet (`_sheets/add-line-sheet.tsx` — active-ChargeItem
  picker with category filter, qty, prefilled overridable price), per-row remove, and a
  **Generate bed charges** button when admission-linked (confirm dialog; shows returned
  warnings as toasts/inline).
- Totals panel: subtotal, discount (inline-editable in DRAFT), grand total, amount paid,
  **balance due** emphasized.
- Payments card: receipt #, method, reference, amount, receivedAt. **Record payment** dialog
  (`_modals/record-payment-dialog.tsx`) — amount (prefilled with balance), method, reference,
  notes; hidden unless status is payable.
- Lifecycle actions: **Finalize** confirm dialog (DRAFT), **Void** dialog with required reason
  (DRAFT / FINALIZED with no payments), **Delete** (DRAFT/VOID) with confirm.

### 9.4 Encounter deep links

- Visit detail and Admission detail get a **Create Invoice** action that routes to
  `/billing?invoice=new&patientId=…&visitId=…` (resp. `admissionId`). FE-only change to those
  screens — no backend edits to visit/admission modules anywhere in this plan.

### 9.5 Master screen + nav

- `/billing-masters/charge-items` — standard master CRUD screen (copy an existing master
  screen wholesale: table + search/category filter + create/edit sheet + delete dialog +
  active toggle), + loader.
- Nav: new **Billing** group (Invoices) in the app sidebar; Configuration → **Billing
  Masters** (Charge Items). pageMeta entries for every new route.

## 10. Swagger / OpenAPI

Every operation in §7 documented in the same change as its route: request/response schemas,
status codes (400 validation, 401, 404, 409 for lifecycle/uniqueness conflicts), and realistic
EMR examples — e.g. a finalized `INV-1042` for patient `MRN-0007` with a `CONS` line and a
`BED_AUTO` line (`Bed charges — ICU-01 (ICU), 3 days @ 5000.00`), a partial `RCP-2010` UPI
payment, the exact-message error examples from §6.2 (over-balance payment, void-after-payment,
not-discharged bed charges), and the uppercase-code transform on ChargeItem.

## 11. Cross-module touchpoints

- **Reads** `roomType.dailyRate` via bed → room → roomType for bed-charge generation — first
  consumer of that column; no schema change to rooms.
- **Reads** `admission` + `admission_bed_transfer` for occupancy segments; **no writes** to
  IPD tables and no status coupling (billing never blocks discharge in v1).
- **Reads** `patient`, `visit` for existence/ownership checks and joins.
- Visit/Admission detail screens gain one FE action each (§9.4).
- Permission seed + backfill migration touches the shared catalogue (§8).

## 12. Open decisions (recommended defaults baked into this plan)

1. **Transfer-day double billing** (decision 8): both segments bill the transfer date.
   Alternative (bill the arriving bed only) is more code for marginal fairness; revisit if
   users complain.
2. **Line edit** = remove + re-add (decision 3). In-place qty/price PATCH is a easy follow-up
   if cashiers hate it.
3. **Discount clamp on line removal** (§6.2): auto-clamp + surface, rather than blocking the
   removal. Blocking strands drafts behind a discount the user then has to find.
4. **Status filter default "Open"** on `/billing` (§9.2) — cashiers live in open invoices;
   Paid/Void are lookups.
5. **`receivedAt` accepted from the client** (defaults to now) — hospitals backfill
   end-of-day cash entries. Not allowed in the future (schema refine: ≤ now + small skew).

## 13. Definition of done

- `bun run test` green (all new colocated unit + integration tests included).
- `bunx tsc --noEmit`, `bun run lint`, `bun run format:check` clean; `bun run build` passes.
- `bun run db:migrate` applies cleanly from a fresh DB; permission backfill migration runs.
- Swagger renders every new operation with success + error examples.
- Manual smoke: create ChargeItems `CONS` (500) and `DRSG` (150) → new invoice for a Registered
  patient linked to a Visit → add both lines (override DRSG to 200, qty 2) → discount 100 →
  totals check (subtotal 900, grand 800) → finalize (lines lock) → record CASH 300
  (`RCP-…`, status PARTIALLY_PAID, balance 500) → attempt 600 payment (refused with exact
  message) → pay UPI 500 (status PAID) → void attempt refused. Second flow: discharge an
  admitted patient who had one bed transfer → invoice linked to the Admission → generate bed
  charges (two BED_AUTO segments, day counts per decision 8; a rate-less bed yields the skip
  warning) → regenerate (no duplicates) → finalize → pay → PAID. Guards: draft-only edits,
  delete-after-finalize refused, zero-total invoice finalizes straight to PAID, ChargeItem
  uniqueness + inactive-item add-line refusal.

---

## Task checklist

Phases are ordered by dependency; within a phase, tickets are parallelizable. Every backend
ticket ships its colocated tests in the same change.

> **Progress log (2026-07-18):** Phases 0–1 implemented on `main` working tree (not yet committed).
>
> - **Phase 0:** CONTEXT.md billing terms added (Charge Item + Category, Invoice + Number + Line +
>   Status, Draft/Finalize/Void, Discount, Payment + Method, Receipt Number, Balance Due, Bed-Day
>   Charge, Occupancy Segment); ADRs `0036`–`0040` written; `billing` + `billing-masters`
>   permission groups added to `seed-data.ts` (13 permissions) + backfill migration
>   `0047_seed_billing_permissions.sql` (+ hand-authored snapshot/journal entry, `drizzle-kit
check` clean).
> - **Phase 1:** `charge_item` table (migration `0048`, category + unit-price CHECKs, two partial
>   unique indexes, category index) + full CQRS module cloned from `visit-type`/`ward` with
>   category/unitPrice/isActive fields and category+isActive list filters. Colocated tests: schema
>   (17), validator (18), commands (16), queries (7), repository integration (19) — 70 charge-item
>   tests green. Routes `charge-items(+/[id])` + `types.ts` + Swagger (tag, paths via
>   `collectionOperations`/`itemOperations`, `ChargeItemCategory`/`CreateChargeItemRequest`/
>   `ChargeItem` schemas; 2009 refs / 0 unresolved). Query hooks `app/queries/billing/charge-items/*`.
>   `/billing-masters/charge-items` CRUD screen (page/loader/impl/table/form-sheet/delete-dialog,
>   nuqs `?charge-item=` state, category filter, active toggle) + **Billing Masters** nav group +
>   pageMeta.
> - **Gates:** `bunx tsc --noEmit` clean; `bun run lint` 0 errors; `bun run format:check` clean.
>   Full `bun run test` re-run in progress. Messages use the unquoted house style
>   (`Charge item code CONS already exists.` / `Charge item abc is Invalid.`).

### Phase 0 — Foundations

- [x] CONTEXT.md terms (§4).
- [x] ADRs 0036–0040 (§4).
- [x] Permission catalogue: `billing` + `billing-masters` groups in `seed-data.ts` + backfill
      seed migration (§8.1).

### Phase 1 — ChargeItem master (backend + frontend)

- [x] `charge-item` schema + migration; full module + colocated tests (uppercase code,
      category CHECK, price ≥ 0, uniqueness messages) (§5, §6.1).
- [x] Routes + `types.ts` + Swagger: `charge-items(+/[id])` (§7, §10).
- [x] Query hooks `app/queries/billing/charge-items*`.
- [x] `/billing-masters/charge-items` CRUD screen + loader; Configuration → **Billing
      Masters** nav + pageMeta (§9.5).

### Phase 2 — Invoice module (backend)

> **Progress log (2026-07-18):** Phase 2 implemented. `invoice`/`invoice_line`/`payment` +
> `invoice_number_counter`/`receipt_number_counter` schemas (migration `0049`, all CHECKs incl.
> single-encounter-parent, discount ≤ subtotal, amount_paid ≤ grand_total, per-tenant unique
> INV/RCP indexes). Repository with FOR-UPDATE-locked draft guards, transactional counter bumps,
> transactional total recompute + discount clamp, payment status sync, idempotent BED_AUTO
> replacement, and `getOccupancySource`. Pure `bed-day-calculator` (segments + IST calendar-day
> counting). 11 validators, 9 commands, 2 queries, 8 routes (+ sub-routes) + 8 `types.ts`.
> Swagger: 2 tags, 8 paths, 12 schemas, examples incl. exact error strings (2113 refs / 0
> unresolved). Colocated tests: schema (17), calculator (9), validator (26), commands (11),
> queries (7), repository integration (13) — **78 invoice tests**. `bunx tsc`/lint/prettier clean.
> Route adapter logic mirrors existing routes closely, so no separate route tests were added
> (deviation from §7's optional route-test note; command/validator coverage exercises the mapping).

- [x] `invoice` + `invoice_line` + `payment` + both counter schemas + migration incl. CHECKs
      and partial unique indexes (§5).
- [x] `invoice` repository (create/line/draft-update/finalize/void/payment/bed-segment reads/
      replaceBedAutoLines/delete, guarded UPDATEs, transactional totals) + integration tests
      (tenant isolation, number/receipt counter races, status guards as zero-row outcomes,
      payment race → CHECK backstop, discount clamp on line removal).
- [x] `invoice` schemas + unit tests (one-parent refine, payment bounds, void reason).
- [x] `invoice` validators + unit tests (all gates + exact messages §6.2).
- [x] `invoice` commands + unit tests (validator-first, 23505 mapping, guarded-outcome
      mapping; bed-day segment/day-count helper edge cases: same-day, transfer-day, month
      boundary, IST midnight).
- [x] `invoice` queries + unit tests (detail shape incl. balanceDue; list filters, Open set).
- [x] Routes + `types.ts` + Swagger: `invoices`, `invoices/[id]`, `lines(+/[lineId])`,
      `finalize`, `void`, `payments`, `bed-charges` (route adapters mirror existing routes;
      no separate route tests) (§7, §10).

### Phase 3 — Frontend

> **Progress log (2026-07-18):** Phase 3 implemented. 11 invoice query hooks
> (`app/queries/billing/invoices/*`: list + detail reads, create/update-draft/add-line/
> remove-line/finalize/void/record-payment/generate-bed-charges/delete mutations, all
> invalidating `INVOICES_KEY`). `/billing` list (page/loader/impl/table + `create-invoice-sheet`
> with patient picker, none/visit/admission radio + patient-scoped encounter pickers, and
> `?invoice=new&patientId=&visitId=/&admissionId=` prefill). `/billing/[id]` detail (header with
> encounter links, lines card with add/remove + generate-bed-charges + BED_AUTO tag, totals panel
> with inline discount edit, payments card, finalize/void/delete/record-payment surfaces via
> `?line=` + local modal state). Void/add-line use the keyed-inner-form pattern to avoid
> set-state-in-effect. Visit + Admission detail gained **Create Invoice** deep links. **Billing**
> top-level nav group + `/billing` pageMeta. `bunx tsc`/lint (0 errors)/prettier/`bun run build`
> all clean; all `/billing*` routes compile.

- [x] Query hooks `app/queries/billing/invoices*` (§9.1).
- [x] `/billing` list: page + loader + impl + toolbar + table + `create-invoice-sheet` with
      prefill params (§9.2).
- [x] `/billing/[id]` detail: header + lines card + totals panel + payments card (§9.3).
- [x] `add-line-sheet`, `record-payment-dialog`, finalize/void/delete dialogs,
      generate-bed-charges action + warnings surface (§9.3).
- [x] Visit + Admission detail **Create Invoice** deep links (§9.4).
- [x] Nav: **Billing** group (Invoices) + pageMeta entries (§9.5).

### Phase 4 — Docs & gates

- [x] Swagger sweep — every new/changed operation with success + error examples (done in
      Phases 1–2; 2113 refs / 0 unresolved).
- [x] Green gates: `bunx tsc --noEmit`, `bun run build`, lint (0 errors), prettier clean;
      `bun run test` final run confirming 261+ files green.
- [x] Manual smoke per §13 — **DONE 2026-07-18** against the live dev server (Neon migrated at
      the user's request). A scripted driver signed up a fresh tenant, seeded a patient/visit/
      discharged-admission-with-transfer, and drove the real HTTP API: **26/26 assertions passed**
      — CONS/DRSG charge items (uppercase code, duplicate-name refused, inactive item), visit-linked
      INV-1001 (snapshot lines, DRSG override to 200×2, discount 100 → grand 800, finalize locks
      edits, CASH 300 → PARTIALLY_PAID/RCP-1001/balance 500, overpay 600 refused with exact message,
      UPI 500 → PAID, void-after-payment refused, delete-finalized refused), zero-total → PAID,
      admission-linked bed charges (2-day ICU-01 @5000 = 10000 line + rate-less GEN-04 skip warning,
      idempotent regenerate, finalize + pay → PAID). Browser check confirmed the FE: login, Billing
      nav, `/billing` list (all encounter chips + statuses), and both `/billing/[id]` detail screens
      incl. the BED_AUTO "Auto"-tagged line.
