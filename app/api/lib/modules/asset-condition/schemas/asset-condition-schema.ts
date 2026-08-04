import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const assetConditionNameSchema = z
  .string({ error: 'Asset condition name is required' })
  .trim()
  .min(1, 'Asset condition name cannot be empty')
  .max(100, 'Asset condition name must be at most 100 characters')
  .regex(
    /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
    'Asset condition name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
  );

const assetConditionCodeSchema = z
  .string({ error: 'Asset condition code is required' })
  .trim()
  .min(1, 'Asset condition code cannot be empty')
  .max(10, 'Asset condition code must be at most 10 characters')
  .regex(
    /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
    'Asset condition code must contain only letters, numbers, hyphens, and underscores.'
  )
  .transform((code) => code.toUpperCase());

const assetConditionColorSchema = z
  .string({ error: 'Asset condition color is required' })
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Asset condition color must be a hex value like #16A34A.');

const assetConditionDescriptionSchema = z
  .string()
  .trim()
  .max(500, 'Asset condition description must be at most 500 characters')
  .transform((description) => (description === '' ? undefined : description))
  .optional();

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
