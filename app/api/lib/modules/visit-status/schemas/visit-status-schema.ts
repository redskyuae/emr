import { z } from 'zod';

export const VISIT_STATUS_CATEGORIES = [
  'WAITING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const visitStatusNameSchema = z
  .string({ error: 'Visit status name is required' })
  .trim()
  .min(1, 'Visit status name cannot be empty')
  .max(100, 'Visit status name must be at most 100 characters');

const visitStatusCodeSchema = z
  .string({ error: 'Visit status code is required' })
  .trim()
  .min(1, 'Visit status code cannot be empty')
  .max(10, 'Visit status code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

const visitStatusCategorySchema = z.enum(VISIT_STATUS_CATEGORIES, {
  error: 'Visit status category must be one of WAITING, IN_PROGRESS, COMPLETED, or CANCELLED.',
});

const visitStatusColorSchema = z
  .string({ error: 'Visit status color is required' })
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Visit status color must be a hex value like #16A34A.');

const visitStatusDescriptionSchema = z
  .string()
  .trim()
  .optional()
  .transform((description) => (description === '' ? undefined : description));

export const visitStatusIdSchema = z.coerce
  .number({ error: 'Visit status ID is required' })
  .int('Visit status ID must be an integer')
  .positive('Visit status ID must be positive');

export const visitStatusTenantIdSchema = tenantIdSchema;

export const createVisitStatusSchema = z.object({
  name: visitStatusNameSchema,
  code: visitStatusCodeSchema,
  color: visitStatusColorSchema,
  category: visitStatusCategorySchema,
  description: visitStatusDescriptionSchema,
});

export const updateVisitStatusSchema = createVisitStatusSchema;

export type VisitStatusCategory = (typeof VISIT_STATUS_CATEGORIES)[number];
export type VisitStatusIdInput = z.infer<typeof visitStatusIdSchema>;
export type VisitStatusTenantIdInput = z.infer<typeof visitStatusTenantIdSchema>;
export type CreateVisitStatusInput = z.infer<typeof createVisitStatusSchema>;
export type UpdateVisitStatusInput = z.infer<typeof updateVisitStatusSchema>;
export type CreateVisitStatusData = CreateVisitStatusInput & { tenantId: string };
export type UpdateVisitStatusData = UpdateVisitStatusInput & { tenantId: string };

export type VisitStatus = {
  name: string;
  code: string;
  color: string;
  id: number;
  createdOn: Date;
  modifiedOn: Date;
  isSystem: boolean;
  tenantId: string;
  description: string | null;
  category: VisitStatusCategory;
};

export type VisitStatusListParams = {
  query?: string;
  page?: number;
  limit?: number;
  tenantId: string;
};
