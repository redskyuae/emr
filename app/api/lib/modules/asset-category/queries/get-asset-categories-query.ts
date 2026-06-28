import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { assetCategoryRepository } from '../repository/asset-category-repository';
import type { AssetCategory } from '../schemas/asset-category-schema';
import { validateGetAssetCategories } from '../validator/get-asset-categories-validator';

export type GetAssetCategoriesParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
};

export async function getAssetCategoriesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetAssetCategoriesParams): Promise<ListQueryResult<AssetCategory>> {
  const tenantIdValidationResult = validateGetAssetCategories(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await assetCategoryRepository.getAssetCategories({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
