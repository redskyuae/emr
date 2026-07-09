# Visit Number Is a Tenant-Scoped, System-Generated Sequence

A Visit needs a human-facing identifier that front-desk staff can quote on receipts and lab slips, the same operational need already solved for Patient MRN (ADR 0019) and Work Order code (ADR 0011). We decided the Visit Number follows the identical pattern: assigned by the server at Visit creation, never entered by staff, a monotonic sequence scoped to the Tenant, rendered as `VST-` followed by a zero-padded integer, first allocation `VST-1001`.

Generation reuses the counter mechanism from ADR 0011/0019: a dedicated `visit_number_counter` row keyed by Tenant, atomically inserted or incremented with `RETURNING` inside the same transaction as the Visit insert. Gaps are acceptable; strict contiguity is not required. Soft-deleted Visits retain their Visit Number and it is never reused, so uniqueness is backed by a full unique index on `(tenant_id, lower(visit_number))` including soft-deleted rows.

Like MRN, the Visit Number is scoped to the Tenant rather than a Facility, consistent with Facility not yet being a modeled entity (see the Facility glossary note in `CONTEXT.md`). This decision is effectively irreversible once Tenants have real Visits in operational use, for the same reason as ADR 0019: identifiers end up on printed material and staff communication outside the system.
