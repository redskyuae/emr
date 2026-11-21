import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const admitSourceNameSchema = z
  .string({ error: 'Admit source name is required' })
  .trim()
  .min(1, 'Admit source name cannot be empty')
  .max(100, 'Admit source name must be at most 100 characters')
  .regex(
    /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
    'Admit source name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
  );

const admitSourceCodeSchema = z
  .string({ error: 'Admit source code is required' })
  .trim()
  .min(1, 'Admit source code cannot be empty')
  .max(10, 'Admit source code must be at most 10 characters')
  .regex(
    /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
    'Admit source code must contain only letters, numbers, hyphens, and underscores.'
  )
  .transform((code) => code.toUpperCase());

const admitSourceDescriptionSchema = z
  .union([
    z.string().trim().max(500, 'Admit source description must be at most 500 characters'),
    z.null(),
  ])
  .transform((value) => {
    if (value === null) {
      return undefined;
    }

    return value === '' ? undefined : value;
  })
  .optional();

export const admitSourceIdSchema = z.coerce
  .number({ error: 'Admit source ID is required' })
  .int('Admit source ID must be an integer')
  .positive('Admit source ID must be positive');

export const admitSourceTenantIdSchema = tenantIdSchema;

export const createAdmitSourceSchema = z.object({
  name: admitSourceNameSchema,
  code: admitSourceCodeSchema,
  description: admitSourceDescriptionSchema,
});

export const updateAdmitSourceSchema = createAdmitSourceSchema;

export type CreateAdmitSourceInput = z.infer<typeof createAdmitSourceSchema>;
export type UpdateAdmitSourceInput = z.infer<typeof updateAdmitSourceSchema>;
export type CreateAdmitSourceData = CreateAdmitSourceInput & { tenantId: string };
export type UpdateAdmitSourceData = UpdateAdmitSourceInput & { tenantId: string };

export type AdmitSource = {
  id: number;
  name: string;
  code: string;
  createdOn: Date;
  tenantId: string;
  modifiedOn: Date;
  description: string | null;
};

export type AdmitSourceListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
