import { z } from 'zod';

import type { WorkOrderStatusCategory } from '../../work-order-status/schemas/work-order-status-schema';

const requiredIdSchema = (fieldName: string) =>
  z.coerce
    .number({ error: `Work order ${fieldName} is required` })
    .int(`Work order ${fieldName} must be an integer`)
    .positive(`Work order ${fieldName} must be positive`);

const optionalTrimmedString = (schema: z.ZodString) =>
  z.preprocess((value) => {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }, schema.optional());

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

const optionalDateSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z
    .string({ error: 'Work order due date must be a valid ISO date' })
    .refine(isValidDateOnly, 'Work order due date must be a valid ISO date')
    .optional()
);

export const createWorkOrderSchema = z.object({
  assetId: requiredIdSchema('asset ID'),
  typeId: requiredIdSchema('type ID'),
  priorityId: requiredIdSchema('priority ID'),
  statusId: requiredIdSchema('status ID'),
  technician: optionalTrimmedString(
    z.string().max(150, 'Work order technician must be at most 150 characters')
  ),
  dueDate: optionalDateSchema,
  note: optionalTrimmedString(z.string()),
});

export const workOrderTenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type CreateWorkOrderData = CreateWorkOrderInput & { tenantId: string };

export type WorkOrderMasterSummary = {
  id: number;
  name: string;
  color: string;
};

export type WorkOrderStatusSummary = WorkOrderMasterSummary & {
  category: WorkOrderStatusCategory;
};

export type WorkOrderAssetSummary = {
  id: number;
  name: string;
  model: string | null;
  serialNumber: string;
};

export type WorkOrder = {
  id: number;
  code: string;
  note: string | null;
  type: WorkOrderMasterSummary;
  asset: WorkOrderAssetSummary;
  typeId: number;
  status: WorkOrderStatusSummary;
  assetId: number;
  dueDate: string | null;
  tenantId: string;
  statusId: number;
  priority: WorkOrderMasterSummary;
  createdOn: Date;
  priorityId: number;
  technician: string | null;
  modifiedOn: Date;
  completedOn: Date | null;
};

export type WorkOrderListParams = {
  page?: number;
  query?: string;
  limit?: number;
  typeId?: number;
  assetId?: number;
  tenantId: string;
  statusId?: number;
  priorityId?: number;
};
