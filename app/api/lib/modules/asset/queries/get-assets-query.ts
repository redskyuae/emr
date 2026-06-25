import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { assetRepository } from '../repository/asset-repository';
import type { Asset } from '../schemas/asset-schema';
import { validateGetAssets } from '../validator/get-assets-validator';

export type GetAssetsParams = {
  tenantId: unknown;
  page?: number;
  limit?: number;
  query?: string;
  categoryId?: number;
  statusId?: number;
};

export async function getAssetsQuery({
  tenantId,
  page,
  limit,
  query,
  categoryId,
  statusId,
}: GetAssetsParams): Promise<ListQueryResult<Asset>> {
  const tenantIdValidationResult = validateGetAssets(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await assetRepository.getAssets({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
    categoryId,
    statusId,
  });

  return { success: true, data, total };
}
