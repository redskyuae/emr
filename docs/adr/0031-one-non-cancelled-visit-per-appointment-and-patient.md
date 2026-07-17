# One Non-Cancelled Visit Per Appointment, One Active Visit Per Patient

Two uniqueness rules constrain Check-in, each enforced by a partial unique index and pre-checked by the Check-in validator so the common case returns a clean domain error rather than a constraint violation.

**An Appointment yields at most one non-cancelled Visit.** Checking the same Appointment in twice is a double-click or a second receptionist, not a second clinical event. Cancelled Visits are excluded from the index, so a mistaken Check-in can be cancelled and redone against the same Appointment — which is what makes the cancel-returns-Appointment-to-Scheduled rule in ADR 0030 usable.

**A Patient has at most one Active Visit.** A Patient cannot be in two consulting rooms at once, and a stale open Visit is how clinical records end up attached to the wrong encounter. Only `CHECKED_IN` and `IN_CONSULTATION` participate in the index, so completing or cancelling the open Visit frees the Patient immediately.

The validator's pre-check and the index are deliberately redundant: the validator gives the exact message the API contract promises, and the index is the backstop for the race between two concurrent Check-ins that both pass validation. Commands map the resulting `23505` on either index back to the same domain message, so a caller cannot tell the race apart from the ordinary conflict.

Relying on validator checks alone was rejected because the front desk is precisely where concurrent duplicate submissions happen. Relying on the indexes alone was rejected because a raw constraint name is not an API contract.

Check-in additionally requires a Registered Patient who is active, per the Patient glossary and ADR 0022: a Provisional Patient must complete registration or be reconciled before clinical care begins, and an Inactive Patient is not eligible for new clinical activity.
