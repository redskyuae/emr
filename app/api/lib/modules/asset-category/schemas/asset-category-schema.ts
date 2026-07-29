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

const assetCategoryNameSchema = simpleMasterNameSchema({
  max: 100,
  fieldName: 'Asset category name',
  maxMessage: 'Asset category name must be at most 100 characters',
  emptyMessage: 'Asset category name cannot be empty',
  requiredMessage: 'Asset category name is required',
});

const assetCategoryCodeSchema = simpleMasterCodeSchema({
  max: 10,
  fieldName: 'Asset category code',
  maxMessage: 'Asset category code must be at most 10 characters',
  emptyMessage: 'Asset category code cannot be empty',
  requiredMessage: 'Asset category code is required',
});

const assetCategoryColorSchema = z
  .string({ error: 'Asset category color is required' })
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Asset category color must be a hex value like #2563EB.');

const assetCategoryDescriptionSchema = simpleMasterDescriptionSchema({
  maxMessage: 'Asset category description must be at most 500 characters',
});

export const assetCategoryIdSchema = z.coerce
  .number({ error: 'Asset category ID is required' })
  .int('Asset category ID must be an integer')
  .positive('Asset category ID must be positive');

export const assetCategoryTenantIdSchema = tenantIdSchema;

export const createAssetCategorySchema = z.object({
  code: assetCategoryCodeSchema,
  name: assetCategoryNameSchema,
  color: assetCategoryColorSchema,
  description: assetCategoryDescriptionSchema,
});

export const updateAssetCategorySchema = createAssetCategorySchema;

export type AssetCategoryIdInput = z.infer<typeof assetCategoryIdSchema>;
export type AssetCategoryTenantIdInput = z.infer<typeof assetCategoryTenantIdSchema>;
export type CreateAssetCategoryInput = z.infer<typeof createAssetCategorySchema>;
export type UpdateAssetCategoryInput = z.infer<typeof updateAssetCategorySchema>;
export type CreateAssetCategoryData = CreateAssetCategoryInput & { tenantId: string };
export type UpdateAssetCategoryData = UpdateAssetCategoryInput & { tenantId: string };

export type AssetCategory = {
  id: number;
  name: string;
  code: string;
  color: string;
  createdOn: Date;
  tenantId: string;
  modifiedOn: Date;
  description: string | null;
};

export type AssetCategoryListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
