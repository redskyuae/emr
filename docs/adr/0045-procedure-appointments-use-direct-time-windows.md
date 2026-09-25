# Procedure Appointments Use Direct Time Windows

## Context

Appointment booking has two Booking Paths with different scheduling invariants.

A Consultation Appointment requires an active Doctor and derives availability from that Doctor's DoctorSchedule and DoctorRota. It reserves one or more consecutive DoctorSlots and records the AppointmentMode, AppointmentType, and AppointmentReason. The repository revalidates and reserves those DoctorSlots atomically.

The Procedure workflow instead begins with a Treatment and explicit Session, then assigns a direct date/time window, Room, and Therapist. A Doctor may be assigned, but neither the selected Doctor nor Therapist supplies the Procedure's schedule. Modelling Doctor `N/A` as a fake Doctor, DoctorRota, or Appointment master record would contaminate clinical and scheduling data with sentinel records.

## Decision

A Procedure Appointment records a direct Tenant-local date, start time, and end time. It does not select, validate, or reserve a DoctorRota or DoctorSlots, and it does not require AppointmentMode, AppointmentType, or AppointmentReason. A Procedure may optionally assign an active Doctor; choosing that Doctor is an assignment only and cannot filter, reset, or otherwise control the Procedure date/time.

The Book Appointment screen calculates a Procedure's end time from the selected Session duration, including setup and cleaning. Treatment, Treatment Session, Room, and Therapist are persisted on the Procedure Appointment; Treatment and Treatment Session are copied onto the Visit at Check-in. The Room must be operationally available. The Therapist must be active and, when the Treatment or Treatment Session supplies an effective Therapist Skill requirement, qualified for that skill. Rooms and Therapists allocated to active Procedure Appointments are hidden for overlapping time windows, and creation repeats the overlap check under transaction-scoped resource locks so concurrent requests cannot double-book them. A Patient also cannot hold overlapping active Appointments; this protects legacy Procedure rows whose earlier booking UI did not persist resource assignments. Adjacent windows are allowed.

A Therapist cannot be deactivated while assigned to a future Scheduled or Confirmed Procedure Appointment. Likewise, a Therapist Skill cannot be removed from that Therapist while a future Scheduled or Confirmed Procedure Appointment depends on it. Administrators must first cancel or reassign those Appointments.

Therapist Reassignment is a distinct Appointment operation rather than Appointment Rescheduling: it preserves the Procedure Appointment's Booking Number and scheduled period while validating the replacement Therapist's active status and required Therapist Skill.

Appointments without a Doctor cannot be checked in to a Visit. Staff must assign a Doctor before check-in because every Visit requires one.

Procedure Appointments created before Therapist persistence may retain a null Therapist because no trustworthy assignment can be reconstructed. New Procedure Appointments require a Therapist, and a future legacy Procedure must receive a real Therapist assignment before check-in; the migration never creates a placeholder Therapist.

The `bookingPath` discriminator is persisted on the Appointment. Existing Appointments default to Consultation during migration; their direct start/end fields may remain null because historical time is represented by Appointment Slot Reservations.

This decision narrows ADR 0025: its DoctorSlot derivation, validation, and reservation rules apply to Consultation Appointments, not to Procedure Appointments.

## Consequences

- Consultation retains its current DoctorSchedule, DoctorRota, DoctorSlot, and Appointment Details invariants.
- Procedure creation can store Doctor `N/A` as a nullable Doctor reference without creating placeholder domain records.
- Historical Procedure Appointments may retain a null Therapist, while new Procedure Appointments and check-in require a real Therapist assignment.
- Procedure Doctor assignment, Therapist assignment, and date/time selection remain independent.
- The shared Appointment API and read model contain path-specific nullable fields, guarded by database checks and the `bookingPath` discriminator.
- This iteration does not prevent overlapping Procedure bookings for a Doctor, Room, or Therapist; availability and conflict detection require a separate scheduling decision.
- A Doctorless Procedure must receive a real Doctor assignment before Visit check-in.

## Rejected Alternatives

- **Fake `N/A` Doctor, DoctorRota, or Appointment master records.** Sentinel records would look like genuine clinical or scheduling data, require special filtering throughout the system, and risk being selected outside the Procedure workflow.
- **A placeholder Therapist for migrated Procedure Appointments.** Historical rows do not contain a trustworthy Therapist assignment, so inventing one would create false clinical history; they remain unassigned until Staff choose a real Therapist.
- **A separate Procedure booking endpoint.** Both paths create the same Appointment aggregate and share Tenant, Patient, AppointmentStatus, Booking Number, list, lookup, and response behavior. A discriminated request keeps those invariants in one API while preserving path-specific validation.
- **Using the selected Doctor's rota for a Procedure.** That would incorrectly make an optional assignment control the Procedure schedule and would reintroduce the coupling this decision removes.
