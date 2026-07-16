import { z } from 'zod';

const MEDICATION_STATUSES = ['active', 'stopped', 'completed'] as const;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const optionalTrimmed = (max: number, label: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== 'string') {
        return value;
      }
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    },
    z.string().max(max, `${label} must be at most ${max} characters`).optional()
  );

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

const optionalDate = (label: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== 'string') {
        return value;
      }
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    },
    z.string().refine(isValidDateOnly, `${label} must be a valid date`).optional()
  );

const drugNameSchema = z
  .string({ error: 'Medication drug name is required' })
  .trim()
  .min(1, 'Medication drug name cannot be empty')
  .max(200, 'Medication drug name must be at most 200 characters');

const statusSchema = z.enum(MEDICATION_STATUSES, { error: 'Medication status is invalid' });

export const patientMedicationIdSchema = z.coerce
  .number({ error: 'Medication ID is required' })
  .int('Medication ID must be an integer')
  .positive('Medication ID must be positive');

export const patientMedicationTenantIdSchema = tenantIdSchema;

export const patientMedicationPayloadSchema = z
  .object({
    drugName: drugNameSchema,
    dose: optionalTrimmed(100, 'Medication dose'),
    route: optionalTrimmed(50, 'Medication route'),
    frequency: optionalTrimmed(100, 'Medication frequency'),
    status: statusSchema.default('active'),
    startDate: optionalDate('Medication start date'),
    endDate: optionalDate('Medication end date'),
    notes: optionalTrimmed(2000, 'Medication notes'),
  })
  .refine(
    (data) =>
      data.startDate === undefined || data.endDate === undefined || data.endDate >= data.startDate,
    {
      message: 'Medication end date must be on or after the start date',
      path: ['endDate'],
    }
  );

export const createPatientMedicationSchema = patientMedicationPayloadSchema;
export const updatePatientMedicationSchema = patientMedicationPayloadSchema;

export type MedicationStatus = (typeof MEDICATION_STATUSES)[number];
export type PatientMedicationIdInput = z.infer<typeof patientMedicationIdSchema>;
export type CreatePatientMedicationInput = z.infer<typeof createPatientMedicationSchema>;
export type UpdatePatientMedicationInput = z.infer<typeof updatePatientMedicationSchema>;
export type CreatePatientMedicationData = CreatePatientMedicationInput & {
  tenantId: string;
  patientId: number;
  recordedByUserId: string;
};
export type UpdatePatientMedicationData = UpdatePatientMedicationInput & { tenantId: string };

export type PatientMedication = {
  id: number;
  tenantId: string;
  patientId: number;
  drugName: string;
  dose: string | null;
  route: string | null;
  frequency: string | null;
  status: MedicationStatus;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  recordedByUserId: string;
  createdOn: Date;
  modifiedOn: Date;
};

export type PatientMedicationListParams = {
  tenantId: string;
  patientId: number;
  page?: number;
  limit?: number;
};
