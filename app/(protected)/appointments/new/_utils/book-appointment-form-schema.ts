import { z } from 'zod';

const patientModeValues = ['existing', 'provisional'] as const;
const patientGenderValues = ['male', 'female', 'other', 'unknown'] as const;
const visitTypeValues = ['CONSULTATION', 'PROCEDURE'] as const;
const readinessValues = ['READY', 'PENDING', 'NOT_REQUIRED', 'BLOCKED'] as const;

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

const optionalTrimmedString = (maxLength: number, message: string) =>
  z.string().trim().max(maxLength, message);

export const bookAppointmentFormSchema = z
  .object({
    patientId: z.string().trim(),
    lastName: z.string().trim(),
    firstName: z.string().trim(),
    middleName: optionalTrimmedString(100, 'Patient middle name must be at most 100 characters'),
    gender: z.enum(patientGenderValues).or(z.literal('')),
    dateOfBirth: z
      .string()
      .trim()
      .refine((value) => value === '' || isIsoDate(value), 'Date of birth must be a valid date'),
    phone: z.string().trim(),
    email: z
      .string()
      .trim()
      .refine((value) => value === '' || z.email().safeParse(value).success, {
        message: 'Patient email must be valid',
      }),
    patientMode: z.enum(patientModeValues),
    facilityId: z.string().trim(),
    visitType: z.enum(visitTypeValues).or(z.literal('')),
    doctorId: z.string().trim(),
    appointmentModeId: z.string().trim(),
    appointmentTypeId: z.string().trim(),
    appointmentReasonId: z.string().trim(),
    slotDate: z
      .string()
      .trim()
      .min(1, 'Slot date is required')
      .refine(isIsoDate, 'Slot date must be a valid date'),
    doctorRotaId: z.string().trim(),
    slotTimes: z.array(z.string()),
    treatmentId: z.string().trim(),
    sessionId: z.string().trim(),
    startTime: z.string().trim(),
    endTime: z.string().trim(),
    roomId: z.string().trim(),
    therapistId: z.string().trim(),
    consentStatus: z.enum(readinessValues),
    approvalStatus: z.enum(readinessValues),
    remarks: optionalTrimmedString(1000, 'Remarks must be at most 1000 characters'),
  })
  .superRefine((data, context) => {
    if (data.visitType === '') {
      context.addIssue({
        code: 'custom',
        path: ['visitType'],
        message: 'Visit Type is required',
      });
    }

    if (data.patientMode === 'existing' && data.patientId.trim() === '') {
      context.addIssue({
        code: 'custom',
        path: ['patientId'],
        message: 'Patient is required',
      });
    }

    if (data.patientMode === 'provisional') {
      if (data.firstName.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['firstName'],
          message: 'Patient first name is required',
        });
      }

      if (data.lastName.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['lastName'],
          message: 'Patient last name is required',
        });
      }

      if (data.phone.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['phone'],
          message: 'Patient phone is required',
        });
      }
    }

    if (data.doctorId.trim() === '') {
      context.addIssue({ code: 'custom', path: ['doctorId'], message: 'Doctor is required' });
    }

    if (data.startTime.trim() === '') {
      context.addIssue({ code: 'custom', path: ['startTime'], message: 'Start time is required' });
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

    if (data.visitType === 'CONSULTATION') {
      if (data.appointmentModeId.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['appointmentModeId'],
          message: 'Appointment Mode is required',
        });
      }

      if (data.appointmentTypeId.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['appointmentTypeId'],
          message: 'Appointment Type is required',
        });
      }

      if (data.appointmentReasonId.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['appointmentReasonId'],
          message: 'Appointment Reason is required',
        });
      }

      if (data.doctorId !== 'not-applicable' && data.doctorRotaId.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['doctorRotaId'],
          message: 'Doctor Rota is required',
        });
      }
    }

    if (data.visitType === 'PROCEDURE') {
      const requiredAyurvedaFields = [
        ['treatmentId', data.treatmentId, 'Treatment is required'],
        ['roomId', data.roomId, 'Room is required'],
        ['therapistId', data.therapistId, 'Therapist is required'],
      ] as const;

      for (const [path, value, message] of requiredAyurvedaFields) {
        if (value.trim() === '') {
          context.addIssue({ code: 'custom', path: [path], message });
        }
      }

      if (data.patientMode === 'existing' && data.sessionId.trim() === '') {
        context.addIssue({ code: 'custom', path: ['sessionId'], message: 'Session is required' });
      }

      if (data.consentStatus === 'BLOCKED' || data.approvalStatus === 'BLOCKED') {
        context.addIssue({
          code: 'custom',
          path: ['consentStatus'],
          message: 'Required consent or approval checks are blocked',
        });
      }
    }
  });

export type BookAppointmentFormValues = z.infer<typeof bookAppointmentFormSchema>;

export const EMPTY_BOOK_APPOINTMENT_FORM_VALUES: BookAppointmentFormValues = {
  patientId: '',
  lastName: '',
  firstName: '',
  middleName: '',
  gender: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  patientMode: 'existing',
  facilityId: '4',
  visitType: '',
  doctorId: '',
  appointmentModeId: '',
  appointmentTypeId: '',
  appointmentReasonId: '',
  slotDate: '',
  doctorRotaId: '',
  slotTimes: [],
  treatmentId: '',
  sessionId: '',
  startTime: '',
  endTime: '',
  roomId: '',
  therapistId: '',
  consentStatus: 'READY',
  approvalStatus: 'NOT_REQUIRED',
  remarks: '',
};
