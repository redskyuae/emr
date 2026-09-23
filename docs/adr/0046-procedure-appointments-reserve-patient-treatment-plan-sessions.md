# Procedure Appointments Reserve Patient Treatment Plan Sessions

## Context

A Treatment and its Treatment Sessions are reusable Tenant-scoped templates. They cannot represent which Treatment was prescribed to a particular Patient, that Patient's prescribed Session count, Session completion, or whether one of those Sessions is already booked. Persisting only generic Treatment references on a Procedure Appointment therefore cannot prioritise assigned Treatments or prevent the same Patient Session from being booked twice.

## Decision

A Patient Treatment Plan is the Patient-specific assignment of a Treatment. It owns Patient Treatment Plan Sessions and snapshots the applicable Treatment and Session-template details when assigned, so later master edits do not rewrite the Patient's prescription or history. Repeatable Treatments create a Patient-specific number of Sessions from one template; Sequenced Treatments copy their fixed ordered templates.

A new Procedure Appointment reserves one Patient Treatment Plan Session exclusively. Cancelling or marking the Appointment as No Show releases that reservation; rescheduling retains it. The Session becomes Completed only when its linked Visit is completed, and the Plan's Pending, In Progress, or Completed status is derived from Session completion. Stopped remains an explicit clinical transition.

The Procedure Appointment request distinguishes selecting an existing Patient Treatment Plan Session from assigning a catalogue Treatment and creating a Plan atomically. Appointment and Visit Treatment references remain available for reporting and backward compatibility, but the Patient Treatment Plan Session is authoritative for new Procedure bookings. Existing Procedure Appointments may retain a null Plan Session reference; the system does not manufacture historical Plan assignments from incomplete Appointment evidence.

## Consequences

- Patient-specific progress and scheduling reservations are separate from reusable Treatment masters.
- Concurrent booking is protected at the Patient Treatment Plan Session reservation boundary.
- Treatment and Session details on a Plan are historical snapshots rather than live projections of editable master data.
- Appointment cancellation and No Show release scheduling availability without completing or cancelling the Patient Treatment Plan Session.
- Legacy Procedure Appointments remain readable without being rewritten.

## Rejected Alternatives

- **Continue booking generic Treatment Sessions directly.** This cannot represent Patient-specific prescriptions or prevent duplicate booking of the same planned Session.
- **Derive assigned Treatments from Appointment or Visit history.** Historical use does not establish a current prescription, prescribed Session count, or remaining Sessions.
- **Let master edits update existing Plans.** This would rewrite clinical and scheduling history after assignment.
