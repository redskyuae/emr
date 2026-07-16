import { z } from 'zod';

const ALLERGY_SEVERITIES = ['mild', 'moderate', 'severe'] as const;
const ALLERGY_STATUSES = ['active', 'inactive', 'resolved'] as const;

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

const optionalAllergenId = z.preprocess(
  (value) => (value === null || value === undefined || value === '' ? undefined : value),
  z.coerce
    .number({ error: 'Allergy allergen ID must be a number' })
    .int('Allergy allergen ID must be an integer')
    .positive('Allergy allergen ID must be positive')
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

const optionalDate = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}, z.string().refine(isValidDateOnly, 'Allergy noted-on date must be a valid date').optional());

const severitySchema = z.enum(ALLERGY_SEVERITIES, { error: 'Allergy severity is invalid' });
const statusSchema = z.enum(ALLERGY_STATUSES, { error: 'Allergy status is invalid' });

export const patientAllergyIdSchema = z.coerce
  .number({ error: 'Allergy ID is required' })
  .int('Allergy ID must be an integer')
  .positive('Allergy ID must be positive');

export const patientAllergyTenantIdSchema = tenantIdSchema;

export const patientAllergyPayloadSchema = z
  .object({
    allergenId: optionalAllergenId,
    substance: optionalTrimmed(150, 'Allergy substance'),
    reaction: optionalTrimmed(255, 'Allergy reaction'),
    severity: severitySchema,
    status: statusSchema.default('active'),
    notedOn: optionalDate,
    notes: optionalTrimmed(2000, 'Allergy notes'),
  })
  .refine((data) => data.allergenId !== undefined || data.substance !== undefined, {
    message: 'Allergy requires either an allergen or a free-text substance',
    path: ['substance'],
  });

export const createPatientAllergySchema = patientAllergyPayloadSchema;
export const updatePatientAllergySchema = patientAllergyPayloadSchema;

export type AllergySeverity = (typeof ALLERGY_SEVERITIES)[number];
export type AllergyStatus = (typeof ALLERGY_STATUSES)[number];
export type PatientAllergyIdInput = z.infer<typeof patientAllergyIdSchema>;
export type CreatePatientAllergyInput = z.infer<typeof createPatientAllergySchema>;
export type UpdatePatientAllergyInput = z.infer<typeof updatePatientAllergySchema>;
export type CreatePatientAllergyData = CreatePatientAllergyInput & {
  tenantId: string;
  patientId: number;
  recordedByUserId: string;
};
export type UpdatePatientAllergyData = UpdatePatientAllergyInput & { tenantId: string };

export type PatientAllergy = {
  id: number;
  tenantId: string;
  patientId: number;
  allergenId: number | null;
  substance: string | null;
  reaction: string | null;
  severity: AllergySeverity;
  status: AllergyStatus;
  notedOn: string | null;
  notes: string | null;
  recordedByUserId: string;
  createdOn: Date;
  modifiedOn: Date;
};

export type PatientAllergyListParams = {
  tenantId: string;
  patientId: number;
  page?: number;
  limit?: number;
};
