# Bed Status Is a Fixed System Set Managed by Admissions

Bed Status is a fixed system-defined set of four values — `AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE` — stored as a checked column on the Bed rather than as a Tenant-scoped Master. It follows Room Status and Visit Status (ADR 0027), not AppointmentStatus: the values drive hard behavior (which Beds are admittable, what the Bed Board renders), and no Tenant need exists for custom bed states.

`OCCUPIED` is system-managed. It is set and cleared exclusively by Admission lifecycle transactions — admit and transfer-in set it, discharge, cancel, and transfer-out clear it back to `AVAILABLE`. The Bed create/update API accepts only the other three values and rejects manual `OCCUPIED` writes, and an occupied Bed's status cannot be edited at all. This keeps the flag a pure projection of the Admission data: it can never disagree with which Admission is active on the Bed, because the two are written in the same transaction.

Beds in `AVAILABLE` or `RESERVED` status are valid admission and transfer targets — a reservation exists to be used by the incoming Patient. `OCCUPIED` and `MAINTENANCE` Beds are not admittable. Bed status changes never propagate to the Room containing the Bed; Room Status remains the manually managed registry it is today.
