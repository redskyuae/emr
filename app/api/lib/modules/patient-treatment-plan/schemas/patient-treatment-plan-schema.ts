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
    })
    .strict(),
]);

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
  createdOn: z.date(),
  modifiedOn: z.date(),
});

export type PatientTreatmentPlanStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'STOPPED';
export type PatientTreatmentPlanSessionUnavailableReason = 'COMPLETED' | 'RESERVED';
export type PatientTreatmentPlanSessionReservedAppointment = {
  bookingNumber: string;
  slotDate: string;
  startTime: string | null;
  endTime: string | null;
};
export type AssignPatientTreatmentPlanInput = z.infer<typeof assignPatientTreatmentPlanSchema>;
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
