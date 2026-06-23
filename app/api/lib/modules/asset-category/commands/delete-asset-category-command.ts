import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { assetCategoryRepository } from '../repository/asset-category-repository';
import type { AssetCategory } from '../schemas/asset-category-schema';
import { validateDeleteAssetCategory } from '../validator/delete-asset-category-validator';

export async function deleteAssetCategoryCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<AssetCategory>> {
  const validationResult = validateDeleteAssetCategory(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedAssetCategory = await assetCategoryRepository.softDeleteAssetCategory(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedAssetCategory) {
    return {
      success: false,
      errors: ['Asset category not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedAssetCategory };
}
