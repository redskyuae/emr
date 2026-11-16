import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const ayurvedaDiagnosisCodeCodeSchema = z
  .string({ error: 'Ayurveda diagnosis code is required' })
  .trim()
  .min(1, { error: 'Ayurveda diagnosis code cannot be empty', abort: true })
  .max(20, { error: 'Ayurveda diagnosis code must be at most 20 characters', abort: true })
  .regex(
    /^[A-Za-z0-9.-]+$/,
    'Ayurveda diagnosis code must contain only letters, numbers, hyphens, and dots.'
  )
  .toUpperCase();

const ayurvedaDiagnosisNameSchema = z
  .string({ error: 'Ayurveda diagnosis name is required' })
  .trim()
  .min(1, 'Ayurveda diagnosis name cannot be empty')
  .max(255, 'Ayurveda diagnosis name must be at most 255 characters');

const optionalTextSchema = (label: string, max: number) =>
  z
    .union([z.string().trim().max(max, `${label} must be at most ${max} characters`), z.null()])
    .optional()
    .transform((value) => (value === null || value === '' ? undefined : value));

const icdDiagnosisCodeIdSchema = z
  .union([
    z
      .number({ error: 'ICD-10-CM diagnosis code ID must be a number' })
      .int('ICD-10-CM diagnosis code ID must be an integer')
      .positive('ICD-10-CM diagnosis code ID must be positive'),
    z.null(),
  ])
  .optional()
  .transform((value) => value ?? null);

export const ayurvedaDiagnosisCodeIdSchema = z.coerce
  .number({ error: 'Ayurveda diagnosis code ID is required' })
  .int('Ayurveda diagnosis code ID must be an integer')
  .positive('Ayurveda diagnosis code ID must be positive');

export const ayurvedaDiagnosisCodeTenantIdSchema = tenantIdSchema;

export const createAyurvedaDiagnosisCodeSchema = z.object({
  code: ayurvedaDiagnosisCodeCodeSchema,
  name: ayurvedaDiagnosisNameSchema,
  category: optionalTextSchema('Ayurveda diagnosis category', 100),
  englishName: optionalTextSchema('Ayurveda diagnosis English name', 255),
  icdDiagnosisCodeId: icdDiagnosisCodeIdSchema,
});

export const updateAyurvedaDiagnosisCodeSchema = createAyurvedaDiagnosisCodeSchema;

export type CreateAyurvedaDiagnosisCodeInput = z.infer<typeof createAyurvedaDiagnosisCodeSchema>;
export type UpdateAyurvedaDiagnosisCodeInput = z.infer<typeof updateAyurvedaDiagnosisCodeSchema>;
export type CreateAyurvedaDiagnosisCodeData = CreateAyurvedaDiagnosisCodeInput & {
  tenantId: string;
};
export type UpdateAyurvedaDiagnosisCodeData = UpdateAyurvedaDiagnosisCodeInput & {
  tenantId: string;
};

export type AyurvedaDiagnosisCode = {
  id: number;
  code: string;
  name: string;
  tenantId: string;
  createdOn: Date;
  modifiedOn: Date;
  category: string | null;
  englishName: string | null;
  // Joined; null when unmapped or when the mapped Diagnosis Code was deleted.
  icdDiagnosisCode: { id: number; code: string; title: string } | null;
};

export type AyurvedaDiagnosisCodeListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
