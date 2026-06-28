# Doctor Is a First-Class Record in a Mandatory 1:1 With Staff

A Doctor is modelled as its own `doctor` table (clinical identity: `specialtyId`, `registrationNumber`, `qualifications`) but **cannot exist without an underlying Staff member**. Creating a Doctor always provisions the Staff in one transaction — auth `user` → `staff_profile` → `doctor` row → assignment of the seeded **Doctor** System Role — and email/password are therefore **required**, not optional. The `staff_profile` owns the person's identity (name, gender, date of birth); the `doctor` row owns only the clinical extension. This keeps a single source of truth for each kind of data and makes a Doctor appear, fully populated, in both the Staff (`/identity-access/users`) and Doctor surfaces without reconciliation or field duplication.

## Considered Options

We first weighed **(A)** a login-only Doctor (auth user, no Staff profile, Doctor and Staff kept as separate worlds) against **(B)** a Doctor that is a full Staff member. We chose **(B)**, then tightened it: rather than making the Staff *optional*, we made it **mandatory**. An optional Staff forced the `doctor` table to own person fields (for the no-login case) while `staff_profile` also held them (for the login case) — two sources of truth that drift. Mandating Staff removes that branch entirely: person fields live only on `staff_profile`, clinical fields live only on `doctor`. The cost we accepted is that "a Doctor who never logs in" (visiting/referring consultants) is **not** expressible today; if needed, it is a deliberate future change, not an accident of the schema.

We also chose a **hard conflict error** when the supplied email already belongs to a Staff member, rather than silently promoting that Staff to a Doctor. Promotion (and its inverse, demotion) is explicitly out of scope; Doctor creation is always net-new.

## Consequences

- **Coupled single active-state.** A Doctor and its Staff share one `isActive` lifecycle: deactivating either deactivates both in the same transaction; they are never out of sync. There is no way to deactivate the clinical-Doctor facet while leaving the Staff login active — that, too, would be a deliberate future feature (likely a scheduling/availability flag, not an identity concern). Like Staff, a Doctor supports **deactivate/reactivate only — no hard delete**.
- **Doctor management lives under `identity-access`.** The new `doctor` resource permissions (`doctor:read/create/update/deactivate/reactivate`) are grouped with Staff/Role/Session plumbing, because provisioning a Doctor provisions Staff.
- **The Doctor System Role is the first seeded Role in the app.** Provisioning previously seeded no Roles. The Doctor role is seeded per-Tenant, auto-assigned at Doctor creation (satisfying the rule that every Staff has at least one Role), editable but not deletable, and starts as a thin read-only reference-permission set that grows as clinical modules (Patient, Appointment, Visit) add permissions to the catalogue.
</content>
</invoke>
