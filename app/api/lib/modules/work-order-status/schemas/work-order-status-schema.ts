import { z } from 'zod';

export const WORK_ORDER_STATUS_CATEGORIES = [
  'OPEN',
  'IN_PROGRESS',
  'SCHEDULED',
  'COMPLETED',
  'OVERDUE',
] as const;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const workOrderStatusNameSchema = z
  .string({ error: 'Work order status name is required' })
  .trim()
  .min(1, 'Work order status name cannot be empty')
  .max(100, 'Work order status name must be at most 100 characters');

const workOrderStatusCodeSchema = z
  .string({ error: 'Work order status code is required' })
  .trim()
  .min(1, 'Work order status code cannot be empty')
  .max(10, 'Work order status code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

const workOrderStatusCategorySchema = z.enum(WORK_ORDER_STATUS_CATEGORIES, {
  error:
    'Work order status category must be one of OPEN, IN_PROGRESS, SCHEDULED, COMPLETED, or OVERDUE.',
});

const workOrderStatusColorSchema = z
  .string({ error: 'Work order status color is required' })
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Work order status color must be a hex value like #16A34A.');

const workOrderStatusDescriptionSchema = z
  .string()
  .trim()
  .optional()
  .transform((description) => (description === '' ? undefined : description));

export const workOrderStatusIdSchema = z.coerce
  .number({ error: 'Work order status ID is required' })
  .int('Work order status ID must be an integer')
  .positive('Work order status ID must be positive');

export const workOrderStatusTenantIdSchema = tenantIdSchema;

export const createWorkOrderStatusSchema = z.object({
  name: workOrderStatusNameSchema,
  code: workOrderStatusCodeSchema,
  color: workOrderStatusColorSchema,
  category: workOrderStatusCategorySchema,
  description: workOrderStatusDescriptionSchema,
});

export const updateWorkOrderStatusSchema = createWorkOrderStatusSchema;

export type WorkOrderStatusCategory = (typeof WORK_ORDER_STATUS_CATEGORIES)[number];
export type WorkOrderStatusIdInput = z.infer<typeof workOrderStatusIdSchema>;
export type WorkOrderStatusTenantIdInput = z.infer<typeof workOrderStatusTenantIdSchema>;
export type CreateWorkOrderStatusInput = z.infer<typeof createWorkOrderStatusSchema>;
export type UpdateWorkOrderStatusInput = z.infer<typeof updateWorkOrderStatusSchema>;
export type CreateWorkOrderStatusData = CreateWorkOrderStatusInput & { tenantId: string };
export type UpdateWorkOrderStatusData = UpdateWorkOrderStatusInput & { tenantId: string };

export type WorkOrderStatus = {
  name: string;
  code: string;
  color: string;
  id: number;
  createdOn: Date;
  modifiedOn: Date;
  isSystem: boolean;
  tenantId: string;
  description: string | null;
  category: WorkOrderStatusCategory;
};

export type WorkOrderStatusListParams = {
  query?: string;
  page?: number;
  limit?: number;
  tenantId: string;
};
