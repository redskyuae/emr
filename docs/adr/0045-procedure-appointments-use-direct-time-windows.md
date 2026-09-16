# Procedure Appointments Use Direct Time Windows

## Context

Appointment booking has two Booking Paths with different scheduling invariants.

A Consultation Appointment requires an active Doctor and derives availability from that Doctor's DoctorSchedule and DoctorRota. It reserves one or more consecutive DoctorSlots and records the AppointmentMode, AppointmentType, and AppointmentReason. The repository revalidates and reserves those DoctorSlots atomically.

The Procedure workflow instead begins with a Treatment and explicit Session, then assigns a direct date/time window, Room, and Therapist. A Doctor may be assigned, but the selected Doctor does not supply the Procedure's schedule. Modelling Doctor `N/A` as a fake Doctor, DoctorRota, or Appointment master record would contaminate clinical and scheduling data with sentinel records.

## Decision

A Procedure Appointment records a direct Tenant-local date, start time, and end time. It does not select, validate, or reserve a DoctorRota or DoctorSlots, and it does not require AppointmentMode, AppointmentType, or AppointmentReason. A Procedure may optionally assign an active Doctor; choosing that Doctor is an assignment only and cannot filter, reset, or otherwise control the Procedure date/time.

The Book Appointment screen calculates a Procedure's end time from the selected Session duration, including setup and cleaning. Treatment and Treatment Session are persisted on the Procedure Appointment and copied onto the Visit at Check-in. Room and Therapist options remain temporary static booking dependencies until those resource APIs exist.

Appointments without a Doctor cannot be checked in to a Visit. Staff must assign a Doctor before check-in because every Visit requires one.

The `bookingPath` discriminator is persisted on the Appointment. Existing Appointments default to Consultation during migration; their direct start/end fields may remain null because historical time is represented by Appointment Slot Reservations.

This decision narrows ADR 0025: its DoctorSlot derivation, validation, and reservation rules apply to Consultation Appointments, not to Procedure Appointments.

## Consequences

- Consultation retains its current DoctorSchedule, DoctorRota, DoctorSlot, and Appointment Details invariants.
- Procedure creation can store Doctor `N/A` as a nullable Doctor reference without creating placeholder domain records.
- Procedure Doctor assignment, date/time selection, and temporary Room/Therapist selection remain independent.
- The shared Appointment API and read model contain path-specific nullable fields, guarded by database checks and the `bookingPath` discriminator.
- This iteration does not prevent overlapping Procedure bookings for a Doctor, Room, or Therapist because Room and Therapist are not yet persisted.
- A Doctorless Procedure must receive a real Doctor assignment before Visit check-in.

## Rejected Alternatives

- **Fake `N/A` Doctor, DoctorRota, or Appointment master records.** Sentinel records would look like genuine clinical or scheduling data, require special filtering throughout the system, and risk being selected outside the Procedure workflow.
- **A separate Procedure booking endpoint.** Both paths create the same Appointment aggregate and share Tenant, Patient, AppointmentStatus, Booking Number, list, lookup, and response behavior. A discriminated request keeps those invariants in one API while preserving path-specific validation.
- **Using the selected Doctor's rota for a Procedure.** That would incorrectly make an optional assignment control the Procedure schedule and would reintroduce the coupling this decision removes.
