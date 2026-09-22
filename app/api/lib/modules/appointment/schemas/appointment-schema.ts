import { z } from 'zod';

import { createPatientSchema } from '../../patient/schemas/patient-schema';
import type { PatientRegistrationStatus } from '../../patient/schemas/patient-schema';
import type { AppointmentStatusCategory } from '../../appointment-status/schemas/appointment-status-schema';
import type {
  TreatmentSessionSummary,
  TreatmentSummary,
} from '../../treatment/schemas/treatment-schema';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
export const bookingPathValues = ['CONSULTATION', 'PROCEDURE'] as const;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const positiveIdSchema = (fieldName: string) =>
  z.coerce
    .number({ error: `${fieldName} is required` })
    .int(`${fieldName} must be an integer`)
    .positive(`${fieldName} must be positive`);

function toIsoDate(value: string) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);

  if (!match) {
    return undefined;
  }

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return `${yearText}-${monthText}-${dayText}`;
}

export function formatAppointmentDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}

const slotDateSchema = z
  .string({ error: 'Slot date is required' })
  .trim()
  .min(1, 'Slot date is required')
  .transform((value, context) => {
    const isoDate = toIsoDate(value);

    if (!isoDate) {
      context.addIssue({ code: 'custom', message: 'Slot date must be in DD-MM-YYYY format' });
      return z.NEVER;
    }

    return isoDate;
  });

const slotTimeSchema = z
  .string({ error: 'Slot time is required' })
  .trim()
  .regex(timePattern, 'Slot time must be in HH:mm format');

const appointmentTimeSchema = (fieldName: string) =>
  z
    .string({ error: `${fieldName} is required` })
    .trim()
    .regex(timePattern, `${fieldName} must be in HH:mm format`);

const patientShape = createPatientSchema.shape;

const provisionalPatientSchema = z
  .object({
    firstName: patientShape.firstName,
    middleName: patientShape.middleName,
    lastName: patientShape.lastName,
    gender: patientShape.gender.optional(),
    dateOfBirth: patientShape.dateOfBirth.optional(),
    bloodGroup: patientShape.bloodGroup,
    maritalStatus: patientShape.maritalStatus,
    phone: patientShape.phone,
    alternatePhone: patientShape.alternatePhone,
    email: patientShape.email,
    addressLine1: patientShape.addressLine1,
    addressLine2: patientShape.addressLine2,
    city: patientShape.city,
    stateId: patientShape.stateId,
    countryId: patientShape.countryId,
    postalCode: patientShape.postalCode,
    nationalityId: patientShape.nationalityId,
    languageId: patientShape.languageId,
    religionId: patientShape.religionId,
    // Emirates ID only — no identity documents. A booking is usually a phone
    // call, and nobody reads out a passport's issuing country and expiry date
    // down the phone. Documents belong at registration or check-in (ADR 0042).
    emiratesId: patientShape.emiratesId,
    emergencyContactName: patientShape.emergencyContactName,
    emergencyContactRelationship: patientShape.emergencyContactRelationship,
    emergencyContactPhone: patientShape.emergencyContactPhone,
  })
  .strict()
  .refine((data) => data.stateId === undefined || data.countryId !== undefined, {
    message: 'Patient country ID is required when state ID is provided',
    path: ['countryId'],
  });

const commonAppointmentShape = {
  patientId: positiveIdSchema('Patient ID').optional(),
  provisionalPatient: provisionalPatientSchema.optional(),
  slotDate: slotDateSchema,
  remarks: z
    .string()
    .trim()
    .max(1000, 'Remarks must be at most 1000 characters')
    .transform((remarks) => (remarks === '' ? undefined : remarks))
    .optional(),
};

const createConsultationAppointmentSchema = z
  .object({
    ...commonAppointmentShape,
    bookingPath: z.literal('CONSULTATION'),
    doctorId: positiveIdSchema('Doctor ID'),
    appointmentModeId: positiveIdSchema('Appointment mode ID'),
    appointmentTypeId: positiveIdSchema('Appointment type ID'),
    appointmentReasonId: positiveIdSchema('Appointment reason ID'),
    doctorRotaId: positiveIdSchema('Doctor rota ID'),
    slotTimes: z
      .array(slotTimeSchema, { error: 'Slot times are required' })
      .min(1, 'At least one slot time is required')
      .refine((times) => new Set(times).size === times.length, 'Slot times must be unique'),
  })
  .strict();

const createProcedureAppointmentSchema = z
  .object({
    ...commonAppointmentShape,
    bookingPath: z.literal('PROCEDURE'),
    doctorId: positiveIdSchema('Doctor ID').optional(),
    startTime: appointmentTimeSchema('Start time'),
    endTime: appointmentTimeSchema('End time'),
    treatmentId: positiveIdSchema('Treatment ID'),
    treatmentSessionId: positiveIdSchema('Treatment session ID'),
    therapistId: positiveIdSchema('Therapist ID').optional(),
  })
  .strict();

const rescheduleConsultationAppointmentSchema = z
  .object({
    bookingPath: z.literal('CONSULTATION'),
    doctorId: positiveIdSchema('Doctor ID'),
    slotDate: slotDateSchema,
    doctorRotaId: positiveIdSchema('Doctor rota ID'),
    slotTimes: z
      .array(slotTimeSchema, { error: 'Slot times are required' })
      .min(1, 'At least one slot time is required')
      .refine((times) => new Set(times).size === times.length, 'Slot times must be unique'),
  })
  .strict();

const rescheduleProcedureAppointmentSchema = z
  .object({
    bookingPath: z.literal('PROCEDURE'),
    slotDate: slotDateSchema,
    startTime: appointmentTimeSchema('Start time'),
    endTime: appointmentTimeSchema('End time'),
  })
  .strict();

export const rescheduleAppointmentSchema = z
  .discriminatedUnion('bookingPath', [
    rescheduleConsultationAppointmentSchema,
    rescheduleProcedureAppointmentSchema,
  ])
  .superRefine((data, context) => {
    if (data.bookingPath === 'PROCEDURE' && data.endTime <= data.startTime) {
      context.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'End time must be after start time',
      });
    }
  });

export const cancelAppointmentSchema = z
  .object({
    appointmentCancelledReasonId: positiveIdSchema('Appointment cancelled reason ID'),
  })
  .strict();

export const createAppointmentSchema = z
  .discriminatedUnion('bookingPath', [
    createConsultationAppointmentSchema,
    createProcedureAppointmentSchema,
  ])
  .superRefine((data, context) => {
    if ((data.patientId === undefined) === (data.provisionalPatient === undefined)) {
      context.addIssue({
        code: 'custom',
        path: ['patientId'],
        message: 'Exactly one of patientId or provisionalPatient is required',
      });
    }

    if (data.bookingPath === 'PROCEDURE' && data.endTime <= data.startTime) {
      context.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'End time must be after start time',
      });
    }
  });

export const appointmentTenantIdSchema = tenantIdSchema;

export const bookingNumberSchema = z
  .string({ error: 'Booking Number is required' })
  .trim()
  .min(1, 'Booking Number cannot be empty')
  .max(20, 'Booking Number must be at most 20 characters');

export const listAppointmentsSchema = z.object({
  slotDate: slotDateSchema.optional(),
  doctorId: positiveIdSchema('Doctor ID').optional(),
  patientId: positiveIdSchema('Patient ID').optional(),
  appointmentStatusId: positiveIdSchema('Appointment status ID').optional(),
  query: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type ValidatedCancelAppointmentData = CancelAppointmentInput & {
  id: number;
  tenantId: string;
};
export type ValidatedRescheduleAppointmentData = RescheduleAppointmentInput & {
  id: number;
  tenantId: string;
  timeZone: string;
};
export type BookingPath = (typeof bookingPathValues)[number];
export type ListAppointmentsInput = z.infer<typeof listAppointmentsSchema>;
export type CreateAppointmentData = CreateAppointmentInput & { tenantId: string };
export type ValidatedCreateAppointmentData = CreateAppointmentData & { timeZone: string };
export type AppointmentListParams = ListAppointmentsInput & { tenantId: string };

export type AppointmentReferenceSummary = {
  id: number;
  name: string;
  code: string;
};

export type AppointmentPatientSummary = {
  id: number;
  mrn: string;
  phone: string;
  lastName: string;
  firstName: string;
  registrationStatus: PatientRegistrationStatus;
};

export type PotentialPatientMatch = AppointmentPatientSummary & {
  isActive: boolean;
};

export type Appointment = {
  id: number;
  cancelledAt: Date | null;
  remarks: string | null;
  rotaName: string | null;
  doctorRotaId: number | null;
  tenantId: string;
  slotDate: string;
  startTime: string | null;
  endTime: string | null;
  bookingPath: BookingPath;
  bookingNumber: string;
  createdOn: Date;
  doctor: {
    id: number;
    name: string;
  } | null;
  therapist?: {
    id: number;
    name: string;
  } | null;
  patient: AppointmentPatientSummary;
  appointmentMode: AppointmentReferenceSummary | null;
  appointmentType: AppointmentReferenceSummary | null;
  appointmentReason: AppointmentReferenceSummary | null;
  appointmentCancelledReason: AppointmentReferenceSummary | null;
  appointmentStatus: AppointmentReferenceSummary & {
    category: Lowercase<AppointmentStatusCategory>;
  };
  treatment: TreatmentSummary | null;
  treatmentSession: TreatmentSessionSummary | null;
  slots: Array<{
    status: 'Booked';
    slotTime: string;
  }>;
};

export const appointmentIdSchema = z.coerce
  .number({ error: 'Appointment ID is required' })
  .int('Appointment ID must be an integer')
  .positive('Appointment ID must be positive');
