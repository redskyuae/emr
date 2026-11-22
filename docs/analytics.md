# Product analytics

Staff activity in the EMR is recorded as **Analytics Events** in PostHog so the vendor's product
and customer-success team can see how the product is used. It is not reporting for hospitals and
not an audit trail. The decisions behind it are in
[ADR 0050](adr/0050-product-analytics-is-allow-listed-and-free-of-patient-data.md).

## The rules

Analytics is an **allow-list**. Allowed content is fixed system categories (Booking Path, Visit
Status, Payment Method), Master codes that classify workflow (AppointmentMode, VisitType,
AppointmentReason, AppointmentCancelledReason, Admit Source, AdmissionType, Clinical Note type,
Work Order type and priority), yes/no flags, counts and whole-number durations.

**Never send:**

- Anything that identifies a Patient or describes their care: names, Medical Record Number, phone,
  email, Emirates ID, Unified Identification Number, Identity Document details, date of birth,
  gender, address, Emergency Contact, Patient Photo, diagnoses or diagnosis codes, Clinical Note
  text, Vital Sign values, medication, allergy or problem details, Treatment names, chief
  complaint, remarks or document names.
- A record identifier: no Patient id and no id or number of an Appointment, Visit, Admission,
  Invoice or Payment (Booking Number, Visit Number, Admission Number, Invoice Number, Receipt
  Number). Not the id of another Staff member either, such as the Doctor on an Appointment.
- A money amount: no Invoice totals, prices, Discount values or Payment amounts. Allowed: that an
  Invoice was finalized, the Payment Method, the number of Invoice Lines, whether a Discount was
  applied.
- Anything a user typed: search terms, reasons, remarks, notes, and the text of error messages
  (they can repeat what was submitted). A search sends the term's length, a filter its name.
- Staff names, emails, phones, photos, gender, date of birth, staff codes or designations.

A signed-in user is identified by internal user id, Role codes and Tenant Owner or Admin status. A
Tenant is its id, name, slug and time zone.

Also:

- Page addresses are cleaned: every id segment (plain or percent-encoded) becomes `:id` and the
  query string is dropped. The referrer and first page address are not collected, because
  PostHog would store them raw in localStorage first.
- Session replay, autocapture, heatmaps, surveys, exception and performance capture are off.
- Before sign-in nothing is stored in the browser; signing out clears what PostHog stored.
- Analytics must never slow down, block or change an action. A PostHog outage is silent.

## Settings

| Variable              | Meaning                                                               |
| --------------------- | --------------------------------------------------------------------- |
| `ANALYTICS_ENABLED`   | `true` turns analytics on for the whole deployment. Off otherwise.    |
| `POSTHOG_PROJECT_KEY` | The PostHog project API key (`phc_...`). Analytics stays off without. |
| `POSTHOG_HOST`        | Ingestion host. Defaults to `https://eu.i.posthog.com` (EU Cloud).    |

They are read on the server (`lib/analytics/analytics-settings.ts`); the root layout passes the
browser what it needs as a prop of `AnalyticsProvider`. There are no `NEXT_PUBLIC_` variables and no
per-Tenant setting.

## How it works

```
browser                                   server
───────                                   ──────
captureAnalyticsEvent(name, props)         route handler success branch
  │ typed against the catalogue              │ (server outcome events)
  ▼                                          ▼
posthog-js ── before_send: guardCapture    posthog-node, after the response
  │  drops undeclared events/properties,
  │  cleans every address
  ▼
POST /relay/e/  ──▶ app/relay/[...path]/route.ts ──▶ eu.i.posthog.com
                   forwards an allow-list of headers:
                   never the Cookie, Referer or client address
```

| File                                             | Role                                                            |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `lib/analytics/catalogue.ts`                     | The typed catalogue; common, person and Tenant group properties |
| `lib/analytics/events/*.ts`                      | Event declarations, one file per area                           |
| `lib/analytics/event-spec.ts`                    | Property kinds and the value checks behind them                 |
| `lib/analytics/clean-address.ts`                 | Replaces id segments with `:id`, drops query strings            |
| `lib/analytics/capture-guard.ts`                 | PostHog's before-send hook                                      |
| `lib/analytics/analytics-client.ts`              | `captureAnalyticsEvent`, identify and reset in the browser      |
| `lib/analytics/relay.ts`, `app/relay/[...path]/` | Same-origin ingestion                                           |
| `components/analytics/analytics-provider.tsx`    | Starts PostHog and records page views                           |

Identity: `AppShellGate` identifies the browser once the Current User loads, and
`useSignOut(trigger)` (and the gate's expired-Session branch) records `signed_out` and resets.

## Properties

### On every event

| Property                   | Values                                                                |
| -------------------------- | --------------------------------------------------------------------- |
| `tenant_id`, `tenant_slug` | the Active Tenant (absent before sign-in)                             |
| `source`                   | `client` or `server`                                                  |
| `brand_variant`            | the configured `LOGIN_LOGO_VARIANT`                                   |
| `sidebar_mode`             | `appointments_only`, `appointments_and_visits` or `full`              |
| `route`                    | the cleaned page pattern, for example `/patients/:id` (client events) |
| `page_group`, `page_title` | the app shell's page metadata (client events inside the app shell)    |
| `is_impersonated`          | `true` for server events from an impersonated Session                 |

`sidebar_mode` matters because a module hidden from the sidebar cannot be "never used" in the same
sense as a visible one.

### Person and Tenant group

| What              | Sent                                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Person id         | Current User `user.id`                                                                                                       |
| Person properties | `role_codes`, `membership_role` (owner, admin or member), `is_tenant_admin`, `has_staff_profile`, `tenant_id`, `tenant_slug` |
| Group             | type `tenant`, key = Tenant id, properties `name`, `slug`, `time_zone`, `is_active`                                          |

## Events

### Page views, identity and sign-in (browser)

| Event                      | When                                | Properties                                                                                              |
| -------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `$pageview` / `$pageleave` | every page change (path, not query) | the common properties, `is_demo_page`                                                                   |
| `sign_in_failed`           | the sign-in request is rejected     | `status`, `failure_kind`: `invalid_credentials`, `no_active_tenant`, `multiple_active_tenants`, `other` |
| `signup_failed`            | the signup request is rejected      | `status`, `failure_kind`: `validation`, `conflict`, `other`                                             |
| `signed_out`               | just before identity is cleared     | `trigger`: `user`, `stale_tab`, `session_expired`, `tab_storage_unavailable`                            |

`tab_storage_unavailable` is the login or signup form ending the Session it just created because the
browser blocks tab storage (see the tab marker rules in `CLAUDE.md`).

### Server outcome events: Appointments, Visits, Patients, Admissions and Billing

Declared in `lib/analytics/events/server-lifecycle-events.ts` (#358). Each route records its event
from the success branch, once, through `recordLifecycleEvent`
(`app/api/lib/analytics/lifecycle-event-recorder.ts`), which builds the properties lazily inside a
guard so a failure to build them never changes the response. The properties come from the request
payload and the command result, through the pure builders in
`app/api/lib/analytics/lifecycle-*-properties.ts`. Where neither carries a value, the command
returns it beside `data` (`CommandResultWith`), never in the response.

- Durations are whole minutes or days elapsed, rounded down and never negative. Lead times are
  calendar days on the Tenant's clock. Only `minutes_vs_appointment_start` may be negative (early).
- Never sent: Patient details, record ids or numbers, other Staff ids (`has_doctor` instead), money
  amounts, typed text, or clinical catalogue codes and names. The Discharge Disposition, allergy
  severity, Patient flags and the Patient Identification Category are left out on purpose.

#### Appointments

| Event                     | Recorded by                          | Properties                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appointment_booked`      | `POST /appointments`                 | `booking_path` (`CONSULTATION`, `PROCEDURE`), `patient_kind` (`existing`, `provisional_new`), `appointment_mode_code`, `appointment_type_code`, `appointment_reason_code` (Consultation only), `slot_count` (Consultation only), `lead_time_days`, `is_same_day`, `procedure_source` (`existing_plan`, `catalogue_treatment`; Procedure only), `has_doctor`, `has_remarks` |
| `appointment_rescheduled` | `POST /appointments/{id}/reschedule` | `booking_path`, `doctor_changed`, `lead_time_days` (to the new date)                                                                                                                                                                                                                                                                                                       |
| `appointment_cancelled`   | `POST /appointments/{id}/cancel`     | `booking_path`, `cancelled_reason_code`, `lead_time_days`, `released_plan_session` (every Scheduled or Confirmed Procedure holds a plan session, so it is `true` for Procedures)                                                                                                                                                                                           |

#### Visits and clinical records

| Event                                             | Recorded by                                                                                      | Properties                                                                                                                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `visit_checked_in`                                | `POST /visits`                                                                                   | `check_in_mode` (`appointment`, `walk_in`), `visit_type_code`, `admit_source_code`, `has_doctor`, `has_treatment_session`, `document_count`, `minutes_vs_appointment_start` (Appointment Check-in) |
| `visit_consultation_started`                      | `POST /visits/{id}/start`                                                                        | `visit_type_code`, `minutes_since_check_in`                                                                                                                                                        |
| `visit_completed`                                 | `POST /visits/{id}/complete`                                                                     | `visit_type_code`, `minutes_since_check_in`, `minutes_in_consultation`                                                                                                                             |
| `visit_cancelled`                                 | `POST /visits/{id}/cancel`                                                                       | `from_status` (`CHECKED_IN`, `IN_CONSULTATION`), `minutes_since_check_in`                                                                                                                          |
| `visit_amended`                                   | `PUT /visits/{id}/amend`, `/diagnoses/amend`, `/notes/{noteId}/amend`, `/vitals/{vitalId}/amend` | `amended_part` (`visit`, `diagnoses`, `clinical_note`, `vital_sign`), `days_since_completed`                                                                                                       |
| `visit_diagnoses_saved`                           | `PUT /visits/{id}/diagnoses` (Active Visit)                                                      | `icd10_count`, `ayurveda_count`                                                                                                                                                                    |
| `visit_document_added` / `visit_document_removed` | `POST /visits/{id}/documents`, `DELETE /visits/{id}/documents/{documentId}`                      | `content_type` (one of the accepted document types; any other is dropped)                                                                                                                          |
| `clinical_note_created`                           | `POST /patients/{id}/notes`                                                                      | `note_type_code`, `context` (`visit`, `admission`, `patient`)                                                                                                                                      |
| `clinical_note_signed`                            | `POST /patients/{id}/notes/{noteId}/sign`                                                        | `note_type_code`, `minutes_since_created`                                                                                                                                                          |
| `vital_signs_recorded`                            | `POST /patients/{id}/vitals`                                                                     | `context`, `fields_recorded_count` (measurements taken; BMI is derived and not counted)                                                                                                            |
| `patient_chart_item_changed`                      | `POST /patients/{id}/allergies`, `/problems`, `/medications`; `PUT` and `DELETE` on each item    | `kind` (`allergy`, `problem`, `medication`), `action` (`created`, `updated`, `removed`)                                                                                                            |
| `treatment_plan_assigned`                         | `POST /patients/{id}/treatment-plans/assign`                                                     | `session_structure` (`REPEATABLE`, `SEQUENCED`), `session_count`                                                                                                                                   |
| `treatment_plan_sessions_added`                   | `POST /patients/{id}/treatment-plans`                                                            | `added_count`                                                                                                                                                                                      |
| `treatment_plan_session_started`                  | `POST /patients/{id}/treatment-plans/{planId}/sessions/{sessionId}/start`                        | `session_structure`                                                                                                                                                                                |

#### Patients

| Event                                         | Recorded by                                                                                                         | Properties                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `patient_registered`                          | `POST /patients` (`direct`); `PUT /patients/{id}` when it registers a Provisional Patient (`completed_provisional`) | `registration_path`, `has_emirates_id`, `is_medical_tourist`, `identity_document_count` |
| `patient_deactivated` / `patient_reactivated` | `PATCH /patients/{id}/deactivate`, `/reactivate`                                                                    | none                                                                                    |

#### Admissions

| Event                  | Recorded by                       | Properties                                                         |
| ---------------------- | --------------------------------- | ------------------------------------------------------------------ |
| `patient_admitted`     | `POST /admissions`                | `admission_type_code`, `from_visit`, `has_expected_discharge_date` |
| `bed_transferred`      | `POST /admissions/{id}/transfer`  | `same_ward`                                                        |
| `admission_discharged` | `POST /admissions/{id}/discharge` | `length_of_stay_days`, `has_discharge_summary`                     |
| `admission_cancelled`  | `POST /admissions/{id}/cancel`    | none                                                               |

#### Billing

| Event                   | Recorded by                       | Properties                                                                                                                                               |
| ----------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invoice_created`       | `POST /invoices`                  | `linked_to` (`visit`, `admission`, `none`)                                                                                                               |
| `invoice_finalized`     | `POST /invoices/{id}/finalize`    | `linked_to`, `line_count`, `manual_line_count`, `bed_auto_line_count`, `has_discount`, `resulting_status`, `minutes_since_created`                       |
| `invoice_voided`        | `POST /invoices/{id}/void`        | `from_status` (`DRAFT`, `FINALIZED`)                                                                                                                     |
| `invoice_deleted`       | `DELETE /invoices/{id}`           | none                                                                                                                                                     |
| `payment_recorded`      | `POST /invoices/{id}/payments`    | `payment_method`, `resulting_invoice_status`, `payment_sequence` (1 for the first Payment), `linked_to`, `minutes_since_visit_check_in` (Visit Invoices) |
| `bed_charges_generated` | `POST /invoices/{id}/bed-charges` | `line_count`                                                                                                                                             |

### Server outcome events: Tenant, access and configuration

Declared in `lib/analytics/events/server-access-events.ts` and recorded from the route handler's
success branch. Helpers for these events live in `app/api/lib/analytics/access-*.ts`.

| Event                                                                  | When                                                                                                     | Properties                                                                                                      |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `tenant_signed_up`                                                     | signup creates a Tenant (`POST /signup`)                                                                 | none; also sets the Tenant group                                                                                |
| `tenant_onboarded`                                                     | Tenant Onboarding completes (`POST /onboarding`); a repeated call on an onboarded Tenant records nothing | `minutes_since_signup`; also sets the Tenant group                                                              |
| `user_signed_in`                                                       | sign-in succeeds (`POST /signin`)                                                                        | `remember_me`; also sets the Tenant group                                                                       |
| `tenant_profile_updated` / `tenant_deactivated` / `tenant_reactivated` | a Tenant Owner changes the Tenant (`PUT /tenants/{id}`, `PATCH .../deactivate`, `.../reactivate`)        | none; attached to the changed Tenant, and the Tenant group is refreshed                                         |
| `staff_changed`                                                        | Staff, a Doctor or a Therapist is created, updated, deactivated or reactivated                           | `profile_kind`: `staff`, `doctor`, `therapist`; `action`: `created`, `updated`, `deactivated`, `reactivated`    |
| `role_changed`                                                         | a Role is created, updated or deleted                                                                    | `action`: `created`, `updated`, `deleted`; `is_system_role`                                                     |
| `role_permissions_changed`                                             | a Role's Permission Assignments are added, replaced or one is removed                                    | `permission_count`: the Role's Permission Assignments after the change                                          |
| `staff_roles_changed`                                                  | Role Assignments are added to a Staff member or one is removed                                           | `role_count`: the Staff member's Role Assignments after the change                                              |
| `sessions_revoked`                                                     | Sessions are revoked                                                                                     | `scope`: `single` (one own Session), `all` (all other own Sessions), `user` (an admin revokes a Staff member's) |
| `schedule_changed`                                                     | a DoctorSchedule or TherapistSchedule is created or updated                                              | `schedule_kind`: `doctor`, `therapist`; `action`: `created`, `updated`; `rota_count`; `span_days`               |
| `master_record_changed`                                                | a Master or Global Reference record is created, updated or deleted                                       | `master` (see below); `action`: `created`, `updated`, `deleted`; `charge_item_category` for `charge-item`       |
| `asset_changed`                                                        | an Asset is created, updated or deleted                                                                  | `action`: `created`, `updated`, `deleted`                                                                       |
| `work_order_created`                                                   | a Work Order is created                                                                                  | `work_order_type_code`, `work_order_priority_code`                                                              |

- The Tenant group is set with `name`, `slug`, `time_zone`, `is_active` and `created_at`.
- `span_days` counts the calendar days from the schedule's first to its last date, both included.
- `master` is the module name: `appointment-mode`, `appointment-type`, `appointment-status`,
  `appointment-reason`, `appointment-cancelled-reason`, `visit-type`, `admit-source`,
  `admission-type`, `ward`, `bed`, `room`, `room-type`, `specialty`, `therapist-skill`, `allergen`,
  `diagnosis-code`, `ayurveda-diagnosis-code`, `clinical-note-type`, `doctor-rota`, `treatment`,
  `charge-item`, `asset-category`, `asset-condition`, `asset-status`, `work-order-type`,
  `work-order-priority`, `work-order-status`, and the Global References `country`, `state`,
  `language`, `nationality` and `religion`. No record name or code is sent for any Master.
- Global Reference routes resolve no Session. The event is recorded only when the request carries
  a Session with an Active Tenant, read after the response; recording adds no authorization.
- `sessions_revoked` with scope `single` or `all` is recorded only when the Session has an Active
  Tenant.
- Some properties are read after the response is sent, because neither the payload nor the command
  result carries them: the counts after removing one Role or Permission Assignment, and the Work
  Order type and priority codes (the Work Order holds only their names). If that read fails, the
  removal records nothing and a Work Order is recorded without the missing code.

### Workflow funnel events

Recorded by the browser inside three workflows (`lib/analytics/events/funnel-events.ts`), so a
funnel can run from "started" to the outcome the server records (`appointment_booked`,
`visit_checked_in`, `visit_completed`, `payment_recorded`), which the browser never records again.
No event carries a record id, a Doctor or Therapist id, a name, an amount, typed text or an error
message.

**Started and abandoned.** `_started` is recorded when the screen opens (Reschedule: once the
Appointment has loaded and may be rescheduled). `_abandoned` is recorded at most once per screen
instance, when the screen unmounts or the page is hidden or closed after `_started` and before the
outcome succeeded; a page that is closing sends it by beacon. A successful submit never also
records an abandon, and React strict mode's development remount is not counted.
`seconds_since_started` runs from that screen instance's `_started` (`lib/analytics/use-workflow-analytics.ts`).

#### Book Appointment (`/appointments/new`) and Appointment Rescheduling

| Event                                | When                                                       | Properties                                                                                                                                                                                          |
| ------------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appointment_booking_started`        | the screen opens                                           | `prefilled_from_plan` (opened with `?add-sessions=`)                                                                                                                                                |
| `appointment_booking_patient_chosen` | a Patient is selected, or a Provisional Patient is entered | `patient_kind`: `existing`, `provisional_new`                                                                                                                                                       |
| `appointment_booking_path_selected`  | the Booking Path is chosen or changed                      | `booking_path`: `CONSULTATION`, `PROCEDURE`                                                                                                                                                         |
| `appointment_booking_step_completed` | the booking state first makes a section valid              | `step`: `patient`, `doctor`, `schedule`, `details` (Consultation), `treatment_session`, `procedure_schedule`, `resources` (Procedure); `booking_path` (absent for a Patient chosen before the path) |
| `appointment_booking_submitted`      | a valid booking is sent                                    | `booking_path`, `seconds_since_started`                                                                                                                                                             |
| `appointment_booking_rejected`       | the server rejects the booking                             | `booking_path`, `status`, `rejection_kind`: `duplicate_patient_match` (a 409 with Patient matches), `conflict`, `validation`, `forbidden`, `server_error`                                           |
| `appointment_booking_abandoned`      | the user leaves without a booking                          | `booking_path` (absent before one is chosen), `last_step` (the step most recently completed), `seconds_since_started`                                                                               |
| `appointment_reschedule_started`     | the Reschedule screen shows the Appointment                | `booking_path`                                                                                                                                                                                      |
| `appointment_reschedule_submitted`   | a valid reschedule is sent                                 | `booking_path`, `seconds_since_started`                                                                                                                                                             |
| `appointment_reschedule_abandoned`   | the user leaves without rescheduling                       | `booking_path`, `seconds_since_started`                                                                                                                                                             |

#### Check-in (`/visits/new`)

| Event                          | When                                                       | Properties                                                                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `check_in_started`             | the screen opens                                           | `check_in_mode`: `appointment`, `walk_in`; `prefilled_from_appointment` (opened with `?appointmentId=`)                                                                                |
| `check_in_patient_confirmed`   | the Patient is confirmed                                   | `check_in_mode`                                                                                                                                                                        |
| `check_in_blocked`             | the screen or the server stops this Patient or Appointment | `check_in_mode`, `block_kind`: `provisional_patient`, `inactive_patient`, `active_visit_exists`, `appointment_already_checked_in`, `appointment_not_today`, `appointment_not_eligible` |
| `check_in_submitted`           | the Check-in request is sent                               | `check_in_mode`, `creates_invoice`, `payment_timing`: `NOW`, `LATER` (only with an Invoice), `seconds_since_started`                                                                   |
| `check_in_payment_step_failed` | the Visit was checked in but a later billing step failed   | `failed_step`: `create_invoice`, `add_line`, `finalize`, `record_payment`; `status`                                                                                                    |
| `check_in_abandoned`           | the user leaves without checking in                        | `check_in_mode`, `last_section`: `patient`, `visit_details`, `billing`; `seconds_since_started`                                                                                        |

A Provisional Patient is recorded as blocked once per Patient selected, since Confirm Patient stays
disabled. The other kinds are read from the server's Check-in rejection; the message itself is not
sent.

#### Consultation (`/visits/[id]`)

| Event                             | When                                      | Properties                                                                                                                                          |
| --------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `consultation_step_viewed`        | the consultation step (`?step=`) is shown | `step`, `previous_step`: `subjective`, `objective`, `assessment`, `plan`, `review`; `seconds_on_previous_step`; `visit_status`; `is_ayurveda_brand` |
| `consultation_complete_opened`    | the complete-Visit dialog opens           | `outstanding_item_count`, `outstanding_kinds`: `unsaved_consultation`, `no_vital_signs`, `no_clinical_note`, `draft_clinical_notes`, `no_invoice`   |
| `consultation_complete_dismissed` | the dialog closes without completing      | `outstanding_item_count` (as when it opened)                                                                                                        |

### Usage and friction events

Declared in `lib/analytics/events/usage-events.ts`, recorded by the browser.

**Friction.** `action_rejected` and `data_load_failed` are recorded by the shared query client's
`MutationCache` and `QueryCache` (`components/providers/query-provider.tsx`), so no query hook
records them itself. `parseApiError` keeps the response address on `ApiError`, and
`lib/analytics/request-failure.ts` turns it into the cleaned route (every segment that is not a
lowercase word becomes `:id`), the status and the kind. A 401 (the Session expired: `signed_out`),
a cancelled request, an error that is not an API rejection, and the sign-in and signup hooks (their
`meta` is `SKIP_FAILURE_ANALYTICS`; `sign_in_failed` and `signup_failed` count them) are skipped.

| Event                    | When                                   | Properties                                                                                                                                               |
| ------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action_rejected`        | a mutation request fails               | `api_route` (e.g. `/api/v1/appointments/:id/reschedule`), `status`, `rejection_kind`                                                                     |
| `data_load_failed`       | a query fails, once, after its retries | `api_route`, `status`, `rejection_kind`                                                                                                                  |
| `form_validation_failed` | a submit is blocked by invalid fields  | `form`: `patient_registration`, `patient_edit`, `invoice_composer`; `invalid_field_count`; `invalid_fields` (top-level field names from the form schema) |

`rejection_kind` is `validation` (400, 422), `forbidden` (403), `not_found` (404), `conflict`
(409), `server_error` (5xx), `network` (the request never got an answer, or timed out, so no
`api_route` or `status`) or `other` (any other status). `unauthorized` (401) is declared but never
sent, because 401s are skipped. To record `form_validation_failed` for another form, pass
`formValidationFailure(form, errors)` (`lib/analytics/form-validation.ts`) from its invalid-submit
callback and add the form to the enum.

**Patient form** (`/patients/new`, `/patients/[id]/edit`; `patients/_components/use-patient-form-analytics.ts`).

| Event                    | When                                            | Properties                                                                         |
| ------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `patient_form_started`   | the form is shown                               | `mode`: `register`, `edit`, `complete_provisional` (edit of a Provisional Patient) |
| `patient_form_submitted` | a valid submit, before the save request         | `mode`, `has_emirates_id`, `seconds_since_started`                                 |
| `patient_form_abandoned` | the user leaves or closes the tab before a save | `mode`, `seconds_since_started`                                                    |

**Invoice composer** (`/billing?invoice=new`; `billing/_components/use-invoice-composer-analytics.ts`).

| Event                          | When                                            | Properties                                                                                                   |
| ------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `invoice_composer_started`     | the composer opens                              | `linked_to`: `visit`, `admission`, `none` (from the address)                                                 |
| `invoice_composer_submitted`   | Finalize/Post or Save Draft passes its checks   | `linked_to`, `line_count`, `tender_count`, `finalize_now`, `has_discount`, `seconds_since_started`           |
| `invoice_composer_step_failed` | one of the chained calls fails                  | `failed_step`: `create_invoice`, `add_line`, `update_draft`, `finalize`, `record_payment`; `status` (if any) |
| `invoice_composer_abandoned`   | the user leaves before every call has succeeded | `linked_to` (the encounter chosen then), `seconds_since_started`                                             |

**Feature usage.**

| Event                          | When                                                                                                       | Properties                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `list_searched`                | a list's applied (debounced) search term has its own results; a term in the opening address is not counted | `list`: `patients`, `previous_visits`, `users`, `assets`, `work_orders`, `appointments`; `query_length`; `has_results` |
| `list_filtered`                | a list filter is set to a value (clearing it is not counted)                                               | `list`; `filter`: `status`, `gender`, `doctor`, `therapist`, `date_range`, `type`, `role`, `category`                  |
| `surface_opened`               | a sheet or dialog whose state is in the URL opens                                                          | `surface` (see below); `mode`: `create`, `edit`, `view`, `delete`                                                      |
| `document_printed`             | a print button is used                                                                                     | `document`: `visit_summary`, `consolidated_report`, `payment_receipt`                                                  |
| `export_downloaded`            | an Appointment, Audit Events or User Audit export has downloaded                                           | `export`: `appointments`, `audit_events`, `user_audit_list`, `user_audit`; `format`: `excel`, `pdf`, `csv`             |
| `consolidated_report_opened`   | a Consolidated Patient Report is shown                                                                     | `period_days` (both ends counted)                                                                                      |
| `patient_detail_tab_viewed`    | a Patient page tab is shown, the first one included                                                        | `tab`: `overview`, `chart`, `timeline`                                                                                 |
| `patient_timeline_filtered`    | the Patient Timeline feed filter changes                                                                   | `feed`: `all`, `billing`, `records`, `encounters`                                                                      |
| `patient_timeline_more_loaded` | another page of Timeline Events has loaded                                                                 | `pages_loaded` (pages now on screen; 2 after the first load)                                                           |

Searches, filters, prints and exports are recorded in each list's container; the shared search
hook is `hooks/use-list-search-analytics.ts`. `surface_opened` is recorded by one listener in the
app shell (`components/analytics/surface-analytics.tsx`) from the map in
`lib/analytics/surfaces.ts`, which says, page by page, which URL parameter opens which surface:
`new` is `create` and a record id is the surface's existing-record mode (`edit` for most, `view` for
the Appointment detail sheet and the Payment receipt, `delete` for the Master delete dialogs). The
map is keyed by the cleaned page route because a name can mean different things on different pages
(`status` is a filter on most lists but the Asset Status sheet on its Master page). A new sheet or
dialog is one line in that map. Sheets and dialogs kept in component state are not recorded.

## Adding an event

1. Declare it in the right file under `lib/analytics/events/` (or add a file and spread it into
   `analyticsEvents` and `analyticsEventGroups` in `catalogue.ts`). Give it a `source` and a spec for
   each property: `prop.enum([...])`, `prop.code()`, `prop.count()`, `prop.boolean()`, ... Prefer the
   narrowest kind; `label` is only for fixed display text from app configuration.
2. Name it `snake_case`, object then past-tense verb (`appointment_booked`). Properties are
   `snake_case`; durations are whole numbers with the unit in the name (`minutes_since_check_in`).
3. Record it with `captureAnalyticsEvent(name, properties)` in the browser. Never call PostHog
   directly. Keep the call in a route-local hook or container, not a presentational component.
   A server outcome is recorded from the route handler's success branch, after the command
   succeeded, with
   `recordServerEvent(analyticsActorFromSession(tenantSession, request), name, properties)` from
   `app/api/lib/analytics/server-analytics.ts`. It sends after the response (`after`), swallows
   every failure and is a no-op when analytics is off. Commands stay free of analytics; when a
   property is not in the payload or the result, surface it on the command's internal result
   without changing the public response (see `userId` on `SigninResult`).
4. Check the value against the never-send list above. `bun run test` fails if a non-boolean
   property's name looks like Patient data, an id, money or text.
5. Add it to the tables in this file.

## PostHog project setup

Done once, outside the code, by whoever owns the PostHog account:

1. Create the project in the **EU** region.
2. In project settings, turn on **Discard client IP data**.
3. Leave session replay, surveys and heatmaps **disabled** at project level.
4. Use a separate project, or leave `ANALYTICS_ENABLED` off, for non-production deployments.
5. Group Analytics (paid add-on) is optional: every event also carries `tenant_id` and `tenant_slug`.
