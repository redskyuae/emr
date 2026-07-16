# Visit Transitions Drive Appointment System Status

When a Visit is created from an Appointment, the Visit's lifecycle transitions move that Appointment's AppointmentStatus, in the same database transaction as the Visit write:

- Check-in → the Tenant's System AppointmentStatus in the `CHECKED_IN` category.
- Complete → the `COMPLETED` category.
- Cancel the Visit → back to the `SCHEDULED` category.

The status is always resolved by System category rather than by code, exactly as Appointment creation resolves `SCHEDULED` under ADR 0023, because Tenants may edit or delete the mutable code. A Walk-in Visit has no Appointment and skips this entirely.

This keeps the Appointment as the scheduling record and the Visit as the clinical event (ADR 0022) while ensuring the two never disagree about whether the Patient arrived. Requiring reception to move the Appointment separately after Check-in was rejected: the arrival is a single real-world act, and a second manual step is a second chance to leave a stale Scheduled Appointment behind.

Cancelling a Visit returns the Appointment to Scheduled so the front desk can simply check the Patient in again — a mis-scanned Patient at 9am must not cost the Appointment its slot. The Appointment itself is not cancelled: cancelling an Appointment, and marking it No Show, remain the Appointment module's operations, because they are scheduling decisions with their own reason codes rather than consequences of the Patient being in the building. Storing and restoring the Appointment's prior status was rejected as state the domain does not otherwise need; Scheduled is the only status a re-checkable Appointment can meaningfully hold.
