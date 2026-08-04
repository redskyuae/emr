import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const specialtyNameSchema = z
  .string({ error: 'Specialty name is required' })
  .trim()
  .min(1, 'Specialty name cannot be empty')
  .max(100, 'Specialty name must be at most 100 characters')
  .regex(
    /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
    'Specialty name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
  );

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
    .regex(
      /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
      'Specialty code must contain only letters, numbers, hyphens, and underscores.'
    )
    .transform((code) => code.toUpperCase())
    .optional()
);

const specialtyDescriptionSchema = z
  .union([
    z.string().trim().max(500, 'Specialty description must be at most 500 characters'),
    z.null(),
  ])
  .transform((value) => {
    if (value === null) {
      return undefined;
    }

    return value === '' ? undefined : value;
  })
  .optional();

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
