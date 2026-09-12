# Procedure Booking with an Optional Doctor

**Date:** 2026-09-12
**Status:** Approved in chat; awaiting written-spec review

## Problem

The Book Appointment screen currently treats Consultation and Procedure as if both reserve DoctorSlots. That makes Doctor, Doctor Rota, AppointmentMode, AppointmentType, and AppointmentReason mandatory for a Procedure. The required Procedure workflow is different: staff select a Treatment, Session, date, time, Room, and Therapist, while the Doctor may be an active Doctor or `N/A`. A Procedure does not require a Doctor Rota or Appointment Details.

The existing `POST /api/v1/appointments` contract and Appointment database model require all Doctor scheduling and Appointment master fields. Hiding those controls only in the UI would require fake identifiers and would corrupt the domain model. The contract and persistence model must represent the two Booking Paths explicitly.

## Decision

`POST /api/v1/appointments` will accept a discriminated request keyed by the canonical `bookingPath` value:

- `CONSULTATION` retains the existing Doctor, Doctor Rota, AppointmentMode, AppointmentType, AppointmentReason, and consecutive DoctorSlot requirements.
- `PROCEDURE` accepts an optional active Doctor as an assignment only, requires no Doctor Rota or Appointment Details, and records a direct start/end time window that is independent of the Doctor.

Booking Path is persisted on the Appointment. `N/A` is a UI representation of a missing Doctor, not a fake Doctor record.

## Procedure Screen Workflow

1. Select an existing Registered Patient or enter the initial Appointment details for a new Provisional Patient.
2. Select the Procedure Booking Path.
3. Select a Treatment and an explicit Session.
4. Choose Doctor `N/A` or an active Doctor. `N/A` is selected by default. Active Doctor options come from the existing Doctors API. This assignment does not affect the Procedure schedule.
5. In the Procedure scheduling section, choose only the Appointment date and start time. Start times use the screen's temporary static scheduling options in 15-minute increments. The end time is calculated from the selected Session's Treatment, setup, and cleaning duration.
6. Select only the Room and Therapist from the existing temporary static dependencies.
7. Book the Appointment.

The Procedure screen does not render Doctor Rota, Appointment Mode, Appointment Type, or Appointment Reason. Selecting a real Doctor never loads, filters, or validates DoctorSchedules, DoctorRotas, or DoctorSlots for a Procedure. Procedure date and time remain independent of the selected Doctor; the schedule is based only on the selected Session and the temporary Room and Therapist workflow.

Room and Therapist remain required client-side selections. Their temporary identifiers are not sent to or persisted by the Appointment API until those resource APIs and reservation rules exist. Consequently, this iteration cannot enforce cross-user Room or Therapist booking conflicts.

## API Contract

The create request becomes a discriminated union with common Patient and remarks fields.

### Consultation request

```json
{
  "bookingPath": "CONSULTATION",
  "patientId": 42,
  "doctorId": 7,
  "appointmentModeId": 1,
  "appointmentTypeId": 2,
  "appointmentReasonId": 3,
  "slotDate": "20-09-2026",
  "doctorRotaId": 4,
  "slotTimes": ["09:00", "09:15"]
}
```

### Procedure request with Doctor N/A

```json
{
  "bookingPath": "PROCEDURE",
  "patientId": 42,
  "slotDate": "20-09-2026",
  "startTime": "10:00",
  "endTime": "11:15"
}
```

### Procedure request with a Doctor

```json
{
  "bookingPath": "PROCEDURE",
  "patientId": 42,
  "doctorId": 7,
  "slotDate": "20-09-2026",
  "startTime": "10:00",
  "endTime": "11:15"
}
```

For both paths, exactly one of `patientId` or `provisionalPatient` remains required. Procedure validation requires valid `HH:mm` times, `endTime` after `startTime`, and a future Tenant-local date/time. When `doctorId` is provided, it must identify an active Doctor in the active Tenant, but the Doctor is validated only as an optional assignment. Procedure creation does not read or reserve DoctorSchedules, DoctorRotas, or DoctorSlots.

The Appointment response adds `bookingPath`, `startTime`, and `endTime`. For Procedures, `doctor`, `appointmentMode`, `appointmentType`, `appointmentReason`, and `rotaName` may be `null`; `slots` is empty. Consumers display missing values as `N/A`.

## Persistence

The Appointment table gains:

- non-null `bookingPath`, defaulting existing rows to `CONSULTATION`;
- nullable `startTime` and `endTime` snapshots;
- nullable `doctorId`, `appointmentModeId`, `appointmentTypeId`, `appointmentReasonId`, and `rotaName`.

New Consultation records store their calculated start/end snapshot and continue creating Appointment Slot Reservations atomically. New Procedure records store the direct time window and create no Appointment Slot Reservations. Historical rows may retain null start/end values and continue deriving their visible times from existing Appointment Slot Reservations.

The existing DoctorSlot uniqueness constraint remains unchanged and continues protecting Consultation bookings. This iteration intentionally adds no Doctor, Room, or Therapist conflict constraint for Procedures. Procedure scheduling is independent of the selected Doctor, and resource selections are not yet persisted.

## Read and Downstream Behavior

Appointment repositories use nullable joins for optional Doctor and Appointment master references. Appointment list, detail, lookup, Patient Timeline, and booking confirmation surfaces render `N/A` rather than dereferencing missing references. They prefer persisted `startTime`/`endTime` and fall back to historical Appointment Slot Reservations when necessary.

Check-in must not crash when a Procedure Appointment has Doctor `N/A`. Until the Check-in workflow explicitly supports assigning a Doctor to such an Appointment, validation returns a clear conflict stating that a Doctor must be assigned before creating the Visit. Adding or changing the Check-in assignment workflow is outside this change.

## Error Handling

- Invalid or inactive optional Doctor: conflict with the existing Doctor validation language.
- Missing/invalid Procedure date or time: validation error.
- Procedure time in the past: validation error using the Tenant time zone.
- Consultation DoctorSlot invalid/unavailable/past: existing behavior and conflict responses remain unchanged.
- Provisional Patient match/reconciliation behavior remains unchanged for both Booking Paths.

## Documentation

Implementation updates:

- `CONTEXT.md` so Appointment no longer universally means a DoctorSlot reservation and Booking Path requirements are explicit;
- an ADR recording why Procedure Appointments use a direct time window and an optional Doctor;
- OpenAPI request/response schemas and examples for both Booking Paths, including validation and conflict examples.

## Testing

Backend tests cover:

- schema acceptance/rejection for both discriminated request shapes;
- Procedure time validation and optional Doctor validation;
- validators skipping Doctor Rota and Appointment master lookups for Procedures;
- Consultation validation and slot conflict behavior remaining unchanged;
- repository persistence/readback with Doctor N/A and with a real Doctor;
- tenant isolation and nullable joins;
- Check-in returning a controlled conflict for Doctor N/A.

Frontend tests cover:

- Procedure form validation without Rota or Appointment Details;
- required Treatment, Session, date, time, Room, and Therapist;
- request transformation for Doctor N/A and a selected Doctor;
- calculated Procedure end time;
- Consultation request behavior remaining unchanged.

Final verification includes the unit suite, database-backed integration suite when `TEST_DATABASE_URL` is available, TypeScript, lint, production build, and an authenticated browser walkthrough without submitting a real Appointment.

## Out of Scope

- Persisting Treatment, Session, Room, or Therapist on the Appointment.
- Room or Therapist availability/conflict APIs.
- Loading, filtering, or validating Doctor Schedules, Doctor Rotas, or DoctorSlots for Procedures.
- Assigning a Doctor during Check-in or editing the Doctor after booking.
- Changing the Consultation workflow.
