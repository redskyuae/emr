import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { assetCategoryRepository } from '../repository/asset-category-repository';
import type { AssetCategory } from '../schemas/asset-category-schema';
import { validateGetAssetCategoryById } from '../validator/get-asset-category-by-id-validator';

export async function getAssetCategoryByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<AssetCategory>> {
  const validationResult = validateGetAssetCategoryById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const assetCategory = await assetCategoryRepository.getAssetCategoryById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!assetCategory) {
    return {
      success: false,
      errors: ['Asset category not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: assetCategory };
}
