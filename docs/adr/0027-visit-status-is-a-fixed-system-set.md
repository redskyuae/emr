# Visit Status Is a Fixed System Set

Visit Status is a fixed system-defined set of four values — `CHECKED_IN`, `IN_CONSULTATION`, `COMPLETED`, `CANCELLED` — stored as a checked column on the Visit rather than as a Tenant-scoped Master. It follows Room Status, not AppointmentStatus.

The Visit lifecycle drives hard behavior: which transitions are legal, whether clinical records may still be captured, and which system AppointmentStatus the parent Appointment is moved to. Making those rules depend on Tenant-editable rows would mean every rule reads through a category indirection that exists only to let a Tenant rename four states they cannot otherwise change. AppointmentStatus needs that indirection because Tenants genuinely add their own scheduling states (for example a local "Confirmed by SMS"); no equivalent need exists for Visits, where the front desk and the consulting Doctor share one short workflow.

Modelling Visit Status as a Master with a system category, mirroring AppointmentStatus, was rejected as unjustified indirection today. Should a Tenant ever need custom Visit states, that pattern is the migration path: introduce the Master with a stable category and reduce this column to the category.

Allowed transitions are enforced in validators, and each transition is its own command:

- `CHECKED_IN → IN_CONSULTATION` — the Doctor starts the consultation.
- `IN_CONSULTATION → COMPLETED` — the consultation ends.
- `CHECKED_IN → CANCELLED` and `IN_CONSULTATION → CANCELLED` — the Patient left, or the Check-in was a mistake.

No other transition is legal. A Completed or Cancelled Visit is immutable except for soft delete, which remains an administrative correction distinct from cancellation — cancellation is a clinical outcome that stays visible in the Visit history, while deletion removes the Visit from operational views under ADR 0012.
