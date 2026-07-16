import { z } from 'zod';

const PROBLEM_STATUSES = ['active', 'resolved', 'inactive'] as const;

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

const optionalDiagnosisCodeId = z.preprocess(
  (value) => (value === null || value === undefined || value === '' ? undefined : value),
  z.coerce
    .number({ error: 'Problem diagnosis code ID must be a number' })
    .int('Problem diagnosis code ID must be an integer')
    .positive('Problem diagnosis code ID must be positive')
    .optional()
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

const clinicalStatusSchema = z.enum(PROBLEM_STATUSES, {
  error: 'Problem clinical status is invalid',
});

export const patientProblemIdSchema = z.coerce
  .number({ error: 'Problem ID is required' })
  .int('Problem ID must be an integer')
  .positive('Problem ID must be positive');

export const patientProblemTenantIdSchema = tenantIdSchema;

export const patientProblemPayloadSchema = z
  .object({
    diagnosisCodeId: optionalDiagnosisCodeId,
    title: optionalTrimmed(255, 'Problem title'),
    clinicalStatus: clinicalStatusSchema.default('active'),
    onsetDate: optionalDate('Problem onset date'),
    resolvedDate: optionalDate('Problem resolved date'),
    notes: optionalTrimmed(2000, 'Problem notes'),
  })
  .refine((data) => data.diagnosisCodeId !== undefined || data.title !== undefined, {
    message: 'Problem requires either a diagnosis code or a free-text title',
    path: ['title'],
  })
  .refine((data) => data.resolvedDate === undefined || data.clinicalStatus === 'resolved', {
    message: 'Problem resolved date is only allowed when the problem is resolved',
    path: ['resolvedDate'],
  });

export const createPatientProblemSchema = patientProblemPayloadSchema;
export const updatePatientProblemSchema = patientProblemPayloadSchema;

export type ProblemClinicalStatus = (typeof PROBLEM_STATUSES)[number];
export type PatientProblemIdInput = z.infer<typeof patientProblemIdSchema>;
export type CreatePatientProblemInput = z.infer<typeof createPatientProblemSchema>;
export type UpdatePatientProblemInput = z.infer<typeof updatePatientProblemSchema>;
export type CreatePatientProblemData = {
  tenantId: string;
  patientId: number;
  recordedByUserId: string;
  diagnosisCodeId?: number;
  title: string;
  clinicalStatus: ProblemClinicalStatus;
  onsetDate?: string;
  resolvedDate?: string;
  notes?: string;
};
export type UpdatePatientProblemData = {
  tenantId: string;
  diagnosisCodeId?: number;
  title: string;
  clinicalStatus: ProblemClinicalStatus;
  onsetDate?: string;
  resolvedDate?: string;
  notes?: string;
};

export type PatientProblem = {
  id: number;
  tenantId: string;
  patientId: number;
  diagnosisCodeId: number | null;
  title: string;
  clinicalStatus: ProblemClinicalStatus;
  onsetDate: string | null;
  resolvedDate: string | null;
  notes: string | null;
  recordedByUserId: string;
  createdOn: Date;
  modifiedOn: Date;
};

export type PatientProblemListParams = {
  tenantId: string;
  patientId: number;
  page?: number;
  limit?: number;
};
