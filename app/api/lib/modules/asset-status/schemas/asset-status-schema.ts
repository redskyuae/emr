import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const assetStatusNameSchema = z
  .string({ error: 'Asset status name is required' })
  .trim()
  .min(1, 'Asset status name cannot be empty')
  .max(100, 'Asset status name must be at most 100 characters')
  .regex(
    /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
    'Asset status name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
  );

const assetStatusCodeSchema = z
  .string({ error: 'Asset status code is required' })
  .trim()
  .min(1, 'Asset status code cannot be empty')
  .max(10, 'Asset status code must be at most 10 characters')
  .regex(
    /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
    'Asset status code must contain only letters, numbers, hyphens, and underscores.'
  )
  .transform((code) => code.toUpperCase());

const assetStatusColorSchema = z
  .string({ error: 'Asset status color is required' })
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Asset status color must be a hex value like #16A34A.');

const assetStatusDescriptionSchema = z
  .string()
  .trim()
  .max(500, 'Asset status description must be at most 500 characters')
  .transform((description) => (description === '' ? undefined : description))
  .optional();

export const assetStatusIdSchema = z.coerce
  .number({ error: 'Asset status ID is required' })
  .int('Asset status ID must be an integer')
  .positive('Asset status ID must be positive');

export const assetStatusTenantIdSchema = tenantIdSchema;

export const createAssetStatusSchema = z.object({
  name: assetStatusNameSchema,
  code: assetStatusCodeSchema,
  color: assetStatusColorSchema,
  description: assetStatusDescriptionSchema,
});

export const updateAssetStatusSchema = createAssetStatusSchema;

export type AssetStatusIdInput = z.infer<typeof assetStatusIdSchema>;
export type AssetStatusTenantIdInput = z.infer<typeof assetStatusTenantIdSchema>;
export type CreateAssetStatusInput = z.infer<typeof createAssetStatusSchema>;
export type UpdateAssetStatusInput = z.infer<typeof updateAssetStatusSchema>;
export type CreateAssetStatusData = CreateAssetStatusInput & { tenantId: string };
export type UpdateAssetStatusData = UpdateAssetStatusInput & { tenantId: string };

export type AssetStatus = {
  id: number;
  name: string;
  code: string;
  color: string;
  createdOn: Date;
  tenantId: string;
  modifiedOn: Date;
  description: string | null;
};

export type AssetStatusListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
