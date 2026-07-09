import { z } from 'zod';

import { VISIT_STATUS_CATEGORIES } from '../../visit-status/schemas/visit-status-schema';
import type { VisitStatusCategory } from '../../visit-status/schemas/visit-status-schema';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const optionalTrimmedValue = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }, schema.optional());

const requiredMasterIdSchema = (fieldName: string) =>
  z.coerce
    .number({ error: `Visit ${fieldName} is required` })
    .int(`Visit ${fieldName} must be an integer`)
    .positive(`Visit ${fieldName} must be positive`);

const optionalMasterIdSchema = (fieldName: string) =>
  z.preprocess((value) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    return value;
  }, requiredMasterIdSchema(fieldName).optional());

const chiefComplaintSchema = optionalTrimmedValue(
  z.string().trim().max(500, 'Visit chief complaint must be at most 500 characters')
);
const notesSchema = optionalTrimmedValue(
  z.string().trim().max(2000, 'Visit notes must be at most 2000 characters')
);

export const visitIdSchema = z.coerce
  .number({ error: 'Visit ID is required' })
  .int('Visit ID must be an integer')
  .positive('Visit ID must be positive');

export const visitTenantIdSchema = tenantIdSchema;

export const createVisitSchema = z.object({
  patientId: requiredMasterIdSchema('patient ID'),
  doctorId: optionalMasterIdSchema('doctor ID'),
  appointmentTypeId: requiredMasterIdSchema('appointment type ID'),
  appointmentReasonId: optionalMasterIdSchema('appointment reason ID'),
  chiefComplaint: chiefComplaintSchema,
  notes: notesSchema,
});

export const updateVisitSchema = z.object({
  doctorId: optionalMasterIdSchema('doctor ID'),
  appointmentTypeId: requiredMasterIdSchema('appointment type ID'),
  appointmentReasonId: optionalMasterIdSchema('appointment reason ID'),
  chiefComplaint: chiefComplaintSchema,
  notes: notesSchema,
});

export const startVisitSchema = z.object({
  statusId: optionalMasterIdSchema('status ID'),
});

export const completeVisitSchema = z.object({
  statusId: optionalMasterIdSchema('status ID'),
});

export const cancelVisitSchema = z.object({
  statusId: optionalMasterIdSchema('status ID'),
  cancelledReason: z
    .string({ error: 'Visit cancelled reason is required' })
    .trim()
    .min(1, 'Visit cancelled reason cannot be empty')
    .max(500, 'Visit cancelled reason must be at most 500 characters'),
});

export const visitListParamsSchema = z
  .object({
    page: z.coerce
      .number({ error: 'Page must be a number' })
      .int('Page must be an integer')
      .positive('Page must be positive')
      .optional(),
    limit: z.coerce
      .number({ error: 'Limit must be a number' })
      .int('Limit must be an integer')
      .positive('Limit must be positive')
      .max(999, 'Limit must be at most 999')
      .optional(),
    query: z
      .string({ error: 'Query must be a string' })
      .trim()
      .min(1, 'Query cannot be empty')
      .optional(),
    tenantId: tenantIdSchema,
    statusId: z.coerce
      .number({ error: 'Status ID must be a number' })
      .int('Status ID must be an integer')
      .positive('Status ID must be positive')
      .optional(),
    statusCategory: z
      .enum(VISIT_STATUS_CATEGORIES, { error: 'Visit status category is invalid' })
      .optional(),
    doctorId: z.coerce
      .number({ error: 'Doctor ID must be a number' })
      .int('Doctor ID must be an integer')
      .positive('Doctor ID must be positive')
      .optional(),
    patientId: z.coerce
      .number({ error: 'Patient ID must be a number' })
      .int('Patient ID must be an integer')
      .positive('Patient ID must be positive')
      .optional(),
    sortOrder: z.enum(['asc', 'desc'], { error: 'Visit sort order is invalid' }).optional(),
  })
  .strict();

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
export type StartVisitInput = z.infer<typeof startVisitSchema>;
export type CompleteVisitInput = z.infer<typeof completeVisitSchema>;
export type CancelVisitInput = z.infer<typeof cancelVisitSchema>;
export type VisitListParams = z.infer<typeof visitListParamsSchema>;

export type CreateVisitData = CreateVisitInput & { tenantId: string; statusId: number };
export type UpdateVisitData = UpdateVisitInput & { tenantId: string };

export type VisitPatientSummary = { id: number; name: string; mrn: string };
export type VisitDoctorSummary = { id: number; name: string };
export type VisitAppointmentTypeSummary = { id: number; name: string; code: string };
export type VisitAppointmentReasonSummary = { id: number; name: string; code: string };
export type VisitStatusSummary = {
  id: number;
  name: string;
  code: string;
  color: string;
  category: VisitStatusCategory;
};

export type Visit = {
  id: number;
  tenantId: string;
  visitNumber: string;
  patientId: number;
  patient: VisitPatientSummary;
  doctorId: number | null;
  doctor: VisitDoctorSummary | null;
  appointmentTypeId: number;
  appointmentType: VisitAppointmentTypeSummary;
  appointmentReasonId: number | null;
  appointmentReason: VisitAppointmentReasonSummary | null;
  statusId: number;
  status: VisitStatusSummary;
  chiefComplaint: string | null;
  notes: string | null;
  cancelledReason: string | null;
  startedOn: Date | null;
  completedOn: Date | null;
  cancelledOn: Date | null;
  createdOn: Date;
  modifiedOn: Date;
};
