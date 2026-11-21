import { z } from 'zod';

import {
  treatmentIdSchema,
  treatmentSessionStructureSchema,
} from '../../treatment/schemas/treatment-schema';

const positiveId = (label: string) =>
  z.coerce
    .number({ error: `${label} is required` })
    .int(`${label} must be an integer`)
    .positive(`${label} must be positive`);

export const patientTreatmentPlanIdSchema = positiveId('Patient Treatment Plan ID');
export const patientTreatmentPlanPatientIdSchema = positiveId('Patient ID');
export const patientTreatmentPlanSessionIdSchema = positiveId('Patient Treatment Plan Session ID');
export const patientTreatmentPlanTenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

// Session Structure is resolved from the Treatment by the assignment validator;
// callers cannot override a Sequenced Treatment's fixed count.
export const assignPatientTreatmentPlanSchema = z.discriminatedUnion('sessionStructure', [
  z
    .object({
      patientId: patientTreatmentPlanPatientIdSchema,
      treatmentId: treatmentIdSchema,
      sessionStructure: z.literal('REPEATABLE'),
      totalSessions: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      patientId: patientTreatmentPlanPatientIdSchema,
      treatmentId: treatmentIdSchema,
      sessionStructure: z.literal('SEQUENCED'),
      additionalSessions: z.number().int().min(0).max(100).optional(),
    })
    .strict(),
]);

export const addPatientTreatmentPlanSessionsSchema = z
  .object({
    patientTreatmentPlanId: patientTreatmentPlanIdSchema,
    sessions: z
      .number({ error: 'Sessions is required' })
      .int('Sessions must be an integer')
      .positive('Sessions must be positive')
      .max(100, 'Sessions must be at most 100'),
  })
  .strict();

export const assignPatientTreatmentPlanRequestSchema = z
  .object({
    treatmentId: treatmentIdSchema,
    totalSessions: z.number().int().positive().max(100).optional(),
    additionalSessions: z.number().int().min(0).max(100).optional(),
  })
  .strict();

const optionalPlanText = (label: string) =>
  z
    .string({ error: `${label} must be text` })
    .trim()
    .max(5000, `${label} must be at most 5000 characters`)
    .transform((value) => value || null)
    .nullable()
    .optional();

const optionalPlanMinutes = (label: string, min: number) =>
  z
    .number({ error: `${label} must be a number` })
    .int(`${label} must be an integer`)
    .min(min, `${label} must be at least ${min}`)
    .max(480, `${label} must be at most 480`)
    .nullable()
    .optional();

// Edits the Patient-specific snapshot only; the Treatment Session template is unchanged.
export const updatePatientTreatmentPlanSessionSchema = z
  .object({
    procedure: z
      .string({ error: 'Procedure must be text' })
      .trim()
      .min(1, 'Procedure cannot be empty')
      .max(5000, 'Procedure must be at most 5000 characters')
      .optional(),
    warning: optionalPlanText('Warning'),
    roomType: optionalPlanText('Room type'),
    equipment: optionalPlanText('Equipment'),
    preparation: optionalPlanText('Preparation'),
    setupMinutes: optionalPlanMinutes('Setup minutes', 0),
    therapistSkill: optionalPlanText('Therapist skill'),
    durationMinutes: optionalPlanMinutes('Duration minutes', 1),
    cleaningMinutes: optionalPlanMinutes('Cleaning minutes', 0),
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    error: 'At least one Session plan field is required',
  });

export const startPatientTreatmentPlanSessionSchema = z
  .object({ visitId: positiveId('Visit ID') })
  .strict();

export const patientTreatmentPlanSessionSchema = z.object({
  id: patientTreatmentPlanSessionIdSchema,
  tenantId: patientTreatmentPlanTenantIdSchema,
  patientTreatmentPlanId: patientTreatmentPlanIdSchema,
  treatmentSessionId: positiveId('Treatment Session ID').nullable(),
  sessionNumber: z.number().int().positive(),
  label: z.string().nullable(),
  procedure: z.string().nullable(),
  durationMinutes: z.number().int().positive().nullable(),
  setupMinutes: z.number().int().nonnegative().nullable(),
  cleaningMinutes: z.number().int().nonnegative().nullable(),
  preparation: z.string().nullable(),
  warning: z.string().nullable(),
  equipment: z.string().nullable(),
  roomType: z.string().nullable(),
  therapistSkill: z.string().nullable(),
  legacyConductionNote: z.string().nullable(),
  completionStatus: z.enum(['PENDING', 'COMPLETED']),
  completionSource: z.enum(['VISIT', 'LEGACY_IMPORT']).nullable(),
  completedVisitId: positiveId('Completed Visit ID').nullable(),
  completedAt: z.date().nullable(),
  startedVisitId: positiveId('Started Visit ID').nullable(),
  startedAt: z.date().nullable(),
  createdOn: z.date(),
  modifiedOn: z.date(),
});

export type PatientTreatmentPlanStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'STOPPED';
export type PatientTreatmentPlanSessionUnavailableReason = 'COMPLETED' | 'RESERVED' | 'IN_PROGRESS';
export type PatientTreatmentPlanSessionReservedAppointment = {
  bookingNumber: string;
  slotDate: string;
  startTime: string | null;
  endTime: string | null;
};
export type AssignPatientTreatmentPlanInput = z.infer<typeof assignPatientTreatmentPlanSchema>;
export type AssignPatientTreatmentPlanRequest = z.infer<
  typeof assignPatientTreatmentPlanRequestSchema
>;
export type AddPatientTreatmentPlanSessionsRequest = z.infer<
  typeof addPatientTreatmentPlanSessionsSchema
>;
export type AddPatientTreatmentPlanSessionsInput = AddPatientTreatmentPlanSessionsRequest & {
  patientId: number;
  tenantId: string;
};
export type UpdatePatientTreatmentPlanSessionRequest = z.input<
  typeof updatePatientTreatmentPlanSessionSchema
>;
export type StartPatientTreatmentPlanSessionRequest = z.input<
  typeof startPatientTreatmentPlanSessionSchema
>;
type PlanSessionTarget = {
  tenantId: string;
  patientId: number;
  patientTreatmentPlanId: number;
  patientTreatmentPlanSessionId: number;
};
export type UpdatePatientTreatmentPlanSessionInput = PlanSessionTarget & {
  plan: z.output<typeof updatePatientTreatmentPlanSessionSchema>;
};
export type StartPatientTreatmentPlanSessionInput = PlanSessionTarget & { visitId: number };
export type PatientTreatmentPlanSession = z.infer<typeof patientTreatmentPlanSessionSchema>;
export type PatientTreatmentPlanReadSession = PatientTreatmentPlanSession & {
  isReserved: boolean;
  isBookable: boolean;
  unavailableReason: PatientTreatmentPlanSessionUnavailableReason | null;
  reservedAppointment: PatientTreatmentPlanSessionReservedAppointment | null;
};
export type PatientTreatmentPlanRecord = {
  id: number;
  tenantId: string;
  patientId: number;
  treatmentId: number | null;
  treatmentName: string;
  treatmentCode: string;
  treatmentSourceIdentity: string | null;
  sessionStructure: z.infer<typeof treatmentSessionStructureSchema>;
  totalSessions: number;
  statusOverride: 'STOPPED' | null;
  legacySourceIdentity: string | null;
  legacySourceSystem: string | null;
  legacySourceKey: string | null;
  legacySourceContentHash: string | null;
  sourceImportBatchId: number | null;
  legacyVisitId: string | null;
  legacyVisitNumber: string | null;
  importBatchId: string | null;
  createdOn: Date;
  modifiedOn: Date;
};
export type PatientTreatmentPlan = PatientTreatmentPlanRecord & {
  status: PatientTreatmentPlanStatus;
  completedSessions: number;
  sessions: PatientTreatmentPlanReadSession[];
};
