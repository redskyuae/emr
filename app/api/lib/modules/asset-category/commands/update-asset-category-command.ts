import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { assetCategoryRepository } from '../repository/asset-category-repository';
import type { AssetCategory } from '../schemas/asset-category-schema';
import { getAssetCategoryUniqueConstraintErrors } from '../validator/asset-category-uniqueness-validator';
import { validateUpdateAssetCategory } from '../validator/update-asset-category-validator';

export async function updateAssetCategoryCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<AssetCategory>> {
  const validationResult = await validateUpdateAssetCategory(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;
  const assetCategoryData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedAssetCategory = await assetCategoryRepository.updateAssetCategory(
      validatedId,
      assetCategoryData
    );

    if (!updatedAssetCategory) {
      return {
        success: false,
        errors: ['Asset category not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedAssetCategory };
  } catch (error) {
    const constraintErrors = getAssetCategoryUniqueConstraintErrors(error, assetCategoryData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
