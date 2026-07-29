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

const assetConditionNameSchema = simpleMasterNameSchema({
  max: 100,
  fieldName: 'Asset condition name',
  maxMessage: 'Asset condition name must be at most 100 characters',
  emptyMessage: 'Asset condition name cannot be empty',
  requiredMessage: 'Asset condition name is required',
});

const assetConditionCodeSchema = simpleMasterCodeSchema({
  max: 10,
  fieldName: 'Asset condition code',
  maxMessage: 'Asset condition code must be at most 10 characters',
  emptyMessage: 'Asset condition code cannot be empty',
  requiredMessage: 'Asset condition code is required',
});

const assetConditionColorSchema = z
  .string({ error: 'Asset condition color is required' })
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Asset condition color must be a hex value like #16A34A.');

const assetConditionDescriptionSchema = simpleMasterDescriptionSchema({
  maxMessage: 'Asset condition description must be at most 500 characters',
});

export const assetConditionIdSchema = z.coerce
  .number({ error: 'Asset condition ID is required' })
  .int('Asset condition ID must be an integer')
  .positive('Asset condition ID must be positive');

export const assetConditionTenantIdSchema = tenantIdSchema;

export const createAssetConditionSchema = z.object({
  name: assetConditionNameSchema,
  code: assetConditionCodeSchema,
  color: assetConditionColorSchema,
  description: assetConditionDescriptionSchema,
});

export const updateAssetConditionSchema = createAssetConditionSchema;

export type AssetConditionIdInput = z.infer<typeof assetConditionIdSchema>;
export type AssetConditionTenantIdInput = z.infer<typeof assetConditionTenantIdSchema>;
export type CreateAssetConditionInput = z.infer<typeof createAssetConditionSchema>;
export type UpdateAssetConditionInput = z.infer<typeof updateAssetConditionSchema>;
export type CreateAssetConditionData = CreateAssetConditionInput & { tenantId: string };
export type UpdateAssetConditionData = UpdateAssetConditionInput & { tenantId: string };

export type AssetCondition = {
  id: number;
  name: string;
  code: string;
  color: string;
  createdOn: Date;
  tenantId: string;
  modifiedOn: Date;
  description: string | null;
};

export type AssetConditionListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
