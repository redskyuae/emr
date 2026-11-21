// Properties of the Appointment lifecycle events. Built from the request payload and the
// Appointment the command returned; never the Patient, the Doctor or any typed text.

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { AnalyticsEventProperties } from '@/lib/analytics/catalogue';
import { leadTimeDays } from './lifecycle-durations';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `appointment_booked`, from the accepted booking payload and the created Appointment. */
export function appointmentBookedProperties(
  payload: unknown,
  appointment: Appointment,
  timeZone: string,
  now = new Date()
): AnalyticsEventProperties<'appointment_booked'> {
  const request = isRecord(payload) ? payload : {};
  const isConsultation = appointment.bookingPath === 'CONSULTATION';
  const leadTime = leadTimeDays(appointment.slotDate, timeZone, now);

  return {
    booking_path: appointment.bookingPath,
    patient_kind: request.provisionalPatient === undefined ? 'existing' : 'provisional_new',
    appointment_mode_code: appointment.appointmentMode?.code,
    appointment_type_code: appointment.appointmentType?.code,
    appointment_reason_code: appointment.appointmentReason?.code,
    slot_count: isConsultation ? appointment.slots.length : undefined,
    lead_time_days: leadTime,
    is_same_day: leadTime === 0,
    procedure_source: isConsultation
      ? undefined
      : request.patientTreatmentPlanSessionId === undefined
        ? 'catalogue_treatment'
        : 'existing_plan',
    has_doctor: appointment.doctor !== null,
    has_remarks: Boolean(appointment.remarks),
  };
}

/** `appointment_rescheduled`, with the lead time to the new slot date. */
export function appointmentRescheduledProperties(
  appointment: Appointment,
  doctorChanged: boolean,
  timeZone: string,
  now = new Date()
): AnalyticsEventProperties<'appointment_rescheduled'> {
  return {
    booking_path: appointment.bookingPath,
    doctor_changed: doctorChanged,
    lead_time_days: leadTimeDays(appointment.slotDate, timeZone, now),
  };
}

/**
 * `appointment_cancelled`. Every Scheduled or Confirmed Procedure holds a Patient Treatment Plan
 * Session reservation, and cancelling releases it, so `released_plan_session` follows the path.
 */
export function appointmentCancelledProperties(
  appointment: Appointment,
  timeZone: string,
  now = new Date()
): AnalyticsEventProperties<'appointment_cancelled'> {
  return {
    booking_path: appointment.bookingPath,
    cancelled_reason_code: appointment.appointmentCancelledReason?.code,
    lead_time_days: leadTimeDays(appointment.slotDate, timeZone, now),
    released_plan_session: appointment.bookingPath === 'PROCEDURE',
  };
}
