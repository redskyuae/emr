# Booking Number Is a Tenant-Scoped Generated Sequence

Every Appointment receives a server-generated Booking Number from a monotonic sequence scoped to its Tenant, formatted as `APT-` followed by a zero-padded integer beginning at `1001` (for example, `APT-1001`). Clients never submit this identifier, and rescheduling does not change it.

Allocation uses a Tenant-keyed counter in the same database transaction as Appointment creation rather than `MAX + 1`, so concurrent bookings cannot collide. Booking Numbers remain unique across active, cancelled, and soft-deleted Appointments and are never reused; sequence gaps are acceptable. A date-bearing format was rejected because an immutable operational reference must not become misleading when an Appointment is rescheduled.
