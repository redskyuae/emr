import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const assetCategoryNameSchema = z
  .string({ error: 'Asset category name is required' })
  .trim()
  .min(1, 'Asset category name cannot be empty')
  .max(100, 'Asset category name must be at most 100 characters');

const assetCategoryCodeSchema = z
  .string({ error: 'Asset category code is required' })
  .trim()
  .min(1, 'Asset category code cannot be empty')
  .max(10, 'Asset category code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

const assetCategoryColorSchema = z
  .string({ error: 'Asset category color is required' })
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Asset category color must be a hex value like #2563EB.');

const assetCategoryDescriptionSchema = z
  .string()
  .trim()
  .optional()
  .transform((description) => (description === '' ? undefined : description));

export const assetCategoryIdSchema = z.coerce
  .number({ error: 'Asset category ID is required' })
  .int('Asset category ID must be an integer')
  .positive('Asset category ID must be positive');

export const assetCategoryTenantIdSchema = tenantIdSchema;

export const createAssetCategorySchema = z.object({
  name: assetCategoryNameSchema,
  code: assetCategoryCodeSchema,
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
  tenantId: string;
  name: string;
  code: string;
  color: string;
  description: string | null;
  createdOn: Date;
  modifiedOn: Date;
};

export type AssetCategoryListParams = {
  tenantId: string;
  query?: string;
  page?: number;
  limit?: number;
};
