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

Added by #358 (`lib/analytics/events/server-lifecycle-events.ts`).

### Server outcome events: Tenant, access and configuration

Added by #358 (`lib/analytics/events/server-access-events.ts`).

### Workflow funnel events

Added by #359 (`lib/analytics/events/funnel-events.ts`).

### Usage and friction events

Added by #360 (`lib/analytics/events/usage-events.ts`).

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
