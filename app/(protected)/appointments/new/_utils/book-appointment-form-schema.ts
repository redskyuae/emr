import { z } from 'zod';

import { PROCEDURE_SELECTION_MODE_VALUES } from './book-appointment-types';

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
    selectionMode: z.enum(PROCEDURE_SELECTION_MODE_VALUES).or(z.literal('')),
    patientTreatmentPlanId: z.string().trim(),
    patientTreatmentPlanSessionId: z.string().trim(),
    treatmentId: z.string().trim(),
    totalSessions: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^[1-9]\d*$/.test(value),
        'Total Sessions must be a positive whole number'
      ),
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
        message: 'Booking Path is required',
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

    if (data.visitType === 'CONSULTATION' && data.doctorId.trim() === '') {
      context.addIssue({ code: 'custom', path: ['doctorId'], message: 'Doctor is required' });
    }

    if (data.doctorId === 'not-applicable' && data.visitType === 'CONSULTATION') {
      context.addIssue({
        code: 'custom',
        path: ['doctorId'],
        message: 'A Doctor is required for a Consultation',
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

      if (data.doctorRotaId.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['doctorRotaId'],
          message: 'Doctor Rota is required',
        });
      }
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

    if (data.visitType === 'PROCEDURE') {
      if (data.patientMode !== 'existing') {
        context.addIssue({
          code: 'custom',
          path: ['patientId'],
          message: 'A registered Patient is required for a Procedure',
        });
      }

      if (data.selectionMode === '') {
        context.addIssue({
          code: 'custom',
          path: ['selectionMode'],
          message: 'Treatment selection is required',
        });
      } else if (data.selectionMode === 'EXISTING_PLAN') {
        if (data.patientTreatmentPlanId === '') {
          context.addIssue({
            code: 'custom',
            path: ['patientTreatmentPlanId'],
            message: 'Patient Treatment Plan is required',
          });
        }

        if (data.patientTreatmentPlanSessionId === '') {
          context.addIssue({
            code: 'custom',
            path: ['patientTreatmentPlanSessionId'],
            message: 'Patient Treatment Plan Session is required',
          });
        }

        if (data.treatmentId !== '' || data.totalSessions !== '') {
          context.addIssue({
            code: 'custom',
            path: ['treatmentId'],
            message: 'Catalogue Treatment must be empty for an existing Plan',
          });
        }
      } else {
        if (data.treatmentId === '') {
          context.addIssue({
            code: 'custom',
            path: ['treatmentId'],
            message: 'Treatment is required',
          });
        }

        if (data.patientTreatmentPlanId !== '' || data.patientTreatmentPlanSessionId !== '') {
          context.addIssue({
            code: 'custom',
            path: ['patientTreatmentPlanId'],
            message: 'Patient Treatment Plan must be empty for catalogue assignment',
          });
        }
      }

      if (!/^[1-9]\d*$/.test(data.roomId)) {
        context.addIssue({ code: 'custom', path: ['roomId'], message: 'Room is required' });
      }

      if (data.therapistId.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['therapistId'],
          message: 'Therapist is required',
        });
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
  selectionMode: '',
  patientTreatmentPlanId: '',
  patientTreatmentPlanSessionId: '',
  treatmentId: '',
  totalSessions: '',
  sessionId: '',
  startTime: '',
  endTime: '',
  roomId: '',
  therapistId: '',
  consentStatus: 'READY',
  approvalStatus: 'NOT_REQUIRED',
  remarks: '',
};
