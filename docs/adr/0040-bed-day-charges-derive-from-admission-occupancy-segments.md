# Bed-Day Charges Derive From Admission Occupancy Segments

Bed-Day Charges are not typed in by a clerk; they are generated from the Admission's own occupancy history, the way Bahmni/Odoo derives bed charges from the ADT record. The `admission_bed_transfer` table is exactly that ADT history, which makes the derivation possible.

The generator runs only for an Invoice linked to a **discharged** Admission (an active Admission has no end date to bill against; interim billing is a future plan). It computes Occupancy Segments from the Admission timeline: `admittedAt` → each `admission_bed_transfer.transferredAt` (ordered) → `dischargedAt`. Each segment records the Bed occupied during that span.

Each segment bills `max(1, calendar-day count between segment start and end)` days at the segment Bed's Room → Room Type `dailyRate`, interpreted in the Tenant's configured Time Zone (ADR 0026; defaults to `Asia/Kolkata` for a Tenant that hasn't set one). The generator command resolves this from the Tenant record and passes it into the pure day-counting helper — the same resolution the Visit and Appointment modules already use for their own local-date logic. Consequences of the calendar-day rule, all deliberate and standard hospital practice:

- A same-day admit and discharge bills 1 day.
- For a multi-day stay, each calendar night is billed exactly once: the transfer instant is a shared segment boundary, so the departing segment's count runs up to it and the arriving segment's count starts from it, with no overlap (e.g. admit day 1 → transfer day 3 → discharge day 4 bills 2 nights to the departing Bed and 1 to the arriving Bed — 3 total, matching the 3 nights of the stay).
- **Same-day transfer is the one exception**: if a Patient is admitted, transferred, and discharged (or transferred more than once) within the same calendar day, `max(1, …)` floors _each_ of those zero-length segments up to 1 day, so that day is billed once per Bed the Patient touched — a bed is "used" on both sides of a same-day transfer even though no full day elapsed. This is the only case where the same calendar day appears on more than one Bed's line. Billing only the arriving bed in this case is more code for marginal fairness; revisit if users complain.

Generated Lines carry `source = 'BED_AUTO'` and no `chargeItemId`. Generation is **idempotent**: it deletes existing `BED_AUTO` lines on the Invoice and re-inserts, so regenerating after a correction never duplicates. Manual (`MANUAL`) lines are untouched.

A segment whose Bed has no Room link, or whose Room Type has no `dailyRate`, cannot be priced. Rather than fail the whole operation or invent a price, the generator **skips** that segment and returns it as a warning (`Bed ICU-01 has no daily rate configured; segment skipped.`) so the cashier can add a manual line. Billing never blocks or is blocked by the discharge itself — the two modules are read-coupled only.
