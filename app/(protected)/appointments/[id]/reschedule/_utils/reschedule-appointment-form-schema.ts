import { z } from 'zod';

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

// Rescheduling deliberately keeps the same field shape used by the shared
// scheduling controls, but validates only schedule data. Booking-only Patient,
// Treatment, Session, Room, and Therapist fields are not resubmitted or required.
export const rescheduleAppointmentFormSchema = z
  .object({
    patientId: z.string(),
    lastName: z.string(),
    firstName: z.string(),
    middleName: z.string(),
    gender: z.enum(['male', 'female', 'other', 'unknown']).or(z.literal('')),
    dateOfBirth: z.string(),
    phone: z.string(),
    email: z.string(),
    patientMode: z.enum(['existing', 'provisional']),
    facilityId: z.string(),
    visitType: z.enum(['CONSULTATION', 'PROCEDURE']).or(z.literal('')),
    doctorId: z.string(),
    appointmentModeId: z.string(),
    appointmentTypeId: z.string(),
    appointmentReasonId: z.string(),
    slotDate: z.string(),
    doctorRotaId: z.string(),
    slotTimes: z.array(z.string()),
    selectionMode: z.enum(['EXISTING_PLAN', 'CATALOGUE']).or(z.literal('')),
    patientTreatmentPlanId: z.string(),
    patientTreatmentPlanSessionId: z.string(),
    treatmentId: z.string(),
    totalSessions: z.string(),
    sessionId: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    roomId: z.string(),
    therapistId: z.string(),
    consentStatus: z.enum(['READY', 'PENDING', 'NOT_REQUIRED', 'BLOCKED']),
    approvalStatus: z.enum(['READY', 'PENDING', 'NOT_REQUIRED', 'BLOCKED']),
    remarks: z.string(),
  })
  .superRefine((data, context) => {
    if (data.visitType === '') {
      context.addIssue({
        code: 'custom',
        path: ['visitType'],
        message: 'Booking Path is required',
      });
    }

    if (!isIsoDate(data.slotDate)) {
      context.addIssue({
        code: 'custom',
        path: ['slotDate'],
        message: 'Slot date must be a valid date',
      });
    }

    if (data.visitType === 'CONSULTATION') {
      if (data.doctorId.trim() === '' || data.doctorId === 'not-applicable') {
        context.addIssue({ code: 'custom', path: ['doctorId'], message: 'Doctor is required' });
      }

      if (data.doctorRotaId.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['doctorRotaId'],
          message: 'Doctor Rota is required',
        });
      }

      if (data.slotTimes.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['slotTimes'],
          message: 'At least one Doctor Slot is required',
        });
      }
    }

    if (data.visitType === 'PROCEDURE') {
      if (data.startTime.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['startTime'],
          message: 'Start time is required',
        });
      }

      if (data.endTime.trim() === '') {
        context.addIssue({ code: 'custom', path: ['endTime'], message: 'End time is required' });
      }

      if (data.startTime && data.endTime && data.endTime <= data.startTime) {
        context.addIssue({
          code: 'custom',
          path: ['endTime'],
          message: 'End time must be after start time',
        });
      }
    }
  });
