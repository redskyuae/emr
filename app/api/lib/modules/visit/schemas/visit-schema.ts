import { z } from 'zod';

import {
  visitDocumentMetadataSchema,
  type VisitDocumentMetadata,
} from '../../visit-document/schemas/visit-document-schema';

export const VISIT_STATUSES = ['CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'] as const;

// A Visit may be checked in with documents already attached (referrals, prior
// reports). Uploads happen first; only their Blob metadata rides the payload.
export const MAX_CHECK_IN_DOCUMENTS = 20;

export type VisitStatus = (typeof VISIT_STATUSES)[number];

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

export function formatVisitDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}

const visitDateSchema = z
  .string({ error: 'Visit date is required' })
  .trim()
  .min(1, 'Visit date is required')
  .transform((value, context) => {
    const isoDate = toIsoDate(value);

    if (!isoDate) {
      context.addIssue({ code: 'custom', message: 'Visit date must be in DD-MM-YYYY format' });
      return z.NEVER;
    }

    return isoDate;
  });

export const visitIdSchema = positiveIdSchema('Visit ID');
export const visitTenantIdSchema = tenantIdSchema;

const chiefComplaintSchema = z
  .string()
  .trim()
  .max(500, 'Chief complaint must be at most 500 characters')
  .optional()
  .nullable()
  .transform((value) => (value === null || value === '' ? undefined : value));

const remarksSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value === null || value === '' ? undefined : value));

// Check-in has two shapes: fulfil an Appointment, or a Walk-in that names the
// Patient and Doctor directly. Supplying both is ambiguous about which Doctor
// and Patient the Visit belongs to, so it is rejected rather than resolved.
export const checkInVisitSchema = z
  .object({
    appointmentId: positiveIdSchema('Appointment ID').optional(),
    patientId: positiveIdSchema('Patient ID').optional(),
    doctorId: positiveIdSchema('Doctor ID').optional(),
    visitTypeId: positiveIdSchema('Visit type ID'),
    chiefComplaint: chiefComplaintSchema,
    remarks: remarksSchema,
    documents: z
      .array(visitDocumentMetadataSchema)
      .max(MAX_CHECK_IN_DOCUMENTS, `At most ${MAX_CHECK_IN_DOCUMENTS} documents can be attached`)
      .optional(),
  })
  .superRefine((data, context) => {
    const hasAppointment = data.appointmentId !== undefined;
    const hasWalkIn = data.patientId !== undefined || data.doctorId !== undefined;

    if (hasAppointment && hasWalkIn) {
      context.addIssue({
        code: 'custom',
        message:
          'Provide either appointmentId for an Appointment check-in or patientId and doctorId for a Walk-in Visit, not both.',
      });
      return;
    }

    if (!hasAppointment) {
      if (data.patientId === undefined) {
        context.addIssue({ code: 'custom', message: 'Patient ID is required for a Walk-in Visit' });
      }

      if (data.doctorId === undefined) {
        context.addIssue({ code: 'custom', message: 'Doctor ID is required for a Walk-in Visit' });
      }
    }
  });

export const updateVisitSchema = z.object({
  chiefComplaint: chiefComplaintSchema,
  remarks: remarksSchema,
});

export const cancelVisitSchema = z.object({
  cancellationReason: z
    .string({ error: 'Cancellation reason is required' })
    .trim()
    .min(1, 'Cancellation reason cannot be empty')
    .max(255, 'Cancellation reason must be at most 255 characters'),
});

export const listVisitsSchema = z.object({
  visitDate: visitDateSchema.optional(),
  doctorId: positiveIdSchema('Doctor ID').optional(),
  patientId: positiveIdSchema('Patient ID').optional(),
  status: z.enum(VISIT_STATUSES, { error: 'Status is Invalid.' }).optional(),
  query: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type CheckInVisitInput = z.infer<typeof checkInVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
export type CancelVisitInput = z.infer<typeof cancelVisitSchema>;
export type ListVisitsInput = z.infer<typeof listVisitsSchema>;

export type ValidatedCheckInVisitData = {
  tenantId: string;
  patientId: number;
  doctorId: number;
  visitTypeId: number;
  appointmentId?: number;
  chiefComplaint?: string;
  remarks?: string;
  visitDate: string;
  documents?: VisitDocumentMetadata[];
};

export type VisitListParams = ListVisitsInput & { tenantId: string };

export type VisitPatientSummary = {
  id: number;
  mrn: string;
  phone: string;
  lastName: string;
  firstName: string;
};

export type VisitDoctorSummary = {
  id: number;
  name: string;
};

export type VisitTypeSummary = {
  id: number;
  name: string;
  code: string;
};

export type VisitAppointmentSummary = {
  id: number;
  bookingNumber: string;
};

export type Visit = {
  id: number;
  tenantId: string;
  visitNumber: string;
  status: VisitStatus;
  visitDate: string;
  queueToken: number;
  chiefComplaint: string | null;
  remarks: string | null;
  checkedInAt: Date;
  consultationStartedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdOn: Date;
  modifiedOn: Date;
  patient: VisitPatientSummary;
  doctor: VisitDoctorSummary;
  visitType: VisitTypeSummary;
  appointment: VisitAppointmentSummary | null;
};
