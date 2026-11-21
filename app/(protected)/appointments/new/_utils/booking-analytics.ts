// Pure helpers behind the Book Appointment funnel events. They read the booking state and return
// fixed kinds only; nothing returned here may carry a name, an id or typed text to analytics.

import type { BookingRejectionKind, BookingStep } from '@/lib/analytics/events/funnel-events';

import {
  BOOKING_PHONE_PATTERN,
  type BookAppointmentFormValues,
} from './book-appointment-form-schema';

type BookingProgressValues = Pick<
  BookAppointmentFormValues,
  | 'patientMode'
  | 'patientId'
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'visitType'
  | 'doctorId'
  | 'appointmentModeId'
  | 'appointmentTypeId'
  | 'appointmentReasonId'
  | 'slotDate'
  | 'doctorRotaId'
  | 'startTime'
  | 'endTime'
  | 'selectionMode'
  | 'patientTreatmentPlanId'
  | 'patientTreatmentPlanSessionId'
  | 'treatmentId'
  | 'roomId'
  | 'therapistId'
>;

/** The steps of each Booking Path in screen order; before a path is chosen only the Patient. */
const STEPS_BY_PATH: Record<BookAppointmentFormValues['visitType'], BookingStep[]> = {
  '': ['patient'],
  CONSULTATION: ['patient', 'doctor', 'schedule', 'details'],
  PROCEDURE: ['patient', 'treatment_session', 'procedure_schedule', 'resources'],
};

const POSITIVE_ID = /^[1-9]\d*$/;

function filled(value: string) {
  return value.trim() !== '';
}

function hasTimeWindow(values: BookingProgressValues) {
  return (
    filled(values.slotDate) &&
    filled(values.startTime) &&
    filled(values.endTime) &&
    values.endTime > values.startTime
  );
}

function isPatientComplete(values: BookingProgressValues) {
  if (values.patientMode === 'existing') return filled(values.patientId);

  return (
    filled(values.firstName) &&
    filled(values.lastName) &&
    BOOKING_PHONE_PATTERN.test(values.phone.replace(/\s+/g, ''))
  );
}

function isStepComplete(step: BookingStep, values: BookingProgressValues) {
  switch (step) {
    case 'patient':
      return isPatientComplete(values);
    case 'doctor':
      return filled(values.doctorId) && values.doctorId !== 'not-applicable';
    case 'schedule':
      return hasTimeWindow(values) && filled(values.doctorRotaId);
    case 'details':
      return (
        filled(values.appointmentModeId) &&
        filled(values.appointmentTypeId) &&
        filled(values.appointmentReasonId)
      );
    case 'treatment_session':
      return values.selectionMode === 'EXISTING_PLAN'
        ? filled(values.patientTreatmentPlanId) && filled(values.patientTreatmentPlanSessionId)
        : values.selectionMode === 'CATALOGUE' && filled(values.treatmentId);
    case 'procedure_schedule':
      return hasTimeWindow(values);
    case 'resources':
      return POSITIVE_ID.test(values.roomId) && POSITIVE_ID.test(values.therapistId);
  }
}

/** The steps the booking state currently completes, in screen order, for the chosen Booking Path. */
export function completedBookingSteps(values: BookingProgressValues): BookingStep[] {
  return STEPS_BY_PATH[values.visitType].filter((step) => isStepComplete(step, values));
}

/**
 * The Patient the booking is for. `key` changes when another Patient is chosen and is compared on
 * the screen only; analytics receives the `kind`.
 */
export function chosenBookingPatient(
  values: BookingProgressValues
): { key: string; kind: 'existing' | 'provisional_new' } | null {
  if (!isPatientComplete(values)) return null;

  return values.patientMode === 'existing'
    ? { key: `existing:${values.patientId}`, kind: 'existing' }
    : { key: 'provisional', kind: 'provisional_new' };
}

/** Why the server rejected a booking. A 409 that carries duplicate Patient matches is its own kind. */
export function bookingRejectionKind({
  status,
  hasPatientMatches,
}: {
  status: number | undefined;
  hasPatientMatches: boolean;
}): BookingRejectionKind {
  if (status === 409) return hasPatientMatches ? 'duplicate_patient_match' : 'conflict';
  if (status === 401 || status === 403) return 'forbidden';
  if (status !== undefined && status >= 400 && status < 500) return 'validation';

  return 'server_error';
}
