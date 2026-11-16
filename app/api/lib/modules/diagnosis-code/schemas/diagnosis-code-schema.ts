import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

// ICD-10-CM: a letter (U is reserved), a digit, a digit or A/B, then an optional
// dot and up to four more characters. UAE payers require ICD-10-CM on claims.
const ICD_10_CM_CODE_PATTERN = /^[A-TV-Z][0-9][0-9AB](\.[0-9A-TV-Z]{1,4})?$/;

const diagnosisCodeCodeSchema = z
  .string({ error: 'Diagnosis code is required' })
  .trim()
  .min(1, { error: 'Diagnosis code cannot be empty', abort: true })
  .max(10, { error: 'Diagnosis code must be at most 10 characters', abort: true })
  .toUpperCase()
  .regex(ICD_10_CM_CODE_PATTERN, 'Diagnosis code must be a valid ICD-10-CM code, e.g. M54.5.');

const diagnosisCodeTitleSchema = z
  .string({ error: 'Diagnosis code title is required' })
  .trim()
  .min(1, 'Diagnosis code title cannot be empty')
  .max(255, 'Diagnosis code title must be at most 255 characters');

const diagnosisCodeCategorySchema = z
  .string()
  .trim()
  .max(100, 'Diagnosis code category must be at most 100 characters')
  .optional()
  .transform((category) => (category === '' ? undefined : category));

export const diagnosisCodeIdSchema = z.coerce
  .number({ error: 'Diagnosis code ID is required' })
  .int('Diagnosis code ID must be an integer')
  .positive('Diagnosis code ID must be positive');

export const diagnosisCodeTenantIdSchema = tenantIdSchema;

export const createDiagnosisCodeSchema = z.object({
  code: diagnosisCodeCodeSchema,
  title: diagnosisCodeTitleSchema,
  category: diagnosisCodeCategorySchema,
});

export const updateDiagnosisCodeSchema = createDiagnosisCodeSchema;

export type DiagnosisCodeIdInput = z.infer<typeof diagnosisCodeIdSchema>;
export type DiagnosisCodeTenantIdInput = z.infer<typeof diagnosisCodeTenantIdSchema>;
export type CreateDiagnosisCodeInput = z.infer<typeof createDiagnosisCodeSchema>;
export type UpdateDiagnosisCodeInput = z.infer<typeof updateDiagnosisCodeSchema>;
export type CreateDiagnosisCodeData = CreateDiagnosisCodeInput & { tenantId: string };
export type UpdateDiagnosisCodeData = UpdateDiagnosisCodeInput & { tenantId: string };

export type DiagnosisCode = {
  id: number;
  code: string;
  title: string;
  tenantId: string;
  createdOn: Date;
  modifiedOn: Date;
  category: string | null;
};

export type DiagnosisCodeListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
