import { z } from 'zod';
import {
  nullableToOptionalSimpleMasterDescriptionSchema,
  simpleMasterCodeSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const wardNameSchema = simpleMasterNameSchema({
  max: 100,
  fieldName: 'Ward name',
  maxMessage: 'Ward name must be at most 100 characters',
  emptyMessage: 'Ward name cannot be empty',
  requiredMessage: 'Ward name is required',
});

const wardCodeSchema = simpleMasterCodeSchema({
  max: 10,
  fieldName: 'Ward code',
  maxMessage: 'Ward code must be at most 10 characters',
  emptyMessage: 'Ward code cannot be empty',
  requiredMessage: 'Ward code is required',
});

const wardDescriptionSchema = nullableToOptionalSimpleMasterDescriptionSchema({
  maxMessage: 'Ward description must be at most 500 characters',
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
