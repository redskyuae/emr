import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const diagnosisCodeCodeSchema = z
  .string({ error: 'Diagnosis code is required' })
  .trim()
  .min(1, 'Diagnosis code cannot be empty')
  .max(10, 'Diagnosis code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

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
