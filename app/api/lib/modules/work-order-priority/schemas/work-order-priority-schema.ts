import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const workOrderPriorityNameSchema = z
  .string({ error: 'Work order priority name is required' })
  .trim()
  .min(1, 'Work order priority name cannot be empty')
  .max(100, 'Work order priority name must be at most 100 characters')
  .regex(
    /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
    'Work order priority name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
  );

const workOrderPriorityCodeSchema = z
  .string({ error: 'Work order priority code is required' })
  .trim()
  .min(1, 'Work order priority code cannot be empty')
  .max(10, 'Work order priority code must be at most 10 characters')
  .regex(
    /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
    'Work order priority code must contain only letters, numbers, hyphens, and underscores.'
  )
  .transform((code) => code.toUpperCase());

const workOrderPriorityColorSchema = z
  .string({ error: 'Work order priority color is required' })
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Work order priority color must be a hex value like #16A34A.');

const workOrderPriorityDescriptionSchema = z
  .string()
  .trim()
  .max(500, 'Work order priority description must be at most 500 characters')
  .transform((description) => (description === '' ? undefined : description))
  .optional();

export const workOrderPriorityIdSchema = z.coerce
  .number({ error: 'Work order priority ID is required' })
  .int('Work order priority ID must be an integer')
  .positive('Work order priority ID must be positive');

export const workOrderPriorityTenantIdSchema = tenantIdSchema;

export const createWorkOrderPrioritySchema = z.object({
  name: workOrderPriorityNameSchema,
  code: workOrderPriorityCodeSchema,
  color: workOrderPriorityColorSchema,
  description: workOrderPriorityDescriptionSchema,
});

export const updateWorkOrderPrioritySchema = createWorkOrderPrioritySchema;

export type WorkOrderPriorityIdInput = z.infer<typeof workOrderPriorityIdSchema>;
export type WorkOrderPriorityTenantIdInput = z.infer<typeof workOrderPriorityTenantIdSchema>;
export type CreateWorkOrderPriorityInput = z.infer<typeof createWorkOrderPrioritySchema>;
export type UpdateWorkOrderPriorityInput = z.infer<typeof updateWorkOrderPrioritySchema>;
export type CreateWorkOrderPriorityData = CreateWorkOrderPriorityInput & { tenantId: string };
export type UpdateWorkOrderPriorityData = UpdateWorkOrderPriorityInput & { tenantId: string };

export type WorkOrderPriority = {
  id: number;
  name: string;
  code: string;
  color: string;
  createdOn: Date;
  tenantId: string;
  modifiedOn: Date;
  description: string | null;
};

export type WorkOrderPriorityListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
