# Visit Number Is a Tenant-Scoped Generated Sequence

Every Visit receives a server-generated Visit Number from a monotonic sequence scoped to its Tenant, formatted as `VST-` followed by a zero-padded integer beginning at `1001` (for example, `VST-1001`). Clients never submit this identifier, and it does not change for the life of the Visit.

Allocation uses a Tenant-keyed counter incremented in the same database transaction as Visit creation rather than `MAX + 1`, so concurrent Check-ins at a busy front desk cannot collide. This mirrors ADR 0024 for Booking Number and ADR 0019 for Medical Record Number; the three sequences are independent, so a Visit Number never encodes its Appointment's Booking Number.

Visit Numbers remain unique across active, completed, cancelled, and soft-deleted Visits and are never reused; sequence gaps are acceptable. A date-bearing or per-day-resetting format was rejected because the Visit Number is a permanent operational reference — the Queue Token already carries the same-day, per-Doctor ordering that reception and Patients actually read out loud (ADR 0029).
