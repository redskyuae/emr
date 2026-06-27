import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const workOrderPriorityNameSchema = z
  .string({ error: 'Work order priority name is required' })
  .trim()
  .min(1, 'Work order priority name cannot be empty')
  .max(100, 'Work order priority name must be at most 100 characters');

const workOrderPriorityCodeSchema = z
  .string({ error: 'Work order priority code is required' })
  .trim()
  .min(1, 'Work order priority code cannot be empty')
  .max(10, 'Work order priority code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

const workOrderPriorityColorSchema = z
  .string({ error: 'Work order priority color is required' })
  .trim()
  .regex(
    /^#[0-9A-Fa-f]{6}$/,
    'Work order priority color must be a hex value like #16A34A.'
  );

const workOrderPriorityDescriptionSchema = z
  .string()
  .trim()
  .optional()
  .transform((description) => (description === '' ? undefined : description));

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
  tenantId: string;
  name: string;
  code: string;
  color: string;
  description: string | null;
  createdOn: Date;
  modifiedOn: Date;
};

export type WorkOrderPriorityListParams = {
  tenantId: string;
  query?: string;
  page?: number;
  limit?: number;
};
