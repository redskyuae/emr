import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const assetConditionNameSchema = z
  .string({ error: 'Asset condition name is required' })
  .trim()
  .min(1, 'Asset condition name cannot be empty')
  .max(100, 'Asset condition name must be at most 100 characters');

const assetConditionCodeSchema = z
  .string({ error: 'Asset condition code is required' })
  .trim()
  .min(1, 'Asset condition code cannot be empty')
  .max(10, 'Asset condition code must be at most 10 characters')
  .transform((code) => code.toUpperCase());

const assetConditionColorSchema = z
  .string({ error: 'Asset condition color is required' })
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Asset condition color must be a hex value like #16A34A.');

const assetConditionDescriptionSchema = z
  .string()
  .trim()
  .optional()
  .transform((description) => (description === '' ? undefined : description));

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
  tenantId: string;
  name: string;
  code: string;
  color: string;
  description: string | null;
  createdOn: Date;
  modifiedOn: Date;
};

export type AssetConditionListParams = {
  tenantId: string;
  query?: string;
  page?: number;
  limit?: number;
};
