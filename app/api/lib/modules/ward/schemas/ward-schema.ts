import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const wardNameSchema = z
  .string({ error: 'Ward name is required' })
  .trim()
  .min(1, 'Ward name cannot be empty')
  .max(100, 'Ward name must be at most 100 characters');

const wardCodeSchema = z
  .string({ error: 'Ward code is required' })
  .trim()
  .min(1, 'Ward code cannot be empty')
  .max(10, 'Ward code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

const wardDescriptionSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((description) => {
    if (description === null || description === '') {
      return undefined;
    }

    return description;
  });

export const wardIdSchema = z.coerce
  .number({ error: 'Ward ID is required' })
  .int('Ward ID must be an integer')
  .positive('Ward ID must be positive');

export const wardTenantIdSchema = tenantIdSchema;

export const createWardSchema = z.object({
  name: wardNameSchema,
  code: wardCodeSchema,
  description: wardDescriptionSchema,
});

export const updateWardSchema = createWardSchema;

export type WardIdInput = z.infer<typeof wardIdSchema>;
export type WardTenantIdInput = z.infer<typeof wardTenantIdSchema>;
export type CreateWardInput = z.infer<typeof createWardSchema>;
export type UpdateWardInput = z.infer<typeof updateWardSchema>;
export type CreateWardData = CreateWardInput & { tenantId: string };
export type UpdateWardData = UpdateWardInput & { tenantId: string };

export type Ward = {
  id: number;
  name: string;
  code: string;
  createdOn: Date;
  tenantId: string;
  modifiedOn: Date;
  description: string | null;
};

export type WardListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
