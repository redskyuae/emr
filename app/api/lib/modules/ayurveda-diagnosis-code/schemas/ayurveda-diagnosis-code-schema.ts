import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const ayurvedaDiagnosisCodeCodeSchema = z
  .string({ error: 'Ayurveda diagnosis code is required' })
  .trim()
  .min(1, 'Ayurveda diagnosis code cannot be empty')
  .max(20, 'Ayurveda diagnosis code must be at most 20 characters')
  .transform((code) => code.toUpperCase());

const ayurvedaDiagnosisCodeTitleSchema = z
  .string({ error: 'Ayurveda diagnosis code title is required' })
  .trim()
  .min(1, 'Ayurveda diagnosis code title cannot be empty')
  .max(255, 'Ayurveda diagnosis code title must be at most 255 characters');

const ayurvedaDiagnosisCodeCategorySchema = z
  .string()
  .trim()
  .max(100, 'Ayurveda diagnosis code category must be at most 100 characters')
  .optional()
  .transform((category) => (category === '' ? undefined : category));

export const ayurvedaDiagnosisCodeIdSchema = z.coerce
  .number({ error: 'Ayurveda diagnosis code ID is required' })
  .int('Ayurveda diagnosis code ID must be an integer')
  .positive('Ayurveda diagnosis code ID must be positive');

export const ayurvedaDiagnosisCodeTenantIdSchema = tenantIdSchema;

export const createAyurvedaDiagnosisCodeSchema = z.object({
  code: ayurvedaDiagnosisCodeCodeSchema,
  title: ayurvedaDiagnosisCodeTitleSchema,
  category: ayurvedaDiagnosisCodeCategorySchema,
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
  title: string;
  tenantId: string;
  isActive: boolean;
  createdOn: Date;
  modifiedOn: Date;
  category: string | null;
};

export type AyurvedaDiagnosisCodeListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
  isActive?: boolean;
};
