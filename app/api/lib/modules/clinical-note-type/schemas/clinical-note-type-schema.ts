import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const clinicalNoteTypeNameSchema = z
  .string({ error: 'Clinical note type name is required' })
  .trim()
  .min(1, 'Clinical note type name cannot be empty')
  .max(100, 'Clinical note type name must be at most 100 characters');

const clinicalNoteTypeCodeSchema = z
  .string({ error: 'Clinical note type code is required' })
  .trim()
  .min(1, 'Clinical note type code cannot be empty')
  .max(20, 'Clinical note type code must be at most 20 characters')
  .transform((code) => code.toUpperCase());

const clinicalNoteTypeDescriptionSchema = z
  .string()
  .trim()
  .optional()
  .transform((description) => (description === '' ? undefined : description));

export const clinicalNoteTypeIdSchema = z.coerce
  .number({ error: 'Clinical note type ID is required' })
  .int('Clinical note type ID must be an integer')
  .positive('Clinical note type ID must be positive');

export const clinicalNoteTypeTenantIdSchema = tenantIdSchema;

export const createClinicalNoteTypeSchema = z.object({
  name: clinicalNoteTypeNameSchema,
  code: clinicalNoteTypeCodeSchema,
  description: clinicalNoteTypeDescriptionSchema,
});

export const updateClinicalNoteTypeSchema = createClinicalNoteTypeSchema;

export type ClinicalNoteTypeIdInput = z.infer<typeof clinicalNoteTypeIdSchema>;
export type ClinicalNoteTypeTenantIdInput = z.infer<typeof clinicalNoteTypeTenantIdSchema>;
export type CreateClinicalNoteTypeInput = z.infer<typeof createClinicalNoteTypeSchema>;
export type UpdateClinicalNoteTypeInput = z.infer<typeof updateClinicalNoteTypeSchema>;
export type CreateClinicalNoteTypeData = CreateClinicalNoteTypeInput & { tenantId: string };
export type UpdateClinicalNoteTypeData = UpdateClinicalNoteTypeInput & { tenantId: string };

export type ClinicalNoteType = {
  id: number;
  code: string;
  name: string;
  tenantId: string;
  createdOn: Date;
  modifiedOn: Date;
  description: string | null;
};

export type ClinicalNoteTypeListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
