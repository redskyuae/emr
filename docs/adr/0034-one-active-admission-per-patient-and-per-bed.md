# One Active Admission per Patient and per Bed

Within a Tenant, a Patient has at most one Admission in the `ADMITTED` status, and a Bed hosts at most one Admission in the `ADMITTED` status. Both invariants are enforced twice: validators check them with repository reads to produce clean, exact error messages, and partial unique indexes on the `admission` table make them race-safe at the database level:

- `admission_active_patient_idx` — unique `(tenant_id, patient_id)` where `is_deleted = false and status = 'ADMITTED'`
- `admission_active_bed_idx` — unique `(tenant_id, bed_id)` where `is_deleted = false and status = 'ADMITTED'`

The per-bed index is the real source of truth for occupancy; the Bed's `OCCUPIED` status (ADR 0033) is a projection of it maintained in the same transaction. Commands map Postgres `23505` violations on these indexes to the same conflict messages the validators produce, so concurrent admits to the same bed or of the same patient degrade gracefully instead of leaking constraint names.

Discharging or cancelling an Admission frees both the Patient and the Bed for a new Admission. Soft-deleted Admissions never block either invariant.
