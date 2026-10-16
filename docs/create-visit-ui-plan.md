# Create Visit UI Plan

## Purpose

Create an advanced Visit creation experience for the EMR app that combines Patient context, card or payment information, Visit details, and optional Appointment details on one focused clinical route.

This plan is based on:

- Reference app: `http://100.30.174.15:8031/PatientOP/Detail` -> Patient list -> Options -> Visit.
- Current EMR domain rules in `CONTEXT.md` and Visit/Appointment ADRs.
- Current EMR implementation in `/visits`, `/appointments`, `/patients`, and `POST /api/v1/visits`.

## Reference App Findings

### Patient OP List

The reference app starts from a Patient OP list with search inputs for Emirates ID, MRN, Patient Name, and Mobile Number. Each row has a `Visit` action in the Options column.

The row contains useful front-desk context:

- MRN.
- Patient name.
- Address.
- Mobile.
- Gender.
- Marital status.
- Nationality.
- Country.
- Email.
- Location and Emirate.
- Religion.
- Language.
- Status.

### Visit Creation Surface

Clicking `Visit` opens `/VisitOP/Detail/{patientId}`. The page shows a Visit OP list and immediately opens a large create modal for the selected Patient.

The modal header shows:

- `Appointment Patient` action.
- Patient identity: MRN and full name.
- Advance amount available.
- Close action.

The modal is divided into tabs:

- Patient Information.
- Card Information.
- Visit Register.
- Upload Documents.

### Patient Information Tab

The reference app lets staff review or edit Patient details inside the Visit flow:

- Emirates ID.
- Has Emirates ID.
- VIP.
- Medical Tourist.
- Enable SMS.
- Status.
- Passport Number.
- UID.
- MRN.
- Title.
- First Name, Middle Name, Last Name.
- Date Of Birth.
- Gender.
- Marital Status.
- Nationality.
- Mobile, Phone, Email.
- Occupation.
- Religion.
- Race.
- Ethnic Group.
- Language.
- Address fields.

For our app, most of this already belongs to Patient Registration and Patient edit. Visit creation should show the safety-critical subset inline and link to edit/complete registration when the Patient is incomplete.

### Card Information Tab

Observed fields:

- Visit Classification: `CASH`, `INSURANCE`, `SELFFUNDED`, `CORPORATE`.
- Select Visit Card.
- Payer/Receiver.
- Insurance Policy.
- Policy Holder.
- Membership ID.
- Start Date.
- End Date.
- Enable Scanner.
- Refresh.
- Update Patient & Card Info.
- Next.

This is really payer or coverage information, not clinical Visit data. Our current domain has `preferredPaymentMethod` on Patient, but `CONTEXT.md` says Invoice and Payment are cash/self-pay only today; insurance and claims are not modeled. So the UI can include a payment/card panel, but storing full insurance card data requires a domain/API decision first.

### Visit Register Tab

Observed fields:

- PatientClass: `OutPatient`, `PreAdmit`, `Recurring patient`, `Obstetrics`, `Commercial account`, `Not applicable`.
- Visit Type: `OP(Out Patient)`, `WP(Walking Patient)`, `IP(In Patient)`, `Procedure/Diagnostic Visit`.
- Department.
- Clinician.
- Patient Type, with a Change checkbox.
- Visit Mode, with a Change checkbox.
- Information Source.
- Referral Source.
- Admit Source.
- Register Visit.

Our current Visit API is simpler:

- Appointment check-in: `appointmentId`, `visitTypeId`, optional chief complaint, remarks, documents.
- Walk-in Visit: `patientId`, `doctorId`, `visitTypeId`, optional chief complaint, remarks, documents.

### Appointment Patient Flow

The reference app's `Appointment Patient` button opens a nested modal:

- Enter Appointment ID.
- Proceed.

It does not make Appointment details visible by default. In our app, Appointment-backed Visit creation should do better: if the Visit is from an Appointment, the Appointment summary should be visible throughout the flow.

## Product Direction

Build a dedicated Create Visit route, not a cramped sheet.

Recommended route:

- `/visits/new`
- `/visits/new?bookingNumber=APT-1001`
- `/visits/new?appointmentId=123`
- `/visits/new?patientId=456`

This follows ADR 0021: clinical entity forms use dedicated pages. The Visits page and Appointment actions open `/visits/new`; the old `CheckInSheet` quick action has been removed.

## Target UI

### Layout

Use a two-column clinical workspace on desktop:

- Main column: Visit creation form.
- Right rail: Patient summary, Appointment context when present, active Visit/conflict warnings, and documents.

Mobile collapses into stacked sections:

- Patient banner.
- Appointment banner when present.
- Visit details.
- Payment/card panel.
- Documents.
- Sticky submit bar.

Use Fluent/shadcn primitives and tokens only:

- `Card`, `Alert`, `Badge`, `Tabs`, `Select`, `Input`, `Textarea`, `Button`, `Skeleton`.
- Icons from `lucide-react`.
- `shadow-fluent-2` for normal surfaces; avoid heavy modal treatment on the main page.

### Header

Header content:

- Title: `Create Visit`.
- Mode badge: `From Appointment` or `Walk-in`.
- Active Tenant and Facility remain visible in the app shell.
- Primary action: `Create Visit` / `Check in`.
- Secondary actions: `Cancel`, `Open Patient`, `Open Appointment` when applicable.

### Patient Context

Show a persistent Patient summary at the top or right rail:

- Patient name.
- MRN.
- Registration status.
- Active/inactive state.
- Age/date of birth and gender.
- Phone.
- Emirates ID or fallback identification category.
- VIP, Medical Tourist, SMS Consent when present.
- Preferred payment method.

Safety states:

- Provisional Patient: block Visit creation and show `Complete Patient Registration`.
- Inactive Patient: block Visit creation and show `Reactivate Patient` only if the user has permission.
- Existing active Visit: block and show existing Visit Number, Doctor, Queue Token, and status.

### Appointment Context

When the route has `bookingNumber` or `appointmentId`, resolve and show an Appointment context panel before the form:

- Booking Number.
- Appointment status.
- Patient.
- Doctor.
- Slot date.
- Slot time(s).
- Appointment type.
- Appointment mode.
- Appointment reason.
- Rota.
- Remarks.

If the Appointment is valid for check-in:

- Pre-fill Patient and Doctor.
- Disable changing Patient and Doctor by default.
- Allow `Change to Walk-in` only as an explicit mode switch that clears Appointment context.

If Appointment lookup fails:

- Show exact API error string.
- Keep the Booking Number field editable.

If Appointment is not eligible:

- Not today: block and show scheduled date/time.
- Already checked in or completed: block and link to Visit or Appointment.
- Cancelled/no-show: block with status.
- Provisional Patient: block until registration is completed or reconciled.

### Visit Details

Fields for the current API:

- Visit type, required.
- Doctor, required for Walk-in and read-only for Appointment-backed Visit.
- Patient, required for Walk-in and read-only for Appointment-backed Visit.
- Purpose of visit / chief complaint, optional, max 500.
- Remarks, optional.

Fields to consider after domain/API expansion:

- Department.
- Information Source.
- Referral Source.
- Admit Source.
- Visit Mode.
- Patient Type.
- Visit Class.

Do not add these as UI-only fields until the backend has a place to validate and store them.

### Card / Payment Panel

P0 version:

- Show Patient preferred payment method.
- Allow editing preferred payment method if the Patient is otherwise editable.
- Show an informational line when the Patient is insurance/corporate/self-pay but coverage capture is not yet modeled.

P1 version after domain approval:

- Coverage classification: Cash, Insurance, Self-funded, Corporate.
- Visit card.
- Payer/Receiver.
- Policy number.
- Policy holder.
- Membership ID.
- Coverage start and end dates.
- Card scan/document attachment.
- Coverage eligibility status.

Important domain decision:

- Decide whether card data belongs to Patient, Visit, Invoice, or a new coverage model.
- Recommended shape: Patient-level saved coverage cards plus Visit-level coverage snapshot. The Visit snapshot protects historical billing context if the Patient card later changes.

### Documents

Reuse current Visit document upload behavior:

- Attach referral letter, old reports, insurance card scan, Emirates ID scan, or other intake documents.
- Show file name, size, remove action, and upload errors.
- Keep the max document count and file size aligned with existing Visit document validation.

### Last Visits / History

The reference app shows a last-five Visit list. Add a compact history panel:

- Last 5 Visits for this Patient.
- Visit Number.
- Date.
- Doctor.
- Visit Type.
- Status.
- Link to Visit detail.

This helps front desk avoid duplicate Visit creation and gives clinicians immediate continuity.

## Workflow

### Walk-in

1. Staff opens `/visits/new` or clicks `Check in`.
2. Search and select a Registered, active Patient.
3. Select Doctor.
4. Select Visit type.
5. Review Patient summary, payment/card panel, and recent Visit history.
6. Add chief complaint, remarks, and documents if needed.
7. Submit.
8. System creates Visit, Visit Number, Queue Token, and checked-in status.
9. UI redirects to `/visits/{id}` or shows success with Queue Token and `Open Visit`.

### From Appointment

1. Staff opens from Appointment list, Appointment detail, or enters Booking Number.
2. UI resolves Appointment and shows Appointment context.
3. Patient and Doctor are prefilled from Appointment.
4. Staff selects Visit type and reviews card/payment/document details.
5. Submit.
6. System creates Visit and moves Appointment to the checked-in system status in the same transaction.
7. UI redirects to Visit detail or Today's Visits queue.

## Backend/API Dependencies

Already available:

- `POST /api/v1/visits` supports Appointment-backed and Walk-in Visit creation.
- Appointment lookup by Booking Number exists.
- Visit documents can be uploaded and attached during check-in.
- Validators enforce Registered active Patient, active Doctor, eligible Appointment, and duplicate Visit conflicts.

Needed for richer UI:

- Patient detail query already exists; use it for the Patient context rail.
- Patient recent Visits query can be satisfied by existing `GET /api/v1/visits?patientId=...&limit=5`, but ordering should be checked because day views currently sort by queue token when a date is provided.
- Appointment detail query already exists; use it when `appointmentId` is known.
- If Department/Visit Mode/Patient Type/Referral/Admit Source are required, add backend schema fields, repositories, validators, OpenAPI docs, and tests in the same change.
- If card/coverage data is required, create a proper domain model first. Do not hide it inside Visit remarks.

## Data Model Decisions To Make

1. Is `Department` a Facility-scoped Master, free text, or derived from Doctor?
2. Is `Visit Mode` a Tenant Master, fixed set, or derived from Appointment mode?
3. Is `Patient Type` the same as Patient Registration Status, payment classification, or a separate operational category?
4. Does `Admit Source` apply only to Admissions, or also to outpatient Visits?
5. Should `Information Source` and `Referral Source` be Masters?
6. Should card/coverage data be:
   - Patient-level only,
   - Visit-level only,
   - Patient-level cards with Visit-level snapshot,
   - or deferred until insurance billing is in scope?

## Implementation Plan

### Phase 1: Advanced Create Visit Page

- Add route `app/(protected)/visits/new/page.tsx`.
- Add `loader.tsx` matching the page shape.
- Add route-local `_components/`:
  - `create-visit-page-impl.tsx`.
  - `patient-context-panel.tsx`.
  - `appointment-context-panel.tsx`.
  - `visit-details-form.tsx`.
  - `payment-card-panel.tsx`.
  - `recent-visits-panel.tsx`.
  - `documents-field.tsx` or reuse existing upload component.
- Add `_utils/create-visit-form-schema.ts`.
- Reuse current `useCheckInVisit`, `useAppointmentLookupQuery`, `useAppointmentQuery`, `usePatientsQuery`, `useDoctorsQuery`, `useVisitTypesQuery`, and Visit document upload hooks.
- Keep form validation with `react-hook-form`, `zodResolver`, and `mode: 'onTouched'`.
- Map exact server errors back to visible alerts and field errors.

### Phase 2: Entry Points

- From `/visits`, change `Check in` to route to `/visits/new` or keep a small quick sheet that links to advanced create.
- From `/appointments`, add `Create Visit` on eligible Appointment rows.
- From Appointment detail sheet, add `Create Visit` when status/date is eligible.
- From Patient detail, add `Create Visit` when Patient is Registered, active, and has no active Visit.

### Phase 3: Appointment Context Polish

- Support query params:
  - `bookingNumber`.
  - `appointmentId`.
  - `patientId`.
- Show appointment eligibility state before submit.
- If Appointment patient is provisional, provide a direct `Complete Registration` action.
- If Appointment already has a Visit, show that Visit instead of allowing a duplicate.

### Phase 4: Card/Coverage Domain

- Run a separate domain design pass for coverage/card information.
- Update `CONTEXT.md` with canonical terms before implementation.
- Add ADR if insurance/corporate card capture enters scope.
- Add backend module/tests/OpenAPI first, then wire the UI.

## Acceptance Criteria

- Staff can create a Walk-in Visit from one page.
- Staff can create a Visit from an Appointment and see Appointment details while doing it.
- Patient summary is always visible enough to avoid wrong-patient check-in.
- Provisional, inactive, and already-in-visit Patients are blocked before submit.
- Ineligible Appointments are blocked before submit.
- Visit type is required; Patient and Doctor are required only for Walk-in.
- Documents can be attached during Visit creation.
- Successful creation shows Visit Number and Queue Token.
- The page works in light and dark themes.
- The page has loading, empty, and error states.
- The route has a matching `loader.tsx`.

## Recommended First Build

Do Phase 1 through Phase 3 without adding new backend fields. That gives the front desk a much stronger Create Visit UI immediately while staying inside existing Visit rules. Treat full card/coverage capture as Phase 4 because it changes the billing/insurance domain, not just the screen.
