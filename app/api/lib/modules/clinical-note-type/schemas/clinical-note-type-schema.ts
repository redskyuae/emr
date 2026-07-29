import { z } from 'zod';
import {
  simpleMasterCodeSchema,
  simpleMasterDescriptionSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const clinicalNoteTypeNameSchema = simpleMasterNameSchema({
  max: 100,
  fieldName: 'Clinical note type name',
  maxMessage: 'Clinical note type name must be at most 100 characters',
  emptyMessage: 'Clinical note type name cannot be empty',
  requiredMessage: 'Clinical note type name is required',
});

const clinicalNoteTypeCodeSchema = simpleMasterCodeSchema({
  max: 20,
  fieldName: 'Clinical note type code',
  maxMessage: 'Clinical note type code must be at most 20 characters',
  emptyMessage: 'Clinical note type code cannot be empty',
  requiredMessage: 'Clinical note type code is required',
});

const clinicalNoteTypeDescriptionSchema = simpleMasterDescriptionSchema({
  maxMessage: 'Clinical note type description must be at most 500 characters',
});

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
