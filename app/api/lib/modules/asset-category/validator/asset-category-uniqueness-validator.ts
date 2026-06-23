import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { assetCategoryRepository } from '../repository/asset-category-repository';
const ASSET_CATEGORY_NAME_EXISTS = "Asset category name '{value}' already exists.";
const ASSET_CATEGORY_CODE_EXISTS = "Asset category code '{value}' already exists.";

type AssetCategoryUniquenessInput = {
  tenantId: string;
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateAssetCategoryUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: AssetCategoryUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    assetCategoryRepository.findActiveByName(tenantId, name, { excludeId }),
    assetCategoryRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(ASSET_CATEGORY_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(ASSET_CATEGORY_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getAssetCategoryUniqueConstraintErrors(
  error: unknown,
  input: Pick<AssetCategoryUniquenessInput, 'name' | 'code'>
): string[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return [];
  }

  if (err.constraint === 'asset_category_tenant_name_idx') {
    return [duplicateError(ASSET_CATEGORY_NAME_EXISTS, input.name)];
  }

  if (err.constraint === 'asset_category_tenant_code_idx') {
    return [duplicateError(ASSET_CATEGORY_CODE_EXISTS, input.code)];
  }

  return [];
}
