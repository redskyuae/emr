import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const specialtyNameSchema = z
  .string({ error: 'Specialty name is required' })
  .trim()
  .min(1, 'Specialty name cannot be empty')
  .max(100, 'Specialty name must be at most 100 characters');

const specialtyCodeSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value !== 'string') {
      return value;
    }

    const code = value.trim();
    return code === '' ? undefined : code;
  },
  z
    .string()
    .max(10, 'Specialty code must be at most 10 characters')
    .transform((code) => code.toUpperCase())
    .optional()
);

const specialtyDescriptionSchema = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const description = value.trim();
  return description === '' ? undefined : description;
}, z.string().optional());

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
