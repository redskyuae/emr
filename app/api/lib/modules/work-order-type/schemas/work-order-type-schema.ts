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

const workOrderTypeNameSchema = simpleMasterNameSchema({
  max: 100,
  fieldName: 'Work order type name',
  maxMessage: 'Work order type name must be at most 100 characters',
  emptyMessage: 'Work order type name cannot be empty',
  requiredMessage: 'Work order type name is required',
});

const workOrderTypeCodeSchema = simpleMasterCodeSchema({
  max: 10,
  fieldName: 'Work order type code',
  maxMessage: 'Work order type code must be at most 10 characters',
  emptyMessage: 'Work order type code cannot be empty',
  requiredMessage: 'Work order type code is required',
});

const workOrderTypeColorSchema = z
  .string({ error: 'Work order type color is required' })
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Work order type color must be a hex value like #16A34A.');

const workOrderTypeDescriptionSchema = simpleMasterDescriptionSchema({
  maxMessage: 'Work order type description must be at most 500 characters',
});

export const workOrderTypeIdSchema = z.coerce
  .number({ error: 'Work order type ID is required' })
  .int('Work order type ID must be an integer')
  .positive('Work order type ID must be positive');

export const workOrderTypeTenantIdSchema = tenantIdSchema;

export const createWorkOrderTypeSchema = z.object({
  name: workOrderTypeNameSchema,
  code: workOrderTypeCodeSchema,
  color: workOrderTypeColorSchema,
  description: workOrderTypeDescriptionSchema,
});

export const updateWorkOrderTypeSchema = createWorkOrderTypeSchema;

export type WorkOrderTypeIdInput = z.infer<typeof workOrderTypeIdSchema>;
export type WorkOrderTypeTenantIdInput = z.infer<typeof workOrderTypeTenantIdSchema>;
export type CreateWorkOrderTypeInput = z.infer<typeof createWorkOrderTypeSchema>;
export type UpdateWorkOrderTypeInput = z.infer<typeof updateWorkOrderTypeSchema>;
export type CreateWorkOrderTypeData = CreateWorkOrderTypeInput & { tenantId: string };
export type UpdateWorkOrderTypeData = UpdateWorkOrderTypeInput & { tenantId: string };

export type WorkOrderType = {
  id: number;
  name: string;
  code: string;
  color: string;
  createdOn: Date;
  tenantId: string;
  modifiedOn: Date;
  description: string | null;
};

export type WorkOrderTypeListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
