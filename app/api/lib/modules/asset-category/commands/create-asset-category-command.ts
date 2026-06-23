import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { assetCategoryRepository } from '../repository/asset-category-repository';
import type { AssetCategory } from '../schemas/asset-category-schema';
import { getAssetCategoryUniqueConstraintErrors } from '../validator/asset-category-uniqueness-validator';
import { validateCreateAssetCategory } from '../validator/create-asset-category-validator';

export async function createAssetCategoryCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<AssetCategory>> {
  const validationResult = await validateCreateAssetCategory(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const assetCategoryData = { ...validationResult.data, tenantId };

  try {
    const createdAssetCategory =
      await assetCategoryRepository.createAssetCategory(assetCategoryData);
    return { success: true, data: createdAssetCategory };
  } catch (error) {
    const constraintErrors = getAssetCategoryUniqueConstraintErrors(error, assetCategoryData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
