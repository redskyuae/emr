import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const optionalTrimmedString = (schema: z.ZodString) =>
  z.preprocess((value) => {
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

const optionalDateSchema = (fieldName: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== 'string') {
        return value;
      }

      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    },
    z
      .string({ error: `Asset ${fieldName} must be a valid ISO date` })
      .trim()
      .refine(isValidDateOnly, `Asset ${fieldName} must be a valid ISO date`)
      .optional()
  );

const requiredMasterIdSchema = (fieldName: string) =>
  z.coerce
    .number({ error: `Asset ${fieldName} is required` })
    .int(`Asset ${fieldName} must be an integer`)
    .positive(`Asset ${fieldName} must be positive`);

const optionalMasterIdSchema = (fieldName: string) =>
  z.preprocess((value) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    return value;
  }, requiredMasterIdSchema(fieldName).optional());

const optionalMoneySchema = (fieldName: string) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === '') {
        return undefined;
      }

      return value;
    },
    z
      .number({ error: `Asset ${fieldName} must be a number` })
      .nonnegative(`Asset ${fieldName} must be non-negative`)
      .optional()
  );

const assetNameSchema = z
  .string({ error: 'Asset name is required' })
  .trim()
  .min(1, 'Asset name cannot be empty')
  .max(150, 'Asset name must be at most 150 characters');

const assetSerialNumberSchema = z
  .string({ error: 'Asset serial number is required' })
  .trim()
  .min(1, 'Asset serial number cannot be empty')
  .max(100, 'Asset serial number must be at most 100 characters');

export const assetIdSchema = z.coerce
  .number({ error: 'Asset ID is required' })
  .int('Asset ID must be an integer')
  .positive('Asset ID must be positive');

export const assetTenantIdSchema = tenantIdSchema;

export const assetPayloadSchema = z.object({
  name: assetNameSchema,
  categoryId: requiredMasterIdSchema('category ID'),
  statusId: requiredMasterIdSchema('status ID'),
  conditionId: optionalMasterIdSchema('condition ID'),
  manufacturer: optionalTrimmedString(
    z.string().trim().max(150, 'Asset manufacturer must be at most 150 characters')
  ),
  model: optionalTrimmedString(
    z.string().trim().max(150, 'Asset model must be at most 150 characters')
  ),
  serialNumber: assetSerialNumberSchema,
  facility: optionalTrimmedString(
    z.string().trim().max(150, 'Asset facility must be at most 150 characters')
  ),
  department: optionalTrimmedString(
    z.string().trim().max(150, 'Asset department must be at most 150 characters')
  ),
  location: optionalTrimmedString(
    z.string().trim().max(200, 'Asset location must be at most 200 characters')
  ),
  custodian: optionalTrimmedString(
    z.string().trim().max(150, 'Asset custodian must be at most 150 characters')
  ),
  purchaseDate: optionalDateSchema('purchaseDate'),
  warrantyExpiry: optionalDateSchema('warrantyExpiry'),
  cost: optionalMoneySchema('cost'),
  currentValue: optionalMoneySchema('currentValue'),
  lastServiceDate: optionalDateSchema('lastServiceDate'),
  nextServiceDate: optionalDateSchema('nextServiceDate'),
  calibrationDate: optionalDateSchema('calibrationDate'),
});

export const createAssetSchema = assetPayloadSchema;
export const updateAssetSchema = assetPayloadSchema;

export type AssetIdInput = z.infer<typeof assetIdSchema>;
export type AssetTenantIdInput = z.infer<typeof assetTenantIdSchema>;
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type CreateAssetData = CreateAssetInput & { tenantId: string };
export type UpdateAssetData = UpdateAssetInput & { tenantId: string };

export type AssetMasterSummary = {
  id: number;
  name: string;
  color: string;
};

export type Asset = {
  id: number;
  createdOn: Date;
  name: string;
  cost: number | null;
  tenantId: string;
  model: string | null;
  statusId: number;
  categoryId: number;
  facility: string | null;
  location: string | null;
  modifiedOn: Date;
  custodian: string | null;
  conditionId: number | null;
  department: string | null;
  manufacturer: string | null;
  serialNumber: string;
  currentValue: number | null;
  purchaseDate: string | null;
  category: AssetMasterSummary;
  status: AssetMasterSummary;
  warrantyExpiry: string | null;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
  condition: AssetMasterSummary | null;
  calibrationDate: string | null;
};

export type AssetListParams = {
  page?: number;
  query?: string;
  limit?: number;
  statusId?: number;
  tenantId: string;
  categoryId?: number;
};
