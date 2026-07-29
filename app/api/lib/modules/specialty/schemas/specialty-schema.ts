import { z } from 'zod';
import {
  nullableToOptionalSimpleMasterDescriptionSchema,
  optionalSimpleMasterCodeSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const specialtyNameSchema = simpleMasterNameSchema({
  max: 100,
  fieldName: 'Specialty name',
  maxMessage: 'Specialty name must be at most 100 characters',
  emptyMessage: 'Specialty name cannot be empty',
  requiredMessage: 'Specialty name is required',
});

const specialtyCodeSchema = optionalSimpleMasterCodeSchema({
  max: 10,
  fieldName: 'Specialty code',
  maxMessage: 'Specialty code must be at most 10 characters',
});

const specialtyDescriptionSchema = nullableToOptionalSimpleMasterDescriptionSchema({
  maxMessage: 'Specialty description must be at most 500 characters',
});

export const specialtyIdSchema = z.coerce
  .number({ error: 'Specialty ID is required' })
  .int('Specialty ID must be an integer')
  .positive('Specialty ID must be positive');

export const specialtyTenantIdSchema = tenantIdSchema;

export const createSpecialtySchema = z.object({
  name: specialtyNameSchema,
  code: specialtyCodeSchema,
  description: specialtyDescriptionSchema,
});

export const updateSpecialtySchema = createSpecialtySchema;

export type SpecialtyIdInput = z.infer<typeof specialtyIdSchema>;
export type SpecialtyTenantIdInput = z.infer<typeof specialtyTenantIdSchema>;
export type CreateSpecialtyInput = z.infer<typeof createSpecialtySchema>;
export type UpdateSpecialtyInput = z.infer<typeof updateSpecialtySchema>;
export type CreateSpecialtyData = CreateSpecialtyInput & { tenantId: string };
export type UpdateSpecialtyData = UpdateSpecialtyInput & { tenantId: string };

export type Specialty = {
  id: number;
  name: string;
  code: string | null;
  tenantId: string;
  createdOn: Date;
  modifiedOn: Date;
  description: string | null;
};

export type SpecialtyListParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: string;
};
